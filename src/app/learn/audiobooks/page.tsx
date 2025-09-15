'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Book, Coins, DollarSign, Play, Lock, Edit, Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import dynamic from 'next/dynamic';

const CreateAudiobookForm = dynamic(() => import('@/components/admin/audiobooks/CreateAudiobookForm'), {
  ssr: false
});

interface Audiobook {
  book_id: number;
  title: string;
  author: string;
  description: string;
  cover_image_url?: string;
  language_code: string;
  level_code: string;
  duration_seconds: number;
  points_cost: number;
  price_cents: number;
  is_purchased: boolean;
  user_points: number;
  total_chapters: number;
  free_chapters: number;
}

export default function AudiobooksPage() {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { role: userRole } = useUserRole();

  useEffect(() => {
    fetchAudiobooks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAudiobooks = async () => {
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

      setUserPoints(profile?.points || 0);

      // Get audiobooks with purchase status
      const { data: books } = await supabase
        .from('audiobooks')
        .select(`
          *,
          user_audiobook_purchases!left(purchase_id)
        `)
        .eq('is_active', true)
        .eq('user_audiobook_purchases.profile_id', user.id)
        .order('created_at', { ascending: false });

      // Get chapter counts for each book
      const audiobooksWithStatus = await Promise.all(
        (books || []).map(async (book) => {
          try {
            const { data: chapters } = await supabase
              .from('audiobook_chapters')
              .select('chapter_id, is_free_sample')
              .eq('book_id', book.book_id);

            return {
              ...book,
              is_purchased: !!book.user_audiobook_purchases?.length,
              user_points: profile?.points || 0,
              total_chapters: chapters?.length || 0,
              free_chapters: chapters?.filter(ch => ch.is_free_sample).length || 0
            };
          } catch {
            return {
              ...book,
              is_purchased: !!book.user_audiobook_purchases?.length,
              user_points: profile?.points || 0,
              total_chapters: 0,
              free_chapters: 0
            };
          }
        })
      );

      setAudiobooks(audiobooksWithStatus);
    } catch (error) {
      console.error('Error fetching audiobooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const canAffordWithPoints = (book: Audiobook) => {
    return userPoints >= book.points_cost;
  };

  const handleBookClick = (book: Audiobook) => {
    if (book.is_purchased || userRole === 'admin') {
      router.push(`/learn/audiobooks/${book.book_id}`);
    }
  };

  const handlePurchase = async (book: Audiobook, purchaseType: 'points' | 'money') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (purchaseType === 'points') {
        if (!canAffordWithPoints(book)) {
          alert('Not enough points!');
          return;
        }

        const { error } = await supabase
          .from('user_audiobook_purchases')
          .insert({
            profile_id: user.id,
            book_id: book.book_id,
            purchase_type: 'points',
            points_spent: book.points_cost
          });

        if (!error) {
          // Update user points
          await supabase
            .from('student_profiles')
            .update({ points: userPoints - book.points_cost })
            .eq('profile_id', user.id);

          fetchAudiobooks(); // Refresh the list
        }
      } else {
        // Handle money purchase (integrate with Stripe later)
        alert('Money purchases will be implemented with Stripe integration');
      }
    } catch (error) {
      console.error('Error purchasing book:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audiobooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {userRole === 'admin' && (
            <div className="absolute top-0 right-0 flex items-center gap-2">
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
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  New Book
                </button>
              )}
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Audiobook Library</h1>
          <p className="text-lg text-gray-600 mb-4">
            Enhance your language learning with immersive audiobooks
          </p>
          <div className="flex items-center justify-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm inline-flex">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold text-gray-900">{userPoints} points</span>
          </div>
        </div>

        {/* Audiobooks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {audiobooks.map((book) => (
            <div
              key={book.book_id}
              className={`group rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                book.is_purchased || userRole === 'admin'
                  ? 'hover:shadow-xl cursor-pointer transform hover:-translate-y-1' 
                  : 'opacity-90'
              }`}
              onClick={() => handleBookClick(book)}
            >
              {/* Cover Image - Pure 3:4 Aspect Ratio */}
              <div className="aspect-[3/4] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center relative">
                {book.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={book.cover_image_url} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Book className="h-16 w-16 text-white" />
                )}
                
                {/* Top Left Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                    {book.level_code}
                  </span>
                  <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(book.duration_seconds)}
                  </span>
                </div>
                
                <div className="absolute top-2 right-2 flex gap-1">
                  {book.is_purchased && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                      Owned
                    </span>
                  )}
                  {(book.is_purchased || userRole === 'admin') && (
                    <div className="bg-green-600 text-white p-1 rounded-full">
                      <Play className="h-3 w-3" />
                    </div>
                  )}
                </div>
                
                {/* Bottom Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-gray-200 text-xs mb-2">
                    by {book.author}
                  </p>
                  
                  {/* Purchase Options for Non-Owned Books */}
                  {!(book.is_purchased || userRole === 'admin') && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(book, 'points');
                        }}
                        disabled={!canAffordWithPoints(book)}
                        className={`flex-1 text-xs font-semibold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1 ${
                          canAffordWithPoints(book)
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="h-3 w-3" />
                        {book.points_cost}
                        {!canAffordWithPoints(book) && <Lock className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(book, 'money');
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <DollarSign className="h-3 w-3" />
                        {formatPrice(book.price_cents)}
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Free Chapters Badge */}
                {book.free_chapters > 0 && (
                  <div className="absolute top-16 left-2">
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded font-medium">
                      {book.free_chapters} Free
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {audiobooks.length === 0 && (
          <div className="text-center py-12">
            <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No audiobooks available</h3>
            <p className="text-gray-500">Check back later for new releases!</p>
          </div>
        )}
      </div>
      
      {showCreateForm && (
        <CreateAudiobookForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchAudiobooks();
          }}
        />
      )}
    </div>
  );
}