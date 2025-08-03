import { useState, useCallback } from "react";

// Define UI states
export const UIState = {
  Idle: "Idle",
  RequestingPermissions: "RequestingPermissions",
  Listening: "Listening",
  Processing: "Processing",
  DisplayingResults: "DisplayingResults",
  Error: "Error",
} as const;

export type UIStateType = (typeof UIState)[keyof typeof UIState];

// Assessment results interface - matching the service exactly
export interface AssessmentResults {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  prosodyScore: number;
  pronScore: number;
  words: WordResult[];
  recognizedText: string;
  referenceText: string;
  isScripted?: boolean;
  omittedWords?: string[];
}

export interface WordResult {
  word: string;
  accuracyScore: number;
  errorType?: string;
  offset?: number;
  duration?: number;
  syllables?: SyllableResult[];
  phonemes?: PhonemeResult[];
}

export interface SyllableResult {
  syllable: string;
  grapheme?: string;
  accuracyScore: number;
  offset?: number;
  duration?: number;
  phonemes?: PhonemeResult[];
}

export interface PhonemeResult {
  phoneme: string;
  accuracyScore: number;
  offset?: number;
  duration?: number;
  nBestPhonemes?: Array<{
    phoneme: string;
    score: number;
  }>;
}

/**
 * Custom hook to manage the recognition state
 *
 * @param defaultReferenceText - Default reference text for pronunciation assessment
 * @returns Recognition state and setter functions
 */
export const useRecognitionState = (
  defaultReferenceText: string = "Good morning."
) => {
  const [uiState, setUiState] = useState<UIStateType>(UIState.Idle);
  const [referenceText, setReferenceText] =
    useState<string>(defaultReferenceText);
  const [assessmentResults, setAssessmentResults] =
    useState<AssessmentResults | null>(null);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const resetState = useCallback(() => {
    setAssessmentResults(null);
    setErrorMessages([]);
  }, []);

  return {
    uiState,
    setUiState,
    referenceText,
    setReferenceText,
    assessmentResults,
    setAssessmentResults,
    errorMessages,
    setErrorMessages,
    resetState,
    UIState,
  };
};
