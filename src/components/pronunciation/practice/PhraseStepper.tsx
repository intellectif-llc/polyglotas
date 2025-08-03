"use client";

import React from 'react';
import { Phrase } from '@/types/pronunciation';

interface PhraseStepperProps {
  phrases: Phrase[];
  currentPhraseIndex: number;
  onSelectPhrase: (index: number) => void;
}

const PhraseStepper: React.FC<PhraseStepperProps> = ({ phrases, currentPhraseIndex, onSelectPhrase }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {phrases.map((phrase, index) => (
        <button
          key={phrase.id}
          onClick={() => onSelectPhrase(index)}
          className={`w-8 h-2 rounded-full transition-colors ${
            index === currentPhraseIndex ? 'bg-indigo-600' : 'bg-gray-300 hover:bg-gray-400'
          }`}
          aria-label={`Go to phrase ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default PhraseStepper;
