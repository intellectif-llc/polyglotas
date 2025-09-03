export interface Tour {
  tour_id: number;
  tour_key: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TourStep {
  step_id: number;
  tour_id: number;
  step_order: number;
  page_route: string;
  target_selector: string;
  title: string;
  content: string;
  tour_props: { placement?: string } | null;
  created_at: string;
  updated_at: string;
}

export interface UserTourProgress {
  profile_id: string;
  tour_id: number;
  status: 'pending' | 'in_progress' | 'completed';
  last_completed_step: number;
  completed_at?: string;
  updated_at: string;
}

export type TourProgressStatus = 'pending' | 'in_progress' | 'completed';