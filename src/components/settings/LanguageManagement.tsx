"use client";

import React, { useState } from "react";
import { Globe, Check, Loader2 } from "lucide-react";
import { useLanguages } from "@/hooks/useLanguages";
import { useUserProfile, useUpdateNativeLanguage } from "@/hooks/useUserProfile";

interface LanguageManagementProps {
  onClose: () => void;
}

export default function LanguageManagement({ onClose }: LanguageManagementProps) {
  const { data: languages, isLoading: languagesLoading } = useLanguages();
  const { data: profile } = useUserProfile();
  const updateNativeLanguage = useUpdateNativeLanguage();
  const [selectedNativeLanguage, setSelectedNativeLanguage] = useState(
    profile?.native_language_code || ""
  );

  const handleSave = async () => {
    if (selectedNativeLanguage && selectedNativeLanguage !== profile?.native_language_code) {
      try {
        await updateNativeLanguage.mutateAsync(selectedNativeLanguage);
        onClose();
      } catch (error) {
        console.error("Failed to update native language:", error);
      }
    } else {
      onClose();
    }
  };

  const targetLanguage = languages?.find(
    lang => lang.language_code === profile?.current_target_language_code
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center space-x-3 mb-6">
          <Globe className="text-blue-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-900">Manage Languages</h2>
        </div>

        <div className="space-y-6">
          {/* Target Language (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Language
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-900">
                  {targetLanguage?.language_name || "English"} ({profile?.current_target_language_code?.toUpperCase() || "EN"})
                </span>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  Default
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Currently only English is supported as target language
            </p>
          </div>

          {/* Native Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Native Language
            </label>
            {languagesLoading ? (
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-gray-500">Loading languages...</span>
                </div>
              </div>
            ) : (
              <select
                value={selectedNativeLanguage}
                onChange={(e) => setSelectedNativeLanguage(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select your native language</option>
                {languages?.map((language) => (
                  <option key={language.language_code} value={language.language_code}>
                    {language.language_name} ({language.language_code.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={updateNativeLanguage.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateNativeLanguage.isPending || !selectedNativeLanguage}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {updateNativeLanguage.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}