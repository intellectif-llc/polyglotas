"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

async function updateTourProgress(
  profileId: string,
  tourKey: string,
  lastCompletedStep: number
) {
  const supabase = createSupabaseBrowserClient();
  
  // Get tour_id
  const { data: tourData, error: tourError } = await supabase
    .from("tours")
    .select("tour_id")
    .eq("tour_key", tourKey)
    .single();

  if (tourError) throw tourError;

  const status = lastCompletedStep === -1 ? "completed" : "in_progress";
  const completedAt = lastCompletedStep === -1 ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("user_tour_progress")
    .upsert({
      profile_id: profileId,
      tour_id: tourData.tour_id,
      status,
      last_completed_step: lastCompletedStep === -1 ? 999 : lastCompletedStep,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

export function useTourProgress() {
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ tourKey, lastCompletedStep }: { tourKey: string; lastCompletedStep: number }) => {
      if (!profile?.profile_id) throw new Error("No profile ID");
      return updateTourProgress(profile.profile_id, tourKey, lastCompletedStep);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shouldShowTour"] });
      queryClient.invalidateQueries({ queryKey: ["tourProgress"] });
    },
  });

  return {
    updateProgress: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}