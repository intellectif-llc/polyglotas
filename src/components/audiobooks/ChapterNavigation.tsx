'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ChapterData } from '@/types/audiobooks';

interface ChapterNavigationProps {
  chapters: ChapterData[];
  currentChapter: ChapterData;
  canAccessChapter: (chapter: ChapterData) => boolean;
  onNavigate: (chapterId: number) => void;
}

export default function ChapterNavigation({
  chapters,
  currentChapter,
  canAccessChapter,
  onNavigate
}: ChapterNavigationProps) {
  const currentIndex = chapters.findIndex(ch => ch.chapter_id === currentChapter.chapter_id);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={() => prevChapter && onNavigate(prevChapter.chapter_id)}
        disabled={!prevChapter || !canAccessChapter(prevChapter)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          prevChapter && canAccessChapter(prevChapter)
            ? 'bg-white hover:bg-gray-50 text-gray-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
        {prevChapter ? `Chapter ${prevChapter.chapter_order}` : 'Previous'}
      </button>

      <span className="text-sm text-gray-600 text-center">
        {currentChapter.chapter_order === 0 
          ? `Introduction (${chapters.length} chapters total)`
          : `Chapter ${currentChapter.chapter_order} of ${chapters.filter(ch => ch.chapter_order > 0).length}`
        }
      </span>

      <button
        onClick={() => nextChapter && onNavigate(nextChapter.chapter_id)}
        disabled={!nextChapter || !canAccessChapter(nextChapter)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          nextChapter && canAccessChapter(nextChapter)
            ? 'bg-white hover:bg-gray-50 text-gray-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {nextChapter ? `Chapter ${nextChapter.chapter_order}` : 'Next'}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}