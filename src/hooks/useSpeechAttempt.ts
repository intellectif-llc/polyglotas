import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface SpeechAttemptRequest {
  lessonId: string | number;
  phraseId: string | number;
  referenceText: string;
  assessmentResults: {
    recognizedText?: string;
    accuracyScore?: number;
    fluencyScore?: number;
    completenessScore?: number;
    pronScore?: number;
    prosodyScore?: number;
    words?: Array<{
      word: string;
      accuracyScore: number;
      errorType?: string;
    }>;
  };
  languageCode?: string;
}

interface SpeechAttemptResponse {
  success: boolean;
  pointsAwarded: number;
  scores: {
    accuracy?: number;
    fluency?: number;
    completeness?: number;
    pronunciation?: number;
    prosody?: number;
  };
}

export const useSpeechAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation<SpeechAttemptResponse, Error, SpeechAttemptRequest>({
    mutationFn: async (data) => {
      const response = await axios.post('/api/speech/attempt', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate user stats queries to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      
      // The real-time subscription will handle the UI updates
      console.log(`🎉 Speech attempt completed! Points awarded: ${data.pointsAwarded}`);
    },
    onError: (error) => {
      console.error('Speech attempt failed:', error);
    },
  });
};