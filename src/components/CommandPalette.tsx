'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStorageStats } from '@/hooks/useStorageStats';
import { useTheme } from '@/context/ThemeContext';
import {
  getTodayDateString,
  getPreviousDate,
  getNextDate,
  formatMediumDate,
  getCurrentWeekString,
  getCurrentMonthString,
  getWeekDateRange,
  formatMonthYear,
} from '@/lib/dateUtils';
import {
  Search,
  Calendar,
  Sun,
  Moon,
  Flame,
  Download,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConsistency: () => void;
  onOpenExport: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenConsistency,
  onOpenExport,
}: CommandPaletteProps) {
  const router = useRouter();
  const { toggleTheme, isDark } = useTheme();
  const { searchAllDays } = useStorageStats();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ date: string; matches: string[] }>
  >([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const today = getTodayDateString();
  const yesterday = getPreviousDate(today);
  const tomorrow = getNextDate(today);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle live search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const results = searchAllDays(query);
    setSearchResults(results.slice(0, 8)); // Top 8 matches
  }, [query, searchAllDays]);

  if (!isOpen) return null;

  const navigateToDay = (dateStr: string) => {
    onClose();
    router.push(`/day/${dateStr}`);
  };

  const actions = [
    {
      id: 'today',
      title: 'Go to Today',
      subtitle: formatMediumDate(today),
      icon: Calendar,
      action: () => navigateToDay(today),
    },
    {
      id: 'yesterday',
      title: 'Go to Yesterday',
      subtitle: formatMediumDate(yesterday),
      icon: Calendar,
      action: () => navigateToDay(yesterday),
    },
    {
      id: 'tomorrow',
      title: 'Go to Tomorrow',
      subtitle: formatMediumDate(tomorrow),
      icon: Calendar,
      action: () => navigateToDay(tomorrow),
    },
    {
      id: 'week',
      title: 'Go to This Week',
      subtitle: getWeekDateRange(getCurrentWeekString()).label,
      icon: Calendar,
      action: () => {
        onClose();
        router.push(`/week/${getCurrentWeekString()}`);
      },
    },
    {
      id: 'month',
      title: 'Go to This Month',
      subtitle: formatMonthYear(getCurrentMonthString()),
      icon: Calendar,
      action: () => {
        onClose();
        router.push(`/month/${getCurrentMonthString()}`);
      },
    },
    {
      id: 'streaks',
      title: 'Open Streaks & Activity Heatmap',
      subtitle: 'View momentum and progress',
      icon: Flame,
      action: () => {
        onClose();
        onOpenConsistency();
      },
    },
    {
      id: 'backup',
      title: 'Backup / Export / Restore Data',
      subtitle: 'Download JSON or Markdown',
      icon: Download,
      action: () => {
        onClose();
        onOpenExport();
      },
    },
    {
      id: 'theme',
      title: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: 'Toggle interface mode',
      icon: isDark ? Sun : Moon,
      action: () => {
        toggleTheme();
        onClose();
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all notes, tasks, or jump to a day..."
            className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results / Actions Body */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {query.trim() && searchResults.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((res) => (
                <button
                  key={res.date}
                  onClick={() => navigateToDay(res.date)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-start justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      <span>{formatMediumDate(res.date)}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">({res.date})</span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {res.matches.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="truncate">
                          &bull; {m}
                        </div>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors mt-1" />
                </button>
              ))}
            </div>
          )}

          {query.trim() && searchResults.length === 0 && (
            <div className="p-6 text-center text-xs text-zinc-500">
              No matching tasks, notes, or entries found for &ldquo;{query}&rdquo;.
            </div>
          )}

          {!query.trim() && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Quick Actions & Jump
              </div>
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {act.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {act.subtitle}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Protip: Press <kbd className="px-1 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 font-mono">⌘K</kbd> anywhere</span>
          <span>Fast, offline, local-first</span>
        </div>
      </div>
    </div>
  );
}
