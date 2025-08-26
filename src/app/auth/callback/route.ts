import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(request: NextRequest) {
  noStore(); // Ensure dynamic execution
  console.log(
    "[AUTH_DEBUG] [/auth/callback/route.ts] Received GET request. URL:",
    request.url
  );

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  console.log(
    "[AUTH_DEBUG] [auth/callback/route.ts] Received callback with code:",
    code ? "present" : "missing"
  );

  if (error) {
    console.error(
      `[AUTH_DEBUG] [/auth/callback/route.ts] OAuth Error: ${error} - ${errorDescription}`
    );
    // Redirect to an error page or show an error message
    return NextResponse.redirect(
      `${siteUrl}/auth/signin?error=OAuth+authentication+failed&error_description=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  if (code) {
    console.log(
      "[AUTH_DEBUG] [/auth/callback/route.ts] Code received. Creating Supabase client."
    );
    const supabase = await createClient();

    let sessionData = null; // Declare sessionData here
    try {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error(
          "[AUTH_DEBUG] [/auth/callback/route.ts] Error exchanging code for session:",
          exchangeError.message
        );
        // Log more details if available
        if (exchangeError.cause) console.error("Cause:", exchangeError.cause);
        return NextResponse.redirect(
          `${siteUrl}/auth/auth-code-error?message=${encodeURIComponent(
            exchangeError.message
          )}&status=${exchangeError.status || "unknown"}`
        );
      }
      sessionData = data.session; // Assign here
      console.log(
        "[AUTH_DEBUG] [/auth/callback/route.ts] Successfully exchanged code for session. Session User:",
        sessionData?.user?.id
      );
    } catch (catchError: unknown) {
      const errorMessage =
        catchError instanceof Error ? catchError.message : "Unknown error";
      console.error(
        "[AUTH_DEBUG] [/auth/callback/route.ts] Catch block error during code exchange:",
        errorMessage
      );
      return NextResponse.redirect(
        `${siteUrl}/auth/auth-code-error?message=Internal Server Error during code exchange: ${encodeURIComponent(
          errorMessage
        )}`
      );
    }

    // On successful authentication, redirect to the learn page or dashboard
    // The user session is now set by Supabase
    console.log(
      "[AUTH_DEBUG] [/auth/callback/route.ts] Redirecting to /learn. Session User ID should be set:",
      sessionData?.user?.id
    );
    return NextResponse.redirect(`${siteUrl}/learn`);
  }

  // Fallback redirect if no code or error
  console.warn(
    "[AUTH_DEBUG] [/auth/callback/route.ts] No code found in callback URL. Redirecting to signin with error."
  );
  return NextResponse.redirect(
    `${siteUrl}/auth/auth-code-error?message=Authorization code not found.`
  );
}
