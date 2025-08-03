import React from "react";
import UnitCard from "@/components/pronunciation/dashboard/UnitCard";
import { Unit } from "@/types/pronunciation";

const UnitsCarousel = ({
  units,
  onUnitSelect,
}: {
  units: Unit[];
  onUnitSelect: (unit: Unit) => void;
}) => {
  if (units.length === 0) {
    return (
      <div className="text-center text-white p-5">
        No units found for this level.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {units.map((unit) => (
        <UnitCard
          key={unit.unit_id}
          unit={unit}
          onSelect={() => onUnitSelect(unit)}
        />
      ))}
    </div>
  );
};

export default UnitsCarousel;
