import { NextResponse } from "next/server";
import axios from "axios";
import { getSpeechTokenService } from "@/services/azure/speechService";

/**
 * GET handler for Azure Speech token endpoint
 * Returns an authentication token for Azure Speech SDK
 */
export async function GET() {
  const speechKey = process.env.SPEECH_KEY;
  const speechRegion = process.env.SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    console.error(
      "Error: SPEECH_KEY or SPEECH_REGION environment variables not set."
    );
    return new NextResponse(
      JSON.stringify({
        error: "Server configuration error: Speech credentials missing.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const result = await getSpeechTokenService(speechKey, speechRegion);
    return NextResponse.json({
      authToken: result.token,
      region: speechRegion,
    });
  } catch (error: unknown) {
    console.error("Error fetching Azure Speech token:", error);

    let errorMessage = "Failed to retrieve Azure Speech token.";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Error from Azure (e.g., invalid key)
        errorMessage = `Azure token service error: ${
          error.response.statusText || "Unknown error"
        }`;
        statusCode =
          error.response.status === 401 || error.response.status === 403
            ? 401
            : 500;
      } else if (error.request) {
        // Request made but no response (e.g., timeout, network issue)
        errorMessage = "No response received from Azure token service.";
        statusCode = 504; // Gateway Timeout
      } else {
        // Setup error
        errorMessage = `Error setting up request to Azure token service: ${error.message}`;
      }
    } else {
      errorMessage = error instanceof Error ? error.message : "Unknown error";
    }

    return new NextResponse(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
