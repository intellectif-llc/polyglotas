'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Eye, EyeOff } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  showText: boolean;
  userProgress: { current_position_seconds: number };
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onToggleText: () => void;
  onUpdateHighlighting: () => void;
  onDurationChange?: (duration: number) => void;
}

export default function AudioPlayer({
  audioUrl,
  currentTime,
  duration,
  isPlaying,
  showText,
  userProgress,
  onTimeUpdate,
  onPlayPause,
  onSeek,
  onToggleText,
  onUpdateHighlighting,
  onDurationChange
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = useCallback((time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const skipTime = useCallback((seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      onUpdateHighlighting();
    }
  }, [currentTime, duration, onUpdateHighlighting]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      const clampedTime = Math.max(0, Math.min(duration, newTime));
      audioRef.current.currentTime = clampedTime;
      onSeek(clampedTime);
      onUpdateHighlighting();
    }
  }, [duration, onSeek, onUpdateHighlighting]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      onTimeUpdate(time);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && onDurationChange) {
        onDurationChange(audio.duration);
      }
      audio.currentTime = userProgress.current_position_seconds;
    };

    const handleDurationChange = () => {
      if (audio.duration && onDurationChange) {
        onDurationChange(audio.duration);
      }
    };

    const handlePlay = () => {
      if (!isPlaying) onPlayPause();
    };

    const handlePause = () => {
      if (isPlaying) onPlayPause();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, userProgress.current_position_seconds, onDurationChange, isPlaying, onPlayPause]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <audio
        ref={audioRef}
        preload="metadata"
        src={audioUrl.startsWith('http') ? audioUrl : `https://${audioUrl}`}
      >
        Your browser does not support the audio element.
      </audio>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          className="w-full bg-gray-200 rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200"
          onClick={handleProgressClick}
        >
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300 hover:h-3"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => skipTime(-10)}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            
            if (isPlaying) {
              audio.pause();
            } else {
              audio.play().catch(console.error);
            }
          }}
          className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </button>

        <button
          onClick={() => skipTime(10)}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <SkipForward className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleText}
          className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ml-4"
        >
          {showText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}