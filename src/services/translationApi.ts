import axios, { isAxiosError } from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/**
 * Requests translation for a specific phrase ID.
 * The backend handles calling Azure and updating the DB if needed.
 * @param phraseId - The ID of the phrase to translate.
 * @returns Promise that resolves to the translation text
 */
export const translatePhrase = async (
  phraseId: string | number
): Promise<string> => {
  if (!phraseId) {
    throw new Error("phraseId is required to request translation.");
  }

  try {
    console.log(`🌐 Requesting translation for phrase ${phraseId}...`);

    const response = await apiClient.post(
      `/phrase/${phraseId}/translate`,
      {} // Empty body for this POST request
    );

    // Expecting backend to return { translation: "..." }
    if (response.data?.translation) {
      console.log(`✅ Translation received: "${response.data.translation}"`);
      return response.data.translation;
    } else {
      throw new Error("Invalid translation response received.");
    }
  } catch (error) {
    console.error(
      `❌ Error translating phrase ${phraseId}:`,
      isAxiosError(error) ? error.response?.data : error
    );

    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to translate phrase"
      );
    } else {
      throw new Error("Failed to translate phrase");
    }
  }
};
