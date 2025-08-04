import { useQuery } from "@tanstack/react-query";

interface Language {
  language_code: string;
  language_name: string;
}

export const useLanguages = () => {
  return useQuery<Language[], Error>({
    queryKey: ["languages"],
    queryFn: async () => {
      const response = await fetch("/api/languages");
      if (!response.ok) {
        throw new Error("Failed to fetch languages");
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

