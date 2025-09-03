import React from 'react';
import { Play, RotateCcw, CheckCircle } from 'lucide-react';
import { UnitProgressData } from '@/types/progress';
import { ProgressionGuard } from '@/components/ProgressionGuard';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UnitProgressCardProps {
  unit: UnitProgressData;
  onSelect: () => void;
}

const UnitProgressCard: React.FC<UnitProgressCardProps> = ({ unit, onSelect }) => {
  const { data: profile } = useUserProfile();

  if (!profile?.profile_id) return null;

  // Determine visual state (only for accessible units)
  const getStateConfig = () => {
    if (unit.isComplete) {
      return {
        icon: CheckCircle,
        iconColor: 'text-green-600',
        progressColor: 'bg-green-400',
        statusText: 'Review',
      };
    } else if (unit.progress.completed_lessons > 0) {
      return {
        icon: RotateCcw,
        iconColor: 'text-orange-600',
        progressColor: 'bg-orange-400',
        statusText: 'Continue',
      };
    } else {
      return {
        icon: Play,
        iconColor: 'text-blue-600',
        progressColor: 'bg-teal-400',
        statusText: 'Start',
      };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  const cardContent = (
    <div 
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === "Enter" && onSelect()}
      aria-label={`Unit ${unit.unit_order}: ${unit.unit_title}`}
      className="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between min-h-[160px] cursor-pointer transition-shadow duration-200 hover:shadow-lg"
    >
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="flex items-center text-gray-500 text-sm">
            <span className="w-4 h-4 rounded-full border-2 border-teal-400 inline-block mr-2"></span>
            Unit {unit.unit_order}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {unit.level}
          </span>
        </div>
        <h3 className="text-base font-bold text-gray-800 mb-1 truncate" title={unit.unit_title}>
          {unit.unit_title}
        </h3>
        {unit.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={unit.description}>
            {unit.description}
          </p>
        )}
        
        {/* Activity Indicators */}
        <div className="flex flex-wrap gap-1 mb-3">
          {unit.requiredActivities.map(activity => {
            const activityState = unit.activities[activity] || 'not_started';
            const activityConfig = {
              not_started: 'bg-gray-100 text-gray-600',
              in_progress: 'bg-orange-100 text-orange-700',
              completed: 'bg-green-100 text-green-700',
            };
            
            return (
              <span 
                key={activity}
                className={`text-xs px-2 py-1 rounded-full capitalize ${activityConfig[activityState]}`}
              >
                {activity}
              </span>
            );
          })}
        </div>

        {/* Progress Info */}
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{unit.progress.completed_lessons} / {unit.progress.total_lessons} lessons</span>
          <div className="flex items-center space-x-1">
            <Icon className={`${config.iconColor} w-3 h-3`} />
            <span className={config.iconColor}>{config.statusText}</span>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${config.progressColor} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${unit.progress.percent}%` }}
        />
      </div>
    </div>
  );

  // Apply ProgressionGuard to ALL units (like /learn route)
  return (
    <ProgressionGuard profileId={profile.profile_id} unitId={unit.unit_id}>
      {cardContent}
    </ProgressionGuard>
  );
};

export default UnitProgressCard;