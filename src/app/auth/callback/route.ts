import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(request: NextRequest) {
  noStore(); // Ensure dynamic execution
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  if (error) {
    // Redirect to an error page or show an error message
    return NextResponse.redirect(
      `${siteUrl}/auth/signin?error=OAuth+authentication+failed&error_description=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        return NextResponse.redirect(
          `${siteUrl}/auth/auth-code-error?message=${encodeURIComponent(
            exchangeError.message
          )}&status=${exchangeError.status || "unknown"}`
        );
      }
    } catch (catchError: unknown) {
      const errorMessage =
        catchError instanceof Error ? catchError.message : "Unknown error";
      return NextResponse.redirect(
        `${siteUrl}/auth/auth-code-error?message=Internal Server Error during code exchange: ${encodeURIComponent(
          errorMessage
        )}`
      );
    }

    // Check if there's an invitation token to redeem
    const invitationToken = requestUrl.searchParams.get("invitation_token");

    if (invitationToken) {
      return NextResponse.redirect(
        `${siteUrl}/api/invite/redeem?token=${invitationToken}`
      );
    }

    // On successful authentication, redirect to the learn page or dashboard
    // The user session is now set by Supabase
    return NextResponse.redirect(`${siteUrl}/learn`);
  }

  // Fallback redirect if no code or error
  return NextResponse.redirect(
    `${siteUrl}/auth/auth-code-error?message=Authorization code not found.`
  );
}
