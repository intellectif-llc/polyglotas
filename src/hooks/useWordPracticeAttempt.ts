import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface WordPracticeAttemptRequest {
  wordText: string;
  accuracyScore: number;
  languageCode?: string;
}

interface WordPracticeAttemptResponse {
  success: boolean;
  wordCompleted: boolean;
  newAverageScore: number;
  totalAttempts: number;
  pointsAwarded: number;
  needsPractice: boolean;
}

export const useWordPracticeAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation<WordPracticeAttemptResponse, Error, WordPracticeAttemptRequest>({
    mutationFn: async (data) => {
      const response = await axios.post('/api/words/attempt', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate user stats queries to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      // The real-time subscription will handle the UI updates
      console.log(`🎉 Word practice completed! Points awarded: ${data.pointsAwarded}`);
    },
    onError: (error) => {
      console.error('Word practice attempt failed:', error);
    },
  });
};