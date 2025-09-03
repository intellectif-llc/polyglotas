"use client";

import { useState, useCallback, useEffect } from "react";
import Shepherd from "shepherd.js";

type ShepherdTour = InstanceType<typeof Shepherd.Tour>;
import { useTourData } from "./useTourData";
import { useTourProgress } from "./useTourProgress";

interface TourState {
  startTour: (tourKey: string) => void;
  stopTour: () => void;
  isRunning: boolean;
}

export function useTourState(): TourState {
  const [currentTourKey, setCurrentTourKey] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [shepherdTour, setShepherdTour] = useState<ShepherdTour | null>(null);

  const { data: tourData } = useTourData(currentTourKey);
  const { updateProgress } = useTourProgress();

  useEffect(() => {
    if (tourData && currentTourKey && !shepherdTour) {
      // Wait for elements to be available before starting tour
      const checkElements = () => {
        const firstElement = document.querySelector(tourData.steps[0]?.target);
        if (!firstElement) {
          setTimeout(checkElements, 500);
          return;
        }

        const tour = new Shepherd.Tour({
          useModalOverlay: true,
          defaultStepOptions: {
            scrollTo: { behavior: 'smooth', block: 'center' },
            cancelIcon: {
              enabled: true
            }
          }
        });

        tourData.steps.forEach((step, index) => {
          tour.addStep({
            title: step.title,
            text: step.content,
            attachTo: {
              element: step.target,
              on: (step.placement as 'bottom' | 'top' | 'left' | 'right') || 'bottom'
            },
            buttons: [
              {
                text: 'Skip Tour',
                classes: 'shepherd-button-secondary',
                action: () => tour.cancel()
              },
              {
                text: index === tourData.steps.length - 1 ? 'Finish' : 'Next',
                action: () => {
                  // Close translation modal on step 1
                  if (index === 0) {
                    window.getSelection()?.removeAllRanges();
                    const closeEvent = new MouseEvent('click', { bubbles: true });
                    document.body.dispatchEvent(closeEvent);
                  }
                  updateProgress({ tourKey: currentTourKey, lastCompletedStep: index + 1 });
                  tour.next();
                }
              }
            ],
            modalOverlayOpeningPadding: index === tourData.steps.length - 1 ? 10 : 4
          });
        });

        tour.on('complete', () => {
          updateProgress({ tourKey: currentTourKey, lastCompletedStep: -1 });
          setTimeout(() => {
            setIsRunning(false);
            setCurrentTourKey(null);
            setShepherdTour(null);
          }, 100);
        });

        tour.on('cancel', () => {
          setIsRunning(false);
          setCurrentTourKey(null);
          setShepherdTour(null);
        });

        setShepherdTour(tour);
        tour.start();
        setIsRunning(true);
      };

      checkElements();
    }
  }, [tourData, currentTourKey, shepherdTour, updateProgress]);

  const startTour = useCallback((tourKey: string) => {
    if (!isRunning) {
      setCurrentTourKey(tourKey);
    }
  }, [isRunning]);

  const stopTour = useCallback(() => {
    if (shepherdTour) {
      shepherdTour.cancel();
    }
    setIsRunning(false);
    setCurrentTourKey(null);
    setShepherdTour(null);
  }, [shepherdTour]);

  return {
    startTour,
    stopTour,
    isRunning,
  };
}