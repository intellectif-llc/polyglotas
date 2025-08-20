import axios from "axios";

export interface TTSOptions {
  language?: string;
  voice?: string;
  speed?: number; // 0.5 to 2.0
  stability?: number; // 0.0 to 1.0
  similarity_boost?: number; // 0.0 to 1.0
}

/**
 * Generates speech audio from text using ElevenLabs TTS
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<ArrayBuffer> {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const voiceId =
      options.voice ||
      process.env.ELEVENLABS_VOICE_ID ||
      "pNInz6obpgDQGcFmaJgB";

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5",
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: options.similarity_boost || 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    return response.data;
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
 * Streams audio generation for real-time playback
 */
export async function generateSpeechStream(
  text: string,
  options: TTSOptions = {}
): Promise<ReadableStream> {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured");
    }

    const voiceId =
      options.voice ||
      process.env.ELEVENLABS_STREAMING_VOICE_ID ||
      "pNInz6obpgDQGcFmaJgB";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5",
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarity_boost || 0.8,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    return response.body!;
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
export async function getAvailableVoices(): Promise<any[]> {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return [];
    }

    const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
    });

    return response.data.voices || [];
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
