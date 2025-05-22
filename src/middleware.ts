import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.delete({ name, ...options });
        },
      },
    }
  );

  // Refresh session if expired - important for Server Components
  // await supabase.auth.getUser(); // This line is often the cause of issues if not handled carefully with middleware response

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Basic route protection example (customize as needed based on your requirements.md)
  const { pathname } = request.nextUrl;

  // Allow access to auth routes, API routes, and static assets
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") || // Next.js internal assets
    pathname.startsWith("/static") || // Your static assets if any in public/static
    pathname.includes(".") // Generally allows files with extensions (images, css, js)
  ) {
    return response;
  }

  // If no session and trying to access a protected route (e.g., /learn), redirect to signin
  if (!session && pathname.startsWith("/learn")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    url.searchParams.set("next", pathname); // Optional: redirect back after login
    return NextResponse.redirect(url);
  }

  // If there IS a session and the user tries to go to /auth/signin or /auth/signup, redirect to /learn
  if (
    session &&
    (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/learn";
    return NextResponse.redirect(url);
  }

  return response;
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
