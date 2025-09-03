"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLessonPhrases } from "@/hooks/pronunciation/usePronunciationData";
import ReferenceTextDisplay from "./ReferenceTextDisplay";
import PhraseStepper from "./PhraseStepper";
import AudioRecorderUI from "@/components/speech/AudioRecorderUI";
import ResultsDisplay from "@/components/speech/ResultsDisplay";
import { useRecognitionState } from "@/hooks/speech/useRecognitionState";
import { useSpeechRecognition } from "@/hooks/speech/useSpeechRecognition";
import { useLastSpeechAttempt } from "@/hooks/speech/useLastSpeechAttempt";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ActivitySwitcher from "../shared/ActivitySwitcher";
import { useAdvancedNavigation } from "@/hooks/useAdvancedNavigation";

export default function LessonPracticeView() {
  const params = useParams();
  const router = useRouter();

  const unitId = typeof params.unitId === "string" ? params.unitId : "";
  const lessonId = typeof params.lessonId === "string" ? params.lessonId : "";
  const { data, isLoading, error } = useLessonPhrases(lessonId);

  // State for navigation
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Speech assessment state management - matching sample project exactly
  const {
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
  } = useRecognitionState();

  // Get last attempt for current phrase
  const { data: lastAttemptData } = useLastSpeechAttempt(
    lessonId,
    data?.phrases?.[currentPhraseIndex]?.id
  );

  // Update reference text and load last attempt when phrase changes
  React.useEffect(() => {
    if (data?.phrases?.[currentPhraseIndex]?.phrase_text) {
      setReferenceText(data.phrases[currentPhraseIndex].phrase_text);

      // Load last attempt if it exists, otherwise reset state
      if (lastAttemptData?.attempt) {
        setAssessmentResults(lastAttemptData.attempt.assessmentResults);
        setUiState(UIState.DisplayingResults);
      } else {
        resetState();
      }
    }
  }, [
    currentPhraseIndex,
    data?.phrases,
    setReferenceText,
    lastAttemptData,
    setAssessmentResults,
    setUiState,
    UIState,
    resetState,
  ]);

  // Auto-save attempt completion callback
  const handleRecognitionComplete = useCallback(
    () => {
      // Note: Auto-saving is handled by useSpeechRecognition hook
      // This callback is just for UI updates
    },
    []
  );

  // Speech recognition hook - matching sample project parameters
  const { startRecording, stopRecording, cleanupRecognizer } =
    useSpeechRecognition({
      referenceText,
      setUiState,
      setAssessmentResults,
      setErrorMessages,
      UIState,
      lessonId,
      phraseId: data?.phrases?.[currentPhraseIndex]?.id,
      onRecognitionComplete: handleRecognitionComplete,
    });

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupRecognizer();
    };
  }, [cleanupRecognizer]);

  const {
    canNavigateNext: canAdvancedNext,
    canNavigatePrevious: canAdvancedPrevious,
    navigateNext: advancedNext,
    navigatePrevious: advancedPrevious
  } = useAdvancedNavigation({
    unitId,
    lessonId,
    activity: "practice",
    phraseIndex: currentPhraseIndex
  });

  const handleNext = async () => {
    // First try local phrase navigation
    if (data && currentPhraseIndex < data.phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
      return;
    }
    
    // If at last phrase, use advanced navigation for cross-activity/lesson navigation
    if (canAdvancedNext) {
      await advancedNext();
    }
  };

  const handlePrevious = async () => {
    // First try local phrase navigation
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
      return;
    }
    
    // If at first phrase, use advanced navigation for cross-activity/lesson navigation
    if (canAdvancedPrevious) {
      await advancedPrevious();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading lesson</p>
          <button
            onClick={() => router.push(`/learn/${unitId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.phrases || data.phrases.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No phrases found for this lesson</p>
          <button
            onClick={() => router.push(`/learn/${unitId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  const currentPhrase = data.phrases[currentPhraseIndex];
  const totalPhrases = data.phrases.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/learn/${unitId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Lessons
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {data.lesson?.lesson_title || "Lesson"} - Practice
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            Unit {data.lesson?.unit_title || unitId} •{" "}
            {data.lesson?.level || ""}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Activity Switcher */}
        <ActivitySwitcher
          unitId={unitId}
          lessonId={lessonId}
          currentActivity="practice"
        />

        {/* Phrase Stepper */}
        <PhraseStepper
          phrases={data.phrases}
          currentPhraseIndex={currentPhraseIndex}
          onSelectPhrase={(index) => {
            setCurrentPhraseIndex(index);
            // State will be updated in useEffect based on last attempt
          }}
        />

        {/* Main Phrase Area - matching sample project layout */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative min-h-[350px]">
          <div className="text-center mb-4 text-sm text-gray-500">
            Phrase {currentPhraseIndex + 1} of {totalPhrases}
          </div>

          <div className="flex items-center justify-center">
            {currentPhrase ? (
              <ReferenceTextDisplay
                text={currentPhrase.phrase_text}
                audioUrlNormal={currentPhrase.audio_url_normal}
                audioUrlSlow={currentPhrase.audio_url_slow}
                phraseId={currentPhrase.id}
              />
            ) : (
              <p className="text-center text-gray-400">Loading phrase...</p>
            )}
          </div>

          {/* Audio Recorder UI - exactly like sample project */}
          <AudioRecorderUI
            uiState={uiState}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            assessmentResults={assessmentResults}
            className="mb-20"
          />

          {/* Navigation Buttons - Enhanced with cross-content navigation */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={
                (!canAdvancedPrevious && currentPhraseIndex === 0) ||
                uiState === UIState.Listening ||
                uiState === UIState.Processing
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={
                (!canAdvancedNext && currentPhraseIndex >= totalPhrases - 1) ||
                uiState === UIState.Listening ||
                uiState === UIState.Processing
              }
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Results Area - matching sample project */}
        <ResultsDisplay
          results={assessmentResults}
          errorMessages={errorMessages}
          uiState={uiState}
        />
      </div>
    </div>
  );
}
