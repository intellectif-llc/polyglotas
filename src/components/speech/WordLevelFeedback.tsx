"use client";

import React, { useState, useRef } from "react";
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
function WordLevelFeedback({ words }: WordLevelFeedbackProps) {
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Display all words for the paragraph display
  const displayWords = words;

  // Function to determine text styling based on error type
  const getWordStyle = (errorTypeString: string | undefined, score: number) => {
    // Basic color scheme based on score
    let colorClass = "";
    if (score >= 90) {
      colorClass = "text-green-400";
    } else if (score >= 70) {
      colorClass = "text-yellow-400";
    } else {
      colorClass = "text-red-400";
    }

    // Additional styling based on error type
    switch (errorTypeString) {
      case ErrorType.Mispronunciation:
        return `${colorClass} font-bold underline`;
      case ErrorType.Omission:
        return `text-orange-400 line-through`;
      case ErrorType.Insertion:
        return `text-purple-400 italic`;
      case ErrorType.None:
        return colorClass;
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="p-6 rounded-b-lg" style={{ backgroundColor: "#021016" }}>
      <h3 className="text-lg font-semibold mb-4 text-white">
        Recognized Speech
      </h3>

      <div className="text-lg leading-relaxed">
        {/* Display words in paragraph format */}
        {displayWords.map((wordData, index) => (
          <span key={index} className="relative inline-block">
            <span
              ref={(el) => {
                if (hoveredWordIndex === index && el && showTooltip) {
                  setTriggerElement(el);
                }
              }}
              className={`${getWordStyle(
                wordData.errorType,
                wordData.accuracyScore
              )} px-1 py-0.5 rounded cursor-pointer transition-colors hover:bg-gray-900 touch-manipulation`}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                hoverTimeoutRef.current = setTimeout(() => {
                  setHoveredWordIndex(index);
                  setShowTooltip(true);
                }, 300);
              }}
              onMouseLeave={() => {
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current);
                }
                setShowTooltip(false);
                setHoveredWordIndex(null);
              }}
              onClick={() => {
                if (hoveredWordIndex === index && showTooltip) {
                  setShowTooltip(false);
                  setHoveredWordIndex(null);
                } else {
                  setHoveredWordIndex(index);
                  setShowTooltip(true);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (hoveredWordIndex === index && showTooltip) {
                    setShowTooltip(false);
                    setHoveredWordIndex(null);
                  } else {
                    setHoveredWordIndex(index);
                    setShowTooltip(true);
                  }
                }
              }}
              aria-label={`View details for word "${wordData.word}"`}
            >
              {wordData.word}
            </span>

            {/* Add space after each word except the last one */}
            {index < displayWords.length - 1 && (
              <span className="text-gray-400"> </span>
            )}
          </span>
        ))}

        {/* Show tooltip when a word is selected */}
        {hoveredWordIndex !== null && showTooltip && displayWords[hoveredWordIndex] && (
          <ScoreTooltip
            word={displayWords[hoveredWordIndex]}
            onClose={() => {
              setShowTooltip(false);
              setHoveredWordIndex(null);
            }}
            triggerElement={triggerElement}
          />
        )}
      </div>

      {/* Legend to explain colors */}
      <div className="mt-6 border-t border-gray-800 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>
            <span className="text-gray-300">Good (90%+)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
            <span className="text-gray-300">Fair (70-89%)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-2"></span>
            <span className="text-gray-300">Needs Work (0-69%)</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-400 mr-2"></span>
            <span className="text-gray-300">Omitted Words</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-400 mr-2"></span>
            <span className="text-gray-300">Inserted Words</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
            <span className="text-gray-300 border-b border-yellow-400">
              Mispronounced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WordLevelFeedback;
