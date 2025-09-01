import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

// Handle GET requests (direct navigation)
export async function GET() {
  return POST(); // Reuse the same logic
}

export async function POST() {
  noStore(); // Ensure dynamic execution
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { error: "Failed to sign out", details: error.message },
      { status: 500 }
    );
  }

  // Create response with redirect
  const redirectUrl = new URL(
    "/",
    process.env.NEXT_PUBLIC_SITE_URL || "https://polyglotas.com"
  );

  const response = NextResponse.redirect(redirectUrl.toString(), {
    status: 302,
  });

  // Ensure all auth cookies are cleared
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");

  return response;
}
