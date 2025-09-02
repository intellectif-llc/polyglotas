import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserStats } from "./useUserProfile";

export const useLevelSelection = () => {
  const { data: userStats } = useUserStats();
  const queryClient = useQueryClient();

  // Fetch user's selected level from database
  const { data: selectedLevel = "A1" } = useQuery({
    queryKey: ["selectedLevel"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("student_profiles")
        .select("selected_level_code")
        .eq("profile_id", session.user.id)
        .single();

      if (error) throw error;
      return data?.selected_level_code || "A1";
    },
    staleTime: 30 * 1000,
  });

  const updateLevelMutation = useMutation({
    mutationFn: async (levelCode: string) => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("student_profiles")
        .update({ selected_level_code: levelCode })
        .eq("profile_id", session.user.id);

      if (error) throw error;
      return levelCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["selectedLevel"] });
      queryClient.invalidateQueries({ queryKey: ["pronunciationUnits"] });
    },
  });

  const selectLevel = (levelCode: string) => {
    updateLevelMutation.mutate(levelCode);
  };

  return {
    selectedLevel,
    selectLevel,
    isUpdating: updateLevelMutation.isPending,
    actualLevel: userStats?.currentLevel || "A1",
  };
};