import { useQuery } from '@tanstack/react-query';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export interface ProgressionStatus {
  level_code: string;
  level_available: boolean;
  unit_id: number;
  unit_available: boolean;
  lesson_id: number;
  lesson_available: boolean;
  lesson_completed: boolean;
}

export const useProgression = (profileId: string) => {
  return useQuery({
    queryKey: ['progression', profileId],
    queryFn: async (): Promise<ProgressionStatus[]> => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc('get_user_progression_status', {
        profile_id_param: profileId
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profileId,
  });
};

export const useCanAccessLesson = (profileId: string, lessonId: number) => {
  return useQuery({
    queryKey: ['canAccessLesson', profileId, lessonId],
    queryFn: async (): Promise<boolean> => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc('can_user_access_lesson', {
        profile_id_param: profileId,
        lesson_id_param: lessonId
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!lessonId && lessonId > 0,
  });
};

export const useCanAccessUnit = (profileId: string, unitId: number) => {
  return useQuery({
    queryKey: ['canAccessUnit', profileId, unitId],
    queryFn: async (): Promise<boolean> => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc('can_user_access_unit', {
        profile_id_param: profileId,
        unit_id_param: unitId
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!unitId && unitId > 0,
  });
};

export const useCanAccessLevel = (profileId: string, levelCode: string) => {
  return useQuery({
    queryKey: ['canAccessLevel', profileId, levelCode],
    queryFn: async (): Promise<boolean> => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.rpc('can_user_access_level', {
        profile_id_param: profileId,
        level_code_param: levelCode
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profileId && !!levelCode,
  });
};