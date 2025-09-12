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

export async function generateForceAlignment(
  audioFile: File | Blob,
  text: string,
  apiKey: string
): Promise<ForceAlignmentResponse> {
  const formData = new FormData();
  formData.append('file', audioFile);
  formData.append('text', JSON.stringify(text));

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
  // Fetch the audio file from URL
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch audio file: ${audioResponse.statusText}`);
  }

  const audioBlob = await audioResponse.blob();
  return generateForceAlignment(audioBlob, text, apiKey);
}