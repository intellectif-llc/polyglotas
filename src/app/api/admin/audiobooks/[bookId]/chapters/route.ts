import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
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
    const { chapter_title, script, duration_seconds, is_free_sample, chapter_order } = body;

    const { data, error } = await supabase
      .from('audiobook_chapters')
      .insert({
        book_id: parseInt(resolvedParams.bookId),
        chapter_title,
        audio_url: '', // Will be updated when audio is generated
        duration_seconds: duration_seconds || 0,
        is_free_sample: is_free_sample || false,
        chapter_order,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Store script temporarily (you might want to add a script column to the table)
    // For now, we'll return the chapter data and handle script separately
    return NextResponse.json({ ...data, script });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}