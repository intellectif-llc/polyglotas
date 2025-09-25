import { Unit, Lesson, Phrase } from "@/types/pronunciation";
import { TierPermissions } from "@/hooks/useSubscriptionTier";

export type ActivityType = "dictation" | "pronunciation" | "chat";

export interface NavigationPosition {
  unitId: string;
  lessonId: string;
  activity: ActivityType;
  phraseIndex: number;
}

export interface NavigationContext {
  units: Unit[];
  currentUnit: Unit;
  currentLessons: Lesson[];
  currentLesson: Lesson;
  currentPhrases: Phrase[];
  permissions: TierPermissions;
}

export class NavigationService {
  private static getActivityOrder(permissions: TierPermissions): ActivityType[] {
    const activities: ActivityType[] = ["dictation"];
    
    if (permissions.canAccessPractice) {
      activities.push("pronunciation");
    }
    
    if (permissions.canAccessChat) {
      activities.push("chat");
    }
    
    return activities;
  }

  private static findUnitById(units: Unit[], unitId: string): Unit | null {
    return units.find(unit => unit.unit_id.toString() === unitId) || null;
  }

  private static findLessonById(lessons: Lesson[], lessonId: string): Lesson | null {
    return lessons.find(lesson => lesson.lesson_id.toString() === lessonId) || null;
  }

  static getNextPosition(
    current: NavigationPosition,
    context: NavigationContext
  ): NavigationPosition | null {
    const { units, currentLessons, currentPhrases, permissions } = context;
    const activityOrder = this.getActivityOrder(permissions);
    const currentActivityIndex = activityOrder.indexOf(current.activity);

    // For chat activity, skip phrase navigation since it doesn't have phrases
    if (current.activity !== "chat") {
      // Within current phrase set - move to next phrase in same activity
      if (current.phraseIndex < currentPhrases.length - 1) {
        return {
          ...current,
          phraseIndex: current.phraseIndex + 1
        };
      }
    }

    // End of phrases in current activity - move to next activity in same lesson
    if (currentActivityIndex < activityOrder.length - 1) {
      return {
        ...current,
        activity: activityOrder[currentActivityIndex + 1],
        phraseIndex: 0
      };
    }

    // End of activities in current lesson - move to next lesson
    const currentLesson = this.findLessonById(currentLessons, current.lessonId);
    if (!currentLesson) return null;

    const nextLesson = currentLessons.find(
      lesson => lesson.lesson_order === currentLesson.lesson_order + 1
    );

    if (nextLesson) {
      return {
        unitId: current.unitId,
        lessonId: nextLesson.lesson_id.toString(),
        activity: activityOrder[0], // Start with first available activity
        phraseIndex: 0
      };
    }

    // End of lessons in current unit - move to next unit
    const currentUnit = this.findUnitById(units, current.unitId);
    if (!currentUnit) return null;

    const nextUnit = units.find(
      unit => unit.unit_order === currentUnit.unit_order + 1
    );

    if (nextUnit) {
      // We need to fetch the first lesson of the next unit
      // This will require additional data fetching, so we return a special indicator
      return {
        unitId: nextUnit.unit_id.toString(),
        lessonId: "FETCH_FIRST_LESSON",
        activity: activityOrder[0],
        phraseIndex: 0
      };
    }

    // No more content
    return null;
  }

  static getPreviousPosition(
    current: NavigationPosition,
    context: NavigationContext
  ): NavigationPosition | null {
    const { units, currentLessons, currentPhrases, permissions } = context;
    const activityOrder = this.getActivityOrder(permissions);
    const currentActivityIndex = activityOrder.indexOf(current.activity);

    // For chat activity, skip phrase navigation since it doesn't have phrases
    if (current.activity !== "chat") {
      // Within current phrase set - move to previous phrase in same activity
      if (current.phraseIndex > 0) {
        return {
          ...current,
          phraseIndex: current.phraseIndex - 1
        };
      }
    }

    // Beginning of phrases in current activity - move to previous activity in same lesson
    if (currentActivityIndex > 0) {
      const previousActivity = activityOrder[currentActivityIndex - 1];
      return {
        ...current,
        activity: previousActivity,
        phraseIndex: previousActivity === "chat" ? 0 : currentPhrases.length - 1
      };
    }

    // Beginning of activities in current lesson - move to previous lesson
    const currentLesson = this.findLessonById(currentLessons, current.lessonId);
    if (!currentLesson) return null;

    const previousLesson = currentLessons.find(
      lesson => lesson.lesson_order === currentLesson.lesson_order - 1
    );

    if (previousLesson) {
      return {
        unitId: current.unitId,
        lessonId: previousLesson.lesson_id.toString(),
        activity: activityOrder[activityOrder.length - 1], // Start with last available activity
        phraseIndex: -1 // Special value indicating "last phrase" - will be resolved by the hook
      };
    }

    // Beginning of lessons in current unit - move to previous unit
    const currentUnit = this.findUnitById(units, current.unitId);
    if (!currentUnit) return null;

    const previousUnit = units.find(
      unit => unit.unit_order === currentUnit.unit_order - 1
    );

    if (previousUnit) {
      return {
        unitId: previousUnit.unit_id.toString(),
        lessonId: "FETCH_LAST_LESSON",
        activity: activityOrder[activityOrder.length - 1],
        phraseIndex: -1 // Special value indicating "last phrase"
      };
    }

    // No more content
    return null;
  }

  static canNavigateNext(
    current: NavigationPosition,
    context: NavigationContext
  ): boolean {
    return this.getNextPosition(current, context) !== null;
  }

  static canNavigatePrevious(
    current: NavigationPosition,
    context: NavigationContext
  ): boolean {
    return this.getPreviousPosition(current, context) !== null;
  }
}