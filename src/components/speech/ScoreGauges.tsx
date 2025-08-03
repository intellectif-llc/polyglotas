"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

// Score color palette - from low to high
const SCORE_COLORS = {
  accuracy: ["#FF5252", "#FFA726", "#FFEB3B", "#9CCC65", "#66BB6A"],
  fluency: ["#EF5350", "#FF9800", "#FFCA28", "#26A69A", "#00ACC1"],
  completeness: ["#F44336", "#FB8C00", "#FFD54F", "#66BB6A", "#26C6DA"],
  prosody: ["#E53935", "#F57C00", "#FFEE58", "#42A5F5", "#29B6F6"],
  overall: ["#D32F2F", "#F57F17", "#FBC02D", "#388E3C", "#0288D1"],
};

// Get appropriate color based on score value
const getColorForScore = (score: number, type: string = "accuracy") => {
  const colors = SCORE_COLORS[type as keyof typeof SCORE_COLORS] || SCORE_COLORS.accuracy;
  if (score >= 90) return colors[4];
  if (score >= 80) return colors[3];
  if (score >= 70) return colors[2];
  if (score >= 60) return colors[1];
  return colors[0];
};

interface AnimatedScoreGaugeProps {
  score: number;
  label: string;
  type?: string;
  size?: "small" | "medium" | "large";
}

const AnimatedScoreGauge: React.FC<AnimatedScoreGaugeProps> = ({ 
  score, 
  label, 
  type = "accuracy", 
  size = "medium" 
}) => {
  // Handle undefined or null scores
  const targetScore = score !== undefined && score !== null ? Math.round(score) : 0;
  
  // Animation state
  const [displayScore, setDisplayScore] = useState(0);
  const [displayValue, setDisplayValue] = useState(0);

  // Animate score when it changes
  useEffect(() => {
    // Reset to 0 if score is 0 (for new results)
    if (targetScore === 0) {
      setDisplayScore(0);
      setDisplayValue(0);
      return;
    }

    // Animation timing
    const duration = 1000; // ms
    const steps = 30;
    const increment = targetScore / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newValue = Math.min(Math.round(increment * currentStep), targetScore);
      setDisplayValue(newValue);
      setDisplayScore(newValue);

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(targetScore);
        setDisplayScore(targetScore);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetScore]);

  // Size adjustments - smaller for all sizes to fit better on mobile
  const dimensions = {
    small: {
      width: 120,
      height: 120,
      innerRadius: 35,
      outerRadius: 55,
      fontSize: 18,
      labelSize: 12,
    },
    medium: {
      width: 160,
      height: 160,
      innerRadius: 50,
      outerRadius: 70,
      fontSize: 22,
      labelSize: 14,
    },
    large: {
      width: 200,
      height: 200,
      innerRadius: 65,
      outerRadius: 85,
      fontSize: 26,
      labelSize: 16,
    },
  };

  const { width, height, innerRadius, outerRadius, fontSize, labelSize } =
    dimensions[size] || dimensions.medium;

  const data = [
    { name: "Score", value: displayScore },
    { name: "Remaining", value: 100 - displayScore },
  ];

  const COLORS = [getColorForScore(displayScore, type), "#E5E7EB"];

  return (
    <div className="flex flex-col items-center m-2">
      <div className="relative" style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Score text overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: `${fontSize}px` }}
        >
          <span className="font-bold text-gray-800">{displayValue}%</span>
        </div>
      </div>
      
      {/* Label */}
      <span
        className="mt-2 text-center text-gray-600 font-medium"
        style={{ fontSize: `${labelSize}px` }}
      >
        {label}
      </span>
    </div>
  );
};

interface ScoreGaugesProps {
  results: {
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    prosodyScore: number;
    pronScore: number;
  } | null;
  size?: "small" | "medium" | "large";
}

const ScoreGauges: React.FC<ScoreGaugesProps> = ({ results, size = "medium" }) => {
  // If no results, show empty state or return null
  if (!results) return null;

  const {
    accuracyScore,
    fluencyScore,
    completenessScore,
    prosodyScore,
    pronScore,
  } = results;

  return (
    <div className="w-full py-2">
      <div className="flex flex-wrap justify-center">
        <AnimatedScoreGauge
          score={accuracyScore}
          label="Accuracy"
          type="accuracy"
          size={size}
        />
        <AnimatedScoreGauge
          score={fluencyScore}
          label="Fluency"
          type="fluency"
          size={size}
        />
        <AnimatedScoreGauge
          score={completenessScore}
          label="Completeness"
          type="completeness"
          size={size}
        />
        <AnimatedScoreGauge
          score={prosodyScore}
          label="Prosody"
          type="prosody"
          size={size}
        />
      </div>

      {/* Overall score if provided */}
      {pronScore && (
        <div className="flex justify-center">
          <AnimatedScoreGauge
            score={pronScore}
            label="Overall"
            type="overall"
            size={size === "small" ? "medium" : "large"} // Make overall slightly larger
          />
        </div>
      )}
    </div>
  );
};

export default ScoreGauges;