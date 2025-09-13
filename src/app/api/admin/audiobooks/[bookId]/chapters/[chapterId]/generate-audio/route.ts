import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSpeech } from "@/lib/elevenlabs/tts";
import { uploadAudioToS3 } from "@/lib/aws/s3";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    console.log("🎵 Starting audio generation...");
    const supabase = await createClient();
    const resolvedParams = await params;
    console.log("📋 Params:", resolvedParams);

    // Check admin permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("👤 User:", user?.id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    console.log("🔐 User role:", profile?.role);
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { script, speed = 0.9 } = body;
    console.log("📝 Script length:", script?.length, "Speed:", speed);

    if (!script) {
      console.log("❌ No script provided");
      return NextResponse.json(
        { error: "Script is required" },
        { status: 400 }
      );
    }

    // Get audiobook and chapter info
    console.log("📚 Fetching audiobook for book_id:", resolvedParams.bookId);
    const { data: audiobook, error: audiobookError } = await supabase
      .from("audiobooks")
      .select("title")
      .eq("book_id", parseInt(resolvedParams.bookId))
      .single();

    console.log("📚 Audiobook result:", { audiobook, audiobookError });

    console.log(
      "📖 Fetching chapter for chapter_id:",
      resolvedParams.chapterId
    );
    const { data: chapter, error: chapterError } = await supabase
      .from("audiobook_chapters")
      .select("chapter_title, chapter_order")
      .eq("chapter_id", parseInt(resolvedParams.chapterId))
      .single();

    console.log("📖 Chapter result:", { chapter, chapterError });

    if (!audiobook || !chapter) {
      console.log(
        "❌ Missing data - audiobook:",
        !!audiobook,
        "chapter:",
        !!chapter
      );
      return NextResponse.json(
        { error: "Audiobook or chapter not found" },
        { status: 404 }
      );
    }

    // Check AWS environment variables
    console.log("🔧 AWS Config check:");
    console.log(
      "- PRONUNCIATION_S3_BUCKET_NAME:",
      !!process.env.PRONUNCIATION_S3_BUCKET_NAME
    );
    console.log("- CLOUDFRONT_URL:", !!process.env.CLOUDFRONT_URL);
    console.log(
      "- AMP_AWS_ACCESS_KEY_ID:",
      !!process.env.AMP_AWS_ACCESS_KEY_ID
    );
    console.log(
      "- AMP_AWS_SECRET_ACCESS_KEY:",
      !!process.env.AMP_AWS_SECRET_ACCESS_KEY
    );
    console.log("- SES_REGION:", process.env.SES_REGION);

    if (!process.env.PRONUNCIATION_S3_BUCKET_NAME) {
      console.log("❌ PRONUNCIATION_S3_BUCKET_NAME not configured");
      return NextResponse.json(
        { error: "AWS S3 bucket not configured" },
        { status: 500 }
      );
    }

    // Generate audio using ElevenLabs
    console.log("🎤 Generating speech with ElevenLabs...");
    const audioBuffer = await generateSpeech(script, { speed });
    console.log("✅ Audio generated, buffer size:", audioBuffer.byteLength);

    // Upload to S3
    console.log("☁️ Uploading to S3...");
    console.log("- Book title:", audiobook.title);
    console.log("- Chapter title:", chapter.chapter_title);
    console.log("- Chapter order:", chapter.chapter_order);

    const { url } = await uploadAudioToS3(
      audioBuffer,
      audiobook.title,
      chapter.chapter_title,
      chapter.chapter_order
    );
    console.log("✅ Upload successful, URL:", url);

    // Update chapter with audio URL
    console.log("💾 Updating chapter with audio URL...");
    const { error: updateError } = await supabase
      .from("audiobook_chapters")
      .update({ audio_url: url })
      .eq("chapter_id", parseInt(resolvedParams.chapterId));

    if (updateError) {
      console.log("❌ Database update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log("✅ Audio generation completed successfully");
    return NextResponse.json({ audio_url: url });
  } catch (error) {
    console.error("💥 Error generating audio:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
