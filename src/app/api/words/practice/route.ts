import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", session.user.id)
      .single();

    const targetLanguage = profile?.current_target_language_code || "en";

    // Fetch words that need practice
    const { data: wordsNeedingPractice, error } = await supabase
      .from("user_word_pronunciation")
      .select("word_text, average_accuracy_score, last_accuracy_score, total_attempts, error_count")
      .eq("profile_id", session.user.id)
      .eq("language_code", targetLanguage)
      .eq("needs_practice", true)
      .order("last_attempt_at", { ascending: false });

    if (error) {
      console.error("Error fetching words needing practice:", error);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to fetch words needing practice",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json({
      words: wordsNeedingPractice || [],
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