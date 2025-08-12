import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId");
    const phraseId = searchParams.get("phraseId");

    if (!lessonId || !phraseId) {
      return new NextResponse(
        JSON.stringify({ error: "Missing lessonId or phraseId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const lesson_id = parseInt(lessonId, 10);
    const phrase_id = parseInt(phraseId, 10);
    const profile_id = user.id;

    if (isNaN(lesson_id) || isNaN(phrase_id)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid lessonId or phraseId" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the last speech attempt
    const { data: lastAttempt, error } = await supabase
      .from("speech_attempts")
      .select("*")
      .eq("profile_id", profile_id)
      .eq("lesson_id", lesson_id)
      .eq("phrase_id", phrase_id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching last speech attempt:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch last speech attempt" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!lastAttempt) {
      return NextResponse.json({ attempt: null });
    }

    // Convert the attempt data to AssessmentResults format
    const assessmentResults = {
      accuracyScore: lastAttempt.accuracy_score || 0,
      fluencyScore: lastAttempt.fluency_score || 0,
      completenessScore: lastAttempt.completeness_score || 0,
      prosodyScore: lastAttempt.prosody_score || 0,
      pronScore: lastAttempt.pronunciation_score || 0,
      words: lastAttempt.phonetic_data?.words || [],
      recognizedText: lastAttempt.recognized_text || "",
      referenceText: lastAttempt.reference_text || "",
      isScripted: true,
    };

    return NextResponse.json({
      attempt: {
        attemptId: lastAttempt.attempt_id,
        attemptNumber: lastAttempt.attempt_number,
        createdAt: lastAttempt.created_at,
        assessmentResults,
      },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Unhandled error in getLastSpeechAttempt:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
