"use client";

import React from "react";
import { Settings, Globe, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
            <Settings size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Customize your learning experience</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Language Settings */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="text-blue-600" size={24} />
              <h2 className="text-lg font-semibold text-gray-900">Language Settings</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-4">
                Language preferences and learning targets will be available soon.
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Manage Languages
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="text-green-600" size={24} />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-4">
                Configure your learning reminders and progress notifications.
              </p>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Notification Settings
              </button>
            </div>
          </div>

          {/* Privacy & Security */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="text-red-600" size={24} />
              <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-4">
                Manage your account security and privacy preferences.
              </p>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Security Settings
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="text-purple-600" size={24} />
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-4">
                Customize the app&apos;s appearance and theme preferences.
              </p>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Theme Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}