import { useState, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { AudiobookData, ChapterData, AlignmentData, UserProgress, AudiobookWithPurchase } from '@/types/audiobooks';

interface UseAudiobookDataReturn {
  loading: boolean;
  error: string | null;
  fetchChapterData: (bookId: string, chapterId: string) => Promise<{
    audiobook: (AudiobookData & { is_purchased?: boolean }) | null;
    chapter: ChapterData | null;
    alignment: AlignmentData | null;
    userProgress: UserProgress;
    allChapters: ChapterData[];
  }>;
  fetchAudiobooksWithPurchases: () => Promise<AudiobookWithPurchase[]>;
  fetchChapterProgress: (bookId: string) => Promise<Record<number, UserProgress>>;
}

export function useAudiobookData(): UseAudiobookDataReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const fetchChapterData = useCallback(async (bookId: string, chapterId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Batch fetch all required data
      const [
        { data: chapterData },
        { data: audiobookData },
        { data: chaptersData },
        { data: alignmentData },
        { data: progressData }
      ] = await Promise.all([
        supabase
          .from('audiobook_chapters')
          .select('chapter_id, book_id, chapter_title, audio_url, video_url, pic_url, duration_seconds, is_free_sample, chapter_order, created_at')
          .eq('chapter_id', parseInt(chapterId))
          .single(),
        supabase
          .from('audiobooks')
          .select(`
            book_id, title, author, description, cover_image_url, language_code, level_code, duration_seconds, points_cost, price_cents, is_active, created_at, updated_at,
            user_audiobook_purchases!left(purchase_id)
          `)
          .eq('book_id', parseInt(bookId))
          .eq('user_audiobook_purchases.profile_id', user.id)
          .single(),
        supabase
          .from('audiobook_chapters')
          .select('chapter_id, book_id, chapter_title, audio_url, video_url, pic_url, duration_seconds, is_free_sample, chapter_order, created_at')
          .eq('book_id', parseInt(bookId))
          .order('chapter_order'),
        supabase
          .from('audiobook_alignment')
          .select('*')
          .eq('book_id', parseInt(bookId))
          .eq('chapter_id', parseInt(chapterId))
          .single(),
        supabase
          .from('user_audiobook_chapter_progress')
          .select('*')
          .eq('profile_id', user.id)
          .eq('book_id', parseInt(bookId))
          .eq('chapter_id', parseInt(chapterId))
          .single()
      ]);

      const defaultProgress: UserProgress = {
        progress_id: 0,
        profile_id: user.id,
        book_id: parseInt(bookId),
        current_position_seconds: 0,
        last_read_at: new Date().toISOString(),
        is_completed: false,
        current_chapter_id: parseInt(chapterId)
      };

      return {
        audiobook: audiobookData ? {
          ...audiobookData,
          is_purchased: !!audiobookData.user_audiobook_purchases?.length
        } : null,
        chapter: chapterData,
        alignment: alignmentData,
        userProgress: progressData || defaultProgress,
        allChapters: chaptersData || []
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chapter data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchAudiobooksWithPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get user points and audiobooks with purchases in parallel
      const [{ data: profile }, { data: books }] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('points')
          .eq('profile_id', user.id)
          .single(),
        supabase
          .from('audiobooks')
          .select(`
            *,
            user_audiobook_purchases!left(purchase_id)
          `)
          .eq('is_active', true)
          .eq('user_audiobook_purchases.profile_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      // Batch fetch chapter counts for all books
      const bookIds = books?.map(book => book.book_id) || [];
      const { data: allChapters } = await supabase
        .from('audiobook_chapters')
        .select('book_id, chapter_id, is_free_sample')
        .in('book_id', bookIds);

      // Group chapters by book_id for efficient lookup
      const chaptersByBook = (allChapters || []).reduce((acc, chapter) => {
        if (!acc[chapter.book_id]) acc[chapter.book_id] = [];
        acc[chapter.book_id].push(chapter);
        return acc;
      }, {} as Record<number, { chapter_id: number; is_free_sample: boolean }[]>);

      const audiobooksWithStatus = (books || []).map(book => {
        const chapters = chaptersByBook[book.book_id] || [];
        return {
          ...book,
          is_purchased: !!book.user_audiobook_purchases?.length,
          user_points: profile?.points || 0,
          total_chapters: chapters.length,
          free_chapters: chapters.filter(ch => ch.is_free_sample).length
        };
      });

      return audiobooksWithStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch audiobooks';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchChapterProgress = useCallback(async (bookId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};

      const { data: progressData } = await supabase
        .from('user_audiobook_chapter_progress')
        .select('*')
        .eq('profile_id', user.id)
        .eq('book_id', parseInt(bookId));

      return (progressData || []).reduce((acc, progress) => {
        if (progress.current_chapter_id) {
          acc[progress.current_chapter_id] = progress;
        }
        return acc;
      }, {} as Record<number, UserProgress>);
    } catch (err) {
      console.error('Failed to fetch chapter progress:', err);
      return {};
    }
  }, [supabase]);

  return {
    loading,
    error,
    fetchChapterData,
    fetchAudiobooksWithPurchases,
    fetchChapterProgress
  };
}