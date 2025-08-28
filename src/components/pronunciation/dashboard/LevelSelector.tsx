import React from "react";
import { useLanguageLevels } from "@/hooks/useLanguageLevels";



function LevelSelector({ currentLevel, onSelectLevel }: { currentLevel: string; onSelectLevel: (level: string) => void }) {
  const { data: levels = [] } = useLanguageLevels();

  return (
    <div className="flex justify-center items-center space-x-2 sm:space-x-3">
      {levels.map((level) => {
        const isSelected = currentLevel === level.level_code;
        return (
          <button
            key={level.level_code}
            onClick={() => onSelectLevel(level.level_code)}
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
                  ? "bg-gray-800 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }
            `}
          >
            {level.level_code}
          </button>
        );
      })}
    </div>
  );
}

export default LevelSelector;
