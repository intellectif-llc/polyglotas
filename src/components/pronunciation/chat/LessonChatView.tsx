"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLessonPhrases } from "@/hooks/pronunciation/usePronunciationData";
import { useSubscriptionTier } from "@/hooks/useSubscriptionTier";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ActivitySwitcher from "../shared/ActivitySwitcher";
import { useAdvancedNavigation } from "@/hooks/useAdvancedNavigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import MessageBubble from "./MessageBubble";
import ImprovedChatInput from "./ImprovedChatInput";
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
  const { data: userProfile } = useUserProfile();

  const {
    messages,
    prompts,
    addressedPromptIds,
    isLoading: isLoadingChat,
    error: chatError,
    sendMessage,
    isSendingMessage,
    playingMessageId,
    loadingAudioId,
    playAudioForMessage,
  } = useChatConversation(lessonId);

  const [inputText, setInputText] = useState("");

  const {
    canNavigateNext: canAdvancedNext,
    canNavigatePrevious: canAdvancedPrevious,
    navigateNext: advancedNext,
    navigatePrevious: advancedPrevious
  } = useAdvancedNavigation({
    unitId,
    lessonId,
    activity: "chat",
    phraseIndex: 0
  });

  const handleNext = async () => {
    if (canAdvancedNext) {
      await advancedNext();
    }
  };

  const handlePrevious = async () => {
    if (canAdvancedPrevious) {
      await advancedPrevious();
    }
  };

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
    console.log('🚀 handleSendMessage called with inputText:', inputText);
    console.log('🚀 Current state:', { inputText: inputText.trim(), isSendingMessage });
    
    if (!inputText.trim() || isSendingMessage) {
      console.log('❌ handleSendMessage blocked - no text or already sending');
      return;
    }

    const messageText = inputText.trim();
    console.log('🚀 Sending message to chat hook:', messageText);
    setInputText("");

    try {
      await sendMessage(messageText);
      console.log('✅ Message sent successfully via chat hook');
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      // Restore input text on error
      setInputText(messageText);
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
        <div className="max-w-6xl mx-auto px-4 py-4">
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
      <div
        className="max-w-6xl mx-auto px-4 py-6 flex-1 flex flex-col"
        style={{ width: "100%", maxWidth: "1152px" }}
      >
        {/* Activity Switcher */}
        <ActivitySwitcher
          unitId={unitId}
          lessonId={lessonId}
          currentActivity="chat"
        />

        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-lg flex-1 flex flex-col min-h-0 border border-gray-100">
          {/* Conversation Starters */}
          {prompts && prompts.length > 0 && (
            <ConversationStarters
              prompts={prompts}
              addressedPromptIds={addressedPromptIds}
            />
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-gradient-to-b from-gray-50 to-white">
            {isLoadingChat ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Ready to practice speaking?</p>
                <p className="text-sm">
                  Use the prompts above or tap the microphone to start a conversation.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={`${message.message_id}-${index}`}
                  message={message}
                  playingMessageId={playingMessageId}
                  loadingAudioId={loadingAudioId}
                  onPlayAudio={playAudioForMessage}
                />
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
          <div className="border-t border-gray-100 bg-gray-50 p-6">
            <ImprovedChatInput
              value={inputText}
              onChange={setInputText}
              onSend={handleSendMessage}
              disabled={isSendingMessage}
              targetLanguage={userProfile?.current_target_language_code || "en"}
              nativeLanguage={userProfile?.native_language_code || "en"}
              lessonLevel={lessonData?.lesson?.level || "A1"}
            />
          </div>
          
          {/* Navigation Area */}
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between sm:items-center">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={!canAdvancedPrevious || isSendingMessage}
                className="flex items-center justify-center sm:justify-start px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] touch-manipulation"
              >
                <ChevronLeft className="h-5 w-5 mr-2 pointer-events-none" />
                <span className="pointer-events-none">Previous</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvancedNext || isSendingMessage}
                className="flex items-center justify-center sm:justify-start px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px] touch-manipulation"
              >
                <span className="pointer-events-none">Next</span>
                <ChevronRight className="h-5 w-5 ml-2 pointer-events-none" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
