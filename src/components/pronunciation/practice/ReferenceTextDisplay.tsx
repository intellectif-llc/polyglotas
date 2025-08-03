"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PlayCircle, PauseCircle } from 'lucide-react';

interface ReferenceTextDisplayProps {
  text: string;
  audioUrl?: string;
}

const ReferenceTextDisplay: React.FC<ReferenceTextDisplayProps> = ({ text, audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(e => console.error("Error playing audio:", e));
      setIsPlaying(true);
    }
  };

  return (
    <div className="text-center">
      {audioUrl && (
        <>
          <audio ref={audioRef} src={audioUrl} preload="auto" />
          <button
            onClick={togglePlayback}
            className="mb-4 text-indigo-600 hover:text-indigo-800 transition-colors"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <PauseCircle size={48} /> : <PlayCircle size={48} />}
          </button>
        </>
      )}
      <p className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200">
        {text}
      </p>
    </div>
  );
};

export default ReferenceTextDisplay;
