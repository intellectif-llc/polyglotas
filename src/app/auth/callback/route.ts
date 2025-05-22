import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function GET(request: NextRequest) {
  noStore(); // Opt out of static rendering/caching

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    console.error(`OAuth Error: ${error} - ${errorDescription}`);
    // Redirect to an error page or show an error message
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/signin?error=OAuth+authentication+failed`
    );
  }

  if (code) {
    const supabase = createClient();
    try {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error(
          "Error exchanging code for session:",
          exchangeError.message
        );
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/signin?error=Could+not+authenticate+with+provider`
        );
      }
    } catch (catchError: any) {
      console.error(
        "Catch Error exchanging code for session:",
        catchError.message
      );
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=Could+not+authenticate+with+provider`
      );
    }

    // On successful authentication, redirect to the learn page or dashboard
    // The user session is now set by Supabase
    return NextResponse.redirect(`${requestUrl.origin}/learn`);
  }

  // Fallback redirect if no code or error
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/signin?error=Invalid+callback+state`
  );
}
