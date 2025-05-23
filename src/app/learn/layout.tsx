import React from "react";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import LearnLayoutClient from "@/components/layout/LearnLayoutClient";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LearnLayoutClient user={user}>{children}</LearnLayoutClient>;
}
