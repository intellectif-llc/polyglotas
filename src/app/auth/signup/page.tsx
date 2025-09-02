"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Github, Mail, Send } from "lucide-react";
import { Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUpWithGoogle = async () => {
    setError(null);
    setSuccessMessage(null);

    // Check for invitation token
    const invitationToken = localStorage.getItem("invitation_token");
    const redirectUrl = invitationToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?invitation_token=${invitationToken}`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error: signUpError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (signUpError) {
      setError(signUpError.message);
    }
  };

  const handleSignUpWithGitHub = async () => {
    setError(null);
    setSuccessMessage(null);

    // Check for invitation token
    const invitationToken = localStorage.getItem("invitation_token");
    const redirectUrl = invitationToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?invitation_token=${invitationToken}`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error: signUpError } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (signUpError) {
      setError(signUpError.message);
    }
  };

  const handleSignUpWithAzure = async () => {
    setError(null);
    setSuccessMessage(null);

    // Check for invitation token
    const invitationToken = localStorage.getItem("invitation_token");
    const redirectUrl = invitationToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?invitation_token=${invitationToken}`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error: signUpError } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (signUpError) {
      setError(signUpError.message);
    }
  };

  const handleMagicLinkSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Check for invitation token
    const invitationToken = localStorage.getItem("invitation_token");
    const redirectUrl = invitationToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?invitation_token=${invitationToken}`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

    const { error: signUpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    setIsLoading(false);
    
    if (signUpError) {
      setError(signUpError.message);
    } else {
      setSuccessMessage(`Check your email! We sent a magic link to ${email}`);
    }
  };

  // Optional: Email/Password Sign Up (as per your requirements, social is primary)
  // const handleSignUpWithEmail = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setError(null);
  //   setSuccessMessage(null);
  //   const { data, error: signUpError } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: {
  //       // emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`, // If email confirmation is needed
  //     },
  //   });
  //   if (signUpError) {
  //     setError(signUpError.message);
  //   } else if (data.user && data.user.identities?.length === 0) {
  //     setError('User already exists. Try signing in.');
  //   } else if (data.user) {
  //     // setSuccessMessage('Check your email for the confirmation link!'); // If email confirmation is enabled
  //     setSuccessMessage('Account created successfully! Redirecting...');
  //     router.push('/learn'); // Or dashboard
  //     router.refresh();
  //   }
  // };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your Polyglotas account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-6">
            <button
              onClick={handleSignUpWithGoogle}
              type="button"
              disabled={!agreedToTerms}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-5 h-5 mr-2" />{" "}
              {/* Using Mail as a placeholder for Google icon */}
              Sign up with Google
            </button>

            <button
              onClick={handleSignUpWithGitHub}
              type="button"
              disabled={!agreedToTerms}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Github className="w-5 h-5 mr-2" />
              Sign up with GitHub
            </button>

            <button
              onClick={handleSignUpWithAzure}
              type="button"
              disabled={!agreedToTerms}
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Sign up with Microsoft
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <form onSubmit={handleMagicLinkSignUp} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!agreedToTerms || isLoading || !email.trim()}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "Sending..." : "Send magic link"}
              </button>
            </form>
          </div>
          <div className="mt-6">
            <div className="flex items-center">
              <input
                id="terms-agreement"
                name="terms-agreement"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="terms-agreement"
                className="ml-2 block text-sm text-gray-900"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
          </div>

          {/* Email/Password form commented out, similar to sign-in */}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
