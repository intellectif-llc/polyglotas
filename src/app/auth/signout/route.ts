import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error.message);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }

  // Redirect to home or sign-in page after sign out
  // Important: Use an absolute URL for redirection in API routes if not using NextResponse.redirect
  // However, for client-side initiated sign-out, the client will handle the redirect after calling this endpoint.
  // So, just returning a success status is often enough.
  return NextResponse.json({ success: true }, { status: 200 });

  // If you want to force a redirect from the server-side upon POST:
  // return NextResponse.redirect(`${requestUrl.origin}/auth/signin`, {
  //   status: 302, // Or 303 for POST redirect
  // });
}

// Optionally, a GET handler if you want to allow sign-out via GET requests (less common for actions)
// export async function GET(request: NextRequest) {
//   const requestUrl = new URL(request.url);
//   const supabase = createSupabaseRouteHandlerClient();
//   await supabase.auth.signOut();
//   return NextResponse.redirect(`${requestUrl.origin}/auth/signin`, {
//     status: 302,
//   });
// }
