"use client";

import React from "react";
import LessonChatView from "@/components/pronunciation/chat/LessonChatView";
import TourTrigger from "@/components/tours/TourTrigger";

interface ChatPageProps {
  params: Promise<{
    unitId: string;
    lessonId: string;
  }>;
}

export default function LessonChatPage({ params }: ChatPageProps) {
  const { unitId, lessonId } = React.use(params);
  return (
    <>
      <TourTrigger 
        tourKey="chat-activity-intro" 
        route={`/learn/${unitId}/lesson/${lessonId}/chat`} 
        autoStart
      />
      <LessonChatView unitId={unitId} lessonId={lessonId} />
    </>
  );
}
