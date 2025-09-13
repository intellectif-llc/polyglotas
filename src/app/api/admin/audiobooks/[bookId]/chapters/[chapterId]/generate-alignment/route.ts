import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAlignmentFromUrl } from '@/lib/elevenlabs/forceAlignment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    
    // Check admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { script } = body;

    // Get chapter audio URL
    const { data: chapter } = await supabase
      .from('audiobook_chapters')
      .select('audio_url')
      .eq('chapter_id', parseInt(resolvedParams.chapterId))
      .single();

    if (!chapter?.audio_url) {
      return NextResponse.json({ error: 'Chapter audio not found. Generate audio first.' }, { status: 400 });
    }

    // Generate force alignment
    console.log('🎯 Generating force alignment for audio URL:', chapter.audio_url);
    const alignmentResult = await generateAlignmentFromUrl(
      chapter.audio_url,
      script,
      process.env.ELEVENLABS_API_KEY!
    );
    console.log('✅ Alignment generated successfully, loss score:', alignmentResult.loss);

    // Store alignment data
    const { error: alignmentError } = await supabase
      .from('audiobook_alignment')
      .upsert({
        book_id: parseInt(resolvedParams.bookId),
        chapter_id: parseInt(resolvedParams.chapterId),
        full_text: script,
        characters_data: alignmentResult.characters,
        words_data: alignmentResult.words,
        loss_score: alignmentResult.loss,
      });

    if (alignmentError) {
      return NextResponse.json({ error: alignmentError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      message: 'Alignment generated successfully',
      loss_score: alignmentResult.loss 
    });
  } catch (error) {
    console.error('Error generating alignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}