interface ForceAlignmentResponse {
  characters: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  words: Array<{
    text: string;
    start: number;
    end: number;
    loss: number;
  }>;
  loss: number;
}

function preprocessTextForAlignment(text: string): string {
  return text
    .replace(/\n\n+/g, ' ') // Replace multiple newlines with single space
    .replace(/\n/g, ' ') // Replace single newlines with space
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

export async function generateForceAlignment(
  audioFile: File | Blob,
  text: string,
  apiKey: string
): Promise<ForceAlignmentResponse> {
  const processedText = preprocessTextForAlignment(text);
  console.log('📝 Original text length:', text.length);
  console.log('🔧 Processed text length:', processedText.length);
  console.log('🔧 Processed text preview:', processedText.substring(0, 200));
  
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('text', JSON.stringify(processedText));

  const response = await fetch('https://api.elevenlabs.io/v1/forced-alignment', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  return response.json();
}

export async function generateAlignmentFromUrl(
  audioUrl: string,
  text: string,
  apiKey: string
): Promise<ForceAlignmentResponse> {
  console.log('🎯 Fetching audio from URL:', audioUrl);
  
  // Fetch the audio file from URL with proper headers
  const audioResponse = await fetch(audioUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  console.log('📡 Audio fetch response:', audioResponse.status, audioResponse.statusText);
  
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
  }

  const audioBlob = await audioResponse.blob();
  console.log('🎵 Audio blob size:', audioBlob.size);
  return generateForceAlignment(audioBlob, text, apiKey);
}