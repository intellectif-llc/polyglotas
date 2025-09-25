"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X, TrendingDown, Target, Clock, AlertTriangle } from "lucide-react";

interface WordAnalyticsTooltipProps {
  word: {
    word_text: string;
    average_accuracy_score: number;
    last_accuracy_score: number;
    total_attempts: number;
    error_count: number;
  };
  onClose: () => void;
  triggerElement: HTMLElement | null;
}

const WordAnalyticsTooltip: React.FC<WordAnalyticsTooltipProps> = ({
  word,
  onClose,
  triggerElement,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const calculatePosition = useCallback(() => {
    if (!triggerElement) return;

    const rect = triggerElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    // Position tooltip above the trigger element
    const top = rect.top + scrollTop - 10; // 10px gap
    const left = rect.left + scrollLeft + rect.width / 2; // Center horizontally

    setPosition({ top, left });
  }, [triggerElement]);

  useEffect(() => {
    calculatePosition();
    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition);

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
    };
  }, [calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest("[data-tooltip]") &&
        !triggerElement?.contains(target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, triggerElement]);

  const getPerformanceStatus = () => {
    const avgScore = word.average_accuracy_score;
    const errorRate = (word.error_count / word.total_attempts) * 100;

    if (avgScore >= 80 && errorRate < 20) {
      return { status: "Improving", color: "text-green-600", icon: Target };
    }
    if (avgScore >= 60) {
      return { status: "Needs Work", color: "text-yellow-600", icon: Clock };
    }
    return {
      status: "Requires Focus",
      color: "text-red-600",
      icon: AlertTriangle,
    };
  };

  const performance = getPerformanceStatus();
  const StatusIcon = performance.icon;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Tooltip */}
      <div
        data-tooltip
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 transform -translate-x-1/2 -translate-y-full"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900">
              {word.word_text}
            </h3>
            <div
              className={`flex items-center gap-1 text-sm ${performance.color}`}
            >
              <StatusIcon size={14} />
              <span className="font-medium">{performance.status}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close analytics"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium mb-1">
              Average Score
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {Math.round(word.average_accuracy_score)}%
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-xs text-purple-600 font-medium mb-1">
              Last Score
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {Math.round(word.last_accuracy_score || 0)}%
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium mb-1">
              Attempts
            </div>
            <div className="text-2xl font-bold text-green-700">
              {word.total_attempts}
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-xs text-orange-600 font-medium mb-1">
              Errors
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {word.error_count}
            </div>
          </div>
        </div>

        {/* Progress Insight */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Progress Insight
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {word.error_count > word.total_attempts * 0.5
              ? "This word has been challenging. Focus on slow, clear pronunciation."
              : word.average_accuracy_score < 70
              ? "You're making progress! Keep practicing to improve consistency."
              : "Great improvement! A few more practice sessions should master this word."}
          </p>
        </div>

        {/* Arrow pointer */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          <div className="w-0 h-0 border-l-9 border-r-9 border-t-9 border-l-transparent border-r-transparent border-t-gray-200 absolute -top-1 left-1/2 transform -translate-x-1/2"></div>
        </div>
      </div>
    </>
  );
};

export default WordAnalyticsTooltip;
