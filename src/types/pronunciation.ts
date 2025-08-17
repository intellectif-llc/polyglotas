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

export interface Lesson {
  lesson_id: number;
  unit_id: number;
  lesson_order: number;
  total_phrases: number;
  lesson_title: string;
  is_completed: boolean;
  phrases_completed: number;
  unit_title?: string;
  level?: string;
}

export interface Phrase {
  id: number;
  phrase_order: number;
  concept_description: string;
  phrase_text: string;
  audio_url_normal: string;
  audio_url_slow: string;
  is_completed: boolean;
  dictation_completed?: boolean;
  pronunciation_completed?: boolean;
}

export interface DictationAttempt {
  overall_similarity_score: number;
  word_level_feedback: Array<{
    reference_word: string;
    written_word: string;
    similarity_score: number;
    position_in_phrase: number;
  }>;
  is_correct: boolean;
  points_awarded?: number;
  written_text?: string;
}
