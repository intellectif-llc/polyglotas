"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLessonPhrases } from "@/hooks/pronunciation/usePronunciationData";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { ArrowLeft } from "lucide-react";
import ActivitySwitcher from "../shared/ActivitySwitcher";
import MessageBubble from "./MessageBubble";
import ChatInputControls from "./ChatInputControls";
import ConversationStarters from "./ConversationStarters";
import { useChatConversation } from "@/hooks/chat/useChatConversation";

interface LessonChatViewProps {
  unitId: string;
  lessonId: string;
}

export default function LessonChatView({
  unitId,
  lessonId,
}: LessonChatViewProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: lessonData,
    isLoading: isLoadingLesson,
    error: lessonError,
  } = useLessonPhrases(lessonId);
  const { permissions, isLoading: isLoadingSubscription } =
    useSubscriptionTier();

  const {
    conversation,
    messages,
    prompts,
    addressedPromptIds,
    isLoading: isLoadingChat,
    error: chatError,
    sendMessage,
    isSendingMessage,
  } = useChatConversation(lessonId);

  const [inputText, setInputText] = useState("");

  // Redirect if user doesn't have chat access
  useEffect(() => {
    if (!isLoadingSubscription && !permissions.canAccessChat) {
      router.push(`/learn/${unitId}/lesson/${lessonId}/dictation`);
    }
  }, [
    isLoadingSubscription,
    permissions.canAccessChat,
    router,
    unitId,
    lessonId,
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSendingMessage) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      await sendMessage(messageText);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Restore input text on error
      setInputText(messageText);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show loading state
  if (isLoadingLesson || isLoadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (lessonError || chatError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading lesson or chat</p>
          <button
            onClick={() => router.push(`/learn/${unitId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Lessons
          </button>
        </div>
      </div>
    );
  }

  // Redirect if no access (shouldn't reach here due to useEffect above)
  if (!permissions.canAccessChat) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push(`/learn/${unitId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-3 min-h-[44px] touch-manipulation"
          >
            <ArrowLeft size={20} className="mr-2 pointer-events-none" />
            <span className="pointer-events-none">Back to Lessons</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {lessonData?.lesson?.lesson_title || "Lesson"} - Chat
          </h1>
          <div className="text-sm text-gray-500 mt-1">
            Unit {lessonData?.lesson?.unit_title || unitId} •{" "}
            {lessonData?.lesson?.level || ""}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 flex-1 flex flex-col">
        {/* Activity Switcher */}
        <ActivitySwitcher
          unitId={unitId}
          lessonId={lessonId}
          currentActivity="chat"
        />

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-md flex-1 flex flex-col min-h-0">
          {/* Conversation Starters */}
          {prompts && prompts.length > 0 && (
            <ConversationStarters
              prompts={prompts}
              addressedPromptIds={addressedPromptIds}
            />
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {isLoadingChat ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>
                  Start a conversation! Use the prompts above or type your own
                  message.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={`${message.message_id}-${index}`} message={message} />
              ))
            )}

            {/* Typing indicator */}
            {isSendingMessage && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <ChatInputControls
              value={inputText}
              onChange={setInputText}
              onSend={handleSendMessage}
              onKeyPress={handleKeyPress}
              disabled={isSendingMessage}
              placeholder="Type your message..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
