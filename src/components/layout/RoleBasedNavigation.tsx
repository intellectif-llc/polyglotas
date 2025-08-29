'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface UserProfile {
  role: 'student' | 'partnership_manager' | 'admin';
}

export function RoleBasedNavigation() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase]);

  if (loading || !profile) return null;

  return (
    <div className="flex space-x-4">
      {profile.role === 'admin' && (
        <Link
          href="/admin"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Admin Panel
        </Link>
      )}
      {(profile.role === 'partnership_manager' || profile.role === 'admin') && (
        <Link
          href="/partnership"
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Partnership Manager
        </Link>
      )}
    </div>
  );
}