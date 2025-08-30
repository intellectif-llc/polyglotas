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
 * @param request - Optional NextRequest to forward headers for authentication
 * @returns Promise<TokenResponse>
 * @throws Error if fetching fails
 */
export async function getTokenOrRefresh(request?: { headers: { get: (name: string) => string | null } }): Promise<TokenResponse> {
  console.log('🔑 === AZURE TOKEN AUTHENTICATION ===');
  
  // Check if we have a valid cached token (Azure tokens expire in 10 minutes)
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    const timeLeft = Math.round((tokenExpiry - now) / 1000);
    console.log('🔑 Using cached Azure Speech token, expires in', timeLeft, 'seconds');
    return cachedToken;
  }

  console.log('🔑 Fetching new Azure Speech token...');

  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const tokenUrl = `${baseUrl}/api/speech/token`;
    console.log('🔑 Token URL:', tokenUrl);
    
    // Forward authentication headers if request is provided
    const headers: HeadersInit = {};
    if (request) {
      const authHeader = request.headers.get('authorization');
      const cookieHeader = request.headers.get('cookie');
      console.log('🔑 Forwarding headers - auth:', !!authHeader, 'cookie:', !!cookieHeader);
      if (authHeader) headers['authorization'] = authHeader;
      if (cookieHeader) headers['cookie'] = cookieHeader;
    } else {
      console.log('🔑 No request object provided, no headers to forward');
    }
    
    console.log('🔑 Making token request...');
    const response = await fetch(tokenUrl, { headers });
    console.log('🔑 Token response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔑 Token API error:', response.status, errorText);
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();
    console.log('🔑 Token response received - region:', data.region, 'token length:', data.authToken?.length);

    if (!data.authToken || !data.region) {
      console.error('🔑 Invalid token response:', { hasToken: !!data.authToken, hasRegion: !!data.region });
      throw new Error("Invalid token response from server");
    }

    // Cache the token for 9 minutes (540 seconds)
    cachedToken = data;
    tokenExpiry = now + 9 * 60 * 1000; // 9 minutes in milliseconds

    console.log('✅ Azure Speech token fetched and cached successfully');
    console.log('🔑 Token will expire at:', new Date(tokenExpiry).toISOString());
    return data;
  } catch (error) {
    console.error("Error fetching Azure Speech token:", error);
    // Clear cache on error
    cachedToken = null;
    tokenExpiry = 0;
    throw new Error(
      `Token request failed: ${
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
