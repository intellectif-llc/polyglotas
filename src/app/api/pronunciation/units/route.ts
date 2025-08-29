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
  activity_type: string;
  status: string;
  user_lesson_progress: {
    lesson_id: number;
    profile_id: string;
    lessons: { unit_id: number };
  };
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

    // 2. Get user's subscription tier to determine required activities
    const { data: userProfile } = await supabase
      .from("student_profiles")
      .select("subscription_tier")
      .eq("profile_id", user.id)
      .single();

    const subscriptionTier = userProfile?.subscription_tier || 'free';
    
    // Define required activities based on subscription tier
    const getRequiredActivities = (tier: string): string[] => {
      switch (tier) {
        case 'free':
          return ['dictation'];
        case 'starter':
          return ['dictation', 'pronunciation'];
        case 'pro':
          return ['dictation', 'pronunciation', 'chat'];
        default:
          return ['dictation'];
      }
    };
    
    const requiredActivities = getRequiredActivities(subscriptionTier);

    // 3. Fetch user progress for all lessons in these units
    const { data: progressData, error: progressError } = await supabase
      .from("user_lesson_activity_progress")
      .select(`
        activity_type,
        status,
        user_lesson_progress!inner(
          lesson_id,
          profile_id,
          lessons!inner(unit_id)
        )
      `)
      .eq("user_lesson_progress.profile_id", user.id)
      .in("user_lesson_progress.lessons.unit_id", unitIds)
      .in("activity_type", requiredActivities);

    if (progressError) {
      console.error(
        "Database error fetching user lesson progress:",
        progressError.message
      );
      // Continue without progress data rather than failing
    }

    // 4. Fetch total lesson counts for each unit
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

    // 5. Create lookup maps for efficient processing
    // Group progress by lesson and unit for tier-aware completion calculation
    const lessonProgressMap = (
      (progressData as unknown as ProgressFromDB[]) || []
    ).reduce((acc, p) => {
      const lessonId = p.user_lesson_progress?.lesson_id;
      const unitId = p.user_lesson_progress?.lessons?.unit_id;
      
      if (lessonId && unitId) {
        if (!acc[lessonId]) {
          acc[lessonId] = { unitId, completedActivities: new Set() };
        }
        
        if (p.status === 'completed') {
          acc[lessonId].completedActivities.add(p.activity_type);
        }
      }
      return acc;
    }, {} as Record<number, { unitId: number; completedActivities: Set<string> }>);
    
    // Calculate completed lessons per unit based on tier requirements
    const progressMap = Object.values(lessonProgressMap).reduce((acc, lesson) => {
      const { unitId, completedActivities } = lesson;
      
      if (!acc[unitId]) {
        acc[unitId] = { completed: 0 };
      }
      
      // Check if all required activities for the user's tier are completed
      const allRequiredCompleted = requiredActivities.every(activity => 
        completedActivities.has(activity)
      );
      
      if (allRequiredCompleted) {
        acc[unitId].completed += 1;
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

    // 6. Combine units with their progress
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
