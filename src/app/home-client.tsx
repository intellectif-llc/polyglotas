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
    setUser(initialUser);
    setLoading(false);

    const checkInitialClientSession = async () => {
      try {
        const {
          data: { session: clientSession },
          error: clientSessionError,
        } = await supabaseClient.auth.getSession();
        if (!initialUser && clientSession?.user) {
        }
      } catch (e: unknown) {}
    };
    checkInitialClientSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const newEventUser = session?.user ?? null;
        setUser(newEventUser);

        if (event === "SIGNED_OUT") {
        } else if (event === "INITIAL_SESSION") {
        } else if (event === "SIGNED_IN") {
        } else {
        }

        setLoading(false);
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [initialUser?.id, initialUser, user?.id, supabaseClient]);

  const handleSignIn = (provider: "google" | "github") => {
    // Check for invitation token
    const invitationToken = localStorage.getItem("invitation_token");
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
    setLoading(true);

    const { error: clientSignOutError } = await supabaseClient.auth.signOut();

    if (clientSignOutError) {
      alert(
        `Client sign-out error: ${clientSignOutError.message}. Attempting server sign-out.`
      );
    }

    setUser(null);

    try {
      const response = await fetch("/auth/signout", { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json();
        alert(
          `Server sign out failed: ${
            errorData.details || response.statusText
          }. Client was signed out.`
        );
      } else {
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
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
