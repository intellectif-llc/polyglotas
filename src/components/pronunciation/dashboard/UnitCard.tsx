import React from "react";
import { Unit } from "@/types/pronunciation";
import { ProgressionGuard } from "@/components/ProgressionGuard";
import { useUserProfile } from "@/hooks/useUserProfile";

const UnitCard = ({ unit, onSelect }: { unit: Unit; onSelect: () => void }) => {
  const { data: profile } = useUserProfile();
  const { unit_title, description, progress } = unit;
  const progressPercent = progress?.percent || 0;

  if (!profile?.profile_id) {
    return null;
  }

  return (
    <ProgressionGuard profileId={profile.profile_id} unitId={unit.unit_id}>
      <div
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === "Enter" && onSelect()}
        aria-label={`Unit ${unit.unit_order}: ${unit_title}`}
        className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between min-h-[160px] cursor-pointer transition-shadow duration-200 hover:shadow-lg"
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="flex items-center text-gray-500 text-sm">
              <span className="w-4 h-4 rounded-full border-2 border-teal-400 inline-block mr-2"></span>
              Unit {unit.unit_order}
            </span>
          </div>
          <h3
            className="text-base font-bold text-gray-800 mb-1 truncate"
            title={unit_title}
          >
            {unit_title}
          </h3>
          {description && (
            <p
              className="text-sm text-gray-600 mb-3 line-clamp-2"
              title={description}
            >
              {description}
            </p>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-teal-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>
    </ProgressionGuard>
  );
};

export default UnitCard;
