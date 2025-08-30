import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  console.log('🔑 Azure Token: Request received');
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('🔑 Azure Token: Authentication failed:', authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🔑 Azure Token: User authenticated:', user.id);

    const speechKey = process.env.SPEECH_KEY;
    const speechRegion = process.env.SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      console.error('🔑 Azure Token: Credentials not configured - speechKey:', !!speechKey, 'speechRegion:', speechRegion);
      return NextResponse.json(
        { error: "Speech service not configured" },
        { status: 500 }
      );
    }

    console.log('🔑 Azure Token: Using region:', speechRegion);

    // Get Azure Speech token
    const tokenUrl = `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
    console.log('🔑 Azure Token: Requesting token from:', tokenUrl);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(
        '🔑 Azure Token: Failed to get token:',
        tokenResponse.status,
        tokenResponse.statusText,
        errorText
      );
      return NextResponse.json(
        { error: "Failed to get speech token" },
        { status: 500 }
      );
    }

    const authToken = await tokenResponse.text();
    console.log('🔑 Azure Token: Token obtained successfully, length:', authToken.length);

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
