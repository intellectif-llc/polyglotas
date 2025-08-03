import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

export async function POST() {
  noStore(); // Ensure dynamic execution
  const supabase = await createClient();

  console.log("[AUTH_DEBUG] [auth/signout/route.ts] Attempting to sign out.");

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(
      "[AUTH_DEBUG] [auth/signout/route.ts] Error during sign out:",
      error.message
    );
    return NextResponse.json(
      { error: "Failed to sign out", details: error.message },
      { status: 500 }
    );
  }

  console.log(
    "[AUTH_DEBUG] [auth/signout/route.ts] Sign out successful. Redirecting to home."
  );
  // Redirect to home or login page after sign out
  const redirectUrl = new URL(
    "/",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  );
  return NextResponse.redirect(redirectUrl.toString(), {
    status: 302, // Use 302 for temporary redirect
  });
}
