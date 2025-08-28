import { useQuery } from "@tanstack/react-query";

interface LanguageLevel {
  level_code: string;
  level_name: string;
  sort_order: number;
}

export const useLanguageLevels = () => {
  return useQuery<LanguageLevel[], Error>({
    queryKey: ["language-levels"],
    queryFn: async () => {
      const response = await fetch("/api/language-levels");
      if (!response.ok) {
        throw new Error("Failed to fetch language levels");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};