"use client";

import React from "react";
import { Crown, Loader2 } from "lucide-react";
import { useTrialCheckout } from "@/hooks/billing/useTrialCheckout";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";

interface TryProButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function TryProButton({
  className = "",
  size = "md",
}: TryProButtonProps) {
  const { startTrial, isLoading } = useTrialCheckout();
  const { tier, isLoading: tierLoading } = useSubscriptionTier();

  // Don't show if user already has pro or is loading
  if (tierLoading || tier === "pro") {
    return null;
  }

  const handleStartTrial = async () => {
    try {
      await startTrial();
    } catch (error) {
      // Error handling could be improved with toast notifications
      alert(error instanceof Error ? error.message : "Failed to start trial");
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      onClick={handleStartTrial}
      disabled={isLoading}
      className={`
        cursor-pointer inline-flex items-center justify-center
        ${sizeClasses[size]}
        font-medium rounded-lg
        bg-gradient-to-r from-purple-600 to-purple-700
        hover:from-purple-700 hover:to-purple-800
        text-white shadow-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Crown className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Starting Trial..." : "Try Pro Free"}
    </button>
  );
}
