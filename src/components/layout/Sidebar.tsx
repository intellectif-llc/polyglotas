"use client";

import React, { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { BookOpen, Folder, ChevronsLeft, ChevronsRight, X } from "lucide-react";

interface SidebarProps {
  user: User | null; // User prop can be used later for role-based items, etc.
  isMobileOpen: boolean;
  toggleMobileSidebar: () => void;
}

const SidebarHeader: React.FC<{
  isDesktopCollapsed: boolean;
  toggleDesktopCollapse: () => void;
  isMobile: boolean;
  closeMobileSidebar: () => void;
}> = ({
  isDesktopCollapsed,
  toggleDesktopCollapse,
  isMobile,
  closeMobileSidebar,
}) => (
  <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 px-4">
    {!isDesktopCollapsed && !isMobile && (
      <Link
        href="/learn"
        className="text-xl font-semibold text-gray-800 dark:text-white"
      >
        Polyglotas
      </Link>
    )}
    {isDesktopCollapsed && !isMobile && (
      <div className="w-full flex justify-center">
        {/* Placeholder or small logo when collapsed and not mobile */}
      </div>
    )}
    {isMobile && (
      <Link
        href="/learn"
        className="text-xl font-semibold text-gray-800 dark:text-white"
      >
        Polyglotas
      </Link>
    )}
    <button
      onClick={isMobile ? closeMobileSidebar : toggleDesktopCollapse}
      className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
      aria-label={
        isMobile
          ? "Close sidebar"
          : isDesktopCollapsed
          ? "Expand sidebar"
          : "Collapse sidebar"
      }
    >
      {isMobile ? (
        <X size={20} />
      ) : isDesktopCollapsed ? (
        <ChevronsRight size={20} />
      ) : (
        <ChevronsLeft size={20} />
      )}
    </button>
  </div>
);

const SidebarNav: React.FC<{
  isDesktopCollapsed: boolean;
  isMobile: boolean;
}> = ({ isDesktopCollapsed, isMobile }) => {
  const iconSize = isDesktopCollapsed && !isMobile ? 24 : 20;
  const itemPadding = isDesktopCollapsed && !isMobile ? "justify-center" : "";
  const textHidden = isDesktopCollapsed && !isMobile;

  const navItems = [
    { href: "/learn", label: "Dashboard", icon: BookOpen },
    { href: "#", label: "Course Item 1", icon: Folder, isPlaceholder: true },
    { href: "#", label: "Course Item 2", icon: Folder, isPlaceholder: true },
    { href: "#", label: "Course Item 3", icon: Folder, isPlaceholder: true },
  ];

  return (
    <nav className="flex-1 py-4 px-2 space-y-2">
      {navItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={`flex items-center p-2 text-base font-normal rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group ${itemPadding}`}
        >
          <item.icon
            size={iconSize}
            className={`transition-all duration-300 ${
              textHidden ? "" : "mr-3"
            } text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white`}
          />
          {!textHidden && (
            <span className="flex-1 whitespace-nowrap">{item.label}</span>
          )}
        </Link>
      ))}
    </nav>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  user,
  isMobileOpen,
  toggleMobileSidebar,
}) => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768); // Tailwind's md breakpoint
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleDesktopCollapse = () => {
    if (!isMobileView) {
      setIsDesktopCollapsed(!isDesktopCollapsed);
    }
  };

  // Determine current collapsed state based on view
  const trulyCollapsed = !isMobileView && isDesktopCollapsed;

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && isMobileView && (
        <div
          onClick={toggleMobileSidebar}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto
          ${
            isMobileView
              ? isMobileOpen
                ? "translate-x-0 w-64 shadow-lg"
                : "-translate-x-full w-64"
              : trulyCollapsed
              ? "w-20"
              : "w-64"
          }
        `}
      >
        <SidebarHeader
          isDesktopCollapsed={trulyCollapsed}
          toggleDesktopCollapse={toggleDesktopCollapse}
          isMobile={isMobileView}
          closeMobileSidebar={toggleMobileSidebar}
        />
        <SidebarNav
          isDesktopCollapsed={trulyCollapsed}
          isMobile={isMobileView}
        />

        {/* Footer or other elements can be added here */}
      </aside>
    </>
  );
};

export default Sidebar;
