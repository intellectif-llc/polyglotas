"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAudiobookData } from "@/hooks/audiobooks/useAudiobookData";
import { useProgressSaver } from "@/hooks/audiobooks/useProgressSaver";
import AudioPlayer from "@/components/audiobooks/AudioPlayer";
import TextHighlighter from "@/components/audiobooks/TextHighlighter";
import VideoPlayer from "@/components/audiobooks/VideoPlayer";
import DisplayModeToggle from "@/components/audiobooks/DisplayModeToggle";
import DictionaryTooltip from "@/components/audiobooks/DictionaryTooltip";
import ChapterNavigation from "@/components/audiobooks/ChapterNavigation";
import { AudiobookData, ChapterData, AlignmentData, UserProgress } from "@/types/audiobooks";
import dynamic from "next/dynamic";

const AudioGenerationPanel = dynamic(
  () => import("@/components/admin/audiobooks/AudioGenerationPanel"),
  { ssr: false }
);
const AlignmentPanel = dynamic(
  () => import("@/components/admin/audiobooks/AlignmentPanel"),
  { ssr: false }
);


export default function ChapterPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const chapterId = params.chapterId as string;
  const { role: userRole } = useUserRole();
  const { fetchChapterData, loading, error } = useAudiobookData();
  const { saveProgress, saveProgressForced } = useProgressSaver();

  const [audiobook, setAudiobook] = useState<AudiobookData | null>(null);
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [alignment, setAlignment] = useState<AlignmentData | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    progress_id: 0,
    profile_id: '',
    book_id: 0,
    current_position_seconds: 0,
    last_read_at: '',
    is_completed: false
  });
  const [allChapters, setAllChapters] = useState<ChapterData[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [displayMode, setDisplayMode] = useState<'text' | 'video'>('text');
  const [showText, setShowText] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [nextWordIndex, setNextWordIndex] = useState(-1);
  const [editMode, setEditMode] = useState(false);
  const [chapterScript, setChapterScript] = useState("");
  const [tooltipConfig, setTooltipConfig] = useState<{
    visible: boolean;
    selectedText: string;
    triggerElement: HTMLElement | null;
  }>({
    visible: false,
    selectedText: "",
    triggerElement: null,
  });
  const [dictionaryTooltip, setDictionaryTooltip] = useState<{
    visible: boolean;
    word: string;
    position: { x: number; y: number };
  }>({ visible: false, word: '', position: { x: 0, y: 0 } });

  useEffect(() => {
    loadChapterData();
    loadUserPreferences();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId]);

  const loadUserPreferences = useCallback(async () => {
    try {
      const response = await fetch('/api/profile/preferences');
      if (response.ok) {
        const { preferences } = await response.json();
        if (preferences?.audiobook_display_mode) {
          setDisplayMode(preferences.audiobook_display_mode);
        }
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }, []);

  const loadChapterData = useCallback(async () => {
    try {
      const data = await fetchChapterData(bookId, chapterId);
      setAudiobook(data.audiobook);
      setChapter(data.chapter);
      setAlignment(data.alignment);
      setUserProgress(data.userProgress);
      setAllChapters(data.allChapters);
      setCurrentTime(data.userProgress.current_position_seconds);
      
      if (data.alignment?.full_text) {
        let cleanText = data.alignment.full_text;
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
          cleanText = cleanText.slice(1, -1);
        }
        cleanText = cleanText
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'");
        setChapterScript(cleanText);
      }
    } catch (err) {
      console.error('Failed to load chapter data:', err);
      router.push(`/learn/audiobooks/${bookId}`);
    }
  }, [bookId, chapterId, fetchChapterData, router]);

  const updateHighlighting = useCallback(() => {
    if (!alignment?.words_data) return;

    const CURRENT_ANTICIPATION_SECONDS = 0.1;
    const NEXT_ANTICIPATION_SECONDS = 0.2;
    const predictiveTime = currentTime + CURRENT_ANTICIPATION_SECONDS;

    const currentIndex = alignment.words_data.findIndex(
      (word) => predictiveTime >= word.start && predictiveTime <= word.end
    );

    if (currentIndex !== -1 && currentIndex !== currentWordIndex) {
      setCurrentWordIndex(currentIndex);
    }

    let nextIndex = -1;
    if (currentIndex >= 0) {
      for (let i = currentIndex + 1; i < alignment.words_data.length; i++) {
        const nextWord = alignment.words_data[i];
        if (
          nextWord.start - currentTime <= NEXT_ANTICIPATION_SECONDS &&
          nextWord.start > currentTime
        ) {
          nextIndex = i;
          break;
        }
      }
    }

    if (nextIndex !== nextWordIndex) {
      setNextWordIndex(nextIndex);
    }
  }, [alignment, currentTime, currentWordIndex, nextWordIndex]);

  useEffect(() => {
    if (alignment?.words_data) {
      updateHighlighting();
    }
  }, [currentTime, alignment, updateHighlighting]);

  const handleTextSelection = useCallback((text: string, element: HTMLElement) => {
    setTooltipConfig({
      visible: true,
      selectedText: text,
      triggerElement: element,
    });
  }, []);

  const closeTooltip = useCallback(() => {
    setTooltipConfig({
      visible: false,
      selectedText: "",
      triggerElement: null,
    });
  }, []);

  const handleWordClick = useCallback((word: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setDictionaryTooltip({
      visible: true,
      word: word.replace(/[^\w]/g, ''), // Clean word of punctuation
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
  }, []);

  const closeDictionaryTooltip = useCallback(() => {
    setDictionaryTooltip({ visible: false, word: '', position: { x: 0, y: 0 } });
  }, []);

  const handleDisplayModeChange = useCallback(async (mode: 'text' | 'video') => {
    setDisplayMode(mode);
    try {
      await fetch('/api/profile/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: { audiobook_display_mode: mode }
        })
      });
    } catch (error) {
      console.error('Failed to save display mode preference:', error);
    }
  }, []);

  useEffect(() => {
    closeTooltip();
  }, [alignment, closeTooltip]);

  // Close dictionary tooltip on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (dictionaryTooltip.visible) {
        closeDictionaryTooltip();
      }
    };

    if (dictionaryTooltip.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dictionaryTooltip.visible, closeDictionaryTooltip]);

  // Save progress when component unmounts (navigation away)
  useEffect(() => {
    return () => {
      if (currentTime > 0) {
        saveProgressForced(bookId, chapterId, currentTime);
      }
    };
  }, [bookId, chapterId, currentTime, saveProgressForced]);



  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    saveProgress(bookId, chapterId, time);
  }, [bookId, chapterId, saveProgress]);

  const handleAudioEnd = useCallback((time: number) => {
    setCurrentTime(time);
    // Force immediate save when audio ends to ensure completion is tracked
    saveProgressForced(bookId, chapterId, time);
  }, [bookId, chapterId, saveProgressForced]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback(async (newDuration: number) => {
    setDuration(newDuration);
    
    // Auto-save duration to database if user is admin
    if (userRole === 'admin' && newDuration > 0) {
      try {
        await fetch(`/api/admin/audiobooks/${bookId}/chapters/${chapterId}/update-duration`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: newDuration })
        });
        console.log('Duration auto-saved:', Math.round(newDuration), 'seconds');
      } catch (error) {
        console.error('Failed to save duration:', error);
      }
    }
  }, [userRole, bookId, chapterId]);

  const navigateToChapter = useCallback((targetChapterId: number) => {
    router.push(`/learn/audiobooks/${bookId}/${targetChapterId}`);
  }, [router, bookId]);

  const canAccessChapter = useCallback((chapterData: ChapterData) => {
    if (userRole === "admin") return true;
    if (chapterData.is_free_sample) return true;
    return false;
  }, [userRole]);





  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error || !audiobook || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{error || 'Chapter not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={() => router.push(`/learn/audiobooks/${bookId}`)}
              className="flex-shrink-0 p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight truncate">
                {chapter.chapter_title}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 truncate">
                {audiobook.title} by {audiobook.author}
              </p>
            </div>
          </div>

          {userRole === "admin" && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                editMode
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300"
              }`}
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{editMode ? "Exit Admin" : "Admin Tools"}</span>
              <span className="sm:hidden">{editMode ? "Exit" : "Admin"}</span>
            </button>
          )}
        </div>

        <ChapterNavigation
          chapters={allChapters}
          currentChapter={chapter}
          canAccessChapter={canAccessChapter}
          onNavigate={navigateToChapter}
        />

        <DisplayModeToggle
          currentMode={displayMode}
          hasVideo={!!chapter.video_url}
          onModeChange={handleDisplayModeChange}
        />

        {displayMode === 'video' && chapter.video_url ? (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <VideoPlayer
              videoUrl={chapter.video_url}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              showSubtitles={showSubtitles}
              alignment={alignment}
              currentWordIndex={currentWordIndex}
              onTimeUpdate={handleTimeUpdate}
              onPlayPause={togglePlayPause}
              onSeek={handleSeek}
              onToggleSubtitles={() => setShowSubtitles(!showSubtitles)}
              onDurationChange={handleDurationChange}
              onWordClick={handleWordClick}
              onAudioEnd={handleAudioEnd}
            />
          </div>
        ) : displayMode === 'video' ? (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 text-center">
            <p className="text-gray-500 text-sm sm:text-base">No video available for this chapter</p>
          </div>
        ) : (
          <AudioPlayer
            audioUrl={chapter.audio_url}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            showText={showText}
            userProgress={userProgress}
            onTimeUpdate={handleTimeUpdate}
            onAudioEnd={handleAudioEnd}
            onPlayPause={togglePlayPause}
            onSeek={handleSeek}
            onToggleText={() => setShowText(!showText)}
            onUpdateHighlighting={updateHighlighting}
            onDurationChange={handleDurationChange}
          />
        )}

        {editMode && userRole === "admin" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <AudioGenerationPanel
              bookId={bookId}
              chapterId={chapterId}
              script={chapterScript}
              onSuccess={() => {
                loadChapterData();
                alert("Audio generated successfully!");
              }}
            />
            <AlignmentPanel
              bookId={bookId}
              chapterId={chapterId}
              script={chapterScript}
              hasAudio={!!chapter?.audio_url}
              onSuccess={() => {
                loadChapterData();
                alert("Alignment generated successfully!");
              }}
            />

          </div>
        )}

        {/* Script Editor for Admin */}
        {editMode && userRole === "admin" && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Chapter Script</h3>
            <textarea
              value={chapterScript}
              onChange={(e) => setChapterScript(e.target.value)}
              className="w-full h-32 sm:h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
              placeholder="Enter or edit the chapter script here..."
            />
          </div>
        )}

        {displayMode === 'text' && (
          <TextHighlighter
            alignment={alignment}
            currentWordIndex={currentWordIndex}
            nextWordIndex={nextWordIndex}
            showText={showText}
            chapterScript={chapterScript}
            chapterTitle={chapter.chapter_title}
            tooltipConfig={tooltipConfig}
            onTextSelection={handleTextSelection}
            onCloseTooltip={closeTooltip}
          />
        )}

        {/* Dictionary Tooltip */}
        {dictionaryTooltip.visible && (
          <DictionaryTooltip
            word={dictionaryTooltip.word}
            position={dictionaryTooltip.position}
            onClose={closeDictionaryTooltip}
          />
        )}
      </div>
    </div>
  );
}
