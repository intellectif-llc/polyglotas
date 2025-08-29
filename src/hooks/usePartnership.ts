import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface Partnership {
  name: string;
}

export const usePartnership = () => {
  return useQuery<Partnership | null, Error>({
    queryKey: ["partnership"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select(`
          partnership_id,
          partnerships(name)
        `)
        .eq("id", session.user.id)
        .single();

      if (error || !data || !data.partnership_id || !data.partnerships) {
        return null;
      }
      
      return Array.isArray(data.partnerships) ? data.partnerships[0] : data.partnerships;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};