"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChapterData } from "@/types/audiobooks";

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
  onNavigate,
}: ChapterNavigationProps) {
  const currentIndex = chapters.findIndex(
    (ch) => ch.chapter_id === currentChapter.chapter_id
  );
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
      <button
        onClick={() => prevChapter && onNavigate(prevChapter.chapter_id)}
        disabled={!prevChapter || !canAccessChapter(prevChapter)}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
          prevChapter && canAccessChapter(prevChapter)
            ? "bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        <ChevronLeft className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline">
          {prevChapter ? `Chapter ${prevChapter.chapter_order}` : "Previous"}
        </span>
        <span className="sm:hidden text-xs">
          {prevChapter ? `Ch ${prevChapter.chapter_order}` : "Prev"}
        </span>
      </button>

      <span className="text-xs sm:text-sm text-gray-600 text-center px-2 min-w-0 flex-1">
        <span className="hidden sm:inline">
          {currentChapter.chapter_order === 0
            ? `Introduction (${chapters.length} chapters total)`
            : `Chapter ${currentChapter.chapter_order} of ${
                chapters.filter((ch) => ch.chapter_order > 0).length
              }`}
        </span>
        <span className="sm:hidden">
          {currentChapter.chapter_order === 0
            ? `Intro (${chapters.length})`
            : `${currentChapter.chapter_order}/${
                chapters.filter((ch) => ch.chapter_order > 0).length
              }`}
        </span>
      </span>

      <button
        onClick={() => nextChapter && onNavigate(nextChapter.chapter_id)}
        disabled={!nextChapter || !canAccessChapter(nextChapter)}
        className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${
          nextChapter && canAccessChapter(nextChapter)
            ? "bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        <span className="hidden sm:inline">
          {nextChapter ? `Chapter ${nextChapter.chapter_order}` : "Next"}
        </span>
        <span className="sm:hidden text-xs">
          {nextChapter ? `Ch ${nextChapter.chapter_order}` : "Next"}
        </span>
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
      </button>
    </div>
  );
}
