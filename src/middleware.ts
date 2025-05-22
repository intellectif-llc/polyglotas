import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export async function middleware(request: NextRequest) {
  noStore(); // Ensure dynamic execution, especially for session checks
  // console.log('[AUTH_DEBUG] [middleware.ts] Running middleware for path:', request.nextUrl.pathname);

  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // console.log('[AUTH_DEBUG] [middleware.ts] Initial getSession result:', session ? `User ID: ${session.user.id}` : 'No session', 'Error:', sessionError?.message);

  // if (sessionError) {
  //   console.error('[AUTH_DEBUG] [middleware.ts] Error getting session in middleware:', sessionError.message);
  //   // Potentially handle this error, e.g., by redirecting to an error page or allowing access
  //   // For now, we'll let it proceed and rely on page-level checks or Supabase client behavior
  // }

  // if (!session && request.nextUrl.pathname.startsWith('/learn')) {
  //   console.log('[AUTH_DEBUG] [middleware.ts] No session, redirecting to signin for /learn path.');
  //   const url = request.nextUrl.clone();
  //   url.pathname = '/auth/signin';
  //   return NextResponse.redirect(url);
  // }

  // Refresh session if expired - important for Server Components
  // await supabase.auth.getUser(); // This also refreshes the session

  // The createServerClient in @supabase/ssr is designed to automatically refresh the session
  // by reading and writing cookies. Calling getSession() or getUser() should be enough.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/.*|.*\\.[A-Za-z0-9]+$).*)",
    // Match /learn explicitly if not covered above and needs protection
    // '/learn/:path*',
  ],
};
