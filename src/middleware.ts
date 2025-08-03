import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware"; // Adjusted import path
// We no longer need unstable_noStore or createClient from server.ts here

export async function middleware(request: NextRequest) {
  // console.log('[AUTH_DEBUG] [middleware.ts] Running middleware for path:', request.nextUrl.pathname);
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth-specific routes like login, callback, signout)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/).*)",
    "/api/:path*",
  ],
};
