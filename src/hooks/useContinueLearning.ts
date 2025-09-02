import { useQuery } from "@tanstack/react-query";
import { ContinueLearningData } from "@/types/pronunciation";

export const useContinueLearning = () => {
  return useQuery<ContinueLearningData>({
    queryKey: ['continue-learning'],
    queryFn: async () => {
      const response = await fetch('/api/user/continue-learning');
      if (!response.ok) {
        throw new Error('Failed to fetch continue learning data');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};