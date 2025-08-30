import React from "react";
import { SmartSTTRouter, ConversationContext } from "./smartSTTRouter";

export interface EnhancedSpeechRecognitionOptions {
  targetLanguage: string;
  nativeLanguage: string;
  lessonLevel: string;
  allowNativeLanguage?: boolean;
  preferredProvider?: 'elevenlabs' | 'azure' | 'auto';
  confidenceThreshold?: number;
}

export interface EnhancedSpeechResult {
  transcript: string;
  detectedLanguage: string;
  confidence: number;
  languageSwitch: {
    switched: boolean;
    fromLanguage: string;
    toLanguage: string;
    confidence: number;
  };
  provider: string;
  attempts: Array<{ provider: string; success: boolean; error?: string }>;
}

/**
 * Enhanced speech recognition hook with multilingual support and smart fallbacks
 */
export function useEnhancedSpeechRecognition(options: EnhancedSpeechRecognitionOptions) {
  const [isListening, setIsListening] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<EnhancedSpeechResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSupported] = React.useState(true); // Always supported with fallbacks

  const sttRouterRef = React.useRef<SmartSTTRouter | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  // Initialize STT router
  React.useEffect(() => {
    sttRouterRef.current = new SmartSTTRouter({
      preferredProvider: options.preferredProvider || 'auto',
      confidenceThreshold: options.confidenceThreshold || 0.7,
    });
  }, [options.preferredProvider, options.confidenceThreshold]);

  const startListening = React.useCallback(async () => {
    if (isListening || isProcessing) {
      console.warn("Cannot start listening: already listening or processing");
      return;
    }

    setError(null);
    setResult(null);
    setIsListening(true);
    audioChunksRef.current = [];

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎤 MediaRecorder stopped, transitioning to processing');
        setIsListening(false);
        setIsProcessing(true);

        try {
          // Create audio blob from recorded chunks
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: 'audio/webm;codecs=opus' 
          });

          if (audioBlob.size === 0) {
            throw new Error("No audio data recorded");
          }

          // Build conversation context
          const context: ConversationContext = {
            targetLanguage: options.targetLanguage,
            nativeLanguage: options.nativeLanguage,
            lessonLevel: options.lessonLevel,
            allowNativeLanguage: options.allowNativeLanguage ?? true,
          };

          // Use server-side STT API for better audio format handling
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');
          formData.append('options', JSON.stringify({
            targetLanguage: context.targetLanguage,
            nativeLanguage: context.nativeLanguage,
            lessonLevel: context.lessonLevel,
            allowNativeLanguage: context.allowNativeLanguage,
            preferredProvider: options.preferredProvider || 'elevenlabs',
          }));

          const response = await fetch('/api/speech/enhanced-stt', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'STT API request failed');
          }

          const transcriptionResult = await response.json();

          // Set the enhanced result
          const enhancedResult = {
            transcript: transcriptionResult.transcript,
            detectedLanguage: transcriptionResult.detectedLanguage,
            confidence: transcriptionResult.confidence,
            languageSwitch: transcriptionResult.languageSwitch,
            provider: transcriptionResult.provider,
            attempts: transcriptionResult.attempts,
          };
          
          console.log('🎤 Setting speech result:', enhancedResult);
          setResult(enhancedResult);
          console.log("Enhanced speech recognition result:", transcriptionResult);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown transcription error';
          console.error("Enhanced speech recognition error:", errorMessage);
          setError(errorMessage);
        } finally {
          console.log('🎤 Processing complete, setting isProcessing=false');
          setIsProcessing(false);
          // Clean up stream
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Recording failed");
        setIsListening(false);
        setIsProcessing(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      console.log("Started enhanced speech recognition");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      console.error("Failed to start enhanced speech recognition:", errorMessage);
      setError(errorMessage);
      setIsListening(false);
      setIsProcessing(false);
    }
  }, [isListening, isProcessing, options]);

  const stopListening = React.useCallback(() => {
    if (!isListening || !mediaRecorderRef.current) {
      console.warn("Cannot stop listening: not currently listening");
      return;
    }

    console.log("Stopping enhanced speech recognition");
    mediaRecorderRef.current.stop();
  }, [isListening]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isListening) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isListening]);

  return {
    isListening,
    isProcessing,
    result,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}