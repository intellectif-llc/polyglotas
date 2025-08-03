import { useQuery } from "@tanstack/react-query";
import {
  fetchPronunciationUnits,
  fetchUnitLessons,
} from "@/services/pronunciationApi";
import { Unit, Lesson } from "@/types/pronunciation";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export const usePronunciationUnits = () => {
  return useQuery<Unit[], Error>({
    queryKey: ["pronunciationUnits"],
    queryFn: fetchPronunciationUnits,
    staleTime: TEN_MINUTES_MS,
    gcTime: TEN_MINUTES_MS * 3,
    refetchOnWindowFocus: false,
  });
};

export const useUnitLessons = (unitId: string) => {
  return useQuery<{ lessons: Lesson[]; unit: Unit }, Error>({
    queryKey: ["unitLessons", unitId],
    queryFn: () => fetchUnitLessons(unitId),
    staleTime: TEN_MINUTES_MS,
    gcTime: TEN_MINUTES_MS * 3,
    refetchOnWindowFocus: false,
    enabled: !!unitId,
  });
};
