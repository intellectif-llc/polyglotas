"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLessonPhrases } from "@/hooks/pronunciation/usePronunciationData";
import ReferenceTextDisplay from "./ReferenceTextDisplay";
import PhraseStepper from "./PhraseStepper";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

export default function LessonPracticeView() {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === "string" ? params.unitId : "";
  const lessonId = typeof params.lessonId === "string" ? params.lessonId : "";
  const { data, isLoading, error } = useLessonPhrases(lessonId);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const handleNext = () => {
    if (data && currentPhraseIndex < data.phrases.length - 1) {
      setCurrentPhraseIndex(currentPhraseIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPhraseIndex > 0) {
      setCurrentPhraseIndex(currentPhraseIndex - 1);
    }
  };

  const currentPhrase = data?.phrases?.[currentPhraseIndex];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/learn/${unitId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Lessons
        </button>
        <h1 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
          {data?.lesson?.lesson_title || "Loading..."}
        </h1>
        {data?.lesson && (
          <p className="text-sm text-gray-500 mt-1">
            {data.lesson.unit_title} • Level {data.lesson.level}
          </p>
        )}
      </div>

      {isLoading && (
        <div className="text-center text-gray-500">Loading phrases...</div>
      )}
      {error && (
        <div className="text-center text-red-500">Error: {error.message}</div>
      )}

      {!isLoading && !error && data?.phrases && (
        <>
          <PhraseStepper
            phrases={data.phrases}
            currentPhraseIndex={currentPhraseIndex}
            onSelectPhrase={setCurrentPhraseIndex}
          />
          <div className="bg-white rounded-lg shadow-md p-6 mt-6 relative min-h-[350px]">
            <div className="text-center mb-4 text-sm text-gray-500">
              Phrase {currentPhraseIndex + 1} of {data.phrases.length}
            </div>

            <div className="flex items-center justify-center">
              {currentPhrase ? (
                <ReferenceTextDisplay
                  text={currentPhrase.phrase_text}
                  audioUrl={currentPhrase.audio_url}
                />
              ) : (
                <p className="text-center text-gray-400">Loading phrase...</p>
              )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentPhraseIndex === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft
                  className="-ml-1 mr-2 h-5 w-5"
                  aria-hidden="true"
                />
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={
                  !data || currentPhraseIndex >= data.phrases.length - 1
                }
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight
                  className="ml-2 -mr-1 h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
