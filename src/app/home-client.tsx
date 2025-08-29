"use client";

import { useEffect, useState, useMemo } from "react";
import { createSupabaseBrowserClient as createClient } from "@/lib/supabase/client";
// import { useRouter } from "next/navigation"; // Removed unused import
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import LandingHero from "@/components/landing/LandingHero";
import AuthenticatedDashboard from "@/components/landing/AuthenticatedDashboard";

interface HomeClientProps {
  initialUser: User | null;
}

export default function HomeClient({ initialUser }: HomeClientProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(true);
  // const router = useRouter(); // Removed unused variable
  const supabaseClient = useMemo(() => createClient(), []);

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
      } catch (e: unknown) {
        console.error(
          "[AUTH_DEBUG] [home-client.tsx] Error in useEffect getSession async:",
          e instanceof Error ? e.message : 'Unknown error'
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
  }, [initialUser?.id, initialUser, user?.id, supabaseClient]);

  const handleSignIn = (provider: "google" | "github") => {
    console.log(
      `[AUTH_DEBUG] [home-client.tsx] handleSignIn: Attempting ${provider} sign in.`
    );
    
    // Check for invitation token
    const invitationToken = localStorage.getItem('invitation_token');
    const redirectUrl = invitationToken 
      ? `${window.location.origin}/auth/callback?invitation_token=${invitationToken}`
      : `${window.location.origin}/auth/callback`;
    
    supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(
        "[AUTH_DEBUG] [home-client.tsx] Error during server sign out fetch:",
        errorMessage
      );
      alert(`Server sign out error: ${errorMessage}. Client was signed out.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-hero-gradient flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Polyglotas
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        <p className="text-xl text-white mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <AuthenticatedDashboard user={user} onSignOut={handleSignOut} />
      ) : (
        <LandingHero onSignIn={handleSignIn} />
      )}
    </>
  );
}
