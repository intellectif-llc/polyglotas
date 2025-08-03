"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import LevelSelector from "@/components/pronunciation/dashboard/LevelSelector";
import UnitsCarousel from "@/components/pronunciation/dashboard/UnitsCarousel";
import { usePronunciationUnits } from "@/hooks/pronunciation/usePronunciationData";
import { Unit } from "@/types/pronunciation";

const PronunciationDashboard = () => {
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const { data: allUnits, isLoading, error } = usePronunciationUnits();
  const router = useRouter();

  const unitsForLevel = useMemo(() => {
    if (!allUnits) return [];
    return allUnits.filter((unit: Unit) => unit.level === selectedLevel);
  }, [allUnits, selectedLevel]);

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level);
  };

  const handleUnitSelect = (unit: Unit) => {
    router.push(`/learn/unit/${unit.unit_id}`);
  };

  return (
    <div className="font-sans bg-gray-100 min-h-screen">
      <div className="bg-white p-5 text-center relative shadow-sm">
        <h2 className="text-xl font-semibold mt-6">Welcome back, User</h2>
      </div>
      <div className="bg-white p-4 sm:p-5 mb-5 shadow-sm">
        <LevelSelector
          currentLevel={selectedLevel}
          onSelectLevel={handleLevelSelect}
        />
      </div>
      <div
        className={`
          px-4 sm:px-5 py-6 sm:py-8
          transition-all duration-300
          bg-[#01d4dd] mx-4 sm:mx-5 rounded-b-xl shadow
        `}
      >
        {isLoading && <div className="text-center text-white">Loading...</div>}
        {error && (
          <div className="text-center text-red-200">Error fetching units.</div>
        )}
        {!isLoading && !error && (
          <UnitsCarousel
            units={unitsForLevel}
            onUnitSelect={handleUnitSelect}
          />
        )}
      </div>
    </div>
  );
};

export default PronunciationDashboard;
