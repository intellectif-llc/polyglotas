"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Volume2, Turtle } from "lucide-react";
import { DictationAttempt } from "@/types/pronunciation";
import CharacterLevelFeedback from "./CharacterLevelFeedback";

interface DictationResultsProps {
  attempt: DictationAttempt;
  userText: string;
  onTryAgain: () => void;
  onContinue: () => void;
  audioUrlNormal?: string;
  audioUrlSlow?: string;
}

export default function DictationResults({
  attempt,
  userText,
  onTryAgain,
  onContinue,
  audioUrlNormal,
  audioUrlSlow,
}: DictationResultsProps) {
  const [isPlayingNormal, setIsPlayingNormal] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const audioNormalRef = useRef<HTMLAudioElement>(null);
  const audioSlowRef = useRef<HTMLAudioElement>(null);

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
      audio.play().catch((e) => console.error("Error playing normal audio:", e));
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
          Score:{" "}
          <span className="font-semibold">
            {attempt.overall_similarity_score}%
          </span>
        </div>

        {attempt.points_awarded && attempt.points_awarded > 0 && (
          <div className="text-sm text-green-600 mt-1">
            +{attempt.points_awarded} points earned!
          </div>
        )}
      </div>

      {/* Audio Controls */}
      <div className="flex items-center justify-center gap-3 my-3">
        {audioUrlNormal && (
          <>
            <audio ref={audioNormalRef} src={audioUrlNormal} preload="auto" />
            <button
              onClick={toggleNormalPlayback}
              className={`
                cursor-pointer p-3 rounded-full 
                ${isPlayingNormal 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-blue-50 text-blue-600 border-blue-200'
                }
                hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                w-12 h-12
              `}
              aria-label={
                isPlayingNormal ? "Pause normal speed audio" : "Play normal speed audio"
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
                ${isPlayingSlow 
                  ? 'bg-orange-100 text-orange-700 border-orange-300' 
                  : 'bg-orange-50 text-orange-600 border-orange-200'
                }
                hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                w-12 h-12 relative
              `}
              aria-label={
                isPlayingSlow ? "Pause slow speed audio" : "Play slow speed audio"
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

      {/* Character-Level Feedback */}
      <CharacterLevelFeedback 
        referenceText={attempt.reference_text || ""}
        userText={attempt.written_text || userText}
      />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
        <button
          type="button"
          onClick={onTryAgain}
          className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium min-h-[48px] touch-manipulation"
        >
          <RotateCcw className="w-5 h-5 mr-2 pointer-events-none" />
          <span className="pointer-events-none">Try Again</span>
        </button>

        {attempt.is_correct && (
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[48px] touch-manipulation"
          >
            <span className="pointer-events-none">Continue to Practice</span>
            <ArrowRight className="w-5 h-5 ml-2 pointer-events-none" />
          </button>
        )}
      </div>
    </div>
  );
}
