"use client";

import React, { useState } from "react";
import WordLevelFeedback from "./WordLevelFeedback";
import SyllableLevelFeedback from "./SyllableLevelFeedback";
import PhonemeLevelFeedback from "./PhonemeLevelFeedback";
import ScoreGauges from "./ScoreGauges";
import { Gauge, BookA, Blend, Atom } from "lucide-react";
import { AssessmentResults, WordResult } from "@/hooks/speech/useRecognitionState";

interface FeedbackTabsProps {
  results: AssessmentResults;
  words: WordResult[];
  recognizedText: string;
  referenceText: string;
  scoreGaugesSize?: "small" | "medium" | "large";
}

/**
 * A tabbed interface for displaying different levels of pronunciation feedback
 */
function FeedbackTabs({ 
  results, 
  words,
  recognizedText,
  referenceText,
  scoreGaugesSize = "small" 
}: FeedbackTabsProps) {
  const [activeTab, setActiveTab] = useState("scores");

  // Check if we have data for each tab to enable/disable them
  const hasScores = results && typeof results.pronScore !== "undefined";
  const hasWords = words && words.length > 0;
  const hasSyllables = hasWords && words.some((w) => w.syllables?.length && w.syllables.length > 0);
  const hasPhonemes = hasWords && words.some((w) => w.phonemes?.length && w.phonemes.length > 0);

  const tabConfig = [
    {
      id: "scores",
      label: "Scores",
      icon: <Gauge size={24} />,
      isAvailable: hasScores,
      content: <ScoreGauges results={results} size={scoreGaugesSize} />,
    },
    {
      id: "words",
      label: "Words",
      icon: <BookA size={24} />,
      isAvailable: hasWords,
      content: (
        <WordLevelFeedback 
          words={words} 
          recognizedText={recognizedText}
          referenceText={referenceText}
        />
      ),
    },
    {
      id: "syllables",
      label: "Syllables",
      icon: <Blend size={24} />,
      isAvailable: hasSyllables,
      content: <SyllableLevelFeedback words={words} />,
    },
    {
      id: "phonemes",
      label: "Phonemes",
      icon: <Atom size={24} />,
      isAvailable: hasPhonemes,
      content: <PhonemeLevelFeedback words={words} />,
    },
  ];

  return (
    <div className="mt-4">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 justify-center">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === tab.id
                ? "bg-white text-blue-600 border-l border-t border-r border-gray-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
            } ${!tab.isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => tab.isAvailable && setActiveTab(tab.id)}
            disabled={!tab.isAvailable}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content with consistent styling and min-height */}
      <div className="bg-transparent rounded-b-lg overflow-hidden">
        <div className="min-h-[300px] bg-white">
          {tabConfig.map((tab) =>
            activeTab === tab.id && tab.isAvailable ? (
              <div key={tab.id} className="p-4">{tab.content}</div>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackTabs;