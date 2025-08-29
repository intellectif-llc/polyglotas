"use client";

import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChartBarIcon,
  FireIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  useDashboardStats,
  useRecentActivity,
} from "@/hooks/useDashboardStats";
import { useUserProfile } from "@/hooks/useUserProfile";

interface AuthenticatedDashboardProps {
  user: User;
  onSignOut: () => void;
}

export default function AuthenticatedDashboard({
  onSignOut,
}: AuthenticatedDashboardProps) {
  const router = useRouter();
  const { data: profile } = useUserProfile();
  const { data: stats } = useDashboardStats();
  const { data: activity } = useRecentActivity();

  const isPaidTier =
    profile?.subscription_tier === "starter" ||
    profile?.subscription_tier === "pro";

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Polyglotas
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 text-right">Welcome back!</span>
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Perfect Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                {" "}
                Pronunciation?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Continue your language learning journey with AI-powered feedback
              and personalized lessons.
            </p>
          </div>

          {/* Quick Stats */}
          <div
            className={`grid gap-6 mb-12 ${
              isPaidTier ? "md:grid-cols-3" : "md:grid-cols-2"
            }`}
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <FireIcon className="w-8 h-8 text-orange-400" />
                <span className="text-2xl font-bold text-white">
                  {stats?.dayStreak || 0}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Day Streak
              </h3>
              <p className="text-gray-400 text-sm">Keep it up!</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <StarIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold text-white">
                  {stats?.points || 0}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Points</h3>
              <p className="text-gray-400 text-sm">Total earned</p>
            </div>

            {isPaidTier && (
              <>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <BookOpenIcon className="w-8 h-8 text-blue-400" />
                    <span className="text-2xl font-bold text-white">
                      {stats?.wordsLearned || 0}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Words Learned
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Pronunciation mastered
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <ChartBarIcon className="w-8 h-8 text-green-400" />
                    <span className="text-2xl font-bold text-white">
                      {stats?.accuracy || "--"}%
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Accuracy
                  </h3>
                  <p className="text-gray-400 text-sm">Last session</p>
                </div>
              </>
            )}
          </div>

          {/* Main Actions */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4">
                Continue Learning
              </h3>
              <p className="text-gray-300 mb-6">
                Pick up where you left off with your personalized pronunciation
                lessons.
              </p>
              <button
                onClick={() => router.push("/learn")}
                className="group w-full px-6 py-4 bg-brand-gradient hover:shadow-2xl hover:shadow-purple-500/25 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center space-x-3 transform hover:scale-105 cursor-pointer border border-white/10 shadow-lg"
              >
                <span>Start Learning</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-4">
                Practice Session
              </h3>
              <p className="text-gray-300 mb-6">
                Quick 5-minute pronunciation practice with instant AI feedback.
              </p>
              <button className="w-full px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold transition-all duration-300 flex items-center justify-center space-x-3 cursor-pointer">
                <span>Quick Practice</span>
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-6">
              Recent Progress
            </h3>
            <div className="space-y-4">
              {activity?.pointsEarned ? (
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div>
                    <p className="text-white font-medium">Points Earned</p>
                    <p className="text-gray-400 text-sm">Last session</p>
                  </div>
                  <div className="text-green-400 font-semibold">
                    +{activity.pointsEarned} XP
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <div>
                    <p className="text-white font-medium">No recent activity</p>
                    <p className="text-gray-400 text-sm">
                      Start learning to see progress
                    </p>
                  </div>
                </div>
              )}

              {isPaidTier &&
                activity?.wordsLearned &&
                activity.wordsLearned.length > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div>
                      <p className="text-white font-medium">
                        Words Learned:{" "}
                        {activity.wordsLearned.slice(0, 3).join(", ")}
                        {activity.wordsLearned.length > 3 &&
                          ` +${activity.wordsLearned.length - 3} more`}
                      </p>
                      <p className="text-gray-400 text-sm">Last session</p>
                    </div>
                    <div className="text-blue-400 font-semibold">
                      {activity.wordsLearned.length}
                    </div>
                  </div>
                )}

              {isPaidTier &&
                activity?.wordsNeedingPractice &&
                activity.wordsNeedingPractice.length > 0 && (
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-orange-300 font-medium flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Need practice:{" "}
                        {activity.wordsNeedingPractice.slice(0, 2).join(", ")}
                        {activity.wordsNeedingPractice.length > 2 &&
                          ` +${activity.wordsNeedingPractice.length - 2} more`}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Review recommended
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
