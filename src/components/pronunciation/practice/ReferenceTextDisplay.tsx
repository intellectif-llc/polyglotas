"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, Turtle } from "lucide-react";
import WordTooltip from "@/components/speech/WordTooltip";

interface ReferenceTextDisplayProps {
  text: string;
  audioUrlNormal?: string;
  audioUrlSlow?: string;
  phraseId: number;
  lessonId?: string | number;
}

const ReferenceTextDisplay: React.FC<ReferenceTextDisplayProps> = ({
  text,
  audioUrlNormal,
  audioUrlSlow,
}) => {
  const [isPlayingNormal, setIsPlayingNormal] = useState(false);
  const [isPlayingSlow, setIsPlayingSlow] = useState(false);
  const audioNormalRef = useRef<HTMLAudioElement>(null);
  const audioSlowRef = useRef<HTMLAudioElement>(null);

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
    const audioNormal = audioNormalRef.current;
    const audioSlow = audioSlowRef.current;
    
    if (audioNormal) {
      audioNormal.onended = () => setIsPlayingNormal(false);
    }
    if (audioSlow) {
      audioSlow.onended = () => setIsPlayingSlow(false);
    }
    
    return () => {
      if (audioNormal) {
        audioNormal.onended = null;
      }
      if (audioSlow) {
        audioSlow.onended = null;
      }
    };
  }, []);

  const toggleNormalPlayback = useCallback(() => {
    const audio = audioNormalRef.current;
    const audioSlow = audioSlowRef.current;
    if (!audio) return;

    // Stop slow audio if playing
    if (isPlayingSlow && audioSlow) {
      audioSlow.pause();
      setIsPlayingSlow(false);
    }

    if (isPlayingNormal) {
      audio.pause();
      setIsPlayingNormal(false);
    } else {
      audio.play().catch((e) => console.error("Error playing normal audio:", e));
      setIsPlayingNormal(true);
    }
  }, [isPlayingNormal, isPlayingSlow]);

  const toggleSlowPlayback = useCallback(() => {
    const audio = audioSlowRef.current;
    const audioNormal = audioNormalRef.current;
    if (!audio) return;

    // Stop normal audio if playing
    if (isPlayingNormal && audioNormal) {
      audioNormal.pause();
      setIsPlayingNormal(false);
    }

    if (isPlayingSlow) {
      audio.pause();
      setIsPlayingSlow(false);
    } else {
      audio.play().catch((e) => console.error("Error playing slow audio:", e));
      setIsPlayingSlow(true);
    }
  }, [isPlayingSlow, isPlayingNormal]);

  return (
    <div className="reference-text-container text-center mb-4 relative">
      <div
        ref={messageContentRef}
        className="text-3xl font-bold text-gray-800 mb-2 inline-block align-middle mr-3 select-text cursor-text px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        style={{ userSelect: "text" }}
        data-tour="reference-text"
      >
        {text}
      </div>

      <div className="flex items-center justify-center gap-3 my-3">
        {/* Normal Speed Audio */}
        {audioUrlNormal && (
          <>
            <audio ref={audioNormalRef} src={audioUrlNormal} preload="auto" />
            <button
              onClick={toggleNormalPlayback}
              className={`
                cursor-pointer p-3 rounded-full 
                ${isPlayingNormal 
                  ? 'bg-blue-100 text-blue-700 border-blue-300' 
                  : 'bg-blue-50 text-blue-600 border-blue-200'
                }
                hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                w-12 h-12
              `}
              aria-label={
                isPlayingNormal ? "Pause normal speed audio" : "Play normal speed audio"
              }
              title="Listen at normal speed"
              data-tour="normal-audio"
            >
              <Volume2 className="h-6 w-6" />
            </button>
          </>
        )}
        
        {/* Slow Speed Audio */}
        {audioUrlSlow && (
          <>
            <audio ref={audioSlowRef} src={audioUrlSlow} preload="auto" />
            <button
              onClick={toggleSlowPlayback}
              className={`
                cursor-pointer p-3 rounded-full 
                ${isPlayingSlow 
                  ? 'bg-orange-100 text-orange-700 border-orange-300' 
                  : 'bg-orange-50 text-orange-600 border-orange-200'
                }
                hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 
                transition-all duration-200 ease-in-out
                shadow-sm hover:shadow
                inline-flex items-center justify-center
                w-12 h-12 relative
              `}
              aria-label={
                isPlayingSlow ? "Pause slow speed audio" : "Play slow speed audio"
              }
              title="Listen at slow speed"
              data-tour="slow-audio"
            >
              <Turtle className="h-5 w-5" />
              <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-orange-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                S
              </span>
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
