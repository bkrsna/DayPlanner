import { DayData, DaySummary, HabitItem, WeekData, MonthData } from '@/types';
import { isValidDateString, isValidWeekString, isValidMonthString } from './dateUtils';

const STORAGE_PREFIX = 'daily_goal_tracker_day_';
const INDEX_KEY = 'daily_goal_tracker_index';
const WEEK_STORAGE_PREFIX = 'daily_goal_tracker_week_';
const WEEK_INDEX_KEY = 'daily_goal_tracker_week_index';
const MONTH_STORAGE_PREFIX = 'daily_goal_tracker_month_';
const MONTH_INDEX_KEY = 'daily_goal_tracker_month_index';

export const DEFAULT_HABITS: Omit<HabitItem, 'id' | 'completed'>[] = [
  { title: '💧 Drink 2L Water', category: 'health' },
  { title: '⚡ Deep Work (90m)', category: 'focus' },
  { title: '🏃 30m Movement / Workout', category: 'body' },
  { title: '📖 Read / Learn (20m)', category: 'mind' },
  { title: '🌙 Evening Review', category: 'mind' },
];

export function getDefaultDayData(date: string): DayData {
  const now = new Date().toISOString();
  return {
    date,
    createdAt: now,
    updatedAt: now,
    oneBigThing: '',
    oneBigThingDone: false,
    todos: [],
    journal: '',
    notes: [],
    habits: DEFAULT_HABITS.map((h, i) => ({
      id: `habit-${i + 1}`,
      title: h.title,
      completed: false,
      category: h.category,
    })),
    vitals: {
      mood: 0,
      energy: 0,
    },
    reflections: {
      morningIntentions: '',
      eveningReflection: '',
      notes: '',
    },
  };
}

export function isLocalStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getAllSavedDates(): string[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed: string[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.sort() : [];
  } catch (err) {
    console.error('Failed to read day index from localStorage:', err);
    return [];
  }
}

function updateIndex(date: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const dates = new Set(getAllSavedDates());
    dates.add(date);
    localStorage.setItem(INDEX_KEY, JSON.stringify(Array.from(dates).sort()));
  } catch (err) {
    console.error('Failed to update date index:', err);
  }
}

export function getDayData(date: string): DayData {
  if (!isLocalStorageAvailable()) {
    return getDefaultDayData(date);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${date}`);
    if (!raw) {
      return getDefaultDayData(date);
    }
    const data: DayData = JSON.parse(raw);

    // Merge with defaults to guarantee backward compatibility if new fields added
    const defaults = getDefaultDayData(date);
    return {
      ...defaults,
      ...data,
      todos: Array.isArray(data.todos) ? data.todos : [],
      journal: typeof data.journal === 'string' ? data.journal : data.reflections?.notes || '',
      notes: Array.isArray(data.notes) ? data.notes : [],
      habits: Array.isArray(data.habits) && data.habits.length > 0 ? data.habits : defaults.habits,
      vitals: { ...defaults.vitals, ...(data.vitals || {}) },
      reflections: { ...defaults.reflections, ...(data.reflections || {}) },
    };
  } catch (err) {
    console.error(`Failed to parse data for ${date}:`, err);
    return getDefaultDayData(date);
  }
}

export function saveDayData(data: DayData): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const updatedData: DayData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${data.date}`, JSON.stringify(updatedData));
    updateIndex(data.date);

    // Broadcast local event asynchronously so it never interrupts an ongoing React render cycle
    if (typeof window !== 'undefined') {
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('daily_tracker_data_change', {
            detail: { date: data.date, data: updatedData },
          })
        );
      });
    }
  } catch (err) {
    console.error(`Failed to save data for ${data.date}:`, err);
  }
}

export function getPreviousActiveDayData(currentDate: string): DayData | null {
  const dates = getAllSavedDates();
  const priorDates = dates.filter((d) => d < currentDate).sort();
  if (priorDates.length === 0) return null;

  const lastDate = priorDates[priorDates.length - 1];
  return getDayData(lastDate);
}

// ---------------------------------------------------------------------------
// Week Storage Operations
// ---------------------------------------------------------------------------

export function getDefaultWeekData(week: string): WeekData {
  const now = new Date().toISOString();
  return {
    week,
    createdAt: now,
    updatedAt: now,
    todos: [],
    journal: '',
    notes: [],
  };
}

export function getAllSavedWeeks(): string[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(WEEK_INDEX_KEY);
    if (!raw) return [];
    const parsed: string[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.sort() : [];
  } catch (err) {
    console.error('Failed to read week index from localStorage:', err);
    return [];
  }
}

function updateWeekIndex(week: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const weeks = new Set(getAllSavedWeeks());
    weeks.add(week);
    localStorage.setItem(WEEK_INDEX_KEY, JSON.stringify(Array.from(weeks).sort()));
  } catch (err) {
    console.error('Failed to update week index:', err);
  }
}

export function getWeekData(week: string): WeekData {
  if (!isLocalStorageAvailable()) {
    return getDefaultWeekData(week);
  }
  try {
    const raw = localStorage.getItem(`${WEEK_STORAGE_PREFIX}${week}`);
    if (!raw) return getDefaultWeekData(week);
    const data: WeekData = JSON.parse(raw);
    const defaults = getDefaultWeekData(week);
    return {
      ...defaults,
      ...data,
      todos: Array.isArray(data.todos) ? data.todos : [],
      journal: typeof data.journal === 'string' ? data.journal : '',
      notes: Array.isArray(data.notes) ? data.notes : [],
    };
  } catch (err) {
    console.error(`Failed to parse data for week ${week}:`, err);
    return getDefaultWeekData(week);
  }
}

export function saveWeekData(data: WeekData): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const updatedData: WeekData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${WEEK_STORAGE_PREFIX}${data.week}`, JSON.stringify(updatedData));
    updateWeekIndex(data.week);

    if (typeof window !== 'undefined') {
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('daily_tracker_data_change', {
            detail: { type: 'week', week: data.week, data: updatedData },
          })
        );
      });
    }
  } catch (err) {
    console.error(`Failed to save data for week ${data.week}:`, err);
  }
}

export function getPreviousActiveWeekData(currentWeek: string): WeekData | null {
  const weeks = getAllSavedWeeks();
  const priorWeeks = weeks.filter((w) => w < currentWeek).sort();
  if (priorWeeks.length === 0) return null;
  const lastWeek = priorWeeks[priorWeeks.length - 1];
  return getWeekData(lastWeek);
}

// ---------------------------------------------------------------------------
// Month Storage Operations
// ---------------------------------------------------------------------------

export function getDefaultMonthData(month: string): MonthData {
  const now = new Date().toISOString();
  return {
    month,
    createdAt: now,
    updatedAt: now,
    todos: [],
    journal: '',
    notes: [],
  };
}

export function getAllSavedMonths(): string[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(MONTH_INDEX_KEY);
    if (!raw) return [];
    const parsed: string[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.sort() : [];
  } catch (err) {
    console.error('Failed to read month index from localStorage:', err);
    return [];
  }
}

function updateMonthIndex(month: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const months = new Set(getAllSavedMonths());
    months.add(month);
    localStorage.setItem(MONTH_INDEX_KEY, JSON.stringify(Array.from(months).sort()));
  } catch (err) {
    console.error('Failed to update month index:', err);
  }
}

export function getMonthData(month: string): MonthData {
  if (!isLocalStorageAvailable()) {
    return getDefaultMonthData(month);
  }
  try {
    const raw = localStorage.getItem(`${MONTH_STORAGE_PREFIX}${month}`);
    if (!raw) return getDefaultMonthData(month);
    const data: MonthData = JSON.parse(raw);
    const defaults = getDefaultMonthData(month);
    return {
      ...defaults,
      ...data,
      todos: Array.isArray(data.todos) ? data.todos : [],
      journal: typeof data.journal === 'string' ? data.journal : '',
      notes: Array.isArray(data.notes) ? data.notes : [],
    };
  } catch (err) {
    console.error(`Failed to parse data for month ${month}:`, err);
    return getDefaultMonthData(month);
  }
}

export function saveMonthData(data: MonthData): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const updatedData: MonthData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${MONTH_STORAGE_PREFIX}${data.month}`, JSON.stringify(updatedData));
    updateMonthIndex(data.month);

    if (typeof window !== 'undefined') {
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('daily_tracker_data_change', {
            detail: { type: 'month', month: data.month, data: updatedData },
          })
        );
      });
    }
  } catch (err) {
    console.error(`Failed to save data for month ${data.month}:`, err);
  }
}

export function getPreviousActiveMonthData(currentMonth: string): MonthData | null {
  const months = getAllSavedMonths();
  const priorMonths = months.filter((m) => m < currentMonth).sort();
  if (priorMonths.length === 0) return null;
  const lastMonth = priorMonths[priorMonths.length - 1];
  return getMonthData(lastMonth);
}

export function getAllDaySummaries(): DaySummary[] {
  const dates = getAllSavedDates();
  return dates.map((d) => {
    const data = getDayData(d);
    const completedTodos = data.todos.filter((t) => t.completed).length;
    const completedHabits = data.habits.filter((h) => h.completed).length;
    const hasNotes = Boolean(
      (data.journal && data.journal.trim()) ||
        data.reflections.morningIntentions.trim() ||
        data.reflections.eveningReflection.trim() ||
        data.reflections.notes.trim() ||
        (Array.isArray(data.notes) && data.notes.length > 0)
    );

    return {
      date: d,
      totalTodos: data.todos.length,
      completedTodos,
      hasOneBigThing: Boolean(data.oneBigThing.trim()),
      oneBigThingDone: data.oneBigThingDone,
      totalHabits: data.habits.length,
      completedHabits,
      hasNotes,
      mood: data.vitals.mood,
    };
  });
}

export function exportAllDataAsJSON(): string {
  if (!isLocalStorageAvailable()) return '{}';
  const dates = getAllSavedDates();
  const weeks = getAllSavedWeeks();
  const months = getAllSavedMonths();

  const exportPayload: Record<string, DayData> = {};
  for (const d of dates) {
    exportPayload[d] = getDayData(d);
  }

  const exportWeeks: Record<string, WeekData> = {};
  for (const w of weeks) {
    exportWeeks[w] = getWeekData(w);
  }

  const exportMonths: Record<string, MonthData> = {};
  for (const m of months) {
    exportMonths[m] = getMonthData(m);
  }

  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      days: exportPayload,
      weeks: exportWeeks,
      months: exportMonths,
    },
    null,
    2
  );
}

export function importDataFromJSON(jsonStr: string): { success: boolean; count: number; error?: string } {
  if (!isLocalStorageAvailable()) {
    return { success: false, count: 0, error: 'localStorage is not available' };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    let count = 0;

    // Days import
    const days = parsed.days || (!parsed.weeks && !parsed.months ? parsed : {});
    if (days && typeof days === 'object') {
      for (const [key, value] of Object.entries(days)) {
        if (isValidDateString(key) && typeof value === 'object' && value !== null) {
          const validatedDay: DayData = {
            ...getDefaultDayData(key),
            ...(value as Partial<DayData>),
            notes: Array.isArray((value as DayData).notes) ? (value as DayData).notes : [],
            date: key,
          };
          localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(validatedDay));
          updateIndex(key);
          count++;
        }
      }
    }

    // Weeks import
    if (parsed.weeks && typeof parsed.weeks === 'object') {
      for (const [key, value] of Object.entries(parsed.weeks)) {
        if (isValidWeekString(key) && typeof value === 'object' && value !== null) {
          const validatedWeek: WeekData = {
            ...getDefaultWeekData(key),
            ...(value as Partial<WeekData>),
            notes: Array.isArray((value as WeekData).notes) ? (value as WeekData).notes : [],
            week: key,
          };
          localStorage.setItem(`${WEEK_STORAGE_PREFIX}${key}`, JSON.stringify(validatedWeek));
          updateWeekIndex(key);
          count++;
        }
      }
    }

    // Months import
    if (parsed.months && typeof parsed.months === 'object') {
      for (const [key, value] of Object.entries(parsed.months)) {
        if (isValidMonthString(key) && typeof value === 'object' && value !== null) {
          const validatedMonth: MonthData = {
            ...getDefaultMonthData(key),
            ...(value as Partial<MonthData>),
            notes: Array.isArray((value as MonthData).notes) ? (value as MonthData).notes : [],
            month: key,
          };
          localStorage.setItem(`${MONTH_STORAGE_PREFIX}${key}`, JSON.stringify(validatedMonth));
          updateMonthIndex(key);
          count++;
        }
      }
    }

    window.dispatchEvent(new CustomEvent('daily_tracker_data_change', { detail: { type: 'import' } }));
    return { success: true, count };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
}
