"use client";

import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import Sidebar from "./Sidebar";
import Header from "./Header";
import OnboardingWrapper from "@/components/onboarding/OnboardingWrapper";
import Dictionary from "@/components/shared/Dictionary";

interface LearnLayoutClientProps {
  user: User | null;
  children: React.ReactNode;
}

export default function LearnLayoutClient({
  user,
  children,
}: LearnLayoutClientProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Prevent flash of mobile sidebar on desktop on initial load before CSS for md: is applied
  // and prevent hydration mismatch for the sidebar's initial state based on screen size.
  if (!isMounted) {
    return null;
  }

  return (
    <OnboardingWrapper>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar
          user={user}
          isMobileOpen={isMobileSidebarOpen}
          toggleMobileSidebar={toggleMobileSidebar}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header user={user} toggleMobileSidebar={toggleMobileSidebar} />
          <main className="flex-1 overflow-y-auto p-2 md:p-6">{children}</main>
          <Dictionary />
        </div>
      </div>
    </OnboardingWrapper>
  );
}
