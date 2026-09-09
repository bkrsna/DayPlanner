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
