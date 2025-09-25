import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = id;
    const body = await request.json();
    const { status, assigned_to_profile_id } = body;

    // Get user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isStaff = profile?.role === 'admin' || profile?.role === 'support';

    if (!isStaff) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prepare update data
    const updateData: {
      updated_at: string;
      status?: string;
      resolved_at?: string;
      assigned_to_profile_id?: string | null;
    } = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }
    }

    // Only admins can assign tickets
    if (assigned_to_profile_id !== undefined && isAdmin) {
      if (assigned_to_profile_id === 'self') {
        updateData.assigned_to_profile_id = user.id;
      } else {
        updateData.assigned_to_profile_id = assigned_to_profile_id;
      }
    }

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .update(updateData)
      .eq("ticket_id", ticketId)
      .select(`
        *,
        assigned_to:profiles!support_tickets_assigned_to_profile_id_fkey(first_name, last_name),
        profile:student_profiles!support_tickets_profile_id_fkey(
          profile_id,
          profiles!student_profiles_profile_id_fkey(first_name, last_name)
        )
      `)
      .single();

    if (error) {
      console.error("Error updating ticket:", error);
      return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }

    // Transform the data to flatten the nested profile structure
    const transformedTicket = {
      ...ticket,
      profile: ticket.profile?.profiles
    };

    return NextResponse.json({ ticket: transformedTicket });
  } catch (error) {
    console.error("Error in PATCH /api/support/tickets/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}