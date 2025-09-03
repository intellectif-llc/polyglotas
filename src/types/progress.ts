// Progress-specific types aligned with database schema
// Note: Access control is handled by ProgressionGuard component
export type UnitProgressState = 
  | 'available'     // Can start - no progress yet
  | 'in_progress'   // Started but not complete - has progress && !is_unit_complete()
  | 'completed';    // All required activities done - is_unit_complete()

export type ActivityProgressState = 'not_started' | 'in_progress' | 'completed';

export type RequiredActivity = 'dictation' | 'pronunciation' | 'chat';

export interface UnitProgressData {
  unit_id: number;
  unit_title: string;
  description: string;
  level: string;
  unit_order: number;
  state: UnitProgressState;
  progress: {
    completed_lessons: number;
    total_lessons: number;
    percent: number;
  };
  activities: {
    [K in RequiredActivity]?: ActivityProgressState;
  };
  requiredActivities: RequiredActivity[];
  canAccess: boolean;
  isComplete: boolean;
}

export interface ProgressionData {
  level_code: string;
  level_available: boolean;
  unit_id: number;
  unit_available: boolean;
  lesson_id: number;
  lesson_available: boolean;
  lesson_completed: boolean;
}