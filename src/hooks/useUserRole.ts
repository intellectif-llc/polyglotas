import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function useUserRole() {
  const [role, setRole] = useState<'student' | 'partnership_manager' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRole(null);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setRole(data?.role || 'student');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('student');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [supabase]);

  return { role, loading };
}