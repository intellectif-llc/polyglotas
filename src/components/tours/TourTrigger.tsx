"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTour } from "./TourProvider";
import { useShouldShowTour } from "@/hooks/tours/useShouldShowTour";

interface TourTriggerProps {
  tourKey: string;
  route: string;
  autoStart?: boolean;
}

export default function TourTrigger({ tourKey, route, autoStart = false }: TourTriggerProps) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { startTour } = useTour();
  const { shouldShow } = useShouldShowTour(tourKey);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && autoStart && shouldShow && pathname === route) {
      const timer = setTimeout(() => {
        startTour(tourKey);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [mounted, autoStart, shouldShow, pathname, route, tourKey, startTour]);

  return null;
}