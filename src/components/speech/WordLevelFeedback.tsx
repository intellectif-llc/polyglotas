"use client";

import React, { useState } from "react";
import ScoreTooltip from "./ScoreTooltip";
import { WordResult } from "@/hooks/speech/useRecognitionState";

// Error Type strings directly from SDK
const ErrorType = {
  None: "None",
  Mispronunciation: "Mispronunciation",
  Omission: "Omission",
  Insertion: "Insertion",
};

interface WordLevelFeedbackProps {
  words: WordResult[];
  recognizedText: string;
  referenceText: string;
}

/**
 * Word level feedback component displayed in paragraph format with hover details
 */
function WordLevelFeedback({ words, recognizedText, referenceText }: WordLevelFeedbackProps) {
  // Track which word is being hovered (if any)
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);

  // Function to determine text styling based on error type
  const getWordStyle = (errorTypeString: string | undefined, score: number) => {
    // Basic color scheme based on score
    let colorClass = "";
    if (score >= 90) {
      colorClass = "text-green-600";
    } else if (score >= 70) {
      colorClass = "text-yellow-600";
    } else {
      colorClass = "text-red-600";
    }

    // Additional styling based on error type
    switch (errorTypeString) {
      case ErrorType.Mispronunciation:
        return `${colorClass} font-bold underline`;
      case ErrorType.Omission:
        return `text-orange-600 line-through`;
      case ErrorType.Insertion:
        return `text-purple-600 italic`;
      case ErrorType.None:
        return colorClass;
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="p-6 rounded-b-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Word-Level Pronunciation Feedback
      </h3>
      
      {/* Display recognized vs reference text */}
      <div className="mb-4 p-3 bg-white rounded border">
        <div className="mb-2">
          <strong className="text-gray-700">Reference:</strong>
          <p className="text-gray-800">{referenceText}</p>
        </div>
        <div>
          <strong className="text-gray-700">Recognized:</strong>
          <p className="text-gray-800">{recognizedText}</p>
        </div>
      </div>

      {/* Interactive word display */}
      <div className="relative">
        <div className="text-xl leading-relaxed">
          {words.map((word, index) => (
            <span
              key={index}
              className={`${getWordStyle(
                word.errorType,
                word.accuracyScore
              )} cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded transition-colors`}
              onMouseEnter={() => setHoveredWordIndex(index)}
              onMouseLeave={() => setHoveredWordIndex(null)}
            >
              {word.word}
            </span>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredWordIndex !== null && words[hoveredWordIndex] && (
          <ScoreTooltip
            word={words[hoveredWordIndex]}
            onClose={() => setHoveredWordIndex(null)}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 p-3 bg-white rounded border">
        <h4 className="font-semibold mb-2 text-gray-800">Color Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-green-600">■ Excellent (90-100%)</span>
          <span className="text-yellow-600">■ Good (70-89%)</span>
          <span className="text-red-600">■ Needs Improvement (&lt;70%)</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm mt-2">
          <span className="underline">Mispronunciation</span>
          <span className="line-through">Omission</span>
          <span className="italic">Insertion</span>
        </div>
      </div>
    </div>
  );
}

export default WordLevelFeedback;