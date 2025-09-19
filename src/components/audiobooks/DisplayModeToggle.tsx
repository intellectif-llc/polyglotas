'use client';

import { BookOpen, Video } from 'lucide-react';

interface DisplayModeToggleProps {
  currentMode: 'text' | 'video';
  hasVideo: boolean;
  onModeChange: (mode: 'text' | 'video') => void;
}

export default function DisplayModeToggle({ 
  currentMode, 
  hasVideo, 
  onModeChange 
}: DisplayModeToggleProps) {
  if (!hasVideo) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex items-center justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onModeChange('text')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md transition-all duration-200 ${
              currentMode === 'text'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <BookOpen className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Text Mode</span>
          </button>
          
          <button
            onClick={() => onModeChange('video')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md transition-all duration-200 ${
              currentMode === 'video'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Video className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Video Mode</span>
          </button>
        </div>
      </div>
      
      <div className="text-center mt-2">
        <p className="text-xs sm:text-sm text-gray-500">
          <span className="hidden sm:inline">
            {currentMode === 'text' 
              ? 'Reading with synchronized text highlighting' 
              : 'Watching with interactive subtitles'
            }
          </span>
          <span className="sm:hidden">
            {currentMode === 'text' ? 'Text highlighting' : 'Interactive subtitles'}
          </span>
        </p>
      </div>
    </div>
  );
}