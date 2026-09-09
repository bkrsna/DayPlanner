'use client';

import { useTheme } from '@/context/ThemeContext';
import { useStorageStats } from '@/hooks/useStorageStats';
import {
  Flame,
  Sun,
  Moon,
  Search,
  HardDriveDownload,
  Compass,
} from 'lucide-react';

interface HeaderProps {
  onOpenCommand: () => void;
  onOpenConsistency: () => void;
  onOpenExport: () => void;
}

export function Header({
  onOpenCommand,
  onOpenConsistency,
  onOpenExport,
}: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();
  const { stats } = useStorageStats();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-[#090a0d]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
        {/* Left: DayTrack Brand */}
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100" title="DayTrack">
          <div className="w-7 h-7 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-2xs">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-medium text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            DayTrack
          </span>
        </div>

        {/* Right: Quick Tools, Streaks, Export, Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search trigger (for smaller screens where left card might be scrolled) */}
          <button
            onClick={onOpenCommand}
            title="Search or jump (⌘K)"
            className="sm:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Concise Streak Pill */}
          <button
            onClick={onOpenConsistency}
            title="Streak & Consistency Momentum"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{stats.currentStreak}d</span>
          </button>

          {/* Backup / Export Button */}
          <button
            onClick={onOpenExport}
            title="Backup & Export"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <HardDriveDownload className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
