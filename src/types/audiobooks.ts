// Database-aligned types for audiobooks functionality
export type LevelCode = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
export type PurchaseType = 'points' | 'money';
export type UserRole = 'student' | 'partnership_manager' | 'admin';

export interface AudiobookData {
  book_id: number;
  title: string;
  author: string;
  description?: string;
  cover_image_url?: string;
  language_code: string;
  level_code: LevelCode;
  duration_seconds: number;
  points_cost: number;
  price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_purchased?: boolean;
}

export interface ChapterData {
  chapter_id: number;
  book_id: number;
  chapter_title: string;
  audio_url: string;
  video_url?: string;
  duration_seconds: number;
  is_free_sample: boolean;
  chapter_order: number;
  created_at: string;
}

export interface AlignmentData {
  alignment_id: number;
  book_id: number;
  full_text: string;
  characters_data: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  words_data: Array<{
    text: string;
    start: number;
    end: number;
    loss: number;
  }>;
  loss_score?: number;
  created_at: string;
  chapter_id?: number;
}

export interface UserProgress {
  progress_id: number;
  profile_id: string;
  book_id: number;
  current_position_seconds: number;
  last_read_at: string;
  is_completed: boolean;
  completed_at?: string;
  current_chapter_id?: number;
}

export interface AudiobookWithPurchase extends AudiobookData {
  is_purchased: boolean;
  user_points: number;
  total_chapters: number;
  free_chapters: number;
}

export interface ChapterWithProgress extends ChapterData {
  user_progress?: {
    current_position_seconds: number;
    is_completed: boolean;
  };
}