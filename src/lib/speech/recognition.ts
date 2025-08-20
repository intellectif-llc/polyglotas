/**
 * Speech recognition utilities for chat voice input
 * Uses Web Speech API for client-side speech recognition
 */

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class ChatSpeechRecognition {
  private recognition: any;
  private isListening = false;
  private onResult?: (result: SpeechRecognitionResult) => void;
  private onError?: (error: string) => void;
  private onStart?: () => void;
  private onEnd?: () => void;

  constructor(options: SpeechRecognitionOptions = {}) {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error("Speech recognition not supported in this browser");
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognition(options);
  }

  private setupRecognition(options: SpeechRecognitionOptions) {
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.lang = options.language || "en-US";
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      this.onError?.(event.error);
    };

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];

      if (lastResult) {
        const transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;
        const isFinal = lastResult.isFinal;

        this.onResult?.({
          transcript,
          confidence,
          isFinal,
        });
      }
    };
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isListening) {
        reject(new Error("Already listening"));
        return;
      }

      const originalOnStart = this.onStart;
      this.onStart = () => {
        originalOnStart?.();
        resolve();
      };

      const originalOnError = this.onError;
      this.onError = (error) => {
        originalOnError?.(error);
        reject(new Error(error));
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  public stop(): void {
    if (this.isListening) {
      this.recognition.stop();
    }
  }

  public abort(): void {
    if (this.isListening) {
      this.recognition.abort();
    }
  }

  public setOnResult(
    callback: (result: SpeechRecognitionResult) => void
  ): void {
    this.onResult = callback;
  }

  public setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public setOnStart(callback: () => void): void {
    this.onStart = callback;
  }

  public setOnEnd(callback: () => void): void {
    this.onEnd = callback;
  }

  public get listening(): boolean {
    return this.isListening;
  }

  public static isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }
}

/**
 * Hook for using speech recognition in React components
 */
export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSupported, setIsSupported] = React.useState(false);

  const recognitionRef = React.useRef<ChatSpeechRecognition | null>(null);

  React.useEffect(() => {
    setIsSupported(ChatSpeechRecognition.isSupported());

    if (ChatSpeechRecognition.isSupported()) {
      try {
        recognitionRef.current = new ChatSpeechRecognition(options);

        recognitionRef.current.setOnStart(() => {
          setIsListening(true);
          setError(null);
        });

        recognitionRef.current.setOnEnd(() => {
          setIsListening(false);
        });

        recognitionRef.current.setOnError((error) => {
          setError(error);
          setIsListening(false);
        });

        recognitionRef.current.setOnResult((result) => {
          setTranscript(result.transcript);
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize speech recognition"
        );
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = React.useCallback(async () => {
    if (!recognitionRef.current || isListening) return;

    try {
      setTranscript("");
      setError(null);
      await recognitionRef.current.start();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start listening"
      );
    }
  }, [isListening]);

  const stopListening = React.useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}

// Add React import for the hook
import React from "react";
