/**
 * Azure Speech token management utilities
 */

interface TokenResponse {
  authToken: string;
  region: string;
}

let cachedToken: TokenResponse | null = null;
let tokenExpiry: number = 0;

/**
 * Fetches a speech token from the backend or returns cached token if still valid
 * @returns Promise<TokenResponse>
 * @throws Error if fetching fails
 */
export async function getTokenOrRefresh(): Promise<TokenResponse> {
  // Check if we have a valid cached token (Azure tokens expire in 10 minutes)
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    console.log("Using cached Azure Speech token");
    return cachedToken;
  }

  console.log("Fetching new Azure Speech token...");

  try {
    const response = await fetch("/api/speech/token");

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();

    if (!data.authToken || !data.region) {
      throw new Error("Invalid token response from server");
    }

    // Cache the token for 9 minutes (540 seconds)
    cachedToken = data;
    tokenExpiry = now + 9 * 60 * 1000; // 9 minutes in milliseconds

    console.log("Azure Speech token fetched and cached successfully");
    return data;
  } catch (error) {
    console.error("Error fetching Azure Speech token:", error);
    throw new Error(
      `Failed to get speech token: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Clears the cached token (useful for testing or error recovery)
 */
export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}
