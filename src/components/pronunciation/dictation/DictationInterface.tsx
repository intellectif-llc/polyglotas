"use client";

import React, { useState } from "react";
import { Play, Volume2 } from "lucide-react";

interface DictationInterfaceProps {
  audioUrlNormal?: string;
  audioUrlSlow?: string;
  userText: string;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function DictationInterface({
  audioUrlNormal,
  audioUrlSlow,
  userText,
  onTextChange,
  onSubmit,
  isSubmitting,
}: DictationInterfaceProps) {
  const [isPlayingNormal, setIsPlayingNormal] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);

  const playAudio = (url: string, isSlow: boolean) => {
    if (!url) return;

    const audio = new Audio(url);

    if (isSlow) {
      setIsPlayingSlow(true);
      audio.onended = () => setIsPlayingSlow(false);
    } else {
      setIsPlayingNormal(true);
      audio.onended = () => setIsPlayingNormal(false);
    }

    audio.play().catch(console.error);
  };

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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md">
        <button
          onClick={() => playAudio(audioUrlNormal || "", false)}
          disabled={isPlayingNormal || !audioUrlNormal}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[48px] touch-manipulation flex-1"
        >
          {isPlayingNormal ? (
            <Volume2 className="w-5 h-5 mr-2 pointer-events-none" />
          ) : (
            <Play className="w-5 h-5 mr-2 pointer-events-none" />
          )}
          <span className="pointer-events-none text-sm sm:text-base">
            Normal Speed
          </span>
        </button>

        <button
          onClick={() => playAudio(audioUrlSlow || "", true)}
          disabled={isPlayingSlow || !audioUrlSlow}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium min-h-[48px] touch-manipulation flex-1"
        >
          {isPlayingSlow ? (
            <Volume2 className="w-5 h-5 mr-2 pointer-events-none" />
          ) : (
            <Play className="w-5 h-5 mr-2 pointer-events-none" />
          )}
          <span className="pointer-events-none text-sm sm:text-base">
            Slow Speed
          </span>
        </button>
      </div>

      {/* Text Input */}
      <div className="w-full max-w-2xl px-4">
        <textarea
          value={userText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type what you hear..."
          className="w-full h-32 sm:h-36 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base sm:text-lg touch-manipulation"
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
