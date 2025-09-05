"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, Turtle, Lightbulb } from "lucide-react";

interface DictationInterfaceProps {
  audioUrlNormal?: string;
  audioUrlSlow?: string;
  userText: string;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  referenceText?: string;
}

export default function DictationInterface({
  audioUrlNormal,
  audioUrlSlow,
  userText,
  onTextChange,
  onSubmit,
  isSubmitting,
  referenceText,
}: DictationInterfaceProps) {
  const [isPlayingNormal, setIsPlayingNormal] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const audioNormalRef = useRef<HTMLAudioElement>(null);
  const audioSlowRef = useRef<HTMLAudioElement>(null);

  const referenceWords = referenceText?.split(" ") || [];
  const maxHints = referenceWords.length;

  useEffect(() => {
    const audioNormal = audioNormalRef.current;
    const audioSlow = audioSlowRef.current;

    if (audioNormal) {
      audioNormal.onended = () => setIsPlayingNormal(false);
    }
    if (audioSlow) {
      audioSlow.onended = () => setIsPlayingSlow(false);
    }

    return () => {
      if (audioNormal) {
        audioNormal.onended = null;
      }
      if (audioSlow) {
        audioSlow.onended = null;
      }
    };
  }, []);

  const toggleNormalPlayback = useCallback(() => {
    const audio = audioNormalRef.current;
    const audioSlow = audioSlowRef.current;
    if (!audio) return;

    if (isPlayingSlow && audioSlow) {
      audioSlow.pause();
      setIsPlayingSlow(false);
    }

    if (isPlayingNormal) {
      audio.pause();
      setIsPlayingNormal(false);
    } else {
      audio
        .play()
        .catch((e) => console.error("Error playing normal audio:", e));
      setIsPlayingNormal(true);
    }
  }, [isPlayingNormal, isPlayingSlow]);

  const toggleSlowPlayback = useCallback(() => {
    const audio = audioSlowRef.current;
    const audioNormal = audioNormalRef.current;
    if (!audio) return;

    if (isPlayingNormal && audioNormal) {
      audioNormal.pause();
      setIsPlayingNormal(false);
    }

    if (isPlayingSlow) {
      audio.pause();
      setIsPlayingSlow(false);
    } else {
      audio.play().catch((e) => console.error("Error playing slow audio:", e));
      setIsPlayingSlow(true);
    }
  }, [isPlayingSlow, isPlayingNormal]);

  const handleShowHint = useCallback(() => {
    if (hintsRevealed < maxHints) {
      setHintsRevealed((prev) => prev + 1);
    }
  }, [hintsRevealed, maxHints]);

  const resetHints = useCallback(() => {
    setHintsRevealed(0);
  }, []);

  // Reset hints when reference text changes
  useEffect(() => {
    resetHints();
  }, [referenceText, resetHints]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Instructions */}
      <div className="text-center px-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
          Listen and Write
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Listen to the audio and write what you hear in the text box below
        </p>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center justify-center gap-3 my-2">
        {audioUrlNormal && (
          <>
            <audio ref={audioNormalRef} src={audioUrlNormal} preload="auto" />
            <button
              onClick={toggleNormalPlayback}
              className={`
                cursor-pointer p-3 rounded-full 
                ${
                  isPlayingNormal
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "bg-blue-50 text-blue-600 border-blue-200"
                }
                hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                w-12 h-12
              `}
              aria-label={
                isPlayingNormal
                  ? "Pause normal speed audio"
                  : "Play normal speed audio"
              }
              title="Listen at normal speed"
            >
              <Volume2 className="h-6 w-6" />
            </button>
          </>
        )}

        {audioUrlSlow && (
          <>
            <audio ref={audioSlowRef} src={audioUrlSlow} preload="auto" />
            <button
              onClick={toggleSlowPlayback}
              className={`
                cursor-pointer p-3 rounded-full 
                ${
                  isPlayingSlow
                    ? "bg-orange-100 text-orange-700 border-orange-300"
                    : "bg-orange-50 text-orange-600 border-orange-200"
                }
                hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                w-12 h-12 relative
              `}
              aria-label={
                isPlayingSlow
                  ? "Pause slow speed audio"
                  : "Play slow speed audio"
              }
              title="Listen at slow speed"
            >
              <Turtle className="h-5 w-5" />
              <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-orange-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                S
              </span>
            </button>
          </>
        )}
      </div>

      {/* Hint Section */}
      {referenceText && (
        <div className="w-full max-w-2xl px-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={handleShowHint}
              disabled={hintsRevealed >= maxHints || isSubmitting}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              <span>
                Hint ({hintsRevealed}/{maxHints})
              </span>
            </button>
            {hintsRevealed > 0 && (
              <button
                onClick={resetHints}
                disabled={isSubmitting}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Reset hints
              </button>
            )}
          </div>
          {hintsRevealed > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-base text-yellow-900">
                {referenceWords.slice(0, hintsRevealed).join(" ")}
                {hintsRevealed < maxHints && (
                  <span className="text-yellow-600 ml-1">...</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Input */}
      <div className="w-full max-w-2xl px-4">
        <textarea
          value={userText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type what you hear..."
          className="w-full h-24 sm:h-28 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base sm:text-lg touch-manipulation text-gray-900 placeholder:text-gray-600"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Button */}
      <div className="w-full max-w-md px-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!userText.trim() || isSubmitting}
          className="w-full flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[48px] touch-manipulation"
        >
          <span className="pointer-events-none">
            {isSubmitting ? "Checking..." : "Check Answer"}
          </span>
        </button>
      </div>
    </div>
  );
}
