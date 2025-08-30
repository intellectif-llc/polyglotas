"use client";

import React, { useState, useEffect } from "react";
import { Send, Mic, MicOff, Keyboard, X } from "lucide-react";
import { useSpeechRecognition } from "@/lib/speech/recognition";
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
}

export default function ImprovedChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
}: ImprovedChatInputProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: speechSupported,
    isProcessing,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: "en-US",
    continuous: false,
    interimResults: true,
  });

  // Update input value with speech transcript
  useEffect(() => {
    if (transcript && isVoiceMode) {
      onChange(transcript);
    }
  }, [transcript, isVoiceMode, onChange]);

  // Auto-send when speech recognition ends with final result
  useEffect(() => {
    if (
      !isListening &&
      !isProcessing &&
      transcript &&
      isVoiceMode &&
      transcript.trim()
    ) {
      const timer = setTimeout(() => {
        onSend();
        setIsVoiceMode(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isListening, isProcessing, transcript, isVoiceMode, onSend]);

  const handleVoiceToggle = async () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening || isProcessing) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      try {
        setIsVoiceMode(true);
        onChange("");
        await startListening();
      } catch (error) {
        console.error("Failed to start voice recognition:", error);
        setIsVoiceMode(false);
      }
    }
  };

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
    setShowTextInput(!showTextInput);
    if (isVoiceMode) {
      setIsVoiceMode(false);
      stopListening();
    }
  };

  // Render speech state indicator
  const renderSpeechState = () => {
    if (isProcessing && !isListening) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <LoadingIndicator />
          <p className="text-sm text-gray-600">Wait ...</p>
        </div>
      );
    }

    if (isListening) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <ListeningIndicator />
          <p className="text-sm text-green-600 font-medium">Speak now!</p>
        </div>
      );
    }

    if (isVoiceMode && transcript) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <ProcessingIndicator />
          <p className="text-sm text-blue-600">Processing your message...</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Speech error display */}
      {speechError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                Voice recognition error: {speechError}
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
            {transcript && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 max-w-md">
                <p className="text-sm text-gray-700">{transcript}</p>
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
                className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-105 ${
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
                {isListening && <MicOff size={24} />}
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
                  : "Preparing to listen..."
                : showTextInput
                ? "Type your message above"
                : "Tap the microphone to speak or keyboard to type"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
