import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { bookId, audioFile, text } = await request.json();

    if (!bookId || !audioFile || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: bookId, audioFile, text' },
        { status: 400 }
      );
    }

    // Create FormData for ElevenLabs API
    const formData = new FormData();
    
    // Convert base64 audio to blob if needed
    const audioBlob = new Blob([audioFile], { type: 'audio/mpeg' });
    formData.append('file', audioBlob);
    formData.append('text', JSON.stringify(text));

    // Call ElevenLabs Force Alignment API
    const response = await fetch('https://api.elevenlabs.io/v1/forced-alignment', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const alignmentData = await response.json();

    // Save alignment data to database
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('audiobook_alignment')
      .upsert({
        book_id: bookId,
        full_text: text,
        characters_data: alignmentData.characters,
        words_data: alignmentData.words,
        loss_score: alignmentData.loss
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      alignment: alignmentData
    });

  } catch (error) {
    console.error('Error generating alignment:', error);
    return NextResponse.json(
      { error: 'Failed to generate alignment data' },
      { status: 500 }
    );
  }
}