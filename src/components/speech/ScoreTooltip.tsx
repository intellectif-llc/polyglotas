"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WordResult } from "@/hooks/speech/useRecognitionState";

interface ScoreTooltipProps {
  word: WordResult;
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

function ScoreTooltip({ word, onClose, triggerElement }: ScoreTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    if (!triggerElement || !tooltipRef.current) return;

    const calculatePosition = () => {
      const triggerRect = triggerElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };

      if (mobile) {
        // Mobile: center on screen
        setPosition({
          top: (viewport.height - tooltipRect.height) / 2,
          left: (viewport.width - tooltipRect.width) / 2,
        });
      } else {
        // Desktop: position above trigger with fallback to below
        let top = triggerRect.top - tooltipRect.height - 8;
        let left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;

        // Adjust if tooltip goes off screen
        if (top < 8) {
          top = triggerRect.bottom + 8;
        }
        if (left < 8) {
          left = 8;
        } else if (left + tooltipRect.width > viewport.width - 8) {
          left = viewport.width - tooltipRect.width - 8;
        }

        setPosition({ top, left });
      }
    };

    // Initial positioning
    setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 10);

    const handleResize = () => {
      calculatePosition();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [triggerElement, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
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
  }, [onClose]);

  const tooltipContent = (
    <>
      {isMobile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      )}
      
      <div
        ref={tooltipRef}
        className={`fixed z-50 w-80 max-w-[calc(100vw-2rem)] p-4 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-white text-base pr-2">
            &quot;{word.word}&quot;
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-1 rounded hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close tooltip"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Accuracy Score:</span>
            <span className={`font-semibold ${getScoreColor(word.accuracyScore)}`}>
              {Math.round(word.accuracyScore)}%
            </span>
          </div>

          {word.errorType && word.errorType !== "None" && (
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Error Type:</span>
              <span className="font-semibold text-red-400">{word.errorType}</span>
            </div>
          )}

          {word.syllables && word.syllables.length > 0 && (
            <div>
              <div className="font-medium text-gray-200 mb-2">Syllables:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {word.syllables.map((syllable, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-xs bg-gray-800 px-2 py-1.5 rounded"
                  >
                    <span className="text-gray-300 truncate pr-2">
                      &quot;{syllable.syllable}&quot;
                    </span>
                    <span className={`${getScoreColor(syllable.accuracyScore)} font-medium flex-shrink-0`}>
                      {Math.round(syllable.accuracyScore)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {word.phonemes && word.phonemes.length > 0 && (
            <div>
              <div className="font-medium text-gray-200 mb-2">Phonemes:</div>
              <div className="grid gap-1 text-xs max-h-40 overflow-y-auto grid-cols-3">
                {word.phonemes.slice(0, 12).map((phoneme, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center bg-gray-800 px-2 py-1.5 rounded min-w-0"
                  >
                    <span className="font-mono text-gray-300 text-xs truncate w-full text-center">
                      {phoneme.phoneme}
                    </span>
                    <span className={`text-xs ${getScoreColor(phoneme.accuracyScore)} font-medium`}>
                      {Math.round(phoneme.accuracyScore)}%
                    </span>
                  </div>
                ))}
              </div>
              {word.phonemes.length > 12 && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                  +{word.phonemes.length - 12} more phonemes
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  return typeof window !== "undefined" ? createPortal(tooltipContent, document.body) : null;
}

export default ScoreTooltip;