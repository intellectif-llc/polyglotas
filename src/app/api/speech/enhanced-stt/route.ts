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
  preferredProvider?: 'elevenlabs' | 'azure' | 'auto';
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
  console.log('🎤 ElevenLabs STT: Starting transcription...');
  
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model_id', process.env.STT_MODEL || 'scribe_v1');
  
  console.log('🎤 ElevenLabs STT: Sending request with file and model_id=' + (process.env.STT_MODEL || 'scribe_v1'));
  
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🎤 ElevenLabs STT: API Error:', response.status, errorText);
    throw new Error(`ElevenLabs STT failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('🎤 ElevenLabs STT: Raw API response:', result);
  
  // ElevenLabs scribe_v1 model returns different structure
  const transcript = result.text || result.transcript || '';
  const detectedLang = result.detected_language || result.language || context.targetLanguage;
  
  console.log('🎤 ElevenLabs STT: Processed:', { transcript, detectedLang });
  
  return {
    text: transcript,
    detectedLanguage: detectedLang,
    confidence: result.confidence || 0.9,
    languageConfidence: result.language_confidence || 0.9,
    provider: 'elevenlabs',
  };
}

// Use Azure's audio stream input for WebM compatibility
async function createAzureAudioConfig(audioBlob: Blob) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioStream = SpeechSDK.AudioInputStream.createPushStream();
  audioStream.write(arrayBuffer);
  audioStream.close();
  return SpeechSDK.AudioConfig.fromStreamInput(audioStream);
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
      const attempts: Array<{ provider: string; success: boolean; error?: string }> = [];
      let lastError: Error | null = null;
      
      // Strategy 1: Try ElevenLabs STT first (primary)
      if (options.preferredProvider !== 'azure') {
        try {
          console.log('Attempting ElevenLabs STT...');
          const elevenLabsResult = await transcribeWithElevenLabsAPI(audioBlob, context);
          attempts.push({ provider: 'elevenlabs', success: true });
          
          result = {
            result: elevenLabsResult,
            languageSwitch: {
              switched: elevenLabsResult.detectedLanguage !== context.targetLanguage,
              fromLanguage: context.targetLanguage,
              toLanguage: elevenLabsResult.detectedLanguage,
              confidence: elevenLabsResult.languageConfidence,
            },
            attempts,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          attempts.push({ provider: 'elevenlabs', success: false, error: errorMsg });
          lastError = error instanceof Error ? error : new Error(errorMsg);
          console.error('❌ ElevenLabs STT failed:', errorMsg);
        }
      }
      
      // Strategy 2: Try Azure Speech SDK as fallback (convert WebM to WAV first)
      if (!result) {
        try {
          console.log('Attempting Azure STT with audio conversion...');
          
          console.log('🎤 Azure STT: Getting auth token...');
          const { authToken, region } = await getTokenOrRefresh(request);
          console.log('🎤 Azure STT: Token obtained, region:', region);
          const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authToken, region);
          speechConfig.speechRecognitionLanguage = context.targetLanguage;
          
          console.log('🎤 Azure STT: Creating audio stream config...');
          const audioConfig = await createAzureAudioConfig(audioBlob);
          const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
          
          console.log('🎤 Azure STT: Starting recognition...');
          const azureResult = await new Promise<{
            text: string;
            detectedLanguage: string;
            confidence: number;
            languageConfidence: number;
            provider: string;
          }>((resolve, reject) => {
            recognizer.recognizeOnceAsync(
              (result) => {
                console.log('🎤 Azure STT: Recognition result:', result.reason, result.text);
                if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                  resolve({
                    text: result.text,
                    detectedLanguage: context.targetLanguage,
                    confidence: 0.8,
                    languageConfidence: 0.9,
                    provider: 'azure',
                  });
                } else {
                  console.error('🎤 Azure STT: Recognition failed with reason:', result.reason);
                  reject(new Error(`Azure recognition failed: ${result.reason}`));
                }
                recognizer.close();
              },
              (error) => {
                console.error('🎤 Azure STT: Recognition error:', error);
                recognizer.close();
                reject(new Error(`Azure STT error: ${error}`));
              }
            );
          });
          
          attempts.push({ provider: 'azure', success: true });
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
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          attempts.push({ provider: 'azure', success: false, error: errorMsg });
          lastError = error instanceof Error ? error : new Error(errorMsg);
          console.error('❌ Azure STT failed:', errorMsg);
        }
      }
      
      if (!result) {
        throw lastError || new Error('All STT providers failed');
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
          details: sttError instanceof Error ? sttError.message : "Unknown error",
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