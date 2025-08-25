import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  validateChatAccess,
  createSubscriptionErrorResponse,
} from "@/lib/subscription/validation";

interface ChatPrompt {
  id: number;
  starter_text: string;
}

interface ChatPromptsResponse {
  prompts: ChatPrompt[];
}

export async function GET(
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

    // Get user's target language
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("current_target_language_code")
      .eq("profile_id", subscriptionResult.userId)
      .single();

    const targetLanguage = profile?.current_target_language_code || "en";

    // Get conversation starters for the lesson with translations
    const { data: starters, error: startersError } = await supabase
      .from("conversation_starters")
      .select(
        `
        id,
        conversation_starter_translations!inner(
          starter_text
        )
      `
      )
      .eq("lesson_id", lessonId)
      .eq("conversation_starter_translations.language_code", targetLanguage);

    if (startersError) {
      console.error("Error fetching conversation starters:", startersError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch conversation prompts" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Transform the data to match the expected format
    const prompts: ChatPrompt[] = (starters || []).map((starter: { id: number; conversation_starter_translations: { starter_text: string }[] }) => ({
      id: starter.id,
      starter_text:
        starter.conversation_starter_translations[0]?.starter_text || "",
    }));

    const response: ChatPromptsResponse = {
      prompts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unhandled error in chat prompts endpoint:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
