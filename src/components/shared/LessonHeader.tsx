"use client";

import React, { useState } from "react";
import { ArrowLeft, Info, ChevronDown, ChevronUp } from "lucide-react";

interface LessonHeaderProps {
  title: string;
  subtitle?: string;
  unitTitle?: string;
  level?: string;
  onBack: () => void;
  collapsible?: boolean;
  activity?: 'practice' | 'dictation' | 'chat' | 'word-practice';
}

export default function LessonHeader({
  title,
  subtitle,
  unitTitle,
  level,
  onBack,
  collapsible = false,
  activity,
}: LessonHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Activity-based color themes
  const getActivityTheme = () => {
    switch (activity) {
      case 'practice':
        return {
          gradient: 'from-blue-50 to-indigo-50',
          border: 'border-blue-100',
          accent: 'text-blue-600',
          hover: 'hover:text-blue-800'
        };
      case 'dictation':
        return {
          gradient: 'from-emerald-50 to-teal-50',
          border: 'border-emerald-100',
          accent: 'text-emerald-600',
          hover: 'hover:text-emerald-800'
        };
      case 'chat':
        return {
          gradient: 'from-purple-50 to-violet-50',
          border: 'border-purple-100',
          accent: 'text-purple-600',
          hover: 'hover:text-purple-800'
        };
      case 'word-practice':
        return {
          gradient: 'from-orange-50 to-amber-50',
          border: 'border-orange-100',
          accent: 'text-orange-600',
          hover: 'hover:text-orange-800'
        };
      default:
        return {
          gradient: 'from-gray-50 to-white',
          border: 'border-gray-100',
          accent: 'text-gray-600',
          hover: 'hover:text-gray-800'
        };
    }
  };

  const theme = getActivityTheme();

  return (
    <div className={`bg-gradient-to-r ${theme.gradient} shadow-sm border-b ${theme.border} transition-all duration-300`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Always visible top row */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className={`flex items-center ${theme.accent} ${theme.hover} transition-colors min-h-[44px] touch-manipulation group`}
            aria-label="Go back"
          >
            <ArrowLeft 
              size={20} 
              className="mr-2 pointer-events-none transition-transform group-hover:-translate-x-0.5" 
            />
            <span className="pointer-events-none hidden sm:inline">Back</span>
          </button>

          {/* Compact title for mobile when collapsed */}
          <div className={`flex-1 mx-4 min-w-0 transition-all duration-300 ${isCollapsed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
            <h1 className={`text-lg font-semibold ${theme.accent} truncate`} title={title}>
              {title}
            </h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Info tooltip for metadata */}
            {(unitTitle || level) && (
              <div className="relative group">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Lesson information"
                >
                  <Info size={16} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {unitTitle && (
                    <div className="mb-1">
                      <span className="text-gray-300">Unit:</span> {unitTitle}
                    </div>
                  )}
                  {level && (
                    <div>
                      <span className="text-gray-300">Level:</span> {level}
                    </div>
                  )}
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            )}

            {/* Collapse toggle */}
            {collapsible && (
              <button
                onClick={toggleCollapse}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors sm:hidden"
                aria-label={isCollapsed ? "Expand header" : "Collapse header"}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Expandable content */}
        <div className={`transition-all duration-300 overflow-hidden ${
          isCollapsed ? 'max-h-0 opacity-0 -translate-y-2' : 'max-h-96 opacity-100 translate-y-0'
        }`}>
          <div className="pt-3">
            {/* Main title */}
            <h1 className={`text-xl sm:text-2xl font-bold ${theme.accent} mb-1 break-words`} title={title}>
              {title}
            </h1>

            {/* Subtitle and metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500">
              {subtitle && <span>{subtitle}</span>}
              
              {/* Desktop metadata */}
              <div className="hidden sm:flex items-center gap-3">
                {unitTitle && <span>Unit: {unitTitle}</span>}
                {level && (
                  <>
                    <span>•</span>
                    <span>{level}</span>
                  </>
                )}
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}