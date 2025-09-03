"use client";

import React, { createContext, useContext } from "react";
import { useTourState } from "@/hooks/tours/useTourState";

interface TourContextType {
  startTour: (tourKey: string) => void;
  stopTour: () => void;
  isRunning: boolean;
}

const TourContext = createContext<TourContextType | null>(null);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

export default function TourProvider({ children }: TourProviderProps) {
  const { startTour, stopTour, isRunning } = useTourState();

  return (
    <TourContext.Provider value={{ startTour, stopTour, isRunning }}>
      {children}
    </TourContext.Provider>
  );
}