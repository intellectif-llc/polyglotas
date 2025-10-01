'use client';

import { useState, useCallback } from 'react';
import { Video, Upload, X, Check, Loader2 } from 'lucide-react';

interface VideoUploadPanelProps {
  bookId: string;
  chapterId: string;
  currentVideoUrl?: string;
  onSuccess: () => void;
}

export default function VideoUploadPanel({ 
  bookId, 
  chapterId, 
  currentVideoUrl,
  onSuccess 
}: VideoUploadPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        alert('Please select a video file (MP4, WebM, MOV, AVI)');
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        alert('Please select a video file (MP4, WebM, MOV, AVI)');
      }
    }
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const response = await fetch(`/api/admin/audiobooks/${bookId}/chapters/${chapterId}/upload-video`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload video');
      }

      const result = await response.json();
      console.log('Video uploaded:', result.video_url);
      
      handleCancel();
      onSuccess();
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Video className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold">Chapter Video</h3>
      </div>

      <div className="space-y-4">
        {currentVideoUrl && !selectedFile && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current video:</p>
            <video 
              src={currentVideoUrl} 
              controls
              className="max-w-full h-32 rounded-lg border"
            />
          </div>
        )}

        {!selectedFile ? (
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop video here or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports MP4, WebM, MOV, AVI (max 100MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video 
                src={previewUrl!} 
                controls
                className="max-w-full h-48 rounded-lg border mx-auto"
              />
              <button
                onClick={handleCancel}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}