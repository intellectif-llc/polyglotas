"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Github, Send } from "lucide-react";
import { useState } from "react";

interface AuthFormProps {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  redirectUrl?: string;
}

export default function AuthForm({
  onSuccess,
  onError,
  redirectUrl,
}: AuthFormProps) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getRedirectUrl = () => {
    if (redirectUrl) return redirectUrl;

    // Check for invitation token
    const invitationToken = localStorage.getItem("invitation_token");
    return invitationToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?invitation_token=${invitationToken}`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  };

  const handleOAuthSignIn = async (provider: "google" | "github" | "azure") => {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl(),
      },
    });
    if (authError && onError) {
      onError(authError.message);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    setIsLoading(false);

    if (authError && onError) {
      onError(authError.message);
    } else if (onSuccess) {
      onSuccess(`Check your email! We sent a magic link to ${email}`);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleOAuthSignIn("google")}
        type="button"
        className="w-full flex justify-center items-center py-3 px-4 border border-white/30 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-200"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      <button
        onClick={() => handleOAuthSignIn("github")}
        type="button"
        className="w-full flex justify-center items-center py-3 px-4 border border-white/30 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-200"
      >
        <Github className="w-5 h-5 mr-2" />
        Continue with GitHub
      </button>

      <button
        onClick={() => handleOAuthSignIn("azure")}
        type="button"
        className="w-full flex justify-center items-center py-3 px-4 border border-white/30 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-200"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M0 0h11.377v11.372H0V0zm12.623 0H24v11.372H12.623V0zM0 12.623h11.377V24H0V12.623zm12.623 0H24V24H12.623V12.623z" />
        </svg>
        Continue with Microsoft
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/30" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-transparent text-gray-300">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-white/30 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full flex justify-center items-center py-3 px-4 border border-white/30 rounded-xl shadow-sm text-sm font-medium text-white bg-brand-gradient hover:shadow-lg hover:shadow-brand-primary/25 hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Sending..." : "Log in with magic link"}
        </button>
      </form>
    </div>
  );
}
