import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface WordNeedingPractice {
  word_text: string;
  average_accuracy_score: number;
  last_accuracy_score: number;
  total_attempts: number;
  error_count: number;
}

interface WordPracticeAttempt {
  wordText: string;
  accuracyScore: number;
  languageCode?: string;
}

export const useWordsNeedingPractice = () => {
  return useQuery<WordNeedingPractice[], Error>({
    queryKey: ["wordsNeedingPractice"],
    queryFn: async () => {
      const response = await fetch("/api/words/practice");
      if (!response.ok) {
        throw new Error("Failed to fetch words needing practice");
      }
      const data = await response.json();
      return data.words;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * @deprecated Use useWordPracticeAttempt from '../useWordPracticeAttempt' for real-time updates
 */
export const useWordPracticeAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attempt: WordPracticeAttempt) => {
      const response = await fetch("/api/words/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attempt),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit word practice attempt");
      }

      return response.json();
    },
    onSuccess: () => {
      // Refresh the words needing practice list and user stats
      queryClient.invalidateQueries({ queryKey: ["wordsNeedingPractice"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
};