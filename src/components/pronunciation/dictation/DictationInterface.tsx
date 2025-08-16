"use client";

import React, { useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";

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
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Listen and Write
        </h2>
        <p className="text-gray-600">
          Listen to the audio and write what you hear in the text box below
        </p>
      </div>

      {/* Audio Controls */}
      <div className="flex space-x-4">
        <button
          onClick={() => playAudio(audioUrlNormal || "", false)}
          disabled={isPlayingNormal || !audioUrlNormal}
          className="cursor-pointer flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors [&>*]:pointer-events-none"
        >
          {isPlayingNormal ? (
            <Volume2 className="w-5 h-5 mr-2" />
          ) : (
            <Play className="w-5 h-5 mr-2" />
          )}
          Normal Speed
        </button>

        <button
          onClick={() => playAudio(audioUrlSlow || "", true)}
          disabled={isPlayingSlow || !audioUrlSlow}
          className="cursor-pointer flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors [&>*]:pointer-events-none"
        >
          {isPlayingSlow ? (
            <Volume2 className="w-5 h-5 mr-2" />
          ) : (
            <Play className="w-5 h-5 mr-2" />
          )}
          Slow Speed
        </button>
      </div>

      {/* Text Input */}
      <div className="w-full max-w-2xl">
        <textarea
          value={userText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Type what you hear..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!userText.trim() || isSubmitting}
        className="cursor-pointer px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium relative z-10"
        style={{ pointerEvents: 'auto' }}
      >
        {isSubmitting ? "Checking..." : "Check Answer"}
      </button>
    </div>
  );
}