"use client";

import React from "react";
import { WordResult } from "@/hooks/speech/useRecognitionState";

interface SyllableLevelFeedbackProps {
  words: WordResult[];
}

/**
 * Syllable level feedback component
 */
function SyllableLevelFeedback({ words }: SyllableLevelFeedbackProps) {
  // Filter words that have syllable data
  const wordsWithSyllables = words.filter(
    (word) => word.syllables && word.syllables.length > 0
  );

  if (wordsWithSyllables.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No syllable-level data available for this assessment.
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Syllable-Level Pronunciation Feedback
      </h3>

      <div className="space-y-4">
        {wordsWithSyllables.map((word, wordIndex) => (
          <div key={wordIndex} className="border rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-gray-800 mb-2">
              &quot;{word.word}&quot; (Score: {Math.round(word.accuracyScore)}%)
            </h4>

            <div className="flex flex-wrap gap-2">
              {word.syllables!.map((syllable, syllableIndex) => (
                <div
                  key={syllableIndex}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
                    syllable.accuracyScore
                  )}`}
                >
                  {syllable.syllable} ({Math.round(syllable.accuracyScore)}%)
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SyllableLevelFeedback;
