'use client';

import { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateChapterFormProps {
  bookId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ChapterFormData {
  chapter_title: string;
  is_free_sample: boolean;
  chapter_order: number;
}

interface Chapter {
  chapter_id: number;
  chapter_title: string;
  chapter_order: number;
}

export default function CreateChapterForm({ bookId, onClose, onSuccess }: CreateChapterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ChapterFormData>({
    chapter_title: '',
    is_free_sample: false,
    chapter_order: 1,
  });
  const [loading, setLoading] = useState(false);
  const [loadingSuggestedOrder, setLoadingSuggestedOrder] = useState(true);

  // Fetch suggested chapter order on mount
  useEffect(() => {
    const fetchSuggestedOrder = async () => {
      try {
        const response = await fetch(`/api/admin/audiobooks/${bookId}/chapters`);
        if (response.ok) {
          const chapters = await response.json();
          const maxOrder = chapters.reduce((max: number, chapter: Chapter) => 
            Math.max(max, chapter.chapter_order || 0), 0
          );
          setFormData(prev => ({ ...prev, chapter_order: maxOrder + 1 }));
        }
      } catch (error) {
        console.error('Error fetching chapters:', error);
      } finally {
        setLoadingSuggestedOrder(false);
      }
    };

    fetchSuggestedOrder();
  }, [bookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/audiobooks/${bookId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create chapter');
      }

      const newChapter = await response.json();
      onSuccess();
      onClose();
      
      // Auto-redirect to the new chapter page
      router.push(`/learn/audiobooks/${bookId}/${newChapter.chapter_id}`);
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Failed to create chapter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold">Create New Chapter</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter Title</label>
            <input
              type="text"
              required
              value={formData.chapter_title}
              onChange={(e) => setFormData({ ...formData, chapter_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter Order
                {loadingSuggestedOrder && <span className="text-xs text-gray-500 ml-1">(loading...)</span>}
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.chapter_order}
                onChange={(e) => setFormData({ ...formData, chapter_order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loadingSuggestedOrder}
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_free_sample}
                  onChange={(e) => setFormData({ ...formData, is_free_sample: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Free Sample</span>
              </label>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Duration will be automatically calculated when you generate audio for this chapter.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}