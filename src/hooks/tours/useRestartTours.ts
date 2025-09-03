"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

async function restartAllTours(profileId: string) {
  const supabase = createSupabaseBrowserClient();
  
  const { error } = await supabase
    .from("user_tour_progress")
    .delete()
    .eq("profile_id", profileId);

  if (error) throw error;
}

export function useRestartTours() {
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      if (!profile?.profile_id) throw new Error("No profile ID");
      return restartAllTours(profile.profile_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shouldShowTour"] });
      queryClient.invalidateQueries({ queryKey: ["tourProgress"] });
    },
  });

  return {
    restartTours: mutation.mutate,
    isRestarting: mutation.isPending,
    error: mutation.error,
  };
}