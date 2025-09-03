"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useLanguageLevels } from "@/hooks/useLanguageLevels";
import { useLevelSelection } from "@/hooks/useLevelSelection";
import { useCanAccessLevel } from "@/hooks/useProgression";

interface LevelSelectorProps {
  isCollapsed: boolean;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ isCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useUserProfile();
  const { data: levels = [] } = useLanguageLevels();
  const { selectedLevel, selectLevel } = useLevelSelection();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLevel = selectedLevel;

  if (!profile) return null;

  if (isCollapsed) {
    return (
      <div className="flex justify-center px-2 py-3">
        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
          {currentLevel}
        </div>
      </div>
    );
  }

  return (
    <div
      className="px-4 py-3 border-b border-gray-200 dark:border-gray-700"
      ref={dropdownRef}
    >
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {currentLevel}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Level {currentLevel}
              </div>
              {/*               <div className="text-xs text-gray-500 dark:text-gray-400">
                {userStats?.completedUnits || 0}/{userStats?.totalUnits || 0} units
              </div> */}
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                Available Levels
              </div>
              {levels.map((level) => {
                const LevelButton = () => {
                  const { data: canAccess } = useCanAccessLevel(
                    profile?.profile_id || "",
                    level.level_code
                  );
                  const isAccessible = canAccess ?? false;
                  const isCurrent = level.level_code === currentLevel;

                  return (
                    <button
                      onClick={() => {
                        if (isAccessible) {
                          selectLevel(level.level_code);
                          setIsOpen(false);
                        }
                      }}
                      disabled={!isAccessible}
                      className={`w-full flex items-center space-x-3 px-2 py-2 rounded-md text-sm transition-colors ${
                        !isAccessible
                          ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          : isCurrent
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold relative ${
                          !isAccessible
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-400"
                            : isCurrent
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {!isAccessible ? (
                          <LockClosedIcon className="w-3 h-3" />
                        ) : (
                          level.level_code
                        )}
                      </div>
                      <span>Level {level.level_code}</span>
                      {!isAccessible && (
                        <span className="ml-auto text-xs text-gray-400">
                          Locked
                        </span>
                      )}
                      {isCurrent && isAccessible && (
                        <span className="ml-auto text-xs text-blue-500">
                          Current
                        </span>
                      )}
                    </button>
                  );
                };

                return <LevelButton key={level.level_code} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelSelector;
