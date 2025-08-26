"use client";

import React, { useState } from "react";
import { Crown, CheckCircle, Loader2, Check, Zap } from "lucide-react";
import { useAvailablePlans } from "@/hooks/billing/useAvailablePlans";
import { useCreateCheckout } from "@/hooks/billing/useCreateCheckout";

export default function PricingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { data: plans, isLoading } = useAvailablePlans();
  const { createCheckout, isLoading: isCreatingCheckout } = useCreateCheckout();



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

  const getBillingInterval = (interval: string, intervalCount: number) => {
    if (intervalCount === 1) {
      return `per ${interval}`;
    }
    return `per ${intervalCount} ${interval}s`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 animate-pulse"
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

  const starterPlans = plans.filter((plan) => plan.tier_key === "starter");
  const proPlans = plans.filter((plan) => plan.tier_key === "pro");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Starter Plan */}
      {starterPlans.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Starter
            </h3>
          </div>

          <div className="mb-6">
            {starterPlans.map((plan) => (
              <div key={plan.stripe_price_id} className="mb-3">
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plan.unit_amount, plan.currency)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {getBillingInterval(
                      plan.billing_interval,
                      plan.interval_count
                    )}
                  </span>
                  {plan.billing_interval === "year" && (
                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      Save 20%
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.stripe_price_id)}
                  disabled={
                    isCreatingCheckout || selectedPlan === plan.stripe_price_id
                  }
                  className="w-full mb-2 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {selectedPlan === plan.stripe_price_id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {selectedPlan === plan.stripe_price_id
                    ? "Processing..."
                    : `Choose ${
                        plan.billing_interval === "month" ? "Monthly" : "Yearly"
                      }`}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Everything in Free, plus:
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                Access to pronunciation practice
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
      {proPlans.length > 0 && (
        <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-6 bg-purple-50 dark:bg-purple-900/20 relative hover:shadow-lg transition-shadow">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
              Most Popular
            </span>
          </div>

          <div className="flex items-center mb-4">
            <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Pro
            </h3>
            <Zap className="h-4 w-4 text-yellow-500 ml-2" />
          </div>

          <div className="mb-6">
            {proPlans.map((plan) => (
              <div key={plan.stripe_price_id} className="mb-3">
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plan.unit_amount, plan.currency)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">
                    {getBillingInterval(
                      plan.billing_interval,
                      plan.interval_count
                    )}
                  </span>
                  {plan.billing_interval === "year" && (
                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                      Save 20%
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.stripe_price_id)}
                  disabled={
                    isCreatingCheckout || selectedPlan === plan.stripe_price_id
                  }
                  className="w-full mb-2 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {selectedPlan === plan.stripe_price_id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {selectedPlan === plan.stripe_price_id
                    ? "Processing..."
                    : `Choose ${
                        plan.billing_interval === "month" ? "Monthly" : "Yearly"
                      }`}
                </button>
              </div>
            ))}
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
  );
}
