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


  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key not configured");
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model_id", process.env.STT_MODEL || "scribe_v1");



  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`ElevenLabs STT failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();


  // ElevenLabs scribe_v1 model returns different structure
  const transcript = result.text || result.transcript || "";
  const detectedLang =
    result.detected_language || result.language || context.targetLanguage;



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
  console.log('🟡 [STT] Starting Gemini direct transcription...');

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  try {
    // Import the enhanced client
    const { geminiManager } = await import('@/lib/gemini/client');
    
    // Convert audio blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    // Generate content with enhanced error handling
    const config = {
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    };

    const params = [
      {
        text: `Please transcribe this audio file. The expected language is ${context.targetLanguage}. Return only the transcribed text without any additional formatting or explanation.`,
      },
      {
        inlineData: {
          mimeType: audioBlob.type || "audio/webm",
          data: base64Audio,
        },
      },
    ];

    const result = await geminiManager.generateContent(config, { contents: [{ role: 'user', parts: params }] }, 'stt_only_transcription');

    const response = await result.response;
    const transcript = response.text()?.trim() || "";

    if (!transcript) {
      throw new Error("No transcript found in Gemini response");
    }

    console.log('✅ [STT] Gemini transcription successful');
    return {
      text: transcript,
      detectedLanguage: context.targetLanguage,
      confidence: 0.85,
      languageConfidence: 0.9,
      provider: "gemini",
    };
  } catch (error) {
    console.error('❌ [STT] Gemini transcription failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

// NOTE: This STT-only approach works but is less efficient than the full multimodal solution
// For maximum efficiency, use /api/chat/voice-message which combines transcription + conversation
// in a single Gemini request, reducing token usage by ~50-70%

// Use Azure's audio stream input for WebM compatibility
async function createAzureAudioConfig(audioBlob: Blob) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioStream = SpeechSDK.AudioInputStream.createPushStream();
  audioStream.write(arrayBuffer);
  audioStream.close();
  const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(audioStream);

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

        }
      }

      // Strategy 2: Try Azure Speech SDK as fallback
      if (!result) {
        try {

          const { authToken, region } = await getTokenOrRefresh(request);

          const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
            authToken,
            region
          );
          speechConfig.speechRecognitionLanguage = context.targetLanguage;

          const audioConfig = await createAzureAudioConfig(audioBlob);

          const recognizer = new SpeechSDK.SpeechRecognizer(
            speechConfig,
            audioConfig
          );


          const azureResult = await new Promise<{
            text: string;
            detectedLanguage: string;
            confidence: number;
            languageConfidence: number;
            provider: string;
          }>((resolve, reject) => {
            recognizer.recognizeOnceAsync(
              (result) => {
                if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                  const azureResponse = {
                    text: result.text,
                    detectedLanguage: context.targetLanguage,
                    confidence: 0.8,
                    languageConfidence: 0.9,
                    provider: "azure",
                  };
                  resolve(azureResponse);
                } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
                  reject(new Error("Azure STT: No speech could be recognized"));
                } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
                  const cancellation =
                    SpeechSDK.CancellationDetails.fromResult(result);
                  reject(
                    new Error(
                      `Azure STT cancelled: ${cancellation.reason} - ${cancellation.errorDetails}`
                    )
                  );
                } else {
                  reject(
                    new Error(
                      `Azure recognition failed with reason: ${result.reason}`
                    )
                  );
                }
                recognizer.close();
              },
              (error) => {
                recognizer.close();
                reject(new Error(`Azure STT error: ${error}`));
              }
            );
          });



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


        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          attempts.push({ provider: "azure", success: false, error: errorMsg });
          lastError = error instanceof Error ? error : new Error(errorMsg);

        }
      }

      // Strategy 3: Try Gemini direct audio as final fallback (EFFICIENT APPROACH)
      if (!result) {
        try {


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


        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          attempts.push({
            provider: "gemini-stt-only",
            success: false,
            error: errorMsg,
          });
          lastError = error instanceof Error ? error : new Error(errorMsg);

        }
      }

      if (!result) {

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

      return NextResponse.json(
        {
          error: "Speech transcription failed",
          details:
            sttError instanceof Error ? sttError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
