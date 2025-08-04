"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2 } from "lucide-react";
import WordTooltip from "@/components/speech/WordTooltip";

interface ReferenceTextDisplayProps {
  text: string;
  audioUrl?: string;
  phraseId: number;
  lessonId?: string | number;
}

const ReferenceTextDisplay: React.FC<ReferenceTextDisplayProps> = ({
  text,
  audioUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const closeTooltip = useCallback(() => {
    setTooltipConfig({
      visible: false,
      selectedText: "",
      triggerElement: null,
    });
  }, []);

  // Close tooltip when text changes (phrase navigation)
  useEffect(() => {
    closeTooltip();
  }, [text, closeTooltip]);

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

        // Create a more precise trigger element positioned relative to the container
        const trigger = document.createElement("div");
        trigger.style.position = "absolute";
        trigger.style.left = `${rect.left + window.scrollX}px`;
        trigger.style.top = `${rect.top + window.scrollY}px`;
        trigger.style.width = `${rect.width}px`;
        trigger.style.height = `${rect.height}px`;
        trigger.style.pointerEvents = "none";
        trigger.style.zIndex = "1";
        
        // Store additional positioning data
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

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audio) {
        audio.onended = null;
      }
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((e) => console.error("Error playing audio:", e));
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <div className="reference-text-container text-center mb-4 relative">
      <div
        ref={messageContentRef}
        className="text-3xl font-bold text-gray-800 mb-2 inline-block align-middle mr-3 select-text cursor-text px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        style={{ userSelect: "text" }}
      >
        {text}
      </div>

      <div className="flex items-center justify-center gap-3 my-3">
        {audioUrl && (
          <>
            <audio ref={audioRef} src={audioUrl} preload="auto" />
            <button
              onClick={togglePlayback}
              className={`
                cursor-pointer p-3 rounded-full 
                bg-blue-50 text-blue-600 border border-blue-200
                hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                w-12 h-12
              `}
              aria-label={
                isPlaying ? "Pause phrase audio" : "Play phrase audio"
              }
              title="Listen to phrase"
            >
              <Volume2 className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

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

export default ReferenceTextDisplay;
