"use client";

import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';

interface AnimatedStatsProps {
  streak: number;
  points: number;
  onStreakUpdate?: (newStreak: number) => void;
  onPointsUpdate?: (newPoints: number) => void;
}

export const AnimatedStats: React.FC<AnimatedStatsProps> = ({
  streak,
  points,
  onStreakUpdate,
  onPointsUpdate,
}) => {
  const [displayStreak, setDisplayStreak] = useState(streak);
  const [displayPoints, setDisplayPoints] = useState(points);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [flameAnimation, setFlameAnimation] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coinsAnimation, setCoinsAnimation] = useState<any>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flameRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coinsRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousStreak = useRef<number | null>(null);
  const previousPoints = useRef<number | null>(null);

  // Initialize previous values on first render
  useEffect(() => {
    if (previousStreak.current === null) {
      previousStreak.current = streak;
    }
    if (previousPoints.current === null) {
      previousPoints.current = points;
    }
  }, [streak, points]);

  // Load animations
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        const [flameData, coinsData] = await Promise.all([
          fetch('/animations/flame.json').then(r => r.json()),
          fetch('/animations/coins-jump.json').then(r => r.json())
        ]);
        setFlameAnimation(flameData);
        setCoinsAnimation(coinsData);
      } catch (error) {
        console.error('Failed to load animations:', error);
      }
    };
    loadAnimations();
  }, []);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/audio/coin-chiming.mp3');
    audioRef.current.preload = 'auto';
    audioRef.current.volume = 0.5;
  }, []);

  // Handle streak updates
  useEffect(() => {
    if (streak !== previousStreak.current && previousStreak.current !== null) {
      if (streak > previousStreak.current) {
        // Trigger flame animation
        if (flameRef.current) {
          flameRef.current.stop();
          flameRef.current.play();
        }
        onStreakUpdate?.(streak);
      }
      setDisplayStreak(streak);
    }
    previousStreak.current = streak;
  }, [streak, onStreakUpdate]);

  // Handle points updates
  useEffect(() => {
    if (points !== previousPoints.current && previousPoints.current !== null) {
      if (points > previousPoints.current) {
        // Trigger coins animation
        if (coinsRef.current) {
          coinsRef.current.stop();
          coinsRef.current.play();
        }
        onPointsUpdate?.(points);
        
        // Play sound effect
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }
      }
      setDisplayPoints(points);
    }
    previousPoints.current = points;
  }, [points, onPointsUpdate]);

  return (
    <>
      {/* Streak Display */}
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Streak</span>
        <div className="flex items-center">
          <div className="w-6 h-6 mr-1">
            {flameAnimation && (
              <Lottie
                lottieRef={flameRef}
                animationData={flameAnimation}
                loop={false}
                autoplay={false}
                style={{ width: 24, height: 24 }}
              />
            )}
          </div>
          <span className="font-medium text-orange-600 dark:text-orange-400">
            {displayStreak} days
          </span>
        </div>
      </div>

      {/* Points Display */}
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Points</span>
        <div className="flex items-center">
          <div className="w-6 h-6 mr-1">
            {coinsAnimation && (
              <Lottie
                lottieRef={coinsRef}
                animationData={coinsAnimation}
                loop={false}
                autoplay={false}
                style={{ width: 24, height: 24 }}
              />
            )}
          </div>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {displayPoints.toLocaleString()}
          </span>
        </div>
      </div>
    </>
  );
};