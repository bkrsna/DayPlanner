'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatFullDate,
  getRelativeDateLabel,
  getPreviousDate,
  getNextDate,
  getTodayDateString,
  toDateString,
  parseDate,
} from '@/lib/dateUtils';
import { getAllSavedDates } from '@/lib/storage';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  X,
} from 'lucide-react';

interface DateNavigatorProps {
  currentDate: string;
}

export function DateNavigator({ currentDate }: DateNavigatorProps) {
  const router = useRouter();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => parseDate(currentDate));
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);

  const today = getTodayDateString();
  const isToday = currentDate === today;
  const relativeLabel = getRelativeDateLabel(currentDate);

  useEffect(() => {
    setCalendarMonth(parseDate(currentDate));
    setLoggedDates(new Set(getAllSavedDates()));
  }, [currentDate]);

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCalendarOpen]);

  const handlePrevDay = () => {
    router.push(`/day/${getPreviousDate(currentDate)}`);
  };

  const handleNextDay = () => {
    router.push(`/day/${getNextDate(currentDate)}`);
  };

  const handleJumpToday = () => {
    router.push(`/day/${today}`);
  };

  const handleSelectDate = (dateStr: string) => {
    setIsCalendarOpen(false);
    router.push(`/day/${dateStr}`);
  };

  // Calendar matrix calculations
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    prevMonthDays.push(null);
  }

  const currentMonthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = toDateString(new Date(year, month, d));
    currentMonthDays.push(ds);
  }

  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-5">
      {/* Date Title & Relative Badge */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {formatFullDate(currentDate)}
            </h1>
            {relativeLabel && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isToday
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-800'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {relativeLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Keyboard navigation: <kbd className="px-1 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono">[</kbd> Prev &bull; <kbd className="px-1 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono">]</kbd> Next &bull; <kbd className="px-1 py-0.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono">T</kbd> Today
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        <button
          onClick={handlePrevDay}
          title="Previous Day (Hotkey: [ )"
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {!isToday && (
          <button
            onClick={handleJumpToday}
            title="Jump to Today (Hotkey: T)"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700/60"
          >
            <RotateCcw className="w-3 h-3 text-zinc-500" />
            Today
          </button>
        )}

        <button
          onClick={handleNextDay}
          title="Next Day (Hotkey: ] )"
          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Mini Calendar Popover Button */}
        <div className="relative">
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            title="Pick a Date"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isCalendarOpen
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          {/* Popover */}
          {isCalendarOpen && (
            <div
              ref={popoverRef}
              className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl bg-white dark:bg-zinc-900 p-3 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Header: Month switcher */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCalendarMonth(new Date(year, month - 1, 1))
                    }
                    className="p-1 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      setCalendarMonth(new Date(year, month + 1, 1))
                    }
                    className="p-1 rounded text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsCalendarOpen(false)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-400 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Days Matrix */}
              <div className="grid grid-cols-7 gap-1">
                {prevMonthDays.map((_, i) => (
                  <div key={`empty-${i}`} className="h-7" />
                ))}
                {currentMonthDays.map((dateStr) => {
                  const dayNum = parseDate(dateStr).getDate();
                  const isSelected = dateStr === currentDate;
                  const isTodayDate = dateStr === today;
                  const hasEntries = loggedDates.has(dateStr);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleSelectDate(dateStr)}
                      className={`relative flex items-center justify-center h-7 text-xs rounded-lg transition-all ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                          : isTodayDate
                          ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasEntries && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
