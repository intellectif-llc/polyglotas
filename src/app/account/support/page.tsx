import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SupportDashboard from "@/components/support/SupportDashboard";

export default async function SupportPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  return <SupportDashboard />;
}