"use client";

import React from "react";
import { BarChart3, TrendingUp, Calendar, Award } from "lucide-react";
import { usePronunciationUnits } from "@/hooks/pronunciation/usePronunciationData";
import { useUserStats } from "@/hooks/useUserProfile";

export default function ProgressPage() {
  const { data: units, isLoading: unitsLoading } = usePronunciationUnits();
  const { data: stats, isLoading: statsLoading } = useUserStats();

  if (unitsLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalLessons = units?.reduce((sum, unit) => sum + unit.progress.total_lessons, 0) || 0;
  const completedLessons = units?.reduce((sum, unit) => sum + unit.progress.completed_lessons, 0) || 0;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <BarChart3 size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Progress</h1>
            <p className="text-gray-600">Track your language learning journey</p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingUp className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-2xl font-bold text-blue-600">{overallProgress}%</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Award className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Lessons Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedLessons}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.currentStreak || 0} days</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <BarChart3 className="text-purple-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.totalPoints?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Progress */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Unit Progress</h2>
          <div className="space-y-4">
            {units?.map((unit) => (
              <div key={unit.unit_id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{unit.unit_title}</h3>
                    <p className="text-sm text-gray-600">Level {unit.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {unit.progress.completed_lessons} / {unit.progress.total_lessons} lessons
                    </p>
                    <p className="text-sm text-gray-600">{unit.progress.percent}% complete</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${unit.progress.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h2>
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <Award size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Achievement tracking will be available soon. Keep learning to unlock badges and milestones!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}