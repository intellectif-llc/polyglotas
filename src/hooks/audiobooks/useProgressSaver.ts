import { useCallback, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface UseProgressSaverReturn {
  saveProgress: (bookId: string, chapterId: string, time: number) => void;
  saveProgressImmediate: (bookId: string, chapterId: string, time: number) => Promise<void>;
  saveProgressForced: (bookId: string, chapterId: string, time: number) => Promise<void>;
}

export function useProgressSaver(): UseProgressSaverReturn {
  const supabase = createSupabaseBrowserClient();
  const lastSaveTimeRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveProgressImmediate = useCallback(async (bookId: string, chapterId: string, time: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get chapter duration for completion calculation
      const { data: chapterData } = await supabase
        .from('audiobook_chapters')
        .select('duration_seconds')
        .eq('chapter_id', parseInt(chapterId))
        .single();

      // Use the new progress tracking function
      const { error } = await supabase.rpc('update_chapter_progress', {
        p_profile_id: user.id,
        p_book_id: parseInt(bookId),
        p_chapter_id: parseInt(chapterId),
        p_position_seconds: time,
        p_chapter_duration_seconds: chapterData?.duration_seconds || null
      });

      if (error) {
        console.error('Error saving progress:', error);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [supabase]);

  const saveProgress = useCallback((bookId: string, chapterId: string, time: number) => {
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;

    // Only save if at least 30 seconds have passed since last save
    if (timeSinceLastSave >= 30000) {
      lastSaveTimeRef.current = now;
      saveProgressImmediate(bookId, chapterId, time);
    } else {
      // Clear existing timeout and set a new one
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        lastSaveTimeRef.current = Date.now();
        saveProgressImmediate(bookId, chapterId, time);
      }, 30000 - timeSinceLastSave);
    }
  }, [saveProgressImmediate]);

  const saveProgressForced = useCallback(async (bookId: string, chapterId: string, time: number) => {
    // Force immediate save, bypassing throttling
    lastSaveTimeRef.current = Date.now();
    await saveProgressImmediate(bookId, chapterId, time);
  }, [saveProgressImmediate]);

  return {
    saveProgress,
    saveProgressImmediate,
    saveProgressForced
  };
}