import { useState, useCallback } from "react";
import { DictationAttempt } from "@/types/pronunciation";

export function useDictation() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDictation = useCallback(async (
    lessonId: string,
    phraseId: number,
    writtenText: string,
    languageCode: string = "en"
  ): Promise<DictationAttempt | null> => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/dictation/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: parseInt(lessonId),
          phrase_id: phraseId,
          written_text: writtenText,
          language_code: languageCode,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      console.error("Failed to submit dictation");
      return null;
    } catch (error) {
      console.error("Error submitting dictation:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitDictation,
    isSubmitting,
  };
}