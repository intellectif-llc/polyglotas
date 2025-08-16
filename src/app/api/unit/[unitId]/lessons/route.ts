import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Lesson } from "@/types/pronunciation";

// Define interfaces for structured data
interface UnitDataFromDB {
  level: string;
  unit_translations: { unit_title: string }[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const supabase = await createClient();
  const { unitId } = await params;
  const parsedUnitId = parseInt(unitId, 10);

  if (isNaN(parsedUnitId)) {
    return new NextResponse(JSON.stringify({ error: "Invalid unit ID" }), {
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

    // 1. Fetch all lessons for the unit with translations
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(
        `
        lesson_id,
        unit_id,
        lesson_order,
        total_phrases,
        lesson_translations(
          lesson_title,
          language_code
        )
      `
      )
      .eq("unit_id", parsedUnitId)
      .eq("lesson_translations.language_code", targetLanguage)
      .order("lesson_order", { ascending: true });

    if (lessonsError) {
      throw lessonsError;
    }

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({ lessons: [], unit: null });
    }

    const lessonIds = lessons.map((l) => l.lesson_id);

    // 2. Fetch user activity progress for those lessons
    const { data: progressData, error: progressError } = await supabase
      .from("user_lesson_activity_progress")
      .select(`
        user_lesson_progress_id,
        activity_type,
        status,
        user_lesson_progress!inner(
          lesson_id,
          profile_id
        )
      `)
      .eq("user_lesson_progress.profile_id", user.id)
      .in("user_lesson_progress.lesson_id", lessonIds);

    // 3. Fetch phrase progress for pronunciation activity
    const { data: phraseProgressData, error: phraseProgressError } = await supabase
      .from("user_phrase_progress")
      .select("lesson_id, pronunciation_completed")
      .eq("profile_id", user.id)
      .in("lesson_id", lessonIds);

    if (progressError) {
      console.error("Error fetching user progress:", progressError.message);
    }
    if (phraseProgressError) {
      console.error("Error fetching phrase progress:", phraseProgressError.message);
    }

    // 4. Create maps for easy lookup
    const activityProgressMap = new Map<number, { pronunciationCompleted: boolean }>();
    if (progressData) {
      for (const progress of progressData) {
        const lessonId = progress.user_lesson_progress[0]?.lesson_id;
        if (lessonId && !activityProgressMap.has(lessonId)) {
          activityProgressMap.set(lessonId, { pronunciationCompleted: false });
        }
        if (lessonId && progress.activity_type === 'pronunciation' && progress.status === 'completed') {
          activityProgressMap.get(lessonId)!.pronunciationCompleted = true;
        }
      }
    }

    const phraseProgressMap = new Map<number, number>();
    if (phraseProgressData) {
      for (const phraseProgress of phraseProgressData) {
        const lessonId = phraseProgress.lesson_id;
        const currentCount = phraseProgressMap.get(lessonId) || 0;
        if (phraseProgress.pronunciation_completed) {
          phraseProgressMap.set(lessonId, currentCount + 1);
        }
      }
    }

    // 5. Combine lessons with their progress
    const formattedLessons: Lesson[] = lessons.map(
      (lesson) => {
        const activityProgress = activityProgressMap.get(lesson.lesson_id);
        const phrasesCompleted = phraseProgressMap.get(lesson.lesson_id) || 0;
        return {
          lesson_id: lesson.lesson_id,
          unit_id: lesson.unit_id,
          lesson_order: lesson.lesson_order,
          total_phrases: lesson.total_phrases,
          lesson_title:
            lesson.lesson_translations?.[0]?.lesson_title ||
            `Lesson ${lesson.lesson_order}`,
          is_completed: activityProgress?.pronunciationCompleted || false,
          phrases_completed: phrasesCompleted,
        };
      }
    );

    // 6. Fetch unit details for the breadcrumb
    const { data: unitData } = await supabase
      .from("units")
      .select("level, unit_translations!inner(unit_title, language_code)")
      .eq("unit_id", parsedUnitId)
      .eq("unit_translations.language_code", targetLanguage)
      .single();

    return NextResponse.json({
      lessons: formattedLessons,
      unit: {
        unit_id: unitId,
        level: (unitData as UnitDataFromDB | null)?.level,
        unit_title: (unitData as UnitDataFromDB | null)?.unit_translations[0]
          ?.unit_title,
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
