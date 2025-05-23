"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Folder,
  ChevronsLeft,
  ChevronsRight,
  Menu,
} from "lucide-react";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 flex flex-col ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700 px-4">
        {!isCollapsed && (
          <span className="text-xl font-semibold text-gray-800 dark:text-white">
            Polyglotas
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronsRight size={20} />
          ) : (
            <ChevronsLeft size={20} />
          )}
        </button>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-2">
        <Link
          href="/learn"
          className="flex items-center p-2 text-base font-normal rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group"
        >
          <BookOpen
            size={isCollapsed ? 24 : 20}
            className={`transition-all duration-300 ${
              isCollapsed ? "mx-auto" : "mr-3"
            } text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white`}
          />
          {!isCollapsed && (
            <span className="flex-1 whitespace-nowrap">Dashboard</span>
          )}
        </Link>
        {/* Placeholder for future items. The three folder icons suggest a hierarchy. */}
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center p-2 text-base font-normal rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer"
          >
            <Folder
              size={isCollapsed ? 24 : 20}
              className={`transition-all duration-300 ${
                isCollapsed ? "mx-auto" : "mr-3"
              } text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white`}
            />
            {!isCollapsed && (
              <span className="flex-1 whitespace-nowrap">
                Course Item {item}
              </span>
            )}
          </div>
        ))}
      </nav>
      {/* Mobile menu button - can be moved to header if preferred */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
