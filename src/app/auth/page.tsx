"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import AuthForm from "@/components/auth/AuthForm";

function AuthContent() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Handle URL error parameters
  useEffect(() => {
    const urlError = searchParams.get("error");
    const urlErrorDescription = searchParams.get("error_description");

    if (urlError) {
      setError(urlErrorDescription || urlError);
    }
  }, [searchParams]);

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
          Welcome to Polyglotas
        </h2>
        <p className="text-center text-gray-300">
          Master pronunciation with AI-powered feedback
        </p>
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

          <AuthForm onSuccess={handleSuccess} onError={handleError} />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="font-medium text-brand-primary hover:text-brand-secondary transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-brand-primary hover:text-brand-secondary transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
