import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ConversationContext } from "@/lib/speech/smartSTTRouter";
import { getTokenOrRefresh } from "@/lib/speech/auth";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

interface EnhancedSTTRequest {
  targetLanguage: string;
  nativeLanguage: string;
  lessonLevel: string;
  allowNativeLanguage?: boolean;
  preferredProvider?: "elevenlabs" | "azure" | "auto";
}

// ElevenLabs STT implementation
async function transcribeWithElevenLabsAPI(
  audioBlob: Blob,
  context: ConversationContext
): Promise<{
  text: string;
  detectedLanguage: string;
  confidence: number;
  languageConfidence: number;
  provider: string;
}> {
  console.log("🎤 ElevenLabs STT: Starting transcription...");

  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key not configured");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model_id", process.env.STT_MODEL || "scribe_v1");

  console.log(
    "🎤 ElevenLabs STT: Sending request with file and model_id=" +
      (process.env.STT_MODEL || "scribe_v1")
  );

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("🎤 ElevenLabs STT: API Error:", response.status, errorText);
    throw new Error(`ElevenLabs STT failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log("🎤 ElevenLabs STT: Raw API response:", result);

  // ElevenLabs scribe_v1 model returns different structure
  const transcript = result.text || result.transcript || "";
  const detectedLang =
    result.detected_language || result.language || context.targetLanguage;

  console.log("🎤 ElevenLabs STT: Processed:", { transcript, detectedLang });

  return {
    text: transcript,
    detectedLanguage: detectedLang,
    confidence: result.confidence || 0.9,
    languageConfidence: result.language_confidence || 0.9,
    provider: "elevenlabs",
  };
}

// Gemini direct audio transcription implementation (simple STT only)
async function transcribeWithGeminiAPI(
  audioBlob: Blob,
  context: ConversationContext
): Promise<{
  text: string;
  detectedLanguage: string;
  confidence: number;
  languageConfidence: number;
  provider: string;
}> {
  console.log("🟡 Gemini STT: Starting direct audio transcription...");

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  try {
    // Convert audio blob to base64
    console.log("🟡 Gemini STT: Converting audio to base64...");
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    console.log(
      "🟡 Gemini STT: Base64 conversion complete, length:",
      base64Audio.length
    );

    // Prepare the request payload for Gemini
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Please transcribe this audio file. The expected language is ${context.targetLanguage}. Return only the transcribed text without any additional formatting or explanation.`,
            },
            {
              inline_data: {
                mime_type: audioBlob.type || "audio/webm",
                data: base64Audio,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    };

    console.log("🟡 Gemini STT: Sending request to Gemini 2.0 Flash API...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🟡 Gemini STT: API Error:", response.status, errorText);
      throw new Error(`Gemini API failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("🟡 Gemini STT: Raw API response:", result);

    // Extract text from Gemini response
    const transcript =
      result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log("🟡 Gemini STT: Extracted transcript:", transcript);

    if (!transcript) {
      throw new Error("No transcript found in Gemini response");
    }

    return {
      text: transcript,
      detectedLanguage: context.targetLanguage, // Gemini doesn't provide language detection
      confidence: 0.85, // Estimated confidence for Gemini
      languageConfidence: 0.9,
      provider: "gemini",
    };
  } catch (error) {
    console.error("🟡 Gemini STT: Error during transcription:", error);
    throw error;
  }
}

// NOTE: This STT-only approach works but is less efficient than the full multimodal solution
// For maximum efficiency, use /api/chat/voice-message which combines transcription + conversation
// in a single Gemini request, reducing token usage by ~50-70%

// Use Azure's audio stream input for WebM compatibility
async function createAzureAudioConfig(audioBlob: Blob) {
  console.log(
    "🔵 Azure Audio Config: Creating audio stream from blob, size:",
    audioBlob.size,
    "type:",
    audioBlob.type
  );

  const arrayBuffer = await audioBlob.arrayBuffer();
  console.log(
    "🔵 Azure Audio Config: Converted to ArrayBuffer, size:",
    arrayBuffer.byteLength
  );

  const audioStream = SpeechSDK.AudioInputStream.createPushStream();
  console.log("🔵 Azure Audio Config: Created push stream");

  audioStream.write(arrayBuffer);
  console.log("🔵 Azure Audio Config: Written audio data to stream");

  audioStream.close();
  console.log("🔵 Azure Audio Config: Closed audio stream");

  const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(audioStream);
  console.log("🔵 Azure Audio Config: Created AudioConfig from stream");

  return audioConfig;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data to get audio file and options
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const optionsStr = formData.get("options") as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    let options: EnhancedSTTRequest;
    try {
      options = JSON.parse(optionsStr || "{}");
    } catch {
      return NextResponse.json(
        { error: "Invalid options format" },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Build conversation context
    const context: ConversationContext = {
      targetLanguage: options.targetLanguage || "en",
      nativeLanguage: options.nativeLanguage || "en",
      lessonLevel: options.lessonLevel || "A1",
      allowNativeLanguage: options.allowNativeLanguage ?? true,
    };

    try {
      // Server-side smart STT with fallbacks
      let result;
      const attempts: Array<{
        provider: string;
        success: boolean;
        error?: string;
      }> = [];
      let lastError: Error | null = null;

      // Strategy 1: Try ElevenLabs STT first (primary)
      if (options.preferredProvider !== "azure") {
        try {
          console.log("Attempting ElevenLabs STT...");
          const elevenLabsResult = await transcribeWithElevenLabsAPI(
            audioBlob,
            context
          );
          attempts.push({ provider: "elevenlabs", success: true });

          result = {
            result: elevenLabsResult,
            languageSwitch: {
              switched:
                elevenLabsResult.detectedLanguage !== context.targetLanguage,
              fromLanguage: context.targetLanguage,
              toLanguage: elevenLabsResult.detectedLanguage,
              confidence: elevenLabsResult.languageConfidence,
            },
            attempts,
          };
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          attempts.push({
            provider: "elevenlabs",
            success: false,
            error: errorMsg,
          });
          lastError = error instanceof Error ? error : new Error(errorMsg);
          console.error("❌ ElevenLabs STT failed:", errorMsg);
        }
      }

      // Strategy 2: Try Azure Speech SDK as fallback
      if (!result) {
        try {
          console.log("🔵 === AZURE STT FALLBACK INITIATED ===");
          console.log(
            "🔵 Azure STT: Audio blob info - size:",
            audioBlob.size,
            "type:",
            audioBlob.type
          );
          console.log("🔵 Azure STT: Target language:", context.targetLanguage);

          console.log("🔵 Azure STT: Step 1 - Getting authentication token...");
          const { authToken, region } = await getTokenOrRefresh(request);
          console.log("🔵 Azure STT: Token obtained successfully");
          console.log("🔵 Azure STT: Region:", region);
          console.log("🔵 Azure STT: Token length:", authToken.length);

          console.log(
            "🔵 Azure STT: Step 2 - Creating speech configuration..."
          );
          const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
            authToken,
            region
          );
          speechConfig.speechRecognitionLanguage = context.targetLanguage;
          console.log(
            "🔵 Azure STT: Speech config created with language:",
            context.targetLanguage
          );

          console.log("🔵 Azure STT: Step 3 - Creating audio configuration...");
          const audioConfig = await createAzureAudioConfig(audioBlob);
          console.log("🔵 Azure STT: Audio config created successfully");

          console.log("🔵 Azure STT: Step 4 - Creating speech recognizer...");
          const recognizer = new SpeechSDK.SpeechRecognizer(
            speechConfig,
            audioConfig
          );
          console.log("🔵 Azure STT: Speech recognizer created");

          console.log("🔵 Azure STT: Step 5 - Starting recognition process...");
          const recognitionStartTime = Date.now();

          const azureResult = await new Promise<{
            text: string;
            detectedLanguage: string;
            confidence: number;
            languageConfidence: number;
            provider: string;
          }>((resolve, reject) => {
            console.log("🔵 Azure STT: Recognition promise started");

            recognizer.recognizeOnceAsync(
              (result) => {
                const recognitionDuration = Date.now() - recognitionStartTime;
                console.log(
                  "🔵 Azure STT: Recognition completed in",
                  recognitionDuration,
                  "ms"
                );
                console.log("🔵 Azure STT: Result reason:", result.reason);
                console.log("🔵 Azure STT: Result text:", result.text);
                console.log("🔵 Azure STT: Result duration:", result.duration);
                console.log("🔵 Azure STT: Result offset:", result.offset);

                if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                  console.log("✅ Azure STT: Speech successfully recognized!");
                  const azureResponse = {
                    text: result.text,
                    detectedLanguage: context.targetLanguage,
                    confidence: 0.8,
                    languageConfidence: 0.9,
                    provider: "azure",
                  };
                  console.log("🔵 Azure STT: Returning result:", azureResponse);
                  resolve(azureResponse);
                } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
                  console.error("🔵 Azure STT: No speech could be recognized");
                  reject(new Error("Azure STT: No speech could be recognized"));
                } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
                  console.error("🔵 Azure STT: Recognition was cancelled");
                  const cancellation =
                    SpeechSDK.CancellationDetails.fromResult(result);
                  console.error(
                    "🔵 Azure STT: Cancellation reason:",
                    cancellation.reason
                  );
                  if (
                    cancellation.reason === SpeechSDK.CancellationReason.Error
                  ) {
                    console.error(
                      "🔵 Azure STT: Error code:",
                      cancellation.ErrorCode
                    );
                    console.error(
                      "🔵 Azure STT: Error details:",
                      cancellation.errorDetails
                    );
                  }
                  reject(
                    new Error(
                      `Azure STT cancelled: ${cancellation.reason} - ${cancellation.errorDetails}`
                    )
                  );
                } else {
                  console.error(
                    "🔵 Azure STT: Unexpected result reason:",
                    result.reason
                  );
                  reject(
                    new Error(
                      `Azure recognition failed with reason: ${result.reason}`
                    )
                  );
                }

                console.log("🔵 Azure STT: Closing recognizer...");
                recognizer.close();
              },
              (error) => {
                const recognitionDuration = Date.now() - recognitionStartTime;
                console.error(
                  "🔵 Azure STT: Recognition error after",
                  recognitionDuration,
                  "ms"
                );
                console.error("🔵 Azure STT: Error details:", error);
                console.error("🔵 Azure STT: Error type:", typeof error);
                console.error("🔵 Azure STT: Error string:", String(error));

                console.log("🔵 Azure STT: Closing recognizer after error...");
                recognizer.close();
                reject(new Error(`Azure STT error: ${error}`));
              }
            );
          });

          console.log("✅ Azure STT: Recognition successful!");
          console.log("🔵 Azure STT: Final result:", azureResult);

          attempts.push({ provider: "azure", success: true });
          result = {
            result: azureResult,
            languageSwitch: {
              switched: azureResult.detectedLanguage !== context.targetLanguage,
              fromLanguage: context.targetLanguage,
              toLanguage: azureResult.detectedLanguage,
              confidence: azureResult.languageConfidence,
            },
            attempts,
          };

          console.log("🔵 Azure STT: Result object created:", result);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          attempts.push({ provider: "azure", success: false, error: errorMsg });
          lastError = error instanceof Error ? error : new Error(errorMsg);
          console.error("❌ Azure STT failed:", errorMsg);
        }
      }

      // Strategy 3: Try Gemini direct audio as final fallback (EFFICIENT APPROACH)
      if (!result) {
        try {
          console.log(
            "🟡 === GEMINI EFFICIENT MULTIMODAL FALLBACK INITIATED ==="
          );
          console.log(
            "🟡 Gemini Multimodal: Audio blob info - size:",
            audioBlob.size,
            "type:",
            audioBlob.type
          );
          console.log("✨ Using EFFICIENT single-request multimodal approach");

          // Use efficient STT-only for this endpoint (conversation handled separately)
          // NOTE: This is still the inefficient approach - only transcription
          const geminiResult = await transcribeWithGeminiAPI(
            audioBlob,
            context
          );
          attempts.push({ provider: "gemini-stt-only", success: true });

          result = {
            result: {
              ...geminiResult,
              provider: "gemini-stt-only", // Mark as STT-only (inefficient)
            },
            languageSwitch: {
              switched:
                geminiResult.detectedLanguage !== context.targetLanguage,
              fromLanguage: context.targetLanguage,
              toLanguage: geminiResult.detectedLanguage,
              confidence: geminiResult.languageConfidence,
            },
            attempts,
          };

          console.log(
            "✅ Gemini STT-Only: Transcription result:",
            geminiResult
          );
          console.log(
            "⚠️  WARNING: Still using inefficient two-request approach"
          );
          console.log(
            "💡 SOLUTION: Use /api/chat/voice-message for true single multimodal request"
          );
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          attempts.push({
            provider: "gemini-stt-only",
            success: false,
            error: errorMsg,
          });
          lastError = error instanceof Error ? error : new Error(errorMsg);
          console.error("❌ Gemini STT-only fallback failed:", errorMsg);
        }
      }

      if (!result) {
        console.error("❌ All STT providers failed:", attempts);
        throw lastError || new Error("All STT providers failed");
      }

      return NextResponse.json({
        success: true,
        transcript: result.result.text,
        detectedLanguage: result.result.detectedLanguage,
        confidence: result.result.confidence,
        languageConfidence: result.result.languageConfidence,
        provider: result.result.provider,
        languageSwitch: result.languageSwitch,
        attempts: result.attempts,
      });
    } catch (sttError) {
      console.error("Enhanced STT error:", sttError);
      return NextResponse.json(
        {
          error: "Speech transcription failed",
          details:
            sttError instanceof Error ? sttError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Enhanced STT endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
