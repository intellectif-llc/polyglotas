"use client";

import React, { useState } from "react";
import { WordResult } from "@/hooks/speech/useRecognitionState";

interface PhonemeLevelFeedbackProps {
  words: WordResult[];
}

/**
 * Component for displaying phoneme-level feedback in IPA
 */
function PhonemeLevelFeedback({ words }: PhonemeLevelFeedbackProps) {
  // State to track if the IPA info is expanded
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  // Filter out words without phonemes for phoneme display
  const displayWords = words.filter((word) => word.phonemes && word.phonemes.length > 0);

  // Helper function to determine phoneme styling based on score
  const getPhonemeStyle = (score: number | undefined) => {
    if (score === undefined) return "text-gray-500"; // Handle undefined scores
    if (score >= 85) return "text-green-400"; // High accuracy
    if (score >= 60) return "text-yellow-400"; // Medium accuracy
    return "text-red-400 font-semibold"; // Low accuracy
  };

  return (
    <div className="p-6 rounded-b-lg" style={{ backgroundColor: "#021016" }}>
      <h3 className="text-lg font-semibold mb-4 text-white">
        Phoneme Feedback (IPA)
        <button
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="ml-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"
        >
          {isInfoExpanded ? "Hide Info" : "What is IPA?"}
        </button>
      </h3>

      {/* Collapsible information section */}
      {isInfoExpanded && (
        <div className="mb-4 text-sm text-gray-300 bg-gray-800 p-4 rounded border border-gray-700 transition-all">
          <h4 className="font-medium text-blue-300 mb-1">
            About IPA Phonemes:
          </h4>
          <p>
            International Phonetic Alphabet (IPA) symbols represent the actual
            sounds of speech rather than the written letters. Each symbol
            represents a specific sound used in spoken language, allowing
            precise analysis of pronunciation across different languages. The
            colors indicate pronunciation accuracy for each individual sound.
          </p>
        </div>
      )}

      {displayWords.some(
        (word) => word.phonemes?.length && word.phonemes.length > 0
      ) ? (
        <div className="text-2xl text-center font-mono bg-gray-800 p-6 rounded-lg break-words leading-relaxed border border-gray-700">
          {displayWords.map((wordData, wordIndex) => {
            // Convert phonemes array to correct format if needed
            const phonemes = wordData.phonemes || [];

            if (phonemes.length === 0) return null;

            return (
              <React.Fragment key={`word-${wordIndex}`}>
                {/* Group phonemes by word */}
                <span className="px-2 mx-1 border-b-2 border-gray-600 inline-flex gap-1">
                  {phonemes.map((phonemeData, phonemeIndex) => {
                    const score = phonemeData.accuracyScore;
                    const phonemeSymbol = phonemeData.phoneme;

                    if (!phonemeSymbol) return null;

                    return (
                      <span
                        key={`phoneme-${wordIndex}-${phonemeIndex}`}
                        className={`${getPhonemeStyle(
                          score
                        )} hover:bg-gray-700 rounded px-1 py-0.5 transition-colors cursor-help`}
                        title={`${phonemeSymbol}: ${
                          score !== undefined ? score + "%" : "N/A"
                        }`}
                      >
                        {phonemeSymbol}
                      </span>
                    );
                  })}
                </span>
                {/* Add space between words */}
                {wordIndex <
                  displayWords.filter(
                    (w) => w.phonemes?.length && w.phonemes.length > 0
                  ).length -
                    1 && <span className="mx-2 text-gray-500">·</span>}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-gray-400 py-4">
          No phoneme data available for this assessment.
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

export default PhonemeLevelFeedback;
