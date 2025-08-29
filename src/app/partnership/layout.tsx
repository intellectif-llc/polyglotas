import React from "react";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LearnLayoutClient from "@/components/layout/LearnLayoutClient";

export default async function PartnershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/signin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, partnership_id')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'partnership_manager' && profile?.role !== 'admin') {
    redirect('/');
  }

  // Partnership managers must have a partnership_id, but admins can access all
  if (profile?.role === 'partnership_manager' && !profile?.partnership_id) {
    redirect('/');
  }

  return <LearnLayoutClient user={user}>{children}</LearnLayoutClient>;
}