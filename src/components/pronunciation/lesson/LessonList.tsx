"use client";
import React from "react";
import { Lesson } from "@/types/pronunciation";
import LessonCard from "./LessonCard";

interface LessonListProps {
  lessons: Lesson[];
  onLessonClick: (lessonId: number) => void;
}

const LessonList: React.FC<LessonListProps> = ({ lessons, onLessonClick }) => {
  if (!lessons || lessons.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No lessons found for this unit.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <LessonCard
          key={lesson.lesson_id}
          lesson={lesson}
          onClick={onLessonClick}
        />
      ))}
    </div>
  );
};

export default LessonList;
