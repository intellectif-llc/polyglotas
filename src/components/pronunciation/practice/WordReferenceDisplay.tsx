"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import WordTooltip from "@/components/speech/WordTooltip";

interface WordReferenceDisplayProps {
  word: string;
}

const WordReferenceDisplay: React.FC<WordReferenceDisplayProps> = ({
  word,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [tooltipConfig, setTooltipConfig] = useState<{
    visible: boolean;
    selectedText: string;
    triggerElement: HTMLElement | null;
  }>({
    visible: false,
    selectedText: "",
    triggerElement: null,
  });

  const messageContentRef = useRef<HTMLDivElement>(null);

  // Check for Speech Synthesis support
  useEffect(() => {
    setSpeechSupported("speechSynthesis" in window);
  }, []);

  const closeTooltip = useCallback(() => {
    setTooltipConfig({
      visible: false,
      selectedText: "",
      triggerElement: null,
    });
  }, []);

  // Close tooltip when word changes
  useEffect(() => {
    closeTooltip();
  }, [word, closeTooltip]);

  // Text selection for translation tooltip
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (
        selectedText &&
        selection &&
        selection.anchorNode &&
        messageContentRef.current?.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const containerRect = messageContentRef.current.getBoundingClientRect();

        // Create a trigger element for the tooltip
        const trigger = document.createElement("div");
        trigger.style.position = "absolute";
        trigger.style.left = `${rect.left + window.scrollX}px`;
        trigger.style.top = `${rect.top + window.scrollY}px`;
        trigger.style.width = `${rect.width}px`;
        trigger.style.height = `${rect.height}px`;
        trigger.style.pointerEvents = "none";
        trigger.style.zIndex = "1";

        // Store positioning data
        trigger.dataset.containerTop = containerRect.top.toString();
        trigger.dataset.containerLeft = containerRect.left.toString();
        trigger.dataset.containerWidth = containerRect.width.toString();
        trigger.dataset.selectionWidth = rect.width.toString();
        trigger.dataset.selectionHeight = rect.height.toString();

        setTooltipConfig({
          visible: true,
          selectedText: selectedText,
          triggerElement: trigger,
        });
      } else {
        if (tooltipConfig.visible) {
          closeTooltip();
        }
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [tooltipConfig.visible, closeTooltip]);

  // Speech synthesis playback
  const togglePlayback = useCallback(() => {
    if (!speechSupported) {
      console.warn("Speech synthesis not supported in this browser");
      return;
    }

    // Stop any current speech
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(word);
    speechRef.current = utterance;

    // Configure speech parameters for better pronunciation
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a native English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find(
        (voice) => voice.lang.startsWith("en") && voice.localService
      ) || voices.find((voice) => voice.lang.startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // Set up event handlers
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      console.error("Speech synthesis error");
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  }, [word, isPlaying, speechSupported]);

  // Cleanup speech on unmount or word change
  useEffect(() => {
    return () => {
      if (speechRef.current && isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [word, isPlaying]);

  return (
    <div className="word-reference-container text-center mb-6 relative">
      {/* Word Display */}
      <div
        ref={messageContentRef}
        className="text-4xl font-bold text-gray-800 mb-4 inline-block align-middle select-text cursor-text px-6 py-4 rounded-xl hover:bg-gray-50 transition-colors"
        style={{ userSelect: "text" }}
      >
        {word}
      </div>

      {/* Pronunciation Button */}
      <div className="flex justify-center">
        {speechSupported ? (
          <button
            onClick={togglePlayback}
            className={`
              cursor-pointer p-4 rounded-full transition-all duration-200 ease-in-out
              shadow-sm hover:shadow-md transform hover:scale-105
              inline-flex items-center justify-center w-14 h-14
              ${
                isPlaying
                  ? "bg-blue-100 text-blue-700 border-2 border-blue-300 animate-pulse"
                  : "bg-blue-50 text-blue-600 border-2 border-blue-200 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300"
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            `}
            aria-label={isPlaying ? "Stop pronunciation" : "Play pronunciation"}
            title="Listen to pronunciation"
            disabled={isPlaying}
          >
            <Volume2 className="h-7 w-7" />
          </button>
        ) : (
          <div className="flex items-center justify-center p-4 text-gray-400">
            <VolumeX className="h-7 w-7 mr-2" />
            <span className="text-sm">Audio not available</span>
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-sm text-gray-500 mt-3">
        Click the speaker to hear pronunciation • Select text for translation
      </p>

      {/* Translation Tooltip */}
      {tooltipConfig.visible && (
        <WordTooltip
          selectedText={tooltipConfig.selectedText}
          onClose={closeTooltip}
          triggerElement={tooltipConfig.triggerElement}
        />
      )}
    </div>
  );
};

export default WordReferenceDisplay;
