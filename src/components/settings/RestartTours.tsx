"use client";

import React, { useState } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";
import { useRestartTours } from "@/hooks/tours/useRestartTours";

export default function RestartTours() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { restartTours, isRestarting } = useRestartTours();

  const handleRestart = () => {
    restartTours();
    setShowConfirm(false);
  };

  return (
    <div>
      <div className="flex items-center space-x-3 mb-4">
        <RotateCcw className="text-orange-600" size={24} />
        <h2 className="text-lg font-semibold text-gray-900">Tours & Guides</h2>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600 mb-4">
          Restart all guided tours to see them again when you visit different sections of the app.
        </p>
        
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isRestarting}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            {isRestarting ? "Restarting..." : "Restart All Tours"}
          </button>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="text-yellow-600" size={20} />
              <span className="font-medium text-yellow-800">Confirm Action</span>
            </div>
            <p className="text-yellow-700 mb-4 text-sm">
              This will reset all tour progress. You&apos;ll see tours again when visiting relevant pages.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleRestart}
                disabled={isRestarting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
              >
                {isRestarting ? "Restarting..." : "Yes, Restart Tours"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isRestarting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}