import { useQuery } from "@tanstack/react-query";
import { getLastSpeechAttempt } from "@/services/speechApi";
import { AssessmentResults } from "./useRecognitionState";

interface LastAttemptData {
  attemptId: number;
  attemptNumber: number;
  createdAt: string;
  assessmentResults: AssessmentResults;
}

export const useLastSpeechAttempt = (
  lessonId: string | number | undefined,
  phraseId: string | number | undefined
) => {
  return useQuery<{ attempt: LastAttemptData | null }, Error>({
    queryKey: ["lastSpeechAttempt", lessonId, phraseId],
    queryFn: () => getLastSpeechAttempt(lessonId!, phraseId!),
    enabled: !!lessonId && !!phraseId,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};