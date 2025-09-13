'use client';

import { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

interface AudioGenerationPanelProps {
  bookId: string;
  chapterId: string;
  script: string;
  onSuccess: () => void;
}

export default function AudioGenerationPanel({ 
  bookId, 
  chapterId, 
  script, 
  onSuccess 
}: AudioGenerationPanelProps) {
  const [speed, setSpeed] = useState(0.9);
  const [loading, setLoading] = useState(false);

  const handleGenerateAudio = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/audiobooks/${bookId}/chapters/${chapterId}/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, speed }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const result = await response.json();
      console.log('Audio generated:', result.audio_url);
      onSuccess();
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Generate Audio</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speech Speed: {speed}x
          </label>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0.7x (Slow)</span>
            <span>0.9x (Default)</span>
            <span>1.5x (Fast)</span>
          </div>
        </div>

        <button
          onClick={handleGenerateAudio}
          disabled={loading || !script}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Audio...
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              Generate Audio with ElevenLabs
            </>
          )}
        </button>

        {!script && (
          <p className="text-sm text-gray-500 text-center">
            Script is required to generate audio
          </p>
        )}
      </div>
    </div>
  );
}