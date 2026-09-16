'use client';

import { useSyncExternalStore } from 'react';
import { Plus } from 'lucide-react';
import { MacAppId } from './MacAppWindow/MacAppWindow';

interface AppsLauncherCardProps {
  notesCount: number;
  onOpenApp: (app: MacAppId) => void;
}

let clockSnapshot = 0;
const subscribers = new Set<() => void>();
let timerId: ReturnType<typeof setInterval> | null = null;

function tick() {
  clockSnapshot = Date.now();
  subscribers.forEach((callback) => callback());
}

function handleVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    tick();
  }
}

function subscribeClock(callback: () => void) {
  subscribers.add(callback);
  if (timerId === null) {
    timerId = setInterval(tick, 1000);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && timerId !== null) {
      clearInterval(timerId);
      timerId = null;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      clockSnapshot = 0;
    }
  };
}

function getClockSnapshot() {
  if (clockSnapshot === 0 && typeof window !== 'undefined') {
    clockSnapshot = Date.now();
  }
  return clockSnapshot;
}

function getServerClockSnapshot() {
  return 0;
}

export function AppsLauncherCard({ notesCount, onOpenApp }: AppsLauncherCardProps) {
  const timestamp = useSyncExternalStore(subscribeClock, getClockSnapshot, getServerClockSnapshot);
  const now = timestamp > 0 ? new Date(timestamp) : null;

  // Use classic 10:10:30 default before mount to ensure server/client hydration consistency
  const hours = now ? now.getHours() : 10;
  const minutes = now ? now.getMinutes() : 10;
  const seconds = now ? now.getSeconds() : 30;

  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minuteAngle = (minutes + seconds / 60) * 6;
  const secondAngle = seconds * 6;

  return (
    <div className="relative z-10 rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md p-2.5 sm:p-3 shadow-xs">
      {/* 4 Squircle Icon Slots matching user's sketch */}
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5 justify-items-center">
        {/* Slot 1: Clock & Stopwatch */}
        <div className="w-full flex flex-col items-center gap-1 sm:gap-1.5 relative group">
          <button
            onClick={() => onOpenApp('clock')}
            aria-label="Clock & Stopwatch"
            title="Clock & Stopwatch"
            className="w-full max-w-[64px] aspect-square rounded-2xl bg-gradient-to-b from-zinc-800 via-zinc-900 to-black p-1 sm:p-1.5 flex items-center justify-center shadow-md border border-zinc-700/60 dark:border-zinc-700/80 group-hover:scale-105 group-hover:border-orange-500/50 group-hover:shadow-orange-500/20 transition-all cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {/* Authentic macOS Analog Clock Dial (SVG Vector with exact (50, 50) center pivot) */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Dial Face Background */}
              <circle
                cx="50"
                cy="50"
                r="46"
                className="fill-zinc-900 stroke-zinc-700/80"
                strokeWidth="2"
              />

              {/* 12 Hour Ticks (12, 3, 6, 9 emphasized) */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <line
                  key={deg}
                  x1="50"
                  y1="9"
                  x2="50"
                  y2={deg % 90 === 0 ? '16' : '13'}
                  stroke={deg % 90 === 0 ? '#f4f4f5' : '#71717a'}
                  strokeWidth={deg % 90 === 0 ? '3' : '1.75'}
                  strokeLinecap="round"
                  transform={`rotate(${deg} 50 50)`}
                />
              ))}

              {/* Hour Hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="25"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${hourAngle} 50 50)`}
              />

              {/* Minute Hand */}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="15"
                stroke="#e4e4e7"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${minuteAngle} 50 50)`}
              />

              {/* Second Hand (Orange with counter-balance tail, rotates perfectly around (50, 50)) */}
              <line
                x1="50"
                y1="58"
                x2="50"
                y2="12"
                stroke="#f97316"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${secondAngle} 50 50)`}
              />

              {/* Center Pinion */}
              <circle cx="50" cy="50" r="3" fill="#f97316" stroke="#09090b" strokeWidth="1" />
            </svg>
          </button>

          {/* Micro-label */}
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors truncate max-w-full">
            Clock
          </span>

          {/* Floating Hover Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-30 px-2 py-0.5 rounded-md bg-zinc-900/90 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-[10px] font-medium shadow-md whitespace-nowrap">
            Clock & Stopwatch
          </div>
        </div>

        {/* Slot 2: Notes & Ideas */}
        <div className="w-full flex flex-col items-center gap-1 sm:gap-1.5 relative group">
          <div className="relative w-full max-w-[64px] aspect-square">
            <button
              onClick={() => onOpenApp('notes')}
              aria-label="Notes & Ideas"
              title="Notes & Ideas"
              className="w-full h-full rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700/80 shadow-md group-hover:scale-105 group-hover:border-amber-500/50 group-hover:shadow-amber-500/20 transition-all cursor-pointer overflow-hidden flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {/* Yellow Notepad Header Band */}
              <div className="h-3 sm:h-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-b border-amber-600/30 flex items-center px-1.5 justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-1 opacity-60">
                  <div className="w-1 h-1 rounded-full bg-amber-900/40" />
                  <div className="w-1 h-1 rounded-full bg-amber-900/40" />
                  <div className="w-1 h-1 rounded-full bg-amber-900/40" />
                </div>
              </div>

              {/* Notepad Lined Paper Body */}
              <div className="flex-1 p-1.5 sm:p-2 bg-[#fdfbf7] dark:bg-zinc-850 flex flex-col justify-center gap-1 sm:gap-1.5 relative">
                <div className="w-3/4 h-[2px] bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                <div className="w-full h-[2px] bg-amber-400/80 rounded-full" />
                <div className="w-2/3 h-[2px] bg-zinc-300 dark:bg-zinc-600 rounded-full" />

                {/* Folded Corner Detail */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-100 dark:bg-zinc-700 border-t border-l border-amber-300 dark:border-zinc-600 rounded-tl-sm" />
              </div>
            </button>

            {/* Amber Badge with Note Count - Placed outside overflow-hidden button so it is never clipped! */}
            <div className="absolute -top-1.5 -right-1.5 z-20 min-w-[20px] h-[20px] px-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-zinc-900 leading-none pointer-events-none group-hover:scale-110 transition-transform">
              {Math.max(0, notesCount || 0)}
            </div>
          </div>

          {/* Micro-label */}
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors truncate max-w-full">
            Notes
          </span>

          {/* Floating Hover Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-30 px-2 py-0.5 rounded-md bg-zinc-900/90 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-[10px] font-medium shadow-md whitespace-nowrap">
            Notes & Ideas
          </div>
        </div>

        {/* Slot 3: Upcoming / Placeholder 1 */}
        <div className="w-full flex flex-col items-center gap-1 sm:gap-1.5 relative group">
          <div
            aria-label="Coming soon"
            title="Coming soon"
            className="w-full max-w-[64px] aspect-square rounded-2xl border-2 border-dashed border-zinc-300/80 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-center transition-all cursor-default group/slot hover:border-zinc-400/80 dark:hover:border-zinc-600/80 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30"
          >
            <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 stroke-[1.75] group-hover/slot:text-zinc-400 dark:group-hover/slot:text-zinc-400 group-hover/slot:scale-110 transition-all" />
          </div>

          {/* Micro-label */}
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate max-w-full">
            Soon
          </span>

          {/* Floating Hover Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-30 px-2 py-0.5 rounded-md bg-zinc-900/90 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-[10px] font-medium shadow-md whitespace-nowrap">
            Coming soon
          </div>
        </div>

        {/* Slot 4: Upcoming / Placeholder 2 */}
        <div className="w-full flex flex-col items-center gap-1 sm:gap-1.5 relative group">
          <div
            aria-label="Coming soon"
            title="Coming soon"
            className="w-full max-w-[64px] aspect-square rounded-2xl border-2 border-dashed border-zinc-300/80 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-center transition-all cursor-default group/slot hover:border-zinc-400/80 dark:hover:border-zinc-600/80 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30"
          >
            <Plus className="w-5 h-5 text-zinc-300 dark:text-zinc-600 stroke-[1.75] group-hover/slot:text-zinc-400 dark:group-hover/slot:text-zinc-400 group-hover/slot:scale-110 transition-all" />
          </div>

          {/* Micro-label */}
          <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 dark:text-zinc-500 truncate max-w-full">
            Soon
          </span>

          {/* Floating Hover Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-30 px-2 py-0.5 rounded-md bg-zinc-900/90 dark:bg-zinc-100/95 text-white dark:text-zinc-900 text-[10px] font-medium shadow-md whitespace-nowrap">
            Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
