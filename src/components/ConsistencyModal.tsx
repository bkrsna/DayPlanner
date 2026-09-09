'use client';

import { useRouter } from 'next/navigation';
import { useStorageStats } from '@/hooks/useStorageStats';
import { getLastNDays, formatMediumDate, getTodayDateString } from '@/lib/dateUtils';
import { X, Flame, Award, CheckCircle2, Calendar, ArrowUpRight } from 'lucide-react';

interface ConsistencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
}

export function ConsistencyModal({
  isOpen,
  onClose,
  currentDate,
}: ConsistencyModalProps) {
  const router = useRouter();
  const { stats, summaries } = useStorageStats();

  if (!isOpen) return null;

  const today = getTodayDateString();
  const pastDays = getLastNDays(70, today); // 10 weeks of activity
  const summaryMap = new Map(summaries.map((s) => [s.date, s]));

  const handleDayClick = (d: string) => {
    onClose();
    router.push(`/day/${d}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <span>Consistency & Streaks</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your momentum and historical execution log
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Current Streak</span>
            </div>
            <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
              {stats.currentStreak} <span className="text-xs font-normal text-zinc-400 font-sans">days</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <Award className="w-3.5 h-3.5 text-purple-500" />
              <span>Best Streak</span>
            </div>
            <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
              {stats.bestStreak} <span className="text-xs font-normal text-zinc-400 font-sans">days</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tasks Done</span>
            </div>
            <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
              {stats.completedTasksCount}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Days Tracked</span>
            </div>
            <div className="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
              {stats.totalDays}
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="mb-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            <span>Last 10 Weeks Activity</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-zinc-200 dark:bg-zinc-800" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-900" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-600" />
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
              <span>More</span>
            </div>
          </div>

          <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-2">
            {pastDays.map((d) => {
              const sum = summaryMap.get(d);
              const done = sum ? sum.completedTodos : 0;
              const isCurrent = d === currentDate;
              const isTodayDate = d === today;

              let bgClass = 'bg-zinc-200/70 dark:bg-zinc-800/70';
              if (done >= 4) {
                bgClass = 'bg-emerald-600 dark:bg-emerald-400 text-white';
              } else if (done >= 2) {
                bgClass = 'bg-emerald-400 dark:bg-emerald-600 text-white';
              } else if (done >= 1) {
                bgClass = 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900';
              }

              return (
                <button
                  key={d}
                  onClick={() => handleDayClick(d)}
                  title={`${formatMediumDate(d)}: ${done} tasks done`}
                  className={`w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 relative ${bgClass} ${
                    isCurrent ? 'ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : ''
                  } ${isTodayDate ? 'border border-emerald-500' : ''}`}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Click any block to jump to that day&apos;s page</span>
          <button
            onClick={() => handleDayClick(today)}
            className="flex items-center gap-1 text-zinc-900 dark:text-zinc-100 font-medium hover:underline"
          >
            <span>Go to Today</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
