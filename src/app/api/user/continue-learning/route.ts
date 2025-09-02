import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { ContinueLearningData } from "@/types/pronunciation";

type ContinueLearningResponse = ContinueLearningData;

export async function GET() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code, selected_level_code")
      .eq("profile_id", user.id)
      .single();

    const targetLanguage = profile?.current_target_language_code || "en";
    const selectedLevel = profile?.selected_level_code || "A1";

    // Get last activity using direct SQL query
    const { data: lastActivity, error: lastActivityError } = await supabase
      .from("user_lesson_progress")
      .select(`
        lesson_id,
        last_progress_at,
        lessons!inner(
          lesson_id,
          unit_id,
          lesson_order,
          units!inner(
            unit_id,
            level,
            unit_order
          ),
          lesson_translations!inner(
            lesson_title,
            language_code
          )
        )
      `)
      .eq("profile_id", user.id)
      .eq("lessons.lesson_translations.language_code", targetLanguage)
      .order("last_progress_at", { ascending: false })
      .limit(1)
      .single();

    if (lastActivity && !lastActivityError) {
      // Get next incomplete activity for this lesson
      const { data: nextActivity } = await supabase
        .from("user_lesson_activity_progress")
        .select(`
          activity_type,
          user_lesson_progress!inner(
            lesson_id,
            profile_id
          )
        `)
        .eq("user_lesson_progress.profile_id", user.id)
        .eq("user_lesson_progress.lesson_id", lastActivity.lesson_id)
        .neq("status", "completed")
        .order("activity_type")
        .limit(1)
        .single();

      const activityType = nextActivity?.activity_type || 'dictation';
      const lesson = (lastActivity.lessons as unknown) as {
        unit_id: number;
        lesson_id: number;
        lesson_translations: { lesson_title: string }[];
      };

      return NextResponse.json({
        hasProgress: true,
        lessonTitle: lesson.lesson_translations?.[0]?.lesson_title || "Continue Learning",
        href: `/learn/${lesson.unit_id}/lesson/${lesson.lesson_id}/${activityType}`,
        unitId: lesson.unit_id,
        lessonId: lesson.lesson_id,
        activityType
      } as ContinueLearningResponse);
    }

    // No progress found - get first lesson for selected level
    const { data: firstLesson, error: firstLessonError } = await supabase
      .from("lessons")
      .select(`
        lesson_id,
        unit_id,
        lesson_order,
        units!inner(
          unit_id,
          level,
          unit_order
        ),
        lesson_translations!inner(
          lesson_title,
          language_code
        )
      `)
      .eq("units.level", selectedLevel)
      .eq("lesson_translations.language_code", targetLanguage)
      .order("lesson_order", { ascending: true })
      .limit(1)
      .single();

    if (!firstLesson || firstLessonError) {
      console.error("No lessons found for level:", selectedLevel, firstLessonError);
      return new NextResponse(JSON.stringify({ error: "No lessons found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const lesson = (firstLesson as unknown) as {
      unit_id: number;
      lesson_id: number;
      lesson_translations: { lesson_title: string }[];
    };
    return NextResponse.json({
      hasProgress: false,
      lessonTitle: lesson.lesson_translations?.[0]?.lesson_title || "First Lesson",
      href: `/learn/${lesson.unit_id}/lesson/${lesson.lesson_id}/dictation`,
      unitId: lesson.unit_id,
      lessonId: lesson.lesson_id,
      activityType: 'dictation'
    } as ContinueLearningResponse);

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Error in continue-learning API:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}