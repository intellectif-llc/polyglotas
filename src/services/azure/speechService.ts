import axios from "axios";

/**
 * Get a token from the Azure Speech service
 * @param speechKey - The Azure Speech subscription key
 * @param speechRegion - The Azure Speech service region
 * @returns The token response
 */
export const getSpeechTokenService = async (
  speechKey: string,
  speechRegion: string
): Promise<{ token: string }> => {
  const tokenUrl = `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const headers = {
    "Ocp-Apim-Subscription-Key": speechKey,
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": "0",
  };

  console.log(`Requesting token from Azure: ${tokenUrl}`);
  try {
    const response = await axios.post(tokenUrl, null, {
      headers: headers,
      timeout: 5000,
    });

    console.log("Successfully retrieved token from Azure.");
    return { token: response.data };
  } catch (error) {
    console.error("Error fetching Azure Speech token:", error);
    throw error;
  }
};
