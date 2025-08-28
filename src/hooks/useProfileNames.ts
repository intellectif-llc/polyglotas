import { useQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface ProfileNames {
  firstName: string | null;
  lastName: string | null;
}

export const useProfileNames = () => {
  return useQuery<ProfileNames, Error>({
    queryKey: ['profileNames'],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return {
        firstName: data?.first_name || null,
        lastName: data?.last_name || null,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};