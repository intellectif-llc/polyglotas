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
    console.log(`[API] Starting lessons fetch for unit ${parsedUnitId}`);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[API] No authenticated user found");
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[API] User authenticated: ${user.id}`);

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", user.id)
      .single();

    if (profileError) {
      console.log("[API] Profile fetch error:", profileError);
    }

    const targetLanguage = profile?.current_target_language_code || "en";
    console.log(`[API] Target language: ${targetLanguage}`);

    // 1. First check if unit exists
    const { data: unitCheck, error: unitCheckError } = await supabase
      .from("units")
      .select("unit_id, level")
      .eq("unit_id", parsedUnitId)
      .single();

    console.log(`[API] Unit check:`, { unitCheck, unitCheckError });

    if (unitCheckError || !unitCheck) {
      console.log("[API] Unit not found");
      return NextResponse.json({
        lessons: [],
        unit: null,
        error: "Unit not found",
      });
    }

    // 2. Check if user can access this unit
    const { data: canAccess, error: accessError } = await supabase.rpc(
      "can_user_access_unit",
      {
        profile_id_param: user.id,
        unit_id_param: parsedUnitId,
      }
    );

    console.log(`[API] Access check:`, { canAccess, accessError });

    if (accessError || !canAccess) {
      console.log("[API] User cannot access unit");
      return NextResponse.json({
        lessons: [],
        unit: null,
        error: "Access denied",
      });
    }

    // 3. Fetch all lessons for the unit with translations and phrase count
    console.log(
      `[API] Fetching lessons for unit ${parsedUnitId} in language ${targetLanguage}`
    );

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(
        `
        lesson_id,
        unit_id,
        lesson_order,
        lesson_translations(
          lesson_title,
          language_code
        ),
        lesson_phrases(phrase_id)
      `
      )
      .eq("unit_id", parsedUnitId)
      .eq("lesson_translations.language_code", targetLanguage)
      .order("lesson_order", { ascending: true });

    //console.log(`[API] Lessons query result:`, { lessons, lessonsError });

    if (lessonsError) {
      console.log("[API] Lessons fetch error:", lessonsError);
      throw lessonsError;
    }

    if (!lessons || lessons.length === 0) {
      console.log("[API] No lessons found for unit");
      return NextResponse.json({ lessons: [], unit: null });
    }

    console.log(`[API] Found ${lessons.length} lessons`);

    const lessonIds = lessons.map((l) => l.lesson_id);

    // 2. Fetch user activity progress for those lessons
    const { data: progressData, error: progressError } = await supabase
      .from("user_lesson_activity_progress")
      .select(
        `
        user_lesson_progress_id,
        activity_type,
        status,
        user_lesson_progress!inner(
          lesson_id,
          profile_id
        )
      `
      )
      .eq("user_lesson_progress.profile_id", user.id)
      .in("user_lesson_progress.lesson_id", lessonIds);

    // 3. Fetch phrase progress for pronunciation activity
    const { data: phraseProgressData, error: phraseProgressError } =
      await supabase
        .from("user_phrase_progress")
        .select("lesson_id, pronunciation_completed")
        .eq("profile_id", user.id)
        .in("lesson_id", lessonIds);

    if (progressError) {
      console.error("Error fetching user progress:", progressError.message);
    }
    if (phraseProgressError) {
      console.error(
        "Error fetching phrase progress:",
        phraseProgressError.message
      );
    }

    // 4. Create maps for easy lookup
    const activityProgressMap = new Map<
      number,
      { pronunciationCompleted: boolean }
    >();
    if (progressData) {
      for (const progress of progressData) {
        const lessonId = progress.user_lesson_progress[0]?.lesson_id;
        if (lessonId && !activityProgressMap.has(lessonId)) {
          activityProgressMap.set(lessonId, { pronunciationCompleted: false });
        }
        if (
          lessonId &&
          progress.activity_type === "pronunciation" &&
          progress.status === "completed"
        ) {
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
    const formattedLessons: Lesson[] = lessons.map((lesson) => {
      const activityProgress = activityProgressMap.get(lesson.lesson_id);
      const phrasesCompleted = phraseProgressMap.get(lesson.lesson_id) || 0;
      return {
        lesson_id: lesson.lesson_id,
        unit_id: lesson.unit_id,
        lesson_order: lesson.lesson_order,
        total_phrases: lesson.lesson_phrases?.length || 0,
        lesson_title:
          lesson.lesson_translations?.[0]?.lesson_title ||
          `Lesson ${lesson.lesson_order}`,
        is_completed: activityProgress?.pronunciationCompleted || false,
        phrases_completed: phrasesCompleted,
      };
    });

    // 6. Fetch unit details for the breadcrumb
    console.log(`[API] Fetching unit details for unit ${parsedUnitId}`);

    const { data: unitData, error: unitError } = await supabase
      .from("units")
      .select("level, unit_translations!inner(unit_title, language_code)")
      .eq("unit_id", parsedUnitId)
      .eq("unit_translations.language_code", targetLanguage)
      .single();

    if (unitError) {
      console.log("[API] Unit fetch error:", unitError);
    }

    //console.log("[API] Unit data:", unitData);

    const response = {
      lessons: formattedLessons,
      unit: {
        unit_id: unitId,
        level: (unitData as UnitDataFromDB | null)?.level,
        unit_title: (unitData as UnitDataFromDB | null)?.unit_translations[0]
          ?.unit_title,
      },
    };

    //console.log('[API] Returning response:', JSON.stringify(response, null, 2));
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
