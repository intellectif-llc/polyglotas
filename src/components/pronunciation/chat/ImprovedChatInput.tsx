"use client";

import React, { useState, useEffect } from "react";
import { Send, Mic, Square, Keyboard, X } from "lucide-react";
import { useEnhancedSpeechRecognition } from "@/lib/speech/enhancedRecognition";
import {
  useEfficientVoiceMessage,
  EfficientVoiceMessageResponse,
} from "@/hooks/chat/useEfficientVoiceMessage";
import {
  LoadingIndicator,
  ListeningIndicator,
  ProcessingIndicator,
} from "./SpeechStateIndicators";

interface ImprovedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  targetLanguage?: string;
  nativeLanguage?: string;
  lessonLevel?: string;
  conversationId?: string;
  onEfficientVoiceMessage?: (result: EfficientVoiceMessageResponse) => void;
}

export default function ImprovedChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  targetLanguage = "en",
  nativeLanguage = "es",
  lessonLevel = "A1",
  conversationId,
  onEfficientVoiceMessage,
}: ImprovedChatInputProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [pendingTranscript, setPendingTranscript] = useState<string | null>(
    null
  );
  const [useEfficientMode, setUseEfficientMode] = useState(false);

  const {
    isListening,
    isProcessing,
    result: speechResult,
    error: speechError,
    isSupported: speechSupported,
    startListening,
    stopListening,
  } = useEnhancedSpeechRecognition({
    targetLanguage,
    nativeLanguage,
    lessonLevel,
    allowNativeLanguage: true,
    preferredProvider: "auto",
  });

  const {
    sendVoiceMessage,
    isProcessing: isEfficientProcessing,
    error: efficientError,
  } = useEfficientVoiceMessage();

  // Update input value with speech result
  useEffect(() => {
    console.log("📝 Speech result received:", speechResult);
    console.log("📝 Current state when result received:", {
      isVoiceMode,
      voiceSessionActive,
      isListening,
      isProcessing,
    });

    if (speechResult?.transcript) {
      console.log(
        "✅ Updating input with transcript:",
        speechResult.transcript
      );
      onChange(speechResult.transcript);
      setPendingTranscript(speechResult.transcript);

      // Log language detection results and provider efficiency
      if (speechResult.languageSwitch?.switched) {
        console.log(
          `Language switch detected: ${speechResult.languageSwitch.fromLanguage} → ${speechResult.languageSwitch.toLanguage}`
        );
      }
      console.log(
        `Speech recognized via ${speechResult.provider} with confidence ${speechResult.confidence}`
      );

      // Log efficiency information for Gemini fallback
      if (speechResult.provider === "gemini-stt-only") {
        console.log(
          "⚠️  Gemini STT-only fallback used - still inefficient (two requests)"
        );
        console.log(
          "💡 SWITCHING: Will use efficient multimodal approach for next voice input"
        );
        setUseEfficientMode(true); // Switch to efficient mode after detecting Gemini fallback
      }
    }
  }, [
    speechResult,
    onChange,
    isVoiceMode,
    voiceSessionActive,
    isListening,
    isProcessing,
  ]);

  // Auto-send when speech recognition ends with final result
  useEffect(() => {
    console.log("🔄 Auto-send check:", {
      isListening,
      isProcessing,
      hasTranscript: !!pendingTranscript,
      isVoiceMode,
      voiceSessionActive,
      transcript: pendingTranscript,
      useEfficientMode,
    });

    // Auto-send if we have a transcript and speech recognition is complete
    if (
      !isListening &&
      !isProcessing &&
      pendingTranscript &&
      pendingTranscript.trim()
    ) {
      console.log("✅ Auto-sending message:", pendingTranscript);
      const timer = setTimeout(() => {
        console.log(
          "🚀 Executing onSend() with transcript:",
          pendingTranscript
        );
        onSend();
        setIsVoiceMode(false);
        setVoiceSessionActive(false);
        setPendingTranscript(null);
      }, 500);

      return () => clearTimeout(timer);
    } else if (!isListening && !isProcessing && pendingTranscript) {
      console.log("❌ Auto-send blocked - conditions not met:", {
        isVoiceMode,
        voiceSessionActive,
        transcript: pendingTranscript,
      });
    }
  }, [
    isListening,
    isProcessing,
    pendingTranscript,
    onSend,
    useEfficientMode,
    isVoiceMode,
    voiceSessionActive,
  ]);

  const handleVoiceToggle = async () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening || isProcessing || isEfficientProcessing) {
      console.log("🔴 Stopping voice recognition manually");
      stopListening();
      console.log("🔴 Voice mode remains active to wait for result");
    } else {
      try {
        console.log("🟢 Starting voice recognition");
        setIsVoiceMode(true);
        setVoiceSessionActive(true);
        onChange("");

        if (useEfficientMode && conversationId && onEfficientVoiceMessage) {
          console.log("✨ Using EFFICIENT multimodal voice message approach");
          await handleEfficientVoiceInput();
        } else {
          console.log("🔄 Using standard STT + conversation approach");
          await startListening();
        }

        console.log("🟢 Voice recognition started, isVoiceMode=true");
      } catch (error) {
        console.error("Failed to start voice recognition:", error);
        setIsVoiceMode(false);
        setVoiceSessionActive(false);
      }
    }
  };

  const handleEfficientVoiceInput = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup MediaRecorder for efficient approach
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log(
          "✨ Efficient: MediaRecorder stopped, processing with multimodal approach"
        );
        setIsVoiceMode(false);

        try {
          const audioBlob = new Blob(audioChunks, {
            type: "audio/webm;codecs=opus",
          });

          if (audioBlob.size === 0) {
            throw new Error("No audio data recorded");
          }

          console.log(
            "✨ Efficient: Sending single multimodal request to Gemini"
          );
          const result = await sendVoiceMessage(audioBlob, {
            conversationId: conversationId!,
            targetLanguage,
            nativeLanguage,
            lessonLevel,
          });

          console.log(
            "✅ Efficient: Single multimodal request completed:",
            result
          );
          onEfficientVoiceMessage?.(result);
        } catch (error) {
          console.error("❌ Efficient: Multimodal request failed:", error);
          setIsVoiceMode(false);
        } finally {
          setVoiceSessionActive(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("Efficient: MediaRecorder error:", event);
        setIsVoiceMode(false);
        setVoiceSessionActive(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      console.log("✨ Efficient: Started recording for multimodal approach");

      // Auto-stop after reasonable time
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 10000); // 10 second max
    } catch (error) {
      console.error("❌ Efficient: Failed to start recording:", error);
      setIsVoiceMode(false);
      setVoiceSessionActive(false);
    }
  };

  // Reset voice mode if there's a speech error
  useEffect(() => {
    if (speechError || efficientError) {
      console.log("⚠️ Speech error detected, resetting voice mode");
      setIsVoiceMode(false);
      setVoiceSessionActive(false);
      setPendingTranscript(null);
    }
  }, [speechError, efficientError]);

  // Ensure voice session is reset when not listening and not processing and no recent result
  // Only reset if we're not in the middle of an auto-send process
  useEffect(() => {
    if (
      !isListening &&
      !isProcessing &&
      !pendingTranscript &&
      (voiceSessionActive || isVoiceMode)
    ) {
      console.log(
        "🔄 Scheduling voice session reset - no activity after 5 seconds"
      );
      const timer = setTimeout(() => {
        console.log("⏰ Timeout: Resetting voice mode and session");
        setIsVoiceMode(false);
        setVoiceSessionActive(false);
        setPendingTranscript(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [
    isListening,
    isProcessing,
    pendingTranscript,
    voiceSessionActive,
    isVoiceMode,
  ]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSend();
      setShowTextInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  };

  const toggleTextInput = () => {
    console.log(
      "🔄 Toggling text input, current showTextInput:",
      showTextInput
    );
    setShowTextInput(!showTextInput);
    if (isVoiceMode || voiceSessionActive) {
      console.log("🔴 Canceling voice mode for text input");
      stopListening();
      setIsVoiceMode(false);
      setVoiceSessionActive(false);
      setPendingTranscript(null);
    }
  };

  // Render speech state indicator
  const renderSpeechState = () => {
    if ((isProcessing && !isListening) || isEfficientProcessing) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <LoadingIndicator />
          <p className="text-sm text-gray-600">
            {useEfficientMode
              ? "Processing with efficient multimodal approach..."
              : "Wait ..."}
          </p>
        </div>
      );
    }

    if (isListening) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <ListeningIndicator />
          <p className="text-sm text-green-600 font-medium">Speak now!</p>
          {useEfficientMode && (
            <p className="text-xs text-blue-600">
              ✨ Using efficient multimodal approach
            </p>
          )}
        </div>
      );
    }

    if (isVoiceMode && speechResult?.transcript) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <ProcessingIndicator />
          <p className="text-sm text-blue-600">Processing your message...</p>
          {speechResult.languageSwitch?.switched && (
            <p className="text-xs text-orange-600">
              Detected {speechResult.detectedLanguage} (via{" "}
              {speechResult.provider})
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Speech error display */}
      {(speechError || efficientError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                Voice recognition error: {speechError || efficientError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Speech State Indicator */}
      {isVoiceMode && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-col items-center">
            {renderSpeechState()}

            {/* Transcript display */}
            {speechResult?.transcript && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 max-w-md">
                <p className="text-sm text-gray-700">
                  {speechResult.transcript}
                </p>
                {speechResult.languageSwitch?.switched && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                    <span>🌐</span>
                    <span>Detected: {speechResult.detectedLanguage}</span>
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  via{" "}
                  {speechResult.provider === "gemini-stt-only"
                    ? "Gemini (inefficient)"
                    : speechResult.provider}{" "}
                  • {Math.round(speechResult.confidence * 100)}% confidence
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Text Input (Hidden by default) */}
        {showTextInput && (
          <div className="p-4 border-b border-gray-100 animate-slide-in-from-top">
            <form
              onSubmit={handleTextSubmit}
              className="flex items-start gap-3"
            >
              <div className="flex-1">
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={disabled}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed min-h-[40px] max-h-32"
                  style={{
                    height: "auto",
                    minHeight: "40px",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height =
                      Math.min(target.scrollHeight, 128) + "px";
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={disabled || !value.trim()}
                className={`p-2 rounded-lg transition-colors min-w-[40px] h-[40px] flex items-center justify-center ${
                  disabled || !value.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                }`}
                title="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* Control Buttons */}
        <div className="p-4">
          <div className="flex items-center justify-center gap-4">
            {/* Primary Speech Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={disabled}
                className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  isListening
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-lg"
                    : isVoiceMode
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                title={isListening ? "Stop recording" : "Start voice input"}
              >
                {!isVoiceMode && !isListening && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30"></div>
                    <Mic size={24} className="relative z-10" />
                  </div>
                )}
                {isVoiceMode && !isListening && <Mic size={24} />}
                {isListening && <Square size={24} />}
              </button>
            )}

            {/* Text Input Toggle */}
            <button
              type="button"
              onClick={toggleTextInput}
              disabled={disabled || isVoiceMode}
              className={`p-3 rounded-full transition-all duration-300 ${
                showTextInput
                  ? "bg-gray-600 text-white hover:bg-gray-700"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              } ${
                disabled || isVoiceMode ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title={showTextInput ? "Hide keyboard" : "Show keyboard"}
            >
              {showTextInput ? <X size={20} /> : <Keyboard size={20} />}
            </button>
          </div>

          {/* Instruction Text */}
          <div className="mt-3 text-center">
            <p className="text-sm text-gray-500">
              {isVoiceMode
                ? isListening
                  ? "Speak clearly into your microphone"
                  : isProcessing
                  ? "Processing your speech..."
                  : "Preparing to listen..."
                : showTextInput
                ? "Type your message above"
                : "Tap the microphone to speak or keyboard to type"}
            </p>
            {isVoiceMode && (
              <p className="text-xs text-gray-400 mt-1">
                You can speak in {targetLanguage} or {nativeLanguage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
