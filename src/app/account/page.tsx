"use client";

import React from "react";
import { useUserProfile, useUserStats } from "@/hooks/useUserProfile";
import { useProfileNames } from "@/hooks/useProfileNames";
import { User, Trophy, Zap, Calendar } from "lucide-react";

export default function AccountPage() {
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: names, isLoading: namesLoading } = useProfileNames();

  if (profileLoading || statsLoading || namesLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Profile</h1>
            <p className="text-gray-600">Manage your learning profile and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Trophy className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Current Level</p>
                <p className="text-xl font-bold text-blue-600">{stats?.currentLevel || "A1"}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Zap className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-xl font-bold text-orange-600">{stats?.currentStreak || 0} days</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-xl font-bold text-green-600">{stats?.totalPoints?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {names?.firstName || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {names?.lastName || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Language
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {profile?.current_target_language_code?.toUpperCase() || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Native Language
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded">
                  {profile?.native_language_code?.toUpperCase() || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Tier
                </label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded capitalize">
                  {profile?.subscription_tier || "Free"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Learning Progress</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Units Completed</span>
                <span className="text-sm font-medium">
                  {stats?.completedUnits || 0} / {stats?.totalUnits || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${stats?.totalUnits ? (stats.completedUnits / stats.totalUnits) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}