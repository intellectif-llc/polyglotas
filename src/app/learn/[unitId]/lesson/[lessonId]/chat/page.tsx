"use client";

import React from "react";
import LessonChatView from "@/components/pronunciation/chat/LessonChatView";

interface ChatPageProps {
  params: Promise<{
    unitId: string;
    lessonId: string;
  }>;
}

export default function LessonChatPage({ params }: ChatPageProps) {
  const { unitId, lessonId } = React.use(params);
  return <LessonChatView unitId={unitId} lessonId={lessonId} />;
}
