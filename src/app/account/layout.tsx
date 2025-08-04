import React from "react";
import { createClient } from "@/lib/supabase/server";
import LearnLayoutClient from "@/components/layout/LearnLayoutClient";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LearnLayoutClient user={user}>{children}</LearnLayoutClient>;
}