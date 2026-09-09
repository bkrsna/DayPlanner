/**
 * Date utility functions for the daily goal tracker.
 * Ensures consistent local-time handling without timezone drift.
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidDateString(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousDate(dateStr: string): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() - 1);
  return toDateString(date);
}

export function getNextDate(dateStr: string): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + 1);
  return toDateString(date);
}

export function formatFullDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMediumDate(dateStr: string): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getRelativeDateLabel(dateStr: string): string | null {
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';

  const prev = getPreviousDate(today);
  if (dateStr === prev) return 'Yesterday';

  const next = getNextDate(today);
  if (dateStr === next) return 'Tomorrow';

  const target = parseDate(dateStr);
  const current = parseDate(today);
  const diffTime = target.getTime() - current.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getLastNDays(n: number, endDateStr?: string): string[] {
  const end = endDateStr ? parseDate(endDateStr) : parseDate(getTodayDateString());
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(toDateString(d));
  }
  return dates;
}

// ---------------------------------------------------------------------------
// ISO Week Utilities
// ---------------------------------------------------------------------------

export function getISOWeek(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3); // Nearest Thursday
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return {
    year: new Date(firstThursday).getFullYear(),
    week: weekNumber,
  };
}

export function getWeekId(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const { year, week } = getISOWeek(d);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function parseWeekString(weekStr: string): { year: number; week: number } | null {
  const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    week: parseInt(match[2], 10),
  };
}

export function isValidWeekString(str: string): boolean {
  const parsed = parseWeekString(str);
  if (!parsed) return false;
  return parsed.week >= 1 && parsed.week <= 53;
}

export function getWeekDateRange(weekStr: string): {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
  label: string;
} {
  const parsed = parseWeekString(weekStr);
  if (!parsed) {
    const now = new Date();
    return {
      start: now,
      end: now,
      startStr: toDateString(now),
      endStr: toDateString(now),
      label: weekStr,
    };
  }

  // Jan 4th is always in week 1 in ISO-8601
  const jan4 = new Date(parsed.year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Monday=0
  const mondayWeek1 = new Date(jan4.getTime() - dayOfWeek * 86400000);

  const startDate = new Date(mondayWeek1.getTime() + (parsed.week - 1) * 7 * 86400000);
  const endDate = new Date(startDate.getTime() + 6 * 86400000);

  const startStr = toDateString(startDate);
  const endStr = toDateString(endDate);

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const yearStr = endDate.getFullYear();

  const label =
    startMonth === endMonth
      ? `${startMonth} ${startDay} – ${endDay}, ${yearStr}`
      : `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${yearStr}`;

  return {
    start: startDate,
    end: endDate,
    startStr,
    endStr,
    label,
  };
}

export function getPreviousWeek(weekStr: string): string {
  const range = getWeekDateRange(weekStr);
  const prevDate = new Date(range.start.getTime() - 7 * 86400000);
  return getWeekId(prevDate);
}

export function getNextWeek(weekStr: string): string {
  const range = getWeekDateRange(weekStr);
  const nextDate = new Date(range.start.getTime() + 7 * 86400000);
  return getWeekId(nextDate);
}

export function getCurrentWeekString(): string {
  return getWeekId(new Date());
}

export function getRelativeWeekLabel(weekStr: string): string | null {
  const currentWeek = getCurrentWeekString();
  if (weekStr === currentWeek) return 'This Week';
  if (weekStr === getPreviousWeek(currentWeek)) return 'Last Week';
  if (weekStr === getNextWeek(currentWeek)) return 'Next Week';
  return null;
}

// ---------------------------------------------------------------------------
// Month Utilities
// ---------------------------------------------------------------------------

export function getCurrentMonthString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function isValidMonthString(str: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(str)) return false;
  const [y, m] = str.split('-').map(Number);
  return y >= 1900 && y <= 2100 && m >= 1 && m <= 12;
}

export function formatMonthYear(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getPreviousMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  const newY = d.getFullYear();
  const newM = String(d.getMonth() + 1).padStart(2, '0');
  return `${newY}-${newM}`;
}

export function getNextMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m, 1);
  const newY = d.getFullYear();
  const newM = String(d.getMonth() + 1).padStart(2, '0');
  return `${newY}-${newM}`;
}

export function getRelativeMonthLabel(monthStr: string): string | null {
  const currentMonth = getCurrentMonthString();
  if (monthStr === currentMonth) return 'This Month';
  if (monthStr === getPreviousMonth(currentMonth)) return 'Last Month';
  if (monthStr === getNextMonth(currentMonth)) return 'Next Month';
  return null;
}

export function getMonthForDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getWeekForDate(dateStr: string): string {
  return getWeekId(parseDate(dateStr));
}

