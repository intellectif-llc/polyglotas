"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWordsNeedingPractice, useWordPracticeAttempt } from "@/hooks/useWordPractice";
import ReferenceTextDisplay from "./ReferenceTextDisplay";
import AudioRecorderUI from "@/components/speech/AudioRecorderUI";
import ResultsDisplay from "@/components/speech/ResultsDisplay";
import { useRecognitionState } from "@/hooks/speech/useRecognitionState";
import { useSpeechRecognition } from "@/hooks/speech/useSpeechRecognition";
import { AssessmentResults } from "@/hooks/speech/useRecognitionState";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

interface WordPracticeViewProps {
  initialWord?: string;
}

export default function WordPracticeView({ initialWord }: WordPracticeViewProps) {
  const router = useRouter();
  const { data: words, isLoading } = useWordsNeedingPractice();
  const wordPracticeAttempt = useWordPracticeAttempt();
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());

  // Find initial word index if provided
  useEffect(() => {
    if (initialWord && words) {
      const index = words.findIndex(word => word.word_text === initialWord);
      if (index !== -1) {
        setCurrentWordIndex(index);
      }
    }
  }, [initialWord, words]);

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
      setReferenceText(words[currentWordIndex].word_text);
      resetState();
    }
  }, [currentWordIndex, words, setReferenceText, resetState]);

  // Handle recognition completion
  const handleRecognitionComplete = useCallback(
    (results: AssessmentResults) => {
      const currentWord = words?.[currentWordIndex];
      if (!currentWord || !results.accuracyScore) return;

      // Submit word practice attempt
      wordPracticeAttempt.mutate({
        wordText: currentWord.word_text,
        accuracyScore: results.accuracyScore,
      }, {
        onSuccess: (response) => {
          if (response.wordCompleted) {
            setCompletedWords(prev => new Set([...prev, currentWord.word_text]));
          }
        }
      });
    },
    [words, currentWordIndex, wordPracticeAttempt]
  );

  // Speech recognition hook
  const { startRecording, stopRecording, cleanupRecognizer } = useSpeechRecognition({
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

  const handleNext = () => {
    if (words && currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  const handleBackToLearn = () => {
    router.push("/learn");
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Great job! No words need practice.
          </h1>
          <p className="text-gray-600 mb-6">
            All your words are performing well. Keep up the good work!
          </p>
          <button
            onClick={handleBackToLearn}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Learning
          </button>
        </div>
      </div>
    );
  }

  const currentWord = words[currentWordIndex];
  const totalWords = words.length;
  const isCompleted = completedWords.has(currentWord.word_text);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={handleBackToLearn}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Learning
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Word Practice
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            Improve pronunciation of challenging words
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress indicator */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Word {currentWordIndex + 1} of {totalWords}
            </span>
            <span className="text-sm text-gray-500">
              Avg: {Math.round(currentWord.average_accuracy_score)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentWordIndex + 1) / totalWords) * 100}%` }}
            />
          </div>
        </div>

        {/* Word Practice Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative min-h-[350px]">
          {isCompleted && (
            <div className="absolute top-4 right-4 flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
              <CheckCircle size={16} className="mr-1" />
              Completed!
            </div>
          )}

          <div className="text-center mb-4 text-sm text-gray-500">
            Practice Word: <strong>{currentWord.word_text}</strong>
          </div>

          <div className="flex items-center justify-center">
            <ReferenceTextDisplay
              text={currentWord.word_text}
              phraseId={0} // Not applicable for word practice
            />
          </div>

          {/* Audio Recorder UI */}
          <AudioRecorderUI
            uiState={uiState}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            assessmentResults={assessmentResults}
            className="mb-20"
          />

          {/* Navigation Buttons */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={
                currentWordIndex === 0 ||
                uiState === UIState.Listening ||
                uiState === UIState.Processing
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
              Previous
            </button>

            {currentWordIndex >= totalWords - 1 ? (
              <button
                onClick={handleBackToLearn}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        <ResultsDisplay
          results={assessmentResults}
          errorMessages={errorMessages}
          uiState={uiState}
        />
      </div>
    </div>
  );
}