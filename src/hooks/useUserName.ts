import { useQuery } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const useUserName = () => {
  return useQuery<string | null, Error>({
    queryKey: ["userName"],
    queryFn: async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data?.first_name || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};