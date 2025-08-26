import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's invoice history
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(
        `
        stripe_invoice_id,
        status,
        amount_due,
        amount_paid,
        currency,
        due_date,
        paid_at,
        invoice_pdf_url,
        hosted_invoice_url,
        billing_reason,
        issued_at,
        created_at
      `
      )
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching invoices:", error);
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    return NextResponse.json(invoices || []);
  } catch (error) {
    console.error("Error in invoices API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
