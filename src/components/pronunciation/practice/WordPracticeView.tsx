"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useWordsNeedingPractice,
  useWordPracticeAttempt,
} from "@/hooks/useWordPractice";
import WordReferenceDisplay from "./WordReferenceDisplay";
import AudioRecorderUI from "@/components/speech/AudioRecorderUI";
import ResultsDisplay from "@/components/speech/ResultsDisplay";
import { useRecognitionState } from "@/hooks/speech/useRecognitionState";
import { useSpeechRecognition } from "@/hooks/speech/useSpeechRecognition";
import { AssessmentResults } from "@/hooks/speech/useRecognitionState";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import LessonHeader from "@/components/shared/LessonHeader";

export default function WordPracticeView() {
  const router = useRouter();
  const { data: words, isLoading, refetch } = useWordsNeedingPractice();
  const wordPracticeAttempt = useWordPracticeAttempt();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());
  const [wordResults, setWordResults] = useState<
    Map<string, AssessmentResults>
  >(new Map());

  // Reset index if it's out of bounds after words list changes
  useEffect(() => {
    if (words && currentWordIndex >= words.length && words.length > 0) {
      setCurrentWordIndex(words.length - 1);
    }
  }, [words, currentWordIndex]);

  // Speech assessment state management
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

  // Update reference text when word changes
  useEffect(() => {
    if (words && words[currentWordIndex]) {
      const currentWord = words[currentWordIndex];
      setReferenceText(currentWord.word_text);

      // Check if we have saved results for this word
      const savedResults = wordResults.get(currentWord.word_text);
      if (savedResults) {
        setAssessmentResults(savedResults);
        setUiState(UIState.DisplayingResults);
      } else {
        resetState();
      }
    }
  }, [
    currentWordIndex,
    words,
    setReferenceText,
    resetState,
    wordResults,
    setAssessmentResults,
    setUiState,
    UIState,
  ]);

  // Handle recognition completion
  const handleRecognitionComplete = useCallback(
    (results: AssessmentResults) => {
      const currentWord = words?.[currentWordIndex];
      if (!currentWord || !results.accuracyScore) return;

      // Save results for this word
      setWordResults(
        (prev) => new Map(prev.set(currentWord.word_text, results))
      );

      // Submit word practice attempt
      wordPracticeAttempt.mutate(
        {
          wordText: currentWord.word_text,
          accuracyScore: results.accuracyScore,
        },
        {
          onSuccess: (response) => {
            if (response.wordCompleted) {
              setCompletedWords(
                (prev) => new Set([...prev, currentWord.word_text])
              );
            }
          },
          onError: () => {
            setErrorMessages((prev) => [
              ...prev,
              "Failed to save your attempt. Please try again.",
            ]);
          },
        }
      );
    },
    [
      words,
      currentWordIndex,
      wordPracticeAttempt,
      setErrorMessages,
      setWordResults,
    ]
  );

  // Speech recognition hook
  const { startRecording, stopRecording, cleanupRecognizer } =
    useSpeechRecognition({
      referenceText,
      setUiState,
      setAssessmentResults,
      setErrorMessages,
      UIState,
      onRecognitionComplete: handleRecognitionComplete,
    });

  useEffect(() => {
    return () => {
      cleanupRecognizer();
    };
  }, [cleanupRecognizer]);

  const handleNext = useCallback(() => {
    if (!words) return;

    // If current word is completed, refetch data to get updated list
    const currentWord = words[currentWordIndex];
    if (currentWord && completedWords.has(currentWord.word_text)) {
      refetch().then(() => {
        // After refetch, adjust index if needed
        if (currentWordIndex >= (words?.length || 0)) {
          setCurrentWordIndex(Math.max(0, (words?.length || 1) - 1));
        }
      });
    } else if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  }, [words, currentWordIndex, completedWords, refetch]);

  const handlePrevious = useCallback(() => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  }, [currentWordIndex]);

  const handleBackToLearn = useCallback(() => {
    router.push("/learn");
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't interfere when recording or processing
      if (uiState === UIState.Listening || uiState === UIState.Processing) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          if (currentWordIndex > 0) {
            handlePrevious();
          }
          break;
        case "ArrowRight":
          if (words && currentWordIndex < words.length - 1) {
            handleNext();
          }
          break;
        case "Escape":
          handleBackToLearn();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentWordIndex,
    words,
    uiState,
    UIState,
    handleNext,
    handlePrevious,
    handleBackToLearn,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading words...</p>
        </div>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Excellent work! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            All your words are performing well. You have mastered the
            challenging words and your pronunciation is improving!
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBackToLearn}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Learning
            </button>
            <button
              onClick={() => router.push("/learn")}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];
  const totalWords = words.length;
  const isCompleted = currentWord
    ? completedWords.has(currentWord.word_text)
    : false;

  // Safety check - if currentWord is undefined, show completion screen
  if (!currentWord) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Excellent work! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            All your words are performing well. You have mastered the
            challenging words and your pronunciation is improving!
          </p>
          <div className="space-y-3">
            <button
              onClick={handleBackToLearn}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Learning
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LessonHeader
        title="Word Practice"
        onBack={handleBackToLearn}
        activity="word-practice"
        collapsible
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress indicator */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Word {currentWordIndex + 1} of {totalWords}
            </span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-600">
                ✓ {completedWords.size} completed
              </span>
              <span className="text-gray-500">
                Avg: {Math.round(currentWord.average_accuracy_score)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentWordIndex + 1) / totalWords) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Progress through words</span>
            <span>
              {Math.round(((currentWordIndex + 1) / totalWords) * 100)}%
            </span>
          </div>
        </div>

        {/* Word Practice Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative min-h-[480px]">
          {isCompleted && (
            <div className="absolute top-4 right-4 flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
              <CheckCircle size={16} className="mr-1" />
              Completed!
            </div>
          )}

          {/* Word Display with Speech Synthesis */}
          <div className="mb-6">
            <WordReferenceDisplay word={currentWord.word_text} />
          </div>

          {/* Word Stats */}
          <div className="text-center mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex flex-col items-center">
                <span className="text-gray-500">Current Average</span>
                <span className="text-lg font-semibold text-blue-600">
                  {Math.round(currentWord.average_accuracy_score)}%
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500">Attempts</span>
                <span className="text-lg font-semibold text-gray-700">
                  {currentWord.total_attempts}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-500">Errors</span>
                <span className="text-lg font-semibold text-orange-600">
                  {currentWord.error_count}
                </span>
              </div>
              {isCompleted && (
                <div className="flex flex-col items-center">
                  <span className="text-green-600 font-medium">
                    ✓ Mastered!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Audio Recorder UI */}
          <AudioRecorderUI
            uiState={uiState}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            assessmentResults={assessmentResults}
            className="mb-4"
          />

          {/* Guidance text below recording button */}
          <div className="text-center mb-12">
            <p className="text-xs text-gray-500">
              {assessmentResults
                ? "Practice completed!"
                : "Press the button to practice"}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="absolute bottom-6 left-6 right-6">

            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={
                  currentWordIndex === 0 ||
                  uiState === UIState.Listening ||
                  uiState === UIState.Processing
                }
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                Previous
              </button>

              {currentWordIndex >= totalWords - 1 ? (
                <button
                  onClick={handleBackToLearn}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Finish Practice
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={
                    uiState === UIState.Listening ||
                    uiState === UIState.Processing
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCompleted ? "Remove & Next" : "Next"}
                  <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Area - Show feedback tabs when we have results */}
        {(assessmentResults || errorMessages.length > 0) && (
          <ResultsDisplay
            results={assessmentResults}
            errorMessages={errorMessages}
            uiState={uiState}
          />
        )}
      </div>
    </div>
  );
}
