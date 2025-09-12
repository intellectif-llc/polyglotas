'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Book, Coins, DollarSign, Play, Lock } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

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
      router.push(`/audiobooks/${book.book_id}`);
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
        <div className="text-center mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiobooks.map((book) => (
            <div
              key={book.book_id}
              className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                book.is_purchased || userRole === 'admin'
                  ? 'hover:shadow-xl cursor-pointer transform hover:-translate-y-1' 
                  : 'opacity-90'
              }`}
              onClick={() => handleBookClick(book)}
            >
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center relative">
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
                {book.is_purchased && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Owned
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h3>
                <p className="text-gray-600 mb-2">by {book.author}</p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">{book.description}</p>
                
                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {book.level_code}
                  </span>
                  <span>{formatDuration(book.duration_seconds)}</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {book.total_chapters} chapters
                  </span>
                  {book.free_chapters > 0 && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {book.free_chapters} free
                    </span>
                  )}
                </div>

                {/* Purchase Options */}
                {book.is_purchased || userRole === 'admin' ? (
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    Listen Now
                  </button>
                ) : (
                  <div className="space-y-2">
                    {/* Points Purchase */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(book, 'points');
                      }}
                      disabled={!canAffordWithPoints(book)}
                      className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        canAffordWithPoints(book)
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="h-4 w-4" />
                      {book.points_cost} points
                      {!canAffordWithPoints(book) && <Lock className="h-4 w-4" />}
                    </button>

                    {/* Money Purchase */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(book, 'money');
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      {formatPrice(book.price_cents)}
                    </button>
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
    </div>
  );
}