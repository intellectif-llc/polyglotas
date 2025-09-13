'use client';

import { useState } from 'react';
import { Zap, Loader2, CheckCircle } from 'lucide-react';

interface AlignmentPanelProps {
  bookId: string;
  chapterId: string;
  script: string;
  hasAudio: boolean;
  onSuccess: () => void;
}

export default function AlignmentPanel({ 
  bookId, 
  chapterId, 
  script, 
  hasAudio,
  onSuccess 
}: AlignmentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleGenerateAlignment = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/audiobooks/${bookId}/chapters/${chapterId}/generate-alignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate alignment');
      }

      const result = await response.json();
      console.log('Alignment generated:', result);
      setCompleted(true);
      onSuccess();
    } catch (error) {
      console.error('Error generating alignment:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate alignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Generate Force Alignment</h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Generate word-level timing alignment between the audio and transcript using ElevenLabs Force Alignment API.
        </p>

        <button
          onClick={handleGenerateAlignment}
          disabled={loading || !script || !hasAudio || completed}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Alignment...
            </>
          ) : completed ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Alignment Generated
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Generate Force Alignment
            </>
          )}
        </button>

        {!hasAudio && (
          <p className="text-sm text-amber-600 text-center">
            Audio must be generated first
          </p>
        )}

        {!script && (
          <p className="text-sm text-gray-500 text-center">
            Script is required for alignment
          </p>
        )}
      </div>
    </div>
  );
}