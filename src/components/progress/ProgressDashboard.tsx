import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Calendar, Award, Eye, EyeOff } from 'lucide-react';
import { useEnhancedProgress } from '@/hooks/useEnhancedProgress';
import { useLevelSelection } from '@/hooks/useLevelSelection';
import { useUserStats } from '@/hooks/useUserProfile';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import UnitProgressCard from './UnitProgressCard';

const ProgressDashboard: React.FC = () => {
  const router = useRouter();
  const [showAllLevels, setShowAllLevels] = useState(false);
  
  const { data: enhancedUnits, isLoading } = useEnhancedProgress();
  const { selectedLevel, selectLevel } = useLevelSelection();
  const { data: stats } = useUserStats();
  const { tier } = useSubscriptionTier();

  if (isLoading) {
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

  // Group units by level
  const unitsByLevel = enhancedUnits?.reduce((acc, unit) => {
    if (!acc[unit.level]) acc[unit.level] = [];
    acc[unit.level].push(unit);
    return acc;
  }, {} as Record<string, typeof enhancedUnits>) || {};

  // Get available levels (levels with units or user can access)
  const availableLevels = Object.keys(unitsByLevel).sort();
  
  // Filter levels based on showAllLevels toggle
  const levelsToShow = showAllLevels 
    ? availableLevels 
    : availableLevels.filter(level => {
        const levelUnits = unitsByLevel[level];
        return levelUnits.some(unit => unit.canAccess || unit.isComplete);
      });

  const handleUnitSelect = (unit: { unit_id: number }) => {
    router.push(`/learn/${unit.unit_id}`);
  };

  const totalLessons = enhancedUnits?.reduce((sum, unit) => sum + unit.progress.total_lessons, 0) || 0;
  const completedLessons = enhancedUnits?.reduce((sum, unit) => sum + unit.progress.completed_lessons, 0) || 0;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <BarChart3 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Progress</h1>
              <p className="text-gray-600">Track your language learning journey</p>
            </div>
          </div>
          
          {/* Show All Toggle */}
          <button
            onClick={() => setShowAllLevels(!showAllLevels)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showAllLevels ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="text-sm">
              {showAllLevels ? 'Show Relevant Only' : 'Show All Levels'}
            </span>
          </button>
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

        {/* Level Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          {levelsToShow.map(level => (
            <button
              key={level}
              onClick={() => selectLevel(level)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                selectedLevel === level
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-blue-600'
              }`}
            >
              Level {level}
            </button>
          ))}
        </div>

        {/* Units Grid */}
        <div className="space-y-8">
          {levelsToShow.map(level => {
            if (selectedLevel && selectedLevel !== level) return null;
            
            const levelUnits = unitsByLevel[level]?.sort((a, b) => a.unit_order - b.unit_order) || [];
            
            return (
              <div key={level}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Level {level} Units
                  </h2>
                  <div className="text-sm text-gray-600">
                    Progress based on {tier} tier activities
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {levelUnits.map(unit => (
                    <UnitProgressCard
                      key={unit.unit_id}
                      unit={unit}
                      onSelect={() => handleUnitSelect(unit)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
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
};

export default ProgressDashboard;