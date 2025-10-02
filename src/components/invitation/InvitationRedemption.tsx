"use client";

import { useEffect, useState } from "react";
import {
  storeInvitationToken,
  getInvitationToken,
} from "@/lib/invitation/client";
import AuthForm from "@/components/auth/AuthForm";
import Image from "next/image";
import Link from "next/link";

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

export function InvitationRedemption({
  invitation,
  partnership,
  token,
}: InvitationRedemptionProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Store invitation token in cookie for later redemption
  useEffect(() => {
    console.log('[INVITATION_COMPONENT] Storing invitation token in cookie', { token });
    storeInvitationToken(token);
    
    // Verify token was stored
    const storedToken = getInvitationToken();
    console.log('[INVITATION_COMPONENT] Token storage verification', { 
      originalToken: token,
      storedToken,
      storageSuccess: storedToken === token
    });
  }, [token]);

  const handleSuccess = (message: string) => {
    setError(null);
    setSuccessMessage(message);
  };

  const handleError = (errorMessage: string) => {
    setSuccessMessage(null);
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="cursor-pointer">
            <Image
              src="/polyglotas-logo.png"
              alt="Polyglotas"
              width={80}
              height={80}
              className="rounded-xl hover:opacity-80 transition-opacity duration-200"
            />
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white mb-2">
          Welcome to Polyglotas!
        </h2>
        <p className="text-center text-gray-300 mb-4">
          You&apos;ve been invited by{" "}
          <strong className="text-brand-primary">{partnership.name}</strong>
        </p>

        <div className="bg-brand-primary/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-2">
            Your exclusive benefits:
          </h3>
          <ul className="text-sm text-gray-200 space-y-1">
            <li>
              • {partnership.trial_duration_days}-day free trial with{" "}
              {partnership.trial_tier.toUpperCase()} access
            </li>
            {partnership.discount_percentage > 0 && (
              <li>
                • {partnership.discount_percentage}% discount on your
                subscription after the trial
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-500/20 border border-red-500/30 p-4">
              <p className="text-sm font-medium text-red-200">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-500/20 border border-green-500/30 p-4">
              <p className="text-sm font-medium text-green-200">
                {successMessage}
              </p>
            </div>
          )}

          <div className="mb-6 text-center">
            <p className="text-sm text-gray-300">
              Continue to claim your benefits:
            </p>
          </div>

          <AuthForm
            onSuccess={handleSuccess}
            onError={handleError}
          />

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              This invitation expires on{" "}
              {new Date(invitation.expires_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
