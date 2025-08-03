import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface AzureTranslateResponse {
  translations: Array<{
    text: string;
    to: string;
  }>;
}

/**
 * Calls Azure Translator API to translate text
 */
async function callAzureTranslate(
  text: string,
  toLanguage: string
): Promise<string> {
  const translateKey = process.env.AZURE_TRANSLATE_KEY;
  const translateEndpoint = process.env.AZURE_TRANSLATE_ENDPOINT;
  const translateRegion = process.env.AZURE_TRANSLATE_REGION;

  if (!translateKey || !translateEndpoint || !translateRegion) {
    console.error(
      "Azure Translation configuration missing in environment variables."
    );
    throw new Error("Translation service is not configured.");
  }

  let constructedUrl = translateEndpoint.endsWith("/")
    ? translateEndpoint
    : `${translateEndpoint}/`;

  if (constructedUrl.includes("api.cognitive.microsofttranslator.com")) {
    constructedUrl += "translate";
  } else {
    constructedUrl += "translator/text/v3.0/translate";
  }

  const params = new URLSearchParams({
    "api-version": "3.0",
    to: toLanguage,
  });

  const headers = {
    "Ocp-Apim-Subscription-Key": translateKey,
    "Ocp-Apim-Subscription-Region": translateRegion,
    "Content-type": "application/json",
    "X-ClientTraceId": crypto.randomUUID(),
  };

  const body = JSON.stringify([{ text: text }]);

  try {
    console.log(`Calling Azure Translate: ${constructedUrl}?${params}`);
    const response = await fetch(`${constructedUrl}?${params}`, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      throw new Error(
        `Azure Translate API responded with status ${response.status}`
      );
    }

    const data: AzureTranslateResponse[] = await response.json();

    if (data && data[0]?.translations?.[0]?.text) {
      console.log(`Azure Translation successful for text: "${text}"`);
      return data[0].translations[0].text;
    } else {
      console.error("Invalid response structure from Azure Translate:", data);
      throw new Error("Received invalid translation response from service.");
    }
  } catch (error) {
    console.error("Error calling Azure Translate API:", error);
    throw new Error("Translation service failed.");
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ phraseId: string }> }
) {
  const supabase = await createClient();
  const { phraseId } = await params;
  const phraseIdNum = parseInt(phraseId, 10);

  if (isNaN(phraseIdNum)) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid or missing phraseId." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Get authenticated user and their profile
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's native language and current target language
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("native_language_code, current_target_language_code")
      .eq("profile_id", session.user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching user profile:", profileError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch user profile." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!profile.native_language_code) {
      return new NextResponse(
        JSON.stringify({ error: "User native language not set." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const nativeLanguage = profile.native_language_code;
    const targetLanguage = profile.current_target_language_code;

    // 1. Check if translation already exists in phrase_versions
    console.log(
      `Checking for existing translation of phrase ${phraseIdNum} in language ${nativeLanguage}`
    );
    const { data: existingTranslation, error: checkError } = await supabase
      .from("phrase_versions")
      .select("phrase_text")
      .eq("phrase_id", phraseIdNum)
      .eq("language_code", nativeLanguage)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error checking for existing translation:", checkError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to check for existing translation." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. If translation exists, return it
    if (existingTranslation) {
      console.log(`Translation already exists for phrase ${phraseIdNum}.`);
      return NextResponse.json({
        translation: existingTranslation.phrase_text,
      });
    }

    // 3. Get the source phrase text (in target language)
    const { data: sourcePhrase, error: sourcePhraseError } = await supabase
      .from("phrase_versions")
      .select("phrase_text")
      .eq("phrase_id", phraseIdNum)
      .eq("language_code", targetLanguage)
      .single();

    if (sourcePhraseError || !sourcePhrase) {
      console.error("Error fetching source phrase:", sourcePhraseError);
      return new NextResponse(
        JSON.stringify({ error: "Source phrase not found." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!sourcePhrase.phrase_text?.trim()) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot translate empty phrase text." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Call Azure Translate API
    console.log(
      `Translating phrase ${phraseIdNum} from ${targetLanguage} to ${nativeLanguage}`
    );
    const translatedText = await callAzureTranslate(
      sourcePhrase.phrase_text,
      nativeLanguage
    );

    // 5. Store the translation in phrase_versions table
    console.log(
      `Storing translation for phrase ${phraseIdNum}: "${translatedText}"`
    );
    const { error: insertError } = await supabase
      .from("phrase_versions")
      .insert({
        phrase_id: phraseIdNum,
        language_code: nativeLanguage,
        phrase_text: translatedText,
      });

    if (insertError) {
      console.error("Error storing translation:", insertError);
      // Still return the translation even if DB storage fails
      console.warn(
        `DB insert failed, but returning translation: "${translatedText}"`
      );
    }

    // 6. Return the newly generated translation
    return NextResponse.json({
      translation: translatedText,
    });
  } catch (error) {
    console.error("Error in translate phrase handler:", error);
    return new NextResponse(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Internal server error during translation.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
