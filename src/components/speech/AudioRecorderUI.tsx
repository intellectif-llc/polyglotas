"use client";

import React from "react";
import { FaMicrophone, FaStopCircle, FaSpinner } from "react-icons/fa";
import FeedbackMessage from "./FeedbackMessage";
import { UIStateType } from "@/hooks/speech/useRecognitionState";
import { AssessmentResults } from "@/hooks/speech/useRecognitionState";

interface AudioRecorderUIProps {
  uiState: UIStateType;
  isSaving?: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  assessmentResults: AssessmentResults | null;
  className?: string;
}

function AudioRecorderUI({
  uiState,
  isSaving = false,
  onStartRecording,
  onStopRecording,
  assessmentResults,
  className = "",
}: AudioRecorderUIProps) {
  const getButtonContent = () => {
    if (isSaving) {
      return (
        <button
          disabled
          className="flex items-center justify-center px-6 py-3 bg-yellow-500 text-white rounded-lg shadow cursor-not-allowed"
        >
          <FaSpinner className="animate-spin mr-2" />
          Processing...
        </button>
      );
    }

    switch (uiState) {
      case "Idle":
      case "DisplayingResults":
      case "Error":
        return (
          <button
            onClick={onStartRecording}
            className="cursor-pointer flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:opacity-50"
            data-tour="start-recording"
          >
            <FaMicrophone className="mr-2" />
            Start Recording
          </button>
        );
      case "RequestingPermissions":
        return (
          <button
            disabled
            className="flex items-center justify-center px-6 py-3 bg-gray-400 text-white rounded-lg shadow cursor-not-allowed"
          >
            <FaSpinner className="animate-spin mr-2" />
            Requesting Mic...
          </button>
        );
      case "Listening":
        return (
          <button
            onClick={onStopRecording}
            className="flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-150 ease-in-out cursor-pointer"
          >
            <FaStopCircle className="mr-2" />
            Send Recording
          </button>
        );
      case "Processing":
        return (
          <button
            disabled
            className="flex items-center justify-center px-6 py-3 bg-yellow-500 text-white rounded-lg shadow cursor-not-allowed"
          >
            <FaSpinner className="animate-spin mr-2" />
            Processing...
          </button>
        );
      default:
        console.warn(
          "AudioRecorderUI reached unexpected default state:",
          uiState
        );
        return null;
    }
  };

  const getBasicStatusMessage = () => {
    switch (uiState) {
      case "Listening":
        return <p className="text-center text-blue-600 mt-2">Listening...</p>;
      case "Processing":
        return (
          <p className="text-center text-yellow-600 mt-2">
            Processing audio...
          </p>
        );
      case "Error":
        return (
          <p className="text-center text-red-600 mt-2">
            An error occurred. Check messages below.
          </p>
        );
      // No DisplayingResults case - handled separately with FeedbackMessage
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {getButtonContent()}

      {/* Show dynamic feedback for results, otherwise show basic status */}
      {uiState === "DisplayingResults" && assessmentResults ? (
        <div className="mt-4 w-full max-w-lg">
          <FeedbackMessage results={assessmentResults} />
        </div>
      ) : (
        getBasicStatusMessage()
      )}
    </div>
  );
}

export default AudioRecorderUI;