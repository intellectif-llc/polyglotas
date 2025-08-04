"use client";

import React, { useMemo } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTrophy,
  FaStar,
} from "react-icons/fa";
import {
  AssessmentResults,
  WordResult,
} from "@/hooks/speech/useRecognitionState";

// Score thresholds for feedback categories
const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  AVERAGE: 70,
  BELOW_AVERAGE: 60,
  POOR: 0,
};

// Word score threshold to consider it problematic
const PROBLEMATIC_WORD_THRESHOLD = 60;

// Varied feedback messages for different score categories
const FEEDBACK_MESSAGES = {
  excellent: [
    "Wow! Your pronunciation is excellent. You sound like a native speaker!",
    "Outstanding job! Your pronunciation is nearly perfect.",
    "Incredible pronunciation skills! You've mastered these sounds.",
    "Exceptional work! Your pronunciation is right on target.",
  ],
  good: [
    "Great job! Your pronunciation is very good.",
    "Well done! Your speech is clear and accurate.",
    "Nice work! Your pronunciation skills are strong.",
    "Impressive! Your pronunciation is very natural and fluid.",
  ],
  average: [
    "Good effort! Your pronunciation is clear and understandable.",
    "You're doing well! Keep practicing to improve further.",
    "Solid pronunciation! With more practice, you'll continue to improve.",
    "Good work! Your pronunciation is developing nicely.",
  ],
  below_average: [
    "Keep practicing! Your pronunciation needs some improvement.",
    "You're making progress! Focus on the specific sounds highlighted below.",
    "Continued practice will help improve your pronunciation.",
    "You're on the right track. Let's focus on some specific sounds.",
  ],
  poor: [
    "Don't worry! With more practice, your pronunciation will improve.",
    "Practice makes perfect! Let's focus on some key sounds to work on.",
    "Everyone starts somewhere! Focus on the highlighted areas for improvement.",
    "Pronunciation takes time. Keep practicing the sounds below.",
  ],
};

// Random select from array with seed to keep message consistent per session
const getRandomMessage = (array: string[], seed: number): string => {
  const index = seed % array.length;
  return array[index];
};

// Find problematic words and potential phrases
const findProblematicWords = (words: WordResult[]) => {
  if (!words || !words.length) return { problematicWords: [], phrases: [] };

  // Filter words with low accuracy scores
  const problematicWords = words.filter(
    (word) =>
      word.accuracyScore !== undefined &&
      word.accuracyScore < PROBLEMATIC_WORD_THRESHOLD
  );

  // Sort by accuracy score (ascending)
  problematicWords.sort(
    (a, b) => (a.accuracyScore || 0) - (b.accuracyScore || 0)
  );

  // Find consecutive problematic words to create phrases
  const phrases: Array<{
    text: string;
    averageScore: number;
    words: WordResult[];
  }> = [];
  let currentPhrase: WordResult[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (
      word.accuracyScore !== undefined &&
      word.accuracyScore < PROBLEMATIC_WORD_THRESHOLD
    ) {
      currentPhrase.push(word);
    } else if (currentPhrase.length > 0) {
      if (currentPhrase.length > 1) {
        // Add the phrase to our phrases array
        phrases.push({
          text: currentPhrase.map((w) => w.word).join(" "),
          averageScore:
            currentPhrase.reduce((sum, w) => sum + (w.accuracyScore || 0), 0) /
            currentPhrase.length,
          words: currentPhrase,
        });
      }
      currentPhrase = [];
    }
  }

  // Don't forget the last phrase if it ends with problematic words
  if (currentPhrase.length > 1) {
    phrases.push({
      text: currentPhrase.map((w) => w.word).join(" "),
      averageScore:
        currentPhrase.reduce((sum, w) => sum + (w.accuracyScore || 0), 0) /
        currentPhrase.length,
      words: currentPhrase,
    });
  }

  // Sort phrases by average score
  phrases.sort((a, b) => a.averageScore - b.averageScore);

  return { problematicWords, phrases };
};

// Find problematic phonemes within a word
const findProblematicPhonemes = (word: WordResult) => {
  const problematicPhonemes: Array<{
    symbol: string;
    score: number;
  }> = [];

  // Check phonemes directly on the word
  if (word.phonemes) {
    for (const phoneme of word.phonemes) {
      if (phoneme.accuracyScore < PROBLEMATIC_WORD_THRESHOLD) {
        problematicPhonemes.push({
          symbol: phoneme.phoneme,
          score: phoneme.accuracyScore,
        });
      }
    }
  }

  // Check phonemes in syllables
  if (word.syllables) {
    for (const syllable of word.syllables) {
      if (syllable.phonemes) {
        for (const phoneme of syllable.phonemes) {
          if (phoneme.accuracyScore < PROBLEMATIC_WORD_THRESHOLD) {
            problematicPhonemes.push({
              symbol: phoneme.phoneme,
              score: phoneme.accuracyScore,
            });
          }
        }
      }
    }
  }

  // Sort by score (lowest first) and remove duplicates
  return problematicPhonemes
    .filter(
      (phoneme, index, self) =>
        index === self.findIndex((p) => p.symbol === phoneme.symbol)
    )
    .sort((a, b) => a.score - b.score);
};

interface FeedbackMessageProps {
  results: AssessmentResults;
}

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ results }) => {
  const feedback = useMemo(() => {
    if (!results) return null;

    const { pronScore = 0, words = [] } = results;

    // Calculate weighted overall score (similar to sample project)
    const overallScore = pronScore;

    // Use the overall score as a seed for message selection
    const messageSeed = Math.floor(overallScore);

    // Find problematic words/phrases
    const { problematicWords, phrases } = findProblematicWords(words);

    // Determine feedback category
    let category: keyof typeof FEEDBACK_MESSAGES;
    let icon: React.ReactNode;
    let colorClass: string;

    if (overallScore >= SCORE_THRESHOLDS.EXCELLENT) {
      category = "excellent";
      icon = <FaTrophy className="text-2xl" />;
      colorClass = "text-green-600 bg-green-50 border-green-200";
    } else if (overallScore >= SCORE_THRESHOLDS.GOOD) {
      category = "good";
      icon = <FaStar className="text-2xl" />;
      colorClass = "text-green-600 bg-green-50 border-green-200";
    } else if (overallScore >= SCORE_THRESHOLDS.AVERAGE) {
      category = "average";
      icon = <FaCheckCircle className="text-2xl" />;
      colorClass = "text-blue-600 bg-blue-50 border-blue-200";
    } else if (overallScore >= SCORE_THRESHOLDS.BELOW_AVERAGE) {
      category = "below_average";
      icon = <FaInfoCircle className="text-2xl" />;
      colorClass = "text-amber-600 bg-amber-50 border-amber-200";
    } else {
      category = "poor";
      icon = <FaExclamationTriangle className="text-2xl" />;
      colorClass = "text-red-600 bg-red-50 border-red-200";
    }

    // Select a varied message based on category
    const message = getRandomMessage(FEEDBACK_MESSAGES[category], messageSeed);

    // Add specific advice for problematic words/phrases
    let specificAdvice = "";
    let phonemeAdvice = "";

    if (
      phrases.length > 0 &&
      (category === "below_average" || category === "poor")
    ) {
      // Use the lowest-scoring phrase for feedback
      const worstPhrase = phrases[0];
      specificAdvice = `Try focusing on the phrase "${worstPhrase.text}" which was difficult to pronounce.`;

      // Check for problematic phonemes in the first word of the phrase
      const problemWord = worstPhrase.words[0];
      const problemPhonemes = findProblematicPhonemes(problemWord);

      if (problemPhonemes.length > 0) {
        const phoneme = problemPhonemes[0].symbol;
        phonemeAdvice = `Pay attention to the '${phoneme}' sound in "${problemWord.word}".`;
      }
    } else if (
      problematicWords.length > 0 &&
      (category === "below_average" || category === "poor")
    ) {
      // Use the worst-pronounced word
      const worstWord = problematicWords[0];
      specificAdvice = `Try paying special attention to the word "${worstWord.word}" next time.`;

      // Check for problematic phonemes
      const problemPhonemes = findProblematicPhonemes(worstWord);

      if (problemPhonemes.length > 0) {
        const phoneme = problemPhonemes[0].symbol;
        phonemeAdvice = `Focus on the '${phoneme}' sound which was challenging.`;
      }
    }

    return {
      category,
      message,
      specificAdvice,
      phonemeAdvice,
      icon,
      colorClass,
      score: Math.round(overallScore),
    };
  }, [results]);

  if (!feedback) return null;

  return (
    <div
      className={`p-4 rounded-lg border ${feedback.colorClass} flex items-start gap-3 mb-4`}
    >
      <div className="mt-1 flex-shrink-0">{feedback.icon}</div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <p className="font-medium">{feedback.message}</p>
          <span className="text-lg font-bold ml-2 flex-shrink-0">
            {feedback.score}%
          </span>
        </div>
        {feedback.specificAdvice && (
          <p className="mt-1">{feedback.specificAdvice}</p>
        )}
        {feedback.phonemeAdvice && (
          <p className="mt-1 text-sm italic">{feedback.phonemeAdvice}</p>
        )}
      </div>
    </div>
  );
};

export default FeedbackMessage;
