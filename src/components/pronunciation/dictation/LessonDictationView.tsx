"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLessonPhrases } from "@/hooks/pronunciation/usePronunciationData";
import { useDictation } from "@/hooks/dictation/useDictation";
import { useLastDictationAttempt } from "@/hooks/dictation/useLastDictationAttempt";
import PhraseStepper from "../practice/PhraseStepper";
import DictationInterface from "./DictationInterface";
import DictationResults from "./DictationResults";
import { DictationAttempt } from "@/types/pronunciation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ActivitySwitcher from "../shared/ActivitySwitcher";
import { useAdvancedNavigation } from "@/hooks/useAdvancedNavigation";

export default function LessonDictationView() {
  const params = useParams();
  const router = useRouter();

  const unitId = typeof params.unitId === "string" ? params.unitId : "";
  const lessonId = typeof params.lessonId === "string" ? params.lessonId : "";
  const { data, isLoading, error } = useLessonPhrases(lessonId);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [userText, setUserText] = useState("");
  const [lastAttempt, setLastAttempt] = useState<DictationAttempt | null>(null);

  const { submitDictation, isSubmitting } = useDictation();
  const { data: lastAttemptData, refetch: refetchLastAttempt } =
    useLastDictationAttempt(lessonId, data?.phrases?.[currentPhraseIndex]?.id);

  // Load last attempt when phrase changes or data loads
  useEffect(() => {
    if (lastAttemptData?.attempt) {
      setLastAttempt(lastAttemptData.attempt);
      setUserText(lastAttemptData.attempt.written_text || "");
    } else {
      setLastAttempt(null);
      setUserText("");
    }
  }, [lastAttemptData, currentPhraseIndex]);

  const handleSubmitDictation = useCallback(async () => {
    if (!data?.phrases?.[currentPhraseIndex] || !userText.trim()) return;

    const result = await submitDictation(
      lessonId,
      data.phrases[currentPhraseIndex].id,
      userText
    );

    if (result) {
      setLastAttempt(result);
      // Refetch to update cache
      refetchLastAttempt();
    }
  }, [
    data,
    currentPhraseIndex,
    userText,
    lessonId,
    submitDictation,
    refetchLastAttempt,
  ]);

  const {
    canNavigateNext: canAdvancedNext,
    canNavigatePrevious: canAdvancedPrevious,
    navigateNext: advancedNext,
    navigatePrevious: advancedPrevious
  } = useAdvancedNavigation({
    unitId,
    lessonId,
    activity: "dictation",
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

  const handleTryAgain = () => {
    setLastAttempt(null);
  };

  const handleContinueToPractice = () => {
    router.push(`/learn/${unitId}/lesson/${lessonId}/practice`);
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

  if (error || !data?.phrases?.length) {
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

  const currentPhrase = data.phrases[currentPhraseIndex];
  const totalPhrases = data.phrases.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/learn/${unitId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-3 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft size={20} className="mr-2 pointer-events-none" />
            <span className="pointer-events-none">Back to Lessons</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {data.lesson?.lesson_title || "Lesson"} - Dictation
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
          currentActivity="dictation"
        />

        {/* Phrase Stepper */}
        <PhraseStepper
          phrases={data.phrases}
          currentPhraseIndex={currentPhraseIndex}
          activityType="dictation"
          onSelectPhrase={(index) => {
            setCurrentPhraseIndex(index);
            // State will be loaded by useEffect
          }}
        />

        {/* Main Dictation Area */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="p-4 sm:p-6">
            <div className="text-center mb-4 text-sm text-gray-500">
              Phrase {currentPhraseIndex + 1} of {totalPhrases}
            </div>

            <div className="min-h-[300px] sm:min-h-[400px] pb-4">
              {!lastAttempt ? (
                <DictationInterface
                  audioUrlNormal={currentPhrase.audio_url_normal}
                  audioUrlSlow={currentPhrase.audio_url_slow}
                  userText={userText}
                  onTextChange={setUserText}
                  onSubmit={handleSubmitDictation}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <DictationResults
                  attempt={lastAttempt}
                  userText={userText}
                  onTryAgain={handleTryAgain}
                  onContinue={handleContinueToPractice}
                  audioUrlNormal={currentPhrase.audio_url_normal}
                  audioUrlSlow={currentPhrase.audio_url_slow}
                />
              )}
            </div>
          </div>

          {/* Navigation Buttons - Enhanced with cross-content navigation */}
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={(!canAdvancedPrevious && currentPhraseIndex === 0) || isSubmitting}
                className="flex items-center justify-center sm:justify-start px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] touch-manipulation"
              >
                <ChevronLeft className="h-5 w-5 mr-2 pointer-events-none" />
                <span className="pointer-events-none">Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={(!canAdvancedNext && currentPhraseIndex >= totalPhrases - 1) || isSubmitting}
                className="flex items-center justify-center sm:justify-start px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] touch-manipulation"
              >
                <span className="pointer-events-none">Next</span>
                <ChevronRight className="h-5 w-5 ml-2 pointer-events-none" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
