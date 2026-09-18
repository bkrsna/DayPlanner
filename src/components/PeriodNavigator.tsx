'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  formatFullDate,
  formatConciseDate,
  formatMediumDate,
  getRelativeDateLabel,
  getPreviousDate,
  getNextDate,
  getTodayDateString,
  toDateString,
  parseDate,
  getWeekDateRange,
  getPreviousWeek,
  getNextWeek,
  getCurrentWeekString,
  getRelativeWeekLabel,
  getWeekId,
  formatMonthYear,
  getPreviousMonth,
  getNextMonth,
  getCurrentMonthString,
  getRelativeMonthLabel,
} from '@/lib/dateUtils';
import { getAllSavedDates, getAllSavedWeeks, getAllSavedMonths } from '@/lib/storage';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  X,
} from 'lucide-react';
import { PeriodType } from '@/types';

interface PeriodNavigatorProps {
  periodType: PeriodType;
  currentId: string;
}

export function PeriodNavigator({ periodType, currentId }: PeriodNavigatorProps) {
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    if (periodType === 'day') return parseDate(currentId);
    if (periodType === 'week') return getWeekDateRange(currentId).start;
    const [y, m] = currentId.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });
  const [loggedEntries, setLoggedEntries] = useState<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleTogglePicker = () => {
    if (periodType === 'day') {
      setCalendarMonth(parseDate(currentId));
      setLoggedEntries(new Set(getAllSavedDates()));
    } else if (periodType === 'week') {
      setCalendarMonth(getWeekDateRange(currentId).start);
      setLoggedEntries(new Set(getAllSavedWeeks()));
    } else {
      const [y, m] = currentId.split('-').map(Number);
      setCalendarMonth(new Date(y, m - 1, 1));
      setLoggedEntries(new Set(getAllSavedMonths()));
    }
    setIsPickerOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPickerOpen]);

  // Handlers
  const handlePrev = () => {
    if (periodType === 'day') router.push(`/day/${getPreviousDate(currentId)}`);
    else if (periodType === 'week') router.push(`/week/${getPreviousWeek(currentId)}`);
    else router.push(`/month/${getPreviousMonth(currentId)}`);
  };

  const handleNext = () => {
    if (periodType === 'day') router.push(`/day/${getNextDate(currentId)}`);
    else if (periodType === 'week') router.push(`/week/${getNextWeek(currentId)}`);
    else router.push(`/month/${getNextMonth(currentId)}`);
  };

  const handleJumpCurrent = () => {
    if (periodType === 'day') router.push(`/day/${getTodayDateString()}`);
    else if (periodType === 'week') router.push(`/week/${getCurrentWeekString()}`);
    else router.push(`/month/${getCurrentMonthString()}`);
  };

  // Label calculation
  let fullTitle = '';
  let conciseTitle = '';
  let shortTitle = '';
  let relativeLabel: string | null = null;
  let isCurrent = false;
  let jumpButtonLabel = 'Today';

  if (periodType === 'day') {
    fullTitle = formatFullDate(currentId);
    conciseTitle = formatConciseDate(currentId);
    shortTitle = formatMediumDate(currentId);
    relativeLabel = getRelativeDateLabel(currentId);
    isCurrent = currentId === getTodayDateString();
    jumpButtonLabel = 'Today';
  } else if (periodType === 'week') {
    const range = getWeekDateRange(currentId);
    const weekNum = currentId.split('-W')[1];
    fullTitle = `Week ${parseInt(weekNum, 10)} • ${range.label}`;
    conciseTitle = `W${parseInt(weekNum, 10)} • ${range.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${range.end.getDate()}`;
    shortTitle = `W${parseInt(weekNum, 10)} (${range.start.getDate()}-${range.end.getDate()} ${range.start.toLocaleDateString('en-US', { month: 'short' })})`;
    relativeLabel = getRelativeWeekLabel(currentId);
    isCurrent = currentId === getCurrentWeekString();
    jumpButtonLabel = 'This Week';
  } else {
    fullTitle = formatMonthYear(currentId);
    conciseTitle = formatMonthYear(currentId);
    shortTitle = formatMonthYear(currentId);
    relativeLabel = getRelativeMonthLabel(currentId);
    isCurrent = currentId === getCurrentMonthString();
    jumpButtonLabel = 'This Month';
  }

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
    <div className="relative flex items-center justify-between gap-2 w-full">
      {/* Title & Relative Badge */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="hidden sm:inline font-medium text-xs sm:text-sm tracking-tight text-zinc-900 dark:text-zinc-50 select-none truncate"
          title={fullTitle}
        >
          {conciseTitle}
        </span>
        <span
          className="sm:hidden font-medium text-xs tracking-tight text-zinc-900 dark:text-zinc-50 select-none truncate"
          title={fullTitle}
        >
          {shortTitle}
        </span>

        {relativeLabel && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
              isCurrent
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60'
            }`}
          >
            {relativeLabel}
          </span>
        )}
      </div>

      {/* Navigation Controls: Arrows, Jump Current, Calendar Picker */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/70 dark:border-zinc-700/70">
          <button
            onClick={handlePrev}
            title="Previous (Hotkey: [ )"
            className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {!isCurrent && (
            <button
              onClick={handleJumpCurrent}
              title={`Jump to ${jumpButtonLabel} (Hotkey: T)`}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded transition-all shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-zinc-500" />
              <span className="hidden md:inline">{jumpButtonLabel}</span>
            </button>
          )}

          <button
            onClick={handleNext}
            title="Next (Hotkey: ] )"
            className="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-2xs"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Calendar / Period Popover Button */}
        <div className="relative">
          <button
            onClick={handleTogglePicker}
            title="Pick a date"
            className={`p-1.5 rounded-lg border transition-colors ${
              isPickerOpen
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                : 'border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
          </button>

          {/* Popover */}
          {isPickerOpen && (
            <div
              ref={popoverRef}
              className="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl bg-white dark:bg-zinc-900 p-3.5 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Header: Month switcher */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-1"
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
                  const targetWeekId = getWeekId(dateStr);
                  const targetMonthId = dateStr.slice(0, 7);

                  let isSelected = false;
                  let hasEntries = false;

                  if (periodType === 'day') {
                    isSelected = dateStr === currentId;
                    hasEntries = loggedEntries.has(dateStr);
                  } else if (periodType === 'week') {
                    isSelected = targetWeekId === currentId;
                    hasEntries = loggedEntries.has(targetWeekId);
                  } else {
                    isSelected = targetMonthId === currentId;
                    hasEntries = loggedEntries.has(targetMonthId);
                  }

                  const isTodayDate = dateStr === getTodayDateString();

                  const handleCellClick = () => {
                    setIsPickerOpen(false);
                    if (periodType === 'day') router.push(`/day/${dateStr}`);
                    else if (periodType === 'week') router.push(`/week/${targetWeekId}`);
                    else router.push(`/month/${targetMonthId}`);
                  };

                  return (
                    <button
                      key={dateStr}
                      onClick={handleCellClick}
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
