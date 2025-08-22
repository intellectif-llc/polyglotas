"use client";

import React, { useState, useEffect } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/lib/speech/recognition";

interface ChatInputControlsProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInputControls({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled = false,
  placeholder = "Type your message...",
}: ChatInputControlsProps) {
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
      // Small delay to ensure transcript is complete
      const timer = setTimeout(() => {
        onSend();
        setIsVoiceMode(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isListening, isProcessing, transcript, isVoiceMode, onSend]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSend();
      setIsVoiceMode(false);
    }
  };

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
        onChange(""); // Clear current text
        await startListening();
      } catch (error) {
        console.error("Failed to start voice recognition:", error);
        setIsVoiceMode(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Voice mode indicator */}
      {isVoiceMode && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div
            className={`w-2 h-2 rounded-full ${
              isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span>{isListening ? "Listening..." : "Processing..."}</span>
        </div>
      )}

      {/* Speech error display */}
      {speechError && (
        <div className="text-sm text-red-600">
          Voice recognition error: {speechError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={onKeyPress}
            disabled={disabled || isListening}
            placeholder={isVoiceMode ? "Speak your message..." : placeholder}
            rows={1}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-lg resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              min-h-[40px] max-h-32
              ${isVoiceMode ? "border-blue-300 bg-blue-50" : ""}
            `}
            style={{
              height: "auto",
              minHeight: "40px",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
          />
        </div>

        {/* Voice input button */}
        {speechSupported && (
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={disabled}
            className={`
              p-2 rounded-lg transition-colors min-w-[40px] h-[40px]
              flex items-center justify-center cursor-pointer
              ${
                isListening
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : isVoiceMode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
            title={isListening ? "Stop recording" : "Start voice input"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !value.trim() || isListening}
          className={`
            p-2 rounded-lg transition-colors min-w-[40px] h-[40px]
            flex items-center justify-center
            ${
              disabled || !value.trim() || isListening
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }
          `}
          title="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
