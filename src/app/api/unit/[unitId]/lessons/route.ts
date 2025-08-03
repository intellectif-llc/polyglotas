import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Lesson } from "@/types/pronunciation";

// Define interfaces for structured data
interface LessonFromDB {
  lesson_id: number;
  unit_id: number;
  lesson_order: number;
  total_phrases: number;
  lesson_translations: { lesson_title: string }[];
}

interface UserProgressFromDB {
  lesson_id: number;
  is_completed: boolean;
  phrases_completed: number;
}

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
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", session.user.id)
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
        lesson_translations!inner(lesson_title, language_code)
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

    // 2. Fetch user progress for those lessons
    const { data: progressData, error: progressError } = await supabase
      .from("user_lesson_progress")
      .select("lesson_id, is_completed, phrases_completed")
      .eq("profile_id", session.user.id)
      .in("lesson_id", lessonIds);

    if (progressError) {
      // Log error but don't fail, as progress might not exist
      console.error("Error fetching user progress:", progressError.message);
    }

    // 3. Create a map for easy lookup
    const progressMap = new Map<number, UserProgressFromDB>();
    if (progressData) {
      for (const progress of progressData) {
        progressMap.set(progress.lesson_id, progress);
      }
    }

    // 4. Combine lessons with their progress
    const formattedLessons: Lesson[] = (lessons as LessonFromDB[]).map(
      (lesson) => {
        const progress = progressMap.get(lesson.lesson_id);
        return {
          lesson_id: lesson.lesson_id,
          unit_id: lesson.unit_id,
          lesson_order: lesson.lesson_order,
          total_phrases: lesson.total_phrases,
          lesson_title:
            lesson.lesson_translations[0]?.lesson_title ||
            `Lesson ${lesson.lesson_order}`,
          is_completed: progress?.is_completed || false,
          phrases_completed: progress?.phrases_completed || 0,
        };
      }
    );

    // 5. Fetch unit details for the breadcrumb
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
