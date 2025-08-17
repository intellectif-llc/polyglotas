import { useQuery } from "@tanstack/react-query";
import { DictationAttempt } from "@/types/pronunciation";

interface LastDictationResponse {
  attempt: (DictationAttempt & { written_text: string }) | null;
}

export function useLastDictationAttempt(lessonId: string, phraseId?: number) {
  return useQuery({
    queryKey: ["lastDictationAttempt", lessonId, phraseId],
    queryFn: async (): Promise<LastDictationResponse> => {
      if (!phraseId) {
        return { attempt: null };
      }

      const response = await fetch(
        `/api/dictation/last-attempt?lessonId=${lessonId}&phraseId=${phraseId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch last attempt");
      }

      return response.json();
    },
    enabled: !!phraseId,
    staleTime: 0, // Always fetch fresh data
  });
}