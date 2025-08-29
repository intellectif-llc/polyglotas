import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSubscriptionTier } from "./useSubscriptionTier";
import { usePronunciationUnits, useUnitLessons, useLessonPhrases } from "./pronunciation/usePronunciationData";
import { NavigationService, NavigationPosition, ActivityType } from "@/services/navigationService";
import { fetchUnitLessons, fetchLessonPhrases } from "@/services/pronunciationApi";

interface UseAdvancedNavigationProps {
  unitId: string;
  lessonId: string;
  activity: ActivityType;
  phraseIndex: number;
}

export const useAdvancedNavigation = ({
  unitId,
  lessonId,
  activity,
  phraseIndex
}: UseAdvancedNavigationProps) => {
  const router = useRouter();
  const { permissions } = useSubscriptionTier();
  const [isNavigating, setIsNavigating] = useState(false);

  // Fetch required data
  const { data: unitsData } = usePronunciationUnits();
  const { data: lessonsData } = useUnitLessons(unitId);
  const { data: phrasesData } = useLessonPhrases(lessonId);

  const currentPosition = useMemo((): NavigationPosition => ({
    unitId,
    lessonId,
    activity,
    phraseIndex
  }), [unitId, lessonId, activity, phraseIndex]);

  const navigationContext = useMemo(() => {
    if (!unitsData || !lessonsData || !phrasesData) return null;

    const currentUnit = unitsData.find(u => u.unit_id.toString() === unitId);
    const currentLesson = lessonsData.lessons.find(l => l.lesson_id.toString() === lessonId);

    if (!currentUnit || !currentLesson) return null;

    return {
      units: unitsData,
      currentUnit,
      currentLessons: lessonsData.lessons,
      currentLesson,
      currentPhrases: phrasesData.phrases,
      permissions
    };
  }, [unitsData, lessonsData, phrasesData, unitId, lessonId, permissions]);

  const canNavigateNext = useMemo(() => {
    if (!navigationContext) return false;
    return NavigationService.canNavigateNext(currentPosition, navigationContext);
  }, [currentPosition, navigationContext]);

  const canNavigatePrevious = useMemo(() => {
    if (!navigationContext) return false;
    return NavigationService.canNavigatePrevious(currentPosition, navigationContext);
  }, [currentPosition, navigationContext]);

  const navigateNext = useCallback(async () => {
    if (!navigationContext || isNavigating) return null;

    setIsNavigating(true);
    try {
      const nextPosition = NavigationService.getNextPosition(currentPosition, navigationContext);
      
      if (!nextPosition) {
        setIsNavigating(false);
        return null;
      }

      // Handle special cases that require data fetching
      if (nextPosition.lessonId === "FETCH_FIRST_LESSON") {
        // Need to fetch first lesson of the next unit
        try {
          const unitLessons = await fetchUnitLessons(nextPosition.unitId);
          if (unitLessons.lessons.length > 0) {
            const firstLesson = unitLessons.lessons[0];
            const targetPath = `/learn/${nextPosition.unitId}/lesson/${firstLesson.lesson_id}/${nextPosition.activity}`;
            router.push(targetPath);
            return {
              ...nextPosition,
              lessonId: firstLesson.lesson_id.toString()
            };
          }
        } catch (error) {
          console.error("Failed to fetch first lesson:", error);
          // Fallback to unit page
          router.push(`/learn/${nextPosition.unitId}`);
        }
        return nextPosition;
      }

      // Navigate to the next position
      const targetPath = `/learn/${nextPosition.unitId}/lesson/${nextPosition.lessonId}/${nextPosition.activity}`;
      router.push(targetPath);
      
      return nextPosition;
    } finally {
      setIsNavigating(false);
    }
  }, [currentPosition, navigationContext, router, isNavigating]);

  const navigatePrevious = useCallback(async () => {
    if (!navigationContext || isNavigating) return null;

    setIsNavigating(true);
    try {
      const previousPosition = NavigationService.getPreviousPosition(currentPosition, navigationContext);
      
      if (!previousPosition) {
        setIsNavigating(false);
        return null;
      }

      // Handle special cases that require data fetching
      if (previousPosition.lessonId === "FETCH_LAST_LESSON") {
        // Need to fetch last lesson of the previous unit
        try {
          const unitLessons = await fetchUnitLessons(previousPosition.unitId);
          if (unitLessons.lessons.length > 0) {
            const lastLesson = unitLessons.lessons[unitLessons.lessons.length - 1];
            
            // If we need the last phrase index, fetch lesson phrases
            let finalPhraseIndex = previousPosition.phraseIndex;
            if (previousPosition.phraseIndex === -1) {
              try {
                const lessonPhrases = await fetchLessonPhrases(lastLesson.lesson_id.toString());
                finalPhraseIndex = Math.max(0, lessonPhrases.phrases.length - 1);
              } catch (error) {
                console.error("Failed to fetch lesson phrases:", error);
                finalPhraseIndex = 0;
              }
            }
            
            const targetPath = `/learn/${previousPosition.unitId}/lesson/${lastLesson.lesson_id}/${previousPosition.activity}`;
            router.push(targetPath);
            return {
              ...previousPosition,
              lessonId: lastLesson.lesson_id.toString(),
              phraseIndex: finalPhraseIndex
            };
          }
        } catch (error) {
          console.error("Failed to fetch last lesson:", error);
          // Fallback to unit page
          router.push(`/learn/${previousPosition.unitId}`);
        }
        return previousPosition;
      }

      // Handle case where we need to resolve the last phrase index
      let finalPosition = previousPosition;
      if (previousPosition.phraseIndex === -1) {
        try {
          const lessonPhrases = await fetchLessonPhrases(previousPosition.lessonId);
          finalPosition = {
            ...previousPosition,
            phraseIndex: Math.max(0, lessonPhrases.phrases.length - 1)
          };
        } catch (error) {
          console.error("Failed to fetch lesson phrases for phrase index:", error);
          finalPosition = {
            ...previousPosition,
            phraseIndex: 0
          };
        }
      }

      // Navigate to the previous position
      const targetPath = `/learn/${finalPosition.unitId}/lesson/${finalPosition.lessonId}/${finalPosition.activity}`;
      router.push(targetPath);
      
      return finalPosition;
    } finally {
      setIsNavigating(false);
    }
  }, [currentPosition, navigationContext, router, isNavigating]);

  return {
    canNavigateNext,
    canNavigatePrevious,
    navigateNext,
    navigatePrevious,
    isNavigating,
    currentPosition,
    navigationContext
  };
};