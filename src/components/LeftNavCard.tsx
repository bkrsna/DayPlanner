'use client';

import { useRouter } from 'next/navigation';
import { PeriodType } from '@/types';
import { PeriodNavigator } from '@/components/PeriodNavigator';
import { useTheme } from '@/context/ThemeContext';
import { useStorageStats } from '@/hooks/useStorageStats';
import {
  getWeekForDate,
  getMonthForDate,
  getWeekDateRange,
  getTodayDateString,
  getCurrentWeekString,
  getCurrentMonthString,
} from '@/lib/dateUtils';
import {
  Search,
  Calendar,
  CalendarDays,
  CalendarRange,
  Compass,
  Flame,
  HardDriveDownload,
  Sun,
  Moon,
} from 'lucide-react';

interface LeftNavCardProps {
  periodType: PeriodType;
  currentId: string;
  onOpenCommand: () => void;
  onOpenConsistency: () => void;
  onOpenExport: () => void;
}

export function LeftNavCard({
  periodType,
  currentId,
  onOpenCommand,
  onOpenConsistency,
  onOpenExport,
}: LeftNavCardProps) {
  const router = useRouter();
  const { toggleTheme, isDark } = useTheme();
  const { stats } = useStorageStats();

  // Compute smart cross-period targets
  let targetDay = getTodayDateString();
  let targetWeek = getCurrentWeekString();
  let targetMonth = getCurrentMonthString();

  if (periodType === 'day') {
    targetDay = currentId;
    targetWeek = getWeekForDate(currentId);
    targetMonth = getMonthForDate(currentId);
  } else if (periodType === 'week') {
    const range = getWeekDateRange(currentId);
    const today = getTodayDateString();
    targetDay = today >= range.startStr && today <= range.endStr ? today : range.startStr;
    targetWeek = currentId;
    targetMonth = getMonthForDate(range.startStr);
  } else if (periodType === 'month') {
    const today = getTodayDateString();
    targetDay = today.startsWith(currentId) ? today : `${currentId}-01`;
    targetWeek = getWeekForDate(targetDay);
    targetMonth = currentId;
  }

  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm space-y-4">
      {/* 1. Brand & Header Actions */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
        {/* Brand */}
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100" title="DayTrack">
          <div className="w-7 h-7 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-2xs">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-medium text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            DayTrack
          </span>
        </div>

        {/* Quick Tools: Streak, Export, Theme */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Streak Pill */}
          <button
            onClick={onOpenConsistency}
            title="Streak & Consistency Momentum"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{stats.currentStreak}d</span>
          </button>

          {/* Backup & Export */}
          <button
            onClick={onOpenExport}
            title="Backup & Export"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HardDriveDownload className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Search Card */}
      <button
        onClick={onOpenCommand}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 transition-all shadow-2xs group"
        title="Search all tasks, notes, and commands (⌘K)"
      >
        <div className="flex items-center gap-2.5">
          <Search className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
          <span className="font-medium text-zinc-600 dark:text-zinc-300">Search</span>
        </div>
        <kbd className="px-1.5 py-0.5 text-[10px] rounded-md bg-white dark:bg-zinc-900 text-zinc-400 font-mono border border-zinc-200/80 dark:border-zinc-700">
          ⌘K
        </kbd>
      </button>

      {/* 3. View Switcher: Day, Week, Month */}
      <div className="space-y-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 px-1 mb-1.5">
          View Mode
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-medium">
          <button
            onClick={() => router.push(`/day/${targetDay}`)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              periodType === 'day'
                ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Day</span>
          </button>

          <button
            onClick={() => router.push(`/week/${targetWeek}`)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              periodType === 'week'
                ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Week</span>
          </button>

          <button
            onClick={() => router.push(`/month/${targetMonth}`)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
              periodType === 'month'
                ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Month</span>
          </button>
        </div>
      </div>

      {/* 4. Period Navigator */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 px-1">
          Timeline
        </div>

        {/* Period Navigator Controller */}
        <div className="w-full">
          <PeriodNavigator periodType={periodType} currentId={currentId} />
        </div>
      </div>
    </div>
  );
}
