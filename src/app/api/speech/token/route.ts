import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const speechKey = process.env.SPEECH_KEY;
    const speechRegion = process.env.SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      console.error("Azure Speech credentials not configured");
      return NextResponse.json(
        { error: "Speech service not configured" },
        { status: 500 }
      );
    }

    // Get Azure Speech token
    const tokenResponse = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "Failed to get Azure Speech token:",
        tokenResponse.statusText
      );
      return NextResponse.json(
        { error: "Failed to get speech token" },
        { status: 500 }
      );
    }

    const authToken = await tokenResponse.text();

    return NextResponse.json({
      authToken,
      region: speechRegion,
    });
  } catch (error) {
    console.error("Error in speech token endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
