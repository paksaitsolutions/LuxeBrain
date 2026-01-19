/**
 * Progress Bar Component
 * Copyright © 2024 Paksa IT Solutions
 */

'use client';

import { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  yellow: 'bg-yellow-600',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'md',
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(Math.min(Math.max(progress, 0), 100));
    }, 50);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-700">{Math.round(displayProgress)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="text-2xl font-bold fill-gray-700 transform rotate-90"
          style={{ transformOrigin: 'center' }}
        >
          {Math.round(progress)}%
        </text>
      </svg>
      {label && <p className="mt-2 text-sm text-gray-600">{label}</p>}
    </div>
  );
}

export function useProgress(initialProgress = 0) {
  const [progress, setProgress] = useState(initialProgress);
  const [isComplete, setIsComplete] = useState(false);

  const updateProgress = (value: number) => {
    setProgress(Math.min(Math.max(value, 0), 100));
    if (value >= 100) {
      setIsComplete(true);
    }
  };

  const reset = () => {
    setProgress(0);
    setIsComplete(false);
  };

  return { progress, isComplete, updateProgress, reset };
}
