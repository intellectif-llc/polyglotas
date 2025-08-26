"use client";

import React from "react";
import {
  Crown,
  Calendar,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: Array<{
    price: string;
    quantity: number;
  }>;
}

interface SubscriptionCardProps {
  subscription?: Subscription;
  currentTier: string;
  onManage: () => void;
  isManaging: boolean;
}

export default function SubscriptionCard({
  subscription,
  currentTier,
  onManage,
  isManaging,
}: SubscriptionCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "pro":
        return {
          name: "Pro",
          icon: Crown,
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-200 dark:border-purple-800",
        };
      case "starter":
        return {
          name: "Starter",
          icon: CheckCircle,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800",
        };
      default:
        return {
          name: "Free",
          icon: CheckCircle,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-800",
          borderColor: "border-gray-200 dark:border-gray-700",
        };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-100 dark:bg-green-900/20",
        };
      case "trialing":
        return {
          label: "Trial",
          icon: Calendar,
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
        };
      case "past_due":
        return {
          label: "Past Due",
          icon: AlertTriangle,
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
        };
      case "canceled":
      case "incomplete":
      case "incomplete_expired":
        return {
          label: "Canceled",
          icon: XCircle,
          color: "text-red-600 dark:text-red-400",
          bgColor: "bg-red-100 dark:bg-red-900/20",
        };
      default:
        return {
          label: status,
          icon: AlertTriangle,
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
        };
    }
  };

  const tierInfo = getTierInfo(currentTier);
  const statusInfo = subscription ? getStatusInfo(subscription.status) : null;
  const TierIcon = tierInfo.icon;

  return (
    <div
      className={`border rounded-lg p-6 ${tierInfo.borderColor} ${tierInfo.bgColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${tierInfo.bgColor}`}>
            <TierIcon className={`h-6 w-6 ${tierInfo.color}`} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {tierInfo.name} Plan
            </h3>
            {subscription && statusInfo && (
              <div className="flex items-center mt-1">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
                >
                  <statusInfo.icon className="h-3 w-3 mr-1" />
                  {statusInfo.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {subscription && (
          <button
            onClick={onManage}
            disabled={isManaging}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isManaging ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Manage
            {!isManaging && <ExternalLink className="h-3 w-3 ml-2" />}
          </button>
        )}
      </div>

      {subscription && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current Period
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {formatDate(subscription.current_period_start)} -{" "}
              {formatDate(subscription.current_period_end)}
            </p>
          </div>

          {subscription.cancel_at_period_end && (
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">
                Cancels at period end
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your subscription will end on{" "}
                {formatDate(subscription.current_period_end)}
              </p>
            </div>
          )}
        </div>
      )}

      {!subscription && currentTier === "free" && (
        <div className="mt-4">
          <p className="text-gray-600 dark:text-gray-400">
            You&apos;re currently on the free plan. Upgrade to unlock premium
            features and access to all lessons.
          </p>
        </div>
      )}

      {currentTier === "free" && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Free Plan Includes:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Access to dictation exercises</li>
            <li>• Basic progress tracking</li>
            <li>• Limited lesson content</li>
          </ul>
        </div>
      )}

      {currentTier === "starter" && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Starter Plan Includes:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• All Free features</li>
            <li>• Access to pronunciation practice</li>
            <li>• Full lesson content</li>
            <li>• Advanced progress tracking</li>
          </ul>
        </div>
      )}

      {currentTier === "pro" && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Pro Plan Includes:
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• All Starter features</li>
            <li>• AI-powered chat practice</li>
            <li>• Premium pronunciation feedback</li>
            <li>• Priority support</li>
            <li>• Advanced analytics</li>
          </ul>
        </div>
      )}
    </div>
  );
}
