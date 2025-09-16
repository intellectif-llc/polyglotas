import { useCallback, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface UseProgressSaverReturn {
  saveProgress: (bookId: string, chapterId: string, time: number) => void;
  saveProgressImmediate: (bookId: string, chapterId: string, time: number) => Promise<void>;
}

export function useProgressSaver(): UseProgressSaverReturn {
  const supabase = createSupabaseBrowserClient();
  const lastSaveTimeRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveProgressImmediate = useCallback(async (bookId: string, chapterId: string, time: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from('user_audiobook_progress')
        .update({
          current_position_seconds: time,
          last_read_at: new Date().toISOString(),
        })
        .eq('profile_id', user.id)
        .eq('book_id', parseInt(bookId))
        .eq('current_chapter_id', parseInt(chapterId));

      if (updateError?.code === 'PGRST116') {
        await supabase.from('user_audiobook_progress').insert({
          profile_id: user.id,
          book_id: parseInt(bookId),
          current_chapter_id: parseInt(chapterId),
          current_position_seconds: time,
          last_read_at: new Date().toISOString(),
        });
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

  return {
    saveProgress,
    saveProgressImmediate
  };
}