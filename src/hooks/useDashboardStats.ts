import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface DashboardStats {
  dayStreak: number;
  points: number;
  wordsLearned?: number;
  accuracy?: number;
}

interface RecentActivity {
  pointsEarned: number;
  wordsLearned?: string[];
  wordsNeedingPractice?: string[];
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats, Error>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      // Get user profile for streak, points, and tier
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("current_streak_days, points, subscription_tier")
        .eq("profile_id", session.user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const stats: DashboardStats = {
        dayStreak: profile.current_streak_days,
        points: profile.points,
      };

      // Only fetch additional stats for paid tiers
      if (profile.subscription_tier === 'starter' || profile.subscription_tier === 'pro') {
        // Get words learned (words that no longer need practice)
        const { data: wordsData } = await supabase
          .from("user_word_pronunciation")
          .select("word_text")
          .eq("profile_id", session.user.id)
          .eq("needs_practice", false);

        stats.wordsLearned = wordsData?.length || 0;

        // Get accuracy from last day with pronunciation activity
        const { data: lastAttempts } = await supabase
          .from("speech_attempts")
          .select("accuracy_score, created_at")
          .eq("profile_id", session.user.id)
          .not("accuracy_score", "is", null)
          .order("created_at", { ascending: false })
          .limit(50);

        if (lastAttempts && lastAttempts.length > 0) {
          // Get the date of the most recent attempt
          const lastDate = new Date(lastAttempts[0].created_at).toDateString();
          
          // Filter attempts from the last day
          const lastDayAttempts = lastAttempts.filter(
            attempt => new Date(attempt.created_at).toDateString() === lastDate
          );

          if (lastDayAttempts.length > 0) {
            const avgAccuracy = lastDayAttempts.reduce((sum, attempt) => 
              sum + (attempt.accuracy_score || 0), 0
            ) / lastDayAttempts.length;
            stats.accuracy = Math.round(avgAccuracy);
          }
        }
      }

      return stats;
    },
    staleTime: 30 * 1000,
  });
};

export const useRecentActivity = () => {
  return useQuery<RecentActivity, Error>({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      // Get user tier
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("subscription_tier")
        .eq("profile_id", session.user.id)
        .single();

      // Get recent points from last session
      const { data: pointsLog } = await supabase
        .from("user_points_log")
        .select("points_awarded, created_at")
        .eq("profile_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      let pointsEarned = 0;
      if (pointsLog && pointsLog.length > 0) {
        // Get points from the last day with activity
        const lastDate = new Date(pointsLog[0].created_at).toDateString();
        pointsEarned = pointsLog
          .filter(log => new Date(log.created_at).toDateString() === lastDate)
          .reduce((sum, log) => sum + log.points_awarded, 0);
      }

      const activity: RecentActivity = { pointsEarned };

      // Only get word data for paid tiers
      if (profile?.subscription_tier === 'starter' || profile?.subscription_tier === 'pro') {
        // Get words learned in last session (words with recent pronunciation attempts)
        const { data: recentWords } = await supabase
          .from("user_word_pronunciation")
          .select("word_text, last_attempt_at, needs_practice")
          .eq("profile_id", session.user.id)
          .not("last_attempt_at", "is", null)
          .order("last_attempt_at", { ascending: false })
          .limit(10);

        if (recentWords && recentWords.length > 0) {
          const lastDate = new Date(recentWords[0].last_attempt_at!).toDateString();
          
          const recentSessionWords = recentWords.filter(
            word => new Date(word.last_attempt_at!).toDateString() === lastDate
          );

          activity.wordsLearned = recentSessionWords
            .filter(word => !word.needs_practice)
            .map(word => word.word_text);

          activity.wordsNeedingPractice = recentSessionWords
            .filter(word => word.needs_practice)
            .map(word => word.word_text);
        }
      }

      return activity;
    },
    staleTime: 30 * 1000,
  });
};