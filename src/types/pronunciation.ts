export interface Unit {
  unit_id: number;
  level: string;
  unit_order: number;
  unit_title: string;
  description: string;
  progress: {
    completed_lessons: number;
    total_lessons: number;
    percent: number;
  };
}
