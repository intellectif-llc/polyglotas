/* "use client";

import React, { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";

interface SuggestedAnswerProps {
  suggestion: string;
  onUseSuggestion: (suggestion: string) => void;
}

export default function SuggestedAnswer({
  suggestion,
  onUseSuggestion,
}: SuggestedAnswerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!suggestion) return null;

  const handleUseSuggestion = () => {
    onUseSuggestion(suggestion);
    setIsExpanded(false);
  };

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
      >
        <Lightbulb size={12} />
        <span>Need help? Get a suggestion</span>
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {isExpanded && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-gray-700 mb-2">
            <strong>Sample response:</strong>
          </div>
          <div className="text-sm text-gray-800 mb-3 italic">
            &ldquo;{suggestion}&rdquo;
          </div>
          <button
            onClick={handleUseSuggestion}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Use this response
          </button>
        </div>
      )}
    </div>
  );
}
 */
