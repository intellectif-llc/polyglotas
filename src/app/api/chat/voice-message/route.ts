import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateChatAccess, createSubscriptionErrorResponse } from "@/lib/subscription/validation";
import { transcribeAndRespondWithGemini } from "@/lib/gemini/multimodal";
import type { LessonContext, ConversationPrompt, ConversationMessage } from "@/lib/gemini/conversation";
import { detectAddressedPromptsWithAI } from "@/lib/gemini/conversation";

interface VoiceMessageRequest {
  conversationId: string;
  targetLanguage: string;
  nativeLanguage: string;
  lessonLevel: string;
}

interface VoiceMessageResponse {
  user_message: {
    message_id: string;
    message_text: string;
    sender_type: "user";
    message_order: number;
    created_at: string;
  };
  ai_message: {
    message_id: string;
    message_text: string;
    sender_type: "ai";
    message_order: number;
    created_at: string;
    suggested_answer?: string | null;
  };
  conversation_status: {
    all_prompts_addressed: boolean;
    addressed_prompt_ids: number[];
  };
  transcription_info: {
    transcript: string;
    detectedLanguage: string;
    confidence: number;
    languageSwitch: {
      switched: boolean;
      fromLanguage: string;
      toLanguage: string;
      confidence: number;
    };
    provider: string;
  };
}

/**
 * Efficient voice message endpoint that uses Gemini multimodal for single-request processing
 * This combines audio transcription and AI response generation in one API call
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [Voice Message API] Efficient multimodal endpoint called');
  
  try {
    // Validate subscription tier access
    const subscriptionResult = await validateChatAccess();
    console.log('🚀 [Voice Message API] Subscription validation result:', subscriptionResult.isValid);
    if (!subscriptionResult.isValid) {
      console.log('❌ [Voice Message API] Subscription validation failed');
      return createSubscriptionErrorResponse(subscriptionResult);
    }

    const supabase = await createClient();

    // Parse form data to get audio file and options
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const optionsStr = formData.get("options") as string;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    let options: VoiceMessageRequest;
    try {
      options = JSON.parse(optionsStr || "{}");
      console.log('🚀 [Voice Message API] Request options:', options);
    } catch {
      return NextResponse.json(
        { error: "Invalid options format" },
        { status: 400 }
      );
    }

    const { conversationId, targetLanguage, nativeLanguage, lessonLevel } = options;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const conversationIdNum = parseInt(conversationId, 10);
    if (isNaN(conversationIdNum)) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
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
      .eq("conversation_id", conversationIdNum)
      .eq("profile_id", subscriptionResult.userId)
      .eq("lessons.lesson_translations.language_code", "en")
      .eq("lessons.units.unit_translations.language_code", "en")
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Get conversation history for AI context
    const { data: historyMessages } = await supabase
      .from("conversation_messages")
      .select("sender_type, message_text")
      .eq("conversation_id", conversationIdNum)
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
      (prompt: { id: number; conversation_starter_translations: { starter_text: string }[] }) => ({
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
    const lesson = conversation.lessons[0];
    const lessonContext: LessonContext = {
      lessonTitle:
        lesson?.lesson_translations?.[0]?.lesson_title ||
        `Lesson ${lesson?.lesson_id}`,
      unitTitle:
        lesson?.units?.[0]?.unit_translations?.[0]?.unit_title ||
        `Unit ${lesson?.unit_id}`,
      level: lesson?.units?.[0]?.level || lessonLevel || "A1",
      targetLanguage: targetLanguage || conversation.language_code,
      nativeLanguage: nativeLanguage || "en",
      allowNativeLanguage: true,
      languageSwitchingAllowed: true,
      encourageTargetLanguage: true,
    };

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    console.log('🟡 [Voice Message API] Starting efficient Gemini multimodal processing...');
    console.log('🟡 [Voice Message API] Audio size:', audioBlob.size, 'type:', audioBlob.type);

    // Use efficient single-request multimodal approach
    const multimodalResult = await transcribeAndRespondWithGemini(
      audioBlob,
      conversationHistory,
      lessonContext,
      conversationPrompts
    );

    console.log('✅ [Voice Message API] Multimodal result received:', {
      transcript: multimodalResult.transcript,
      responseLength: multimodalResult.aiResponse.length,
      provider: multimodalResult.provider
    });

    // Get current message count for ordering
    const { count: messageCount } = await supabase
      .from("conversation_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationIdNum);

    const nextMessageOrder = (messageCount || 0) + 1;

    // Store user message (transcribed text)
    const { data: userMessage, error: userMessageError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationIdNum,
        sender_type: "user",
        message_order: nextMessageOrder,
        message_text: multimodalResult.transcript.trim(),
        message_language_code: conversation.language_code,
      })
      .select(
        "message_id, message_text, sender_type, message_order, created_at"
      )
      .single();

    if (userMessageError || !userMessage) {
      console.error("Error storing user message:", userMessageError);
      return NextResponse.json(
        { error: "Failed to store user message" },
        { status: 500 }
      );
    }

    // Store AI message with suggested answer
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from("conversation_messages")
      .insert({
        conversation_id: conversationIdNum,
        sender_type: "ai",
        message_order: nextMessageOrder + 1,
        message_text: multimodalResult.aiResponse,
        message_language_code: conversation.language_code,
        suggested_answer: multimodalResult.suggestedAnswer,
      })
      .select(
        "message_id, message_text, sender_type, message_order, created_at, suggested_answer"
      )
      .single();

    if (aiMessageError || !aiMessage) {
      console.error("Error storing AI message:", aiMessageError);
      return NextResponse.json(
        { error: "Failed to store AI response" },
        { status: 500 }
      );
    }

    // Get previously addressed prompts
    const { data: existingStatuses } = await supabase
      .from("conversation_prompt_status")
      .select("prompt_id")
      .eq("conversation_id", conversationIdNum);
    
    const previouslyAddressedIds = (existingStatuses || []).map(s => s.prompt_id);

    const newlyAddressedIds = await detectAddressedPromptsWithAI(
      multimodalResult.transcript.trim(),
      conversationPrompts,
      previouslyAddressedIds
    );

    // Record newly addressed prompts
    if (newlyAddressedIds.length > 0) {
      const promptStatusInserts = newlyAddressedIds.map(promptId => ({
        conversation_id: conversationIdNum,
        prompt_id: promptId,
        first_addressed_message_id: userMessage.message_id,
        addressed_at: new Date().toISOString(),
      }));

      await supabase
        .from("conversation_prompt_status")
        .insert(promptStatusInserts);

      // Handle streak for first prompt engagement of the day
      const { error: streakError } = await supabase.rpc('process_user_activity', {
        profile_id_param: subscriptionResult.userId,
        lesson_id_param: conversation.lesson_id,
        language_code_param: conversation.language_code,
        activity_type_param: 'chat'
      });
      
      if (streakError) {
        console.error('Error processing chat streak:', streakError);
      }
    }

    // Check if all prompts are now addressed using database records
    const currentAddressedIds = [...previouslyAddressedIds, ...newlyAddressedIds];
    const allPromptsAddressed = currentAddressedIds.length === conversationPrompts.length;

    // Award points and update conversation status if all prompts addressed for first time
    const wasAlreadyCompleted = previouslyAddressedIds.length === conversationPrompts.length;
    
    if (allPromptsAddressed && !wasAlreadyCompleted) {
      // Award points for chat completion
      const { error: completionError } = await supabase.rpc('process_chat_completion', {
        profile_id_param: subscriptionResult.userId,
        lesson_id_param: conversation.lesson_id,
        language_code_param: conversation.language_code
      });
      
      if (completionError) {
        console.error('Error processing chat completion:', completionError);
      }

      // Update conversation status to mark completion
      await supabase
        .from("lesson_chat_conversations")
        .update({
          all_prompts_addressed_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationIdNum);
    } else {
      await supabase
        .from("lesson_chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("conversation_id", conversationIdNum);
    }

    const response: VoiceMessageResponse = {
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
        suggested_answer: aiMessage.suggested_answer,
      },
      conversation_status: {
        all_prompts_addressed: allPromptsAddressed,
        addressed_prompt_ids: currentAddressedIds,
      },
      transcription_info: {
        transcript: multimodalResult.transcript,
        detectedLanguage: multimodalResult.detectedLanguage,
        confidence: multimodalResult.confidence,
        languageSwitch: multimodalResult.languageSwitch,
        provider: multimodalResult.provider,
      },
    };

    console.log('✅ [Voice Message API] Efficient processing complete - single Gemini request used');
    return NextResponse.json(response);

  } catch (error) {
    console.error("Voice message endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}