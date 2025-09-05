import React from "react";
import { useLanguageLevels } from "@/hooks/useLanguageLevels";
import { useLevelSelection } from "@/hooks/useLevelSelection";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ProgressionGuard } from "@/components/ProgressionGuard";

function LevelSelector() {
  const { data: levels = [] } = useLanguageLevels();
  const { selectedLevel, selectLevel } = useLevelSelection();
  const { data: profile } = useUserProfile();

  if (!profile) return null;

  return (
    <div className="flex justify-center items-center space-x-2 sm:space-x-3">
      {levels.map((level) => {
        const isSelected = selectedLevel === level.level_code;
        return (
          <ProgressionGuard
            key={level.level_code}
            profileId={profile.profile_id}
            levelCode={level.level_code}
            fallback={
              <div className="relative">
                <button
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 text-gray-400 cursor-not-allowed flex items-center justify-center font-semibold text-lg sm:text-xl border border-gray-300"
                  disabled
                >
                  {level.level_code}
                </button>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 rounded-full p-1">
                    <div className="text-lg">🔒</div>
                  </div>
                </div>
              </div>
            }
          >
            <button
              onClick={() => selectLevel(level.level_code)}
              className={`
                w-12 h-12 sm:w-14 sm:h-14
                rounded-full
                flex items-center justify-center
                font-semibold text-lg sm:text-xl
                cursor-pointer
                transition-colors duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500
                ${
                  isSelected
                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-600 border border-gray-200"
                }
              `}
            >
              {level.level_code}
            </button>
          </ProgressionGuard>
        );
      })}
    </div>
  );
}

export default LevelSelector;
