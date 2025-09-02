import Link from "next/link";
import Image from "next/image";
import PublicPricingPlans from "@/components/pricing/PublicPricingPlans";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 cursor-pointer">
            <Image
              src="/polyglotas-logo.png"
              alt="Polyglotas"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Polyglotas
            </h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth"
              className="px-4 py-2 bg-brand-gradient hover:shadow-lg hover:shadow-brand-primary/75 border border-white/30 rounded-xl text-white font-medium transition-all duration-200 cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Choose Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                {" "}
                Learning Plan
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Start your pronunciation journey with our AI-powered platform.
              Choose the plan that fits your learning goals and unlock your
              speaking potential.
            </p>
          </div>

          {/* Pricing Plans */}
          <PublicPricingPlans />

          {/* Features Comparison */}
          <div className="mt-20 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-white text-center mb-8">
              Why Choose Polyglotas?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a5 5 0 1110 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  AI-Powered Feedback
                </h3>
                <p className="text-gray-300">
                  Get instant, precise feedback on your pronunciation with our
                  advanced AI technology.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Progress Tracking
                </h3>
                <p className="text-gray-300">
                  Monitor your improvement with detailed analytics and
                  personalized insights.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Comprehensive Lessons
                </h3>
                <p className="text-gray-300">
                  Access a complete library of pronunciation lessons and
                  vocabulary building exercises.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Can I change my plan anytime?
                </h3>
                <p className="text-gray-300">
                  Yes! You can upgrade, downgrade, or cancel your subscription
                  at any time from your account settings.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Is there a free trial?
                </h3>
                <p className="text-gray-300">
                  Our Free plan gives you access to basic features forever.
                  Upgrade anytime to unlock advanced features.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  What languages are supported?
                </h3>
                <p className="text-gray-300">
                  We currently support multiple languages with native speaker
                  models and are continuously adding more.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">
                  How accurate is the AI feedback?
                </h3>
                <p className="text-gray-300">
                  Our AI provides phoneme-level accuracy with over 95%
                  precision, helping you perfect even the smallest pronunciation
                  details.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Perfect Your Pronunciation?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who have transformed their speaking
              confidence with Polyglotas.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center px-8 py-4 bg-brand-gradient hover:shadow-2xl hover:shadow-purple-500/25 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 cursor-pointer border border-white/10 shadow-lg"
            >
              <span>Start Learning Today</span>
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
