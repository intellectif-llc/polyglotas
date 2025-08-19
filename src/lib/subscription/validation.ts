import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type SubscriptionTier = "free" | "starter" | "pro";

export interface SubscriptionValidationResult {
  isValid: boolean;
  tier: SubscriptionTier;
  userId: string;
  error?: string;
}

/**
 * Validates if a user has the required subscription tier for chat access
 */
export async function validateChatAccess(): Promise<SubscriptionValidationResult> {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isValid: false,
        tier: "free",
        userId: "",
        error: "Unauthorized",
      };
    }

    // Get user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("subscription_tier")
      .eq("profile_id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        isValid: false,
        tier: "free",
        userId: user.id,
        error: "Profile not found",
      };
    }

    const tier = (profile.subscription_tier as SubscriptionTier) || "free";

    // Chat access requires pro tier
    const hasAccess = tier === "pro";

    return {
      isValid: hasAccess,
      tier,
      userId: user.id,
      error: hasAccess ? undefined : "Chat access requires Pro subscription",
    };
  } catch (error) {
    console.error("Subscription validation error:", error);
    return {
      isValid: false,
      tier: "free",
      userId: "",
      error: "Internal server error",
    };
  }
}

/**
 * Validates general subscription tier access
 */
export async function validateSubscriptionTier(
  requiredTier: SubscriptionTier
): Promise<SubscriptionValidationResult> {
  const supabase = await createClient();

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        isValid: false,
        tier: "free",
        userId: "",
        error: "Unauthorized",
      };
    }

    // Get user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("subscription_tier")
      .eq("profile_id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        isValid: false,
        tier: "free",
        userId: user.id,
        error: "Profile not found",
      };
    }

    const userTier = (profile.subscription_tier as SubscriptionTier) || "free";

    // Check tier hierarchy
    const tierHierarchy: Record<SubscriptionTier, number> = {
      free: 0,
      starter: 1,
      pro: 2,
    };

    const hasAccess = tierHierarchy[userTier] >= tierHierarchy[requiredTier];

    return {
      isValid: hasAccess,
      tier: userTier,
      userId: user.id,
      error: hasAccess ? undefined : `${requiredTier} subscription required`,
    };
  } catch (error) {
    console.error("Subscription validation error:", error);
    return {
      isValid: false,
      tier: "free",
      userId: "",
      error: "Internal server error",
    };
  }
}

/**
 * Creates a standardized error response for subscription validation failures
 */
export function createSubscriptionErrorResponse(
  result: SubscriptionValidationResult
): NextResponse {
  const statusCode = result.error === "Unauthorized" ? 401 : 403;

  return new NextResponse(
    JSON.stringify({
      error: result.error,
      tier: result.tier,
      upgradeRequired: result.tier !== "pro",
    }),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    }
  );
}
