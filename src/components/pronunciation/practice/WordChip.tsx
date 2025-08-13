"use client";

import React, { useState, useRef } from "react";
import { Info, TrendingDown } from "lucide-react";
import WordAnalyticsTooltip from "./WordAnalyticsTooltip";

interface WordChipProps {
  word: {
    word_text: string;
    average_accuracy_score: number;
    last_accuracy_score: number;
    total_attempts: number;
    error_count: number;
  };
  onClick: () => void;
}

const WordChip: React.FC<WordChipProps> = ({ word, onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (score >= 60) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getScoreIcon = (score: number) => {
    if (score < 70) return <TrendingDown size={12} className="ml-1" />;
    return null;
  };

  return (
    <>
      <div
        ref={chipRef}
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium
          cursor-pointer transition-all duration-200 hover:shadow-md
          ${getScoreColor(word.average_accuracy_score)}
        `}
      >
        <button
          onClick={onClick}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <span className="font-semibold">{word.word_text}</span>
          <span className="text-xs opacity-75">
            {Math.round(word.average_accuracy_score)}%
          </span>
          {getScoreIcon(word.average_accuracy_score)}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowTooltip(!showTooltip);
          }}
          className="p-0.5 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Show word analytics"
        >
          <Info size={14} className="opacity-60 hover:opacity-100" />
        </button>
      </div>

      {showTooltip && (
        <WordAnalyticsTooltip
          word={word}
          onClose={() => setShowTooltip(false)}
          triggerElement={chipRef.current}
        />
      )}
    </>
  );
};

export default WordChip;
