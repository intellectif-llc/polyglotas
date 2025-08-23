"use client";

import React, { useState } from "react";
import { Volume2, VolumeX, Bot } from "lucide-react";
import Lottie from "lottie-react";
import { ChatMessage } from "@/hooks/chat/useChatConversation";
import animationData from "../../../../public/animations/Talking_Man.json";

interface MessageBubbleProps {
  message: ChatMessage;
  playingMessageId: string | null;
  onPlayAudio: (messageId: string, text: string) => void;
}

export default function MessageBubble({
  message,
  playingMessageId,
  onPlayAudio,
}: MessageBubbleProps) {
  const isUser = message.sender_type === "user";
  const isAI = message.sender_type === "ai";
  const isPlayingAudio = playingMessageId === message.message_id;

  const handlePlayAudio = () => {
    if (isAI) {
      onPlayAudio(message.message_id, message.message_text);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`flex items-end gap-2 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {isAI && (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {isPlayingAudio ? (
            <Lottie
              animationData={animationData}
              loop={true}
              style={{ width: "100%", height: "100%", transform: "scale(1.5)" }}
            />
          ) : (
            <Bot size={28} className="text-gray-500" />
          )}
        </div>
      )}
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
              disabled={!!playingMessageId}
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
      </div>
    </div>
  );
}
