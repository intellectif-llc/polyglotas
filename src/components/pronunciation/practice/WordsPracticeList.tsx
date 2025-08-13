"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWordsNeedingPractice } from "@/hooks/useWordPractice";
import { Target, BookOpen, ChevronRight } from "lucide-react";
import WordChip from "./WordChip";
import WordPracticeEmptyState from "./WordPracticeEmptyState";

const WordsPracticeList: React.FC = () => {
  const { data: words, isLoading, error } = useWordsNeedingPractice();
  const router = useRouter();

  const handleWordClick = () => {
    router.push("/learn/practice/words");
  };

  const handleViewAllClick = () => {
    router.push("/learn/practice/words");
  };

  // Don't render anything if loading or error
  if (isLoading || error) {
    return null;
  }

  // Show encouraging empty state when no words need practice
  if (!words || words.length === 0) {
    return <WordPracticeEmptyState />;
  }

  // Limit displayed words to prevent overwhelming the interface
  const displayedWords = words.slice(0, 8); // Show max 8 words
  const hasMoreWords = words.length > 8;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BookOpen size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Practice Words
            </h3>
            <p className="text-sm text-gray-600">
              {words.length} word{words.length !== 1 ? "s" : ""} need
              {words.length === 1 ? "s" : ""} improvement
            </p>
          </div>
        </div>

        {hasMoreWords && (
          <button
            onClick={handleViewAllClick}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
          >
            View All
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Words Grid */}
      <div className="flex flex-wrap gap-2 mb-4">
        {displayedWords.map((word, index) => (
          <WordChip
            key={`${word.word_text}-${index}`}
            word={word}
            onClick={handleWordClick}
          />
        ))}

        {hasMoreWords && (
          <button
            onClick={handleViewAllClick}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-dashed border-orange-300 text-sm text-orange-600 hover:bg-orange-100 transition-colors"
          >
            +{words.length - 8} more
          </button>
        )}
      </div>

      {/* Quick Action */}
      <div className="flex items-center justify-between pt-4 border-t border-orange-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target size={14} />
          <span>Click any word to start practicing</span>
        </div>

        <button
          onClick={handleViewAllClick}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Start Practice
        </button>
      </div>
    </div>
  );
};

export default WordsPracticeList;
