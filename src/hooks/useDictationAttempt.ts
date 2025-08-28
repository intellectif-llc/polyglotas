import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface DictationAttemptRequest {
  lesson_id: number;
  phrase_id: number;
  written_text: string;
  language_code: string;
}

interface DictationAttemptResponse {
  overall_similarity_score: number;
  word_level_feedback: Array<{
    reference_word: string;
    written_word: string;
    similarity_score: number;
    position_in_phrase: number;
  }>;
  is_correct: boolean;
  points_awarded: number;
  written_text?: string;
  reference_text?: string;
}

export const useDictationAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation<DictationAttemptResponse, Error, DictationAttemptRequest>({
    mutationFn: async (data) => {
      const response = await axios.post('/api/dictation/attempt', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user stats queries to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      // Invalidate lesson phrases to update PhraseStepper completion status
      queryClient.invalidateQueries({ queryKey: ['lessonPhrases', variables.lesson_id.toString()] });
      
      // The real-time subscription will handle the UI updates
      console.log(`🎉 Dictation attempt completed! Points awarded: ${data.points_awarded}`);
    },
    onError: (error) => {
      console.error('Dictation attempt failed:', error);
    },
  });
};