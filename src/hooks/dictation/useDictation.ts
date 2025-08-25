import { useDictationAttempt } from "../useDictationAttempt";

/**
 * @deprecated Use useDictationAttempt hook directly for real-time updates
 */
export function useDictation() {
  const dictationMutation = useDictationAttempt();

  const submitDictation = async (
    lessonId: string,
    phraseId: number,
    writtenText: string,
    languageCode: string = "en"
  ) => {
    try {
      const result = await dictationMutation.mutateAsync({
        lesson_id: parseInt(lessonId),
        phrase_id: phraseId,
        written_text: writtenText,
        language_code: languageCode,
      });
      return result;
    } catch (error) {
      console.error("Error submitting dictation:", error);
      return null;
    }
  };

  return {
    submitDictation,
    isSubmitting: dictationMutation.isPending,
  };
}