import { useQuery } from '@tanstack/react-query';
import { useUserProfile } from './useUserProfile';
import { useSubscriptionTier } from './useSubscriptionTier';
import { usePronunciationUnits } from './pronunciation/usePronunciationData';
import { useProgression } from './useProgression';
import { UnitProgressData, UnitProgressState, RequiredActivity } from '@/types/progress';

export const useEnhancedProgress = () => {
  const { data: profile } = useUserProfile();
  const { tier } = useSubscriptionTier();
  const { data: units } = usePronunciationUnits();
  const { data: progression } = useProgression(profile?.profile_id || '');

  return useQuery({
    queryKey: ['enhancedProgress', profile?.profile_id, tier],
    queryFn: async (): Promise<UnitProgressData[]> => {
      if (!units || !progression || !profile) return [];

      // Define required activities based on subscription tier
      const getRequiredActivities = (tier: string): RequiredActivity[] => {
        switch (tier) {
          case 'free': return ['dictation'];
          case 'starter': return ['dictation', 'pronunciation'];
          case 'pro': return ['dictation', 'pronunciation', 'chat'];
          default: return ['dictation'];
        }
      };

      const requiredActivities = getRequiredActivities(tier);

      // Create progression lookup map
      const progressionMap = new Map(
        progression.map(p => [`${p.unit_id}`, p])
      );

      return units.map(unit => {
        const unitProgression = progressionMap.get(unit.unit_id.toString());
        const canAccess = unitProgression?.unit_available ?? false;
        const isComplete = unit.progress.percent === 100;
        
        // State is now handled by ProgressionGuard, we only track completion
        const state: UnitProgressState = isComplete ? 'completed' : 
                     unit.progress.completed_lessons > 0 ? 'in_progress' : 'available';

        // Mock activity states (would come from actual API in real implementation)
        const activities = requiredActivities.reduce((acc, activity) => {
          acc[activity] = isComplete ? 'completed' : 
                         unit.progress.completed_lessons > 0 ? 'in_progress' : 'not_started';
          return acc;
        }, {} as Record<RequiredActivity, 'not_started' | 'in_progress' | 'completed'>);

        return {
          unit_id: unit.unit_id,
          unit_title: unit.unit_title,
          description: unit.description,
          level: unit.level,
          unit_order: unit.unit_order,
          state,
          progress: unit.progress,
          activities,
          requiredActivities,
          canAccess,
          isComplete,
        };
      });
    },
    enabled: !!(units && progression && profile),
    staleTime: 30 * 1000,
  });
};