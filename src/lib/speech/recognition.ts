import React from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { getTokenOrRefresh } from "./auth";

/**
 * Speech recognition utilities for chat voice input
 * Uses Azure Speech SDK for reliable speech recognition
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

/**
 * Azure Speech SDK based speech recognition hook
 * More reliable than Web Speech API, works offline-first
 */
export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSupported, setIsSupported] = React.useState(true); // Azure SDK is always supported
  const [isProcessing, setIsProcessing] = React.useState(false);

  const recognizerRef = React.useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const finalTranscriptRef = React.useRef("");

  const cleanup = React.useCallback(() => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.close();
        recognizerRef.current = null;
        console.log("Azure Speech recognizer cleaned up");
      } catch (err) {
        console.warn("Error cleaning up Azure Speech recognizer:", err);
      }
    }
  }, []);

  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const startListening = React.useCallback(async () => {
    if (isListening || isProcessing) {
      console.warn("Cannot start listening: already listening or processing");
      return;
    }

    console.log("Starting Azure Speech recognition...");
    setTranscript("");
    setError(null);
    setIsProcessing(true);
    finalTranscriptRef.current = "";

    try {
      const tokenObj = await getTokenOrRefresh();
      if (!tokenObj || !tokenObj.authToken || !tokenObj.region) {
        throw new Error("Failed to get Azure Speech token");
      }

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
        tokenObj.authToken,
        tokenObj.region
      );
      speechConfig.speechRecognitionLanguage = options.language || "en-US";
      speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;

      // Set timeout for better user experience
      speechConfig.setProperty(
        SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs,
        "3500"
      );

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        audioConfig
      );
      recognizerRef.current = recognizer;

      // Setup event handlers
      recognizer.recognizing = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizingSpeech) {
          const interimText = finalTranscriptRef.current + e.result.text;
          setTranscript(interimText);
        }
      };

      recognizer.recognized = (s, e) => {
        console.log("Azure Speech recognized:", e.result.reason, e.result.text);
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          if (e.result.text) {
            finalTranscriptRef.current += e.result.text + " ";
            setTranscript(finalTranscriptRef.current.trim());
          }
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          console.log("No speech could be recognized");
        }
      };

      recognizer.canceled = (s, e) => {
        console.log(
          `Azure Speech canceled: ${SpeechSDK.CancellationReason[e.reason]}`
        );
        let errorMessage = `Recognition canceled: ${
          SpeechSDK.CancellationReason[e.reason]
        }`;

        if (e.reason === SpeechSDK.CancellationReason.Error) {
          console.error(`Error details: ${e.errorDetails}`);
          errorMessage += ` - ${e.errorDetails}`;
        }

        setError(errorMessage);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognizer.sessionStarted = (s, e) => {
        console.log("Azure Speech session started");
        setIsListening(true);
        setIsProcessing(false);
      };

      recognizer.sessionStopped = (s, e) => {
        console.log("Azure Speech session stopped");
        setIsListening(false);
        setIsProcessing(false);
        cleanup();
      };

      // Start recognition
      if (options.continuous) {
        await recognizer.startContinuousRecognitionAsync();
      } else {
        recognizer.recognizeOnceAsync(
          (result) => {
            console.log("Single recognition result:", result.text);
            setTranscript(result.text);
            setIsListening(false);
            setIsProcessing(false);
            cleanup();
          },
          (error) => {
            console.error("Single recognition error:", error);
            setError(`Recognition failed: ${error}`);
            setIsListening(false);
            setIsProcessing(false);
            cleanup();
          }
        );
      }
    } catch (err) {
      console.error("Failed to start Azure Speech recognition:", err);
      setError(
        `Failed to start recognition: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsListening(false);
      setIsProcessing(false);
      cleanup();
    }
  }, [
    isListening,
    isProcessing,
    options.language,
    options.continuous,
    cleanup,
  ]);

  const stopListening = React.useCallback(async () => {
    if (!recognizerRef.current || !isListening) {
      console.warn("Cannot stop listening: not currently listening");
      return;
    }

    console.log("Stopping Azure Speech recognition...");
    setIsProcessing(true);

    try {
      if (options.continuous) {
        await recognizerRef.current.stopContinuousRecognitionAsync();
      } else {
        // For single recognition, just cleanup
        cleanup();
      }
    } catch (err) {
      console.error("Error stopping Azure Speech recognition:", err);
      setError(
        `Error stopping recognition: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsListening(false);
      setIsProcessing(false);
      cleanup();
    }
  }, [isListening, options.continuous, cleanup]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    isProcessing,
    startListening,
    stopListening,
  };
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
