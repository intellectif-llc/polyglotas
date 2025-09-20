'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, Lock, Clock, BookOpen, Edit, Plus, CheckCircle, Coins, DollarSign, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import dynamic from 'next/dynamic';

const CreateChapterForm = dynamic(() => import('@/components/admin/audiobooks/CreateChapterForm'), {
  ssr: false
});

import { AudiobookData, ChapterWithProgress, PurchaseType } from '@/types/audiobooks';
import { useAudiobookCheckout } from '@/hooks/audiobooks/useAudiobookCheckout';

interface AudiobookWithPurchase extends AudiobookData {
  is_purchased: boolean;
  user_points?: number;
}

export default function AudiobookOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;
  const supabase = createSupabaseBrowserClient();
  const { role: userRole } = useUserRole();
  
  const [audiobook, setAudiobook] = useState<AudiobookWithPurchase | null>(null);
  const [chapters, setChapters] = useState<ChapterWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showCreateChapterForm, setShowCreateChapterForm] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  
  const { createCheckout, isLoading: isCheckoutLoading } = useAudiobookCheckout();

  useEffect(() => {
    fetchAudiobookData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Handle purchase success from URL params
  useEffect(() => {
    const purchased = searchParams.get('purchased');
    
    if (purchased === 'true') {
      setShowPurchaseSuccess(true);
      // Clean up URL
      router.replace(`/learn/audiobooks/${bookId}`, { scroll: false });
      // Refresh data to show new purchase status
      fetchAudiobookData();
    }

    // Auto-hide message after 5 seconds
    const timer = setTimeout(() => {
      setShowPurchaseSuccess(false);
    }, 5000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, bookId]);

  const fetchAudiobookData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get user points
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('points')
        .eq('profile_id', user.id)
        .single();
      
      if (profile) {
        setUserPoints(profile.points || 0);
      }

      // Get audiobook data with purchase status
      const { data: book } = await supabase
        .from('audiobooks')
        .select(`
          *,
          user_audiobook_purchases!left(purchase_id)
        `)
        .eq('book_id', parseInt(bookId))
        .eq('user_audiobook_purchases.profile_id', user.id)
        .single();

      if (!book) {
        router.push('/learn/audiobooks');
        return;
      }

      const audiobookData = {
        ...book,
        is_purchased: !!book.user_audiobook_purchases?.length
      };

      setAudiobook(audiobookData);

      // Get chapters
      const { data: chaptersData } = await supabase
        .from('audiobook_chapters')
        .select('*')
        .eq('book_id', parseInt(bookId))
        .order('chapter_order');

      // Get progress for all chapters in a single query
      const chapterIds = (chaptersData || []).map(ch => ch.chapter_id);
      const { data: progressData } = await supabase
        .from('user_audiobook_chapter_progress')
        .select('chapter_id, current_position_seconds, is_completed')
        .eq('profile_id', user.id)
        .eq('book_id', parseInt(bookId))
        .in('chapter_id', chapterIds);

      // Create progress lookup map
      const progressMap = (progressData || []).reduce((acc, progress) => {
        acc[progress.chapter_id] = {
          current_position_seconds: progress.current_position_seconds,
          is_completed: progress.is_completed
        };
        return acc;
      }, {} as Record<number, { current_position_seconds: number; is_completed: boolean }>);

      // Map chapters with progress
      const chaptersWithProgress = (chaptersData || []).map(chapter => ({
        ...chapter,
        user_progress: progressMap[chapter.chapter_id] || {
          current_position_seconds: 0,
          is_completed: false
        }
      }));

      setChapters(chaptersWithProgress);

    } catch (error) {
      console.error('Error fetching audiobook data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAccessChapter = (chapter: ChapterWithProgress) => {
    // Admin can access everything
    if (userRole === 'admin') return true;
    
    // Free samples are accessible to everyone
    if (chapter.is_free_sample) return true;
    
    // Purchased books are accessible
    if (audiobook?.is_purchased) return true;
    
    return false;
  };

  const handleChapterClick = (chapter: ChapterWithProgress) => {
    if (canAccessChapter(chapter)) {
      router.push(`/learn/audiobooks/${bookId}/${chapter.chapter_id}`);
    }
  };

  const handlePurchase = async (purchaseType: PurchaseType) => {
    if (!audiobook) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (purchaseType === 'points') {
        if (userPoints < audiobook.points_cost) {
          alert('Not enough points!');
          return;
        }

        const { error } = await supabase
          .from('user_audiobook_purchases')
          .insert({
            profile_id: user.id,
            book_id: audiobook.book_id,
            purchase_type: 'points',
            points_spent: audiobook.points_cost
          });

        if (!error) {
          await supabase
            .from('student_profiles')
            .update({ points: userPoints - audiobook.points_cost })
            .eq('profile_id', user.id);

          // Refresh data to show new purchase status
          fetchAudiobookData();
        }
      } else if (purchaseType === 'money') {
        if (audiobook.price_cents > 0) {
          await createCheckout(audiobook.book_id);
        }
      }
    } catch (error) {
      console.error('Error purchasing book:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressPercentage = (chapter: ChapterWithProgress) => {
    if (!chapter.user_progress || !chapter.duration_seconds) return 0;
    return Math.round((chapter.user_progress.current_position_seconds / chapter.duration_seconds) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audiobook...</p>
        </div>
      </div>
    );
  }

  if (!audiobook) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Audiobook not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Purchase Success Message */}
        {showPurchaseSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">
                Audiobook purchased successfully! You now have access to all chapters.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/learn/audiobooks')}
              className="p-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{audiobook.title}</h1>
              <p className="text-lg text-gray-600">by {audiobook.author}</p>
            </div>
          </div>
          
          {userRole === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  editMode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                <Edit className="h-4 w-4" />
                {editMode ? 'Exit Edit' : 'Edit Mode'}
              </button>
              {editMode && (
                <button
                  onClick={() => setShowCreateChapterForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Chapter
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="h-64 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                {audiobook.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={audiobook.cover_image_url} 
                    alt={audiobook.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <BookOpen className="h-16 w-16 text-white" />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {audiobook.level_code}
                  </span>
                  <span className="text-gray-500">{formatDuration(audiobook.duration_seconds)}</span>
                </div>
                
                <p className="text-gray-600 text-sm">{audiobook.description}</p>
                
                {!audiobook.is_purchased && userRole !== 'admin' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      Purchase to unlock all chapters
                    </p>
                    {chapters.some(ch => ch.is_free_sample) && (
                      <p className="text-xs text-yellow-600 mb-3">
                        Free chapters are available to preview
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePurchase('points')}
                        disabled={userPoints < audiobook.points_cost}
                        className={`flex-1 text-sm font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1 ${
                          userPoints >= audiobook.points_cost
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="h-4 w-4" />
                        {audiobook.points_cost}
                        {userPoints < audiobook.points_cost && <Lock className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => handlePurchase('money')}
                        disabled={isCheckoutLoading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold py-2 px-3 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        {isCheckoutLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            ${(audiobook.price_cents / 100).toFixed(2)}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chapters List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Chapters</h2>
              
              <div className="space-y-3">
                {chapters.map((chapter) => {
                  const canAccess = canAccessChapter(chapter);
                  const progress = getProgressPercentage(chapter);
                  
                  return (
                    <div
                      key={chapter.chapter_id}
                      className={`p-4 border rounded-lg transition-all duration-200 ${
                        canAccess 
                          ? 'border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-pointer' 
                          : 'border-gray-100 bg-gray-50'
                      }`}
                      onClick={() => handleChapterClick(chapter)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              Chapter {chapter.chapter_order}
                            </span>
                            {chapter.is_free_sample && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                Free
                              </span>
                            )}
                            {chapter.user_progress?.is_completed && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                Completed
                              </span>
                            )}
                          </div>
                          
                          <h3 className={`font-semibold ${canAccess ? 'text-gray-900' : 'text-gray-400'}`}>
                            {chapter.chapter_title}
                          </h3>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(chapter.duration_seconds)}
                            </div>
                            {progress > 0 && (
                              <span className="text-indigo-600">
                                {progress}% complete
                              </span>
                            )}
                          </div>
                          
                          {progress > 0 && (
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {canAccess ? (
                            <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
                              <Play className="h-5 w-5" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-full bg-gray-100 text-gray-400">
                              <Lock className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showCreateChapterForm && (
        <CreateChapterForm
          bookId={bookId}
          onClose={() => setShowCreateChapterForm(false)}
          onSuccess={() => {
            fetchAudiobookData();
            setShowCreateChapterForm(false);
          }}
        />
      )}
    </div>
  );
}