import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  validateChatAccess,
  createSubscriptionErrorResponse,
} from "@/lib/subscription/validation";

export interface PromptStatus {
  prompt_id: number;
  addressed_at: string;
  first_addressed_message_id: string;
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

    // Fetch prompt statuses for the conversation
    const { data: promptStatuses, error: statusError } = await supabase
      .from("conversation_prompt_status")
      .select("prompt_id, addressed_at, first_addressed_message_id")
      .eq("conversation_id", conversationId)
      .order("addressed_at", { ascending: true });

    if (statusError) {
      console.error("Error fetching prompt statuses:", statusError);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch prompt statuses" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Transform to match expected format
    const statuses: PromptStatus[] = (promptStatuses || []).map((status) => ({
      prompt_id: status.prompt_id,
      addressed_at: status.addressed_at,
      first_addressed_message_id: status.first_addressed_message_id?.toString() || "",
    }));

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Unhandled error in get prompt statuses endpoint:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}