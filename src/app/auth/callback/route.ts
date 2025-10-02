import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { getInvitationToken } from "@/lib/invitation/server";

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
      `${siteUrl}/auth?error=OAuth+authentication+failed&error_description=${encodeURIComponent(
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
          `${siteUrl}/auth?error=${encodeURIComponent(
            exchangeError.message
          )}`
        );
      }
    } catch (catchError: unknown) {
      const errorMessage =
        catchError instanceof Error ? catchError.message : "Unknown error";
      return NextResponse.redirect(
        `${siteUrl}/auth?error=Internal Server Error during code exchange: ${encodeURIComponent(
          errorMessage
        )}`
      );
    }

    // Check for invitation token from URL params or cookies
    let invitationToken = requestUrl.searchParams.get("invitation_token");
    
    // If not in URL, check cookies (server-side)
    if (!invitationToken) {
      invitationToken = await getInvitationToken();
    }
    
    console.log('[AUTH_CALLBACK] Checking for invitation token', { 
      hasToken: !!invitationToken, 
      token: invitationToken,
      source: requestUrl.searchParams.get("invitation_token") ? 'url' : 'cookie',
      fullUrl: requestUrl.toString()
    });

    if (invitationToken) {
      console.log('[AUTH_CALLBACK] Redirecting to invitation redemption', { token: invitationToken });
      return NextResponse.redirect(
        `${siteUrl}/api/invite/redeem?token=${invitationToken}`
      );
    }

    console.log('[AUTH_CALLBACK] No invitation token found, proceeding to learn page');

    // On successful authentication, redirect to the learn page or dashboard
    // The user session is now set by Supabase
    return NextResponse.redirect(`${siteUrl}/learn`);
  }

  // Fallback redirect if no code or error
  return NextResponse.redirect(
    `${siteUrl}/auth?error=Authorization code not found.`
  );
}
