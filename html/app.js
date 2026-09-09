/**
 * DayTrack - Standalone HTML/CSS/JS Application
 * Exact replication of Next.js project
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. DATE UTILITIES (Exact match of src/lib/dateUtils.ts)
  // =========================================================================

  function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function isValidDateString(str) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
    const [y, m, d] = str.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return (
      date.getFullYear() === y &&
      date.getMonth() === m - 1 &&
      date.getDate() === d
    );
  }

  function parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function toDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getPreviousDate(dateStr) {
    const date = parseDate(dateStr);
    date.setDate(date.getDate() - 1);
    return toDateString(date);
  }

  function getNextDate(dateStr) {
    const date = parseDate(dateStr);
    date.setDate(date.getDate() + 1);
    return toDateString(date);
  }

  function formatFullDate(dateStr) {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatMediumDate(dateStr) {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function getRelativeDateLabel(dateStr) {
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

  function getLastNDays(n, endDateStr) {
    const end = endDateStr ? parseDate(endDateStr) : parseDate(getTodayDateString());
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);
      dates.push(toDateString(d));
    }
    return dates;
  }

  // ISO Week Utilities
  function getISOWeek(date) {
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

  function getWeekId(date) {
    const d = typeof date === 'string' ? parseDate(date) : date;
    const { year, week } = getISOWeek(d);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  function parseWeekString(weekStr) {
    const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
    if (!match) return null;
    return {
      year: parseInt(match[1], 10),
      week: parseInt(match[2], 10),
    };
  }

  function isValidWeekString(str) {
    const parsed = parseWeekString(str);
    if (!parsed) return false;
    return parsed.week >= 1 && parsed.week <= 53;
  }

  function getWeekDateRange(weekStr) {
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

    const jan4 = new Date(parsed.year, 0, 4);
    const dayOfWeek = (jan4.getDay() + 6) % 7;
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

  function getPreviousWeek(weekStr) {
    const range = getWeekDateRange(weekStr);
    const prevDate = new Date(range.start.getTime() - 7 * 86400000);
    return getWeekId(prevDate);
  }

  function getNextWeek(weekStr) {
    const range = getWeekDateRange(weekStr);
    const nextDate = new Date(range.start.getTime() + 7 * 86400000);
    return getWeekId(nextDate);
  }

  function getCurrentWeekString() {
    return getWeekId(new Date());
  }

  function getRelativeWeekLabel(weekStr) {
    const currentWeek = getCurrentWeekString();
    if (weekStr === currentWeek) return 'This Week';
    if (weekStr === getPreviousWeek(currentWeek)) return 'Last Week';
    if (weekStr === getNextWeek(currentWeek)) return 'Next Week';
    return null;
  }

  // Month Utilities
  function getCurrentMonthString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function isValidMonthString(str) {
    if (!/^\d{4}-\d{2}$/.test(str)) return false;
    const [y, m] = str.split('-').map(Number);
    return y >= 1900 && y <= 2100 && m >= 1 && m <= 12;
  }

  function formatMonthYear(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function getPreviousMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    return `${newY}-${newM}`;
  }

  function getNextMonth(monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, '0');
    return `${newY}-${newM}`;
  }

  function getRelativeMonthLabel(monthStr) {
    const currentMonth = getCurrentMonthString();
    if (monthStr === currentMonth) return 'This Month';
    if (monthStr === getPreviousMonth(currentMonth)) return 'Last Month';
    if (monthStr === getNextMonth(currentMonth)) return 'Next Month';
    return null;
  }

  function getMonthForDate(dateStr) {
    return dateStr.slice(0, 7);
  }

  function getWeekForDate(dateStr) {
    return getWeekId(parseDate(dateStr));
  }

  // =========================================================================
  // 2. STORAGE MANAGEMENT (Exact match of src/lib/storage.ts)
  // =========================================================================

  const STORAGE_PREFIX = 'daily_goal_tracker_day_';
  const INDEX_KEY = 'daily_goal_tracker_index';
  const WEEK_STORAGE_PREFIX = 'daily_goal_tracker_week_';
  const WEEK_INDEX_KEY = 'daily_goal_tracker_week_index';
  const MONTH_STORAGE_PREFIX = 'daily_goal_tracker_month_';
  const MONTH_INDEX_KEY = 'daily_goal_tracker_month_index';

  const DEFAULT_HABITS = [
    { title: '💧 Drink 2L Water', category: 'health' },
    { title: '⚡ Deep Work (90m)', category: 'focus' },
    { title: '🏃 30m Movement / Workout', category: 'body' },
    { title: '📖 Read / Learn (20m)', category: 'mind' },
    { title: '🌙 Evening Review', category: 'mind' },
  ];

  function getDefaultDayData(date) {
    const now = new Date().toISOString();
    return {
      date,
      createdAt: now,
      updatedAt: now,
      oneBigThing: '',
      oneBigThingDone: false,
      todos: [],
      journal: '',
      habits: DEFAULT_HABITS.map((h, i) => ({
        id: `habit-${i + 1}`,
        title: h.title,
        completed: false,
        category: h.category,
      })),
      vitals: { mood: 0, energy: 0 },
      reflections: { morningIntentions: '', eveningReflection: '', notes: '' },
    };
  }

  function getAllSavedDates() {
    try {
      const raw = localStorage.getItem(INDEX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.sort() : [];
    } catch (e) {
      return [];
    }
  }

  function updateIndex(date) {
    try {
      const dates = new Set(getAllSavedDates());
      dates.add(date);
      localStorage.setItem(INDEX_KEY, JSON.stringify(Array.from(dates).sort()));
    } catch (e) {}
  }

  function getDayData(date) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${date}`);
      if (!raw) return getDefaultDayData(date);
      const data = JSON.parse(raw);
      const defaults = getDefaultDayData(date);
      return {
        ...defaults,
        ...data,
        todos: Array.isArray(data.todos) ? data.todos : [],
        journal: typeof data.journal === 'string' ? data.journal : data.reflections?.notes || '',
        habits: Array.isArray(data.habits) && data.habits.length > 0 ? data.habits : defaults.habits,
        vitals: { ...defaults.vitals, ...(data.vitals || {}) },
        reflections: { ...defaults.reflections, ...(data.reflections || {}) },
      };
    } catch (e) {
      return getDefaultDayData(date);
    }
  }

  function saveDayData(data) {
    try {
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}${data.date}`, JSON.stringify(updatedData));
      updateIndex(data.date);
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('daily_tracker_data_change', {
            detail: { date: data.date, data: updatedData },
          })
        );
      });
    } catch (e) {
      console.error(e);
    }
  }

  function getPreviousActiveDayData(currentDate) {
    const dates = getAllSavedDates();
    const priorDates = dates.filter((d) => d < currentDate).sort();
    if (priorDates.length === 0) return null;
    const lastDate = priorDates[priorDates.length - 1];
    return getDayData(lastDate);
  }

  // Week storage
  function getDefaultWeekData(week) {
    const now = new Date().toISOString();
    return {
      week,
      createdAt: now,
      updatedAt: now,
      todos: [],
      journal: '',
    };
  }

  function getAllSavedWeeks() {
    try {
      const raw = localStorage.getItem(WEEK_INDEX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.sort() : [];
    } catch (e) {
      return [];
    }
  }

  function updateWeekIndex(week) {
    try {
      const weeks = new Set(getAllSavedWeeks());
      weeks.add(week);
      localStorage.setItem(WEEK_INDEX_KEY, JSON.stringify(Array.from(weeks).sort()));
    } catch (e) {}
  }

  function getWeekData(week) {
    try {
      const raw = localStorage.getItem(`${WEEK_STORAGE_PREFIX}${week}`);
      if (!raw) return getDefaultWeekData(week);
      const data = JSON.parse(raw);
      const defaults = getDefaultWeekData(week);
      return {
        ...defaults,
        ...data,
        todos: Array.isArray(data.todos) ? data.todos : [],
        journal: typeof data.journal === 'string' ? data.journal : '',
      };
    } catch (e) {
      return getDefaultWeekData(week);
    }
  }

  function saveWeekData(data) {
    try {
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${WEEK_STORAGE_PREFIX}${data.week}`, JSON.stringify(updatedData));
      updateWeekIndex(data.week);
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('daily_tracker_data_change', {
            detail: { type: 'week', week: data.week, data: updatedData },
          })
        );
      });
    } catch (e) {
      console.error(e);
    }
  }

  function getPreviousActiveWeekData(currentWeek) {
    const weeks = getAllSavedWeeks();
    const priorWeeks = weeks.filter((w) => w < currentWeek).sort();
    if (priorWeeks.length === 0) return null;
    const lastWeek = priorWeeks[priorWeeks.length - 1];
    return getWeekData(lastWeek);
  }

  // Month storage
  function getDefaultMonthData(month) {
    const now = new Date().toISOString();
    return {
      month,
      createdAt: now,
      updatedAt: now,
      todos: [],
      journal: '',
    };
  }

  function getAllSavedMonths() {
    try {
      const raw = localStorage.getItem(MONTH_INDEX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.sort() : [];
    } catch (e) {
      return [];
    }
  }

  function updateMonthIndex(month) {
    try {
      const months = new Set(getAllSavedMonths());
      months.add(month);
      localStorage.setItem(MONTH_INDEX_KEY, JSON.stringify(Array.from(months).sort()));
    } catch (e) {}
  }

  function getMonthData(month) {
    try {
      const raw = localStorage.getItem(`${MONTH_STORAGE_PREFIX}${month}`);
      if (!raw) return getDefaultMonthData(month);
      const data = JSON.parse(raw);
      const defaults = getDefaultMonthData(month);
      return {
        ...defaults,
        ...data,
        todos: Array.isArray(data.todos) ? data.todos : [],
        journal: typeof data.journal === 'string' ? data.journal : '',
      };
    } catch (e) {
      return getDefaultMonthData(month);
    }
  }

  function saveMonthData(data) {
    try {
      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${MONTH_STORAGE_PREFIX}${data.month}`, JSON.stringify(updatedData));
      updateMonthIndex(data.month);
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('daily_tracker_data_change', {
            detail: { type: 'month', month: data.month, data: updatedData },
          })
        );
      });
    } catch (e) {
      console.error(e);
    }
  }

  function getPreviousActiveMonthData(currentMonth) {
    const months = getAllSavedMonths();
    const priorMonths = months.filter((m) => m < currentMonth).sort();
    if (priorMonths.length === 0) return null;
    const lastMonth = priorMonths[priorMonths.length - 1];
    return getMonthData(lastMonth);
  }

  function getAllDaySummaries() {
    const dates = getAllSavedDates();
    return dates.map((d) => {
      const data = getDayData(d);
      const completedTodos = data.todos.filter((t) => t.completed).length;
      const completedHabits = data.habits.filter((h) => h.completed).length;
      const hasNotes = Boolean(
        (data.journal && data.journal.trim()) ||
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

  function exportAllDataAsJSON() {
    const dates = getAllSavedDates();
    const weeks = getAllSavedWeeks();
    const months = getAllSavedMonths();

    const exportPayload = {};
    for (const d of dates) {
      exportPayload[d] = getDayData(d);
    }

    const exportWeeks = {};
    for (const w of weeks) {
      exportWeeks[w] = getWeekData(w);
    }

    const exportMonths = {};
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

  function importDataFromJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      let count = 0;

      const days = parsed.days || (!parsed.weeks && !parsed.months ? parsed : {});
      if (days && typeof days === 'object') {
        for (const [key, value] of Object.entries(days)) {
          if (isValidDateString(key) && typeof value === 'object' && value !== null) {
            const validatedDay = {
              ...getDefaultDayData(key),
              ...value,
              date: key,
            };
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(validatedDay));
            updateIndex(key);
            count++;
          }
        }
      }

      if (parsed.weeks && typeof parsed.weeks === 'object') {
        for (const [key, value] of Object.entries(parsed.weeks)) {
          if (isValidWeekString(key) && typeof value === 'object' && value !== null) {
            const validatedWeek = {
              ...getDefaultWeekData(key),
              ...value,
              week: key,
            };
            localStorage.setItem(`${WEEK_STORAGE_PREFIX}${key}`, JSON.stringify(validatedWeek));
            updateWeekIndex(key);
            count++;
          }
        }
      }

      if (parsed.months && typeof parsed.months === 'object') {
        for (const [key, value] of Object.entries(parsed.months)) {
          if (isValidMonthString(key) && typeof value === 'object' && value !== null) {
            const validatedMonth = {
              ...getDefaultMonthData(key),
              ...value,
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
    } catch (err) {
      return { success: false, count: 0, error: err instanceof Error ? err.message : String(err) };
    }
  }

  function generateDayMarkdown(day) {
    const lines = [];

    lines.push(`---`);
    lines.push(`date: ${day.date}`);
    lines.push(`created: ${day.createdAt}`);
    lines.push(`updated: ${day.updatedAt}`);
    if (day.vitals.mood) lines.push(`mood: ${day.vitals.mood}/5`);
    if (day.vitals.energy) lines.push(`energy: ${day.vitals.energy}/5`);
    lines.push(`---`);
    lines.push(``);
    lines.push(`# Daily Log: ${formatFullDate(day.date)}`);
    lines.push(``);

    lines.push(`## Daily Tasks`);
    if (day.todos.length === 0) {
      lines.push(`*No tasks recorded for this day.*`);
    } else {
      for (const todo of day.todos) {
        const check = todo.completed ? '[x]' : '[ ]';
        const statusStr = todo.status === 'in_progress' ? '[In Progress] ' : '';
        const prioStr = todo.priority === 'high' ? '[High] ' : '';
        const tagStr = todo.tag ? ` #${todo.tag}` : '';
        const estStr = todo.estimate ? ` (${todo.estimate})` : '';
        lines.push(`- ${check} ${statusStr}${prioStr}${todo.text}${tagStr}${estStr}`);
        if (todo.subtasks && todo.subtasks.length > 0) {
          for (const sub of todo.subtasks) {
            const subCheck = sub.completed ? '[x]' : '[ ]';
            lines.push(`  - ${subCheck} ${sub.text}`);
          }
        }
      }
    }
    lines.push(``);

    if (day.habits.length > 0) {
      lines.push(`## Habits & Rituals`);
      for (const habit of day.habits) {
        lines.push(`- ${habit.completed ? '[x]' : '[ ]'} ${habit.title}`);
      }
      lines.push(``);
    }

    if (day.reflections.morningIntentions.trim()) {
      lines.push(`## Morning Intentions`);
      lines.push(day.reflections.morningIntentions.trim());
      lines.push(``);
    }

    if (day.reflections.eveningReflection.trim()) {
      lines.push(`## Evening Review`);
      lines.push(day.reflections.eveningReflection.trim());
      lines.push(``);
    }

    if (day.reflections.notes.trim()) {
      lines.push(`## Notes & Scratchpad`);
      lines.push(day.reflections.notes.trim());
      lines.push(``);
    }

    if (day.journal && day.journal.trim()) {
      lines.push(`## Journal`);
      lines.push(day.journal.trim());
      lines.push(``);
    }

    return lines.join('\n');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // 3. STATS & STREAKS (Exact match of src/hooks/useStorageStats.ts)
  // =========================================================================

  function calculateStorageStats() {
    const list = getAllDaySummaries();
    const totalDays = list.length;
    let completedTasksCount = 0;
    let totalTasksCount = 0;

    for (const item of list) {
      completedTasksCount += item.completedTodos;
      totalTasksCount += item.totalTodos;
    }

    const activeDates = new Set(
      list
        .filter((item) => item.completedTodos > 0 || item.oneBigThingDone)
        .map((item) => item.date)
    );

    const today = getTodayDateString();
    const yesterday = getPreviousDate(today);

    let currentStreak = 0;
    let checkDate = activeDates.has(today) ? today : activeDates.has(yesterday) ? yesterday : null;

    if (checkDate) {
      while (checkDate && activeDates.has(checkDate)) {
        currentStreak++;
        checkDate = getPreviousDate(checkDate);
      }
    }

    const sortedDates = Array.from(activeDates).sort();
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    for (const d of sortedDates) {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const expected = getPreviousDate(d);
        if (lastDate === expected) {
          tempStreak++;
        } else {
          const prev = parseDate(lastDate);
          const curr = parseDate(d);
          const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
      }
      lastDate = d;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }

    const activeRate = totalDays > 0 ? Math.round((activeDates.size / totalDays) * 100) : 0;

    return {
      totalDays,
      completedTasksCount,
      totalTasksCount,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      activeRate,
      summaries: list,
    };
  }

  function searchAllDays(query) {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const dates = getAllSavedDates();
    const results = [];

    for (const d of dates) {
      const data = getDayData(d);
      const matches = [];

      if (data.oneBigThing && data.oneBigThing.toLowerCase().includes(q)) {
        matches.push(`Focus: ${data.oneBigThing}`);
      }

      for (const t of data.todos) {
        if (t.text.toLowerCase().includes(q)) {
          matches.push(`Task: ${t.text} (${t.completed ? 'Done' : 'Pending'})`);
        }
      }

      if (data.reflections.morningIntentions && data.reflections.morningIntentions.toLowerCase().includes(q)) {
        matches.push(`Morning: ${data.reflections.morningIntentions.slice(0, 80)}...`);
      }
      if (data.reflections.eveningReflection && data.reflections.eveningReflection.toLowerCase().includes(q)) {
        matches.push(`Reflection: ${data.reflections.eveningReflection.slice(0, 80)}...`);
      }
      if (data.reflections.notes && data.reflections.notes.toLowerCase().includes(q)) {
        matches.push(`Notes: ${data.reflections.notes.slice(0, 80)}...`);
      }
      if (data.journal && data.journal.toLowerCase().includes(q)) {
        matches.push(`Journal: ${data.journal.slice(0, 80)}...`);
      }

      if (matches.length > 0) {
        results.push({ date: d, matches });
      }
    }

    return results;
  }

  // =========================================================================
  // 4. LUCIDE ICONS (Exact SVG markup matching lucide-react)
  // =========================================================================

  const ICONS = {
    compass: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-compass ${cls}"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    flame: (cls, fill) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill || 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame ${cls}"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    hardDriveDownload: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hard-drive-download ${cls}"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 18h.01"/><path d="M10 18h.01"/></svg>`,
    sun: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun ${cls}"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    moon: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon ${cls}"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    search: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search ${cls}"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    calendar: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar ${cls}"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`,
    calendarDays: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days ${cls}"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    calendarRange: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-range ${cls}"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>`,
    chevronLeft: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left ${cls}"><path d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right ${cls}"><path d="m9 18 6-6-6-6"/></svg>`,
    chevronDown: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down ${cls}"><path d="m6 9 6 6 6-6"/></svg>`,
    rotateCcw: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw ${cls}"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    x: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x ${cls}"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    plus: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus ${cls}"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    check: (cls, sw = '2') => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check ${cls}"><path d="M20 6 9 17l-5-5"/></svg>`,
    checkCheck: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-check ${cls}"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>`,
    circle: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle ${cls}"><circle cx="12" cy="12" r="10"/></svg>`,
    trash2: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2 ${cls}"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    clock: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock ${cls}"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    tag: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag ${cls}"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>`,
    pencil: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil ${cls}"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`,
    arrowRight: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right ${cls}"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    timer: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer ${cls}"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="12" y1="14" y2="18"/><path d="M21 13a9 9 0 1 1-3.6-7.2L20 4"/><circle cx="12" cy="14" r="8"/></svg>`,
    listPlus: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-plus ${cls}"><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/></svg>`,
    listChecks: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-checks ${cls}"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>`,
    cornerDownRight: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-right ${cls}"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg>`,
    arrowRightLeft: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right-left ${cls}"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>`,
    play: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play ${cls}"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
    pause: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause ${cls}"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>`,
    globe: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe ${cls}"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    award: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-award ${cls}"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.738.517l-4.254-2.237-4.254 2.237a.5.5 0 0 1-.738-.517l1.515-8.526"/><circle cx="12" cy="8" r="6"/></svg>`,
    checkCircle2: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 ${cls}"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    arrowUpRight: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right ${cls}"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`,
    download: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download ${cls}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    upload: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload ${cls}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
    fileText: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text ${cls}"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
    fileCode: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code ${cls}"><path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/></svg>`,
    alertCircle: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle ${cls}"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
    sparkles: (cls, fill) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill || 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles ${cls}"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
    star: (cls, fill) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${fill || 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star ${cls}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    gripVertical: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical ${cls}"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`
  };

  // Preset constants
  const PRESET_TAGS = ['design', 'dev', 'deepwork', 'ops', 'review', 'health', 'personal'];
  const PRESET_ESTIMATES = ['15m', '30m', '45m', '1h', '2h', '3h'];

  const AVAILABLE_CITIES = [
    { id: 'local', name: 'Local Time', tz: 'local' },
    { id: 'nyc', name: 'New York', tz: 'America/New_York' },
    { id: 'london', name: 'London', tz: 'Europe/London' },
    { id: 'tokyo', name: 'Tokyo', tz: 'Asia/Tokyo' },
    { id: 'sf', name: 'San Francisco', tz: 'America/Los_Angeles' },
    { id: 'paris', name: 'Paris', tz: 'Europe/Paris' },
    { id: 'berlin', name: 'Berlin', tz: 'Europe/Berlin' },
    { id: 'dubai', name: 'Dubai', tz: 'Asia/Dubai' },
    { id: 'delhi', name: 'New Delhi', tz: 'Asia/Kolkata' },
    { id: 'singapore', name: 'Singapore', tz: 'Asia/Singapore' },
    { id: 'sydney', name: 'Sydney', tz: 'Australia/Sydney' },
    { id: 'auckland', name: 'Auckland', tz: 'Pacific/Auckland' },
    { id: 'chicago', name: 'Chicago', tz: 'America/Chicago' },
    { id: 'hongkong', name: 'Hong Kong', tz: 'Asia/Hong_Kong' },
    { id: 'utc', name: 'UTC', tz: 'UTC' },
  ];

  const DEFAULT_SELECTED_CITIES = [
    { id: 'local', name: 'Local Time', tz: 'local' },
    { id: 'nyc', name: 'New York', tz: 'America/New_York' },
    { id: 'london', name: 'London', tz: 'Europe/London' },
    { id: 'tokyo', name: 'Tokyo', tz: 'Asia/Tokyo' },
  ];

  const CITIES_STORAGE_KEY = 'daytrack_selected_cities_v2';

  // =========================================================================
  // 5. APPLICATION STATE
  // =========================================================================

  const state = {
    periodType: 'day', // 'day' | 'week' | 'month'
    currentId: getTodayDateString(),
    data: null,

    // UI States
    isSaving: false,
    lastSaved: null,
    isConsistencyOpen: false,
    isExportOpen: false,
    isCommandOpen: false,

    // Left Nav Card Timeline picker state
    isPickerOpen: false,
    calendarMonth: new Date(),

    // Todo Section states
    newText: '',
    priority: 'medium', // 'low' | 'medium' | 'high'
    selectedTag: '',
    selectedEstimate: '',
    isSpecialTodo: false,
    filter: 'all', // 'all' | 'active' | 'in_progress' | 'completed' | 'high'
    searchQuery: '',
    isSearchOpen: false,
    showTagMenu: false,
    showEstimateMenu: false,
    editingId: null,
    editText: '',
    expandedSubtasks: {},
    subtaskInputs: {},
    activeSubtaskInputId: null,
    editingSubtaskId: null,
    editSubtaskText: '',
    prevCompletedCount: 0,
    draggedTodoId: null,
    dragOverTodoId: null,
    dragOverPosition: null, // 'before' | 'after'

    // Clock Stopwatch states
    stopwatchRunning: false,
    stopwatchElapsedMs: 0,
    stopwatchStartTime: 0,
    stopwatchAccumulatedMs: 0,

    // Clock Cities states
    now: new Date(),
    cities: [],
    isAddCityOpen: false,

    // Theme state
    theme: 'system',
    isDark: false,

    // Export/Import modal state
    importStatus: { type: 'idle', message: '' },
    pasteText: '',
    showPaste: false,

    // Command palette state
    commandQuery: '',
    commandResults: [],
  };

  let saveDebounceTimer = null;
  let stopwatchInterval = null;

  // =========================================================================
  // 6. ROUTING & DATA INITIALIZATION
  // =========================================================================

  function readRouteFromHash() {
    let hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      // Default to today
      return { periodType: 'day', currentId: getTodayDateString() };
    }

    const parts = hash.split('/');
    const type = parts[0];
    const id = parts[1];

    if (type === 'day' && id && isValidDateString(id)) {
      return { periodType: 'day', currentId: id };
    } else if (type === 'week') {
      const weekId = id && isValidWeekString(id) ? id : getCurrentWeekString();
      return { periodType: 'week', currentId: weekId };
    } else if (type === 'month') {
      const monthId = id && isValidMonthString(id) ? id : getCurrentMonthString();
      return { periodType: 'month', currentId: monthId };
    }

    return { periodType: 'day', currentId: getTodayDateString() };
  }

  function navigateTo(periodType, id) {
    window.location.hash = `#${periodType}/${id}`;
  }

  function loadCurrentData() {
    if (state.periodType === 'day') {
      state.data = getDayData(state.currentId);
      state.calendarMonth = parseDate(state.currentId);
    } else if (state.periodType === 'week') {
      state.data = getWeekData(state.currentId);
      state.calendarMonth = getWeekDateRange(state.currentId).start;
    } else {
      state.data = getMonthData(state.currentId);
      const [y, m] = state.currentId.split('-').map(Number);
      state.calendarMonth = new Date(y, m - 1, 1);
    }
    state.lastSaved = new Date(state.data.updatedAt);
    state.prevCompletedCount = state.data.todos.filter((t) => t.completed).length;
  }

  function commitSave() {
    state.isSaving = true;
    renderJournalStatus();

    if (state.periodType === 'day') {
      saveDayData(state.data);
    } else if (state.periodType === 'week') {
      saveWeekData(state.data);
    } else {
      saveMonthData(state.data);
    }

    state.lastSaved = new Date();
    setTimeout(() => {
      state.isSaving = false;
      renderJournalStatus();
    }, 300);
  }

  function debouncedSave() {
    state.isSaving = true;
    renderJournalStatus();
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      commitSave();
    }, 400);
  }

  function reorderTodos(sourceId, targetId, position = 'before') {
    if (sourceId === targetId) return;
    const todos = [...(state.data.todos || [])];
    const sourceIndex = todos.findIndex((t) => t.id === sourceId);
    if (sourceIndex === -1) return;
    const [movedItem] = todos.splice(sourceIndex, 1);

    const targetIndex = todos.findIndex((t) => t.id === targetId);
    if (targetIndex === -1) return;

    const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
    todos.splice(insertIndex, 0, movedItem);
    state.data.todos = todos;
    commitSave();
    renderTodoSection();
    renderLeftNavCard();
  }

  // =========================================================================
  // 7. THEME MANAGEMENT (Exact match of src/context/ThemeContext.tsx)
  // =========================================================================

  function initTheme() {
    const saved = localStorage.getItem('daily_theme');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      state.theme = saved;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function updateTheme() {
      const activeDark =
        state.theme === 'dark' || (state.theme === 'system' && mediaQuery.matches);
      state.isDark = activeDark;
      if (activeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
  }

  function setTheme(newTheme) {
    state.theme = newTheme;
    localStorage.setItem('daily_theme', newTheme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    state.isDark =
      newTheme === 'dark' || (newTheme === 'system' && mediaQuery.matches);
    if (state.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    renderApp();
  }

  function toggleTheme() {
    setTheme(state.isDark ? 'light' : 'dark');
  }

  // =========================================================================
  // 8. CITIES & STOPWATCH (Exact match of src/components/Clock.tsx)
  // =========================================================================

  function initCities() {
    try {
      const saved = localStorage.getItem(CITIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          state.cities = parsed;
          return;
        }
      }
    } catch (e) {}
    state.cities = DEFAULT_SELECTED_CITIES;
  }

  function saveCities(updated) {
    state.cities = updated;
    try {
      localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    renderRightColumn();
  }

  function startStopwatch() {
    if (state.stopwatchRunning) return;
    state.stopwatchStartTime = Date.now();
    state.stopwatchRunning = true;
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    stopwatchInterval = setInterval(() => {
      state.stopwatchElapsedMs =
        Date.now() - state.stopwatchStartTime + state.stopwatchAccumulatedMs;
      updateStopwatchDisplay();
    }, 33);
    renderRightColumn();
  }

  function pauseStopwatch() {
    if (!state.stopwatchRunning) return;
    state.stopwatchAccumulatedMs += Date.now() - state.stopwatchStartTime;
    state.stopwatchElapsedMs = state.stopwatchAccumulatedMs;
    state.stopwatchRunning = false;
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    renderRightColumn();
  }

  function resetStopwatch() {
    state.stopwatchStartTime = 0;
    state.stopwatchAccumulatedMs = 0;
    state.stopwatchElapsedMs = 0;
    state.stopwatchRunning = false;
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    renderRightColumn();
  }

  function formatStopwatch(elapsedMs) {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((elapsedMs % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function updateStopwatchDisplay() {
    const el = document.getElementById('stopwatch-display');
    if (el) {
      el.textContent = formatStopwatch(state.stopwatchElapsedMs);
    }
  }

  // =========================================================================
  // 9. RENDER FUNCTIONS
  // =========================================================================

  function renderSpecialTasksCardHtml() {
    const todos = state.data ? state.data.todos || [] : [];
    const specialTodos = todos.filter((t) => t.isSpecial);
    const totalCount = specialTodos.length;
    const completedCount = specialTodos.filter((t) => t.completed).length;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const activeTodos = specialTodos.filter((t) => !t.completed);
    const doneTodos = specialTodos.filter((t) => t.completed);
    const sortedTodos = [...activeTodos, ...doneTodos];

    let listHtml = '';
    for (const todo of sortedTodos) {
      const isEditing = state.editingId === todo.id;
      const isInProgress = todo.status === 'in_progress';
      const isExpanded = state.expandedSubtasks[todo.id] !== undefined
        ? Boolean(state.expandedSubtasks[todo.id])
        : Boolean(isInProgress || state.activeSubtaskInputId === todo.id);
      const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
      const completedSubtasks = todo.subtasks ? todo.subtasks.filter((s) => s.completed).length : 0;
      const totalSubtasks = todo.subtasks ? todo.subtasks.length : 0;
      const isCompleted = todo.completed;

      let subtasksHtml = '';
      if (hasSubtasks) {
        let itemsHtml = '';
        for (const sub of todo.subtasks) {
          const isSubEditing = state.editingSubtaskId === sub.id;
          itemsHtml += `
            <div class="group/sub flex items-center justify-between gap-1.5 py-0.5">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <button
                  type="button"
                  data-todo-id="${todo.id}"
                  data-sub-id="${sub.id}"
                  class="toggle-subtask-btn shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                    sub.completed
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'border border-zinc-300 dark:border-zinc-600 hover:border-emerald-500'
                  }"
                >
                  ${
                    sub.completed
                      ? ICONS.check('w-2.5 h-2.5 stroke-[2.5]', '2.5')
                      : ICONS.circle('w-2.5 h-2.5 text-transparent')
                  }
                </button>

                ${
                  isSubEditing
                    ? `
                  <input
                    type="text"
                    data-todo-id="${todo.id}"
                    data-sub-id="${sub.id}"
                    value="${escapeHtml(state.editSubtaskText)}"
                    class="edit-subtask-input flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 outline-none border-b border-zinc-400 py-0.5"
                    autoFocus
                  />
                `
                    : `
                  <span
                    data-todo-id="${todo.id}"
                    data-sub-id="${sub.id}"
                    data-text="${escapeHtml(sub.text)}"
                    class="edit-subtask-trigger text-xs cursor-pointer truncate ${
                      sub.completed ? 'text-zinc-400 dark:text-zinc-500 font-medium' : 'text-zinc-700 dark:text-zinc-300'
                    }"
                  >
                    ${escapeHtml(sub.text)}
                  </span>
                `
                }
              </div>

              <div class="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                <button
                  type="button"
                  data-todo-id="${todo.id}"
                  data-sub-id="${sub.id}"
                  class="delete-subtask-btn p-1 rounded text-zinc-400 hover:text-rose-500 transition-colors"
                  title="Delete subtask"
                >
                  ${ICONS.trash2('w-3 h-3')}
                </button>
              </div>
            </div>
          `;
        }
        subtasksHtml = `
          <div class="space-y-1.5 pl-3 border-l-2 border-zinc-200/80 dark:border-zinc-800 ml-1">
            ${itemsHtml}
          </div>
        `;
      }

      const isDragging = state.draggedTodoId === todo.id;
      const isOver = state.dragOverTodoId === todo.id;
      const dragClass = isDragging
        ? 'opacity-40 border-dashed border-zinc-400 dark:border-zinc-600 scale-[0.99]'
        : isOver
        ? state.dragOverPosition === 'before'
          ? 'border-t-2 !border-t-zinc-900 dark:!border-t-zinc-100 bg-zinc-50/70 dark:bg-zinc-800/40'
          : 'border-b-2 !border-b-zinc-900 dark:!border-b-zinc-100 bg-zinc-50/70 dark:bg-zinc-800/40'
        : isCompleted
        ? 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-950/20 hover:border-zinc-300 dark:hover:border-zinc-700 opacity-85 hover:opacity-100'
        : isInProgress
        ? 'border-amber-500/40 dark:border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.03]'
        : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700';

      listHtml += `
        <div
          data-todo-id="${todo.id}"
          draggable="${!isEditing}"
          class="task-card-item group relative rounded-2xl border transition-all shadow-2xs ${dragClass}"
        >
          <!-- Main Task Row -->
          <div class="flex items-center justify-between gap-1.5 px-2 py-1.5 sm:py-2">
            <!-- Drag Handle + Checkbox + Task Text -->
            <div class="flex items-center gap-1.5 flex-1 min-w-0">
              <div
                class="task-drag-handle opacity-0 group-hover:opacity-70 hover:!opacity-100 cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-500 p-0 -ml-0.5 transition-opacity shrink-0 select-none"
                title="Drag with mouse to reorder"
              >
                ${ICONS.gripVertical('w-3.5 h-3.5')}
              </div>
              <button
                type="button"
                data-id="${todo.id}"
                title="${isCompleted ? 'Unmark task' : isInProgress ? 'Mark complete' : 'Complete task'}"
                class="toggle-todo-btn shrink-0 w-4.5 h-4.5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : isInProgress
                    ? 'border-amber-500 text-amber-500 hover:border-emerald-500 hover:text-emerald-500'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                }"
              >
                ${
                  isCompleted
                    ? ICONS.check('w-3 h-3 stroke-[2.5]', '2.5')
                    : isInProgress
                    ? '<div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>'
                    : ICONS.circle('w-3 h-3 text-transparent')
                }
              </button>

              ${
                isEditing
                  ? `
                <input
                  type="text"
                  data-id="${todo.id}"
                  value="${escapeHtml(state.editText)}"
                  class="edit-todo-input flex-1 bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none border-b border-zinc-400 py-0.5"
                />
              `
                  : `
                <div
                  data-id="${todo.id}"
                  class="start-edit-todo flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                >
                  <span
                    class="truncate text-xs sm:text-sm font-normal ${
                      isCompleted
                        ? 'text-zinc-400 dark:text-zinc-500'
                        : isInProgress
                        ? 'text-zinc-900 dark:text-zinc-50 font-normal'
                        : 'text-zinc-800 dark:text-zinc-200 font-normal'
                    }"
                  >
                    ${escapeHtml(todo.text)}
                  </span>
                  ${
                    isInProgress
                      ? `
                    <span class="inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                      In Progress
                    </span>
                  `
                      : ''
                  }
                  ${
                    isCompleted
                      ? `
                    <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded shrink-0 select-none">
                      Done
                    </span>
                  `
                      : ''
                  }
                </div>
              `
              }
            </div>

            <!-- Right Badges & Actions -->
            <div class="flex items-center gap-1 shrink-0">
              ${
                hasSubtasks
                  ? `
                <button
                  type="button"
                  data-id="${todo.id}"
                  class="toggle-expand-subtasks flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title="Toggle subtasks checklist"
                >
                  ${ICONS.listChecks('w-3 h-3')}
                  <span>${completedSubtasks}/${totalSubtasks}</span>
                  ${isExpanded ? ICONS.chevronDown('w-2.5 h-2.5 text-zinc-400') : ICONS.chevronRight('w-2.5 h-2.5 text-zinc-400')}
                </button>
              `
                  : ''
              }

              ${todo.priority === 'high' ? ICONS.flame('w-3.5 h-3.5 text-rose-500 shrink-0') : ''}

              <!-- Actions on hover - hidden by default to keep text 100% visible -->
              <div class="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  data-id="${todo.id}"
                  class="toggle-inprogress-btn p-1 rounded transition-colors ${
                    isInProgress
                      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                      : 'text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }"
                  title="${isInProgress ? 'Remove In Progress' : 'Mark as In Progress'}"
                >
                  ${ICONS.timer('w-3.5 h-3.5')}
                </button>

                <button
                  type="button"
                  data-id="${todo.id}"
                  class="open-subtask-input-btn p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Add subtask"
                >
                  ${ICONS.listPlus('w-3.5 h-3.5')}
                </button>

                <button
                  type="button"
                  data-id="${todo.id}"
                  class="toggle-special-status-btn p-1 rounded text-amber-500 hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Move back to main to-dos"
                >
                  ${ICONS.star('w-3.5 h-3.5 fill-amber-500', '#f59e0b')}
                </button>

                <button
                  type="button"
                  data-id="${todo.id}"
                  class="start-edit-btn p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Edit"
                >
                  ${ICONS.pencil('w-3.5 h-3.5')}
                </button>

                <button
                  type="button"
                  data-id="${todo.id}"
                  class="delete-todo-btn p-1 rounded text-zinc-400 hover:text-rose-500 transition-colors"
                  title="Delete"
                >
                  ${ICONS.trash2('w-3.5 h-3.5')}
                </button>
              </div>
            </div>
          </div>

          <!-- Nested Subtasks Drawer -->
          ${
            isExpanded || state.activeSubtaskInputId === todo.id
              ? `
            <div class="border-t border-zinc-100 dark:border-zinc-800/80 px-2.5 py-2 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-b-2xl space-y-2">
              ${hasSubtasks ? subtasksHtml : ''}

              <!-- Quick Add Subtask Input -->
              <div class="flex items-center gap-1.5 pl-3 ml-1 pt-0.5">
                ${ICONS.cornerDownRight('w-3 h-3 text-zinc-400 shrink-0')}
                <input
                  type="text"
                  data-id="${todo.id}"
                  value="${escapeHtml(state.subtaskInputs[todo.id] || '')}"
                  placeholder="Add a subtask (press Enter)..."
                  class="subtask-add-input flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none py-1 border-b border-zinc-200/60 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors min-w-0"
                />
                <button
                  type="button"
                  data-id="${todo.id}"
                  class="submit-subtask-btn px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-20 transition-all text-xs font-medium shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
    }

    return `
      <div class="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-3 sm:p-3.5 shadow-sm space-y-3">
        <!-- Header: Simple & Minimal, same as To-Dos -->
        <div class="space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <h2 class="text-xl sm:text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
                Special Tasks
              </h2>
              <span class="text-xs sm:text-sm font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
                ${completedCount}/${totalCount}
              </span>
            </div>
            ${
              completedCount > 0
                ? `<button
                    id="clear-completed-special-btn"
                    class="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Clear completed special tasks"
                  >
                    ${ICONS.checkCheck('w-4 h-4')}
                  </button>`
                : ''
            }
          </div>

          <!-- Minimalist 1.5px Progress Hairline -->
          ${
            totalCount > 0
              ? `
            <div class="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                style="width: ${completionPercent}%"
              ></div>
            </div>
          `
              : ''
          }
        </div>

        <!-- Task List -->
        <div class="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
          ${listHtml}
          ${
            sortedTodos.length === 0
              ? `
            <div class="flex-1 flex items-center justify-center py-10 text-center text-zinc-400 dark:text-zinc-600 text-sm font-medium">
              No special tasks
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  function renderLeftNavCard() {
    const stats = calculateStorageStats();

    // Cross-period targets
    let targetDay = getTodayDateString();
    let targetWeek = getCurrentWeekString();
    let targetMonth = getCurrentMonthString();

    if (state.periodType === 'day') {
      targetDay = state.currentId;
      targetWeek = getWeekForDate(state.currentId);
      targetMonth = getMonthForDate(state.currentId);
    } else if (state.periodType === 'week') {
      const range = getWeekDateRange(state.currentId);
      const today = getTodayDateString();
      targetDay = today >= range.startStr && today <= range.endStr ? today : range.startStr;
      targetWeek = state.currentId;
      targetMonth = getMonthForDate(range.startStr);
    } else if (state.periodType === 'month') {
      const today = getTodayDateString();
      targetDay = today.startsWith(state.currentId) ? today : `${state.currentId}-01`;
      targetWeek = getWeekForDate(targetDay);
      targetMonth = state.currentId;
    }

    // Period navigator calculations
    let fullTitle = '';
    let shortTitle = '';
    let relativeLabel = null;
    let isCurrent = false;
    let jumpButtonLabel = 'Today';

    if (state.periodType === 'day') {
      fullTitle = formatFullDate(state.currentId);
      shortTitle = formatMediumDate(state.currentId);
      relativeLabel = getRelativeDateLabel(state.currentId);
      isCurrent = state.currentId === getTodayDateString();
      jumpButtonLabel = 'Today';
    } else if (state.periodType === 'week') {
      const range = getWeekDateRange(state.currentId);
      const weekNum = state.currentId.split('-W')[1];
      fullTitle = `Week ${parseInt(weekNum, 10)} • ${range.label}`;
      shortTitle = `W${parseInt(weekNum, 10)} (${range.start.getDate()}-${range.end.getDate()} ${range.start.toLocaleDateString('en-US', { month: 'short' })})`;
      relativeLabel = getRelativeWeekLabel(state.currentId);
      isCurrent = state.currentId === getCurrentWeekString();
      jumpButtonLabel = 'This Week';
    } else {
      fullTitle = formatMonthYear(state.currentId);
      shortTitle = formatMonthYear(state.currentId);
      relativeLabel = getRelativeMonthLabel(state.currentId);
      isCurrent = state.currentId === getCurrentMonthString();
      jumpButtonLabel = 'This Month';
    }

    // Calendar matrix
    const year = state.calendarMonth.getFullYear();
    const month = state.calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let loggedEntries = new Set();
    if (state.periodType === 'day') loggedEntries = new Set(getAllSavedDates());
    else if (state.periodType === 'week') loggedEntries = new Set(getAllSavedWeeks());
    else loggedEntries = new Set(getAllSavedMonths());

    let calendarDaysHtml = '';
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDaysHtml += `<div class="h-7"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const ds = toDateString(new Date(year, month, d));
      const targetWeekId = getWeekId(ds);
      const targetMonthId = ds.slice(0, 7);

      let isSelected = false;
      let hasEntries = false;

      if (state.periodType === 'day') {
        isSelected = ds === state.currentId;
        hasEntries = loggedEntries.has(ds);
      } else if (state.periodType === 'week') {
        isSelected = targetWeekId === state.currentId;
        hasEntries = loggedEntries.has(targetWeekId);
      } else {
        isSelected = targetMonthId === state.currentId;
        hasEntries = loggedEntries.has(targetMonthId);
      }

      const isTodayDate = ds === getTodayDateString();

      const btnClasses = isSelected
        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
        : isTodayDate
        ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800';

      calendarDaysHtml += `
        <button
          type="button"
          data-date="${ds}"
          data-week="${targetWeekId}"
          data-month="${targetMonthId}"
          class="cal-day-btn relative flex items-center justify-center h-7 text-xs rounded-lg transition-all ${btnClasses}"
        >
          <span>${d}</span>
          ${hasEntries && !isSelected ? `<span class="absolute bottom-1 w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500"></span>` : ''}
        </button>
      `;
    }

    const html = `
      <div class="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm space-y-4">
        <!-- 1. Brand & Header Actions -->
        <div class="flex items-center justify-between gap-2 pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <div class="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 cursor-pointer" id="brand-link" title="DayTrack">
            <div class="w-7 h-7 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-2xs">
              ${ICONS.compass('w-4 h-4 stroke-[2.2]')}
            </div>
            <span class="font-medium text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
              DayTrack
            </span>
          </div>

          <div class="flex items-center gap-1 sm:gap-1.5">
            <!-- Streak Pill -->
            <button
              id="open-consistency-btn"
              title="Streak & Consistency Momentum"
              class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
            >
              ${ICONS.flame('w-3.5 h-3.5 text-amber-500 fill-amber-500', '#f59e0b')}
              <span>${stats.currentStreak}d</span>
            </button>

            <!-- Backup & Export -->
            <button
              id="open-export-btn"
              title="Backup & Export"
              class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              ${ICONS.hardDriveDownload('w-4 h-4')}
            </button>

            <!-- Theme Toggle -->
            <button
              id="toggle-theme-btn"
              title="${state.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}"
              class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              ${state.isDark ? ICONS.sun('w-4 h-4') : ICONS.moon('w-4 h-4')}
            </button>
          </div>
        </div>

        <!-- 2. Search Card -->
        <button
          id="open-command-card"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 transition-all shadow-2xs group"
          title="Search all tasks, notes, and commands (⌘K)"
        >
          <div class="flex items-center gap-2.5">
            ${ICONS.search('w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors')}
            <span class="font-medium text-zinc-600 dark:text-zinc-300">Search</span>
          </div>
          <kbd class="px-1.5 py-0.5 text-[10px] rounded-md bg-white dark:bg-zinc-900 text-zinc-400 font-mono border border-zinc-200/80 dark:border-zinc-700">
            ⌘K
          </kbd>
        </button>

        <!-- 3. View Switcher -->
        <div class="space-y-1">
          <div class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 px-1 mb-1.5">
            View Mode
          </div>
          <div class="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-medium">
            <button
              id="switch-view-day"
              data-target="${targetDay}"
              class="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                state.periodType === 'day'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }"
            >
              ${ICONS.calendar('w-3.5 h-3.5')}
              <span>Day</span>
            </button>

            <button
              id="switch-view-week"
              data-target="${targetWeek}"
              class="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                state.periodType === 'week'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }"
            >
              ${ICONS.calendarDays('w-3.5 h-3.5')}
              <span>Week</span>
            </button>

            <button
              id="switch-view-month"
              data-target="${targetMonth}"
              class="flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                state.periodType === 'month'
                  ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }"
            >
              ${ICONS.calendarRange('w-3.5 h-3.5')}
              <span>Month</span>
            </button>
          </div>
        </div>

        <!-- 4. Period Navigator -->
        <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
          <div class="text-[11px] font-medium uppercase tracking-wider text-zinc-400 px-1">
            Timeline
          </div>

          <div class="relative flex items-center justify-between gap-2 w-full">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="hidden sm:inline font-normal sm:font-medium text-sm sm:text-base tracking-tight text-zinc-900 dark:text-zinc-50 select-none truncate">
                ${fullTitle}
              </span>
              <span class="sm:hidden font-normal sm:font-medium text-xs sm:text-sm tracking-tight text-zinc-900 dark:text-zinc-50 select-none truncate">
                ${shortTitle}
              </span>

              ${
                relativeLabel
                  ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60'
                    }">${relativeLabel}</span>`
                  : ''
              }
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <div class="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200/70 dark:border-zinc-700/70">
                <button
                  id="nav-prev-btn"
                  title="Previous (Hotkey: [ )"
                  class="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-2xs"
                >
                  ${ICONS.chevronLeft('w-3.5 h-3.5')}
                </button>

                ${
                  !isCurrent
                    ? `<button
                        id="nav-jump-btn"
                        title="Jump to ${jumpButtonLabel} (Hotkey: T)"
                        class="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 rounded transition-all shadow-2xs"
                      >
                        ${ICONS.rotateCcw('w-3 h-3 text-zinc-500')}
                        <span class="hidden md:inline">${jumpButtonLabel}</span>
                      </button>`
                    : ''
                }

                <button
                  id="nav-next-btn"
                  title="Next (Hotkey: ] )"
                  class="p-1 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-2xs"
                >
                  ${ICONS.chevronRight('w-3.5 h-3.5')}
                </button>
              </div>

              <!-- Mini Calendar Popover Button -->
              <div class="relative" id="calendar-popover-container">
                <button
                  id="toggle-calendar-picker-btn"
                  title="Pick a date"
                  class="p-1.5 rounded-lg border transition-colors ${
                    state.isPickerOpen
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                      : 'border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }"
                >
                  ${ICONS.calendar('w-3.5 h-3.5')}
                </button>

                ${
                  state.isPickerOpen
                    ? `
                  <div
                    id="calendar-popover"
                    class="absolute right-0 top-full mt-2 z-50 w-72 max-w-[calc(100vw-2.5rem)] rounded-2xl bg-white dark:bg-zinc-900 p-3.5 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div class="flex items-center justify-between mb-2.5">
                      <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        ${state.calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <div class="flex items-center gap-1">
                        <button id="cal-prev-month" class="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          ${ICONS.chevronLeft('w-3.5 h-3.5')}
                        </button>
                        <button id="cal-next-month" class="p-1 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          ${ICONS.chevronRight('w-3.5 h-3.5')}
                        </button>
                        <button id="cal-close-btn" class="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-1">
                          ${ICONS.x('w-3.5 h-3.5')}
                        </button>
                      </div>
                    </div>

                    <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-400 mb-1">
                      <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>

                    <div class="grid grid-cols-7 gap-1">
                      ${calendarDaysHtml}
                    </div>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('left-column').innerHTML = html + renderSpecialTasksCardHtml();
  }

  function renderTodoSection() {
    const todos = state.data.todos || [];
    let sectionTitle = 'To-Dos';
    let placeholder = 'Add a new task...';
    let rolloverTitle = 'Rollover unfinished tasks';

    if (state.periodType === 'week') {
      sectionTitle = 'Weekly Goals';
      placeholder = 'Add a weekly goal or key milestone...';
      rolloverTitle = 'Rollover unfinished goals from previous week';
    } else if (state.periodType === 'month') {
      sectionTitle = 'Monthly Goals';
      placeholder = 'Add a monthly goal or focus target...';
      rolloverTitle = 'Rollover unfinished goals from previous month';
    }

    // Filter out special tasks from main to-dos
    const regularTodos = todos.filter((t) => !t.isSpecial);
    const totalCount = regularTodos.length;
    const completedCount = regularTodos.filter((t) => t.completed).length;
    const inProgressCount = regularTodos.filter((t) => !t.completed && t.status === 'in_progress').length;
    const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Check for 100% celebration confetti
    if (totalCount > 0 && completedCount === totalCount && state.prevCompletedCount < totalCount) {
      if (typeof window.confetti === 'function') {
        try {
          window.confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
          });
        } catch (e) {}
      }
    }
    state.prevCompletedCount = completedCount;

    // Has previous unfinished tasks check
    let hasPreviousTasks = false;
    if (state.periodType === 'day') {
      const prev = getPreviousActiveDayData(state.currentId);
      if (prev) {
        const curTexts = new Set(regularTodos.map((t) => t.text.toLowerCase()));
        hasPreviousTasks = prev.todos.some((t) => !t.completed && !curTexts.has(t.text.toLowerCase()));
      }
    } else if (state.periodType === 'week') {
      const prev = getPreviousActiveWeekData(state.currentId);
      if (prev) {
        const curTexts = new Set(regularTodos.map((t) => t.text.toLowerCase()));
        hasPreviousTasks = prev.todos.some((t) => !t.completed && !curTexts.has(t.text.toLowerCase()));
      }
    } else {
      const prev = getPreviousActiveMonthData(state.currentId);
      if (prev) {
        const curTexts = new Set(regularTodos.map((t) => t.text.toLowerCase()));
        hasPreviousTasks = prev.todos.some((t) => !t.completed && !curTexts.has(t.text.toLowerCase()));
      }
    }

    // Filter & Search
    const filteredTodos = regularTodos.filter((t) => {
      if (state.filter === 'active' && t.completed) return false;
      if (state.filter === 'in_progress' && (t.completed || t.status !== 'in_progress')) return false;
      if (state.filter === 'completed' && !t.completed) return false;
      if (state.filter === 'high' && t.priority !== 'high') return false;

      if (state.searchQuery.trim()) {
        const q = state.searchQuery.toLowerCase();
        const matchesText = t.text.toLowerCase().includes(q);
        const matchesTag = t.tag ? t.tag.toLowerCase().includes(q) : false;
        const matchesSubtask = t.subtasks?.some((s) => s.text.toLowerCase().includes(q));
        if (!matchesText && !matchesTag && !matchesSubtask) return false;
      }
      return true;
    });

    const activeTodos = filteredTodos.filter((t) => !t.completed);
    const doneTodos = filteredTodos.filter((t) => t.completed);
    const sortedTodos = [...activeTodos, ...doneTodos];

    let todosListHtml = '';
    for (const todo of sortedTodos) {
      const isEditing = state.editingId === todo.id;
      const isInProgress = todo.status === 'in_progress';
      const isExpanded = state.expandedSubtasks[todo.id] !== undefined
        ? Boolean(state.expandedSubtasks[todo.id])
        : Boolean(isInProgress || state.activeSubtaskInputId === todo.id);
      const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
      const completedSubtasks = todo.subtasks ? todo.subtasks.filter((s) => s.completed).length : 0;
      const totalSubtasks = todo.subtasks ? todo.subtasks.length : 0;
      const isCompleted = todo.completed;

      let subtasksHtml = '';
      if (hasSubtasks) {
        let itemsHtml = '';
        for (const sub of todo.subtasks) {
          const isSubEditing = state.editingSubtaskId === sub.id;
          itemsHtml += `
            <div class="group/sub flex items-center justify-between gap-2.5 py-0.5">
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <button
                  type="button"
                  data-todo-id="${todo.id}"
                  data-sub-id="${sub.id}"
                  class="toggle-subtask-btn shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                    sub.completed
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'border border-zinc-300 dark:border-zinc-600 hover:border-emerald-500'
                  }"
                >
                  ${
                    sub.completed
                      ? ICONS.check('w-2.5 h-2.5 stroke-[2.5]', '2.5')
                      : ICONS.circle('w-2.5 h-2.5 text-transparent')
                  }
                </button>

                ${
                  isSubEditing
                    ? `<input
                        type="text"
                        value="${escapeHtml(state.editSubtaskText)}"
                        data-todo-id="${todo.id}"
                        data-sub-id="${sub.id}"
                        class="edit-subtask-input text-sm bg-transparent border-b border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-zinc-100 outline-none flex-1 py-0.5"
                        autoFocus
                      />`
                    : `<span
                        data-todo-id="${todo.id}"
                        data-sub-id="${sub.id}"
                        data-text="${escapeHtml(sub.text)}"
                        class="edit-subtask-trigger text-sm select-none truncate cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 ${
                          sub.completed
                            ? 'text-zinc-500 dark:text-zinc-400 font-medium'
                            : 'text-zinc-800 dark:text-zinc-200'
                        }"
                        title="Click to edit subtask"
                      >${escapeHtml(sub.text)}</span>`
                }
              </div>

              <button
                type="button"
                data-todo-id="${todo.id}"
                data-sub-id="${sub.id}"
                class="delete-subtask-btn opacity-0 group-hover/sub:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition-opacity"
                title="Delete subtask"
              >
                ${ICONS.trash2('w-3.5 h-3.5')}
              </button>
            </div>
          `;
        }

        subtasksHtml = `
          <div class="space-y-1.5 pl-5 border-l-2 border-zinc-200/80 dark:border-zinc-800 ml-2">
            ${itemsHtml}
          </div>
        `;
      }

      const isDragging = state.draggedTodoId === todo.id;
      const isOver = state.dragOverTodoId === todo.id;
      const dragClass = isDragging
        ? 'opacity-40 border-dashed border-zinc-400 dark:border-zinc-600 scale-[0.99]'
        : isOver
        ? state.dragOverPosition === 'before'
          ? 'border-t-2 !border-t-zinc-900 dark:!border-t-zinc-100 bg-zinc-50/70 dark:bg-zinc-800/40'
          : 'border-b-2 !border-b-zinc-900 dark:!border-b-zinc-100 bg-zinc-50/70 dark:bg-zinc-800/40'
        : isCompleted
        ? 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-950/20 hover:border-zinc-300 dark:hover:border-zinc-700 opacity-85 hover:opacity-100'
        : isInProgress
        ? 'border-amber-500/40 dark:border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.03]'
        : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700';

      todosListHtml += `
        <div
          data-todo-id="${todo.id}"
          draggable="${!isEditing}"
          class="task-card-item group relative rounded-2xl border transition-all shadow-2xs ${dragClass}"
        >
          <div class="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                class="task-drag-handle opacity-30 sm:opacity-0 group-hover:opacity-80 hover:!opacity-100 cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-500 p-0.5 -ml-1 transition-opacity shrink-0 select-none"
                title="Drag with mouse to reorder"
              >
                ${ICONS.gripVertical('w-4 h-4')}
              </div>
              <!-- Checkbox -->
              <button
                data-id="${todo.id}"
                class="toggle-todo-btn shrink-0 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : isInProgress
                    ? 'border-amber-500 text-amber-500 hover:border-emerald-500 hover:text-emerald-500'
                    : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                }"
                title="${isCompleted ? 'Unmark task' : isInProgress ? 'Mark complete' : 'Complete task'}"
              >
                ${
                  isCompleted
                    ? ICONS.check('w-3.5 h-3.5 stroke-[2.5]', '2.5')
                    : isInProgress
                    ? `<div class="w-2 h-2 rounded-full bg-amber-500"></div>`
                    : ICONS.circle('w-3.5 h-3.5 text-transparent')
                }
              </button>

              ${
                isEditing
                  ? `<input
                      type="text"
                      data-id="${todo.id}"
                      value="${escapeHtml(state.editText)}"
                      class="edit-todo-input flex-1 bg-transparent text-base text-zinc-900 dark:text-zinc-100 outline-none border-b border-zinc-400 py-0.5"
                    />`
                  : `<div class="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        data-id="${todo.id}"
                        class="start-edit-todo text-base font-medium cursor-pointer truncate ${
                          isCompleted
                            ? 'text-zinc-400 dark:text-zinc-500'
                            : 'text-zinc-850 dark:text-zinc-150'
                        }"
                      >${escapeHtml(todo.text)}</span>

                      ${
                        isInProgress
                          ? `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0 select-none">
                              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              In Progress
                            </span>`
                          : ''
                      }

                      ${
                        isCompleted
                          ? `<span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0 select-none">
                              Done
                            </span>`
                          : ''
                      }
                    </div>`
              }
            </div>

            <!-- Badges & Action Buttons -->
            <div class="flex items-center gap-2.5 shrink-0">
              ${
                hasSubtasks
                  ? `<button
                      type="button"
                      data-id="${todo.id}"
                      class="toggle-expand-subtasks flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      title="Toggle subtasks checklist"
                    >
                      ${ICONS.listChecks('w-3.5 h-3.5')}
                      <span>${completedSubtasks}/${totalSubtasks}</span>
                      ${isExpanded ? ICONS.chevronDown('w-3 h-3 text-zinc-400') : ICONS.chevronRight('w-3 h-3 text-zinc-400')}
                    </button>`
                  : ''
              }

              ${todo.priority === 'high' ? ICONS.flame('w-4 h-4 text-rose-500') : ''}

              ${
                todo.tag
                  ? `<span class="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                      #${escapeHtml(todo.tag)}
                    </span>`
                  : ''
              }

              ${
                todo.estimate
                  ? `<span class="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                      ${escapeHtml(todo.estimate)}
                    </span>`
                  : ''
              }

              <!-- Hover Icons -->
              <div class="opacity-60 sm:opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  data-id="${todo.id}"
                  class="toggle-inprogress-btn p-1.5 rounded-lg transition-colors ${
                    isInProgress
                      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                      : 'text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                  }"
                  title="${isInProgress ? 'Remove In Progress' : 'Mark as In Progress'}"
                >
                  ${ICONS.timer('w-4 h-4')}
                </button>

                <button
                  data-id="${todo.id}"
                  class="open-subtask-input-btn p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Add subtask"
                >
                  ${ICONS.listPlus('w-4 h-4')}
                </button>

                <button
                  data-id="${todo.id}"
                  class="start-edit-btn p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  title="Edit"
                >
                  ${ICONS.pencil('w-4 h-4')}
                </button>

                <button
                  data-id="${todo.id}"
                  class="delete-todo-btn p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                  title="Delete"
                >
                  ${ICONS.trash2('w-4 h-4')}
                </button>
              </div>
            </div>
          </div>

          <!-- Nested Subtasks Drawer -->
          ${
            isExpanded || state.activeSubtaskInputId === todo.id
              ? `
            <div class="border-t border-zinc-100 dark:border-zinc-800/80 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-b-2xl space-y-2.5">
              ${subtasksHtml}
              <div class="flex items-center gap-2 pl-5 ml-2 pt-0.5">
                ${ICONS.cornerDownRight('w-3.5 h-3.5 text-zinc-400 shrink-0')}
                <input
                  type="text"
                  data-id="${todo.id}"
                  value="${escapeHtml(state.subtaskInputs[todo.id] || '')}"
                  placeholder="Add a subtask (press Enter)..."
                  class="subtask-add-input flex-1 bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none py-1 border-b border-zinc-200/60 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                />
                <button
                  type="button"
                  data-id="${todo.id}"
                  class="submit-subtask-btn px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 transition-all text-xs font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
    }

    const html = `
      <div class="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm flex flex-col min-h-[calc(100vh-3rem)] space-y-4">
        <!-- Header -->
        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex items-center gap-2.5">
              <h2 class="text-xl sm:text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
                ${sectionTitle}
              </h2>
              <span class="text-xs sm:text-sm font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-full">
                ${completedCount}/${totalCount}
              </span>
            </div>

            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
              <!-- Search Toggle -->
              ${
                state.isSearchOpen
                  ? `
                <div class="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl px-2.5 py-1.5 border border-zinc-200/80 dark:border-zinc-700/80">
                  ${ICONS.search('w-4 h-4 text-zinc-400 shrink-0')}
                  <input
                    type="text"
                    id="tasks-search-input"
                    value="${escapeHtml(state.searchQuery)}"
                    placeholder="Search tasks..."
                    autoFocus
                    class="w-32 sm:w-48 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                  />
                  <button id="close-search-btn" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                    ${ICONS.x('w-3.5 h-3.5')}
                  </button>
                </div>
              `
                  : `
                <button
                  id="open-search-btn"
                  class="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Search"
                >
                  ${ICONS.search('w-4.5 h-4.5')}
                </button>
              `
              }

              <!-- Filter Tabs -->
              <div class="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 sm:p-1 rounded-xl text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <button
                  data-filter="all"
                  class="filter-tab px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                    state.filter === 'all'
                      ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                      : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                  }"
                  title="All"
                >
                  All
                </button>
                <button
                  data-filter="active"
                  class="filter-tab px-2 sm:px-3 py-1 rounded-lg transition-all ${
                    state.filter === 'active'
                      ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                      : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                  }"
                  title="Active"
                >
                  Active
                </button>
                <button
                  data-filter="in_progress"
                  class="filter-tab px-2 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    state.filter === 'in_progress'
                      ? 'bg-white text-amber-600 dark:bg-zinc-900 dark:text-amber-400 shadow-2xs font-medium'
                      : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                  }"
                  title="In Progress tasks"
                >
                  <span class="hidden xs:inline">In Progress</span>
                  <span class="xs:hidden">Progress</span>
                  ${inProgressCount > 0 ? `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>` : ''}
                </button>
                <button
                  data-filter="completed"
                  class="filter-tab px-2 sm:px-3 py-1 rounded-lg transition-all ${
                    state.filter === 'completed'
                      ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                      : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                  }"
                  title="Done"
                >
                  Done
                </button>
                <button
                  data-filter="high"
                  class="filter-tab p-1.5 rounded-lg transition-all ${
                    state.filter === 'high' ? 'bg-rose-500 text-white' : 'hover:text-rose-500'
                  }"
                  title="High priority"
                >
                  ${ICONS.flame('w-3.5 h-3.5 sm:w-4 sm:h-4')}
                </button>
              </div>

              <!-- Rollover Button -->
              ${
                hasPreviousTasks
                  ? `<button
                      id="rollover-btn"
                      class="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                      title="${rolloverTitle}"
                    >
                      ${ICONS.arrowRightLeft('w-4.5 h-4.5')}
                    </button>`
                  : ''
              }

              <!-- Clear Completed Button -->
              ${
                completedCount > 0
                  ? `<button
                      id="clear-completed-btn"
                      class="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Clear completed tasks"
                    >
                      ${ICONS.checkCheck('w-4.5 h-4.5')}
                    </button>`
                  : ''
              }
            </div>
          </div>

          <!-- Progress Hairline -->
          ${
            totalCount > 0
              ? `
            <div class="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
                style="width: ${completionPercent}%"
              ></div>
            </div>
          `
              : ''
          }
        </div>

        <!-- Add Task Input Bar -->
        <form id="add-todo-form" class="relative">
          <div class="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all shadow-2xs">
            ${ICONS.plus('w-5 h-5 text-zinc-400 shrink-0')}
            <input
              type="text"
              id="new-todo-input"
              value="${escapeHtml(state.newText)}"
              placeholder="${placeholder}"
              class="flex-1 bg-transparent text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />

            <div class="flex items-center gap-1.5 shrink-0">
              <!-- Priority cycle -->
              <button
                type="button"
                id="cycle-priority-btn"
                title="Priority: ${state.priority}"
                class="p-2 rounded-xl text-sm transition-colors ${
                  state.priority === 'high'
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/50'
                    : state.priority === 'low'
                    ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    : 'text-zinc-400 hover:text-blue-500'
                }"
              >
                ${ICONS.flame('w-4 h-4')}
              </button>

              <!-- Tag picker -->
              <div class="relative" id="tag-menu-container">
                <button
                  type="button"
                  id="toggle-tag-menu-btn"
                  title="${state.selectedTag ? '#' + state.selectedTag : 'Add tag'}"
                  class="p-2 rounded-xl text-sm transition-colors ${
                    state.selectedTag
                      ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }"
                >
                  ${ICONS.tag('w-4 h-4')}
                </button>

                ${
                  state.showTagMenu
                    ? `
                  <div
                    id="tag-menu"
                    class="absolute right-0 top-full mt-2 z-30 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-wrap gap-1.5 w-48 animate-in fade-in duration-100"
                  >
                    ${PRESET_TAGS.map(
                      (t) => `
                      <button
                        type="button"
                        data-tag="${t}"
                        class="tag-option-btn px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                          state.selectedTag === t
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }"
                      >
                        #${t}
                      </button>
                    `
                    ).join('')}
                  </div>
                `
                    : ''
                }
              </div>

              <!-- Estimate picker -->
              <div class="relative" id="estimate-menu-container">
                <button
                  type="button"
                  id="toggle-estimate-menu-btn"
                  title="${state.selectedEstimate || 'Estimate time'}"
                  class="p-2 rounded-xl text-sm transition-colors ${
                    state.selectedEstimate
                      ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }"
                >
                  ${ICONS.clock('w-4 h-4')}
                </button>

                ${
                  state.showEstimateMenu
                    ? `
                  <div
                    id="estimate-menu"
                    class="absolute right-0 top-full mt-2 z-30 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-wrap gap-1.5 w-40 animate-in fade-in duration-100"
                  >
                    ${PRESET_ESTIMATES.map(
                      (est) => `
                      <button
                        type="button"
                        data-estimate="${est}"
                        class="estimate-option-btn px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                          state.selectedEstimate === est
                            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }"
                      >
                        ${est}
                      </button>
                    `
                    ).join('')}
                  </div>
                `
                    : ''
                }
              </div>

              <!-- Special task toggle button -->
              <button
                type="button"
                id="toggle-special-todo-btn"
                title="${state.isSpecialTodo ? 'Special task enabled (adds to left bottom)' : 'Mark as special task (left bottom)'}"
                class="p-2 rounded-xl text-sm transition-colors ${
                  state.isSpecialTodo
                    ? 'text-amber-500 fill-amber-500 bg-amber-50 dark:bg-amber-950/50'
                    : 'text-zinc-400 hover:text-amber-500'
                }"
              >
                ${ICONS.star('w-4 h-4', state.isSpecialTodo ? 'currentColor' : 'none')}
              </button>

              <!-- Submit button -->
              <button
                type="submit"
                id="submit-todo-btn"
                ${!state.newText.trim() ? 'disabled' : ''}
                class="p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-20 hover:opacity-90 transition-all ml-1"
                title="Add task (Enter)"
              >
                ${ICONS.arrowRight('w-4 h-4')}
              </button>
            </div>
          </div>
        </form>

        <!-- Tasks List Section -->
        <div class="space-y-4 flex-1 flex flex-col">
          <div class="space-y-2.5" id="todos-list-container">
            ${todosListHtml}
          </div>

          ${
            sortedTodos.length === 0
              ? `
            <div class="flex-1 flex items-center justify-center py-20 text-center text-zinc-400 dark:text-zinc-600 text-sm font-medium">
              No tasks
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;

    document.getElementById('middle-column').innerHTML = html;
  }

  function renderRightColumn() {
    const formattedStopwatch = formatStopwatch(state.stopwatchElapsedMs);
    const availableCities = AVAILABLE_CITIES.filter((c) => !state.cities.some((item) => item.id === c.id));

    let journalTitle = 'Journal';
    let journalPlaceholder = 'Write thoughts, notes, reflections...';
    if (state.periodType === 'week') {
      journalTitle = 'Weekly Journal';
      journalPlaceholder = 'Write weekly review, priorities, reflections...';
    } else if (state.periodType === 'month') {
      journalTitle = 'Monthly Journal';
      journalPlaceholder = 'Write monthly reflection, review, notes...';
    }

    const journalValue = state.data.journal || '';

    let citiesHtml = '';
    for (const city of state.cities) {
      let timeStr = '';
      let dateStr = '';
      try {
        if (city.tz === 'local') {
          timeStr = state.now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          dateStr = state.now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else {
          timeStr = state.now.toLocaleTimeString('en-US', { timeZone: city.tz, hour: 'numeric', minute: '2-digit', hour12: true });
          dateStr = state.now.toLocaleDateString('en-US', { timeZone: city.tz, weekday: 'short', month: 'short', day: 'numeric' });
        }
      } catch (e) {
        timeStr = '--:--';
        dateStr = '';
      }

      citiesHtml += `
        <div
          class="group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/60 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors text-xs"
        >
          <div class="min-w-0">
            <div class="font-normal text-zinc-800 dark:text-zinc-200 truncate">
              ${escapeHtml(city.name)}
            </div>
            <div class="text-[10px] text-zinc-400 font-mono">
              ${dateStr}
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="font-mono text-sm font-normal text-zinc-900 dark:text-zinc-100 tabular-nums">
              ${timeStr}
            </span>
            <button
              data-city-id="${city.id}"
              class="remove-city-btn opacity-60 sm:opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-500 transition-opacity"
              title="Remove ${escapeHtml(city.name)}"
            >
              ${ICONS.x('w-3.5 h-3.5')}
            </button>
          </div>
        </div>
      `;
    }

    if (state.cities.length === 0) {
      citiesHtml = `
        <div class="text-center py-4 text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          No cities selected &bull; Click &quot;Add City&quot; to pick
        </div>
      `;
    }

    const html = `
      <!-- Clock Card (Stopwatch & World Cities) -->
      <div class="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm space-y-4">
        <!-- Stopwatch Section -->
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              ${ICONS.timer('w-3.5 h-3.5 text-zinc-400')}
              <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Stopwatch
              </span>
            </div>

            <div class="flex items-center gap-1.5">
              ${
                !state.stopwatchRunning
                  ? `
                <button
                  id="stopwatch-start-btn"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-2xs"
                  title="Start Stopwatch"
                >
                  ${ICONS.play('w-3 h-3 fill-current')}
                  <span>Start</span>
                </button>
              `
                  : `
                <button
                  id="stopwatch-pause-btn"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors shadow-2xs"
                  title="Pause Stopwatch"
                >
                  ${ICONS.pause('w-3 h-3 fill-current')}
                  <span>Pause</span>
                </button>
              `
              }

              <button
                id="stopwatch-reset-btn"
                ${state.stopwatchElapsedMs === 0 && !state.stopwatchRunning ? 'disabled' : ''}
                class="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Reset Stopwatch"
              >
                ${ICONS.rotateCcw('w-3 h-3')}
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div id="stopwatch-display" class="text-3xl sm:text-4xl font-light font-mono tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
            ${formattedStopwatch}
          </div>
        </div>

        <!-- World Cities Section -->
        <div class="pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              ${ICONS.globe('w-3.5 h-3.5 text-zinc-400')}
              <span class="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                World Cities
              </span>
            </div>

            <div class="relative" id="add-city-container">
              <button
                id="toggle-add-city-btn"
                class="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors shadow-2xs"
                title="Select a city to add"
              >
                ${ICONS.plus('w-3.5 h-3.5')}
                <span>Add City</span>
              </button>

              ${
                state.isAddCityOpen
                  ? `
                <div
                  id="add-city-popover"
                  class="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl bg-white dark:bg-zinc-900 p-1.5 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div class="max-h-52 overflow-y-auto space-y-0.5 py-1">
                    ${availableCities
                      .map((c) => {
                        let cTime = '';
                        try {
                          cTime =
                            c.tz === 'local'
                              ? state.now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                              : state.now.toLocaleTimeString('en-US', { timeZone: c.tz, hour: 'numeric', minute: '2-digit', hour12: true });
                        } catch (e) {}
                        return `
                        <button
                          type="button"
                          data-city-id="${c.id}"
                          class="select-city-option-btn w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <span class="font-normal">${escapeHtml(c.name)}</span>
                          <span class="text-[10px] text-zinc-400 font-mono">${cTime}</span>
                        </button>
                      `;
                      })
                      .join('')}
                    ${
                      availableCities.length === 0
                        ? `<div class="text-center py-2.5 text-xs text-zinc-400">All cities selected</div>`
                        : ''
                    }
                  </div>
                </div>
              `
                  : ''
              }
            </div>
          </div>

          <div class="space-y-1.5">
            ${citiesHtml}
          </div>
        </div>
      </div>

      <!-- Journal Card -->
      <div class="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base sm:text-lg font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
            ${journalTitle}
          </h2>

          <div id="journal-status" class="flex items-center gap-1.5 text-xs">
            ${getJournalStatusHtml()}
          </div>
        </div>

        <textarea
          id="journal-textarea"
          placeholder="${journalPlaceholder}"
          rows="6"
          class="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-y leading-relaxed font-sans"
        >${escapeHtml(journalValue)}</textarea>
      </div>
    `;

    document.getElementById('right-column').innerHTML = html;
  }

  function getJournalStatusHtml() {
    if (state.isSaving) {
      return `
        <span class="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium animate-pulse">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Saving...
        </span>
      `;
    }
    if (state.lastSaved) {
      return `
        <span class="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
          ${ICONS.checkCheck('w-3.5 h-3.5 text-emerald-500')}
          <span>Saved</span>
        </span>
      `;
    }
    return '';
  }

  function renderJournalStatus() {
    const el = document.getElementById('journal-status');
    if (el) {
      el.innerHTML = getJournalStatusHtml();
    }
  }

  function renderModals() {
    const root = document.getElementById('modals-root');
    let html = '';

    // 1. Consistency Modal
    if (state.isConsistencyOpen) {
      const stats = calculateStorageStats();
      const today = getTodayDateString();
      const pastDays = getLastNDays(70, today);
      const summaryMap = new Map(stats.summaries.map((s) => [s.date, s]));

      let heatmapHtml = '';
      for (const d of pastDays) {
        const sum = summaryMap.get(d);
        const done = sum ? sum.completedTodos : 0;
        const isCurrent = d === state.currentId;
        const isTodayDate = d === today;

        let bgClass = 'bg-zinc-200/70 dark:bg-zinc-800/70';
        if (done >= 4) {
          bgClass = 'bg-emerald-600 dark:bg-emerald-400 text-white';
        } else if (done >= 2) {
          bgClass = 'bg-emerald-400 dark:bg-emerald-600 text-white';
        } else if (done >= 1) {
          bgClass = 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900';
        }

        heatmapHtml += `
          <button
            type="button"
            data-day="${d}"
            title="${formatMediumDate(d)}: ${done} tasks done"
            class="consistency-day-block w-3.5 h-3.5 rounded-xs transition-transform hover:scale-125 relative ${bgClass} ${
              isCurrent ? 'ring-2 ring-zinc-900 dark:ring-zinc-100 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900' : ''
            } ${isTodayDate ? 'border border-emerald-500' : ''}"
          ></button>
        `;
      }

      html += `
        <div id="consistency-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div class="relative w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div class="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 class="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  ${ICONS.calendar('w-5 h-5 text-emerald-500')}
                  <span>Consistency & Streaks</span>
                </h2>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Your momentum and historical execution log
                </p>
              </div>
              <button id="close-consistency-btn" class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                ${ICONS.x('w-4 h-4')}
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
                <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  ${ICONS.flame('w-3.5 h-3.5 text-amber-500')}
                  <span>Current Streak</span>
                </div>
                <div class="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  ${stats.currentStreak} <span class="text-xs font-normal text-zinc-400 font-sans">days</span>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
                <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  ${ICONS.award('w-3.5 h-3.5 text-purple-500')}
                  <span>Best Streak</span>
                </div>
                <div class="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  ${stats.bestStreak} <span class="text-xs font-normal text-zinc-400 font-sans">days</span>
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
                <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  ${ICONS.checkCircle2('w-3.5 h-3.5 text-emerald-500')}
                  <span>Tasks Done</span>
                </div>
                <div class="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  ${stats.completedTasksCount}
                </div>
              </div>

              <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/70">
                <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  ${ICONS.calendar('w-3.5 h-3.5 text-blue-500')}
                  <span>Days Tracked</span>
                </div>
                <div class="text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  ${stats.totalDays}
                </div>
              </div>
            </div>

            <div class="mb-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/80">
              <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                <span>Last 10 Weeks Activity</span>
                <div class="flex items-center gap-1.5 text-[11px]">
                  <span>Less</span>
                  <span class="w-2.5 h-2.5 rounded-xs bg-zinc-200 dark:bg-zinc-800"></span>
                  <span class="w-2.5 h-2.5 rounded-xs bg-emerald-300 dark:bg-emerald-900"></span>
                  <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-600"></span>
                  <span class="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-400"></span>
                  <span>More</span>
                </div>
              </div>

              <div class="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-2">
                ${heatmapHtml}
              </div>
            </div>

            <div class="flex items-center justify-between text-xs text-zinc-400">
              <span>Click any block to jump to that day&apos;s page</span>
              <button
                id="consistency-jump-today"
                class="flex items-center gap-1 text-zinc-900 dark:text-zinc-100 font-medium hover:underline"
              >
                <span>Go to Today</span>
                ${ICONS.arrowUpRight('w-3 h-3')}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Export & Import Modal
    if (state.isExportOpen) {
      html += `
        <div id="export-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div class="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <div class="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 class="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  ${ICONS.download('w-5 h-5 text-indigo-500')}
                  <span>Data Portability & Backup</span>
                </h2>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  100% private. All your data lives locally in your browser.
                </p>
              </div>
              <button id="close-export-btn" class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                ${ICONS.x('w-4 h-4')}
              </button>
            </div>

            ${
              state.importStatus.type !== 'idle'
                ? `
              <div
                class="my-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  state.importStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                }"
              >
                ${
                  state.importStatus.type === 'success'
                    ? ICONS.check('w-4 h-4 text-emerald-500 shrink-0')
                    : ICONS.alertCircle('w-4 h-4 text-red-500 shrink-0')
                }
                <span>${escapeHtml(state.importStatus.message)}</span>
              </div>
            `
                : ''
            }

            <div class="my-5 space-y-3">
              <!-- Export Current Day as Markdown -->
              <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3">
                <div>
                  <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    ${ICONS.fileText('w-3.5 h-3.5 text-blue-500')}
                    <span>Export Current Day as Markdown</span>
                  </div>
                  <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Download ${state.currentId}.md ready for Obsidian, Logseq, or Notion.
                  </p>
                </div>
                <button
                  id="export-md-btn"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shrink-0"
                >
                  Export .md
                </button>
              </div>

              <!-- Export Full Backup JSON -->
              <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3">
                <div>
                  <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    ${ICONS.fileCode('w-3.5 h-3.5 text-indigo-500')}
                    <span>Full System Backup (JSON)</span>
                  </div>
                  <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Export all historical days, tasks, habits, and reflections in a single file.
                  </p>
                </div>
                <button
                  id="export-json-btn"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-xs"
                >
                  Download JSON
                </button>
              </div>

              <!-- Restore from Backup -->
              <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2.5">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      ${ICONS.upload('w-3.5 h-3.5 text-emerald-500')}
                      <span>Restore from Backup</span>
                    </div>
                    <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Import a previously saved JSON file to restore your progress.
                    </p>
                  </div>

                  <div class="flex items-center gap-1.5">
                    <label class="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700">
                      <span>Select File</span>
                      <input
                        type="file"
                        id="backup-file-input"
                        accept=".json,application/json"
                        class="hidden"
                      />
                    </label>
                    <button
                      id="toggle-paste-btn"
                      class="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    >
                      ${state.showPaste ? 'Hide' : 'Paste'}
                    </button>
                  </div>
                </div>

                ${
                  state.showPaste
                    ? `
                  <div class="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                    <textarea
                      id="paste-json-textarea"
                      placeholder="Paste backup JSON content here..."
                      rows="4"
                      class="w-full text-xs font-mono p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                    >${escapeHtml(state.pasteText)}</textarea>
                    <button
                      id="confirm-paste-btn"
                      ${!state.pasteText.trim() ? 'disabled' : ''}
                      class="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                    >
                      Confirm Restore
                    </button>
                  </div>
                `
                    : ''
                }
              </div>
            </div>

            <div class="text-right">
              <button
                id="close-export-btn-2"
                class="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 3. Command Palette
    if (state.isCommandOpen) {
      const today = getTodayDateString();
      const yesterday = getPreviousDate(today);
      const tomorrow = getNextDate(today);

      const actions = [
        {
          id: 'action-today',
          title: 'Go to Today',
          subtitle: formatMediumDate(today),
          icon: 'calendar',
          action: () => {
            state.isCommandOpen = false;
            navigateTo('day', today);
          },
        },
        {
          id: 'action-yesterday',
          title: 'Go to Yesterday',
          subtitle: formatMediumDate(yesterday),
          icon: 'calendar',
          action: () => {
            state.isCommandOpen = false;
            navigateTo('day', yesterday);
          },
        },
        {
          id: 'action-tomorrow',
          title: 'Go to Tomorrow',
          subtitle: formatMediumDate(tomorrow),
          icon: 'calendar',
          action: () => {
            state.isCommandOpen = false;
            navigateTo('day', tomorrow);
          },
        },
        {
          id: 'action-week',
          title: 'Go to This Week',
          subtitle: getWeekDateRange(getCurrentWeekString()).label,
          icon: 'calendar',
          action: () => {
            state.isCommandOpen = false;
            navigateTo('week', getCurrentWeekString());
          },
        },
        {
          id: 'action-month',
          title: 'Go to This Month',
          subtitle: formatMonthYear(getCurrentMonthString()),
          icon: 'calendar',
          action: () => {
            state.isCommandOpen = false;
            navigateTo('month', getCurrentMonthString());
          },
        },
        {
          id: 'action-streaks',
          title: 'Open Streaks & Activity Heatmap',
          subtitle: 'View momentum and progress',
          icon: 'flame',
          action: () => {
            state.isCommandOpen = false;
            state.isConsistencyOpen = true;
            renderApp();
          },
        },
        {
          id: 'action-backup',
          title: 'Backup / Export / Restore Data',
          subtitle: 'Download JSON or Markdown',
          icon: 'download',
          action: () => {
            state.isCommandOpen = false;
            state.isExportOpen = true;
            renderApp();
          },
        },
        {
          id: 'action-theme',
          title: state.isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
          subtitle: 'Toggle interface mode',
          icon: state.isDark ? 'sun' : 'moon',
          action: () => {
            toggleTheme();
            state.isCommandOpen = false;
            renderApp();
          },
        },
      ];

      let resultsHtml = '';
      if (state.commandQuery.trim()) {
        if (state.commandResults.length > 0) {
          resultsHtml += `
            <div>
              <div class="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Search Results (${state.commandResults.length})
              </div>
              ${state.commandResults
                .map(
                  (res) => `
                <button
                  type="button"
                  data-jump-date="${res.date}"
                  class="cmd-jump-date-btn w-full text-left p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-start justify-between gap-3 group"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      <span>${formatMediumDate(res.date)}</span>
                      <span class="text-[10px] text-zinc-400 font-mono">(${res.date})</span>
                    </div>
                    <div class="mt-1 space-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      ${res.matches
                        .slice(0, 2)
                        .map((m) => `<div class="truncate">&bull; ${escapeHtml(m)}</div>`)
                        .join('')}
                    </div>
                  </div>
                  ${ICONS.arrowRight('w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors mt-1')}
                </button>
              `
                )
                .join('')}
            </div>
          `;
        } else {
          resultsHtml = `
            <div class="p-6 text-center text-xs text-zinc-500">
              No matching tasks, notes, or entries found for &ldquo;${escapeHtml(state.commandQuery)}&rdquo;.
            </div>
          `;
        }
      } else {
        resultsHtml = `
          <div>
            <div class="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Quick Actions & Jump
            </div>
            ${actions
              .map(
                (act) => `
              <button
                type="button"
                id="${act.id}"
                class="cmd-action-btn w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors flex items-center justify-between gap-3 group"
              >
                <div class="flex items-center gap-3">
                  <div class="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    ${ICONS[act.icon] ? ICONS[act.icon]('w-4 h-4') : ''}
                  </div>
                  <div>
                    <div class="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      ${act.title}
                    </div>
                    <div class="text-[11px] text-zinc-400">
                      ${act.subtitle}
                    </div>
                  </div>
                </div>
                ${ICONS.arrowRight('w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors')}
              </button>
            `
              )
              .join('')}
          </div>
        `;
      }

      html += `
        <div id="command-palette" class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div id="command-palette-card" class="w-full max-w-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100">
            <div class="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
              ${ICONS.search('w-4 h-4 text-zinc-400')}
              <input
                type="text"
                id="cmd-palette-input"
                value="${escapeHtml(state.commandQuery)}"
                placeholder="Search all notes, tasks, or jump to a day..."
                class="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
              <kbd class="px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700">
                ESC
              </kbd>
            </div>

            <div class="max-h-96 overflow-y-auto p-2 space-y-1">
              ${resultsHtml}
            </div>

            <div class="px-4 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Protip: Press <kbd class="px-1 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 font-mono">⌘K</kbd> anywhere</span>
              <span>Fast, offline, local-first</span>
            </div>
          </div>
        </div>
      `;
    }

    root.innerHTML = html;
  }

  function renderApp() {
    renderLeftNavCard();
    renderTodoSection();
    renderRightColumn();
    renderModals();
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // 10. EVENT DELEGATION & USER INTERACTIONS
  // =========================================================================

  function attachGlobalListeners() {
    // Route change via hash
    window.addEventListener('hashchange', () => {
      const route = readRouteFromHash();
      state.periodType = route.periodType;
      state.currentId = route.currentId;
      state.editingId = null;
      state.editingSubtaskId = null;
      state.activeSubtaskInputId = null;
      loadCurrentData();
      renderApp();
    });

    // Cross-tab / import event listener
    window.addEventListener('daily_tracker_data_change', (e) => {
      loadCurrentData();
      renderApp();
    });

    // Live clock ticker (every second)
    setInterval(() => {
      state.now = new Date();
      // Only refresh right column clocks if modal not open to prevent resetting focus
      if (!state.isConsistencyOpen && !state.isExportOpen && !state.isCommandOpen) {
        const activeEl = document.activeElement;
        const isEditingJournal = activeEl && activeEl.id === 'journal-textarea';
        if (!isEditingJournal) {
          renderRightColumn();
        }
      }
    }, 1000);

    // Global keyboard shortcuts (Exact match of src/hooks/useKeyboardShortcuts.ts)
    window.addEventListener('keydown', (e) => {
      const target = e.target;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        state.isCommandOpen = true;
        state.commandQuery = '';
        state.commandResults = [];
        renderModals();
        setTimeout(() => {
          const input = document.getElementById('cmd-palette-input');
          if (input) input.focus();
        }, 50);
        return;
      }

      // ESC key to close open popovers or modals
      if (e.key === 'Escape') {
        let changed = false;
        if (state.isCommandOpen) {
          state.isCommandOpen = false;
          changed = true;
        }
        if (state.isConsistencyOpen) {
          state.isConsistencyOpen = false;
          changed = true;
        }
        if (state.isExportOpen) {
          state.isExportOpen = false;
          changed = true;
        }
        if (state.isPickerOpen) {
          state.isPickerOpen = false;
          changed = true;
        }
        if (state.showTagMenu) {
          state.showTagMenu = false;
          changed = true;
        }
        if (state.showEstimateMenu) {
          state.showEstimateMenu = false;
          changed = true;
        }
        if (state.isAddCityOpen) {
          state.isAddCityOpen = false;
          changed = true;
        }
        if (state.editingId) {
          state.editingId = null;
          changed = true;
        }
        if (state.editingSubtaskId) {
          state.editingSubtaskId = null;
          changed = true;
        }
        if (state.activeSubtaskInputId) {
          state.activeSubtaskInputId = null;
          changed = true;
        }
        if (changed) {
          renderApp();
          return;
        }
      }

      if (isTyping) return;

      // [ -> previous day
      if (e.key === '[') {
        e.preventDefault();
        if (state.periodType === 'day') navigateTo('day', getPreviousDate(state.currentId));
        else if (state.periodType === 'week') navigateTo('week', getPreviousWeek(state.currentId));
        else navigateTo('month', getPreviousMonth(state.currentId));
      }

      // ] -> next day
      if (e.key === ']') {
        e.preventDefault();
        if (state.periodType === 'day') navigateTo('day', getNextDate(state.currentId));
        else if (state.periodType === 'week') navigateTo('week', getNextWeek(state.currentId));
        else navigateTo('month', getNextMonth(state.currentId));
      }

      // t or T -> today
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        if (state.periodType === 'day') navigateTo('day', getTodayDateString());
        else if (state.periodType === 'week') navigateTo('week', getCurrentWeekString());
        else navigateTo('month', getCurrentMonthString());
      }

      // 1 -> Day view
      if (e.key === '1') {
        e.preventDefault();
        navigateTo('day', getTodayDateString());
      }

      // 2 -> Week view
      if (e.key === '2') {
        e.preventDefault();
        navigateTo('week', getCurrentWeekString());
      }

      // 3 -> Month view
      if (e.key === '3') {
        e.preventDefault();
        navigateTo('month', getCurrentMonthString());
      }
    });

    // Close open dropdowns on outside click
    document.addEventListener('mousedown', (e) => {
      let shouldReRender = false;

      // Calendar picker
      if (state.isPickerOpen) {
        const popover = document.getElementById('calendar-popover');
        const trigger = document.getElementById('toggle-calendar-picker-btn');
        if (popover && !popover.contains(e.target) && trigger && !trigger.contains(e.target)) {
          state.isPickerOpen = false;
          shouldReRender = true;
        }
      }

      // Tag menu
      if (state.showTagMenu) {
        const menu = document.getElementById('tag-menu');
        const trigger = document.getElementById('toggle-tag-menu-btn');
        if (menu && !menu.contains(e.target) && trigger && !trigger.contains(e.target)) {
          state.showTagMenu = false;
          shouldReRender = true;
        }
      }

      // Estimate menu
      if (state.showEstimateMenu) {
        const menu = document.getElementById('estimate-menu');
        const trigger = document.getElementById('toggle-estimate-menu-btn');
        if (menu && !menu.contains(e.target) && trigger && !trigger.contains(e.target)) {
          state.showEstimateMenu = false;
          shouldReRender = true;
        }
      }

      // Add city popover
      if (state.isAddCityOpen) {
        const popover = document.getElementById('add-city-popover');
        const trigger = document.getElementById('toggle-add-city-btn');
        if (popover && !popover.contains(e.target) && trigger && !trigger.contains(e.target)) {
          state.isAddCityOpen = false;
          shouldReRender = true;
        }
      }

      if (shouldReRender) {
        renderApp();
      }
    });

    // Master Click Event Delegation
    document.addEventListener('click', (e) => {
      const target = e.target;

      // Brand click -> navigate today
      if (target.closest('#brand-link')) {
        navigateTo('day', getTodayDateString());
        return;
      }

      // Modals triggers
      if (target.closest('#open-consistency-btn')) {
        state.isConsistencyOpen = true;
        renderModals();
        return;
      }
      if (target.closest('#close-consistency-btn') || target.id === 'consistency-modal') {
        state.isConsistencyOpen = false;
        renderModals();
        return;
      }
      if (target.closest('#consistency-jump-today')) {
        state.isConsistencyOpen = false;
        navigateTo('day', getTodayDateString());
        return;
      }
      const dayBlock = target.closest('.consistency-day-block');
      if (dayBlock) {
        const d = dayBlock.getAttribute('data-day');
        state.isConsistencyOpen = false;
        navigateTo('day', d);
        return;
      }

      if (target.closest('#open-export-btn')) {
        state.isExportOpen = true;
        state.importStatus = { type: 'idle' };
        renderModals();
        return;
      }
      if (target.closest('#close-export-btn') || target.closest('#close-export-btn-2') || target.id === 'export-modal') {
        state.isExportOpen = false;
        renderModals();
        return;
      }

      if (target.closest('#export-md-btn')) {
        const dayData = getDayData(state.currentId);
        const md = generateDayMarkdown(dayData);
        downloadFile(md, `${state.currentId}.md`, 'text/markdown');
        return;
      }
      if (target.closest('#export-json-btn')) {
        const json = exportAllDataAsJSON();
        const today = getTodayDateString();
        downloadFile(json, `daily-goals-backup-${today}.json`, 'application/json');
        return;
      }
      if (target.closest('#toggle-paste-btn')) {
        state.showPaste = !state.showPaste;
        renderModals();
        return;
      }
      if (target.closest('#confirm-paste-btn')) {
        if (!state.pasteText.trim()) return;
        const res = importDataFromJSON(state.pasteText);
        if (res.success) {
          state.importStatus = { type: 'success', message: `Successfully imported ${res.count} days of records!` };
          state.pasteText = '';
          state.showPaste = false;
        } else {
          state.importStatus = { type: 'error', message: res.error || 'Invalid JSON provided.' };
        }
        renderModals();
        return;
      }

      // Command palette triggers
      if (target.closest('#open-command-card')) {
        state.isCommandOpen = true;
        state.commandQuery = '';
        state.commandResults = [];
        renderModals();
        setTimeout(() => {
          const inp = document.getElementById('cmd-palette-input');
          if (inp) inp.focus();
        }, 50);
        return;
      }
      if (target.id === 'command-palette') {
        state.isCommandOpen = false;
        renderModals();
        return;
      }

      const cmdJump = target.closest('.cmd-jump-date-btn');
      if (cmdJump) {
        const d = cmdJump.getAttribute('data-jump-date');
        state.isCommandOpen = false;
        navigateTo('day', d);
        return;
      }

      const cmdAct = target.closest('.cmd-action-btn');
      if (cmdAct) {
        const id = cmdAct.id;
        state.isCommandOpen = false;
        const today = getTodayDateString();
        if (id === 'action-today') navigateTo('day', today);
        else if (id === 'action-yesterday') navigateTo('day', getPreviousDate(today));
        else if (id === 'action-tomorrow') navigateTo('day', getNextDate(today));
        else if (id === 'action-week') navigateTo('week', getCurrentWeekString());
        else if (id === 'action-month') navigateTo('month', getCurrentMonthString());
        else if (id === 'action-streaks') {
          state.isConsistencyOpen = true;
          renderApp();
        } else if (id === 'action-backup') {
          state.isExportOpen = true;
          renderApp();
        } else if (id === 'action-theme') {
          toggleTheme();
        }
        return;
      }

      // Theme toggle
      if (target.closest('#toggle-theme-btn')) {
        toggleTheme();
        return;
      }

      // View switchers
      const dayViewBtn = target.closest('#switch-view-day');
      if (dayViewBtn) {
        navigateTo('day', dayViewBtn.getAttribute('data-target'));
        return;
      }
      const weekViewBtn = target.closest('#switch-view-week');
      if (weekViewBtn) {
        navigateTo('week', weekViewBtn.getAttribute('data-target'));
        return;
      }
      const monthViewBtn = target.closest('#switch-view-month');
      if (monthViewBtn) {
        navigateTo('month', monthViewBtn.getAttribute('data-target'));
        return;
      }

      // Timeline Nav buttons
      if (target.closest('#nav-prev-btn')) {
        if (state.periodType === 'day') navigateTo('day', getPreviousDate(state.currentId));
        else if (state.periodType === 'week') navigateTo('week', getPreviousWeek(state.currentId));
        else navigateTo('month', getPreviousMonth(state.currentId));
        return;
      }
      if (target.closest('#nav-next-btn')) {
        if (state.periodType === 'day') navigateTo('day', getNextDate(state.currentId));
        else if (state.periodType === 'week') navigateTo('week', getNextWeek(state.currentId));
        else navigateTo('month', getNextMonth(state.currentId));
        return;
      }
      if (target.closest('#nav-jump-btn')) {
        if (state.periodType === 'day') navigateTo('day', getTodayDateString());
        else if (state.periodType === 'week') navigateTo('week', getCurrentWeekString());
        else navigateTo('month', getCurrentMonthString());
        return;
      }

      // Calendar picker
      if (target.closest('#toggle-calendar-picker-btn')) {
        state.isPickerOpen = !state.isPickerOpen;
        if (state.isPickerOpen) {
          if (state.periodType === 'day') state.calendarMonth = parseDate(state.currentId);
          else if (state.periodType === 'week') state.calendarMonth = getWeekDateRange(state.currentId).start;
          else {
            const [y, m] = state.currentId.split('-').map(Number);
            state.calendarMonth = new Date(y, m - 1, 1);
          }
        }
        renderLeftNavCard();
        return;
      }
      if (target.closest('#cal-close-btn')) {
        state.isPickerOpen = false;
        renderLeftNavCard();
        return;
      }
      if (target.closest('#cal-prev-month')) {
        const y = state.calendarMonth.getFullYear();
        const m = state.calendarMonth.getMonth();
        state.calendarMonth = new Date(y, m - 1, 1);
        renderLeftNavCard();
        return;
      }
      if (target.closest('#cal-next-month')) {
        const y = state.calendarMonth.getFullYear();
        const m = state.calendarMonth.getMonth();
        state.calendarMonth = new Date(y, m + 1, 1);
        renderLeftNavCard();
        return;
      }

      const calDayBtn = target.closest('.cal-day-btn');
      if (calDayBtn) {
        state.isPickerOpen = false;
        if (state.periodType === 'day') {
          navigateTo('day', calDayBtn.getAttribute('data-date'));
        } else if (state.periodType === 'week') {
          navigateTo('week', calDayBtn.getAttribute('data-week'));
        } else {
          navigateTo('month', calDayBtn.getAttribute('data-month'));
        }
        return;
      }

      // Todo Search toggle
      if (target.closest('#open-search-btn')) {
        state.isSearchOpen = true;
        renderTodoSection();
        setTimeout(() => {
          const inp = document.getElementById('tasks-search-input');
          if (inp) inp.focus();
        }, 30);
        return;
      }
      if (target.closest('#close-search-btn')) {
        state.isSearchOpen = false;
        state.searchQuery = '';
        renderTodoSection();
        return;
      }

      // Filter tabs
      const filterTab = target.closest('.filter-tab');
      if (filterTab) {
        state.filter = filterTab.getAttribute('data-filter');
        renderTodoSection();
        return;
      }

      // Rollover
      if (target.closest('#rollover-btn')) {
        let prevData = null;
        if (state.periodType === 'day') prevData = getPreviousActiveDayData(state.currentId);
        else if (state.periodType === 'week') prevData = getPreviousActiveWeekData(state.currentId);
        else prevData = getPreviousActiveMonthData(state.currentId);

        if (prevData) {
          const uncompleted = prevData.todos.filter((t) => !t.completed);
          const currentTexts = new Set((state.data.todos || []).map((t) => t.text.toLowerCase()));
          const rolledOver = uncompleted
            .filter((t) => !currentTexts.has(t.text.toLowerCase()))
            .map((t) => ({
              ...t,
              id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date().toISOString(),
            }));

          if (rolledOver.length > 0) {
            state.data.todos = [...rolledOver, ...state.data.todos];
            commitSave();
            renderTodoSection();
          }
        }
        return;
      }

      // Clear completed regular tasks
      if (target.closest('#clear-completed-btn')) {
        state.data.todos = state.data.todos.filter((t) => !(t.completed && !t.isSpecial));
        commitSave();
        renderTodoSection();
        return;
      }

      // Clear completed special tasks
      if (target.closest('#clear-completed-special-btn')) {
        state.data.todos = state.data.todos.filter((t) => !(t.completed && t.isSpecial));
        commitSave();
        renderLeftNavCard();
        return;
      }

      // Priority cycle
      if (target.closest('#cycle-priority-btn')) {
        if (state.priority === 'medium') state.priority = 'high';
        else if (state.priority === 'high') state.priority = 'low';
        else state.priority = 'medium';
        renderTodoSection();
        return;
      }

      // Tag menu toggle
      if (target.closest('#toggle-tag-menu-btn')) {
        state.showTagMenu = !state.showTagMenu;
        state.showEstimateMenu = false;
        renderTodoSection();
        return;
      }
      const tagOpt = target.closest('.tag-option-btn');
      if (tagOpt) {
        const t = tagOpt.getAttribute('data-tag');
        state.selectedTag = state.selectedTag === t ? '' : t;
        state.showTagMenu = false;
        renderTodoSection();
        return;
      }

      // Estimate menu toggle
      if (target.closest('#toggle-estimate-menu-btn')) {
        state.showEstimateMenu = !state.showEstimateMenu;
        state.showTagMenu = false;
        renderTodoSection();
        return;
      }
      const estOpt = target.closest('.estimate-option-btn');
      if (estOpt) {
        const est = estOpt.getAttribute('data-estimate');
        state.selectedEstimate = state.selectedEstimate === est ? '' : est;
        state.showEstimateMenu = false;
        renderTodoSection();
        return;
      }

      // Toggle special todo in add bar
      if (target.closest('#toggle-special-todo-btn')) {
        state.isSpecialTodo = !state.isSpecialTodo;
        renderTodoSection();
        return;
      }

      // Toggle special status of a task (star/unstar)
      const toggleSpecialBtn = target.closest('.toggle-special-status-btn');
      if (toggleSpecialBtn) {
        const id = toggleSpecialBtn.getAttribute('data-id');
        state.data.todos = state.data.todos.map((t) => {
          if (t.id !== id) return t;
          return { ...t, isSpecial: !t.isSpecial };
        });
        commitSave();
        renderTodoSection();
        renderLeftNavCard();
        return;
      }

      // Toggle todo
      const toggleTodoBtn = target.closest('.toggle-todo-btn');
      if (toggleTodoBtn) {
        const id = toggleTodoBtn.getAttribute('data-id');
        state.data.todos = state.data.todos.map((t) => {
          if (t.id !== id) return t;
          const nextComp = !t.completed;
          return {
            ...t,
            completed: nextComp,
            status: nextComp ? 'completed' : 'todo',
            completedAt: nextComp ? new Date().toISOString() : undefined,
          };
        });
        commitSave();
        renderTodoSection();
        renderLeftNavCard();
        return;
      }

      // Toggle In Progress
      const toggleInProgBtn = target.closest('.toggle-inprogress-btn');
      if (toggleInProgBtn) {
        const id = toggleInProgBtn.getAttribute('data-id');
        state.data.todos = state.data.todos.map((t) => {
          if (t.id !== id) return t;
          const isCurrentlyInProg = t.status === 'in_progress';
          return {
            ...t,
            status: isCurrentlyInProg ? 'todo' : 'in_progress',
            completed: false,
            completedAt: undefined,
          };
        });
        commitSave();
        renderTodoSection();
        renderLeftNavCard();
        return;
      }

      // Start edit todo
      const editTrigger = target.closest('.start-edit-todo') || target.closest('.start-edit-btn');
      if (editTrigger) {
        const id = editTrigger.getAttribute('data-id');
        const todo = state.data.todos.find((t) => t.id === id);
        if (todo) {
          state.editingId = todo.id;
          state.editText = todo.text;
          renderTodoSection();
          renderLeftNavCard();
          setTimeout(() => {
            const inp = document.querySelector(`.edit-todo-input[data-id="${todo.id}"]`);
            if (inp) inp.focus();
          }, 30);
        }
        return;
      }

      // Delete todo
      const deleteTodoBtn = target.closest('.delete-todo-btn');
      if (deleteTodoBtn) {
        const id = deleteTodoBtn.getAttribute('data-id');
        state.data.todos = state.data.todos.filter((t) => t.id !== id);
        commitSave();
        renderTodoSection();
        renderLeftNavCard();
        return;
      }

      // Toggle subtasks drawer
      const toggleSubtasksBtn = target.closest('.toggle-expand-subtasks');
      if (toggleSubtasksBtn) {
        const id = toggleSubtasksBtn.getAttribute('data-id');
        const todo = (state.data.todos || []).find((t) => t.id === id);
        const isInProgress = todo && todo.status === 'in_progress';
        const currentExpanded = state.expandedSubtasks[id] !== undefined
          ? Boolean(state.expandedSubtasks[id])
          : Boolean(isInProgress || state.activeSubtaskInputId === id);
        state.expandedSubtasks[id] = !currentExpanded;
        renderTodoSection();
        renderLeftNavCard();
        return;
      }

      // Open subtask input
      const openSubtaskBtn = target.closest('.open-subtask-input-btn');
      if (openSubtaskBtn) {
        const id = openSubtaskBtn.getAttribute('data-id');
        state.expandedSubtasks[id] = true;
        state.activeSubtaskInputId = id;
        renderTodoSection();
        renderLeftNavCard();
        setTimeout(() => {
          const inp = document.querySelector(`.subtask-add-input[data-id="${id}"]`);
          if (inp) inp.focus();
        }, 30);
        return;
      }

      // Toggle subtask completed
      const toggleSubBtn = target.closest('.toggle-subtask-btn');
      if (toggleSubBtn) {
        const todoId = toggleSubBtn.getAttribute('data-todo-id');
        const subId = toggleSubBtn.getAttribute('data-sub-id');
        state.data.todos = state.data.todos.map((t) => {
          if (t.id !== todoId) return t;
          return {
            ...t,
            subtasks: (t.subtasks || []).map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)),
          };
        });
        commitSave();
        renderTodoSection();
        renderLeftNavCard();
        return;
      }

      // Edit subtask trigger
      const editSubTrigger = target.closest('.edit-subtask-trigger');
      if (editSubTrigger) {
        const subId = editSubTrigger.getAttribute('data-sub-id');
        const currentText = editSubTrigger.getAttribute('data-text');
        state.editingSubtaskId = subId;
        state.editSubtaskText = currentText;
        renderTodoSection();
        renderLeftNavCard();
        setTimeout(() => {
          const inp = document.querySelector(`.edit-subtask-input[data-sub-id="${subId}"]`);
          if (inp) inp.focus();
        }, 30);
        return;
      }

      // Delete subtask
      const deleteSubBtn = target.closest('.delete-subtask-btn');
      if (deleteSubBtn) {
        const todoId = deleteSubBtn.getAttribute('data-todo-id');
        const subId = deleteSubBtn.getAttribute('data-sub-id');
        state.data.todos = state.data.todos.map((t) => {
          if (t.id !== todoId) return t;
          return {
            ...t,
            subtasks: (t.subtasks || []).filter((s) => s.id !== subId),
          };
        });
        commitSave();
        renderTodoSection();
        renderLeftNavCard();
        return;
      }

      // Add subtask button click
      const submitSubBtn = target.closest('.submit-subtask-btn');
      if (submitSubBtn) {
        const todoId = submitSubBtn.getAttribute('data-id');
        const text = (state.subtaskInputs[todoId] || '').trim();
        if (text) {
          const newSub = {
            id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text,
            completed: false,
            createdAt: new Date().toISOString(),
          };
          state.data.todos = state.data.todos.map((t) =>
            t.id === todoId ? { ...t, subtasks: [...(t.subtasks || []), newSub] } : t
          );
          state.subtaskInputs[todoId] = '';
          state.expandedSubtasks[todoId] = true;
          commitSave();
          renderTodoSection();
          renderLeftNavCard();
        }
        return;
      }

      // Stopwatch controls
      if (target.closest('#stopwatch-start-btn')) {
        startStopwatch();
        return;
      }
      if (target.closest('#stopwatch-pause-btn')) {
        pauseStopwatch();
        return;
      }
      if (target.closest('#stopwatch-reset-btn')) {
        resetStopwatch();
        return;
      }

      // World Cities controls
      if (target.closest('#toggle-add-city-btn')) {
        state.isAddCityOpen = !state.isAddCityOpen;
        renderRightColumn();
        return;
      }
      const selectCityBtn = target.closest('.select-city-option-btn');
      if (selectCityBtn) {
        const id = selectCityBtn.getAttribute('data-city-id');
        const city = AVAILABLE_CITIES.find((c) => c.id === id);
        if (city && !state.cities.some((c) => c.id === city.id)) {
          saveCities([...state.cities, city]);
        }
        state.isAddCityOpen = false;
        renderRightColumn();
        return;
      }
      const removeCityBtn = target.closest('.remove-city-btn');
      if (removeCityBtn) {
        const id = removeCityBtn.getAttribute('data-city-id');
        saveCities(state.cities.filter((c) => c.id !== id));
        return;
      }
    });

    // Form submission for adding todo
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'add-todo-form') {
        e.preventDefault();
        const text = state.newText.trim();
        if (!text) return;

        const newTodo = {
          id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          text,
          completed: false,
          status: 'todo',
          priority: state.priority,
          tag: state.selectedTag || undefined,
          estimate: state.selectedEstimate || undefined,
          isSpecial: Boolean(state.isSpecialTodo),
          subtasks: [],
          createdAt: new Date().toISOString(),
        };

        state.data.todos = [newTodo, ...(state.data.todos || [])];
        state.newText = '';
        state.selectedTag = '';
        state.selectedEstimate = '';
        state.priority = 'medium';
        state.isSpecialTodo = false;
        state.showTagMenu = false;
        state.showEstimateMenu = false;

        commitSave();
        renderTodoSection();
        renderLeftNavCard();

        setTimeout(() => {
          const inp = document.getElementById('new-todo-input');
          if (inp) inp.focus();
        }, 30);
      }
    });

    // Input handlers
    document.addEventListener('input', (e) => {
      const target = e.target;

      if (target.id === 'new-todo-input') {
        state.newText = target.value;
        const btn = document.getElementById('submit-todo-btn');
        if (btn) btn.disabled = !state.newText.trim();
        return;
      }

      if (target.id === 'tasks-search-input') {
        state.searchQuery = target.value;
        renderTodoSection();
        const inp = document.getElementById('tasks-search-input');
        if (inp) {
          inp.focus();
          inp.selectionStart = inp.selectionEnd = inp.value.length;
        }
        return;
      }

      if (target.id === 'journal-textarea') {
        state.data.journal = target.value;
        debouncedSave();
        return;
      }

      if (target.classList.contains('edit-todo-input')) {
        state.editText = target.value;
        return;
      }

      if (target.classList.contains('subtask-add-input')) {
        const todoId = target.getAttribute('data-id');
        state.subtaskInputs[todoId] = target.value;
        return;
      }

      if (target.classList.contains('edit-subtask-input')) {
        state.editSubtaskText = target.value;
        return;
      }

      if (target.id === 'cmd-palette-input') {
        state.commandQuery = target.value;
        state.commandResults = searchAllDays(state.commandQuery).slice(0, 8);
        renderModals();
        const inp = document.getElementById('cmd-palette-input');
        if (inp) {
          inp.focus();
          inp.selectionStart = inp.selectionEnd = inp.value.length;
        }
        return;
      }

      if (target.id === 'paste-json-textarea') {
        state.pasteText = target.value;
        const btn = document.getElementById('confirm-paste-btn');
        if (btn) btn.disabled = !state.pasteText.trim();
        return;
      }
    });

    // Keydown for inline inputs
    document.addEventListener('keydown', (e) => {
      const target = e.target;

      // Edit todo input
      if (target.classList.contains('edit-todo-input')) {
        const id = target.getAttribute('data-id');
        if (e.key === 'Enter') {
          e.preventDefault();
          if (state.editText.trim()) {
            state.data.todos = state.data.todos.map((t) =>
              t.id === id ? { ...t, text: state.editText.trim() } : t
            );
            commitSave();
          }
          state.editingId = null;
          renderTodoSection();
          renderLeftNavCard();
        } else if (e.key === 'Escape') {
          state.editingId = null;
          renderTodoSection();
          renderLeftNavCard();
        }
        return;
      }

      // Add subtask input Enter key
      if (target.classList.contains('subtask-add-input')) {
        const todoId = target.getAttribute('data-id');
        if (e.key === 'Enter') {
          e.preventDefault();
          const text = (state.subtaskInputs[todoId] || '').trim();
          if (text) {
            const newSub = {
              id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              text,
              completed: false,
              createdAt: new Date().toISOString(),
            };
            state.data.todos = state.data.todos.map((t) =>
              t.id === todoId ? { ...t, subtasks: [...(t.subtasks || []), newSub] } : t
            );
            state.subtaskInputs[todoId] = '';
            state.expandedSubtasks[todoId] = true;
            commitSave();
            renderTodoSection();
            renderLeftNavCard();
          }
        } else if (e.key === 'Escape') {
          state.activeSubtaskInputId = null;
          renderTodoSection();
          renderLeftNavCard();
        }
        return;
      }

      // Edit subtask input Enter key
      if (target.classList.contains('edit-subtask-input')) {
        const todoId = target.getAttribute('data-todo-id');
        const subId = target.getAttribute('data-sub-id');
        if (e.key === 'Enter') {
          e.preventDefault();
          if (state.editSubtaskText.trim()) {
            state.data.todos = state.data.todos.map((t) => {
              if (t.id !== todoId) return t;
              return {
                ...t,
                subtasks: (t.subtasks || []).map((s) =>
                  s.id === subId ? { ...s, text: state.editSubtaskText.trim() } : s
                ),
              };
            });
            commitSave();
          }
          state.editingSubtaskId = null;
          state.editSubtaskText = '';
          renderTodoSection();
          renderLeftNavCard();
        } else if (e.key === 'Escape') {
          state.editingSubtaskId = null;
          state.editSubtaskText = '';
          renderTodoSection();
          renderLeftNavCard();
        }
        return;
      }
    });

    // Blur handlers for inline edits
    document.addEventListener(
      'blur',
      (e) => {
        const target = e.target;
        if (target.classList.contains('edit-todo-input')) {
          const id = target.getAttribute('data-id');
          if (state.editText.trim()) {
            state.data.todos = state.data.todos.map((t) =>
              t.id === id ? { ...t, text: state.editText.trim() } : t
            );
            commitSave();
          }
          state.editingId = null;
          renderTodoSection();
          renderLeftNavCard();
        }

        if (target.classList.contains('edit-subtask-input')) {
          const todoId = target.getAttribute('data-todo-id');
          const subId = target.getAttribute('data-sub-id');
          if (state.editSubtaskText.trim()) {
            state.data.todos = state.data.todos.map((t) => {
              if (t.id !== todoId) return t;
              return {
                ...t,
                subtasks: (t.subtasks || []).map((s) =>
                  s.id === subId ? { ...s, text: state.editSubtaskText.trim() } : s
                ),
              };
            });
            commitSave();
          }
          state.editingSubtaskId = null;
          state.editSubtaskText = '';
          renderTodoSection();
          renderLeftNavCard();
        }
      },
      true
    );

    // File input for restoring JSON backup
    document.addEventListener('change', (e) => {
      if (e.target.id === 'backup-file-input') {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          const result = importDataFromJSON(content);
          if (result.success) {
            state.importStatus = {
              type: 'success',
              message: `Successfully imported ${result.count} days of records!`,
            };
          } else {
            state.importStatus = {
              type: 'error',
              message: result.error || 'Failed to parse JSON file.',
            };
          }
          renderModals();
        };
        reader.readAsText(file);
      }
    });

    // Drag-and-drop handlers for mouse task reordering (no arrows)
    document.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.task-card-item');
      if (!card) return;
      if (state.editingId) {
        e.preventDefault();
        return;
      }
      // If user started drag on interactive child elements, do not drag
      if (e.target.closest('button, input, textarea, a, .subtask-add-input')) {
        e.preventDefault();
        return;
      }
      const id = card.getAttribute('data-todo-id');
      if (!id) return;
      state.draggedTodoId = id;
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('opacity-40', 'border-dashed', 'border-zinc-400', 'dark:border-zinc-600', 'scale-[0.99]');
    });

    document.addEventListener('dragover', (e) => {
      if (!state.draggedTodoId) return;
      const card = e.target.closest('.task-card-item');
      if (!card) return;
      const id = card.getAttribute('data-todo-id');
      if (!id || id === state.draggedTodoId) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const rect = card.getBoundingClientRect();
      const isBottom = e.clientY - rect.top > rect.height / 2;
      const position = isBottom ? 'after' : 'before';

      if (state.dragOverTodoId !== id || state.dragOverPosition !== position) {
        // Clear indicators from other cards
        document.querySelectorAll('.task-card-item').forEach((el) => {
          if (el.getAttribute('data-todo-id') !== state.draggedTodoId) {
            el.classList.remove(
              'border-t-2',
              'border-b-2',
              '!border-t-zinc-900',
              'dark:!border-t-zinc-100',
              '!border-b-zinc-900',
              'dark:!border-b-zinc-100',
              'bg-zinc-50/70',
              'dark:bg-zinc-800/40'
            );
          }
        });

        state.dragOverTodoId = id;
        state.dragOverPosition = position;

        if (position === 'before') {
          card.classList.add('border-t-2', '!border-t-zinc-900', 'dark:!border-t-zinc-100', 'bg-zinc-50/70', 'dark:bg-zinc-800/40');
        } else {
          card.classList.add('border-b-2', '!border-b-zinc-900', 'dark:!border-b-zinc-100', 'bg-zinc-50/70', 'dark:bg-zinc-800/40');
        }
      }
    });

    document.addEventListener('dragleave', (e) => {
      const card = e.target.closest('.task-card-item');
      if (card && state.dragOverTodoId === card.getAttribute('data-todo-id')) {
        const rect = card.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX >= rect.right ||
          e.clientY < rect.top ||
          e.clientY >= rect.bottom
        ) {
          card.classList.remove(
            'border-t-2',
            'border-b-2',
            '!border-t-zinc-900',
            'dark:!border-t-zinc-100',
            '!border-b-zinc-900',
            'dark:!border-b-zinc-100',
            'bg-zinc-50/70',
            'dark:bg-zinc-800/40'
          );
          state.dragOverTodoId = null;
          state.dragOverPosition = null;
        }
      }
    });

    document.addEventListener('drop', (e) => {
      if (!state.draggedTodoId) return;
      e.preventDefault();
      const card = e.target.closest('.task-card-item');
      if (card) {
        const targetId = card.getAttribute('data-todo-id');
        if (targetId && targetId !== state.draggedTodoId) {
          const pos = state.dragOverPosition || 'before';
          reorderTodos(state.draggedTodoId, targetId, pos);
        }
      }
      state.draggedTodoId = null;
      state.dragOverTodoId = null;
      state.dragOverPosition = null;
      renderTodoSection();
      renderLeftNavCard();
    });

    document.addEventListener('dragend', () => {
      state.draggedTodoId = null;
      state.dragOverTodoId = null;
      state.dragOverPosition = null;
      renderTodoSection();
      renderLeftNavCard();
    });
  }

  // =========================================================================
  // 11. BOOTSTRAP APPLICATION
  // =========================================================================

  function init() {
    initTheme();
    initCities();

    const route = readRouteFromHash();
    state.periodType = route.periodType;
    state.currentId = route.currentId;

    loadCurrentData();
    renderApp();
    attachGlobalListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
