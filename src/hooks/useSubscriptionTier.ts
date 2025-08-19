import { useUserProfile } from "./useUserProfile";

export type SubscriptionTier = "free" | "starter" | "pro";

export interface TierPermissions {
  canAccessDictation: boolean;
  canAccessPractice: boolean;
  canAccessChat: boolean;
  requiredActivitiesForCompletion: ("dictation" | "practice" | "chat")[];
}

const TIER_PERMISSIONS: Record<SubscriptionTier, TierPermissions> = {
  free: {
    canAccessDictation: true,
    canAccessPractice: false,
    canAccessChat: false,
    requiredActivitiesForCompletion: ["dictation"],
  },
  starter: {
    canAccessDictation: true,
    canAccessPractice: true,
    canAccessChat: false,
    requiredActivitiesForCompletion: ["dictation", "practice"],
  },
  pro: {
    canAccessDictation: true,
    canAccessPractice: true,
    canAccessChat: true,
    requiredActivitiesForCompletion: ["dictation", "practice", "chat"],
  },
};

export const useSubscriptionTier = () => {
  const { data: profile, isLoading, error } = useUserProfile();

  const tier = (profile?.subscription_tier as SubscriptionTier) || "free";
  const permissions = TIER_PERMISSIONS[tier];

  return {
    tier,
    permissions,
    isLoading,
    error,
    // Helper functions
    canAccessActivity: (activity: "dictation" | "practice" | "chat") => {
      switch (activity) {
        case "dictation":
          return permissions.canAccessDictation;
        case "practice":
          return permissions.canAccessPractice;
        case "chat":
          return permissions.canAccessChat;
        default:
          return false;
      }
    },
    isProUser: tier === "pro",
    isStarterOrAbove: tier === "starter" || tier === "pro",
    getRequiredActivities: () => permissions.requiredActivitiesForCompletion,
  };
};

export const checkTierAccess = (
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean => {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    starter: 1,
    pro: 2,
  };

  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
};
