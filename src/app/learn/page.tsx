"use client";

import { useRouter } from "next/navigation";
import PronunciationDashboard from "@/components/pronunciation/dashboard/PronunciationDashboard";
import WordsPracticeList from "@/components/pronunciation/practice/WordsPracticeList";

export default function LearnPage() {
  const router = useRouter();

  const handleWordSelect = (word: string) => {
    router.push(`/learn/practice/words?word=${encodeURIComponent(word)}`);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-2 space-y-6">
      {/* Words Practice Section */}
      <WordsPracticeList onWordSelect={handleWordSelect} />
      
      {/* Main Dashboard */}
      <div className="bg-white rounded-lg shadow-xl p-2 md:p-5 lg:p-6 min-h-[400px]">
        <PronunciationDashboard />
      </div>
    </div>
  );
}
