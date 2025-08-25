import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface UserStatsUpdate {
  currentStreak: number;
  totalPoints: number;
}

export const useRealtimeUserStats = (onStatsUpdate?: (stats: UserStatsUpdate) => void) => {
  const queryClient = useQueryClient();
  const supabase = createSupabaseBrowserClient();
  const previousStats = useRef<UserStatsUpdate | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtimeSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Subscribe to student_profiles changes
      channel = supabase
        .channel('user-stats-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'student_profiles',
            filter: `profile_id=eq.${session.user.id}`,
          },
          (payload) => {
            const newStats = {
              currentStreak: payload.new.current_streak_days || 0,
              totalPoints: payload.new.points || 0,
            };

            // Check if stats actually changed
            if (
              !previousStats.current ||
              previousStats.current.currentStreak !== newStats.currentStreak ||
              previousStats.current.totalPoints !== newStats.totalPoints
            ) {
              previousStats.current = newStats;
              
              // Invalidate queries to refresh UI
              queryClient.invalidateQueries({ queryKey: ['userStats'] });
              queryClient.invalidateQueries({ queryKey: ['userProfile'] });
              
              // Call callback if provided
              onStatsUpdate?.(newStats);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient, supabase, onStatsUpdate]);
};