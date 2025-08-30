import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { generateTTSCacheKey, getCachedTTS, cacheTTS } from "@/lib/cache/ttsCache";

export interface TTSOptions {
  language?: string;
  voice?: string;
  speed?: number; // 0.5 to 2.0
  stability?: number; // 0.0 to 1.0
  similarity_boost?: number; // 0.0 to 1.0
}

// Initialize ElevenLabs client
function getElevenLabsClient(): ElevenLabsClient {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ElevenLabs API key not configured");
  }
  return new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });
}

/**
 * Generates speech audio from text using ElevenLabs TTS with caching
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  // Check cache first
  const cacheKey = generateTTSCacheKey(text, options);
  const cachedAudio = await getCachedTTS(cacheKey);
  
  if (cachedAudio) {
    console.log("Using cached TTS audio");
    return cachedAudio;
  }

  try {
    const client = getElevenLabsClient();
    
    const voiceId =
      options.voice ||
      process.env.ELEVENLABS_VOICE_ID ||
      "pNInz6obpgDQGcFmaJgB";

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text,
      modelId: process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5",
      voiceSettings: {
        stability: options.stability || 0.5,
        similarityBoost: options.similarity_boost || 0.8,
        style: 0.0,
        useSpeakerBoost: true,
      },
    });

    // Convert stream to ArrayBuffer
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    // Combine chunks into single ArrayBuffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    const audioBuffer = result.buffer;
    
    // Cache the result
    await cacheTTS(cacheKey, audioBuffer);
    console.log("Generated and cached new TTS audio");
    
    return audioBuffer;
  } catch (error) {
    console.error("Error generating speech with ElevenLabs:", error);
    throw new Error("Failed to generate speech audio");
  }
}

/**
 * Generates speech and returns as base64 encoded audio
 */
export async function generateSpeechBase64(
  text: string,
  options: TTSOptions = {}
): Promise<string> {
  try {
    const audioBuffer = await generateSpeech(text, options);
    const uint8Array = new Uint8Array(audioBuffer);

    // Convert to base64
    let binary = "";
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }

    return btoa(binary);
  } catch (error) {
    console.error("Error generating speech base64:", error);
    throw new Error("Failed to generate speech audio");
  }
}

/**
 * Streams audio generation for real-time playback with caching
 */
export async function generateSpeechStream(
  text: string,
  options: TTSOptions = {}
): Promise<ReadableStream> {
  // Check cache first
  const cacheKey = generateTTSCacheKey(text, options);
  const cachedAudio = await getCachedTTS(cacheKey);
  
  if (cachedAudio) {
    console.log("Using cached TTS audio for streaming");
    // Convert ArrayBuffer to ReadableStream
    return new ReadableStream({
      start(controller) {
        const uint8Array = new Uint8Array(cachedAudio);
        controller.enqueue(uint8Array);
        controller.close();
      }
    });
  }

  try {
    const client = getElevenLabsClient();
    
    const voiceId =
      options.voice ||
      process.env.ELEVENLABS_STREAMING_VOICE_ID ||
      "pNInz6obpgDQGcFmaJgB";

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text,
      modelId: process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5",
      voiceSettings: {
        stability: options.stability || 0.5,
        similarityBoost: options.similarity_boost || 0.8,
        style: 0.0,
        useSpeakerBoost: true,
      },
    });

    // Cache the stream data as it's read
    const chunks: Uint8Array[] = [];
    const reader = audioStream.getReader();
    
    return new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            controller.enqueue(value);
          }
          
          // Cache the complete audio
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          await cacheTTS(cacheKey, result.buffer);
          console.log("Streamed and cached new TTS audio");
          
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });
  } catch (error) {
    console.error("Error generating speech stream:", error);
    throw new Error("Failed to generate speech stream");
  }
}

/**
 * Validates TTS options
 */
export function validateTTSOptions(options: TTSOptions): TTSOptions {
  return {
    language: options.language || "en",
    voice: options.voice || process.env.ELEVENLABS_VOICE_ID,
    speed: Math.max(0.5, Math.min(2.0, options.speed || 1.0)),
    stability: Math.max(0.0, Math.min(1.0, options.stability || 0.5)),
    similarity_boost: Math.max(
      0.0,
      Math.min(1.0, options.similarity_boost || 0.8)
    ),
  };
}

/**
 * Gets available voices from ElevenLabs
 */
interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
}

export async function getAvailableVoices(): Promise<Voice[]> {
  try {
    const client = getElevenLabsClient();
    const response = await client.voices.getAll();
    
    return response.voices?.map(voice => ({
      voice_id: voice.voiceId || '',
      name: voice.name || '',
      category: voice.category || '',
      description: voice.description,
    })) || [];
  } catch (error) {
    console.error("Error fetching voices:", error);
    return [];
  }
}

/**
 * Estimates audio duration for given text
 */
export function estimateAudioDuration(
  text: string,
  speed: number = 1.0
): number {
  // Rough estimation: ~150 words per minute at normal speed
  const wordsPerMinute = 150 * speed;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, (wordCount / wordsPerMinute) * 60); // seconds
}
