import { useMutation, useQueryClient } from "@tanstack/react-query";
import { translatePhrase } from "@/services/translationApi";

interface UseTranslationOptions {
  phraseId: string | number;
  lessonId?: string | number;
  onSuccess?: (translation: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for handling phrase translation
 */
export const useTranslation = ({
  phraseId,
  lessonId,
  onSuccess,
  onError,
}: UseTranslationOptions) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => translatePhrase(phraseId),
    onSuccess: (translation) => {
      console.log("Translation fetched/generated:", translation);

      // Invalidate lesson phrases query to update cache with new translation
      if (lessonId) {
        queryClient.invalidateQueries({
          queryKey: ["lesson", lessonId, "phrases"],
        });
      }

      onSuccess?.(translation);
    },
    onError: (error) => {
      console.error("Translation mutation error:", error);
      onError?.(error as Error);
    },
  });

  return {
    translate: mutation.mutate,
    translation: mutation.data,
    isTranslating: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    reset: mutation.reset,
  };
};
