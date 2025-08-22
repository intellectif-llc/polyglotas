import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  validateChatAccess,
  createSubscriptionErrorResponse,
} from "@/lib/subscription/validation";
import {
  generateAIResponse,
  checkPromptsCompletion,
  detectAddressedPromptsWithAI,
  getAddressedPrompts,
} from "@/lib/gemini/conversation";
import type {
  LessonContext,
  ConversationPrompt,
  ConversationMessage,
} from "@/lib/gemini/conversation";

export interface ChatMessage {
  message_id: string;
  message_text: string;
  sender_type: "user" | "ai";
  message_order: number;
  created_at: string;
  related_prompt_id?: number;
}

interface SendMessageRequest {
  text_message: string;
}

interface SendMessageResponse {
  user_message: ChatMessage;
  ai_message: ChatMessage;
  conversation_status: {
    all_prompts_addressed: boolean;
    addressed_prompt_ids: number[];
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Validate subscription tier access
    const subscriptionResult = await validateChatAccess();
    if (!subscriptionResult.isValid) {
      return createSubscriptionErrorResponse(subscriptionResult);
    }

    const supabase = await createClient();
    const { conversationId: conversationIdParam } = await params;
    const conversationId = parseInt(conversationIdParam, 10);

    if (isNaN(conversationId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid conversation ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the conversation belongs to the authenticated user
    const { data: conversation, error: conversationError } = await supabase
      .from("lesson_chat_conversations")
      .select("conversation_id, profile_id")
      .eq("conversation_id", conversationId)
      .eq("profile_id", subscriptionResult.userId)
      .single();

    if (conversationError || !conversation) {
      return new NextResponse(
        JSON.stringify({ error: "Conversation not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get URL parameters for pagination
    const url = new URL(request.url);
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Fetch messages for the conversation
    const { data: messages, error: messagesError } = await supabase
      .from("conversation_messages")
      .select(
        `
        message_id,
        message_text,
        sender_type,
        message_order,
        created_at,
        related_prompt_id
      `
      )
      .eq("conversation_id", conversationId)
      .order("message_order", { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch messages" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Transform messages to match expected format
    const chatMessages: ChatMessage[] = (messages || []).map((msg) => ({
      message_id: msg.message_id.toString(),
      message_text: msg.message_text,
      sender_type: msg.sender_type as "user" | "ai",
      message_order: msg.message_order,
      created_at: msg.created_at,
      related_prompt_id: msg.related_prompt_id || undefined,
    }));

    return NextResponse.json(chatMessages);
  } catch (error) {
    console.error("Unhandled error in get messages endpoint:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Validate subscription tier access
    const subscriptionResult = await validateChatAccess();
    if (!subscriptionResult.isValid) {
      return createSubscriptionErrorResponse(subscriptionResult);
    }

    const supabase = await createClient();
    const { conversationId: conversationIdParam } = await params;
    const conversationId = parseInt(conversationIdParam, 10);

    if (isNaN(conversationId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid conversation ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let requestBody: SendMessageRequest;
    try {
      requestBody = await request.json();
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { text_message } = requestBody;

    if (!text_message || text_message.trim().length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Message text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the conversation belongs to the authenticated user and get lesson info
    const { data: conversation, error: conversationError } = await supabase
      .from("lesson_chat_conversations")
      .select(
        `
        conversation_id,
        profile_id,
        lesson_id,
        language_code,
        lessons!inner(
          lesson_id,
          unit_id,
          lesson_translations!inner(lesson_title),
          units!inner(
            unit_translations!inner(unit_title),
            level
          )
        )
      `
      )
      .eq("conversation_id", conversationId)
      .eq("profile_id", subscriptionResult.userId)
      .eq("lessons.lesson_translations.language_code", "en")
      .eq("lessons.units.unit_translations.language_code", "en")
      .single();

    if (conversationError || !conversation) {
      return new NextResponse(
        JSON.stringify({ error: "Conversation not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user profile for language context
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("native_language_code")
      .eq("profile_id", subscriptionResult.userId)
      .single();

    // Get current message count for ordering
    const { count: messageCount } = await supabase
      .from("conversation_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    const nextMessageOrder = (messageCount || 0) + 1;

    // Store user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "user",
        message_order: nextMessageOrder,
        message_text: text_message.trim(),
        message_language_code: conversation.language_code,
      })
      .select(
        "message_id, message_text, sender_type, message_order, created_at"
      )
      .single();

    if (userMessageError || !userMessage) {
      console.error("Error storing user message:", userMessageError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to store user message" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      // Get conversation history for AI context
      const { data: historyMessages } = await supabase
        .from("conversation_messages")
        .select("sender_type, message_text")
        .eq("conversation_id", conversationId)
        .lt("message_order", nextMessageOrder)
        .order("message_order", { ascending: true });

      // Get conversation prompts for context
      const { data: prompts } = await supabase
        .from("conversation_starters")
        .select(
          `
          id,
          conversation_starter_translations!inner(starter_text)
        `
        )
        .eq("lesson_id", conversation.lesson_id)
        .eq(
          "conversation_starter_translations.language_code",
          conversation.language_code
        );

      const conversationPrompts: ConversationPrompt[] = (prompts || []).map(
        (prompt: any) => ({
          id: prompt.id,
          starter_text:
            prompt.conversation_starter_translations[0]?.starter_text || "",
        })
      );

      // Build conversation history for AI
      const conversationHistory: ConversationMessage[] = (
        historyMessages || []
      ).map((msg) => ({
        role: msg.sender_type === "user" ? "user" : "model",
        parts: msg.message_text,
      }));

      // Build lesson context
      const lesson = conversation.lessons;
      const lessonContext: LessonContext = {
        lessonTitle:
          lesson.lesson_translations[0]?.lesson_title ||
          `Lesson ${lesson.lesson_id}`,
        unitTitle:
          lesson.units.unit_translations[0]?.unit_title ||
          `Unit ${lesson.unit_id}`,
        level: lesson.units.level || "A1",
        targetLanguage: conversation.language_code,
        nativeLanguage: profile?.native_language_code || "en",
      };

      // Generate AI response
      const aiResponseText = await generateAIResponse(
        text_message.trim(),
        conversationHistory,
        lessonContext,
        conversationPrompts
      );

      // Store AI message
      const { data: aiMessage, error: aiMessageError } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          sender_type: "ai",
          message_order: nextMessageOrder + 1,
          message_text: aiResponseText,
          message_language_code: conversation.language_code,
        })
        .select(
          "message_id, message_text, sender_type, message_order, created_at"
        )
        .single();

      if (aiMessageError || !aiMessage) {
        console.error("Error storing AI message:", aiMessageError);
        return new NextResponse(
          JSON.stringify({ error: "Failed to generate AI response" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Get previously addressed prompts
      const { data: existingStatuses } = await supabase
        .from("conversation_prompt_status")
        .select("prompt_id")
        .eq("conversation_id", conversationId);
      
      const previouslyAddressedIds = (existingStatuses || []).map(s => s.prompt_id);

      // Check for newly addressed prompts
      const allConversationHistory = [
        ...conversationHistory,
        { role: "user" as const, parts: text_message.trim() },
        { role: "model" as const, parts: aiResponseText },
      ];

      const newlyAddressedIds = await detectAddressedPromptsWithAI(
        text_message.trim(),
        conversationPrompts,
        previouslyAddressedIds
      );

      // Record newly addressed prompts
      if (newlyAddressedIds.length > 0) {
        const promptStatusInserts = newlyAddressedIds.map(promptId => ({
          conversation_id: conversationId,
          prompt_id: promptId,
          first_addressed_message_id: userMessage.message_id,
          addressed_at: new Date().toISOString(),
        }));

        await supabase
          .from("conversation_prompt_status")
          .insert(promptStatusInserts);
      }

      // Check if all prompts are now addressed using database records
      const currentAddressedIds = [...previouslyAddressedIds, ...newlyAddressedIds];
      const allPromptsAddressed = currentAddressedIds.length === conversationPrompts.length;

      // Award points and update conversation status if all prompts addressed for first time
      const wasAlreadyCompleted = previouslyAddressedIds.length === conversationPrompts.length;
      
      if (allPromptsAddressed && !wasAlreadyCompleted) {
        // FIRST: Update conversation status to mark completion
        await supabase
          .from("lesson_chat_conversations")
          .update({
            all_prompts_addressed_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
          })
          .eq("conversation_id", conversationId);

        // THEN: Award points using dedicated chat completion function
        await supabase.rpc('process_chat_completion', {
          profile_id_param: subscriptionResult.userId,
          lesson_id_param: conversation.lesson_id,
          language_code_param: conversation.language_code
        });
      } else {
        await supabase
          .from("lesson_chat_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("conversation_id", conversationId);
      }

      const response: SendMessageResponse = {
        user_message: {
          message_id: userMessage.message_id.toString(),
          message_text: userMessage.message_text,
          sender_type: "user",
          message_order: userMessage.message_order,
          created_at: userMessage.created_at,
        },
        ai_message: {
          message_id: aiMessage.message_id.toString(),
          message_text: aiMessage.message_text,
          sender_type: "ai",
          message_order: aiMessage.message_order,
          created_at: aiMessage.created_at,
        },
        conversation_status: {
          all_prompts_addressed: allPromptsAddressed,
          addressed_prompt_ids: currentAddressedIds,
        },
      };

      return NextResponse.json(response);
    } catch (aiError) {
      console.error("Error generating AI response:", aiError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to generate AI response" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unhandled error in send message endpoint:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
