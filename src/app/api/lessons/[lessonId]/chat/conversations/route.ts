import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  validateChatAccess,
  createSubscriptionErrorResponse,
} from "@/lib/subscription/validation";
import { generateInitialGreeting } from "@/lib/gemini/conversation";
import type {
  LessonContext,
  ConversationPrompt,
} from "@/lib/gemini/conversation";

interface StartConversationResponse {
  conversation_id: string;
  initial_ai_message?: {
    message_id: string;
    message_text: string;
    sender_type: "ai";
    created_at: string;
    suggested_answer?: string | null;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    // Validate subscription tier access
    const subscriptionResult = await validateChatAccess();
    if (!subscriptionResult.isValid) {
      return createSubscriptionErrorResponse(subscriptionResult);
    }

    const supabase = await createClient();
    const { lessonId: lessonIdParam } = await params;
    const lessonId = parseInt(lessonIdParam, 10);

    if (isNaN(lessonId)) {
      return new NextResponse(JSON.stringify({ error: "Invalid lesson ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user profile and lesson details
    const [profileResult, lessonResult] = await Promise.all([
      supabase
        .from("student_profiles")
        .select("current_target_language_code, native_language_code")
        .eq("profile_id", subscriptionResult.userId)
        .single(),
      supabase
        .from("lessons")
        .select(
          `
          lesson_id,
          unit_id,
          lesson_translations!inner(lesson_title),
          units!inner(
            unit_translations!inner(unit_title),
            level
          )
        `
        )
        .eq("lesson_id", lessonId)
        .eq("lesson_translations.language_code", "en") // Default to English for lesson context
        .eq("units.unit_translations.language_code", "en")
        .single(),
    ]);

    if (profileResult.error || lessonResult.error) {
      console.error(
        "Error fetching profile or lesson:",
        profileResult.error || lessonResult.error
      );
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch lesson or profile data" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const profile = profileResult.data;
    const lesson = lessonResult.data;
    const targetLanguage = profile.current_target_language_code || "en";

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from("lesson_chat_conversations")
      .select("conversation_id")
      .eq("profile_id", subscriptionResult.userId)
      .eq("lesson_id", lessonId)
      .eq("language_code", targetLanguage)
      .single();

    if (existingConversation) {
      // Return existing conversation
      const response: StartConversationResponse = {
        conversation_id: existingConversation.conversation_id.toString(),
      };
      return NextResponse.json(response);
    }

    // Create new conversation
    const { data: newConversation, error: conversationError } = await supabase
      .from("lesson_chat_conversations")
      .insert({
        profile_id: subscriptionResult.userId,
        lesson_id: lessonId,
        language_code: targetLanguage,
      })
      .select("conversation_id")
      .single();

    if (conversationError || !newConversation) {
      console.error("Error creating conversation:", conversationError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to create conversation" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get conversation prompts for context
    const { data: prompts } = await supabase
      .from("conversation_starters")
      .select(
        `
        id,
        conversation_starter_translations!inner(starter_text)
      `
      )
      .eq("lesson_id", lessonId)
      .eq("conversation_starter_translations.language_code", targetLanguage);

    const conversationPrompts: ConversationPrompt[] = (prompts || []).map(
      (prompt: { id: number; conversation_starter_translations: { starter_text: string }[] }) => ({
        id: prompt.id,
        starter_text:
          prompt.conversation_starter_translations[0]?.starter_text || "",
      })
    );

    // Build lesson context for AI
    const lessonContext: LessonContext = {
      lessonTitle:
        lesson.lesson_translations[0]?.lesson_title || `Lesson ${lessonId}`,
      unitTitle:
        lesson.units[0]?.unit_translations[0]?.unit_title ||
        `Unit ${lesson.unit_id}`,
      level: lesson.units[0]?.level || "A1",
      targetLanguage: targetLanguage,
      nativeLanguage: profile.native_language_code || "en",
    };

    try {
      // Generate initial AI greeting
      const greetingRaw = await generateInitialGreeting(
        lessonContext,
        conversationPrompts
      );
      
      // Parse JSON response or fallback to plain text
      let greetingText: string;
      let suggestedAnswer: string | null = null;
      
      try {
        // Extract JSON from response (handle cases where AI adds extra text)
        const jsonMatch = greetingRaw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          greetingText = parsed.response || greetingRaw;
          suggestedAnswer = parsed.suggested_answer || null;
        } else {
          greetingText = greetingRaw;
        }
      } catch {
        greetingText = greetingRaw;
      }

      // Store the initial AI message
      const { data: aiMessage, error: messageError } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: newConversation.conversation_id,
          sender_type: "ai",
          message_order: 1,
          message_text: greetingText,
          message_language_code: targetLanguage,
          suggested_answer: suggestedAnswer,
        })
        .select("message_id, message_text, sender_type, created_at, suggested_answer")
        .single();

      if (messageError || !aiMessage) {
        console.error("Error creating initial AI message:", messageError);
        // Continue without initial message rather than failing
      }

      const response: StartConversationResponse = {
        conversation_id: newConversation.conversation_id.toString(),
        initial_ai_message: aiMessage
          ? {
              message_id: aiMessage.message_id.toString(),
              message_text: aiMessage.message_text,
              sender_type: "ai",
              created_at: aiMessage.created_at,
              suggested_answer: aiMessage.suggested_answer,
            }
          : undefined,
      };

      return NextResponse.json(response);
    } catch (aiError) {
      console.error("Error generating initial AI message:", aiError);

      // Return conversation without initial message
      const response: StartConversationResponse = {
        conversation_id: newConversation.conversation_id.toString(),
      };
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Unhandled error in start conversation endpoint:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
