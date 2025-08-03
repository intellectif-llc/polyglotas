"use client";

import React from "react";
import { WordResult } from "@/hooks/speech/useRecognitionState";

interface PhonemeLevelFeedbackProps {
  words: WordResult[];
}

/**
 * Phoneme level feedback component
 */
function PhonemeLevelFeedback({ words }: PhonemeLevelFeedbackProps) {
  // Collect all phonemes from all words
  const allPhonemes: Array<{
    phoneme: string;
    score: number;
    word: string;
  }> = [];

  words.forEach((word) => {
    // Check phonemes directly on the word
    if (word.phonemes) {
      word.phonemes.forEach((phoneme) => {
        allPhonemes.push({
          phoneme: phoneme.phoneme,
          score: phoneme.accuracyScore,
          word: word.word,
        });
      });
    }

    // Check phonemes in syllables
    if (word.syllables) {
      word.syllables.forEach((syllable) => {
        if (syllable.phonemes) {
          syllable.phonemes.forEach((phoneme) => {
            allPhonemes.push({
              phoneme: phoneme.phoneme,
              score: phoneme.accuracyScore,
              word: word.word,
            });
          });
        }
      });
    }
  });

  if (allPhonemes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No phoneme-level data available for this assessment.
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  // Group phonemes by word for better organization
  const phonesByWord: {
    [word: string]: Array<{ phoneme: string; score: number }>;
  } = {};
  allPhonemes.forEach((item) => {
    if (!phonesByWord[item.word]) {
      phonesByWord[item.word] = [];
    }
    phonesByWord[item.word].push({
      phoneme: item.phoneme,
      score: item.score,
    });
  });

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Phoneme-Level Pronunciation Feedback
      </h3>

      <div className="space-y-4">
        {Object.entries(phonesByWord).map(([word, phonemes]) => (
          <div key={word} className="border rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-gray-800 mb-3">
              &quot;{word}&quot;
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {phonemes.map((phoneme, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 rounded border text-center text-sm font-mono ${getScoreColor(
                    phoneme.score
                  )}`}
                >
                  <div className="font-semibold">{phoneme.phoneme}</div>
                  <div className="text-xs">{Math.round(phoneme.score)}%</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Show problematic phonemes */}
      <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <h4 className="font-semibold text-red-800 mb-2">
          Phonemes Needing Practice (&lt;70%)
        </h4>
        <div className="flex flex-wrap gap-2">
          {allPhonemes
            .filter((p) => p.score < 70)
            .map((phoneme, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-mono border border-red-300"
              >
                {phoneme.phoneme} ({Math.round(phoneme.score)}%)
              </span>
            ))}
        </div>
        {allPhonemes.filter((p) => p.score < 70).length === 0 && (
          <p className="text-red-700">
            Great job! No problematic phonemes detected.
          </p>
        )}
      </div>
    </div>
  );
}

export default PhonemeLevelFeedback;
