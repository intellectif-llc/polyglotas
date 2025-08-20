"use client";

import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ChatMessage } from "@/hooks/chat/useChatConversation";

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const isUser = message.sender_type === "user";
  const isAI = message.sender_type === "ai";

  const handlePlayAudio = async () => {
    if (!isAI || isPlayingAudio) return;

    setIsPlayingAudio(true);
    setAudioError(null);

    try {
      // Generate and play TTS audio
      const response = await fetch("/api/chat/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message.message_text,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Get audio blob and play it
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsPlayingAudio(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setAudioError("Failed to play audio");
        setIsPlayingAudio(false);
      };

      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setAudioError("Failed to generate or play audio");
      setIsPlayingAudio(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-xs lg:max-w-md px-4 py-2 rounded-lg
          ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}
        `}
      >
        {/* Message text */}
        <div className="whitespace-pre-wrap break-words">
          {message.message_text}
        </div>

        {/* Message footer */}
        <div
          className={`
          flex items-center justify-between mt-2 text-xs
          ${isUser ? "text-blue-100" : "text-gray-500"}
        `}
        >
          <span>{formatTimestamp(message.created_at)}</span>

          {/* Audio controls for AI messages */}
          {isAI && (
            <button
              onClick={handlePlayAudio}
              disabled={isPlayingAudio}
              className={`
                ml-2 p-1 rounded hover:bg-opacity-20 hover:bg-gray-600 
                transition-colors disabled:opacity-50
                ${isPlayingAudio ? "animate-pulse" : ""}
              `}
              title={isPlayingAudio ? "Playing..." : "Play audio"}
            >
              {isPlayingAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}
        </div>

        {/* Audio error display */}
        {audioError && (
          <div className="mt-1 text-xs text-red-300">{audioError}</div>
        )}
      </div>
    </div>
  );
}
