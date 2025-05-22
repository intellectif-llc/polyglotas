import { createClient as createServerClient } from "@/lib/supabase/server";
import HomeClient from "./home-client"; // Import the new client component
import type { User } from "@supabase/supabase-js";

// This is now a Server Component by default.
// It fetches initial user data on the server.
export default async function Home() {
  const supabaseServer = await createServerClient();
  const {
    data: { user: initialUser },
  } = await supabaseServer.auth.getUser();

  // Pass the initialUser to the client component
  // Adding a key that changes with auth state will force a full remount of HomeClient,
  // resetting its internal state upon login/logout.
  const key = initialUser ? initialUser.id : "logged-out";

  return <HomeClient key={key} initialUser={initialUser as User | null} />;
}
