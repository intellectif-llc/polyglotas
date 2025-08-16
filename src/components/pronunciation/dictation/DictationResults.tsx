"use client";

import React from "react";
import { CheckCircle, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { DictationAttempt } from "@/types/pronunciation";

interface DictationResultsProps {
  attempt: DictationAttempt;
  userText: string;
  onTryAgain: () => void;
  onContinue: () => void;
}

export default function DictationResults({
  attempt,
  userText,
  onTryAgain,
  onContinue,
}: DictationResultsProps) {
  const getWordColor = (similarity: number) => {
    if (similarity >= 90) return "bg-green-100 text-green-800";
    if (similarity >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const renderTextWithFeedback = () => {
    const words = userText.split(/\s+/);
    return (
      <div className="flex flex-wrap gap-1 p-4 bg-gray-50 rounded-lg">
        {attempt.word_level_feedback.map((feedback, index) => {
          const userWord = feedback.written_word;
          const refWord = feedback.reference_word;
          
          if (!userWord && !refWord) return null;
          
          return (
            <span
              key={index}
              className={`px-2 py-1 rounded text-sm font-medium ${getWordColor(feedback.similarity_score)}`}
              title={`Reference: "${refWord}" | Your input: "${userWord}" | Score: ${feedback.similarity_score}%`}
            >
              {userWord || "(missing)"}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Score Display */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {attempt.is_correct ? (
            <CheckCircle className="w-16 h-16 text-green-500" />
          ) : (
            <XCircle className="w-16 h-16 text-red-500" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {attempt.is_correct ? "Great Job!" : "Keep Trying!"}
        </h2>
        
        <div className="text-lg text-gray-600">
          Score: <span className="font-semibold">{attempt.overall_similarity_score}%</span>
        </div>
        
        {attempt.points_awarded && attempt.points_awarded > 0 && (
          <div className="text-sm text-green-600 mt-1">
            +{attempt.points_awarded} points earned!
          </div>
        )}
      </div>

      {/* Text Feedback */}
      <div className="w-full max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Answer:</h3>
        {renderTextWithFeedback()}
        
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
              <span>Correct (90%+)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-100 rounded mr-2"></div>
              <span>Close (70-89%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 rounded mr-2"></div>
              <span>Needs work (&lt;70%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onTryAgain}
          className="cursor-pointer flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors [&>*]:pointer-events-none"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Try Again
        </button>

        {attempt.is_correct && (
          <button
            type="button"
            onClick={onContinue}
            className="cursor-pointer flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors [&>*]:pointer-events-none"
          >
            Continue to Practice
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}