"use client";

import React, { useEffect, useRef, useState } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

interface CompactAnimatedStatsProps {
  streak: number;
  points: number;
}

export const CompactAnimatedStats: React.FC<CompactAnimatedStatsProps> = ({
  streak,
  points,
}) => {
  const [flameAnimation, setFlameAnimation] = useState<object | null>(null);
  const [coinsAnimation, setCoinsAnimation] = useState<object | null>(null);
  
  const flameRef = useRef<LottieRefCurrentProps | null>(null);
  const coinsRef = useRef<LottieRefCurrentProps | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousStreak = useRef<number | null>(null);
  const previousPoints = useRef<number | null>(null);

  // Initialize previous values
  useEffect(() => {
    if (previousStreak.current === null) previousStreak.current = streak;
    if (previousPoints.current === null) previousPoints.current = points;
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
    audioRef.current.volume = 0.3;
  }, []);

  // Handle streak updates
  useEffect(() => {
    if (streak !== previousStreak.current && previousStreak.current !== null && streak > previousStreak.current) {
      if (flameRef.current) {
        flameRef.current.stop();
        flameRef.current.play();
      }
    }
    previousStreak.current = streak;
  }, [streak]);

  // Handle points updates
  useEffect(() => {
    if (points !== previousPoints.current && previousPoints.current !== null && points > previousPoints.current) {
      if (coinsRef.current) {
        coinsRef.current.stop();
        coinsRef.current.play();
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
    previousPoints.current = points;
  }, [points]);

  return (
    <div className="flex items-center space-x-3 text-sm">
      {/* Streak */}
      <div className="flex items-center">
        <div className="w-4 h-4 mr-1 flex-shrink-0">
          {flameAnimation ? (
            <Lottie
              lottieRef={flameRef}
              animationData={flameAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 16, height: 16 }}
            />
          ) : (
            <div className="w-4 h-4 bg-orange-500 rounded-full" />
          )}
        </div>
        <span className="font-medium text-orange-600 dark:text-orange-400">
          {streak}
        </span>
      </div>

      {/* Points */}
      <div className="flex items-center">
        <div className="w-4 h-4 mr-1 flex-shrink-0">
          {coinsAnimation ? (
            <Lottie
              lottieRef={coinsRef}
              animationData={coinsAnimation}
              loop={false}
              autoplay={false}
              style={{ width: 16, height: 16 }}
            />
          ) : (
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
          )}
        </div>
        <span className="font-medium text-blue-600 dark:text-blue-400">
          {points.toLocaleString()}
        </span>
      </div>
    </div>
  );
};