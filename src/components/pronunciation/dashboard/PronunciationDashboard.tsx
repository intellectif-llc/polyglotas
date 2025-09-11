"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import LevelSelector from "@/components/pronunciation/dashboard/LevelSelector";
import UnitsCarousel from "@/components/pronunciation/dashboard/UnitsCarousel";
import { usePronunciationUnits } from "@/hooks/pronunciation/usePronunciationData";
import { useUserName } from "@/hooks/useUserName";
import { useLevelSelection } from "@/hooks/useLevelSelection";
import { Unit } from "@/types/pronunciation";

const PronunciationDashboard = () => {
  const { selectedLevel } = useLevelSelection();
  const { data: allUnits, isLoading, error } = usePronunciationUnits();
  const { data: firstName } = useUserName();
  const router = useRouter();

  const unitsForLevel = useMemo(() => {
    if (!allUnits) return [];
    return allUnits.filter((unit: Unit) => unit.level === selectedLevel);
  }, [allUnits, selectedLevel]);

  const handleUnitSelect = (unit: Unit) => {
    router.push(`/learn/${unit.unit_id}`);
  };

  return (
    <div className="font-sans bg-gray-100 min-h-screen">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-5 text-center relative shadow-lg">
        <h2 className="text-xl font-semibold text-white">
          Welcome back, {firstName || "User"}
        </h2>
      </div>
      <div className="bg-white p-4 sm:p-5 mb-5 shadow-sm">
        <LevelSelector />
      </div>
      <div
        className={`
          px-4 sm:px-5 py-6 sm:py-8
          transition-all duration-300
          bg-gradient-to-br from-purple-500 via-indigo-500 to-pink-500 mx-4 sm:mx-5 rounded-b-xl shadow-lg
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
