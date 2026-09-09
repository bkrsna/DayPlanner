'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  completed,
  total,
  size = 54,
  strokeWidth = 5,
}: ProgressRingProps) {
  const prevCompletedRef = useRef(completed);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Trigger celebration confetti when hitting 100% from less than 100%
  useEffect(() => {
    if (total > 0 && completed === total && prevCompletedRef.current < total) {
      try {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.2 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#ec4899'],
        });
      } catch {
        // Safe fallback if confetti fails
      }
    }
    prevCompletedRef.current = completed;
  }, [completed, total]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-200 dark:text-zinc-800"
          fill="transparent"
        />
        {/* Progress bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-500 ease-out ${
            percentage === 100
              ? 'text-emerald-500 dark:text-emerald-400'
              : 'text-zinc-900 dark:text-zinc-100'
          }`}
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
        <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
