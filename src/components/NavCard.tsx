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

export interface NavCardProps {
  periodType: PeriodType;
  currentId: string;
  onOpenCommand: () => void;
  onOpenConsistency: () => void;
  onOpenExport: () => void;
}

export function NavCard({
  periodType,
  currentId,
  onOpenCommand,
  onOpenConsistency,
  onOpenExport,
}: NavCardProps) {
  const router = useRouter();
  const { toggleTheme, isDark } = useTheme();
  const { stats } = useStorageStats();

  // Compute smart cross-period navigation targets
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
    <div className="rounded-2xl sm:rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/85 backdrop-blur-md p-3 sm:p-4 shadow-xs space-y-2.5">
      {/* 1. Brand & Quick Controls Row (Search, Streak, Backup, Theme) */}
      <div className="flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100" title="DayTrack">
          <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-2xs">
            <Compass className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            DayTrack
          </span>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Compact Search Trigger */}
          <button
            onClick={onOpenCommand}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors group"
            title="Search all tasks, notes, and commands (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
            <span className="hidden sm:inline text-[11px]">Search</span>
            <kbd className="px-1 py-0.2 text-[10px] rounded bg-white dark:bg-zinc-900 text-zinc-400 font-mono border border-zinc-200/80 dark:border-zinc-700">
              ⌘K
            </kbd>
          </button>

          {/* Streak Pill */}
          <button
            onClick={onOpenConsistency}
            title="Streak & Consistency Momentum"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
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
            <HardDriveDownload className="w-3.5 h-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Compact View Switcher: Day, Week, Month (No redundant uppercase header) */}
      <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-medium">
        <button
          onClick={() => router.push(`/day/${targetDay}`)}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
            periodType === 'day'
              ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Day</span>
        </button>

        <button
          onClick={() => router.push(`/week/${targetWeek}`)}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
            periodType === 'week'
              ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Week</span>
        </button>

        <button
          onClick={() => router.push(`/month/${targetMonth}`)}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
            periodType === 'month'
              ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Month</span>
        </button>
      </div>

      {/* 3. Timeline / Period Navigator (No redundant uppercase header) */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <PeriodNavigator periodType={periodType} currentId={currentId} />
      </div>
    </div>
  );
}

// Backward compatibility alias
export const LeftNavCard = NavCard;
