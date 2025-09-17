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
    console.log('🔵 Chapter creation started');
    const supabase = await createClient();
    const resolvedParams = await params;
    console.log('📋 Resolved params:', resolvedParams);
    
    // Check admin permissions
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 User check:', user ? 'authenticated' : 'not authenticated');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('🔐 User role:', profile?.role);
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('📝 Request body:', body);
    const { chapter_title, is_free_sample, chapter_order } = body;

    const insertData = {
      book_id: parseInt(resolvedParams.bookId),
      chapter_title,
      is_free_sample: is_free_sample || false,
      chapter_order,
    };
    console.log('💾 Insert data:', insertData);

    const { data, error } = await supabase
      .from('audiobook_chapters')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 400 });
    }

    console.log('✅ Chapter created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Unexpected error creating chapter:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}