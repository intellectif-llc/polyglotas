import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserProfile {
  profile_id: string;
  current_streak_days: number;
  points: number;
  native_language_code: string;
  current_target_language_code: string;
  subscription_tier: string;
}

interface UserStats {
  currentLevel: string;
  totalUnits: number;
  completedUnits: number;
  currentStreak: number;
  totalPoints: number;
}

export const useUserProfile = () => {
  return useQuery<UserProfile, Error>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("student_profiles")
        .select(`
          profile_id,
          current_streak_days,
          points,
          native_language_code,
          current_target_language_code,
          subscription_tier
        `)
        .eq("profile_id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUserStats = () => {
  return useQuery<UserStats, Error>({
    queryKey: ["userStats"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      // Get user profile
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("current_streak_days, points, current_target_language_code")
        .eq("profile_id", session.user.id)
        .single();

      // Get user activity progress data
      const { data: progressData } = await supabase
        .from("user_lesson_activity_progress")
        .select(`
          activity_type,
          status,
          user_lesson_progress!inner(
            lesson_id,
            profile_id
          )
        `)
        .eq("user_lesson_progress.profile_id", session.user.id)
        .eq("activity_type", "pronunciation");

      // Get lessons with unit info
      const { data: lessonsData } = await supabase
        .from("lessons")
        .select(`
          lesson_id,
          unit_id,
          units!inner(level, unit_order)
        `);

      // Calculate current level and stats
      let currentLevel = "A1";
      let completedUnits = 0;
      const unitProgress = new Map<number, { level: string; completed: number; total: number }>();

      if (lessonsData && progressData) {
        // Build unit progress map
        lessonsData.forEach((lesson) => {
          const unitId = lesson.unit_id;
          const units = lesson.units as { level: string; unit_order: number }[];
          const level = units[0]?.level || "A1";
          
          if (!unitProgress.has(unitId)) {
            unitProgress.set(unitId, { level, completed: 0, total: 0 });
          }
          
          unitProgress.get(unitId)!.total++;
        });

        // Count completed lessons (pronunciation activities)
        progressData.forEach((progress) => {
          if (progress.status === 'completed') {
            const lessonId = progress.user_lesson_progress[0]?.lesson_id;
            const lesson = lessonsData.find(l => l.lesson_id === lessonId);
            if (lesson) {
              const unitData = unitProgress.get(lesson.unit_id);
              if (unitData) {
                unitData.completed++;
              }
            }
          }
        });

        // Find current level based on completed units
        for (const [, unit] of unitProgress) {
          if (unit.completed === unit.total && unit.total > 0) {
            completedUnits++;
            currentLevel = unit.level;
          }
        }
      }

      return {
        currentLevel,
        totalUnits: unitProgress.size,
        completedUnits,
        currentStreak: profile?.current_streak_days || 0,
        totalPoints: profile?.points || 0,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useUpdateTargetLanguage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (languageCode: string) => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("student_profiles")
        .update({ current_target_language_code: languageCode })
        .eq("profile_id", session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["pronunciationUnits"] });
    },
  });
};

export const useUpdateNativeLanguage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (languageCode: string) => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("student_profiles")
        .update({ native_language_code: languageCode })
        .eq("profile_id", session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
    },
  });
};