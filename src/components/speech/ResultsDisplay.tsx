"use client";

import React from "react";
import FeedbackTabs from "./FeedbackTabs";
import { UIStateType } from "@/hooks/speech/useRecognitionState";
import { AssessmentResults } from "@/hooks/speech/useRecognitionState";

interface ResultsDisplayProps {
  results: AssessmentResults | null;
  errorMessages?: string[];
  uiState: UIStateType;
}

function ResultsDisplay({
  results,
  errorMessages = [],
  uiState,
}: ResultsDisplayProps) {
  const renderErrorMessages = () => {
    if (errorMessages.length === 0) return null;

    return (
      <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        <h3 className="font-bold">Errors:</h3>
        <ul className="list-disc list-inside">
          {errorMessages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderResults = () => {
    let displayResults = null;
    let title = "Assessment Results";

    if (uiState === "DisplayingResults" && results) {
      displayResults = results;
      title = "Latest Attempt Results";
    }

    if (!displayResults) {
      if (!errorMessages?.length) {
        return (
          <div className="mt-6 p-4 text-center text-gray-500">
            No assessment results to display yet.
          </div>
        );
      }
      return null;
    }

    const { words = [], isScripted = true, omittedWords = [] } = displayResults;

    return (
      <div className="mt-6 border border-gray-700 rounded-lg shadow-xl bg-gray-900 overflow-hidden">
        <h2 className="text-xl font-semibold p-4 text-center border-b border-gray-700 text-white bg-gray-800">
          {title} {!isScripted && "(Unscripted Mode)"}
        </h2>

        {/* OMITTED WORDS SECTION - Display if we detected omissions and in scripted mode */}
        {isScripted && omittedWords && omittedWords.length > 0 && (
          <div className="mx-4 my-3 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
            <h3 className="font-bold text-orange-400 mb-2">Omitted Words:</h3>
            <div className="flex flex-wrap gap-2">
              {omittedWords.map((word, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-800/40 text-orange-300 rounded-full text-sm font-medium border border-orange-600/30"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabbed detailed feedback - Pass the selected results and score gauge size */}
        <FeedbackTabs
          results={displayResults}
          words={words}
          recognizedText={displayResults.recognizedText || ""}
          referenceText={displayResults.referenceText || ""}
          scoreGaugesSize="small"
        />
      </div>
    );
  };

  return (
    <div>
      {renderResults()}
      {renderErrorMessages()}
    </div>
  );
}

export default ResultsDisplay;
