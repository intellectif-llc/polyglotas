"use client";

import React from "react";
import { Target, Sparkles } from "lucide-react";

const WordPracticeEmptyState: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-green-100 rounded-full">
          <Target size={24} className="text-green-600" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Excellent Work!
      </h3>

      <p className="text-gray-600 mb-4">
        No words need practice right now. Keep practicing lessons to maintain
        your pronunciation skills.
      </p>

      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
        <Sparkles size={14} />
        <span className="font-medium">Your pronunciation is on track</span>
      </div>
    </div>
  );
};

export default WordPracticeEmptyState;
