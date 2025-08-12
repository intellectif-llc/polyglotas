import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface WordPracticeRequest {
  wordText: string;
  accuracyScore: number;
  languageCode?: string;
}

interface WordPracticeResponse {
  success: boolean;
  word_completed: boolean;
  new_average_score: number;
  total_attempts: number;
  points_awarded: number;
  needs_practice: boolean;
}

export async function POST(request: NextRequest) {
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

    let requestBody: WordPracticeRequest;
    try {
      requestBody = await request.json();
    } catch {
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
      .eq("profile_id", user.id)
      .single();

    const targetLanguage =
      languageCode || profile?.current_target_language_code || "en";

    console.log(
      `🎯 Processing word practice attempt for "${wordText}" with score: ${accuracyScore}%`
    );

    // Use the proper database function for word practice
    const { data: rpcData, error: rpcError } = await supabase
      .rpc("process_word_practice_attempt", {
        profile_id_param: user.id,
        word_text_param: wordText,
        language_code_param: targetLanguage,
        accuracy_score_param: accuracyScore,
      })
      .single();

    if (rpcError) {
      console.error("❌ Error calling word practice RPC function:", rpcError);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to process word practice attempt",
          details: rpcError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const typedRpcData = rpcData as WordPracticeResponse;

    console.log(`✅ Word practice processed successfully:`, {
      word: wordText,
      completed: typedRpcData.word_completed,
      averageScore: typedRpcData.new_average_score,
      needsPractice: typedRpcData.needs_practice,
      pointsAwarded: typedRpcData.points_awarded,
    });

    return NextResponse.json({
      success: true,
      wordCompleted: typedRpcData.word_completed,
      newAverageScore: typedRpcData.new_average_score,
      totalAttempts: typedRpcData.total_attempts,
      pointsAwarded: typedRpcData.points_awarded,
      needsPractice: typedRpcData.needs_practice,
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
