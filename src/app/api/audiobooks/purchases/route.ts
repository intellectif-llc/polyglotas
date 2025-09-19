import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's audiobook purchases using the database function
    const { data: purchases, error } = await supabase.rpc('get_user_audiobook_purchases', {
      p_profile_id: user.id
    });

    if (error) {
      console.error('Error fetching purchases:', error);
      return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }

    return NextResponse.json({ purchases: purchases || [] });
  } catch (error) {
    console.error('Error in purchases API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}