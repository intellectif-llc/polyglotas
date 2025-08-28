'use client';

import { useState } from 'react';
import { useOnboardingStatus } from '@/hooks/useOnboarding';
import OnboardingModal from './OnboardingModal';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export default function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const { data: onboardingStatus, isLoading } = useOnboardingStatus();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center z-50">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-700 font-medium">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const shouldShowOnboarding = onboardingStatus?.needsOnboarding && !isOnboardingComplete;

  return (
    <>
      {children}
      <OnboardingModal
        isOpen={!!shouldShowOnboarding}
        initialData={{
          firstName: onboardingStatus?.firstName,
          lastName: onboardingStatus?.lastName,
          nativeLanguage: onboardingStatus?.nativeLanguage,
          targetLanguage: onboardingStatus?.targetLanguage,
        }}
        onComplete={() => setIsOnboardingComplete(true)}
      />
    </>
  );
}