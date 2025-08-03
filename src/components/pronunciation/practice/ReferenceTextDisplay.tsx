"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, Languages, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/translation/useTranslation";

interface ReferenceTextDisplayProps {
  text: string;
  audioUrl?: string;
  phraseId: number;
  lessonId?: string | number;
}

const ReferenceTextDisplay: React.FC<ReferenceTextDisplayProps> = ({
  text,
  audioUrl,
  phraseId,
  lessonId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [displayTranslation, setDisplayTranslation] = useState<string | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement>(null);

  // Translation hook
  const {
    translate,
    translation,
    isTranslating,
    error: translationError,
    isSuccess: translationSuccess,
    reset: resetTranslation,
  } = useTranslation({
    phraseId,
    lessonId,
    onSuccess: (newTranslation) => {
      setDisplayTranslation(newTranslation);
      setShowTranslation(true);
    },
    onError: (error) => {
      console.error("Translation failed:", error);
      setShowTranslation(true); // Show error state
    },
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audio) {
        audio.onended = null;
      }
    };
  }, []);

  // Reset translation state when phrase changes
  useEffect(() => {
    setShowTranslation(false);
    setDisplayTranslation(null);
    resetTranslation();
  }, [phraseId, resetTranslation]);

  // Update display translation when translation succeeds
  useEffect(() => {
    if (translation) {
      setDisplayTranslation(translation);
    }
  }, [translation]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((e) => console.error("Error playing audio:", e));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleToggleTranslation = useCallback(() => {
    if (showTranslation) {
      setShowTranslation(false);
    } else {
      if (displayTranslation) {
        setShowTranslation(true);
      } else {
        console.log(`Triggering translation fetch for phrase ${phraseId}...`);
        translate();
      }
    }
  }, [showTranslation, displayTranslation, phraseId, translate]);

  const isAudioBusy = isTranslating;

  return (
    <div className="reference-text-container text-center mb-4">
      {/* Reference Text */}
      <h2 className="text-3xl font-bold text-gray-800 mb-2 inline-block align-middle mr-3">
        {text}
      </h2>

      <div className="flex items-center justify-center gap-3 my-3">
        {/* Audio Button */}
        {audioUrl && (
          <>
            <audio ref={audioRef} src={audioUrl} preload="auto" />
            <button
              onClick={togglePlayback}
              disabled={isAudioBusy}
              className={`
                cursor-pointer p-3 rounded-full 
                bg-blue-50 text-blue-600 border border-blue-200
                hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                disabled:opacity-50 disabled:cursor-not-allowed
                w-12 h-12
              `}
              aria-label={
                isPlaying ? "Pause phrase audio" : "Play phrase audio"
              }
              title="Listen to phrase"
            >
              <Volume2 className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Translate Button */}
        <button
          onClick={handleToggleTranslation}
          disabled={isAudioBusy}
          className={`
            cursor-pointer p-3 rounded-full 
            bg-yellow-50 text-yellow-600 border border-yellow-200
            hover:bg-yellow-100 hover:text-yellow-700 hover:border-yellow-300
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 
            transition-all duration-200 ease-in-out
            shadow-sm hover:shadow
            inline-flex items-center justify-center
            disabled:opacity-50 disabled:cursor-not-allowed
            ${showTranslation ? "bg-yellow-100 text-yellow-700" : ""}
            w-12 h-12
          `}
          aria-label="Toggle translation"
          title="Show/hide translation"
        >
          {isTranslating ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Languages className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Translation Display Area */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showTranslation ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
        style={{ transitionProperty: "max-height, opacity, margin" }}
      >
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 inline-block min-w-[150px] text-center">
          {isTranslating ? (
            <span className="text-gray-500 italic">Translating...</span>
          ) : translationError ? (
            <span className="text-red-500 italic">
              {translationError.message || "Translation failed"}
            </span>
          ) : displayTranslation ? (
            <p className="text-lg text-blue-600">{displayTranslation}</p>
          ) : (
            <span className="text-gray-400 italic">
              No translation available.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferenceTextDisplay;
