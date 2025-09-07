"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import PronunciationDashboard from "@/components/pronunciation/dashboard/PronunciationDashboard";
import WordsPracticeList from "@/components/pronunciation/practice/WordsPracticeList";

export default function LearnPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const invitationRedeemed = searchParams.get('invitation_redeemed');
    const partnership = searchParams.get('partnership');
    
    if (invitationRedeemed === 'true') {
      console.log('[LEARN_PAGE] Invitation redeemed detected, invalidating cache', { partnership });
      
      // Invalidate all user-related queries to force fresh data fetch
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionTier'] });
      queryClient.invalidateQueries({ queryKey: ['pronunciationUnits'] });
      
      // Clear the URL parameters to avoid repeated invalidation
      const url = new URL(window.location.href);
      url.searchParams.delete('invitation_redeemed');
      url.searchParams.delete('partnership');
      url.searchParams.delete('t');
      window.history.replaceState({}, '', url.toString());
      
      console.log('[LEARN_PAGE] Cache invalidated and URL cleaned');
    }
  }, [searchParams, queryClient]);

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-2 space-y-6">
      {/* Main Dashboard */}
      <div className="bg-white rounded-lg shadow-xl p-2 md:p-5 lg:p-6 min-h-[400px]">
        <PronunciationDashboard />
      </div>

      {/* Words Practice Section - positioned after units for better UX */}
      <WordsPracticeList />
    </div>
  );
}
