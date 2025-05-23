import React from "react";
import { BookOpen } from "lucide-react";

export default function LearnPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 dark:text-gray-400">
      <BookOpen size={64} className="mb-4 text-indigo-500" />
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-2">
        Welcome to Polyglotas!
      </h1>
      <p className="text-lg">
        Select an item from the sidebar to begin your learning journey.
      </p>
    </div>
  );
}
