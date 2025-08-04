import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("native_language_code, current_target_language_code")
      .eq("profile_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const translateKey = process.env.AZURE_TRANSLATE_KEY;
    const translateEndpoint = process.env.AZURE_TRANSLATE_ENDPOINT;
    const translateRegion = process.env.AZURE_TRANSLATE_REGION;

    if (!translateKey || !translateEndpoint || !translateRegion) {
      return NextResponse.json(
        { error: "Translation service not configured" },
        { status: 500 }
      );
    }

    const response = await axios({
      baseURL: translateEndpoint,
      url: "/translate",
      method: "post",
      headers: {
        "Ocp-Apim-Subscription-Key": translateKey,
        "Ocp-Apim-Subscription-Region": translateRegion,
        "Content-type": "application/json",
      },
      params: {
        "api-version": "3.0",
        from: profile.current_target_language_code || "en",
        to: profile.native_language_code || "es",
      },
      data: [{ text }],
      responseType: "json",
    });

    return NextResponse.json({
      translation: response.data[0].translations[0].text,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
