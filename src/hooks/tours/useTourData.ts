"use client";

import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface TourStep {
  step_id: number;
  step_order: number;
  page_route: string;
  target_selector: string;
  title: string;
  content: string;
  tour_props: { placement?: string } | null;
}

interface ShepherdStep {
  target: string;
  title: string;
  content: string;
  placement?: string;
}

interface TourData {
  steps: ShepherdStep[];
}

async function fetchTourData(tourKey: string): Promise<TourData> {
  const supabase = createSupabaseBrowserClient();
  
  const { data, error } = await supabase
    .from("tours")
    .select(`
      tour_id,
      tour_steps (
        step_id,
        step_order,
        page_route,
        target_selector,
        title,
        content,
        tour_props
      )
    `)
    .eq("tour_key", tourKey)
    .eq("is_active", true)
    .single();

  if (error) throw error;

  const steps: ShepherdStep[] = (data.tour_steps as TourStep[])
    .sort((a, b) => a.step_order - b.step_order)
    .map((step) => ({
      target: step.target_selector,
      title: step.title,
      content: step.content,
      placement: step.tour_props?.placement || "bottom",
    }));

  return { steps };
}

export function useTourData(tourKey: string | null) {
  return useQuery({
    queryKey: ["tour", tourKey],
    queryFn: () => fetchTourData(tourKey!),
    enabled: !!tourKey,
  });
}