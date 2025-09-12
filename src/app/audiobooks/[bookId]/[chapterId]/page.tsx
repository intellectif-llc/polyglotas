'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Play, Pause, SkipBack, SkipForward, BookOpen, Eye, EyeOff, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface AudiobookData {
  book_id: number;
  title: string;
  author: string;
}

interface ChapterData {
  chapter_id: number;
  chapter_order: number;
  chapter_title: string;
  audio_url: string;
  duration_seconds: number;
  is_free_sample: boolean;
}

interface AlignmentData {
  full_text: string;
  characters_data: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  words_data: Array<{
    text: string;
    start: number;
    end: number;
    loss: number;
  }>;
}

interface UserProgress {
  current_position_seconds: number;
  is_completed: boolean;
}

export default function ChapterPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;
  const chapterId = params.chapterId as string;
  const supabase = createSupabaseBrowserClient();
  const { role: userRole } = useUserRole();
  
  const [audiobook, setAudiobook] = useState<AudiobookData | null>(null);
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [alignment, setAlignment] = useState<AlignmentData | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({ current_position_seconds: 0, is_completed: false });
  const [allChapters, setAllChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showText, setShowText] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchChapterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId]);

  useEffect(() => {
    if (alignment && currentTime > 0) {
      updateHighlighting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, alignment]);

  const fetchChapterData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Check access permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin';

      // Get chapter data
      const { data: chapterData } = await supabase
        .from('audiobook_chapters')
        .select('*')
        .eq('chapter_id', parseInt(chapterId))
        .single();

      if (!chapterData) {
        router.push(`/audiobooks/${bookId}`);
        return;
      }

      // Check access to this chapter
      if (!chapterData.is_free_sample && !isAdmin) {
        const { data: purchase } = await supabase
          .from('user_audiobook_purchases')
          .select('purchase_id')
          .eq('profile_id', user.id)
          .eq('book_id', parseInt(bookId))
          .single();

        if (!purchase) {
          router.push(`/audiobooks/${bookId}`);
          return;
        }
      }

      setChapter(chapterData);

      // Get audiobook info
      const { data: audiobookData } = await supabase
        .from('audiobooks')
        .select('book_id, title, author')
        .eq('book_id', parseInt(bookId))
        .single();

      setAudiobook(audiobookData);

      // Get all chapters for navigation
      const { data: chaptersData } = await supabase
        .from('audiobook_chapters')
        .select('*')
        .eq('book_id', parseInt(bookId))
        .order('chapter_order');

      setAllChapters(chaptersData || []);

      // Get alignment data
      const { data: alignmentData } = await supabase
        .from('audiobook_alignment')
        .select('*')
        .eq('book_id', parseInt(bookId))
        .eq('chapter_id', parseInt(chapterId))
        .single();

      if (alignmentData) {
        setAlignment({
          full_text: alignmentData.full_text,
          characters_data: alignmentData.characters_data,
          words_data: alignmentData.words_data
        });
      }

      // Get user progress for this chapter
      const { data: progress } = await supabase
        .from('user_audiobook_progress')
        .select('*')
        .eq('profile_id', user.id)
        .eq('book_id', parseInt(bookId))
        .eq('current_chapter_id', parseInt(chapterId))
        .single();

      if (progress) {
        setUserProgress(progress);
        setCurrentTime(progress.current_position_seconds);
      }

    } catch (error) {
      console.error('Error fetching chapter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateHighlighting = () => {
    if (!alignment) return;

    const wordIndex = alignment.words_data.findIndex(word => 
      currentTime >= word.start && currentTime <= word.end
    );
    
    if (wordIndex !== -1) {
      setCurrentWordIndex(wordIndex);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      
      if (Math.floor(time) % 5 === 0) {
        saveProgress(time);
      }
    }
  };

  const saveProgress = async (time: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_audiobook_progress')
        .upsert({
          profile_id: user.id,
          book_id: parseInt(bookId),
          current_chapter_id: parseInt(chapterId),
          current_position_seconds: time,
          last_read_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const togglePlayPause = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          await audioRef.current.play();
        } catch (error) {
          console.error('Play failed:', error);
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const navigateToChapter = (targetChapterId: number) => {
    router.push(`/audiobooks/${bookId}/${targetChapterId}`);
  };

  const getCurrentChapterIndex = () => {
    return allChapters.findIndex(ch => ch.chapter_id === parseInt(chapterId));
  };

  const canAccessChapter = (chapterData: ChapterData) => {
    // Admin access
    if (userRole === 'admin') return true;
    
    // Free sample access
    if (chapterData.is_free_sample) return true;
    
    // For now, simplified logic - would need purchase check
    return false;
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderTextWithHighlighting = () => {
    if (!alignment || !showText) return null;

    return (
      <div className="text-lg leading-relaxed">
        {alignment.words_data.map((word, index) => (
          <span
            key={index}
            className={`transition-all duration-200 ${
              index === currentWordIndex 
                ? 'bg-yellow-300 text-black' 
                : index < currentWordIndex 
                  ? 'text-gray-600' 
                  : 'text-gray-900'
            }`}
          >
            {word.text}
          </span>
        ))}
      </div>
    );
  };

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

  if (!audiobook || !chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Chapter not found</p>
        </div>
      </div>
    );
  }

  const currentChapterIndex = getCurrentChapterIndex();
  const prevChapter = currentChapterIndex > 0 ? allChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < allChapters.length - 1 ? allChapters[currentChapterIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/audiobooks/${bookId}`)}
            className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{chapter.chapter_title}</h1>
            <p className="text-lg text-gray-600">{audiobook.title} by {audiobook.author}</p>
          </div>
        </div>

        {/* Chapter Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => prevChapter && navigateToChapter(prevChapter.chapter_id)}
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

          <span className="text-sm text-gray-600">
            Chapter {chapter.chapter_order} of {allChapters.length}
          </span>

          <button
            onClick={() => nextChapter && navigateToChapter(nextChapter.chapter_id)}
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

        {/* Audio Player */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <audio
            ref={audioRef}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration);
                audioRef.current.currentTime = userProgress.current_position_seconds;
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={chapter.audio_url.startsWith('http') ? chapter.audio_url : `https://${chapter.audio_url}`} type="audio/mpeg" />
            <source src={chapter.audio_url.startsWith('http') ? chapter.audio_url : `https://${chapter.audio_url}`} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div 
              className="w-full bg-gray-200 rounded-full h-2 cursor-pointer hover:h-3 transition-all duration-200"
              onClick={(e) => {
                if (audioRef.current && duration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = clickX / rect.width;
                  const newTime = percentage * duration;
                  audioRef.current.currentTime = Math.max(0, Math.min(duration, newTime));
                }
              }}
            >
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 hover:h-3"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => skipTime(-10)}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </button>
            
            <button
              onClick={() => skipTime(10)}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowText(!showText)}
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ml-4"
            >
              {showText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Text Display */}
        {showText && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Read Along</h2>
            </div>
            
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">{chapter.chapter_title}</h3>
            </div>
            
            <div className="prose max-w-none">
              {renderTextWithHighlighting()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}