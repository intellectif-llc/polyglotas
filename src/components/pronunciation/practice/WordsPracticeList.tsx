"use client";

import React from "react";
import { useWordsNeedingPractice } from "@/hooks/useWordPractice";
import { AlertCircle, Target, TrendingDown } from "lucide-react";

const WordsPracticeList: React.FC = () => {
  const { data: words, isLoading, error } = useWordsNeedingPractice();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle size={20} className="mr-2" />
          <span>Error loading words that need practice</span>
        </div>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <Target size={48} className="mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Great job! No words need practice right now.
        </h3>
        <p className="text-gray-600">
          Keep practicing lessons to improve your pronunciation skills.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <TrendingDown size={24} className="text-orange-500 mr-3" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Words Needing Practice</h2>
          <p className="text-gray-600 text-sm">
            {words.length} word{words.length !== 1 ? 's' : ''} need improvement
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {words.map((word, index) => (
          <button
            key={`${word.word_text}-${index}`}
            onClick={() => window.location.href = '/learn/practice/words'}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
          >
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-lg">
                {word.word_text}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {word.total_attempts} attempt{word.total_attempts !== 1 ? 's' : ''} • 
                Last score: {Math.round(word.last_accuracy_score || 0)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-orange-600">
                Avg: {Math.round(word.average_accuracy_score)}%
              </div>
              <div className="text-xs text-gray-500">
                {word.error_count} error{word.error_count !== 1 ? 's' : ''}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
<strong>Tip:</strong> Click on any word to start practicing. 
            Words will be removed from your practice list once you achieve consistent accuracy and manually navigate to the next word.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordsPracticeList;