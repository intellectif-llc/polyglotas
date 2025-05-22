import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request cookies and response cookies
          request.cookies.set({
            name,
            value,
            ...options,
          });
          // Clone the response to set cookies on it
          const res = NextResponse.next({ request }); // Create a new response based on the request to carry over headers
          res.cookies.set({
            name,
            value,
            ...options,
          });
          // It's important to return the response that has the cookies set
          // However, this client is used by supabase.auth.getUser() which doesn't directly return this response.
          // The actual response modification must happen in the main middleware function.
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request cookies and response cookies
          request.cookies.set({
            name,
            value: "", // Set to empty to remove
            ...options,
          });
          const res = NextResponse.next({ request });
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );
}

// This function will be imported into the main middleware.ts file
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = await createServerClient(
    // Use createServerClient directly as per guide
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          // The response object needs to be updated in the main middleware function's scope
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // Refresh session if expired - important to do before accessing Server Components
  // or Route Handlers. This will update the cookies if the session is refreshed.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(
    "[AUTH_DEBUG] [middleware/updateSession] User from getUser():",
    user?.id || "No user"
  );

  // Add route protection logic as per the guide if desired (example shown in guide)
  // For now, just focusing on session refresh.

  return response; // Return the potentially modified response
}
