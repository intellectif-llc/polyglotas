"use client";

import { useSearchParams } from "next/navigation";
import WordPracticeView from "@/components/pronunciation/practice/WordPracticeView";

export default function WordPracticePage() {
  const searchParams = useSearchParams();
  const initialWord = searchParams.get("word");

  return <WordPracticeView initialWord={initialWord || undefined} />;
}