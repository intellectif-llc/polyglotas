"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Lottie from "lottie-react";
import animationData from "../../../../public/animations/Oops-error-new.json";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case "wrong_email":
        return {
          title: "Wrong Email Address",
          message:
            "This invitation is not for the email you just used. Please sign in with the correct email or contact the person who sent you this invitation.",
        };
      case "expired":
        return {
          title: "Invitation Expired",
          message:
            "This invitation has expired. Please contact the person who sent you this invitation to request a new one.",
        };
      case "invalid":
        return {
          title: "Invalid Invitation",
          message: "This invitation link is invalid or has already been used.",
        };
      default:
        return {
          title: "Something Went Wrong",
          message:
            "We encountered an error while processing your invitation. Please try again or contact support.",
        };
    }
  };

  const { title, message } = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center">
        <div className="mb-6">
          <Lottie
            animationData={animationData}
            loop={true}
            style={{ height: 200, width: 200, margin: "0 auto" }}
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

        <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

        <div className="space-y-3">
          <a
            href="/auth/signin"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            Try Different Account
          </a>

          <a
            href="/auth/signup"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            Sign Up Normally
          </a>
        </div>
      </div>
    </div>
  );
}

export default function InviteErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
