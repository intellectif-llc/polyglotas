import axios, { isAxiosError } from "axios";
import { AssessmentResults } from "../hooks/speech/useRecognitionState";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/**
 * Submit a speech attempt to the backend
 * @deprecated Use useSpeechAttempt hook instead for real-time updates
 */
export const submitSpeechAttempt = async (
  lessonId: string | number,
  phraseId: string | number,
  referenceText: string,
  assessmentResults: AssessmentResults,
  languageCode?: string
) => {
  try {
    const response = await apiClient.post("/speech/attempt", {
      lessonId,
      phraseId,
      referenceText,
      assessmentResults,
      languageCode,
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const errorMessage =
        (error.response?.data as { error?: string })?.error ||
        (error.response?.data as { details?: string })?.details ||
        error.message;
      console.error("Error submitting speech attempt:", errorMessage);
      throw new Error(errorMessage || "Failed to submit speech attempt");
    }
    console.error("Unexpected error submitting speech attempt:", error);
    throw new Error(
      "An unexpected error occurred while submitting speech attempt."
    );
  }
};

/**
 * Get the last speech attempt for a phrase
 */
export const getLastSpeechAttempt = async (
  lessonId: string | number,
  phraseId: string | number
) => {
  try {
    const response = await apiClient.get(`/speech/attempt/last`, {
      params: { lessonId, phraseId },
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const errorMessage =
        (error.response?.data as { error?: string })?.error ||
        (error.response?.data as { details?: string })?.details ||
        error.message;
      console.error("Error fetching last speech attempt:", errorMessage);
      throw new Error(errorMessage || "Failed to fetch last speech attempt");
    }
    console.error("Unexpected error fetching last speech attempt:", error);
    throw new Error(
      "An unexpected error occurred while fetching last speech attempt."
    );
  }
};
