import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { CreateMessageData } from "@/types/support";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticket_id");

    if (!ticketId) {
      return NextResponse.json({ error: "ticket_id is required" }, { status: 400 });
    }

    // Check if user has access to this ticket
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("profile_id")
      .eq("ticket_id", ticketId)
      .single();

    // Get user role to check if they're staff
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isStaffMember = profile?.role === 'admin' || profile?.role === 'support';
    const isTicketOwner = ticket?.profile_id === user.id;

    if (!isStaffMember && !isTicketOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { data: messages, error } = await supabase
      .from("support_ticket_messages")
      .select(`
        *,
        sender:profiles!support_ticket_messages_sender_profile_id_fkey(first_name, last_name, role)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error in GET /api/support/tickets/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateMessageData = await request.json();
    const { ticket_id, message_text } = body;

    if (!ticket_id || !message_text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has access to this ticket
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("profile_id, status")
      .eq("ticket_id", ticket_id)
      .single();

    // Get user role to check if they're staff
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isStaffMember = profile?.role === 'admin' || profile?.role === 'support';
    const isTicketOwner = ticket?.profile_id === user.id;

    if (!isStaffMember && !isTicketOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Don't allow messages on closed tickets unless user is staff
    if (ticket?.status === 'closed' && !isStaffMember) {
      return NextResponse.json({ error: "Cannot add messages to closed tickets" }, { status: 400 });
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from("support_ticket_messages")
      .insert({
        ticket_id,
        sender_profile_id: user.id,
        message_text
      })
      .select(`
        *,
        sender:profiles!support_ticket_messages_sender_profile_id_fkey(first_name, last_name, role)
      `)
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
    }

    // Update ticket's last_message_at and potentially status
    const updateData: {
      last_message_at: string;
      updated_at: string;
      status?: string;
    } = { 
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // If ticket was resolved and customer responds, reopen it
    if (ticket?.status === 'resolved' && isTicketOwner) {
      updateData.status = 'open';
    }

    await supabase
      .from("support_tickets")
      .update(updateData)
      .eq("ticket_id", ticket_id);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/support/tickets/messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}