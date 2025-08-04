import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Define interfaces for the request body, matching client-side structure
interface AssessmentResults {
  recognizedText?: string;
  accuracyScore?: number;
  fluencyScore?: number;
  completenessScore?: number;
  pronScore?: number;
  prosodyScore?: number;
  words?: Array<{
    word: string;
    accuracyScore: number;
    errorType?: string;
  }>;
}

interface SpeechAttemptRequest {
  lessonId: string | number;
  phraseId: string | number;
  referenceText: string;
  assessmentResults: AssessmentResults;
  languageCode?: string;
}

interface ProcessUserActivityResponse {
  new_attempt_id: number;
  phrase_completed: boolean;
  lesson_completed: boolean;
  points_awarded_total: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // 1. Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const profile_id = session.user.id;

    // 2. Parse and validate request body
    let requestBody: SpeechAttemptRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      lessonId,
      phraseId,
      referenceText,
      assessmentResults,
      languageCode,
    } = requestBody;
    const lesson_id = parseInt(String(lessonId), 10);
    const phrase_id = parseInt(String(phraseId), 10);

    if (
      isNaN(lesson_id) ||
      isNaN(phrase_id) ||
      !referenceText ||
      !assessmentResults
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Missing or invalid required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Get user's target language as a fallback
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", profile_id)
      .single();

    const targetLanguage =
      languageCode || profile?.current_target_language_code || "en";

    // 4. Call the database function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc("process_user_activity", {
        profile_id_param: profile_id,
        lesson_id_param: lesson_id,
        phrase_id_param: phrase_id,
        language_code_param: targetLanguage,
        reference_text_param: referenceText,
        recognized_text_param:
          assessmentResults.recognizedText || "Recognition failed",
        accuracy_score_param: assessmentResults.accuracyScore,
        fluency_score_param: assessmentResults.fluencyScore,
        completeness_score_param: assessmentResults.completenessScore,
        pronunciation_score_param: assessmentResults.pronScore,
        prosody_score_param: assessmentResults.prosodyScore,
        phonetic_data_param: assessmentResults,
      })
      .single();

    if (rpcError) {
      console.error("Error calling RPC function:", rpcError);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to process speech attempt",
          details: rpcError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. Return a success response
    const typedRpcData = rpcData as ProcessUserActivityResponse;
    return NextResponse.json({
      success: true,
      attemptId: typedRpcData.new_attempt_id,
      phraseCompleted: typedRpcData.phrase_completed,
      lessonCompleted: typedRpcData.lesson_completed,
      pointsAwarded: typedRpcData.points_awarded_total,
      scores: {
        accuracy: assessmentResults.accuracyScore,
        fluency: assessmentResults.fluencyScore,
        completeness: assessmentResults.completenessScore,
        pronunciation: assessmentResults.pronScore,
        prosody: assessmentResults.prosodyScore,
      },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Unhandled error in speech attempt endpoint:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
