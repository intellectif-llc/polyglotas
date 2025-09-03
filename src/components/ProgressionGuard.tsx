'use client';

import { ReactNode } from 'react';
import { useCanAccessLesson, useCanAccessUnit, useCanAccessLevel } from '@/hooks/useProgression';

interface ProgressionGuardProps {
  children: ReactNode;
  profileId: string;
  lessonId?: number;
  unitId?: number;
  levelCode?: string;
  fallback?: ReactNode;
}

export const ProgressionGuard = ({ 
  children, 
  profileId, 
  lessonId, 
  unitId, 
  levelCode,
  fallback 
}: ProgressionGuardProps) => {
  const { data: canAccessLesson, isLoading: lessonLoading } = useCanAccessLesson(
    profileId, 
    lessonId || 0
  );
  const { data: canAccessUnit, isLoading: unitLoading } = useCanAccessUnit(
    profileId, 
    unitId || 0
  );
  const { data: canAccessLevel, isLoading: levelLoading } = useCanAccessLevel(
    profileId, 
    levelCode || ''
  );

  if (lessonLoading || unitLoading || levelLoading) {
    return <div className="animate-pulse bg-gray-200 rounded h-20" />;
  }

  const hasAccess = lessonId && lessonId > 0 ? canAccessLesson : 
                   unitId && unitId > 0 ? canAccessUnit : 
                   levelCode ? canAccessLevel : true;

  if (!hasAccess) {
    return fallback || (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-sm text-gray-600">Complete previous content to unlock</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};