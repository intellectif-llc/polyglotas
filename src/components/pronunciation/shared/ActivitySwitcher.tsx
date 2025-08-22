"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { Lock } from "lucide-react";

interface ActivitySwitcherProps {
  unitId: string;
  lessonId: string;
  currentActivity: "dictation" | "practice" | "chat";
}

export default function ActivitySwitcher({
  unitId,
  lessonId,
  currentActivity,
}: ActivitySwitcherProps) {
  const router = useRouter();
  const { permissions, isLoading } = useSubscriptionTier();

  const activities = [
    {
      key: "dictation" as const,
      label: "Dictation",
      path: `/learn/${unitId}/lesson/${lessonId}/dictation`,
      canAccess: permissions.canAccessDictation,
    },
    {
      key: "practice" as const,
      label: "Practice",
      path: `/learn/${unitId}/lesson/${lessonId}/practice`,
      canAccess: permissions.canAccessPractice,
    },
    {
      key: "chat" as const,
      label: "Chat",
      path: `/learn/${unitId}/lesson/${lessonId}/chat`,
      canAccess: permissions.canAccessChat,
    },
  ];

  const handleActivityClick = (activity: (typeof activities)[0]) => {
    if (activity.canAccess) {
      router.push(activity.path);
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse mx-1"></div>
        <div className="flex-1 h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      {activities.map((activity) => {
        const isActive = activity.key === currentActivity;
        const canAccess = activity.canAccess;

        return (
          <button
            key={activity.key}
            onClick={() => handleActivityClick(activity)}
            disabled={!canAccess}
            className={`
              flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium 
              transition-colors flex-1 min-h-[44px] touch-manipulation cursor-pointer
              ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm"
                  : canAccess
                  ? "text-gray-600 hover:text-gray-900"
                  : "text-gray-400 cursor-not-allowed"
              }
            `}
            title={!canAccess ? "Upgrade to access this activity" : undefined}
          >
            <span className="pointer-events-none flex items-center gap-1">
              {activity.label}
              {!canAccess && <Lock size={14} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
