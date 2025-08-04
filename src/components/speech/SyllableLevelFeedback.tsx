"use client";

import React from "react";
import { WordResult } from "@/hooks/speech/useRecognitionState";

interface SyllableLevelFeedbackProps {
  words: WordResult[];
}

/**
 * Component for displaying syllable-level feedback
 */
function SyllableLevelFeedback({ words }: SyllableLevelFeedbackProps) {
  // Filter out words with no syllables
  const wordsWithSyllables = words.filter(
    (word) => word.syllables?.length && word.syllables.length > 0
  );

  // Helper function to determine styling based on score
  const getSyllableStyle = (score: number | undefined) => {
    if (score === undefined) return "text-gray-500"; // Handle undefined scores
    if (score >= 85) return "text-green-700 bg-green-50"; // High accuracy
    if (score >= 60) return "text-yellow-600 bg-yellow-50"; // Medium accuracy
    return "text-red-700 bg-red-50"; // Low accuracy
  };

  return (
    <div className="p-6 rounded-b-lg" style={{ backgroundColor: "#021016" }}>
      <h3 className="text-lg font-semibold mb-4 text-white">
        Syllable Breakdown
      </h3>

      {wordsWithSyllables.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-3 p-3 bg-gray-800 rounded">
          {wordsWithSyllables.map((wordData, wordIndex) => (
            <div
              key={`syllable-word-${wordIndex}`}
              className="border border-gray-700 rounded px-3 py-2 bg-gray-900 shadow-sm"
            >
              <div className="text-sm font-medium mb-2 text-gray-300 border-b border-gray-700 pb-1">
                {wordData.word}
              </div>
              <div className="flex flex-wrap gap-1">
                {(wordData.syllables || []).map((syllable, syllableIndex) => {
                  const score = syllable.accuracyScore;
                  const syllableText = syllable.syllable;

                  return (
                    <div
                      key={`syl-${wordIndex}-${syllableIndex}`}
                      className={`px-2 py-1 rounded text-sm ${getSyllableStyle(
                        score
                      )}`}
                      title={`Score: ${
                        score !== undefined ? score + "%" : "N/A"
                      }`}
                    >
                      <span className="font-medium">{syllableText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-4">
          No syllable data available for this assessment.
        </p>
      )}

      {/* Legend */}
      <div className="mt-6 border-t border-gray-800 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>
            <span className="text-gray-300">Good (85%+)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
            <span className="text-gray-300">Fair (60-84%)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-2"></span>
            <span className="text-gray-300">Needs Work (0-59%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SyllableLevelFeedback;
