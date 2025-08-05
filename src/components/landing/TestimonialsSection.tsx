"use client";

import { StarIcon } from "@heroicons/react/24/solid";

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Business Professional",
      avatar: "SC",
      content: "Polyglotas transformed my English pronunciation in just 3 months. The phoneme-level feedback is incredibly precise - I finally understand why native speakers couldn't understand certain words I was saying.",
      rating: 5,
      language: "English"
    },
    {
      name: "Miguel Rodriguez",
      role: "University Student", 
      avatar: "MR",
      content: "The spaced repetition system is genius! I'm learning French vocabulary faster than ever, and the pronunciation feedback helps me sound more natural. My confidence has skyrocketed.",
      rating: 5,
      language: "French"
    },
    {
      name: "Yuki Tanaka",
      role: "Software Engineer",
      avatar: "YT", 
      content: "As a Japanese speaker learning German, the AI feedback on consonant clusters was exactly what I needed. The app identified my specific pronunciation patterns and helped me improve systematically.",
      rating: 5,
      language: "German"
    }
  ];

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What Our 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              {" "}Learners Say
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of language learners who have transformed their pronunciation and confidence with Polyglotas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed italic">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{testimonial.name}</h4>
                  <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  <p className="text-purple-400 text-sm font-medium">Learning {testimonial.language}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                  10,000+
                </div>
                <p className="text-gray-300">Active Learners</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                  50+
                </div>
                <p className="text-gray-300">Languages Supported</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                  95%
                </div>
                <p className="text-gray-300">Accuracy Rate</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                  4.9/5
                </div>
                <p className="text-gray-300">User Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}