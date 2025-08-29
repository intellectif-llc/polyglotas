"use client";

import React, { useState, useMemo } from "react";
import { Crown, CheckCircle, Loader2, Check, Zap } from "lucide-react";
import { useAvailablePlans } from "@/hooks/billing/useAvailablePlans";
import { useCreateCheckout } from "@/hooks/billing/useCreateCheckout";
import { useBillingInfo } from "@/hooks/billing/useBillingInfo";

interface PricingPlan {
  id: number;
  stripe_price_id: string;
  unit_amount: number;
  currency: string;
  billing_interval: string;
  interval_count: number;
  product_name: string;
  tier_key: string;
}

export default function PricingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const { data: plans, isLoading } = useAvailablePlans();
  const { data: billingInfo } = useBillingInfo();
  const { createCheckout, isLoading: isCreatingCheckout } = useCreateCheckout();

  const currentTier = billingInfo?.profile?.subscription_tier || "free";

  const handleSelectPlan = async (priceId: string) => {
    if (isCreatingCheckout) return;

    setSelectedPlan(priceId);
    try {
      await createCheckout(priceId);
    } catch (error) {
      console.error("Error creating checkout:", error);
      setSelectedPlan(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  const organizedPlans = useMemo(() => {
    if (!plans)
      return {
        starter: {} as Record<"month" | "year", PricingPlan>,
        pro: {} as Record<"month" | "year", PricingPlan>,
      };

    const starterPlans = plans.filter((p) => p.tier_key === "starter");
    const proPlans = plans.filter((p) => p.tier_key === "pro");

    const organizeByInterval = (planList: PricingPlan[]) => {
      return planList.reduce((acc, plan) => {
        acc[plan.billing_interval as "month" | "year"] = plan;
        return acc;
      }, {} as Record<"month" | "year", PricingPlan>);
    };

    return {
      starter: organizeByInterval(starterPlans),
      pro: organizeByInterval(proPlans),
    };
  }, [plans]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg animate-pulse">
            <div className="w-64 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2 mb-6">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                  ></div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          No pricing plans available at the moment. Please try again later.
        </p>
      </div>
    );
  }

  const starterMonthly = organizedPlans.starter.month;
  const starterYearly = organizedPlans.starter.year;
  const proMonthly = organizedPlans.pro.month;
  const proYearly = organizedPlans.pro.year;

  const starterSavings =
    starterMonthly && starterYearly
      ? calculateSavings(starterMonthly.unit_amount, starterYearly.unit_amount)
      : null;
  const proSavings =
    proMonthly && proYearly
      ? calculateSavings(proMonthly.unit_amount, proYearly.unit_amount)
      : null;

  return (
    <div className="space-y-8">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === "month"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("year")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingCycle === "year"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            }`}
          >
            Yearly
            {(starterSavings?.percentage || proSavings?.percentage) && (
              <span
                className="absolute -top-3 -right-2 bg-green-500 text-white text-xs px-1.5 
              py-0.5 rounded-full cursor-pointer"
              >
                Save {starterSavings?.percentage || proSavings?.percentage}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div
          className={`border rounded-xl p-6 relative ${
            currentTier === "free"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700"
          }`}
        >
          {currentTier === "free" && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                Current Plan
              </span>
            </div>
          )}

          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Free
            </h3>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                $0
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                forever
              </span>
            </div>

            <button
              disabled
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
            >
              {currentTier === "free" ? "Current Plan" : "Downgrade"}
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              What&apos;s included:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Basic vocabulary lessons
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Limited pronunciation practice
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Basic progress tracking
              </li>
            </ul>
          </div>
        </div>

        {/* Starter Plan */}
        {(starterMonthly || starterYearly) && (
          <div
            className={`border rounded-xl p-6 relative hover:shadow-lg transition-shadow ${
              currentTier === "starter"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {currentTier === "starter" && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              </div>
            )}

            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Starter
              </h3>
            </div>

            <div className="mb-6">
              {billingCycle === "month" && starterMonthly ? (
                <div className="mb-4">
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(
                        starterMonthly.unit_amount,
                        starterMonthly.currency
                      )}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /month
                    </span>
                  </div>
                  {starterYearly && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Or{" "}
                      {formatPrice(
                        starterYearly.unit_amount,
                        starterYearly.currency
                      )}
                      /year
                    </p>
                  )}
                </div>
              ) : billingCycle === "year" && starterYearly ? (
                <div className="mb-4">
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(
                        starterYearly.unit_amount,
                        starterYearly.currency
                      )}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /year
                    </span>
                  </div>
                  {starterSavings && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(
                          starterMonthly!.unit_amount * 12,
                          starterYearly.currency
                        )}
                        /year
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Save{" "}
                        {formatPrice(
                          starterSavings.amount,
                          starterYearly.currency
                        )}{" "}
                        ({starterSavings.percentage}%)
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              <button
                onClick={() => {
                  const plan =
                    billingCycle === "month" ? starterMonthly : starterYearly;
                  if (plan) handleSelectPlan(plan.stripe_price_id);
                }}
                disabled={
                  isCreatingCheckout ||
                  currentTier === "starter" ||
                  (billingCycle === "month" ? !starterMonthly : !starterYearly)
                }
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center cursor-pointer"
              >
                {selectedPlan ===
                (billingCycle === "month"
                  ? starterMonthly?.stripe_price_id
                  : starterYearly?.stripe_price_id) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {currentTier === "starter"
                  ? "Current Plan"
                  : selectedPlan ===
                    (billingCycle === "month"
                      ? starterMonthly?.stripe_price_id
                      : starterYearly?.stripe_price_id)
                  ? "Processing..."
                  : currentTier === "free"
                  ? "Upgrade to Starter"
                  : "Switch to Starter"}
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Everything in Free, plus:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Unlimited pronunciation practice
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Full lesson content library
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Advanced progress tracking
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Word-level pronunciation feedback
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Email support
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Pro Plan */}
        {(proMonthly || proYearly) && (
          <div
            className={`border rounded-xl p-6 relative hover:shadow-lg transition-shadow ${
              currentTier === "pro"
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
            }`}
          >
            {currentTier === "pro" ? (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Current Plan
                </span>
              </div>
            ) : (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="flex items-center mb-4">
              <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pro
              </h3>
              <Zap className="h-4 w-4 text-yellow-500 ml-2" />
            </div>

            <div className="mb-6">
              {billingCycle === "month" && proMonthly ? (
                <div className="mb-4">
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(proMonthly.unit_amount, proMonthly.currency)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /month
                    </span>
                  </div>
                  {proYearly && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Or{" "}
                      {formatPrice(proYearly.unit_amount, proYearly.currency)}
                      /year
                    </p>
                  )}
                </div>
              ) : billingCycle === "year" && proYearly ? (
                <div className="mb-4">
                  <div className="flex items-baseline mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(proYearly.unit_amount, proYearly.currency)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      /year
                    </span>
                  </div>
                  {proSavings && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(
                          proMonthly!.unit_amount * 12,
                          proYearly.currency
                        )}
                        /year
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Save{" "}
                        {formatPrice(proSavings.amount, proYearly.currency)} (
                        {proSavings.percentage}%)
                      </span>
                    </div>
                  )}
                </div>
              ) : null}

              <button
                onClick={() => {
                  const plan =
                    billingCycle === "month" ? proMonthly : proYearly;
                  if (plan) handleSelectPlan(plan.stripe_price_id);
                }}
                disabled={
                  isCreatingCheckout ||
                  currentTier === "pro" ||
                  (billingCycle === "month" ? !proMonthly : !proYearly)
                }
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {selectedPlan ===
                (billingCycle === "month"
                  ? proMonthly?.stripe_price_id
                  : proYearly?.stripe_price_id) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {currentTier === "pro"
                  ? "Current Plan"
                  : selectedPlan ===
                    (billingCycle === "month"
                      ? proMonthly?.stripe_price_id
                      : proYearly?.stripe_price_id)
                  ? "Processing..."
                  : "Upgrade to Pro"}
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Everything in Starter, plus:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  AI-powered conversation practice
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Advanced pronunciation analytics
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Personalized learning insights
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Priority customer support
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Early access to new features
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
