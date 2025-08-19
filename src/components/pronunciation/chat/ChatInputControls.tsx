"use client";

import React from "react";
import { Send } from "lucide-react";

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSend();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={onKeyPress}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            min-h-[40px] max-h-32
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

      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={`
          p-2 rounded-lg transition-colors min-w-[40px] h-[40px]
          flex items-center justify-center
          ${
            disabled || !value.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          }
        `}
        title="Send message"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
