import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.rpc('get_user_progression_status', {
      profile_id_param: profileId
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Progression API error:', error);
    return NextResponse.json({ error: 'Failed to fetch progression' }, { status: 500 });
  }
}