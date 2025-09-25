"use client";

import LessonPracticeView from "@/components/pronunciation/pronunciation/LessonPracticeView";
import TourTrigger from "@/components/tours/TourTrigger";

export default function LessonPracticePage() {
  return (
    <>
      <TourTrigger 
        tourKey="pronunciation-practice-intro" 
        route="/learn/1/lesson/1/pronunciation" 
        autoStart
      />
      <LessonPracticeView />
    </>
  );
}
