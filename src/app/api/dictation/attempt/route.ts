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



const alignSequences = (refWords: string[], userWords: string[]): Array<{ref: string, user: string, similarity: number}> => {
  const dp: number[][] = [];
  const m = refWords.length;
  const n = userWords.length;
  
  // Initialize DP table
  for (let i = 0; i <= m; i++) {
    dp[i] = [];
    for (let j = 0; j <= n; j++) {
      if (i === 0) dp[i][j] = j;
      else if (j === 0) dp[i][j] = i;
      else {
        const match = refWords[i-1] === userWords[j-1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,     // deletion
          dp[i][j-1] + 1,     // insertion
          dp[i-1][j-1] + match // substitution
        );
      }
    }
  }
  
  // Backtrack to find alignment
  const aligned = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const match = refWords[i-1] === userWords[j-1] ? 0 : 1;
      if (dp[i][j] === dp[i-1][j-1] + match) {
        // Match or substitution - use character-level similarity
        const refWord = refWords[i-1];
        const userWord = userWords[j-1];
        const similarity = refWord === userWord ? 100 : 
          parseFloat(((1 - distance(refWord, userWord) / Math.max(refWord.length, userWord.length)) * 100).toFixed(2));
        aligned.unshift({ref: refWord, user: userWord, similarity});
        i--; j--;
      } else if (dp[i][j] === dp[i-1][j] + 1) {
        // Deletion (missing word in user input)
        aligned.unshift({ref: refWords[i-1], user: "", similarity: 0});
        i--;
      } else {
        // Insertion (extra word in user input)
        aligned.unshift({ref: "", user: userWords[j-1], similarity: 0});
        j--;
      }
    } else if (i > 0) {
      // Remaining reference words
      aligned.unshift({ref: refWords[i-1], user: "", similarity: 0});
      i--;
    } else {
      // Remaining user words
      aligned.unshift({ref: "", user: userWords[j-1], similarity: 0});
      j--;
    }
  }
  
  return aligned;
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

    // Calculate character-level similarity for more accurate scoring
    const normalizedRef = normalizeText(reference_text);
    const normalizedUser = normalizeText(written_text);
    
    const refLength = normalizedRef.length;
    const userLength = normalizedUser.length;
    const maxLength = Math.max(refLength, userLength);
    
    let overall_similarity_score = 0;
    if (maxLength > 0) {
      const charDistance = distance(normalizedRef, normalizedUser);
      overall_similarity_score = parseFloat(((1 - charDistance / maxLength) * 100).toFixed(2));
    }
    
    // Generate word-level feedback for UI display
    const refWords = tokenize(reference_text);
    const userWords = tokenize(written_text);
    const alignedWords = alignSequences(refWords, userWords);
    const word_level_feedback = alignedWords.map((alignment, index) => ({
      reference_word: alignment.ref,
      written_word: alignment.user,
      similarity_score: alignment.similarity,
      position_in_phrase: index,
    }));

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

    // Use the centralized process_user_activity function with correct parameter order
    const { data: activityResult, error: activityError } = await supabase
      .rpc("process_user_activity", {
        profile_id_param: user.id,
        lesson_id_param: lesson_id,
        language_code_param: language_code,
        activity_type_param: "dictation",
        phrase_id_param: phrase_id,
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

      // Calculate character-level similarity for this word
      const wordSimilarity = feedback.reference_word && feedback.written_word
        ? parseFloat(((1 - distance(feedback.reference_word, feedback.written_word) / Math.max(feedback.reference_word.length, feedback.written_word.length)) * 100).toFixed(2))
        : feedback.written_word ? 0 : 100; // 0 if wrong word, 100 if exact match
      
      const newOccurrences = (currentSpelling?.total_dictation_occurrences || 0) + 1;
      const newErrorCount = (currentSpelling?.dictation_error_count || 0) + (wordSimilarity < 70 ? 1 : 0);
      const newSumScore = (currentSpelling?.sum_word_similarity_score || 0) + wordSimilarity;
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
          last_word_similarity_score: wordSimilarity,
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
      written_text,
      reference_text,
    });

  } catch (error) {
    console.error("Dictation attempt error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}