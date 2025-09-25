"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  ChevronDown,
  LogOut,
  Settings,
  UserCircle,
  Menu,
  Crown,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { usePartnership } from "@/hooks/usePartnership";
import { useUserStats } from "@/hooks/useUserProfile";
import { useRealtimeUserStats } from "@/hooks/useRealtimeUserStats";
import { CompactAnimatedStats } from "./CompactAnimatedStats";
import TryProButton from "../billing/TryProButton";
import Image from "next/image";

interface HeaderProps {
  user: SupabaseUser | null;
  toggleMobileSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
  user: initialUser,
  toggleMobileSidebar,
}) => {
  const router = useRouter();
  const supabaseClient = createSupabaseBrowserClient();
  const [user, setUser] = useState(initialUser);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: partnership } = usePartnership();
  const { data: userStats } = useUserStats();

  // Set up real-time stats updates
  useRealtimeUserStats();

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error: clientSignOutError } = await supabaseClient.auth.signOut();
      if (clientSignOutError) {
        console.error("Client sign out error:", clientSignOutError);
        // Optionally, still attempt server sign out or show error to user
      }

      setUser(null); // Optimistically update UI

      const response = await fetch("/auth/signout", {
        method: "POST",
      });

      if (response.ok) {
        router.push("/"); // Redirect to home page
        router.refresh(); // Ensure layout re-renders with new auth state
      } else {
        console.error("Server sign out failed:", await response.text());
        // Potentially revert optimistic update or show error
        // For now, client state is cleared, and server *should* be cleared.
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Handle network errors or other issues
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        {/* Hamburger menu for mobile */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 text-gray-500 rounded-lg hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Image
            src="/polyglotas-logo.png"
            alt="Polyglotas"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          {partnership && (
            <div className="flex items-center space-x-1">
              <Crown size={16} className="text-amber-500" />
              <span className="hidden sm:inline text-sm font-medium text-amber-600 dark:text-amber-400">
                {partnership.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Compact Stats - visible on mobile, hidden on desktop where sidebar shows full stats */}
        {user && userStats && (
          <div className="md:hidden">
            <CompactAnimatedStats
              streak={userStats.currentStreak}
              points={userStats.totalPoints}
            />
          </div>
        )}

        {/* Desktop Stats - visible on desktop for redundancy */}
        {user && userStats && (
          <div className="hidden md:block">
            <CompactAnimatedStats
              streak={userStats.currentStreak}
              points={userStats.totalPoints}
            />
          </div>
        )}

        {/* Try Pro Button */}
        {user && (
          <TryProButton size="sm" />
        )}

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-1 md:space-x-2 p-1 md:p-2 text-gray-500 rounded-lg hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:outline-none"
            >
              <UserCircle size={20} />
              <span className="hidden md:inline text-sm">
                {user.email?.split("@")[0]}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border dark:border-gray-700">
                <Link
                  href="/account"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings size={16} className="inline mr-2" /> Account
                </Link>
                <button
                  onClick={async () => {
                    setDropdownOpen(false);
                    await handleSignOut();
                  }}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut size={16} className="inline mr-2" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auth"
            className="px-3 py-2 md:px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
