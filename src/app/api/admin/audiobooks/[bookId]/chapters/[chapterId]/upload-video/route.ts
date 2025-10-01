import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadVideoToS3 } from "@/lib/aws/s3";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    console.log("🎬 Starting video upload...");
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

    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      console.log("❌ No video file provided");
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      console.log("❌ Invalid file type:", videoFile.type);
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (videoFile.size > maxSize) {
      console.log("❌ File too large:", videoFile.size);
      return NextResponse.json(
        { error: "File size must be less than 100MB" },
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
    if (!process.env.PRONUNCIATION_S3_BUCKET_NAME) {
      console.log("❌ PRONUNCIATION_S3_BUCKET_NAME not configured");
      return NextResponse.json(
        { error: "AWS S3 bucket not configured" },
        { status: 500 }
      );
    }

    // Convert file to buffer
    console.log("🔄 Converting file to buffer...");
    const videoBuffer = await videoFile.arrayBuffer();
    console.log("✅ Buffer created, size:", videoBuffer.byteLength);

    // Get file extension
    const fileExtension = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
    console.log("📄 File extension:", fileExtension);

    // Upload to S3
    console.log("☁️ Uploading to S3...");
    console.log("- Book title:", audiobook.title);
    console.log("- Chapter title:", chapter.chapter_title);
    console.log("- Chapter order:", chapter.chapter_order);

    const { url } = await uploadVideoToS3(
      videoBuffer,
      audiobook.title,
      chapter.chapter_title,
      chapter.chapter_order,
      fileExtension
    );
    console.log("✅ Upload successful, URL:", url);

    // Update chapter with video URL
    console.log("💾 Updating chapter with video URL...");
    const { error: updateError } = await supabase
      .from("audiobook_chapters")
      .update({ video_url: url })
      .eq("chapter_id", parseInt(resolvedParams.chapterId));

    if (updateError) {
      console.log("❌ Database update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log("✅ Video upload completed successfully");
    return NextResponse.json({ video_url: url });
  } catch (error) {
    console.error("💥 Error uploading video:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}