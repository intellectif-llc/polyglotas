"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient as createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface HomeClientProps {
  initialUser: User | null;
}

export default function HomeClient({ initialUser }: HomeClientProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabaseClient = createClient();

  useEffect(() => {
    console.log(
      `[AUTH_DEBUG] [home-client.tsx] useEffect mounted/updated. Initial server user: ${initialUser?.id}, Current client user state before this effect: ${user?.id}`
    );

    setUser(initialUser);
    setLoading(false);
    console.log(
      `[AUTH_DEBUG] [home-client.tsx] useEffect: initialUser processed. User state now: ${initialUser?.id}, loading set to false.`
    );

    const checkInitialClientSession = async () => {
      try {
        const {
          data: { session: clientSession },
          error: clientSessionError,
        } = await supabaseClient.auth.getSession();
        console.log(
          "[AUTH_DEBUG] [home-client.tsx] useEffect - Initial ASYNC supabaseClient.auth.getSession():",
          clientSession?.user?.id || "No client session user",
          "Error:",
          clientSessionError?.message
        );
        if (!initialUser && clientSession?.user) {
          console.warn(
            "[AUTH_DEBUG] [home-client.tsx] Discrepancy: Server initialUser is null, but client SDK getSession found a user. Relying on onAuthStateChange to correct."
          );
        }
      } catch (e: any) {
        console.error(
          "[AUTH_DEBUG] [home-client.tsx] Error in useEffect getSession async:",
          e.message
        );
      }
    };
    checkInitialClientSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(
          `[AUTH_DEBUG] [home-client.tsx] onAuthStateChange Fired! Event: ${event}, Session User from event: ${session?.user?.id}, Current client user state BEFORE this event processing: ${user?.id}`
        );

        const newEventUser = session?.user ?? null;
        setUser(newEventUser);

        if (event === "SIGNED_OUT") {
          console.log(
            "[AUTH_DEBUG] [home-client.tsx] onAuthStateChange: SIGNED_OUT event processed."
          );
        } else if (event === "INITIAL_SESSION") {
          console.log(
            "[AUTH_DEBUG] [home-client.tsx] onAuthStateChange: INITIAL_SESSION event processed."
          );
        } else if (event === "SIGNED_IN") {
          console.log(
            "[AUTH_DEBUG] [home-client.tsx] onAuthStateChange: SIGNED_IN event processed."
          );
        } else {
          console.log(
            `[AUTH_DEBUG] [home-client.tsx] onAuthStateChange: ${event} event processed.`
          );
        }

        setLoading(false);
        console.log(
          `[AUTH_DEBUG] [home-client.tsx] onAuthStateChange Completed. Event: ${event}. User state is now: ${newEventUser?.id}, loading is false.`
        );
      }
    );

    return () => {
      console.log(
        `[AUTH_DEBUG] [home-client.tsx] useEffect cleanup for initialUser: ${initialUser?.id}. Unsubscribing.`
      );
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [initialUser, supabaseClient, router]);

  const handleSignIn = (provider: "google" | "github") => {
    console.log(
      `[AUTH_DEBUG] [home-client.tsx] handleSignIn: Attempting ${provider} sign in.`
    );
    supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    console.log(
      "[AUTH_DEBUG] [home-client.tsx] handleSignOut: Attempting sign out."
    );
    setLoading(true);

    const { error: clientSignOutError } = await supabaseClient.auth.signOut();

    if (clientSignOutError) {
      console.error(
        "[AUTH_DEBUG] [home-client.tsx] Error during client-side signOut:",
        clientSignOutError.message
      );
      alert(
        `Client sign-out error: ${clientSignOutError.message}. Attempting server sign-out.`
      );
    }

    setUser(null);

    console.log(
      "[AUTH_DEBUG] [home-client.tsx] Client-side state set to signed out. Now calling server API for cookie clearance."
    );

    try {
      const response = await fetch("/auth/signout", { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "[AUTH_DEBUG] [home-client.tsx] Server sign out API call failed:",
          errorData.details || response.statusText
        );
        alert(
          `Server sign out failed: ${
            errorData.details || response.statusText
          }. Client was signed out.`
        );
      } else {
        console.log(
          "[AUTH_DEBUG] [home-client.tsx] Server sign out API POST successful. Server will redirect."
        );
      }
    } catch (error: any) {
      console.error(
        "[AUTH_DEBUG] [home-client.tsx] Error during server sign out fetch:",
        error.message
      );
      alert(`Server sign out error: ${error.message}. Client was signed out.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Polyglotas
        </h1>
        <p className="text-xl">Loading user session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-center text-5xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Welcome to Polyglotas
      </h1>

      {user ? (
        <div className="text-center">
          <p className="text-xl mb-4">You are signed in as: {user.email}</p>
          <p className="text-sm mb-6">User ID: {user.id}</p>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition duration-150 ease-in-out disabled:opacity-50"
          >
            {loading ? "Signing out..." : "Sign Out"}
          </button>
          <div className="mt-8">
            <p className="text-lg">Navigation:</p>
            <button
              onClick={() => router.push("/learn")}
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Go to Learning Page (Test)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <p className="text-xl mb-6">Please sign in to continue.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleSignIn("google")}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition duration-150 ease-in-out flex items-center justify-center space-x-2"
            >
              <span>Sign In with Google</span>
            </button>
            <button
              onClick={() => handleSignIn("github")}
              className="px-8 py-4 bg-gray-700 hover:bg-gray-800 rounded-lg text-white font-semibold transition duration-150 ease-in-out flex items-center justify-center space-x-2"
            >
              <span>Sign In with GitHub</span>
            </button>
          </div>
        </div>
      )}

      <footer className="absolute bottom-8 text-gray-500">
        <p>Polyglotas Authentication Demo</p>
      </footer>
    </div>
  );
}
