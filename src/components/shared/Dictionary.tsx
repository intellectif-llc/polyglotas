"use client";

import React, { useState, useRef, useEffect } from "react";
import { BookOpen, Search, Volume2, X, AlertCircle } from "lucide-react";
import { useDictionary } from "@/hooks/useDictionary";

export default function Dictionary() {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    isOpen,
    searchTerm,
    result,
    isLoading,
    error,
    isDictionaryAvailable,
    search,
    open,
    close,
    playPronunciation,
    retry,
  } = useDictionary();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Don't render if dictionary is not available for current language
  if (!isDictionaryAvailable) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      search(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
    }
  };

  return (
    <>
      {/* Floating Dictionary Button */}
      <button
        onClick={open}
        className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
        aria-label="Open dictionary"
      >
        <BookOpen size={20} />
      </button>

      {/* Dictionary Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200"
            onClick={close}
          />

          {/* Modal */}
          <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out animate-in slide-in-from-bottom-full md:bottom-4 md:right-4 md:left-auto md:w-96 md:rounded-2xl md:animate-in md:slide-in-from-bottom-4"
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                Dictionary
              </h2>
              <button
                onClick={close}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close dictionary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="p-4 border-b border-gray-100"
            >
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Search for a word..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
              </div>
            </form>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <AlertCircle
                    size={48}
                    className="mx-auto text-red-400 mb-3"
                  />
                  <p className="text-gray-600 mb-3">
                    {error instanceof Error
                      ? error.message
                      : "Failed to search word"}
                  </p>
                  <button
                    onClick={() => retry()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Try again
                  </button>
                </div>
              )}

              {searchTerm && !isLoading && !error && !result && (
                <div className="text-center py-8">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">
                    No definition found for &ldquo;{searchTerm}&rdquo;
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Word and Pronunciation */}
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 capitalize">
                        {result.word}
                      </h3>
                      {result.audioUrl && (
                        <button
                          onClick={() => playPronunciation(result.audioUrl!)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                          aria-label="Play pronunciation"
                        >
                          <Volume2 size={18} />
                        </button>
                      )}
                    </div>
                    {result.phonetic && (
                      <p className="text-gray-500 text-sm font-mono">
                        {result.phonetic}
                      </p>
                    )}
                  </div>

                  {/* Meanings */}
                  <div className="space-y-3">
                    {result.meanings.map((meaning, index) => (
                      <div key={index}>
                        <h4 className="text-sm font-semibold text-blue-600 mb-2 italic">
                          {meaning.partOfSpeech}
                        </h4>
                        <ul className="space-y-1">
                          {meaning.definitions.map((definition, defIndex) => (
                            <li
                              key={defIndex}
                              className="text-sm text-gray-700 leading-relaxed"
                            >
                              <span className="text-gray-400 mr-2">•</span>
                              {definition}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!searchTerm && !isLoading && (
                <div className="text-center py-8">
                  <Search size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    Search for any English word to see its definition
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
