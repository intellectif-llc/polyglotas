'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { storeInvitationToken, getOAuthRedirectUrl } from '@/lib/invitation/client';
import { Mail, Github, Building2, Send } from 'lucide-react';

interface Partnership {
  id: number;
  name: string;
  description?: string;
  trial_duration_days: number;
  trial_tier: string;
  discount_percentage: number;
}

interface Invitation {
  id: number;
  token: string;
  intended_for_email: string;
  expires_at: string;
}

interface InvitationRedemptionProps {
  invitation: Invitation;
  partnership: Partnership;
  token: string;
}

export function InvitationRedemption({ invitation, partnership, token }: InvitationRedemptionProps) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Store invitation token in localStorage for later redemption
  useEffect(() => {
    storeInvitationToken(token);
  }, [token]);

  const handleSignUp = (provider: 'google' | 'github' | 'azure') => {
    supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthRedirectUrl(),
      },
    });
  };

  const handleMagicLinkSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsLoading(true);
    setSuccessMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getOAuthRedirectUrl(),
      },
    });
    
    setIsLoading(false);
    
    if (error) {
      console.error('Magic link error:', error.message);
    } else {
      setSuccessMessage(`Check your email! We sent a magic link to ${email}`);
    }
  };

  const handleSignIn = () => {
    // Redirect to unified auth page
    window.location.href = '/auth';
  };

  return (
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Polyglotas!
        </h1>
        <p className="text-gray-600">
          You&apos;ve been invited by <strong>{partnership.name}</strong>
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Your exclusive benefits:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• {partnership.trial_duration_days}-day free trial with {partnership.trial_tier.toUpperCase()} access</li>
          {partnership.discount_percentage > 0 && (
            <li>• {partnership.discount_percentage}% discount on your subscription after the trial</li>
          )}
        </ul>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600 text-center">
          Create your account or sign in to claim your benefits:
        </p>

        <button
          onClick={() => handleSignUp('google')}
          className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Mail className="w-5 h-5 mr-2" />
          Continue with Google
        </button>

        <button
          onClick={() => handleSignUp('github')}
          className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Github className="w-5 h-5 mr-2" />
          Continue with GitHub
        </button>

        <button
          onClick={() => handleSignUp('azure')}
          className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Building2 className="w-5 h-5 mr-2" />
          Continue with Microsoft
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-600">Or</span>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {successMessage && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={handleSignIn}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in to claim your benefits
          </button>
        </p>
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}