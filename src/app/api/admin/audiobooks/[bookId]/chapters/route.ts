import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    const { data, error } = await supabase
      .from('audiobook_chapters')
      .select('chapter_id, chapter_title, chapter_order')
      .eq('book_id', parseInt(resolvedParams.bookId))
      .order('chapter_order');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { chapter_title, duration_seconds, is_free_sample, chapter_order } = body;

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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}