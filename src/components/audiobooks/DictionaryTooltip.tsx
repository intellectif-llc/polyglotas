'use client';

import { useState, useEffect } from 'react';
import { Volume2, X } from 'lucide-react';
import { dictionaryService } from '@/services/dictionaryService';
import { DictionaryResult } from '@/types/dictionary';

interface DictionaryTooltipProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function DictionaryTooltip({ word, position, onClose }: DictionaryTooltipProps) {
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lookupWord = async () => {
      if (!word.trim()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        const data = await dictionaryService.lookupWord(cleanWord);
        setResult(data);
      } catch (err) {
        setError('Failed to load definition');
        console.error('Dictionary lookup error:', err);
      } finally {
        setLoading(false);
      }
    };

    lookupWord();
  }, [word]);

  const playAudio = () => {
    if (result?.audioUrl) {
      const audio = new Audio(result.audioUrl);
      audio.play().catch(console.error);
    }
  };

  // Position tooltip to avoid going off screen
  const tooltipStyle = {
    position: 'fixed' as const,
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.max(10, position.y - 200),
    zIndex: 1000,
  };

  return (
    <div
      style={tooltipStyle}
      className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900 capitalize">{word}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading definition...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          {result.phonetic && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-mono">{result.phonetic}</span>
              {result.audioUrl && (
                <button
                  onClick={playAudio}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Play pronunciation"
                >
                  <Volume2 className="h-4 w-4 text-indigo-600" />
                </button>
              )}
            </div>
          )}

          <div className="space-y-2">
            {result.meanings.slice(0, 2).map((meaning, idx) => (
              <div key={idx}>
                <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                  {meaning.partOfSpeech}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {meaning.definitions.slice(0, 2).map((def, defIdx) => (
                    <div key={defIdx} className="mb-1">
                      {defIdx + 1}. {def}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && !result && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No definition found</p>
        </div>
      )}
    </div>
  );
}