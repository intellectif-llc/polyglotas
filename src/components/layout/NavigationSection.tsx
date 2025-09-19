"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  User,
  Settings,
  BarChart3,
  CreditCard,
  Loader2,
  LucideIcon,
  Shield,
  Users,
  PlayCircle,
  Headphones,
} from "lucide-react";
import { useContinueLearning } from "@/hooks/useContinueLearning";
import { useUserStats } from "@/hooks/useUserProfile";
import { useNavigationState } from "@/hooks/useNavigationState";
import { useRealtimeUserStats } from "@/hooks/useRealtimeUserStats";
import NavigationSkeleton from "./NavigationSkeleton";
import { AnimatedStats } from "./AnimatedStats";
import { useUserRole } from "@/hooks/useUserRole";

interface NavigationSectionProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onNavigate?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  isActive?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
  isLoading?: boolean;
}

const NavigationSection: React.FC<NavigationSectionProps> = ({
  isCollapsed,
  isMobile,
  onNavigate,
}) => {
  const pathname = usePathname();
  const { pendingHref, handleNavigation } = useNavigationState(onNavigate);
  const { data: continueData, isLoading: continueLoading } = useContinueLearning();
  const { data: userStats } = useUserStats();
  const { role } = useUserRole();

  // Set up real-time stats updates
  useRealtimeUserStats();

  const iconSize = isCollapsed && !isMobile ? 24 : 20;
  const textHidden = isCollapsed && !isMobile;

  // Continue learning section
  const continueSection = continueLoading
    ? {
        title: "Learning",
        items: [],
        isLoading: true,
      }
    : {
        title: "Learning",
        items: continueData ? [{
          href: continueData.href,
          label: continueData.hasProgress ? "Continue learning" : "Get started",
          icon: PlayCircle,
          isActive: pathname.startsWith(`/learn/${continueData.unitId}/lesson/${continueData.lessonId}`),
        }] : [{
          href: "/learn/1/lesson/1/dictation",
          label: "Get started",
          icon: PlayCircle,
          isActive: false,
        }],
      };

  // Build navigation sections based on user role
  const navSections: NavSection[] = [
    {
      items: [
        {
          href: "/learn",
          label: "Dashboard",
          icon: BookOpen,
          isActive: pathname === "/learn",
        },
        {
          href: "/learn/progress",
          label: "Progress",
          icon: BarChart3,
          isActive: pathname === "/learn/progress",
        },
        {
          href: "/learn/audiobooks",
          label: "Audiobooks",
          icon: Headphones,
          isActive: pathname.startsWith("/learn/audiobooks"),
        },
      ],
    },
    continueSection,
    {
      title: "Account",
      items: [
        {
          href: "/account",
          label: "Profile",
          icon: User,
          isActive: pathname === "/account",
        },
        {
          href: "/account/billing",
          label: "Billing",
          icon: CreditCard,
          isActive: pathname.startsWith("/account/billing"),
        },
        {
          href: "/account/purchases",
          label: "Purchases",
          icon: Headphones,
          isActive: pathname.startsWith("/account/purchases"),
        },
        {
          href: "/account/settings",
          label: "Settings",
          icon: Settings,
          isActive: pathname === "/account/settings",
        },
      ],
    },
  ];

  // Add management sections based on role
  if (role === 'partnership_manager' || role === 'admin') {
    navSections.push({
      title: "Management",
      items: [
        {
          href: "/partnership",
          label: "Partnership",
          icon: Users,
          isActive: pathname.startsWith("/partnership"),
        },
      ],
    });
  }

  if (role === 'admin') {
    navSections[navSections.length - 1].items.push({
      href: "/admin",
      label: "Admin Panel",
      icon: Shield,
      isActive: pathname.startsWith("/admin"),
    });
  }

  const renderNavItem = (item: NavItem, index: number) => {
    const isNavigating = pendingHref === item.href;
    const IconComponent = isNavigating ? Loader2 : item.icon;

    return (
      <Link
        key={`${item.href}-${index}`}
        href={item.href}
        onClick={(e) => handleNavigation(item.href, e)}
        className={`flex items-center p-2 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
          isCollapsed && !isMobile ? "justify-center" : ""
        } ${
          item.isActive
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        } ${isNavigating ? "opacity-75" : ""}`}
        title={textHidden ? item.label : undefined}
      >
        <IconComponent
          size={iconSize}
          className={`transition-all duration-200 ${textHidden ? "" : "mr-3"} ${
            item.isActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
          } ${isNavigating ? "animate-spin" : ""}`}
        />
        {textHidden && continueData && item.label.includes("Continue") && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {continueData.lessonTitle}
          </div>
        )}
        {!textHidden && (
          <>
            <span
              className="flex-1 truncate"
              title={item.label.length > 20 ? item.label : undefined}
            >
              {item.label}
            </span>
            {item.badge && (
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full shrink-0 ${
                  item.badge === "✓"
                    ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
        {isNavigating && (
          <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg" />
        )}
      </Link>
    );
  };

  return (
    <nav
      className={`flex-1 py-4 px-2 space-y-6 overflow-y-auto transition-all duration-200 ${
        continueLoading ? "opacity-75" : "opacity-100"
      }`}
    >
      {navSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {section.title && !textHidden && (
            <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
              {section.title}
              {section.isLoading && (
                <Loader2 size={12} className="ml-2 animate-spin" />
              )}
            </h3>
          )}
          <div className="space-y-1">
            {section.isLoading ? (
              <NavigationSkeleton isCollapsed={textHidden} count={3} />
            ) : (
              section.items.map((item, itemIndex) =>
                renderNavItem(item, itemIndex)
              )
            )}
          </div>
        </div>
      ))}

      {/* Quick Stats - Only show when not collapsed */}
      {!textHidden && userStats && (
        <div className="px-2 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Quick Stats
          </h4>
          <div className="space-y-2 text-sm">
            <AnimatedStats
              streak={userStats.currentStreak}
              points={userStats.totalPoints}
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationSection;
