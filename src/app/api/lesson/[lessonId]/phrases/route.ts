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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", user.id)
      .single();

    const targetLanguage = profile?.current_target_language_code || "en";

    const { data: phrases, error } = await supabase
      .from("vocabulary_phrases")
      .select(
        `
        id,
        phrase_order,
        concept_description,
        phrase_versions (
          phrase_text,
          audio_url_normal,
          audio_url_slow
        )
      `
      )
      .eq("lesson_id", parsedLessonId)
      .eq("phrase_versions.language_code", targetLanguage)
      .order("phrase_order", { ascending: true });

    if (error) {
      console.error("Error fetching phrases:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to fetch phrases",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const formattedPhrases = phrases.map(
      (phrase: {
        id: number;
        phrase_order: number;
        concept_description: string;
        phrase_versions: Array<{
          phrase_text: string;
          audio_url_normal: string;
          audio_url_slow: string;
        }>;
      }) => ({
        id: phrase.id,
        phrase_order: phrase.phrase_order,
        concept_description: phrase.concept_description,
        phrase_text: phrase.phrase_versions[0]?.phrase_text || "",
        audio_url_normal: phrase.phrase_versions[0]?.audio_url_normal,
        audio_url_slow: phrase.phrase_versions[0]?.audio_url_slow,
        // We'll add user progress later
        is_completed: false,
      })
    );

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

    return NextResponse.json({
      phrases: formattedPhrases,
      lesson: {
        lesson_id: parsedLessonId,
        lesson_order: lessonData?.lesson_order,
        unit_id: lessonData?.unit_id,
        lesson_title: lessonData?.lesson_translations[0]?.lesson_title,
        unit_title: unitData?.unit_translations[0]?.unit_title,
        level: unitData?.level,
      },
    });
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
