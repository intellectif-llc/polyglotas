"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX, Bot, Lightbulb } from "lucide-react";
import Lottie from "lottie-react";
import { ChatMessage } from "@/hooks/chat/useChatConversation";
import WordTooltip from "@/components/speech/WordTooltip";
import animationData from "../../../../public/animations/Talking_Man.json";

interface SuggestedAnswerButtonProps {
  suggestion: string;
  onPlayAudio: (messageId: string, text: string) => void;
  playingMessageId: string | null;
  messageId: string;
}

function SuggestedAnswerButton({
  suggestion,
  onPlayAudio,
  playingMessageId,
  messageId,
}: SuggestedAnswerButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipConfig, setTooltipConfig] = useState({
    visible: false,
    selectedText: "",
    triggerElement: null as HTMLElement | null,
  });
  const suggestionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPlaying = playingMessageId === messageId;

  const closeTooltip = useCallback(() => {
    setTooltipConfig({
      visible: false,
      selectedText: "",
      triggerElement: null,
    });
  }, []);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayAudio(messageId, suggestion);
  };

  // Only close when clicking completely outside the component
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  // Handle text selection for translation - only close translation tooltip on outside clicks
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (
        selectedText &&
        suggestionRef.current?.contains(selection?.anchorNode || null)
      ) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const triggerElement = document.createElement("div");
          triggerElement.style.position = "absolute";
          triggerElement.style.left = `${rect.left + window.scrollX}px`;
          triggerElement.style.top = `${rect.top + window.scrollY}px`;
          triggerElement.style.width = `${rect.width}px`;
          triggerElement.style.height = `${rect.height}px`;

          setTooltipConfig({
            visible: true,
            selectedText,
            triggerElement,
          });
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  if (!suggestion || typeof suggestion !== "string") return null;

  return (
    <div ref={containerRef} className="relative">
      {/* Lightbulb button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className={`absolute -bottom-4 -right-4 w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-10 cursor-pointer ${
          isExpanded
            ? "bg-yellow-500 scale-110"
            : "bg-yellow-400 hover:bg-yellow-500 hover:scale-105"
        }`}
        title="Get suggestion"
      >
        <Lightbulb size={16} className="text-yellow-800" />
      </button>

      {/* Persistent suggestion panel */}
      {isExpanded && (
        <div className="absolute bottom-6 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-20 animate-in slide-in-from-bottom-2 duration-200">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
              <Lightbulb size={14} className="text-yellow-600" />
              Sample response
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Suggestion text */}
          <div className="p-3">
            <div
              ref={suggestionRef}
              className="text-sm text-gray-800 p-3 bg-blue-50 rounded border-l-4 border-blue-400 italic selectable-ai-text cursor-text mb-3"
            >
              &ldquo;{suggestion}&rdquo;
            </div>

            {/* Audio button */}
            <button
              onClick={handlePlayAudio}
              disabled={!!playingMessageId && !isPlaying}
              className={`w-full flex items-center justify-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors font-medium disabled:opacity-50 ${
                isPlaying ? "animate-pulse bg-green-700" : ""
              }`}
            >
              {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isPlaying
                ? "Playing pronunciation..."
                : "Listen to pronunciation"}
            </button>
          </div>
        </div>
      )}

      {/* Translation tooltip */}
      {tooltipConfig.visible &&
        tooltipConfig.selectedText &&
        tooltipConfig.triggerElement && (
          <WordTooltip
            selectedText={tooltipConfig.selectedText}
            onClose={closeTooltip}
            triggerElement={tooltipConfig.triggerElement}
          />
        )}
    </div>
  );
}

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

  const [tooltipConfig, setTooltipConfig] = useState({
    visible: false,
    selectedText: "",
    triggerElement: null as HTMLElement | null,
  });
  const messageContentRef = useRef<HTMLDivElement>(null);

  const closeTooltip = useCallback(() => {
    setTooltipConfig({
      visible: false,
      selectedText: "",
      triggerElement: null,
    });
  }, []);

  const handlePlayAudio = () => {
    if (isAI) {
      onPlayAudio(message.message_id, message.message_text);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (!isAI || isUser) return;

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (
        selectedText &&
        messageContentRef.current?.contains(selection?.anchorNode || null)
      ) {
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const triggerElement = document.createElement("div");
          triggerElement.style.position = "absolute";
          triggerElement.style.left = `${rect.left + window.scrollX}px`;
          triggerElement.style.top = `${rect.top + window.scrollY}px`;
          triggerElement.style.width = `${rect.width}px`;
          triggerElement.style.height = `${rect.height}px`;

          setTooltipConfig({
            visible: true,
            selectedText,
            triggerElement,
          });
        }
      } else {
        closeTooltip();
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [isAI, isUser, closeTooltip]);

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
      <div className="relative">
        <div
          className={`
            max-w-xs lg:max-w-md px-4 pr-6 py-2 rounded-lg relative
            ${isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}
          `}
        >
          {/* Audio controls for AI messages - moved to top right */}
          {isAI && (
            <button
              onClick={handlePlayAudio}
              disabled={!!playingMessageId}
              className={`
                absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-md
                hover:bg-gray-50 transition-colors disabled:opacity-50 z-10
                ${isPlayingAudio ? "animate-pulse" : ""}
              `}
              title={isPlayingAudio ? "Playing..." : "Play audio"}
            >
              {isPlayingAudio ? (
                <VolumeX size={14} className="text-gray-600" />
              ) : (
                <Volume2 size={14} className="text-gray-600" />
              )}
            </button>
          )}

          {/* Message text */}
          <div
            ref={messageContentRef}
            className={`whitespace-pre-wrap break-words ${
              isAI ? "selectable-ai-text" : ""
            }`}
          >
            {message.message_text}
          </div>

          {/* Message footer */}
          <div
            className={`
            flex items-center justify-start mt-2 text-xs
            ${isUser ? "text-blue-100" : "text-gray-500"}
          `}
          >
            <span>{formatTimestamp(message.created_at)}</span>
          </div>
        </div>

        {/* Suggested answer button - positioned at bottom right corner */}
        {isAI && message.suggested_answer && (
          <SuggestedAnswerButton
            suggestion={
              typeof message.suggested_answer === "string"
                ? message.suggested_answer
                : message.suggested_answer || ""
            }
            onPlayAudio={onPlayAudio}
            playingMessageId={playingMessageId}
            messageId={`${message.message_id}-suggestion`}
          />
        )}
      </div>

      {tooltipConfig.visible &&
        tooltipConfig.selectedText &&
        tooltipConfig.triggerElement && (
          <WordTooltip
            selectedText={tooltipConfig.selectedText}
            onClose={closeTooltip}
            triggerElement={tooltipConfig.triggerElement}
          />
        )}
    </div>
  );
}
