import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Unit } from "@/types/pronunciation";

// Define interfaces for structured data
interface UnitFromDB {
  unit_id: number;
  level: string;
  unit_order: number;
  unit_translations: { unit_title: string; description?: string }[];
}

interface ProgressFromDB {
  user_lesson_progress_id: number;
  activity_type: string;
  status: string;
  user_lesson_progress: Array<{
    lesson_id: number;
    profile_id: string;
    lessons: { unit_id: number };
  }>;
}

export async function GET() {
  const supabase = await createClient();

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

    // 1. Fetch all units with translations
    const { data: units, error: unitsError } = await supabase
      .from("units")
      .select(
        `
        unit_id,
        level,
        unit_order,
        unit_translations!inner(unit_title, description, language_code)
      `
      )
      .eq("unit_translations.language_code", targetLanguage)
      .order("level", { ascending: true })
      .order("unit_order", { ascending: true });

    if (unitsError) {
      console.error("Database error fetching units:", unitsError.message);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to fetch pronunciation units",
          details: unitsError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!units || units.length === 0) {
      return NextResponse.json({ units: [] });
    }

    const unitIds = units.map((u) => u.unit_id);

    // 2. Fetch user progress for all lessons in these units
    const { data: progressData, error: progressError } = await supabase
      .from("user_lesson_activity_progress")
      .select(
        `
        user_lesson_progress_id,
        activity_type,
        status,
        user_lesson_progress!inner(
          lesson_id,
          profile_id,
          lessons!inner(unit_id)
        )
      `
      )
      .eq("user_lesson_progress.profile_id", user.id)
      .in("user_lesson_progress.lessons.unit_id", unitIds);

    if (progressError) {
      console.error(
        "Database error fetching user lesson progress:",
        progressError.message
      );
      // Continue without progress data rather than failing
    }

    // 3. Fetch total lesson counts for each unit
    const { data: lessonCounts, error: countError } = await supabase
      .from("lessons")
      .select("unit_id")
      .in("unit_id", unitIds);

    if (countError) {
      console.error(
        "Database error fetching lesson counts:",
        countError.message
      );
      // Continue without count data rather than failing
    }

    // 4. Create lookup maps for efficient processing
    const progressMap = (
      (progressData as unknown as ProgressFromDB[]) || []
    ).reduce((acc, p) => {
      const unitId = p.user_lesson_progress[0]?.lessons?.unit_id;
      if (unitId) {
        if (!acc[unitId]) {
          acc[unitId] = { completed: 0 };
        }
        if (p.activity_type === 'pronunciation' && p.status === 'completed') {
          acc[unitId].completed += 1;
        }
      }
      return acc;
    }, {} as Record<number, { completed: number }>);

    const totalLessonsMap = (lessonCounts || []).reduce((acc, lesson) => {
      const unitId = lesson.unit_id;
      if (!acc[unitId]) {
        acc[unitId] = 0;
      }
      acc[unitId] += 1;
      return acc;
    }, {} as Record<number, number>);

    // 5. Combine units with their progress
    const unitsWithProgress: Unit[] = (units as UnitFromDB[]).map((unit) => {
      const unitId = unit.unit_id;
      const completedLessons = progressMap[unitId]?.completed || 0;
      const totalLessons = totalLessonsMap[unitId] || 0;
      const progressPercent =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      return {
        unit_id: unit.unit_id,
        level: unit.level,
        unit_order: unit.unit_order,
        unit_title:
          unit.unit_translations[0]?.unit_title || `Unit ${unit.unit_order}`,
        description: unit.unit_translations[0]?.description || "",
        progress: {
          completed_lessons: completedLessons,
          total_lessons: totalLessons,
          percent: progressPercent,
        },
      };
    });

    return NextResponse.json({ units: unitsWithProgress });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Unhandled error in getPronunciationUnits:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
