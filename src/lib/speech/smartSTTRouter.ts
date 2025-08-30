// ElevenLabs STT removed from client-side to avoid Node.js module conflicts
// Will be handled server-side when implemented
import { getTokenOrRefresh } from "./auth";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export interface STTResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
  languageConfidence: number;
  provider: 'elevenlabs' | 'azure' | 'gemini';
}

export interface ConversationContext {
  targetLanguage: string;
  nativeLanguage: string;
  lessonLevel: string;
  allowNativeLanguage: boolean;
}

export interface SmartSTTOptions {
  preferredProvider?: 'elevenlabs' | 'azure' | 'auto';
  maxRetries?: number;
  confidenceThreshold?: number;
}

/**
 * Transcribe audio using Azure Speech SDK as fallback
 */
async function transcribeWithAzure(
  audioBlob: Blob,
  language: string
): Promise<STTResult> {
  try {
    const { authToken, region } = await getTokenOrRefresh();
    
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authToken, region);
    speechConfig.speechRecognitionLanguage = language;
    speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;
    
    // Convert blob to audio buffer for Azure SDK
    const audioBuffer = await audioBlob.arrayBuffer();
    const audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(
      Buffer.from(audioBuffer)
    );
    
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    
    return new Promise((resolve, reject) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            resolve({
              text: result.text,
              detectedLanguage: language,
              confidence: 0.8, // Azure doesn't provide confidence in simple mode
              languageConfidence: 0.9,
              provider: 'azure',
            });
          } else {
            reject(new Error(`Azure recognition failed: ${result.reason}`));
          }
          recognizer.close();
        },
        (error) => {
          recognizer.close();
          reject(new Error(`Azure STT error: ${error}`));
        }
      );
    });
  } catch (error) {
    throw new Error(`Azure transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transcribe audio using Gemini direct audio input (future implementation)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function transcribeWithGemini(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _audioBlob: Blob,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: ConversationContext
): Promise<STTResult> {
  // Placeholder for Gemini direct audio transcription
  // This would require implementing Gemini audio input API
  throw new Error("Gemini direct audio transcription not yet implemented");
}

/**
 * Detect if user switched languages based on transcription results
 */
function detectLanguageSwitch(
  result: STTResult,
  context: ConversationContext
): {
  switched: boolean;
  fromLanguage: string;
  toLanguage: string;
  confidence: number;
} {
  const isNativeLanguage = result.detectedLanguage === context.nativeLanguage;
  
  return {
    switched: isNativeLanguage && context.allowNativeLanguage,
    fromLanguage: context.targetLanguage,
    toLanguage: result.detectedLanguage,
    confidence: result.languageConfidence,
  };
}

/**
 * Smart STT router that tries multiple providers with fallbacks
 */
export class SmartSTTRouter {
  private options: SmartSTTOptions;
  
  constructor(options: SmartSTTOptions = {}) {
    this.options = {
      preferredProvider: 'auto',
      maxRetries: 3,
      confidenceThreshold: 0.7,
      ...options,
    };
  }
  
  /**
   * Transcribe audio with smart fallbacks and language detection
   */
  async transcribeWithFallbacks(
    audioBlob: Blob,
    context: ConversationContext
  ): Promise<{
    result: STTResult;
    languageSwitch: ReturnType<typeof detectLanguageSwitch>;
    attempts: Array<{ provider: string; success: boolean; error?: string }>;
  }> {
    const attempts: Array<{ provider: string; success: boolean; error?: string }> = [];
    let lastError: Error | null = null;
    
    // Strategy 1: ElevenLabs STT - Server-side only (disabled client-side)
    // Will be implemented via API call when ElevenLabs STT is available
    
    // Strategy 2: Try Azure with target language
    try {
      console.log("Attempting Azure STT with target language...");
      const result = await transcribeWithAzure(audioBlob, context.targetLanguage);
      attempts.push({ provider: 'azure-target', success: true });
      
      if (result.confidence >= this.options.confidenceThreshold!) {
        const languageSwitch = detectLanguageSwitch(result, context);
        return { result, languageSwitch, attempts };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      attempts.push({ provider: 'azure-target', success: false, error: errorMsg });
      lastError = error instanceof Error ? error : new Error(errorMsg);
      console.warn("Azure STT (target language) failed:", errorMsg);
    }
    
    // Strategy 3: Try Azure with native language if allowed
    if (context.allowNativeLanguage && context.nativeLanguage !== context.targetLanguage) {
      try {
        console.log("Attempting Azure STT with native language...");
        const result = await transcribeWithAzure(audioBlob, context.nativeLanguage);
        attempts.push({ provider: 'azure-native', success: true });
        
        const languageSwitch = detectLanguageSwitch(result, context);
        return { result, languageSwitch, attempts };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        attempts.push({ provider: 'azure-native', success: false, error: errorMsg });
        lastError = error instanceof Error ? error : new Error(errorMsg);
        console.warn("Azure STT (native language) failed:", errorMsg);
      }
    }
    
    // Strategy 4: Future - Try Gemini direct audio
    // Uncomment when Gemini audio input is implemented
    /*
    try {
      console.log("Attempting Gemini direct audio...");
      const result = await transcribeWithGemini(audioBlob, context);
      attempts.push({ provider: 'gemini', success: true });
      
      const languageSwitch = detectLanguageSwitch(result, context);
      return { result, languageSwitch, attempts };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      attempts.push({ provider: 'gemini', success: false, error: errorMsg });
      lastError = error instanceof Error ? error : new Error(errorMsg);
      console.warn("Gemini direct audio failed:", errorMsg);
    }
    */
    
    // All strategies failed
    throw new Error(
      `All STT providers failed. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }
}

/**
 * Default smart STT router instance
 */
export const defaultSTTRouter = new SmartSTTRouter();