"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLessonPhrases } from "@/hooks/pronunciation/usePronunciationData";
import { useDictation } from "@/hooks/dictation/useDictation";
import PhraseStepper from "../practice/PhraseStepper";
import DictationInterface from "./DictationInterface";
import DictationResults from "./DictationResults";
import { DictationAttempt } from "@/types/pronunciation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

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

  const handleSubmitDictation = useCallback(async () => {
    if (!data?.phrases?.[currentPhraseIndex] || !userText.trim()) return;

    const result = await submitDictation(
      lessonId,
      data.phrases[currentPhraseIndex].id,
      userText
    );
    
    if (result) {
      setLastAttempt(result);
    }
  }, [data, currentPhraseIndex, userText, lessonId, submitDictation]);

  const handleNext = () => {
    if (data && currentPhraseIndex < data.phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
      setUserText("");
      setLastAttempt(null);
    }
  };

  const handlePrevious = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
      setUserText("");
      setLastAttempt(null);
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
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Lessons
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {data.lesson?.lesson_title || "Lesson"} - Dictation
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            Unit {data.lesson?.unit_title || unitId} • {data.lesson?.level || ""}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Activity Switcher */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center bg-white text-blue-600 shadow-sm"
          >
            Dictation
          </button>
          <button
            onClick={() => router.push(`/learn/${unitId}/lesson/${lessonId}/practice`)}
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center text-gray-600 hover:text-gray-900"
          >
            Practice
          </button>
        </div>

        {/* Phrase Stepper */}
        <PhraseStepper
          phrases={data.phrases}
          currentPhraseIndex={currentPhraseIndex}
          onSelectPhrase={(index) => {
            setCurrentPhraseIndex(index);
            setUserText("");
            setLastAttempt(null);
          }}
        />

        {/* Main Dictation Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 relative min-h-[400px]">
          <div className="text-center mb-4 text-sm text-gray-500">
            Phrase {currentPhraseIndex + 1} of {totalPhrases}
          </div>

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
            />
          )}

          {/* Navigation Buttons */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentPhraseIndex === 0 || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={currentPhraseIndex >= totalPhrases - 1 || isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="ml-2 -mr-1 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}