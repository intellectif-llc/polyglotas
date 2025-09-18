import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LearnLayoutClient from "@/components/layout/LearnLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return <LearnLayoutClient user={user}>{children}</LearnLayoutClient>;
}
