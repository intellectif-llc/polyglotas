// ElevenLabsClient import removed - not used until STT API is implemented

export interface STTResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
  languageConfidence: number;
  provider: 'elevenlabs' | 'azure' | 'gemini';
}

export interface STTOptions {
  model?: string;
  language?: string; // Optional hint, will use auto-detect if not provided
}

// ElevenLabs client function removed - not used until STT API is implemented

/**
 * Transcribe audio using ElevenLabs Speech-to-Text with automatic language detection
 * Note: This is a placeholder implementation. ElevenLabs STT API may have different structure.
 * Update this when the actual ElevenLabs STT API is available.
 */
export async function transcribeWithElevenLabs(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _audioBlob: Blob
): Promise<STTResult> {
  // For now, throw an error to force fallback to Azure
  // This will be replaced with actual ElevenLabs STT implementation
  throw new Error("ElevenLabs STT not yet implemented - using Azure fallback");
}

/**
 * Check if ElevenLabs STT is available
 * Currently returns false until actual implementation is ready
 */
export function isElevenLabsSTTAvailable(): boolean {
  // Return false for now to use Azure as primary
  // Change to: return !!process.env.ELEVENLABS_API_KEY; when STT is implemented
  return false;
}