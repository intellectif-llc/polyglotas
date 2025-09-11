"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import WordTooltip from "@/components/speech/WordTooltip";

interface CharacterLevelFeedbackProps {
  referenceText: string;
  userText: string;
}

const normalizeText = (text: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[.,!?;:]/g, "")
    .trim();
};

const renderTextWithFeedback = (referenceText: string, userText: string) => {
  const normalizedRef = normalizeText(referenceText);
  const normalizedUser = normalizeText(userText);

  if (!normalizedUser) {
    return <span className="text-gray-400 italic">No text entered</span>;
  }

  // Use DP to find optimal alignment
  const m = normalizedRef.length;
  const n = normalizedUser.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Fill DP table
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalizedRef[i - 1] === normalizedUser[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  // Backtrack to build alignment
  const result = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizedRef[i - 1] === normalizedUser[j - 1]) {
      // Match - correct character
      result.unshift(
        <span key={`${i}-${j}`} className="text-green-600">
          {normalizedUser[j - 1]}
        </span>
      );
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // Substitution - wrong character
      result.unshift(
        <span
          key={`sub-${i}-${j}`}
          className="text-red-600"
          title={`Expected: "${normalizedRef[i - 1]}", Got: "${
            normalizedUser[j - 1]
          }"`}
        >
          {normalizedUser[j - 1]}
        </span>
      );
      i--;
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      // Deletion - missing character
      result.unshift(
        <span
          key={`del-${i}`}
          className="text-red-600"
          title={`Missing: "${
            normalizedRef[i - 1] === " " ? "space" : normalizedRef[i - 1]
          }"`}
        >
          •
        </span>
      );
      i--;
    } else {
      // Insertion - extra character
      result.unshift(
        <span
          key={`ins-${j}`}
          className="text-purple-600"
          title={`Extra: "${normalizedUser[j - 1]}"`}
        >
          {normalizedUser[j - 1]}
        </span>
      );
      j--;
    }
  }

  return result;
};

export default function CharacterLevelFeedback({
  referenceText,
  userText,
}: CharacterLevelFeedbackProps) {
  const [showSolution, setShowSolution] = useState(false);
  const [tooltipConfig, setTooltipConfig] = useState<{
    visible: boolean;
    selectedText: string;
    triggerElement: HTMLElement | null;
  }>({
    visible: false,
    selectedText: "",
    triggerElement: null,
  });
  
  const solutionRef = useRef<HTMLDivElement>(null);

  const closeTooltip = useCallback(() => {
    setTooltipConfig({
      visible: false,
      selectedText: "",
      triggerElement: null,
    });
  }, []);

  useEffect(() => {
    closeTooltip();
  }, [referenceText, closeTooltip]);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (
        selectedText &&
        selection &&
        selection.anchorNode &&
        solutionRef.current?.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const trigger = document.createElement("div");
        trigger.style.position = "absolute";
        trigger.style.left = `${rect.left + window.scrollX}px`;
        trigger.style.top = `${rect.top + window.scrollY}px`;
        trigger.style.width = `${rect.width}px`;
        trigger.style.height = `${rect.height}px`;
        trigger.style.pointerEvents = "none";
        trigger.style.zIndex = "1";

        setTooltipConfig({
          visible: true,
          selectedText: selectedText,
          triggerElement: trigger,
        });
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Answer:</h3>

      <div className="p-4 bg-gray-50 rounded-lg mb-4">
        <div className="text-lg leading-relaxed">
          {renderTextWithFeedback(referenceText, userText)}
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowSolution(!showSolution)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {showSolution ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide solution
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              View solution
            </>
          )}
        </button>

        {showSolution && (
          <div className="p-4 bg-blue-50 rounded-lg mt-2">
            <div 
              ref={solutionRef}
              className="text-lg leading-relaxed text-gray-800 select-text cursor-text hover:bg-blue-100 transition-colors rounded px-2 py-1"
              style={{ userSelect: "text" }}
            >
              {referenceText}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 border-t border-gray-200 mt-4 pt-4">
        <div className="flex flex-row flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center">
            <span className="text-green-600 font-semibold mr-2">Green</span>
            <span>Correct</span>
          </div>
          <div className="flex items-center">
            <span className="text-red-600 font-semibold mr-2">Red</span>
            <span>Wrong/Missing (• = missing)</span>
          </div>
          <div className="flex items-center">
            <span className="text-purple-600 font-semibold mr-2">Purple</span>
            <span>Extra</span>
          </div>
        </div>
      </div>

      {tooltipConfig.visible && (
        <WordTooltip
          selectedText={tooltipConfig.selectedText}
          onClose={closeTooltip}
          triggerElement={tooltipConfig.triggerElement}
        />
      )}
    </div>
  );
}
