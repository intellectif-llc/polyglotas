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
            },
            classes: 'shepherd-theme-compact'
          }
        });

        tourData.steps.forEach((step, index) => {
          const content = step.mediaUrl 
            ? `<div style="text-align: center; padding: 8px 12px;">${step.content}<br><img src="${step.mediaUrl}" alt="${step.title}" style="max-width: 260px; margin: 6px auto; border-radius: 6px; display: block;"></div>` 
            : `<div style="text-align: center; padding: 8px 12px;">${step.content}</div>`;

          // Dynamic positioning logic
          const getOptimalPlacement = () => {
            const element = document.querySelector(step.target);
            if (!element || !step.tourProps?.autoPosition) {
              return step.placement as 'bottom' | 'top' | 'left' | 'right' || 'bottom';
            }

            const rect = element.getBoundingClientRect();
            const viewport = { width: window.innerWidth, height: window.innerHeight };
            const minSpace = step.tourProps.minSpaceRequired || 350;

            const spaceBelow = viewport.height - rect.bottom;
            const spaceAbove = rect.top;
            const spaceRight = viewport.width - rect.right;
            const spaceLeft = rect.left;

            // Try preferred placement first
            const preferred = step.placement || 'bottom';
            if (preferred === 'bottom' && spaceBelow >= minSpace) return 'bottom';
            if (preferred === 'top' && spaceAbove >= minSpace) return 'top';
            if (preferred === 'right' && spaceRight >= minSpace) return 'right';
            if (preferred === 'left' && spaceLeft >= minSpace) return 'left';

            // Fallback to best available space
            if (step.tourProps.fallbackPlacement) {
              const fallback = step.tourProps.fallbackPlacement;
              if (fallback === 'top' && spaceAbove >= minSpace) return 'top';
              if (fallback === 'bottom' && spaceBelow >= minSpace) return 'bottom';
              if (fallback === 'left' && spaceLeft >= minSpace) return 'left';
              if (fallback === 'right' && spaceRight >= minSpace) return 'right';
            }

            // Auto-select best position
            const spaces = [
              { pos: 'bottom', space: spaceBelow },
              { pos: 'top', space: spaceAbove },
              { pos: 'right', space: spaceRight },
              { pos: 'left', space: spaceLeft }
            ];
            
            const best = spaces.reduce((max, current) => 
              current.space > max.space ? current : max
            );
            
            return best.pos as 'bottom' | 'top' | 'left' | 'right';
          };
            
          tour.addStep({
            title: step.title,
            text: content,
            attachTo: {
              element: step.target,
              on: getOptimalPlacement()
            },
            buttons: [
              ...(index > 0 ? [{
                text: 'Previous',
                classes: 'shepherd-button-secondary',
                action: () => tour.back()
              }] : []),
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