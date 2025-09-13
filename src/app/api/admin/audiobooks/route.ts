import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    const { title, author, description, language_code, level_code, points_cost, price_cents } = body;

    const { data, error } = await supabase
      .from('audiobooks')
      .insert({
        title,
        author,
        description,
        language_code,
        level_code,
        points_cost: points_cost || 0,
        price_cents: price_cents || 0,
        audio_url: '', // Will be updated when chapters are added
        duration_seconds: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating audiobook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}