'use client';

import { useTheme } from '@/context/ThemeContext';
import { useStorageStats } from '@/hooks/useStorageStats';
import {
  Flame,
  Sun,
  Moon,
  Search,
  CalendarDays,
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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xs">
              <Compass className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline-block">
              DayTrack
            </span>
          </div>

          {/* Streak pill badge */}
          <button
            onClick={onOpenConsistency}
            title="View momentum and streaks"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>
              {stats.currentStreak}{' '}
              <span className="text-[11px] opacity-80">
                {stats.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </span>
          </button>
        </div>

        {/* Center: Search / Command button */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors w-40 sm:w-60 justify-between"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span>Search or jump...</span>
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-zinc-500">
            ⌘K
          </kbd>
        </button>

        {/* Right: Tools & Theme */}
        <div className="flex items-center gap-1.5">
          {/* Consistency / Heatmap Button */}
          <button
            onClick={onOpenConsistency}
            title="Consistency Heatmap & History"
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
          </button>

          {/* Backup / Export Button */}
          <button
            onClick={onOpenExport}
            title="Backup, Restore, & Markdown Export"
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <HardDriveDownload className="w-4 h-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
