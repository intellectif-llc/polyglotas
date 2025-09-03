"use client";

import React from "react";
import { useTour } from "./TourProvider";

interface ManualTourButtonProps {
  tourKey: string;
  children: React.ReactNode;
  className?: string;
}

export default function ManualTourButton({ 
  tourKey, 
  children, 
  className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" 
}: ManualTourButtonProps) {
  const { startTour } = useTour();

  return (
    <button
      onClick={() => startTour(tourKey)}
      className={className}
    >
      {children}
    </button>
  );
}