"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Github, Mail } from "lucide-react";
import { useState } from "react";

export default function SignUpPage() {
  const supabase = createSupabaseBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignUpWithGoogle = async () => {
    setError(null);
    setSuccessMessage(null);
    
    // Check for invitation token
    const invitationToken = localStorage.getItem('invitation_token');
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
    const invitationToken = localStorage.getItem('invitation_token');
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
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Mail className="w-5 h-5 mr-2" />{" "}
              {/* Using Mail as a placeholder for Google icon */}
              Sign up with Google
            </button>

            <button
              onClick={handleSignUpWithGitHub}
              type="button"
              className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Github className="w-5 h-5 mr-2" />
              Sign up with GitHub
            </button>
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
