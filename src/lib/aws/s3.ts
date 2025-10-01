import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.SES_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AMP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMP_AWS_SECRET_ACCESS_KEY!,
  },
});

export interface S3UploadResult {
  url: string;
  key: string;
}

export async function uploadAudioToS3(
  audioBuffer: ArrayBuffer,
  bookName: string,
  chapterName: string,
  chapterNumber: number
): Promise<S3UploadResult> {
  console.log("📦 S3 Upload starting...");
  console.log("- Buffer size:", audioBuffer.byteLength);
  console.log("- Book name:", bookName);
  console.log("- Chapter name:", chapterName);
  console.log("- Chapter number:", chapterNumber);

  const sanitizedBookName = bookName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const sanitizedChapterName = chapterName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const prefix = process.env.AUDIOBOOKS_S3_PREFIX || 'audiobooks';
  const key = `${prefix}/${sanitizedBookName}/${sanitizedChapterName}/${chapterNumber}.mp3`;

  console.log("- Sanitized book name:", sanitizedBookName);
  console.log("- Sanitized chapter name:", sanitizedChapterName);
  console.log("- S3 key:", key);
  console.log("- Bucket:", process.env.PRONUNCIATION_S3_BUCKET_NAME);

  if (!process.env.PRONUNCIATION_S3_BUCKET_NAME) {
    throw new Error(
      "PRONUNCIATION_S3_BUCKET_NAME environment variable is not set"
    );
  }

  if (
    !process.env.AMP_AWS_ACCESS_KEY_ID ||
    !process.env.AMP_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error("AWS credentials are not configured");
  }

  const command = new PutObjectCommand({
    Bucket: process.env.PRONUNCIATION_S3_BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(audioBuffer),
    ContentType: "audio/mpeg",
  });

  console.log("🚀 Sending S3 command...");
  await s3Client.send(command);
  console.log("✅ S3 upload successful");

  const cloudFrontUrl = `${process.env.CLOUDFRONT_URL}/${key}`;
  console.log("- CloudFront URL:", cloudFrontUrl);

  return {
    url: cloudFrontUrl,
    key,
  };
}

export async function uploadImageToS3(
  imageBuffer: ArrayBuffer,
  bookName: string,
  chapterName: string,
  chapterNumber: number,
  fileExtension: string
): Promise<S3UploadResult> {
  console.log("🖼️ S3 Image Upload starting...");
  console.log("- Buffer size:", imageBuffer.byteLength);
  console.log("- Book name:", bookName);
  console.log("- Chapter name:", chapterName);
  console.log("- Chapter number:", chapterNumber);
  console.log("- File extension:", fileExtension);

  const sanitizedBookName = bookName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const sanitizedChapterName = chapterName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const prefix = process.env.AUDIOBOOKS_S3_PREFIX || 'audiobooks';
  const key = `${prefix}/${sanitizedBookName}/${sanitizedChapterName}/${chapterNumber}.${fileExtension}`;

  console.log("- Sanitized book name:", sanitizedBookName);
  console.log("- Sanitized chapter name:", sanitizedChapterName);
  console.log("- S3 key:", key);
  console.log("- Bucket:", process.env.PRONUNCIATION_S3_BUCKET_NAME);

  if (!process.env.PRONUNCIATION_S3_BUCKET_NAME) {
    throw new Error(
      "PRONUNCIATION_S3_BUCKET_NAME environment variable is not set"
    );
  }

  if (
    !process.env.AMP_AWS_ACCESS_KEY_ID ||
    !process.env.AMP_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error("AWS credentials are not configured");
  }

  // Determine content type based on file extension
  const getContentType = (ext: string): string => {
    switch (ext.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  };

  const command = new PutObjectCommand({
    Bucket: process.env.PRONUNCIATION_S3_BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(imageBuffer),
    ContentType: getContentType(fileExtension),
  });

  console.log("🚀 Sending S3 command...");
  await s3Client.send(command);
  console.log("✅ S3 image upload successful");

  const cloudFrontUrl = `${process.env.CLOUDFRONT_URL}/${key}`;
  console.log("- CloudFront URL:", cloudFrontUrl);

  return {
    url: cloudFrontUrl,
    key,
  };
}

export async function uploadVideoToS3(
  videoBuffer: ArrayBuffer,
  bookName: string,
  chapterName: string,
  chapterNumber: number,
  fileExtension: string
): Promise<S3UploadResult> {
  console.log("🎬 S3 Video Upload starting...");
  console.log("- Buffer size:", videoBuffer.byteLength);
  console.log("- Book name:", bookName);
  console.log("- Chapter name:", chapterName);
  console.log("- Chapter number:", chapterNumber);
  console.log("- File extension:", fileExtension);

  const sanitizedBookName = bookName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const sanitizedChapterName = chapterName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const prefix = process.env.AUDIOBOOKS_S3_PREFIX || 'audiobooks';
  const key = `${prefix}/${sanitizedBookName}/${sanitizedChapterName}/${chapterNumber}.${fileExtension}`;

  console.log("- Sanitized book name:", sanitizedBookName);
  console.log("- Sanitized chapter name:", sanitizedChapterName);
  console.log("- S3 key:", key);
  console.log("- Bucket:", process.env.PRONUNCIATION_S3_BUCKET_NAME);

  if (!process.env.PRONUNCIATION_S3_BUCKET_NAME) {
    throw new Error(
      "PRONUNCIATION_S3_BUCKET_NAME environment variable is not set"
    );
  }

  if (
    !process.env.AMP_AWS_ACCESS_KEY_ID ||
    !process.env.AMP_AWS_SECRET_ACCESS_KEY
  ) {
    throw new Error("AWS credentials are not configured");
  }

  // Determine content type based on file extension
  const getContentType = (ext: string): string => {
    switch (ext.toLowerCase()) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      default:
        return 'video/mp4';
    }
  };

  const command = new PutObjectCommand({
    Bucket: process.env.PRONUNCIATION_S3_BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(videoBuffer),
    ContentType: getContentType(fileExtension),
  });

  console.log("🚀 Sending S3 command...");
  await s3Client.send(command);
  console.log("✅ S3 video upload successful");

  const cloudFrontUrl = `${process.env.CLOUDFRONT_URL}/${key}`;
  console.log("- CloudFront URL:", cloudFrontUrl);

  return {
    url: cloudFrontUrl,
    key,
  };
}
