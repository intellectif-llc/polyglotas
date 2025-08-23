import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface ChatMessage {
  message_id: string;
  message_text: string;
  sender_type: "user" | "ai";
  message_order: number;
  created_at: string;
  related_prompt_id?: number;
}

export interface ChatPrompt {
  id: number;
  starter_text: string;
}

export interface PromptStatus {
  prompt_id: number;
  addressed_at: string;
  first_addressed_message_id: string;
}

interface ConversationData {
  conversation_id: string;
  initial_ai_message?: ChatMessage;
}

interface SendMessageResponse {
  user_message: ChatMessage;
  ai_message: ChatMessage;
  conversation_status: {
    all_prompts_addressed: boolean;
    addressed_prompt_ids: number[];
  };
}

export function useChatConversation(lessonId: string) {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [addressedPromptIds, setAddressedPromptIds] = useState<number[]>([]);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Stop playing audio when component unmounts
  useEffect(() => {
    return () => {
      // This is a simple way to stop audio. A more robust solution
      // might involve managing the Audio object in a ref.
      setPlayingMessageId(null);
    };
  }, []);

  // Fetch conversation prompts
  const { data: prompts, isLoading: isLoadingPrompts } = useQuery<ChatPrompt[]>(
    {
      queryKey: ["chatPrompts", lessonId],
      queryFn: async () => {
        const response = await axios.get(
          `/api/lessons/${lessonId}/chat-prompts`
        );
        return response.data.prompts;
      },
      enabled: !!lessonId,
    }
  );

  // Start or get existing conversation
  const { data: conversation, isLoading: isLoadingConversation } =
    useQuery<ConversationData>({
      queryKey: ["chatConversation", lessonId],
      queryFn: async () => {
        const response = await axios.post(
          `/api/lessons/${lessonId}/chat/conversations`
        );
        return response.data;
      },
      enabled: !!lessonId,
    });

  // Update conversation ID when conversation data is loaded
  useEffect(() => {
    if (conversation?.conversation_id) {
      setConversationId(conversation.conversation_id);
    }
  }, [conversation]);

  // Fetch messages for the conversation
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<
    ChatMessage[]
  >({
    queryKey: ["chatMessages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await axios.get(
        `/api/chat/conversations/${conversationId}/messages`
      );
      return response.data;
    },
    enabled: !!conversationId,
  });

  // Fetch addressed prompts status
  const { data: promptStatuses = [] } = useQuery<PromptStatus[]>({
    queryKey: ["promptStatuses", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await axios.get(
        `/api/chat/conversations/${conversationId}/prompt-status`
      );
      return response.data;
    },
    enabled: !!conversationId,
  });

  // Update addressed prompt IDs when prompt statuses change
  useEffect(() => {
    const ids = promptStatuses.map((status) => status.prompt_id);
    setAddressedPromptIds((prev) => {
      // Only update if the arrays are different
      if (prev.length !== ids.length || !prev.every((id) => ids.includes(id))) {
        return ids;
      }
      return prev;
    });
  }, [promptStatuses]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      if (!conversationId) throw new Error("No conversation ID");

      const response = await axios.post(
        `/api/chat/conversations/${conversationId}/messages`,
        { text_message: messageText }
      );
      return response.data as SendMessageResponse;
    },
    onSuccess: (data) => {
      // Update messages cache with new messages
      queryClient.setQueryData<ChatMessage[]>(
        ["chatMessages", conversationId],
        (oldMessages = []) => [
          ...oldMessages,
          data.user_message,
          data.ai_message,
        ]
      );

      // Update addressed prompt IDs
      if (data.conversation_status.addressed_prompt_ids) {
        setAddressedPromptIds(data.conversation_status.addressed_prompt_ids);
        // Invalidate prompt statuses to refetch
        queryClient.invalidateQueries({
          queryKey: ["promptStatuses", conversationId],
        });
      }

      // Auto-play the AI response
      if (data.ai_message?.message_text) {
        setTimeout(() => {
          playAudioForMessage(
            data.ai_message.message_id,
            data.ai_message.message_text
          );
        }, 300); // Small delay to ensure UI is updated
      }
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  // Function to play audio for a specific message
  const playAudioForMessage = async (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
      // Logic to stop audio if it's already playing could go here
      // For now, we just prevent re-playing
      return;
    }

    setPlayingMessageId(messageId);

    try {
      const response = await fetch("/api/chat/stream-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setPlayingMessageId(null);
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setPlayingMessageId(null);
        };

        await audio.play();
      } else {
        setPlayingMessageId(null); // Clear on error
      }
    } catch (error) {
      console.error("Failed to play AI message:", error);
      setPlayingMessageId(null); // Clear on error
    }
  };

  // Initialize messages with initial AI message if present and auto-play
  useEffect(() => {
    if (conversation?.initial_ai_message && conversationId) {
      queryClient.setQueryData<ChatMessage[]>(
        ["chatMessages", conversationId],
        (oldMessages = []) => {
          // Only add if not already present
          const hasInitialMessage = oldMessages.some(
            (msg) =>
              msg.message_id === conversation.initial_ai_message?.message_id
          );

          if (!hasInitialMessage && conversation.initial_ai_message) {
            // Auto-play the initial AI message
            setTimeout(() => {
              playAudioForMessage(
                conversation.initial_ai_message!.message_id,
                conversation.initial_ai_message!.message_text
              );
            }, 500); // Small delay to ensure UI is ready

            return [conversation.initial_ai_message, ...oldMessages];
          }

          return oldMessages;
        }
      );
    }
  }, [conversation, conversationId, queryClient]);

  return {
    conversation,
    conversationId,
    messages,
    prompts,
    addressedPromptIds,
    isLoading: isLoadingConversation || isLoadingMessages || isLoadingPrompts,
    error: null, // Could be enhanced with proper error handling
    sendMessage: sendMessageMutation.mutateAsync,
    isSendingMessage: sendMessageMutation.isPending,
    playingMessageId,
    playAudioForMessage,
  };
}
