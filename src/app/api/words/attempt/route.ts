import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface WordPracticeRequest {
  wordText: string;
  accuracyScore: number;
  languageCode?: string;
}

export async function POST(request: NextRequest) {
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

    let requestBody: WordPracticeRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { wordText, accuracyScore, languageCode } = requestBody;

    if (!wordText || accuracyScore === undefined) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", session.user.id)
      .single();

    const targetLanguage = languageCode || profile?.current_target_language_code || "en";

    // Get current word data
    const { data: currentWord } = await supabase
      .from("user_word_pronunciation")
      .select("*")
      .eq("profile_id", session.user.id)
      .eq("word_text", wordText)
      .eq("language_code", targetLanguage)
      .single();

    if (!currentWord) {
      return new NextResponse(
        JSON.stringify({ error: "Word not found in practice list" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update word pronunciation data
    const newTotalAttempts = currentWord.total_attempts + 1;
    const newSumAccuracyScore = currentWord.sum_accuracy_score + accuracyScore;
    const newAverageAccuracyScore = newSumAccuracyScore / newTotalAttempts;
    
    // Determine if word still needs practice (threshold: 85% accuracy)
    const needsPractice = newAverageAccuracyScore < 85;

    const { error: updateError } = await supabase
      .from("user_word_pronunciation")
      .update({
        total_attempts: newTotalAttempts,
        sum_accuracy_score: newSumAccuracyScore,
        average_accuracy_score: newAverageAccuracyScore,
        last_accuracy_score: accuracyScore,
        last_attempt_at: new Date().toISOString(),
        needs_practice: needsPractice,
        last_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentWord.id);

    if (updateError) {
      console.error("Error updating word pronunciation:", updateError);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to update word practice data",
          details: updateError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json({
      success: true,
      wordCompleted: !needsPractice,
      newAverageScore: Math.round(newAverageAccuracyScore),
      totalAttempts: newTotalAttempts,
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