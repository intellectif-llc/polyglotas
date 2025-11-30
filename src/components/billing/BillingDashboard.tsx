"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBillingInfo } from "@/hooks/billing/useBillingInfo";
import { useBillingPortal } from "@/hooks/billing/useBillingPortal";
import SubscriptionCard from "./SubscriptionCard";
import PricingPlans from "./PricingPlans";
import InvoiceHistory from "./InvoiceHistory";

export default function BillingDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);

  const { data: billingInfo, isLoading, error } = useBillingInfo();
  const { openPortal, isLoading: isPortalLoading } = useBillingPortal();

  // Handle checkout success/cancel from URL params
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const canceled = searchParams.get("canceled");

    if (sessionId) {
      setShowSuccessMessage(true);
      // Clean up URL
      router.replace("/account/billing", { scroll: false });
    } else if (canceled === "true") {
      setShowCancelMessage(true);
      // Clean up URL
      router.replace("/account/billing", { scroll: false });
    }

    // Auto-hide messages after 5 seconds
    const timer = setTimeout(() => {
      setShowSuccessMessage(false);
      setShowCancelMessage(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  const handleManageSubscription = async () => {
    try {
      await openPortal();
    } catch (error) {
      console.error("Error opening billing portal:", error);
    }
  };

  const currentSubscription = billingInfo?.subscriptions?.[0];
  const currentTier = billingInfo?.profile?.subscription_tier || "free";



  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">
              Failed to load billing information. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Billing & Subscription
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your subscription, view invoices, and update billing
          information.
        </p>
      </div>

      {/* Partnership Discount Alert */}
      {billingInfo?.profile?.discount && billingInfo.profile.discount > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2" />
            <div>
              <p className="font-medium text-indigo-900 dark:text-indigo-100">
                Partnership Benefit Active
              </p>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                You have a permanent {billingInfo.profile.discount}% discount on all subscriptions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success/Cancel Messages */}
      {showSuccessMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-800 dark:text-green-200">
              Subscription updated successfully! Changes may take a few moments
              to reflect.
            </p>
          </div>
        </div>
      )}

      {showCancelMessage && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <p className="text-yellow-800 dark:text-yellow-200">
              Subscription update was canceled. Your current plan remains
              active.
            </p>
          </div>
        </div>
      )}

      {/* Current Subscription Card */}
      <SubscriptionCard
        subscription={currentSubscription}
        currentTier={currentTier}
        onManage={handleManageSubscription}
        isManaging={isPortalLoading}
      />

      {/* Pricing Plans Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {currentTier === "free" ? "Upgrade Your Plan" : "Change Your Plan"}
        </h2>
        <PricingPlans />
      </div>

      {/* Quick Actions */}
      {currentSubscription && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPortalLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">Manage Payment Methods</span>
            <ExternalLink className="h-4 w-4 ml-2" />
          </button>

          <button
            onClick={handleManageSubscription}
            disabled={isPortalLoading}
            className="flex items-center justify-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPortalLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            <span className="font-medium">Download Invoices</span>
            <ExternalLink className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}

      {/* Invoice History */}
      <InvoiceHistory />

      {/* Billing Support */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Need Help?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          If you have questions about your billing or need assistance, we&apos;re
          here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/account/support"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Contact Support
          </a>
          <a
            href="/account/support"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            View Support Tickets
          </a>
        </div>
      </div>
    </div>
  );
}
