'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Play, Pause, SkipBack, SkipForward, BookOpen, Eye, EyeOff, ArrowLeft, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import dynamic from 'next/dynamic';

const AudioGenerationPanel = dynamic(() => import('@/components/admin/audiobooks/AudioGenerationPanel'), {
  ssr: false
});
const AlignmentPanel = dynamic(() => import('@/components/admin/audiobooks/AlignmentPanel'), {
  ssr: false
});

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
  const [nextWordIndex, setNextWordIndex] = useState(-1);
  const [editMode, setEditMode] = useState(false);
  const [chapterScript, setChapterScript] = useState('');
  const [highlightOffset, setHighlightOffset] = useState(0.15); // 150ms predictive highlighting
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchChapterData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterId]);



  // Update highlighting when time changes
  useEffect(() => {
    if (alignment && alignment.words_data) {
      updateHighlighting();
    }
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
        console.log('✅ ALIGNMENT DATA LOADED');
        console.log('📄 Words data length:', alignmentData.words_data?.length);
        console.log('📄 First 5 words with timing:', alignmentData.words_data?.slice(0, 5).map(w => ({
          text: w.text,
          start: w.start,
          end: w.end
        })));
        
        setAlignment({
          full_text: alignmentData.full_text,
          characters_data: alignmentData.characters_data,
          words_data: alignmentData.words_data
        });
        
        // Set the script from full_text for admin editing only
        if (alignmentData.full_text) {
          let cleanText = alignmentData.full_text;
          
          // Remove surrounding quotes if present
          if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
            cleanText = cleanText.slice(1, -1);
          }
          
          // Convert escaped characters
          cleanText = cleanText
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'");
          
          setChapterScript(cleanText);
        }
        
        console.log('✅ Alignment loaded with', alignmentData.words_data?.length, 'words');
      } else {
        console.log('❌ NO ALIGNMENT DATA FOUND');
      }

      // Get user progress for this chapter
      const { data: progressData } = await supabase
        .from('user_audiobook_progress')
        .select('*')
        .eq('profile_id', user.id)
        .eq('book_id', parseInt(bookId))
        .eq('current_chapter_id', parseInt(chapterId));

      const progress = progressData?.[0];
      if (progress) {
        setUserProgress(progress);
        setCurrentTime(progress.current_position_seconds);
        console.log('📍 Restored progress to:', progress.current_position_seconds, 'seconds');
      }

    } catch (error) {
      console.error('Error fetching chapter data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateHighlighting = () => {
    if (!alignment || !alignment.words_data || !audioRef.current) return;

    const audioTime = audioRef.current.currentTime;
    
    // Find current word based on force alignment timestamps
    const currentIndex = alignment.words_data.findIndex(word => 
      audioTime >= word.start && audioTime <= word.end
    );
    
    if (currentIndex !== -1 && currentIndex !== currentWordIndex) {
      setCurrentWordIndex(currentIndex);
    }
    
    // Find next word for anticipation (highlight upcoming word within 0.3 seconds)
    let nextIndex = -1;
    if (currentIndex >= 0) {
      // Look for next word that starts within anticipation window
      for (let i = currentIndex + 1; i < alignment.words_data.length; i++) {
        const nextWord = alignment.words_data[i];
        if (nextWord.start - audioTime <= 0.3 && nextWord.start > audioTime) {
          nextIndex = i;
          break;
        }
      }
    }
      
    if (nextIndex !== nextWordIndex) {
      setNextWordIndex(nextIndex);
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

      // First try to update existing progress
      const { error: updateError } = await supabase
        .from('user_audiobook_progress')
        .update({
          current_position_seconds: time,
          last_read_at: new Date().toISOString()
        })
        .eq('profile_id', user.id)
        .eq('book_id', parseInt(bookId))
        .eq('current_chapter_id', parseInt(chapterId));

      // If no rows were updated, insert new progress
      if (updateError?.code === 'PGRST116') {
        await supabase
          .from('user_audiobook_progress')
          .insert({
            profile_id: user.id,
            book_id: parseInt(bookId),
            current_chapter_id: parseInt(chapterId),
            current_position_seconds: time,
            last_read_at: new Date().toISOString()
          });
      }
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
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      // Immediately update highlighting after seeking
      updateHighlighting();
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

    const paragraphs = [];
    let currentParagraph = [];
    
    alignment.words_data.forEach((word, index) => {
      const isCurrentWord = index === currentWordIndex;
      const isNextWord = index === nextWordIndex;
      const isPastWord = index < currentWordIndex;
      
      // Check if this is a paragraph break marker
      if (word.text === '\r' || word.text === '\n') {
        // End current paragraph if it has content
        if (currentParagraph.length > 0) {
          paragraphs.push([...currentParagraph]);
          currentParagraph = [];
        }
        return;
      }
      
      // Clean word text for display
      let displayText = word.text
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');
      
      // Add word span to current paragraph
      currentParagraph.push(
        <span
          key={index}
          className={`transition-all duration-200 ${
            isCurrentWord 
              ? 'bg-yellow-300 text-black font-medium' 
              : isNextWord
                ? 'bg-yellow-100 text-gray-800'
                : isPastWord 
                  ? 'text-gray-500' 
                  : 'text-gray-900'
          }`}
        >
          {displayText}
        </span>
      );
      
      // Add space after word (except for punctuation)
      if (!displayText.match(/[.!?]$/)) {
        currentParagraph.push(' ');
      }
    });
    
    // Add final paragraph if it has content
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return (
      <div className="text-lg leading-relaxed space-y-4">
        {paragraphs.map((paragraph, pIndex) => (
          <p key={pIndex} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  const renderFormattedText = (text: string) => {
    return (
      <div className="text-lg leading-relaxed whitespace-pre-line text-gray-800">
        {text}
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
          
          {userRole === 'admin' && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                editMode 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4" />
              {editMode ? 'Exit Admin' : 'Admin Tools'}
            </button>
          )}
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
                  // Immediately update highlighting after seeking
                  updateHighlighting();
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

        {/* Admin Tools */}
        {editMode && userRole === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AudioGenerationPanel
              bookId={bookId}
              chapterId={chapterId}
              script={chapterScript}
              onSuccess={() => {
                fetchChapterData();
                alert('Audio generated successfully!');
              }}
            />
            <AlignmentPanel
              bookId={bookId}
              chapterId={chapterId}
              script={chapterScript}
              hasAudio={!!chapter?.audio_url}
              onSuccess={() => {
                fetchChapterData();
                alert('Alignment generated successfully!');
              }}
            />
          </div>
        )}

        {/* Script Editor for Admin */}
        {editMode && userRole === 'admin' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Chapter Script</h3>
            <textarea
              value={chapterScript}
              onChange={(e) => setChapterScript(e.target.value)}
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter or edit the chapter script here..."
            />
          </div>
        )}

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
              {alignment ? (
                renderTextWithHighlighting()
              ) : chapterScript ? (
                <div className="text-lg leading-relaxed whitespace-pre-line text-gray-800">
                  {chapterScript}
                </div>
              ) : (
                <p className="text-gray-500 italic">No text available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}