"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { ChatPrompt } from "@/hooks/chat/useChatConversation";

interface ConversationStartersProps {
  prompts: ChatPrompt[];
  onPromptClick: (promptText: string) => void;
}

export default function ConversationStarters({
  prompts,
  onPromptClick,
}: ConversationStartersProps) {
  if (!prompts || prompts.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={16} className="text-blue-600" />
        <h3 className="text-sm font-medium text-gray-700">
          Conversation Starters
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onPromptClick(prompt.starter_text)}
            className={`
              px-3 py-2 text-sm rounded-full border border-blue-200 
              text-blue-700 bg-blue-50 hover:bg-blue-100 
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            `}
          >
            {prompt.starter_text}
          </button>
        ))}
      </div>
    </div>
  );
}
