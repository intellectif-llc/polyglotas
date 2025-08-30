"use client";

import React, { useState, useEffect } from "react";

// Loading state - when user should wait (app is initializing/processing)
export function LoadingIndicator() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 2;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-6 w-40 bg-white border border-gray-200 overflow-hidden rounded-full">
      <div 
        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200 ease-linear"
        style={{ width: `${progress}%` }}
      ></div>
      <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center text-xs text-white font-medium">
        {progress}%
      </div>
    </div>
  );
}

// Listening state - when user can speak (app is actively listening)
export function ListeningIndicator() {
  return (
    <div className="w-20 h-20 border-4 border-gray-500 border-l-purple-500 rounded-[45%] animate-spin"></div>
  );
}

// Processing state - when user's message is being processed
export function ProcessingIndicator() {
  return (
    <div className="w-12 h-12">
      <svg viewBox="25 25 50 50" className="w-full h-full animate-spin">
        <circle
          r={20}
          cy={50}
          cx={50}
          fill="none"
          stroke="hsl(214, 97%, 59%)"
          strokeWidth={2}
          strokeDasharray="90, 200"
          strokeDashoffset={0}
          strokeLinecap="round"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

