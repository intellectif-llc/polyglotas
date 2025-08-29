import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, role, first_name, last_name')
      .order('first_name');

    if (profilesError) throw profilesError;

    // Fetch user emails using service client
    const users = [];
    for (const profile of profiles || []) {
      try {
        const { data: userData } = await serviceSupabase.auth.admin.getUserById(profile.id);
        users.push({
          id: profile.id,
          email: userData.user?.email || '',
          role: profile.role,
          first_name: profile.first_name,
          last_name: profile.last_name,
        });
      } catch (error) {
        console.error(`Error fetching user ${profile.id}:`, error);
      }
    }

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceSupabase = createServiceClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update user role
    const { error } = await serviceSupabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}