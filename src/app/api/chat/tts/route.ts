import { NextRequest, NextResponse } from "next/server";
import {
  validateChatAccess,
  createSubscriptionErrorResponse,
} from "@/lib/subscription/validation";
import { generateSpeech } from "@/lib/elevenlabs/tts";

interface TTSRequest {
  text: string;
  voice?: string;
  stability?: number;
  similarity_boost?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Validate subscription tier access
    const subscriptionResult = await validateChatAccess();
    if (!subscriptionResult.isValid) {
      return createSubscriptionErrorResponse(subscriptionResult);
    }

    // Parse request body
    let requestBody: TTSRequest;
    try {
      requestBody = await request.json();
    } catch {
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { text, voice, stability, similarity_boost } = requestBody;

    if (!text || text.trim().length === 0) {
      return new NextResponse(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Limit text length to prevent abuse
    if (text.length > 1000) {
      return new NextResponse(
        JSON.stringify({ error: "Text too long (max 1000 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // Generate speech using ElevenLabs
      const audioBuffer = await generateSpeech(text.trim(), {
        voice,
        stability,
        similarity_boost,
      });

      // Return audio as response
      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.byteLength.toString(),
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      });
    } catch (ttsError) {
      console.error("Error generating TTS:", ttsError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to generate speech audio" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unhandled error in TTS endpoint:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
