"use client";

import Link from "next/link";
import {
  MicrophoneIcon,
  ChartBarIcon,
  ClockIcon,
  GlobeAltIcon,
  SpeakerWaveIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

export default function FeaturesSection() {
  const features = [
    {
      icon: MicrophoneIcon,
      title: "Real-time Pronunciation Analysis",
      description:
        "Advanced AI analyzes your speech patterns and provides instant feedback on phoneme accuracy.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: ChartBarIcon,
      title: "Progress Tracking",
      description:
        "Detailed analytics show your improvement over time with personalized insights and recommendations.",
      color: "from-blue-500 to-purple-500",
    },
    {
      icon: ClockIcon,
      title: "Spaced Repetition System",
      description:
        "Scientifically-proven method ensures you review words at optimal intervals for long-term retention.",
      color: "from-green-500 to-blue-500",
    },
    {
      icon: GlobeAltIcon,
      title: "Multiple Languages",
      description:
        "Support for 50+ languages with native speaker models and cultural context.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: SpeakerWaveIcon,
      title: "Phoneme-Level Feedback",
      description:
        "Get precise feedback on individual sounds, helping you master even the most challenging pronunciations.",
      color: "from-pink-500 to-purple-500",
    },
    {
      icon: AcademicCapIcon,
      title: "Adaptive Learning",
      description:
        "AI adapts to your learning style and pace, creating a personalized curriculum just for you.",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}
              Polyglotas?
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our cutting-edge technology combines the latest in AI research with
            proven language learning methodologies to give you the most
            effective pronunciation training available.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2"
            >
              <div
                className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-purple-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h3 className="text-3xl font-bold mb-4 text-white">
              Ready to Transform Your Pronunciation?
            </h3>
            <p className="text-xl mb-6 text-gray-300">
              Join thousands of learners who have already improved their
              speaking confidence with Polyglotas.
            </p>
            <Link
              href="/auth"
              className="inline-block px-8 py-4 bg-brand-gradient hover:shadow-2xl hover:shadow-purple-500/25 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 border border-white/10 shadow-lg cursor-pointer"
            >
              Try it for free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
