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
    const indexDates: string[] = raw ? JSON.parse(raw) : [];
    const dateSet = new Set<string>(Array.isArray(indexDates) ? indexDates : []);

    // Self-healing: discover any unindexed day records
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const dateStr = key.slice(STORAGE_PREFIX.length);
        if (isValidDateString(dateStr)) {
          dateSet.add(dateStr);
        }
      }
    }

    const sorted = Array.from(dateSet).sort();
    if (sorted.length !== (Array.isArray(indexDates) ? indexDates.length : 0)) {
      localStorage.setItem(INDEX_KEY, JSON.stringify(sorted));
    }
    return sorted;
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
    const indexWeeks: string[] = raw ? JSON.parse(raw) : [];
    const weekSet = new Set<string>(Array.isArray(indexWeeks) ? indexWeeks : []);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(WEEK_STORAGE_PREFIX)) {
        const weekStr = key.slice(WEEK_STORAGE_PREFIX.length);
        if (isValidWeekString(weekStr)) {
          weekSet.add(weekStr);
        }
      }
    }

    const sorted = Array.from(weekSet).sort();
    if (sorted.length !== (Array.isArray(indexWeeks) ? indexWeeks.length : 0)) {
      localStorage.setItem(WEEK_INDEX_KEY, JSON.stringify(sorted));
    }
    return sorted;
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
    const indexMonths: string[] = raw ? JSON.parse(raw) : [];
    const monthSet = new Set<string>(Array.isArray(indexMonths) ? indexMonths : []);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MONTH_STORAGE_PREFIX)) {
        const monthStr = key.slice(MONTH_STORAGE_PREFIX.length);
        if (isValidMonthString(monthStr)) {
          monthSet.add(monthStr);
        }
      }
    }

    const sorted = Array.from(monthSet).sort();
    if (sorted.length !== (Array.isArray(indexMonths) ? indexMonths.length : 0)) {
      localStorage.setItem(MONTH_INDEX_KEY, JSON.stringify(sorted));
    }
    return sorted;
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

export interface ImportDataResult {
  success: boolean;
  count: number;
  weeksCount?: number;
  monthsCount?: number;
  settingsRestored?: boolean;
  hasLocalNewer?: boolean;
  error?: string;
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

  let selectedCities: unknown = null;
  try {
    const rawCities = localStorage.getItem('daytrack_selected_cities_v2');
    if (rawCities) selectedCities = JSON.parse(rawCities);
  } catch {
    selectedCities = localStorage.getItem('daytrack_selected_cities_v2');
  }

  let macClockCities: unknown = null;
  try {
    const rawMac = localStorage.getItem('mac_app_clock_cities_v1');
    if (rawMac) macClockCities = JSON.parse(rawMac);
  } catch {
    macClockCities = localStorage.getItem('mac_app_clock_cities_v1');
  }

  const settings = {
    theme: localStorage.getItem('daily_theme') || 'system',
    todoViewMode: localStorage.getItem('dayplanner_todo_view_mode') || 'grid',
    selectedCities,
    macClockCities,
  };

  return JSON.stringify(
    {
      version: 3,
      app: 'DayPlanner',
      exportedAt: new Date().toISOString(),
      days: exportPayload,
      weeks: exportWeeks,
      months: exportMonths,
      settings,
    },
    null,
    2
  );
}

export function importDataFromJSON(jsonStr: string): ImportDataResult {
  if (!isLocalStorageAvailable()) {
    return { success: false, count: 0, error: 'localStorage is not available' };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, count: 0, error: 'Invalid JSON payload' };
    }

    let importedDaysCount = 0;
    let importedWeeksCount = 0;
    let importedMonthsCount = 0;

    // 1. Days import (support v3, v2, v1 flat, or legacy 'days' property)
    const days = parsed.days || (!parsed.weeks && !parsed.months && !parsed.version ? parsed : {});
    if (days && typeof days === 'object') {
      for (const [key, value] of Object.entries(days)) {
        if (isValidDateString(key) && typeof value === 'object' && value !== null) {
          const valObj = value as Partial<DayData>;
          const defaults = getDefaultDayData(key);
          const validatedDay: DayData = {
            ...defaults,
            ...valObj,
            date: key,
            todos: Array.isArray(valObj.todos)
              ? valObj.todos.map((t) => ({
                  ...t,
                  category: t.category,
                  priority: t.priority || 'medium',
                  completed: Boolean(t.completed),
                  subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                }))
              : [],
            journal:
              typeof valObj.journal === 'string'
                ? valObj.journal
                : valObj.reflections?.notes || '',
            notes: Array.isArray(valObj.notes) ? valObj.notes : [],
            habits:
              Array.isArray(valObj.habits) && valObj.habits.length > 0
                ? valObj.habits
                : defaults.habits,
            vitals: { ...defaults.vitals, ...(valObj.vitals || {}) },
            reflections: { ...defaults.reflections, ...(valObj.reflections || {}) },
          };
          localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(validatedDay));
          importedDaysCount++;
        }
      }
    }

    // 2. Weeks import
    if (parsed.weeks && typeof parsed.weeks === 'object') {
      for (const [key, value] of Object.entries(parsed.weeks)) {
        if (isValidWeekString(key) && typeof value === 'object' && value !== null) {
          const valObj = value as Partial<WeekData>;
          const defaults = getDefaultWeekData(key);
          const validatedWeek: WeekData = {
            ...defaults,
            ...valObj,
            week: key,
            todos: Array.isArray(valObj.todos)
              ? valObj.todos.map((t) => ({
                  ...t,
                  category: t.category,
                  priority: t.priority || 'medium',
                  completed: Boolean(t.completed),
                  subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                }))
              : [],
            journal: typeof valObj.journal === 'string' ? valObj.journal : '',
            notes: Array.isArray(valObj.notes) ? valObj.notes : [],
          };
          localStorage.setItem(`${WEEK_STORAGE_PREFIX}${key}`, JSON.stringify(validatedWeek));
          importedWeeksCount++;
        }
      }
    }

    // 3. Months import
    if (parsed.months && typeof parsed.months === 'object') {
      for (const [key, value] of Object.entries(parsed.months)) {
        if (isValidMonthString(key) && typeof value === 'object' && value !== null) {
          const valObj = value as Partial<MonthData>;
          const defaults = getDefaultMonthData(key);
          const validatedMonth: MonthData = {
            ...defaults,
            ...valObj,
            month: key,
            todos: Array.isArray(valObj.todos)
              ? valObj.todos.map((t) => ({
                  ...t,
                  category: t.category,
                  priority: t.priority || 'medium',
                  completed: Boolean(t.completed),
                  subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                }))
              : [],
            journal: typeof valObj.journal === 'string' ? valObj.journal : '',
            notes: Array.isArray(valObj.notes) ? valObj.notes : [],
          };
          localStorage.setItem(`${MONTH_STORAGE_PREFIX}${key}`, JSON.stringify(validatedMonth));
          importedMonthsCount++;
        }
      }
    }

    // 4. Settings restore
    let settingsRestored = false;
    if (parsed.settings && typeof parsed.settings === 'object') {
      const s = parsed.settings;
      if (typeof s.theme === 'string' && ['light', 'dark', 'system'].includes(s.theme)) {
        localStorage.setItem('daily_theme', s.theme);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('daily_theme_change', { detail: { theme: s.theme } })
          );
        }
        settingsRestored = true;
      }
      if (typeof s.todoViewMode === 'string' && ['grid', 'list'].includes(s.todoViewMode)) {
        localStorage.setItem('dayplanner_todo_view_mode', s.todoViewMode);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dayplanner_viewmode_change', { detail: { mode: s.todoViewMode } })
          );
        }
        settingsRestored = true;
      }
      if (s.selectedCities !== undefined && s.selectedCities !== null) {
        localStorage.setItem(
          'daytrack_selected_cities_v2',
          typeof s.selectedCities === 'string'
            ? s.selectedCities
            : JSON.stringify(s.selectedCities)
        );
        settingsRestored = true;
      }
      if (s.macClockCities !== undefined && s.macClockCities !== null) {
        localStorage.setItem(
          'mac_app_clock_cities_v1',
          typeof s.macClockCities === 'string'
            ? s.macClockCities
            : JSON.stringify(s.macClockCities)
        );
        settingsRestored = true;
      }
    }

    // 5. Rebuild indices atomically
    getAllSavedDates();
    getAllSavedWeeks();
    getAllSavedMonths();

    // 6. Broadcast event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('daily_tracker_data_change', { detail: { type: 'import' } })
      );
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      count: importedDaysCount,
      weeksCount: importedWeeksCount,
      monthsCount: importedMonthsCount,
      settingsRestored,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
}

export function mergeDataFromJSON(
  jsonStr: string,
  options?: { source?: string }
): ImportDataResult {
  if (!isLocalStorageAvailable()) {
    return { success: false, count: 0, error: 'localStorage is not available' };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, count: 0, error: 'Invalid JSON payload' };
    }

    let importedDaysCount = 0;
    let importedWeeksCount = 0;
    let importedMonthsCount = 0;
    let hasLocalNewer = false;

    // Check existing saved dates, weeks, months in local
    const localDates = new Set(getAllSavedDates());
    const localWeeks = new Set(getAllSavedWeeks());
    const localMonths = new Set(getAllSavedMonths());

    // 1. Days merge
    const days = parsed.days || (!parsed.weeks && !parsed.months && !parsed.version ? parsed : {});
    const incomingDates = new Set<string>();

    if (days && typeof days === 'object') {
      for (const [key, value] of Object.entries(days)) {
        if (isValidDateString(key) && typeof value === 'object' && value !== null) {
          incomingDates.add(key);
          const valObj = value as Partial<DayData>;
          const defaults = getDefaultDayData(key);
          const validatedDay: DayData = {
            ...defaults,
            ...valObj,
            date: key,
            todos: Array.isArray(valObj.todos)
              ? valObj.todos.map((t) => ({
                  ...t,
                  category: t.category,
                  priority: t.priority || 'medium',
                  completed: Boolean(t.completed),
                  subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                }))
              : [],
            journal:
              typeof valObj.journal === 'string'
                ? valObj.journal
                : valObj.reflections?.notes || '',
            notes: Array.isArray(valObj.notes) ? valObj.notes : [],
            habits:
              Array.isArray(valObj.habits) && valObj.habits.length > 0
                ? valObj.habits
                : defaults.habits,
            vitals: { ...defaults.vitals, ...(valObj.vitals || {}) },
            reflections: { ...defaults.reflections, ...(valObj.reflections || {}) },
          };

          const rawExisting = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
          if (rawExisting) {
            try {
              const existingDay: DayData = JSON.parse(rawExisting);
              const remoteTime = new Date(validatedDay.updatedAt || 0).getTime();
              const localTime = new Date(existingDay.updatedAt || 0).getTime();

              if (remoteTime >= localTime) {
                // Remote is newer or equal: update local
                localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(validatedDay));
                importedDaysCount++;
              } else {
                // Local is newer: preserve local and mark that local has changes to sync back
                hasLocalNewer = true;
              }
            } catch {
              localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(validatedDay));
              importedDaysCount++;
            }
          } else {
            // Local doesn't have this day: import it
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(validatedDay));
            importedDaysCount++;
          }
        }
      }
    }

    // Check if local has dates that incoming file doesn't have
    for (const d of localDates) {
      if (!incomingDates.has(d)) {
        hasLocalNewer = true;
      }
    }

    // 2. Weeks merge
    const incomingWeeks = new Set<string>();
    if (parsed.weeks && typeof parsed.weeks === 'object') {
      for (const [key, value] of Object.entries(parsed.weeks)) {
        if (isValidWeekString(key) && typeof value === 'object' && value !== null) {
          incomingWeeks.add(key);
          const valObj = value as Partial<WeekData>;
          const defaults = getDefaultWeekData(key);
          const validatedWeek: WeekData = {
            ...defaults,
            ...valObj,
            week: key,
            todos: Array.isArray(valObj.todos)
              ? valObj.todos.map((t) => ({
                  ...t,
                  category: t.category,
                  priority: t.priority || 'medium',
                  completed: Boolean(t.completed),
                  subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                }))
              : [],
            journal: typeof valObj.journal === 'string' ? valObj.journal : '',
            notes: Array.isArray(valObj.notes) ? valObj.notes : [],
          };

          const rawExisting = localStorage.getItem(`${WEEK_STORAGE_PREFIX}${key}`);
          if (rawExisting) {
            try {
              const existingWeek: WeekData = JSON.parse(rawExisting);
              const remoteTime = new Date(validatedWeek.updatedAt || 0).getTime();
              const localTime = new Date(existingWeek.updatedAt || 0).getTime();

              if (remoteTime >= localTime) {
                localStorage.setItem(`${WEEK_STORAGE_PREFIX}${key}`, JSON.stringify(validatedWeek));
                importedWeeksCount++;
              } else {
                hasLocalNewer = true;
              }
            } catch {
              localStorage.setItem(`${WEEK_STORAGE_PREFIX}${key}`, JSON.stringify(validatedWeek));
              importedWeeksCount++;
            }
          } else {
            localStorage.setItem(`${WEEK_STORAGE_PREFIX}${key}`, JSON.stringify(validatedWeek));
            importedWeeksCount++;
          }
        }
      }
    }

    for (const w of localWeeks) {
      if (!incomingWeeks.has(w)) {
        hasLocalNewer = true;
      }
    }

    // 3. Months merge
    const incomingMonths = new Set<string>();
    if (parsed.months && typeof parsed.months === 'object') {
      for (const [key, value] of Object.entries(parsed.months)) {
        if (isValidMonthString(key) && typeof value === 'object' && value !== null) {
          incomingMonths.add(key);
          const valObj = value as Partial<MonthData>;
          const defaults = getDefaultMonthData(key);
          const validatedMonth: MonthData = {
            ...defaults,
            ...valObj,
            month: key,
            todos: Array.isArray(valObj.todos)
              ? valObj.todos.map((t) => ({
                  ...t,
                  category: t.category,
                  priority: t.priority || 'medium',
                  completed: Boolean(t.completed),
                  subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
                }))
              : [],
            journal: typeof valObj.journal === 'string' ? valObj.journal : '',
            notes: Array.isArray(valObj.notes) ? valObj.notes : [],
          };

          const rawExisting = localStorage.getItem(`${MONTH_STORAGE_PREFIX}${key}`);
          if (rawExisting) {
            try {
              const existingMonth: MonthData = JSON.parse(rawExisting);
              const remoteTime = new Date(validatedMonth.updatedAt || 0).getTime();
              const localTime = new Date(existingMonth.updatedAt || 0).getTime();

              if (remoteTime >= localTime) {
                localStorage.setItem(`${MONTH_STORAGE_PREFIX}${key}`, JSON.stringify(validatedMonth));
                importedMonthsCount++;
              } else {
                hasLocalNewer = true;
              }
            } catch {
              localStorage.setItem(`${MONTH_STORAGE_PREFIX}${key}`, JSON.stringify(validatedMonth));
              importedMonthsCount++;
            }
          } else {
            localStorage.setItem(`${MONTH_STORAGE_PREFIX}${key}`, JSON.stringify(validatedMonth));
            importedMonthsCount++;
          }
        }
      }
    }

    for (const m of localMonths) {
      if (!incomingMonths.has(m)) {
        hasLocalNewer = true;
      }
    }

    // 4. Settings restore
    let settingsRestored = false;
    if (parsed.settings && typeof parsed.settings === 'object') {
      const s = parsed.settings;
      if (typeof s.theme === 'string' && ['light', 'dark', 'system'].includes(s.theme)) {
        if (!localStorage.getItem('daily_theme')) {
          localStorage.setItem('daily_theme', s.theme);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('daily_theme_change', { detail: { theme: s.theme } })
            );
          }
          settingsRestored = true;
        }
      }
      if (typeof s.todoViewMode === 'string' && ['grid', 'list'].includes(s.todoViewMode)) {
        if (!localStorage.getItem('dayplanner_todo_view_mode')) {
          localStorage.setItem('dayplanner_todo_view_mode', s.todoViewMode);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('dayplanner_viewmode_change', { detail: { mode: s.todoViewMode } })
            );
          }
          settingsRestored = true;
        }
      }
      if (s.selectedCities !== undefined && s.selectedCities !== null && !localStorage.getItem('daytrack_selected_cities_v2')) {
        localStorage.setItem(
          'daytrack_selected_cities_v2',
          typeof s.selectedCities === 'string'
            ? s.selectedCities
            : JSON.stringify(s.selectedCities)
        );
        settingsRestored = true;
      }
      if (s.macClockCities !== undefined && s.macClockCities !== null && !localStorage.getItem('mac_app_clock_cities_v1')) {
        localStorage.setItem(
          'mac_app_clock_cities_v1',
          typeof s.macClockCities === 'string'
            ? s.macClockCities
            : JSON.stringify(s.macClockCities)
        );
        settingsRestored = true;
      }
    }

    // 5. Rebuild indices atomically
    getAllSavedDates();
    getAllSavedWeeks();
    getAllSavedMonths();

    // 6. Broadcast event with source metadata
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('daily_tracker_data_change', {
          detail: { type: 'import', source: options?.source || 'disk' },
        })
      );
      window.dispatchEvent(new Event('storage'));
    }

    return {
      success: true,
      count: importedDaysCount,
      weeksCount: importedWeeksCount,
      monthsCount: importedMonthsCount,
      settingsRestored,
      hasLocalNewer,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, count: 0, error: message };
  }
}

