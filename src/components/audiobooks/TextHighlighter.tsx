'use client';

import { useMemo, useRef, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { AlignmentData } from '@/types/audiobooks';
import WordTooltip from '@/components/speech/WordTooltip';

interface TextHighlighterProps {
  alignment: AlignmentData | null;
  currentWordIndex: number;
  nextWordIndex: number;
  showText: boolean;
  chapterScript: string;
  chapterTitle: string;
  tooltipConfig: {
    visible: boolean;
    selectedText: string;
    triggerElement: HTMLElement | null;
  };
  onTextSelection: (text: string, element: HTMLElement) => void;
  onCloseTooltip: () => void;
}

export default function TextHighlighter({
  alignment,
  currentWordIndex,
  nextWordIndex,
  showText,
  chapterScript,
  chapterTitle,
  tooltipConfig,
  onTextSelection,
  onCloseTooltip
}: TextHighlighterProps) {
  const textDisplayRef = useRef<HTMLDivElement>(null);

  const renderedText = useMemo(() => {
    if (!alignment || !showText) return null;

    const paragraphs: React.ReactNode[][] = [];
    let currentParagraph: React.ReactNode[] = [];

    alignment.words_data.forEach((word, index) => {
      const isCurrentWord = index === currentWordIndex;
      const isNextWord = index === nextWordIndex;
      const isPastWord = index < currentWordIndex;

      // Skip whitespace characters with high loss scores that cause highlighting gaps
      if (word.text === '\r' || word.text === '\n' || (word.text.trim() === '' && word.loss > 1)) {
        if (currentParagraph.length > 0) {
          paragraphs.push([...currentParagraph]);
          currentParagraph = [];
        }
        return;
      }

      const displayText = word.text.replace(/\\'/g, "'").replace(/\\"/g, '"');

      currentParagraph.push(
        <span
          key={index}
          className={`transition-all duration-200 ${
            isCurrentWord
              ? 'bg-yellow-300 text-black font-medium'
              : isNextWord
              ? 'bg-yellow-100 text-gray-800'
              : isPastWord
              ? 'text-gray-500'
              : 'text-gray-900'
          }`}
        >
          {displayText}
        </span>
      );

      if (!displayText.match(/[.!?]$/)) {
        currentParagraph.push(' ');
      }
    });

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return (
      <div className="text-lg leading-relaxed space-y-4">
        {paragraphs.map((paragraph, pIndex) => (
          <p key={pIndex} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }, [alignment, currentWordIndex, nextWordIndex, showText]);

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (
        selectedText &&
        selection &&
        selection.anchorNode &&
        textDisplayRef.current?.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const trigger = document.createElement('div');
        trigger.style.position = 'absolute';
        trigger.style.left = `${rect.left + window.scrollX}px`;
        trigger.style.top = `${rect.top + window.scrollY}px`;
        trigger.style.width = `${rect.width}px`;
        trigger.style.height = `${rect.height}px`;
        trigger.style.pointerEvents = 'none';
        trigger.style.zIndex = '1';

        onTextSelection(selectedText, trigger);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [onTextSelection]);

  if (!showText) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-indigo-600" />
        <h2 className="text-xl font-semibold text-gray-900">Read Along</h2>
      </div>

      <div className="mb-4 pb-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">{chapterTitle}</h3>
      </div>

      <div
        className="prose max-w-none"
        ref={textDisplayRef}
        style={{ userSelect: 'text' }}
      >
        {alignment ? (
          renderedText
        ) : chapterScript ? (
          <div className="text-lg leading-relaxed whitespace-pre-line text-gray-800">
            {chapterScript}
          </div>
        ) : (
          <p className="text-gray-500 italic">No text available</p>
        )}
      </div>

      {tooltipConfig.visible && (
        <WordTooltip
          selectedText={tooltipConfig.selectedText}
          onClose={onCloseTooltip}
          triggerElement={tooltipConfig.triggerElement}
        />
      )}
    </div>
  );
}