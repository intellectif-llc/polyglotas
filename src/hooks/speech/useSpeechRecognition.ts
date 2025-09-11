import { useCallback, useRef } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { setupMicrophoneStream, closeAudioResources } from "@/utils/audioUtils";
import {
  initializeRecognizer,
  processRecognitionResult,
} from "@/services/speech/speechRecognitionService";
import { submitSpeechAttempt } from "@/services/speechApi";
import { useQueryClient } from "@tanstack/react-query";
import { UIStateType, UIState, AssessmentResults } from "./useRecognitionState";

interface LessonPhrasesData {
  lesson: {
    unit_id: number;
  };
}

interface UseSpeechRecognitionParams {
  referenceText: string;
  setUiState: (state: UIStateType) => void;
  setAssessmentResults: (results: AssessmentResults | null) => void;
  setErrorMessages: (
    messages: string[] | ((prev: string[]) => string[])
  ) => void;
  UIState: typeof UIState;
  lessonId?: string | number;
  phraseId?: string | number;
  onRecognitionComplete?: (results: AssessmentResults) => void;
}

export const useSpeechRecognition = ({
  referenceText,
  setUiState,
  setAssessmentResults,
  setErrorMessages,
  UIState,
  lessonId,
  phraseId,
  onRecognitionComplete,
}: UseSpeechRecognitionParams) => {
  const queryClient = useQueryClient();

  // Refs for SDK objects to prevent re-creation on re-renders
  const speechConfigRef = useRef<SpeechSDK.SpeechConfig | null>(null);
  const audioConfigRef = useRef<SpeechSDK.AudioConfig | null>(null);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const assessmentConfigRef =
    useRef<SpeechSDK.PronunciationAssessmentConfig | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const failSafeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeMediaStreamRef = useRef<MediaStream | null>(null);
  const latestAssessmentResultsRef = useRef<AssessmentResults | null>(null);

  // --- Cleanup Function ---
  const cleanupRecognizer = useCallback(async () => {
    // Clear failsafe timeout first
    if (failSafeTimeoutRef.current) {
      clearTimeout(failSafeTimeoutRef.current);
      failSafeTimeoutRef.current = null;
    }

    // Recognize cleanup with proper error handling
    if (recognizerRef.current) {
      try {
        // Remove all event handlers to prevent callbacks during cleanup
        recognizerRef.current.recognized = () => {};
        recognizerRef.current.canceled = () => {};
        recognizerRef.current.sessionStarted = () => {};
        recognizerRef.current.sessionStopped = () => {};
        recognizerRef.current.recognizing = () => {};

        // Close the recognizer
        recognizerRef.current.close();
        recognizerRef.current = null;
      } catch (err) {
        console.error("❌ Error closing recognizer:", err);
        recognizerRef.current = null;
      }
    }

    // Clean up audio resources
    closeAudioResources(activeMediaStreamRef.current, audioConfigRef.current);
    activeMediaStreamRef.current = null;
    audioConfigRef.current = null;

    // Clean up speech config
    if (speechConfigRef.current) {
      speechConfigRef.current = null;
    }

    // Clean up assessment config
    if (assessmentConfigRef.current) {
      assessmentConfigRef.current = null;
    }

    // Add a small delay to let GC work
    await new Promise((resolve) => setTimeout(resolve, 100));
  }, []);

  // Function to forcefully clean up resources
  const forceCleanupResources = useCallback(() => {
    // Force close recognizer
    if (recognizerRef.current) {
      try {
        // Detach all handlers first
        recognizerRef.current.recognized = () => {};
        recognizerRef.current.canceled = () => {};
        recognizerRef.current.sessionStarted = () => {};
        recognizerRef.current.sessionStopped = () => {};
        recognizerRef.current.recognizing = () => {};

        // Close it
        recognizerRef.current.close();
        recognizerRef.current = null;
      } catch (err) {
        console.error("Error during emergency recognizer cleanup:", err);
        recognizerRef.current = null;
      }
    }

    // Force cleanup audio resources
    closeAudioResources(activeMediaStreamRef.current, audioConfigRef.current);
    activeMediaStreamRef.current = null;
    audioConfigRef.current = null;

    // Reset state
    speechConfigRef.current = null;
    assessmentConfigRef.current = null;
    isStoppingRef.current = false;

    // Clear any failsafe timeout
    if (failSafeTimeoutRef.current) {
      clearTimeout(failSafeTimeoutRef.current);
      failSafeTimeoutRef.current = null;
    }

    // Reset UI if needed
    setUiState(UIState.Idle);
  }, [setUiState, UIState]);

  // --- Setup microphone stream ---
  const setupMicrophoneStreamHandler = useCallback(async () => {
    // First clean up any existing stream
    if (activeMediaStreamRef.current) {
      activeMediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      activeMediaStreamRef.current = null;
    }

    const { success, mediaStream } = await setupMicrophoneStream();
    if (success && mediaStream) {
      activeMediaStreamRef.current = mediaStream;
      return true;
    }
    return false;
  }, []);

  const startRecording = useCallback(async () => {
    setUiState(UIState.RequestingPermissions);
    setAssessmentResults(null);
    setErrorMessages([]);

    // Request microphone access first
    const hasMicrophoneAccess = await setupMicrophoneStreamHandler();
    if (!hasMicrophoneAccess) {
      console.error("❌ Microphone access denied");
      setErrorMessages([
        "Could not access the microphone. Please check permissions.",
      ]);
      setUiState(UIState.Error);
      return;
    }

    // Reset latest results ref
    latestAssessmentResultsRef.current = null;

    // Initialize a fresh recognizer instance
    const initResult = await initializeRecognizer(
      referenceText,
      activeMediaStreamRef.current,
      setErrorMessages,
      setUiState,
      UIState
    );

    if (initResult.success && "recognizer" in initResult) {
      // Store references
      speechConfigRef.current = initResult.speechConfig;
      audioConfigRef.current = initResult.audioConfig;
      recognizerRef.current = initResult.recognizer;
      assessmentConfigRef.current = initResult.assessmentConfig;

      // Reset stopping flag
      isStoppingRef.current = false;

      setUiState(UIState.Listening);

      // Set a failsafe timeout to prevent hanging in Listening state
      failSafeTimeoutRef.current = setTimeout(() => {
        if (recognizerRef.current && !isStoppingRef.current) {
          forceCleanupResources();
          setErrorMessages((prev) => [
            ...prev,
            "Recognition timed out. Please check your microphone and try again.",
          ]);
          setUiState(UIState.Error);
        }
      }, 20000); // 20 second timeout

      // Start recognition
      recognizerRef.current.recognizeOnceAsync(
        async (result) => {
          // Clear the failsafe timeout if recognition completes normally
          if (failSafeTimeoutRef.current) {
            clearTimeout(failSafeTimeoutRef.current);
            failSafeTimeoutRef.current = null;
          }

          setUiState(UIState.Processing);

          // Process the result
          const assessmentResults = processRecognitionResult(
            result,
            referenceText,
            setErrorMessages,
            setUiState,
            UIState
          );

          if (assessmentResults) {
            // Store results for later use
            latestAssessmentResultsRef.current = assessmentResults;
            setAssessmentResults(assessmentResults);
            setUiState(UIState.DisplayingResults);

            // Call the completion callback FIRST, before any async operations
            if (onRecognitionComplete) {
              onRecognitionComplete(assessmentResults);
            }

            // Auto-save the attempt if lessonId and phraseId are provided
            if (lessonId && phraseId) {
              try {
                await submitSpeechAttempt(
                  lessonId,
                  phraseId,
                  referenceText,
                  assessmentResults
                );

                // Invalidate relevant queries
                queryClient.invalidateQueries({
                  queryKey: ["userStats"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["userProfile"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["lessonPhrases", lessonId],
                });
                queryClient.invalidateQueries({
                  queryKey: ["lastSpeechAttempt", lessonId, phraseId],
                });
                queryClient.invalidateQueries({
                  queryKey: ["pronunciationUnits"],
                });
                queryClient.invalidateQueries({
                  queryKey: [
                    "unitLessons",
                    lessonId
                      ? (
                          queryClient.getQueryData([
                            "lessonPhrases",
                            lessonId,
                          ]) as LessonPhrasesData | undefined
                        )?.lesson?.unit_id
                      : undefined,
                  ],
                });
              } catch (error) {
                console.error("❌ Error saving speech attempt:", error);
                setErrorMessages((prev) => [
                  ...prev,
                  "Failed to save assessment results",
                ]);
              }
            }
          } else {
            // Handle trivial results - likely background noise/music
            setErrorMessages((prev) => [
              ...prev,
              "No clear speech detected. Please reduce background noise or turn off the music and try again.",
            ]);
            setUiState(UIState.Error);
          }

          // Clean up AFTER setting state and calling callback
          cleanupRecognizer();
        },
        (err) => {
          // Clear the failsafe timeout if recognition fails
          if (failSafeTimeoutRef.current) {
            clearTimeout(failSafeTimeoutRef.current);
            failSafeTimeoutRef.current = null;
          }

          // Attempt cleanup even if recognition fails
          cleanupRecognizer();
          setErrorMessages((prev) => [...prev, `Recognition error: ${err}`]);
          setUiState(UIState.Error);
        }
      );
    } else {
      console.error(
        "❌ Cannot start recording: Recognizer initialization failed."
      );
      // Ensure cleanup happened though
      await cleanupRecognizer();
    }
  }, [
    referenceText,
    setUiState,
    setAssessmentResults,
    setErrorMessages,
    UIState,
    lessonId,
    phraseId,
    cleanupRecognizer,
    queryClient,
    onRecognitionComplete,
    setupMicrophoneStreamHandler,
    forceCleanupResources,
  ]);

  const stopRecording = useCallback(() => {
    // For recognizeOnceAsync, the recognition will stop automatically after one utterance,
    // but we still need to handle the case where the user wants to stop recording manually
    if (recognizerRef.current && !isStoppingRef.current) {
      // Check flag to prevent multiple stops
      isStoppingRef.current = true; // Set stop flag *immediately*
      setUiState(UIState.Processing);

      // Clear failsafe timeout if it exists
      if (failSafeTimeoutRef.current) {
        clearTimeout(failSafeTimeoutRef.current);
        failSafeTimeoutRef.current = null;
      }

      // Clean up resources
      forceCleanupResources();
    }
  }, [setUiState, UIState, forceCleanupResources]);

  return {
    startRecording,
    stopRecording,
    cleanupRecognizer,
    isStoppingRef,
  };
};
