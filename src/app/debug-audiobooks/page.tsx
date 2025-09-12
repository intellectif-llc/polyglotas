'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function DebugAudiobooksPage() {
  const [audiobooks, setAudiobooks] = useState<Record<string, unknown>[]>([]);
  const [chapters, setChapters] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    debugData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debugData = async () => {
    try {
      console.log('🔍 Starting debug...');
      
      // Test audiobooks table
      const { data: audiobooksData, error: audiobooksError } = await supabase
        .from('audiobooks')
        .select('*');
      
      console.log('📚 Audiobooks:', audiobooksData);
      console.log('❌ Audiobooks error:', audiobooksError);
      
      // Test chapters table
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('audiobook_chapters')
        .select('*');
      
      console.log('📖 Chapters:', chaptersData);
      console.log('❌ Chapters error:', chaptersError);
      
      setAudiobooks(audiobooksData || []);
      setChapters(chaptersData || []);
      
    } catch (error) {
      console.error('💥 Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading debug data...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Audiobooks Data</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Audiobooks ({audiobooks.length})</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(audiobooks, null, 2)}
        </pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Chapters ({chapters.length})</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(chapters, null, 2)}
        </pre>
      </div>
    </div>
  );
}