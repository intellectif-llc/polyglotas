"use client";
import React from "react";
import { Lesson } from "@/types/pronunciation";
import { CheckCircle, Circle } from "lucide-react";

interface LessonCardProps {
  lesson: Lesson;
  onClick: (lessonId: number) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
  const completionPercentage =
    lesson.total_phrases > 0
      ? (lesson.phrases_completed / lesson.total_phrases) * 100
      : 0;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer p-4 flex items-center justify-between"
      onClick={() => onClick(lesson.lesson_id)}
      onKeyPress={(e) => e.key === "Enter" && onClick(lesson.lesson_id)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center">
        {lesson.is_completed ? (
          <CheckCircle className="w-6 h-6 text-green-500 mr-4" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400 mr-4" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{`Lesson ${lesson.lesson_order}: ${lesson.lesson_title}`}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {`${lesson.phrases_completed} / ${lesson.total_phrases} phrases completed`}
          </p>
        </div>
      </div>
      <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-full">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${completionPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LessonCard;
