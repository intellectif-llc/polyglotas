import React from "react";
import { TrendingUp, Lock, Sparkles } from "lucide-react";

interface UpgradePromptProps {
  className?: string;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ className = "" }) => {
  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-8 border border-purple-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Progress Analytics</h3>
            <p className="text-sm text-gray-600">Unlock detailed insights</p>
          </div>
        </div>
        <Lock className="text-purple-400" size={24} />
      </div>

      {/* Preview Chart Area */}
      <div className="relative mb-6">
        <div className="h-48 bg-white rounded-lg border-2 border-dashed border-purple-200 flex items-center justify-center relative overflow-hidden">
          {/* Blurred background pattern */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" viewBox="0 0 400 200">
              <path
                d="M0,150 Q100,100 200,120 T400,80"
                stroke="rgb(139, 92, 246)"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M0,180 Q100,130 200,150 T400,110"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
              />
            </svg>
          </div>
          
          {/* Lock overlay */}
          <div className="relative z-10 text-center">
            <Lock className="text-purple-400 mx-auto mb-3" size={32} />
            <p className="text-purple-600 font-medium">Chart Preview</p>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3">
          <Sparkles className="text-purple-500" size={16} />
          <span className="text-gray-700">Track words learned over time</span>
        </div>
        <div className="flex items-center space-x-3">
          <Sparkles className="text-purple-500" size={16} />
          <span className="text-gray-700">Cumulative progress visualization</span>
        </div>
        <div className="flex items-center space-x-3">
          <Sparkles className="text-purple-500" size={16} />
          <span className="text-gray-700">Flexible time period filtering</span>
        </div>
        <div className="flex items-center space-x-3">
          <Sparkles className="text-purple-500" size={16} />
          <span className="text-gray-700">Detailed pronunciation analytics</span>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
          Upgrade to Starter Plan
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Unlock progress analytics and more advanced features
        </p>
      </div>
    </div>
  );
};

export default UpgradePrompt;