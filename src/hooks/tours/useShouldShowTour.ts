"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";

async function checkTourProgress(profileId: string, tourKey: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();
  
  const { data: tourData } = await supabase
    .from("tours")
    .select("tour_id")
    .eq("tour_key", tourKey)
    .single();

  if (!tourData?.tour_id) return false;

  const { data, error } = await supabase
    .from("user_tour_progress")
    .select("status")
    .eq("profile_id", profileId)
    .eq("tour_id", tourData.tour_id)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  
  // Only show tour if no progress exists or status is pending
  return !data || data.status === "pending";
}

export function useShouldShowTour(tourKey: string) {
  const { data: profile } = useUserProfile();

  const query = useQuery({
    queryKey: ["shouldShowTour", tourKey, profile?.profile_id],
    queryFn: () => checkTourProgress(profile!.profile_id, tourKey),
    enabled: !!profile?.profile_id,
  });

  return {
    shouldShow: query.data ?? false,
    isLoading: query.isLoading,
  };
}