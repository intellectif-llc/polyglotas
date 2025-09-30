"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLanguages } from "@/hooks/useLanguages";

interface OnboardingData {
  firstName: string;
  lastName: string;
  nativeLanguage: string;
  targetLanguage: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  initialData?: Partial<OnboardingData>;
  onComplete: () => void;
}

export default function OnboardingModal({
  isOpen,
  initialData,
  onComplete,
}: OnboardingModalProps) {
  const [formData, setFormData] = useState<OnboardingData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    nativeLanguage: initialData?.nativeLanguage || "",
    targetLanguage: initialData?.targetLanguage || "",
  });
  
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);

  const { data: languages = [] } = useLanguages();
  const queryClient = useQueryClient();
  
  // Set default languages when languages are loaded
  useEffect(() => {
    if (languages.length > 0 && !initialData?.nativeLanguage && !initialData?.targetLanguage) {
      const spanish = languages.find(lang => lang.language_code === 'es');
      const english = languages.find(lang => lang.language_code === 'en');
      
      if (spanish && english) {
        setFormData(prev => ({
          ...prev,
          nativeLanguage: spanish.language_code,
          targetLanguage: english.language_code,
        }));
      }
    }
  }, [languages, initialData]);
  
  // Check for same language selection
  useEffect(() => {
    if (formData.nativeLanguage && formData.targetLanguage) {
      setShowLanguageWarning(formData.nativeLanguage === formData.targetLanguage);
    } else {
      setShowLanguageWarning(false);
    }
  }, [formData.nativeLanguage, formData.targetLanguage]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
        })
        .eq("id", session.user.id);

      if (profileError) throw profileError;

      // Update student_profiles table
      const { error: studentProfileError } = await supabase
        .from("student_profiles")
        .update({
          native_language_code: data.nativeLanguage,
          current_target_language_code: data.targetLanguage,
        })
        .eq("profile_id", session.user.id);

      if (studentProfileError) throw studentProfileError;

      // Add target language to student_target_languages table
      const { error: targetLanguageError } = await supabase
        .from("student_target_languages")
        .upsert({
          profile_id: session.user.id,
          language_code: data.targetLanguage,
        });

      if (targetLanguageError) throw targetLanguageError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userName"] });
      onComplete();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if same language is selected
    if (formData.nativeLanguage === formData.targetLanguage) {
      setShowLanguageWarning(true);
      return;
    }
    
    if (
      formData.firstName &&
      formData.lastName &&
      formData.nativeLanguage &&
      formData.targetLanguage
    ) {
      updateProfileMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">P</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Polyglotas!
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Let&apos;s set up your profile to get started on your language
            learning journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white focus:border-blue-300/50 hover:bg-gray-100/60 hover:border-gray-300/60 transition-all duration-200 text-gray-900 placeholder-gray-500 cursor-text"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-semibold text-gray-800 mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white focus:border-blue-300/50 hover:bg-gray-100/60 hover:border-gray-300/60 transition-all duration-200 text-gray-900 placeholder-gray-500 cursor-text"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="nativeLanguage"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              🏠 Tu idioma nativo
            </label>
            <select
              id="nativeLanguage"
              value={formData.nativeLanguage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  nativeLanguage: e.target.value,
                }))
              }
              className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white hover:bg-gray-100/60 transition-all duration-200 text-gray-900 appearance-none cursor-pointer ${
                showLanguageWarning && formData.nativeLanguage === formData.targetLanguage
                  ? "border-red-300 focus:border-red-300/50 hover:border-red-300/60"
                  : "border-gray-200/50 focus:border-blue-300/50 hover:border-gray-300/60"
              }`}
              required
            >
              <option value="">Select your native language</option>
              {languages.map((lang) => (
                <option key={lang.language_code} value={lang.language_code}>
                  {lang.language_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="targetLanguage"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              🎯 El idioma que quieres aprender
            </label>
            <select
              id="targetLanguage"
              value={formData.targetLanguage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  targetLanguage: e.target.value,
                }))
              }
              className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white hover:bg-gray-100/60 transition-all duration-200 text-gray-900 appearance-none cursor-pointer ${
                showLanguageWarning && formData.nativeLanguage === formData.targetLanguage
                  ? "border-red-300 focus:border-red-300/50 hover:border-red-300/60"
                  : "border-gray-200/50 focus:border-blue-300/50 hover:border-gray-300/60"
              }`}
              required
            >
              <option value="">Select language to learn</option>
              {languages.map((lang) => (
                <option key={lang.language_code} value={lang.language_code}>
                  {lang.language_name}
                </option>
              ))}
            </select>
          </div>

          {/* Same Language Warning */}
          {showLanguageWarning && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-amber-600 text-lg">⚠️</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">
                    Same Language Selected
                  </h4>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    You&apos;ve selected the same language for both native and target languages. 
                    Our translation system requires different languages to work properly. 
                    Please select a different target language to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {updateProfileMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Setting up...</span>
              </div>
            ) : (
              "Get Started 🚀"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
