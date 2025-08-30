"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";

interface WordTooltipProps {
  selectedText: string;
  onClose: () => void;
  triggerElement: HTMLElement | null;
}

const WordTooltip: React.FC<WordTooltipProps> = ({
  selectedText,
  onClose,
  triggerElement,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const translateText = async () => {
      if (!selectedText) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: selectedText }),
        });
        if (!response.ok) {
          throw new Error("Failed to translate text.");
        }
        const data = await response.json();
        setTranslation(data.translation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Translation failed');
      } finally {
        setIsLoading(false);
      }
    };
    translateText();
  }, [selectedText]);

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);

    if (!triggerElement) return;

    const calculatePosition = () => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Get stored positioning data
      const triggerLeft = parseFloat(triggerElement.style.left) || 0;
      const triggerTop = parseFloat(triggerElement.style.top) || 0;
      const triggerWidth = parseFloat(triggerElement.style.width) || 0;
      const triggerHeight = parseFloat(triggerElement.style.height) || 0;

      if (mobile) {
        // Mobile: position as overlay near the phrase
        setPosition({
          top: triggerTop + triggerHeight + 8,
          left: Math.max(16, Math.min(triggerLeft, viewport.width - 320 - 16)),
        });
      } else {
        // Desktop: position directly above or below the selected text
        const tooltipWidth = 280;
        const tooltipHeight = 100;
        
        // Center tooltip horizontally on the selected text
        let left = triggerLeft + (triggerWidth - tooltipWidth) / 2;
        let top = triggerTop - tooltipHeight - 8;

        // If tooltip would go above viewport, position below
        if (top < scrollY + 8) {
          top = triggerTop + triggerHeight + 8;
        }
        
        // Keep tooltip within viewport horizontally
        if (left < scrollX + 8) {
          left = scrollX + 8;
        } else if (left + tooltipWidth > scrollX + viewport.width - 8) {
          left = scrollX + viewport.width - tooltipWidth - 8;
        }

        setPosition({ top, left });
      }
    };

    // Immediate positioning for better UX
    calculatePosition();
    setIsVisible(true);

    const handleResize = () => {
      calculatePosition();
    };

    const handleScroll = () => {
      calculatePosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [triggerElement, isMobile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const tooltipContent = (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      <div
        ref={tooltipRef}
        className={`fixed z-[10000] p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl transition-all duration-150 ${
          isMobile 
            ? "w-[calc(100vw-2rem)] max-w-sm" 
            : "w-70 max-w-[280px]"
        } ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transformOrigin: "center",
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-white text-sm pr-2 truncate">
            &quot;{selectedText}&quot;
          </h4>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-0.5 rounded hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close tooltip"
          >
            <X size={14} />
          </button>
        </div>
        <div className="text-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="animate-spin text-white" size={16} />
            </div>
          ) : error ? (
            <div className="text-red-400 text-xs">{error}</div>
          ) : (
            <div className="text-blue-300 font-medium">{translation}</div>
          )}
        </div>
      </div>
    </>
  );

  return typeof window !== "undefined"
    ? createPortal(tooltipContent, document.body)
    : null;
};

export default WordTooltip;
