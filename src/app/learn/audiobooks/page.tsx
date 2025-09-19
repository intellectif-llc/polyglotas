'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Book, Coins, Edit, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAudiobookData } from '@/hooks/audiobooks/useAudiobookData';
import AudiobookCard from '@/components/audiobooks/AudiobookCard';
import { AudiobookWithPurchase, PurchaseType } from '@/types/audiobooks';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';

const CreateAudiobookForm = dynamic(() => import('@/components/admin/audiobooks/CreateAudiobookForm'), {
  ssr: false
});

export default function AudiobooksPage() {
  const [audiobooks, setAudiobooks] = useState<AudiobookWithPurchase[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [showPurchaseCancel, setShowPurchaseCancel] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const { role: userRole } = useUserRole();
  const { fetchAudiobooksWithPurchases, loading, error } = useAudiobookData();

  useEffect(() => {
    loadAudiobooks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle purchase success/cancel from URL params
  useEffect(() => {
    const purchased = searchParams.get('purchased');
    const canceled = searchParams.get('canceled');

    if (purchased === 'true') {
      setShowPurchaseSuccess(true);
      // Clean up URL
      router.replace('/learn/audiobooks', { scroll: false });
    } else if (canceled === 'true') {
      setShowPurchaseCancel(true);
      // Clean up URL
      router.replace('/learn/audiobooks', { scroll: false });
    }

    // Auto-hide messages after 5 seconds
    const timer = setTimeout(() => {
      setShowPurchaseSuccess(false);
      setShowPurchaseCancel(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [searchParams, router]);

  const loadAudiobooks = async () => {
    try {
      const data = await fetchAudiobooksWithPurchases();
      setAudiobooks(data);
      if (data.length > 0) {
        setUserPoints(data[0].user_points);
      }
    } catch (err) {
      console.error('Failed to load audiobooks:', err);
    }
  };



  const handleBookClick = (book: AudiobookWithPurchase) => {
    if (book.is_purchased || userRole === 'admin') {
      router.push(`/learn/audiobooks/${book.book_id}`);
    }
  };

  const handlePurchase = async (book: AudiobookWithPurchase, purchaseType: PurchaseType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (purchaseType === 'points') {
        if (userPoints < book.points_cost) {
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
          await supabase
            .from('student_profiles')
            .update({ points: userPoints - book.points_cost })
            .eq('profile_id', user.id);

          loadAudiobooks();
        }
      }
      // Money purchases are now handled by AudiobookCard component
    } catch (error) {
      console.error('Error purchasing book:', error);
      alert('Purchase failed. Please try again.');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Purchase Success/Cancel Messages */}
        {showPurchaseSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">
                Audiobook purchased successfully! You can now access all chapters.
              </p>
            </div>
          </div>
        )}

        {showPurchaseCancel && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">
                Purchase was canceled. You can try again anytime.
              </p>
            </div>
          </div>
        )}

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
            <AudiobookCard
              key={book.book_id}
              audiobook={book}
              userPoints={userPoints}
              userRole={userRole}
              onPurchase={handlePurchase}
              onClick={handleBookClick}
            />
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
            loadAudiobooks();
          }}
        />
      )}
    </div>
  );
}