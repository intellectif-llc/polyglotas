import { useState, useCallback } from "react";
import axios from "axios";

export interface EfficientVoiceResult {
  transcript: string;
  detectedLanguage: string;
  confidence: number;
  languageSwitch: {
    switched: boolean;
    fromLanguage: string;
    toLanguage: string;
    confidence: number;
  };
  provider: string;
}

export interface EfficientVoiceMessageResponse {
  user_message: {
    message_id: string;
    message_text: string;
    sender_type: "user";
    message_order: number;
    created_at: string;
  };
  ai_message: {
    message_id: string;
    message_text: string;
    sender_type: "ai";
    message_order: number;
    created_at: string;
    suggested_answer?: string | null;
  };
  conversation_status: {
    all_prompts_addressed: boolean;
    addressed_prompt_ids: number[];
  };
  transcription_info: EfficientVoiceResult;
}

export interface EfficientVoiceMessageOptions {
  conversationId: string;
  targetLanguage: string;
  nativeLanguage: string;
  lessonLevel: string;
}

/**
 * Hook for efficient voice message processing using single Gemini multimodal request
 * This replaces the inefficient two-request approach (STT + conversation)
 */
export function useEfficientVoiceMessage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendVoiceMessage = useCallback(async (
    audioBlob: Blob,
    options: EfficientVoiceMessageOptions
  ): Promise<EfficientVoiceMessageResponse> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Prepare form data for multimodal request
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('options', JSON.stringify(options));

      const response = await axios.post('/api/chat/voice-message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data as EfficientVoiceMessageResponse;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during voice message processing';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    sendVoiceMessage,
    isProcessing,
    error,
  };
}