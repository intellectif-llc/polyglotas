'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Eye, EyeOff } from 'lucide-react';
import { AlignmentData } from '@/types/audiobooks';

interface VideoPlayerProps {
  videoUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  showSubtitles: boolean;
  alignment: AlignmentData | null;
  currentWordIndex: number;
  onTimeUpdate: (time: number) => void;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onToggleSubtitles: () => void;
  onDurationChange: (duration: number) => void;
  onWordClick: (word: string, element: HTMLElement) => void;
  onAudioEnd: (time: number) => void;
}

export default function VideoPlayer({
  videoUrl,
  currentTime,
  duration,
  isPlaying,
  showSubtitles,
  alignment,
  currentWordIndex,
  onTimeUpdate,
  onPlayPause,
  onSeek,
  onToggleSubtitles,
  onDurationChange,
  onWordClick,
  onAudioEnd
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const subtitleRef = useRef<HTMLDivElement>(null);

  // Sync video playback with props
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        if (isPlaying && video.paused) {
          video.play().catch(() => {});
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
      }
    }
  }, [isPlaying]);

  // Sync video time with props
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  }, [onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      onDurationChange(videoRef.current.duration);
      videoRef.current.currentTime = currentTime;
    }
  }, [onDurationChange, currentTime]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!videoRef.current || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX : e.clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    onSeek(newTime);
  }, [duration, onSeek]);

  const skipTime = useCallback((seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      onSeek(newTime);
    }
  }, [currentTime, duration, onSeek]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Generate scrolling subtitles with fixed highlight position
  const getCurrentSubtitle = useCallback(() => {
    if (!alignment?.words_data || !showSubtitles) return null;

    // Find current word and get surrounding context
    const WORDS_BEFORE = 8;
    const WORDS_AFTER = 8;
    
    let startIndex = Math.max(0, currentWordIndex - WORDS_BEFORE);
    let endIndex = Math.min(alignment.words_data.length - 1, currentWordIndex + WORDS_AFTER);
    
    // If no current word, show upcoming words
    if (currentWordIndex === -1) {
      const nextWordIndex = alignment.words_data.findIndex(word => word.start > currentTime);
      if (nextWordIndex !== -1) {
        startIndex = Math.max(0, nextWordIndex - WORDS_BEFORE);
        endIndex = Math.min(alignment.words_data.length - 1, nextWordIndex + WORDS_AFTER);
      }
    }

    const visibleWords = alignment.words_data.slice(startIndex, endIndex + 1);
    if (visibleWords.length === 0) return null;

    return (
      <div 
        ref={subtitleRef}
        data-subtitle-container
        className={`absolute left-2 right-2 sm:left-4 sm:right-4 text-center pointer-events-auto z-10 ${
          isFullscreen ? 'bottom-12 sm:bottom-16' : 'bottom-16 sm:bottom-20'
        }`}
      >
        <div className={`inline-block bg-black bg-opacity-75 rounded-lg px-2 py-2 sm:px-4 sm:py-3 backdrop-blur-sm ${
          isFullscreen ? 'max-w-6xl' : 'max-w-xs sm:max-w-4xl'
        }`}>
          <div 
            className={`text-white font-medium leading-relaxed ${
              isFullscreen ? 'text-base sm:text-xl md:text-2xl' : 'text-sm sm:text-lg md:text-xl'
            }`}
            style={{ 
              userSelect: 'text',
              lineHeight: '1.4',
              minHeight: isFullscreen ? '3.2em' : '2.8em', // Smaller on mobile
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.15rem'
            }}
          >
            {visibleWords.map((word, idx) => {
              const globalIndex = startIndex + idx;
              const isActive = globalIndex === currentWordIndex;
              const isPast = globalIndex < currentWordIndex;
              
              return (
                <span
                  key={globalIndex}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWordClick(word.text, e.currentTarget as HTMLElement);
                  }}
                  className={`transition-all duration-200 cursor-pointer hover:bg-blue-400 hover:text-black px-1 py-0.5 rounded text-xs sm:text-sm md:text-base ${
                    isActive
                      ? 'bg-yellow-400 text-black font-bold'
                      : isPast
                        ? 'text-gray-400'
                        : 'text-white'
                  }`}
                  style={{
                    display: 'inline-block',
                    margin: '0 1px'
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [alignment, showSubtitles, currentTime, currentWordIndex, onWordClick, isFullscreen]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);



  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      // Longer timeout on mobile for better UX
      const hideDelay = window.innerWidth < 768 ? 5000 : 3000;
      timeout = setTimeout(() => setShowControls(false), hideDelay);
    };

    resetTimeout();
    
    return () => clearTimeout(timeout);
  }, [currentTime, isPlaying]);

  return (
    <div className="relative bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        className="w-full aspect-video bg-gray-900"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => {}}
        onPause={() => {}}
        onEnded={() => {
          if (videoRef.current) {
            onAudioEnd(videoRef.current.currentTime);
          }
        }}
        onError={(e) => {
          const target = e.target as HTMLVideoElement;
          if (target.error) {
            console.warn('Video failed to load:', target.src);
          }
        }}
        onTouchStart={(e) => {
          setShowControls(true);
          // Prevent default to avoid unwanted behaviors
          if (e.target === videoRef.current) {
            e.preventDefault();
          }
        }}
        playsInline
        preload="metadata"

      >
        <source src={videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`} type="video/mp4" />
        Your browser does not support the video element.
      </video>

      {/* Subtitles Overlay */}
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto">
          {getCurrentSubtitle()}
        </div>
      </div>

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onMouseMove={() => setShowControls(true)}
        onTouchStart={(e) => {
          setShowControls(true);
          e.stopPropagation();
        }}
        onClick={() => setShowControls(true)}
      >
        {/* Progress Bar */}
        <div className="absolute bottom-12 sm:bottom-16 left-2 right-2 sm:left-4 sm:right-4">
          <div className="flex items-center gap-2 text-white text-xs sm:text-sm mb-1 sm:mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div 
            className="w-full bg-white/20 rounded-full h-1.5 sm:h-2 cursor-pointer hover:h-2 sm:hover:h-3 transition-all duration-200 touch-manipulation"
            onClick={handleSeek}
            onTouchEnd={handleSeek}
          >
            <div
              className="bg-red-500 h-1.5 sm:h-2 rounded-full transition-all duration-300 hover:h-2 sm:hover:h-3"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="absolute bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <SkipBack className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <button
              onClick={onPlayPause}
              className="p-2 sm:p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5 sm:h-6 sm:w-6" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
            
            <button
              onClick={() => skipTime(10)}
              className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <SkipForward className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 ml-4">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-red-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              onClick={toggleMute}
              className="sm:hidden p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <Volume2 className="h-4 w-4" />
            </button>
            
            <button
              onClick={onToggleSubtitles}
              className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              {showSubtitles ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <Maximize className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}