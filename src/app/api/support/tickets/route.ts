import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { CreateTicketData } from "@/types/support";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isStaffMember = profile?.role === 'admin' || profile?.role === 'support';

    let query = supabase
      .from("support_tickets")
      .select(`
        *,
        assigned_to:profiles!support_tickets_assigned_to_profile_id_fkey(first_name, last_name),
        profile:student_profiles!support_tickets_profile_id_fkey(
          profile_id,
          profiles!student_profiles_profile_id_fkey(first_name, last_name)
        )
      `)
      .order("created_at", { ascending: false });

    // If not staff, only show user's own tickets
    if (!isStaffMember) {
      query = query.eq("profile_id", user.id);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error("Error fetching tickets:", error);
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }

    // Transform the data to flatten the nested profile structure
    const transformedTickets = tickets?.map(ticket => ({
      ...ticket,
      profile: ticket.profile?.profiles
    }));

    return NextResponse.json({ tickets: transformedTickets });
  } catch (error) {
    console.error("Error in GET /api/support/tickets:", error);
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

    const body: CreateTicketData = await request.json();
    const { reason, subject, message } = body;

    if (!reason || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        profile_id: user.id,
        reason,
        subject,
        status: 'open'
      })
      .select()
      .single();

    if (ticketError) {
      console.error("Error creating ticket:", ticketError);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    // Create the initial message
    const { error: messageError } = await supabase
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticket.ticket_id,
        sender_profile_id: user.id,
        message_text: message
      });

    if (messageError) {
      console.error("Error creating initial message:", messageError);
      return NextResponse.json({ error: "Failed to create initial message" }, { status: 500 });
    }

    // Update ticket's last_message_at
    await supabase
      .from("support_tickets")
      .update({ last_message_at: new Date().toISOString() })
      .eq("ticket_id", ticket.ticket_id);

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/support/tickets:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}