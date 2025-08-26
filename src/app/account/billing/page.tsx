import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BillingDashboard from "@/components/billing/BillingDashboard";

export default async function BillingPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/signin");
  }

  return <BillingDashboard />;
}
