import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const supabase = await createClient();
  const { lessonId } = await params;
  const parsedLessonId = parseInt(lessonId, 10);

  if (isNaN(parsedLessonId)) {
    return new NextResponse(JSON.stringify({ error: "Invalid lesson ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    console.log(
      `[PHRASES API] Starting phrases fetch for lesson ${parsedLessonId}`
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[PHRASES API] No authenticated user found");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[PHRASES API] User authenticated: ${user.id}`);

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", user.id)
      .single();

    if (profileError) {
      console.log("[PHRASES API] Profile fetch error:", profileError);
    }

    const targetLanguage = profile?.current_target_language_code || "en";
    console.log(`[PHRASES API] Target language: ${targetLanguage}`);

    console.log(
      `[PHRASES API] Fetching phrases for lesson ${parsedLessonId} in language ${targetLanguage}`
    );

    const { data: phrases, error } = await supabase
      .from("lesson_phrases")
      .select(
        `
        phrase_order,
        phrase_id
      `
      )
      .eq("lesson_id", parsedLessonId)
      .order("phrase_order", { ascending: true });

    if (!phrases || phrases.length === 0) {
      console.log("[PHRASES API] No lesson_phrases found");
      return NextResponse.json({ phrases: [], lesson: null });
    }

    // Get phrase details separately
    const phraseIds = phrases.map((p) => p.phrase_id);
    const { data: phraseDetails, error: phraseError } = await supabase
      .from("phrases")
      .select(
        `
        phrase_id,
        concept_description,
        phrase_versions (
          phrase_text,
          audio_url_normal,
          audio_url_slow
        )
      `
      )
      .in("phrase_id", phraseIds)
      .eq("phrase_versions.language_code", targetLanguage);

    if (phraseError) {
      console.log("[PHRASES API] Phrase details fetch error:", phraseError);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to fetch phrase details",
          details: phraseError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    //console.log(`[PHRASES API] Phrases query result:`, { phrases, error });

    if (error) {
      console.log("[PHRASES API] Phrases fetch error:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to fetch phrases",
          details: (error as Error)?.message || "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[PHRASES API] Found ${phrases?.length || 0} lesson phrases`);
    console.log(
      `[PHRASES API] Found ${phraseDetails?.length || 0} phrase details`
    );

    // Fetch phrase progress for the user
    //console.log("[PHRASES API] Processing phrases data...");
    //console.log(`[PHRASES API] Extracted phrase IDs:`, phraseIds);
    const { data: phraseProgressData, error: progressError } = await supabase
      .from("user_phrase_progress")
      .select("phrase_id, pronunciation_completed, dictation_completed")
      .eq("profile_id", user.id)
      .in("phrase_id", phraseIds);

    if (progressError) {
      console.log("[PHRASES API] Progress fetch error:", progressError);
    }
    console.log(`[PHRASES API] Progress data:`, phraseProgressData);

    const phraseProgressMap = new Map<
      number,
      { pronunciation_completed: boolean; dictation_completed: boolean }
    >();
    if (phraseProgressData) {
      for (const progress of phraseProgressData) {
        phraseProgressMap.set(progress.phrase_id, {
          pronunciation_completed: progress.pronunciation_completed || false,
          dictation_completed: progress.dictation_completed || false,
        });
      }
    }

    const formattedPhrases = phrases
      .map((lessonPhrase) => {
        const phraseData = phraseDetails?.find(
          (p) => p.phrase_id === lessonPhrase.phrase_id
        );
        if (!phraseData) return null;

        return {
          id: phraseData.phrase_id,
          phrase_order: lessonPhrase.phrase_order,
          concept_description: phraseData.concept_description,
          phrase_text: phraseData.phrase_versions[0]?.phrase_text || "",
          audio_url_normal: phraseData.phrase_versions[0]?.audio_url_normal,
          audio_url_slow: phraseData.phrase_versions[0]?.audio_url_slow,
          is_completed:
            phraseProgressMap.get(phraseData.phrase_id)
              ?.pronunciation_completed || false,
          dictation_completed:
            phraseProgressMap.get(phraseData.phrase_id)?.dictation_completed ||
            false,
          pronunciation_completed:
            phraseProgressMap.get(phraseData.phrase_id)
              ?.pronunciation_completed || false,
        };
      })
      .filter(Boolean);

    // Fetch lesson details for the breadcrumb
    const { data: lessonData } = await supabase
      .from("lessons")
      .select(
        `
        lesson_order,
        unit_id,
        lesson_translations!inner(lesson_title, language_code)
      `
      )
      .eq("lesson_id", parsedLessonId)
      .eq("lesson_translations.language_code", targetLanguage)
      .single();

    // Fetch unit details separately
    const { data: unitData } = await supabase
      .from("units")
      .select("level, unit_translations!inner(unit_title, language_code)")
      .eq("unit_id", lessonData?.unit_id)
      .eq("unit_translations.language_code", targetLanguage)
      .single();

    const response = {
      phrases: formattedPhrases,
      lesson: {
        lesson_id: parsedLessonId,
        lesson_order: lessonData?.lesson_order,
        unit_id: lessonData?.unit_id,
        lesson_title: lessonData?.lesson_translations[0]?.lesson_title,
        unit_title: unitData?.unit_translations[0]?.unit_title,
        level: unitData?.level,
      },
    };

    /*     console.log(
      "[PHRASES API] Returning response:",
      JSON.stringify(response, null, 2)
    ); */
    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Unhandled error:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
