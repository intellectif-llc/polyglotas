"use client"; // Required for useRouter and event handlers

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
      }
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // Optionally redirect based on auth state change
        // if (!session?.user && window.location.pathname !== '/' && window.location.pathname !== '/auth/signin') {
        //   router.push('/auth/signin');
        // }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      // Optionally show an error message to the user
    } else {
      setUser(null); // Clear user state immediately
      router.push("/auth/signin"); // Redirect to sign-in page
      // router.refresh(); // Not strictly necessary here as state update will re-render
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to Polyglotas!</h1>
      <p className="mt-4 text-lg">
        Your journey to multilingual mastery starts here.
      </p>

      {user ? (
        <div className="mt-8">
          <p className="text-center">Logged in as: {user.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <a
            href="/auth/signin"
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Sign In / Sign Up
          </a>
        </div>
      )}
    </main>
  );
}
