import { useQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface OnboardingStatus {
  needsOnboarding: boolean;
  firstName?: string;
  lastName?: string;
  nativeLanguage?: string;
  targetLanguage?: string;
}

export const useOnboardingStatus = () => {
  return useQuery<OnboardingStatus, Error>({
    queryKey: ['onboardingStatus'],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('Not authenticated');

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', session.user.id)
        .single();

      // Get student profile data
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('native_language_code, current_target_language_code')
        .eq('profile_id', session.user.id)
        .single();

      const needsOnboarding = !profile?.first_name || 
                             !profile?.last_name || 
                             !studentProfile?.native_language_code || 
                             !studentProfile?.current_target_language_code;

      return {
        needsOnboarding,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        nativeLanguage: studentProfile?.native_language_code || '',
        targetLanguage: studentProfile?.current_target_language_code || '',
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};