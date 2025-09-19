import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PurchaseHistory from "@/components/purchases/PurchaseHistory";

export default async function PurchasesPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth");
  }

  return <PurchaseHistory />;
}