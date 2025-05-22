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
  const [loading, setLoading] = useState(true); // To track initial client-side auth check
  const router = useRouter();
  const supabaseClient = createClient(); // Regular client-side Supabase client

  useEffect(() => {
    console.log(
      "[AUTH_DEBUG] [home-client.tsx] useEffect: Setting up auth state change listener. Initial server user:",
      initialUser?.id
    );
    setUser(initialUser);
    setLoading(false); // Initial state is now set

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log(
          `[AUTH_DEBUG] [home-client.tsx] onAuthStateChange: event - ${event}, session user - ${session?.user?.id}`
        );
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_IN") {
          // Can perform actions on sign-in, e.g., redirect
          // router.refresh(); // Refresh server components if needed
        } else if (event === "SIGNED_OUT") {
          // Can perform actions on sign-out
          // router.refresh(); // Refresh to reflect signed-out state server-side
        }
      }
    );

    return () => {
      console.log(
        "[AUTH_DEBUG] [home-client.tsx] useEffect cleanup: Unsubscribing from auth state changes."
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
      "[AUTH_DEBUG] [home-client.tsx] handleSignOut: Attempting sign out via API."
    );
    setLoading(true);
    try {
      const response = await fetch("/auth/signout", { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "[AUTH_DEBUG] [home-client.tsx] Sign out failed:",
          errorData.details || response.statusText
        );
        alert(`Sign out failed: ${errorData.details || response.statusText}`);
      } else {
        console.log(
          "[AUTH_DEBUG] [home-client.tsx] Sign out POST successful, auth state change should handle UI."
        );
      }
    } catch (error: any) {
      console.error(
        "[AUTH_DEBUG] [home-client.tsx] Error during sign out fetch:",
        error.message
      );
      alert(`Sign out error: ${error.message}`);
    } finally {
      setLoading(false); // Ensure loading state is reset
    }
  };

  if (loading && !user) {
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
      <h1 className="text-5xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
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
