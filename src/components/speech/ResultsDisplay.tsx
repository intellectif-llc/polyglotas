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

    const {
      words = [],
      isScripted = true,
    } = displayResults;

    return (
      <div className="mt-6 border rounded-lg shadow-sm bg-white overflow-hidden">
        <h2 className="text-xl font-semibold p-4 text-center border-b">
          {title} {!isScripted && "(Unscripted Mode)"}
        </h2>

        {/* Score Gauges - Disabled for now */}

        {/* Detailed Feedback Tabs */}
        <div className="p-4">
          <FeedbackTabs
            results={displayResults}
            words={words}
            recognizedText={displayResults.recognizedText || ""}
            referenceText={displayResults.referenceText || ""}
          />
        </div>
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
