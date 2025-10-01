import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToS3 } from "@/lib/aws/s3";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    console.log("🖼️ Starting image upload...");
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
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      console.log("❌ No image file provided");
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      console.log("❌ Invalid file type:", imageFile.type);
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      console.log("❌ File too large:", imageFile.size);
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
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

    if (!process.env.PRONUNCIATION_S3_BUCKET_NAME) {
      console.log("❌ PRONUNCIATION_S3_BUCKET_NAME not configured");
      return NextResponse.json(
        { error: "AWS S3 bucket not configured" },
        { status: 500 }
      );
    }

    // Convert file to buffer
    console.log("🔄 Converting file to buffer...");
    const imageBuffer = await imageFile.arrayBuffer();
    console.log("✅ Buffer created, size:", imageBuffer.byteLength);

    // Get file extension
    const fileExtension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    console.log("📄 File extension:", fileExtension);

    // Upload to S3
    console.log("☁️ Uploading to S3...");
    console.log("- Book title:", audiobook.title);
    console.log("- Chapter title:", chapter.chapter_title);
    console.log("- Chapter order:", chapter.chapter_order);

    const { url } = await uploadImageToS3(
      imageBuffer,
      audiobook.title,
      chapter.chapter_title,
      chapter.chapter_order,
      fileExtension
    );
    console.log("✅ Upload successful, URL:", url);

    // Update chapter with image URL
    console.log("💾 Updating chapter with image URL...");
    const { error: updateError } = await supabase
      .from("audiobook_chapters")
      .update({ pic_url: url })
      .eq("chapter_id", parseInt(resolvedParams.chapterId));

    if (updateError) {
      console.log("❌ Database update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    console.log("✅ Image upload completed successfully");
    return NextResponse.json({ pic_url: url });
  } catch (error) {
    console.error("💥 Error uploading image:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}