import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// For Server Components & Route Handlers
export function createClient() {
  // Assuming cookieStore might be Promise<ReadonlyRequestCookies> due to linter behavior
  const cookieStorePromise = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const store = await cookieStorePromise;
          return store.get(name)?.value;
        },
        set: async (name: string, value: string, options: CookieOptions) => {
          const store = await cookieStorePromise;
          try {
            // NextResponse in middleware handles actual cookie setting on response.
            // For server actions/route handlers, this attempts to set directly.
            store.set({ name, value, ...options });
          } catch (error) {
            // Fail silently if not in a context where cookies can be set (e.g. RSC render)
            // console.warn(`Set cookie error for ${name}: ${error}`);
          }
        },
        remove: async (name: string, options: CookieOptions) => {
          const store = await cookieStorePromise;
          try {
            store.set({ name, value: "", ...options }); // Removing by setting empty value
          } catch (error) {
            // Fail silently
            // console.warn(`Remove cookie error for ${name}: ${error}`);
          }
        },
      },
    }
  );
}

// This single client creator should work for both Server Components and Route Handlers as per @supabase/ssr guidance.
// The middleware will use a slightly different setup due to how it handles request/response.
