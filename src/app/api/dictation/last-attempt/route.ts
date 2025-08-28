import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  const phraseId = searchParams.get("phraseId");

  if (!lessonId || !phraseId) {
    return new NextResponse(
      JSON.stringify({ error: "Missing lessonId or phraseId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

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

    const { data: lastAttempt, error } = await supabase
      .from("dictation_attempts")
      .select("overall_similarity_score, word_level_feedback, written_text, reference_text")
      .eq("profile_id", user.id)
      .eq("lesson_id", parseInt(lessonId))
      .eq("phrase_id", parseInt(phraseId))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch last attempt" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!lastAttempt) {
      return NextResponse.json({ attempt: null });
    }

    return NextResponse.json({
      attempt: {
        overall_similarity_score: lastAttempt.overall_similarity_score,
        word_level_feedback: lastAttempt.word_level_feedback,
        is_correct: lastAttempt.overall_similarity_score >= 70,
        written_text: lastAttempt.written_text,
        reference_text: lastAttempt.reference_text,
      },
    });
  } catch (error) {
    console.error("Last attempt fetch error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}