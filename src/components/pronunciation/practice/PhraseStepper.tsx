"use client";

import React from 'react';
import { Phrase } from '@/types/pronunciation';

interface PhraseStepperProps {
  phrases: Phrase[];
  currentPhraseIndex: number;
  onSelectPhrase: (index: number) => void;
  activityType?: 'dictation' | 'practice';
}

const PhraseStepper: React.FC<PhraseStepperProps> = ({ phrases, currentPhraseIndex, onSelectPhrase, activityType = 'practice' }) => {
  const getStepperColor = (phrase: Phrase, index: number) => {
    if (index === currentPhraseIndex) {
      return 'bg-indigo-600';
    }
    
    const isCompleted = activityType === 'dictation' 
      ? phrase.dictation_completed 
      : phrase.pronunciation_completed;
    
    if (isCompleted) {
      return 'bg-green-500';
    }
    
    return 'bg-gray-300 hover:bg-gray-400';
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {phrases.map((phrase, index) => (
        <button
          key={phrase.id}
          onClick={() => onSelectPhrase(index)}
          className={`w-8 h-2 rounded-full transition-colors ${getStepperColor(phrase, index)}`}
          aria-label={`Go to phrase ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default PhraseStepper;
