import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import { distance } from "fastest-levenshtein";

const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .replace(/what's/g, "what is")
    .replace(/you're/g, "you are")
    .replace(/i'm/g, "i am")
    .replace(/he's/g, "he is")
    .replace(/she's/g, "she is")
    .replace(/it's/g, "it is")
    .replace(/we're/g, "we are")
    .replace(/they're/g, "they are")
    .replace(/don't/g, "do not")
    .replace(/doesn't/g, "does not")
    .replace(/won't/g, "will not")
    .replace(/can't/g, "cannot")
    .replace(/isn't/g, "is not")
    .replace(/aren't/g, "are not")
    .replace(/wasn't/g, "was not")
    .replace(/weren't/g, "were not")
    .trim();
};

const tokenize = (text: string): string[] => {
  const normalized = normalizeText(text);
  return normalized.split(/\s+/).filter((w) => w.length > 0);
};

const calculateWordSimilarity = (word1: string, word2: string): number => {
  if (word1 === word2) return 100;
  if (!word1 || !word2) return 0;
  
  const maxLength = Math.max(word1.length, word2.length);
  const levenshteinDist = distance(word1, word2);
  return Math.max(0, (1 - levenshteinDist / maxLength) * 100);
};

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

    const { lesson_id, phrase_id, written_text, language_code } = await request.json();

    if (!lesson_id || !phrase_id || written_text === undefined || !language_code) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch reference phrase text
    const { data: phraseData, error: phraseFetchError } = await supabase
      .from("vocabulary_phrases")
      .select(`
        phrase_versions!inner(phrase_text)
      `)
      .eq("id", phrase_id)
      .eq("phrase_versions.language_code", language_code)
      .single();

    if (phraseFetchError || !phraseData) {
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch reference phrase" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const reference_text = phraseData.phrase_versions[0]?.phrase_text;
    if (!reference_text) {
      return new NextResponse(
        JSON.stringify({ error: "Reference text not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate similarity scores with improved logic
    const refWords = tokenize(reference_text);
    const userWords = tokenize(written_text);
    const word_level_feedback = [];
    let totalWordSimilaritySum = 0;
    let matchedWordCount = 0;

    const maxLength = Math.max(refWords.length, userWords.length);
    for (let i = 0; i < maxLength; i++) {
      const refWord = refWords[i] || "";
      const userWord = userWords[i] || "";
      const similarity = calculateWordSimilarity(refWord, userWord);

      word_level_feedback.push({
        reference_word: refWord,
        written_word: userWord,
        similarity_score: similarity,
        position_in_phrase: i,
      });

      if (refWords[i]) {
        totalWordSimilaritySum += similarity;
        matchedWordCount++;
      }
    }

    const overall_similarity_score = matchedWordCount > 0
      ? parseFloat((totalWordSimilaritySum / matchedWordCount).toFixed(2))
      : 0;

    // Get next attempt number
    const { data: maxAttemptData } = await supabase
      .from("dictation_attempts")
      .select("attempt_number")
      .eq("profile_id", user.id)
      .eq("lesson_id", lesson_id)
      .eq("phrase_id", phrase_id)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextAttemptNumber = (maxAttemptData?.attempt_number || 0) + 1;

    // Insert dictation attempt
    const { error: insertError } = await supabase
      .from("dictation_attempts")
      .insert({
        profile_id: user.id,
        lesson_id,
        phrase_id,
        language_code,
        attempt_number: nextAttemptNumber,
        reference_text,
        written_text,
        overall_similarity_score,
        word_level_feedback,
      });

    if (insertError) {
      return new NextResponse(
        JSON.stringify({ error: "Failed to save dictation attempt" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use the centralized process_user_activity function
    const { data: activityResult, error: activityError } = await supabase
      .rpc("process_user_activity", {
        profile_id_param: user.id,
        lesson_id_param: lesson_id,
        phrase_id_param: phrase_id,
        language_code_param: language_code,
        activity_type_param: "dictation",
        reference_text_param: reference_text,
        written_text_param: written_text,
        overall_similarity_score_param: overall_similarity_score,
        word_level_feedback_param: word_level_feedback,
      });

    if (activityError) {
      console.error("Error processing user activity:", activityError);
    }

    // Update user_word_spelling for each word
    for (const feedback of word_level_feedback) {
      if (!feedback.reference_word) continue;

      // Get current stats
      const { data: currentSpelling } = await supabase
        .from("user_word_spelling")
        .select("total_dictation_occurrences, dictation_error_count, sum_word_similarity_score")
        .eq("profile_id", user.id)
        .eq("word_text", feedback.reference_word)
        .eq("language_code", language_code)
        .maybeSingle();

      const newOccurrences = (currentSpelling?.total_dictation_occurrences || 0) + 1;
      const newErrorCount = (currentSpelling?.dictation_error_count || 0) + (feedback.similarity_score < 70 ? 1 : 0);
      const newSumScore = (currentSpelling?.sum_word_similarity_score || 0) + feedback.similarity_score;
      const newAverage = newSumScore / newOccurrences;

      const { error: spellingError } = await supabase
        .from("user_word_spelling")
        .upsert({
          profile_id: user.id,
          word_text: feedback.reference_word,
          language_code,
          total_dictation_occurrences: newOccurrences,
          dictation_error_count: newErrorCount,
          sum_word_similarity_score: newSumScore,
          average_word_similarity_score: parseFloat(newAverage.toFixed(2)),
          last_word_similarity_score: feedback.similarity_score,
          last_dictation_attempt_at: new Date().toISOString(),
          needs_spelling_practice: newAverage < 70 || (newOccurrences > 2 && newErrorCount / newOccurrences > 0.3),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "profile_id, word_text, language_code",
        });

      if (spellingError) {
        console.error(`Error updating word spelling for '${feedback.reference_word}':`, spellingError);
      }
    }

    const isDictationCorrect = overall_similarity_score >= 70;
    const pointsAwarded = activityResult?.[0]?.points_awarded_total || 0;

    return NextResponse.json({
      overall_similarity_score,
      word_level_feedback,
      is_correct: isDictationCorrect,
      points_awarded: pointsAwarded,
    });

  } catch (error) {
    console.error("Dictation attempt error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}