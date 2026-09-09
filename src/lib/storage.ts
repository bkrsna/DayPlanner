import { DayData, DaySummary, HabitItem } from '@/types';
import { isValidDateString, parseDate } from './dateUtils';

const STORAGE_PREFIX = 'daily_goal_tracker_day_';
const INDEX_KEY = 'daily_goal_tracker_index';
const SETTINGS_KEY = 'daily_goal_tracker_settings';

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

export function getAllDaySummaries(): DaySummary[] {
  const dates = getAllSavedDates();
  return dates.map((d) => {
    const data = getDayData(d);
    const completedTodos = data.todos.filter((t) => t.completed).length;
    const completedHabits = data.habits.filter((h) => h.completed).length;
    const hasNotes = Boolean(
      data.reflections.morningIntentions.trim() ||
        data.reflections.eveningReflection.trim() ||
        data.reflections.notes.trim()
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
  const exportPayload: Record<string, DayData> = {};

  for (const d of dates) {
    exportPayload[d] = getDayData(d);
  }

  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      days: exportPayload,
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
    const days = parsed.days || parsed; // Support both { days: { ... } } and raw dict
    let count = 0;

    for (const [key, value] of Object.entries(days)) {
      if (isValidDateString(key) && typeof value === 'object' && value !== null) {
        const validatedDay: DayData = {
          ...getDefaultDayData(key),
          ...(value as Partial<DayData>),
          date: key,
        };
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(validatedDay));
        updateIndex(key);
        count++;
      }
    }

    window.dispatchEvent(new CustomEvent('daily_tracker_data_change', { detail: { type: 'import' } }));
    return { success: true, count };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
}
