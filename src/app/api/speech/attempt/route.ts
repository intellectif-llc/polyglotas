import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Define interfaces for assessment results
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

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let requestBody: SpeechAttemptRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract and validate data
    const {
      lessonId,
      phraseId,
      referenceText,
      assessmentResults,
      languageCode,
    } = requestBody;
    const lesson_id = parseInt(String(lessonId), 10);
    const phrase_id = parseInt(String(phraseId), 10);
    const profile_id = session.user.id;

    // Validation
    if (
      !lesson_id ||
      isNaN(lesson_id) ||
      !phrase_id ||
      isNaN(phrase_id) ||
      !referenceText ||
      !assessmentResults
    ) {
      return new NextResponse(
        JSON.stringify({ error: "Missing or invalid required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user's target language
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", profile_id)
      .single();

    const targetLanguage =
      languageCode || profile?.current_target_language_code || "en";

    // Extract assessment data
    const recognizedText = assessmentResults?.recognizedText;
    const accuracyScore = assessmentResults?.accuracyScore;
    const fluencyScore = assessmentResults?.fluencyScore;
    const completenessScore = assessmentResults?.completenessScore;
    const pronScore = assessmentResults?.pronScore;
    const prosodyScore = assessmentResults?.prosodyScore;

    // Start transaction-like operations
    console.log("Processing speech attempt for:", {
      profile_id,
      lesson_id,
      phrase_id,
    });

    // 1. Fetch lesson total_phrases
    const { data: lessonInfo, error: lessonError } = await supabase
      .from("lessons")
      .select("total_phrases")
      .eq("lesson_id", lesson_id)
      .single();

    if (lessonError || !lessonInfo) {
      console.error("Error fetching lesson info:", lessonError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to retrieve lesson details" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const total_phrases_in_lesson = lessonInfo.total_phrases;

    // 2. Get the next attempt number
    const { data: maxAttemptData, error: maxAttemptError } = await supabase
      .from("speech_attempts")
      .select("attempt_number")
      .eq("profile_id", profile_id)
      .eq("lesson_id", lesson_id)
      .eq("phrase_id", phrase_id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxAttemptError) {
      console.error("Error determining attempt number:", maxAttemptError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to determine attempt number" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const nextAttemptNumber = (maxAttemptData?.attempt_number || 0) + 1;

    // 3. Prepare speech_attempts data
    const attemptData = {
      profile_id: profile_id,
      lesson_id: lesson_id,
      phrase_id: phrase_id,
      language_code: targetLanguage,
      attempt_number: nextAttemptNumber,
      reference_text: referenceText,
      recognized_text: recognizedText || "Recognition failed",
      accuracy_score: accuracyScore,
      fluency_score: fluencyScore,
      completeness_score: completenessScore,
      pronunciation_score: pronScore,
      prosody_score: prosodyScore,
      phonetic_data: assessmentResults,
    };

    // 4. Insert into speech_attempts
    const { data: insertedAttempt, error: insertError } = await supabase
      .from("speech_attempts")
      .insert(attemptData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting speech attempt:", insertError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to save speech attempt" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Successfully inserted attempt:", insertedAttempt);
    const newAttemptId = insertedAttempt.attempt_id;

    // 5. Update user_phrase_progress (Upsert)
    const { data: currentPhraseProgress, error: fetchPhraseError } =
      await supabase
        .from("user_phrase_progress")
        .select(
          "pronunciation_attempts, best_accuracy_score, best_fluency_score, best_completeness_score, best_pronunciation_score, best_prosody_score, is_completed"
        )
        .eq("profile_id", profile_id)
        .eq("lesson_id", lesson_id)
        .eq("phrase_id", phrase_id)
        .maybeSingle();

    if (fetchPhraseError) {
      console.error(
        "Error fetching current phrase progress:",
        fetchPhraseError
      );
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch existing phrase progress" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const nextPronunciationAttemptNum =
      (currentPhraseProgress?.pronunciation_attempts || 0) + 1;

    // Determine if this attempt marks the phrase as completed (based on pronunciation)
    const is_now_completed =
      (accuracyScore && accuracyScore >= 70) ||
      currentPhraseProgress?.is_completed ||
      false;

    const bestAccuracy = Math.max(
      currentPhraseProgress?.best_accuracy_score || 0,
      accuracyScore || 0
    );
    const bestFluency = Math.max(
      currentPhraseProgress?.best_fluency_score || 0,
      fluencyScore || 0
    );
    const bestCompleteness = Math.max(
      currentPhraseProgress?.best_completeness_score || 0,
      completenessScore || 0
    );
    const bestPronunciation = Math.max(
      currentPhraseProgress?.best_pronunciation_score || 0,
      pronScore || 0
    );
    const bestProsody = Math.max(
      currentPhraseProgress?.best_prosody_score || 0,
      prosodyScore || 0
    );

    const nowISO = new Date().toISOString();

    const phraseUpsertPayload = {
      profile_id: profile_id,
      lesson_id: lesson_id,
      phrase_id: phrase_id,
      language_code: targetLanguage,
      is_completed: is_now_completed,
      pronunciation_completed: is_now_completed,
      pronunciation_attempts: nextPronunciationAttemptNum,
      pronunciation_last_attempt_at: nowISO,
      best_accuracy_score: bestAccuracy,
      best_fluency_score: bestFluency,
      best_completeness_score: bestCompleteness,
      best_pronunciation_score: bestPronunciation,
      best_prosody_score: bestProsody,
      last_progress_at: nowISO,
    };

    // Check if record exists first, then update or insert accordingly
    const { data: existingProgress } = await supabase
      .from("user_phrase_progress")
      .select("phrase_progress_id")
      .eq("profile_id", profile_id)
      .eq("lesson_id", lesson_id)
      .eq("phrase_id", phrase_id)
      .maybeSingle();

    let phraseProgressError = null;
    if (existingProgress) {
      // Update existing record
      const { error } = await supabase
        .from("user_phrase_progress")
        .update(phraseUpsertPayload)
        .eq("phrase_progress_id", existingProgress.phrase_progress_id);
      phraseProgressError = error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from("user_phrase_progress")
        .insert(phraseUpsertPayload);
      phraseProgressError = error;
    }

    if (phraseProgressError) {
      console.error("Error upserting phrase progress:", phraseProgressError);
      return new NextResponse(
        JSON.stringify({
          error: "Failed to update phrase pronunciation progress",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 6. Update user_lesson_progress
    const { data: completedPhraseCountData, error: countError } = await supabase
      .from("user_phrase_progress")
      .select("*", { count: "exact" })
      .eq("profile_id", profile_id)
      .eq("lesson_id", lesson_id)
      .eq("is_completed", true);

    let phrases_completed_in_lesson = 0;
    if (countError) {
      console.error("Error counting completed phrases:", countError);
    } else {
      phrases_completed_in_lesson = completedPhraseCountData?.length || 0;
    }

    const lesson_is_now_completed =
      phrases_completed_in_lesson >= total_phrases_in_lesson;

    // Upsert lesson progress
    const lessonUpsertPayload = {
      profile_id: profile_id,
      lesson_id: lesson_id,
      phrases_completed: phrases_completed_in_lesson,
      is_completed: lesson_is_now_completed,
      last_progress_at: nowISO,
      ...(lesson_is_now_completed && !currentPhraseProgress?.is_completed
        ? { completed_at: nowISO }
        : {}),
    };

    // Check if lesson progress record exists first
    const { data: existingLessonProgress } = await supabase
      .from("user_lesson_progress")
      .select("progress_id")
      .eq("profile_id", profile_id)
      .eq("lesson_id", lesson_id)
      .maybeSingle();

    let lessonProgressError = null;
    if (existingLessonProgress) {
      // Update existing record
      const { error } = await supabase
        .from("user_lesson_progress")
        .update(lessonUpsertPayload)
        .eq("progress_id", existingLessonProgress.progress_id);
      lessonProgressError = error;
    } else {
      // Insert new record
      const { error } = await supabase
        .from("user_lesson_progress")
        .insert(lessonUpsertPayload);
      lessonProgressError = error;
    }

    if (lessonProgressError) {
      console.error("Error upserting lesson progress:", lessonProgressError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to update lesson progress" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      attemptId: newAttemptId,
      scores: {
        accuracy: accuracyScore,
        fluency: fluencyScore,
        completeness: completenessScore,
        pronunciation: pronScore,
        prosody: prosodyScore,
      },
      phraseCompleted: is_now_completed,
      lessonCompleted: lesson_is_now_completed,
      phrasesCompletedInLesson: phrases_completed_in_lesson,
      totalPhrasesInLesson: total_phrases_in_lesson,
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Unhandled error in postSpeechAttempt:", err);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
