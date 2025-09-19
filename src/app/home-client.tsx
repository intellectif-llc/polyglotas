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
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabaseClient = useMemo(() => createClient(), []);

  useEffect(() => {
    setUser(initialUser);
    setLoading(false);

    const checkInitialClientSession = async () => {
      try {
        const {
          data: { session: clientSession },
        } = await supabaseClient.auth.getSession();
        if (!initialUser && clientSession?.user) {
          // Session exists but initialUser is null - let auth listener handle it
        }
      } catch {
        // Ignore session check errors
      }
    };
    checkInitialClientSession();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const newEventUser = session?.user ?? null;
        
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsSigningOut(false);
        } else if (event === "SIGNED_IN") {
          setUser(newEventUser);
          setIsSigningOut(false);
        } else {
          setUser(newEventUser);
        }

        setLoading(false);
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [initialUser, supabaseClient]);

  const handleSignIn = (provider: "google" | "github" | "azure") => {
    // If user is already logged in, they shouldn't see this component
    // But as a safety measure, don't include invitation tokens for logged-in users
    const invitationToken = user ? null : localStorage.getItem("invitation_token");
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
    setIsSigningOut(true);
    setLoading(true);

    try {
      // Sign out from client first
      const { error: clientSignOutError } = await supabaseClient.auth.signOut();
      
      if (clientSignOutError) {
        console.error('Client sign-out error:', clientSignOutError.message);
      }

      // Set user to null immediately
      setUser(null);

      // Call server sign-out endpoint - this will redirect
      window.location.href = '/auth/signout';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error('Sign out error:', errorMessage);
      setIsSigningOut(false);
      setLoading(false);
    }
  };

  if (loading || isSigningOut) {
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
