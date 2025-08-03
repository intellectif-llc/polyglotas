"use client";

import React from "react";
import { WordResult } from "@/hooks/speech/useRecognitionState";

interface ScoreTooltipProps {
  word: WordResult;
  onClose: () => void;
}

/**
 * Tooltip component for displaying detailed word information on hover
 */
function ScoreTooltip({ word, onClose }: ScoreTooltipProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="absolute z-10 mt-2 p-3 bg-white border border-gray-300 rounded-lg shadow-lg max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800">&quot;{word.word}&quot;</h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 ml-2"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Accuracy Score:</span>
          <span
            className={`font-semibold ${getScoreColor(word.accuracyScore)}`}
          >
            {Math.round(word.accuracyScore)}%
          </span>
        </div>

        {word.errorType && word.errorType !== "None" && (
          <div className="flex justify-between">
            <span>Error Type:</span>
            <span className="font-semibold text-red-600">{word.errorType}</span>
          </div>
        )}

        {word.syllables && word.syllables.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-gray-700 mb-1">Syllables:</div>
            <div className="space-y-1">
              {word.syllables.map((syllable, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>&quot;{syllable.syllable}&quot;</span>
                  <span className={getScoreColor(syllable.accuracyScore)}>
                    {Math.round(syllable.accuracyScore)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {word.phonemes && word.phonemes.length > 0 && (
          <div className="mt-2">
            <div className="font-medium text-gray-700 mb-1">Phonemes:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {word.phonemes.slice(0, 6).map((phoneme, index) => (
                <div key={index} className="flex justify-between">
                  <span className="font-mono">{phoneme.phoneme}</span>
                  <span className={getScoreColor(phoneme.accuracyScore)}>
                    {Math.round(phoneme.accuracyScore)}%
                  </span>
                </div>
              ))}
            </div>
            {word.phonemes.length > 6 && (
              <div className="text-xs text-gray-500 mt-1">
                +{word.phonemes.length - 6} more phonemes
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScoreTooltip;
