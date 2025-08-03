"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useUnitLessons } from "@/hooks/pronunciation/usePronunciationData";
import LessonList from "@/components/pronunciation/lesson/LessonList";
import { ArrowLeft } from "lucide-react";

export default function UnitLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === "string" ? params.unitId : "";
  const { data, isLoading, error } = useUnitLessons(unitId);

  const handleLessonClick = (lessonId: number) => {
    // For now, we'll just log this. Navigation will be implemented in the next step.
    console.log(`Navigate to lesson ${lessonId}`);
    // router.push(`/learn/pronunciation/lesson/${lessonId}`);
  };

  const unitTitle = data?.unit?.unit_title || "Unit";

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Units
        </button>
        <h1 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
          {`Level ${data?.unit?.level || ""}: ${unitTitle}`}
        </h1>
      </div>

      {isLoading && (
        <div className="text-center text-gray-500">Loading lessons...</div>
      )}
      {error && (
        <div className="text-center text-red-500">Error: {error.message}</div>
      )}

      {!isLoading && !error && data?.lessons && (
        <LessonList lessons={data.lessons} onLessonClick={handleLessonClick} />
      )}
    </div>
  );
}
