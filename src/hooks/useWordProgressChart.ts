import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface WordProgressData {
  date: string;
  words_learned: number;
  cumulative_words: number;
}

export type TimeFilter = 'days' | 'weeks' | 'months';

export const useWordProgressChart = (timeFilter: TimeFilter = 'days', period: number = 30) => {
  return useQuery<WordProgressData[], Error>({
    queryKey: ["wordProgressChart", timeFilter, period],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeFilter) {
        case 'days':
          startDate.setDate(endDate.getDate() - period);
          break;
        case 'weeks':
          startDate.setDate(endDate.getDate() - (period * 7));
          break;
        case 'months':
          startDate.setMonth(endDate.getMonth() - period);
          break;
      }

      // Get word pronunciation data
      const { data, error } = await supabase
        .from("user_word_pronunciation")
        .select(`
          word_text,
          language_code,
          created_at,
          average_accuracy_score,
          needs_practice
        `)
        .eq("profile_id", session.user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Process data based on time filter
      const processedData: WordProgressData[] = [];
      const dateMap = new Map<string, number>();
      
      // Initialize date range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        let dateKey: string;
        
        switch (timeFilter) {
          case 'days':
            dateKey = currentDate.toISOString().split('T')[0];
            break;
          case 'weeks':
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - currentDate.getDay());
            dateKey = weekStart.toISOString().split('T')[0];
            break;
          case 'months':
            dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            break;
          default:
            dateKey = currentDate.toISOString().split('T')[0];
        }
        
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, 0);
        }
        
        switch (timeFilter) {
          case 'days':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weeks':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'months':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      // Count words learned per period (words with good accuracy and not needing practice)
      data?.forEach((word) => {
        if (word.average_accuracy_score >= 70 && !word.needs_practice) {
          const wordDate = new Date(word.created_at);
          let dateKey: string;
          
          switch (timeFilter) {
            case 'days':
              dateKey = wordDate.toISOString().split('T')[0];
              break;
            case 'weeks':
              const weekStart = new Date(wordDate);
              weekStart.setDate(wordDate.getDate() - wordDate.getDay());
              dateKey = weekStart.toISOString().split('T')[0];
              break;
            case 'months':
              dateKey = `${wordDate.getFullYear()}-${String(wordDate.getMonth() + 1).padStart(2, '0')}`;
              break;
            default:
              dateKey = wordDate.toISOString().split('T')[0];
          }
          
          if (dateMap.has(dateKey)) {
            dateMap.set(dateKey, dateMap.get(dateKey)! + 1);
          }
        }
      });

      // Convert to array and calculate cumulative
      let cumulative = 0;
      const sortedDates = Array.from(dateMap.keys()).sort();
      
      sortedDates.forEach((date) => {
        const wordsLearned = dateMap.get(date) || 0;
        cumulative += wordsLearned;
        
        processedData.push({
          date,
          words_learned: wordsLearned,
          cumulative_words: cumulative,
        });
      });

      return processedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};