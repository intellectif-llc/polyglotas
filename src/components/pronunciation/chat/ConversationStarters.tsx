"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, Check } from "lucide-react";
import { ChatPrompt } from "@/hooks/chat/useChatConversation";

interface ConversationStartersProps {
  prompts: ChatPrompt[];
  addressedPromptIds: number[];
}

export default function ConversationStarters({
  prompts,
  addressedPromptIds,
}: ConversationStartersProps) {
  const [hoveredPrompt, setHoveredPrompt] = useState<number | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setSelectedPrompt(null);
    if (selectedPrompt !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedPrompt]);

  if (!prompts || prompts.length === 0) {
    return null;
  }

  const handlePromptClick = (promptId: number) => {
    setSelectedPrompt(selectedPrompt === promptId ? null : promptId);
  };

  const getPromptById = (id: number) => prompts.find(p => p.id === id);

  return (
    <div className="border-b border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle size={16} className="text-blue-600" />
        <h3 className="text-sm font-medium text-gray-700">
          Conversation Progress
        </h3>
        <span className="text-xs text-gray-500">
          ({addressedPromptIds.length}/{prompts.length})
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {prompts.map((prompt, index) => {
          const isAddressed = addressedPromptIds.includes(prompt.id);
          const isHovered = hoveredPrompt === prompt.id;
          const isSelected = selectedPrompt === prompt.id;
          
          return (
            <div key={prompt.id} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePromptClick(prompt.id);
                }}
                onMouseEnter={() => setHoveredPrompt(prompt.id)}
                onMouseLeave={() => setHoveredPrompt(null)}
                className={`
                  w-8 h-8 rounded-full border-2 transition-all duration-200
                  flex items-center justify-center text-xs font-medium
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  ${isAddressed 
                    ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-blue-50 hover:border-blue-300'
                  }
                `}
              >
                {isAddressed ? (
                  <Check size={14} />
                ) : (
                  index + 1
                )}
              </button>
              
              {/* Tooltip */}
              {(isHovered || isSelected) && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-4 py-3 w-64 max-w-[90vw] text-center shadow-lg break-words">
                    {prompt.starter_text}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {addressedPromptIds.length === prompts.length && (
        <div className="mt-3 text-sm text-green-600 font-medium">
          🎉 All conversation topics completed!
        </div>
      )}
    </div>
  );
}
