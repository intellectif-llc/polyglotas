import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { Unit } from "@/types/pronunciation";

// Matches the shape of data from user_lesson_progress
interface ProgressData {
  is_completed: boolean;
  lessons: {
    unit_id: number;
  } | null;
}

// Matches the shape of data from lessons table
interface LessonCount {
  unit_id: number;
}

// Matches the shape of data from units table with translations
interface RawUnit {
  unit_id: number;
  level: string;
  unit_order: number;
  unit_translations: {
    unit_title: string;
    description: string;
    language_code: string;
  }[];
}

export async function GET() {
  const supabase = await createClient();

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

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", session.user.id)
      .single();

    if (profileError) {
      console.error("Database error fetching profile:", profileError);
    }
    const targetLanguage = profile?.current_target_language_code || "en";

    const { data: units, error: dbError } = await supabase
      .from("units")
      .select(
        `
        unit_id,
        level,
        unit_order,
        unit_translations (
          unit_title,
          description,
          language_code
        )
      `
      )
      .eq("unit_translations.language_code", targetLanguage)
      .order("level", { ascending: true })
      .order("unit_order", { ascending: true });

    if (dbError) {
      console.error("Database error fetching units:", dbError.message);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to fetch pronunciation units.",
          details: dbError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!units || units.length === 0) {
      return NextResponse.json({ units: [] });
    }

    const unitIds = units.map((u: RawUnit) => u.unit_id);

    const { data: progressData, error: progressError } = await supabase
      .from("user_lesson_progress")
      .select(`is_completed, lessons!inner(unit_id)`)
      .eq("profile_id", session.user.id)
      .in("lessons.unit_id", unitIds);

    if (progressError) {
      console.error("Database error fetching progress:", progressError.message);
    }

    const { data: allLessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("unit_id")
      .in("unit_id", unitIds);

    if (lessonsError) {
      console.error(
        "Database error fetching lesson counts:",
        lessonsError.message
      );
    }

    const progressMap = (
      (progressData as unknown as ProgressData[]) || []
    ).reduce((acc: Record<number, { completed: number }>, p: ProgressData) => {
      const unitId = p.lessons?.unit_id;
      if (unitId) {
        if (!acc[unitId]) {
          acc[unitId] = { completed: 0 };
        }
        if (p.is_completed) {
          acc[unitId].completed += 1;
        }
      }
      return acc;
    }, {});

    const totalLessonsMap = ((allLessons as LessonCount[]) || []).reduce(
      (acc: Record<number, number>, lc: LessonCount) => {
        if (!acc[lc.unit_id]) {
          acc[lc.unit_id] = 0;
        }
        acc[lc.unit_id]++;
        return acc;
      },
      {}
    );

    const unitsWithProgress: Unit[] = (units as RawUnit[]).map((unit) => {
      const unitId = unit.unit_id;
      const completedLessons = progressMap[unitId]?.completed || 0;
      const totalLessons = totalLessonsMap[unitId] || 0;
      const progressPercent =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      const translation = unit.unit_translations?.[0];

      return {
        unit_id: unit.unit_id,
        level: unit.level,
        unit_order: unit.unit_order,
        unit_title: translation?.unit_title || `Unit ${unit.unit_order}`,
        description: translation?.description || "",
        progress: {
          completed_lessons: completedLessons,
          total_lessons: totalLessons,
          percent: progressPercent,
        },
      };
    });

    return NextResponse.json({ units: unitsWithProgress });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error(
      "Unhandled Error in GET /api/pronunciation/units:",
      errorMessage
    );
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error.",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
