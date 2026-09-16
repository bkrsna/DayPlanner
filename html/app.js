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
      notes: [],
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
        notes: Array.isArray(data.notes) ? data.notes : [],
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
      notes: [],
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
        notes: Array.isArray(data.notes) ? data.notes : [],
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
      notes: [],
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
        notes: Array.isArray(data.notes) ? data.notes : [],
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
              notes: Array.isArray(value.notes) ? value.notes : [],
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
              notes: Array.isArray(value.notes) ? value.notes : [],
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
              notes: Array.isArray(value.notes) ? value.notes : [],
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

      if (Array.isArray(data.notes)) {
        for (const n of data.notes) {
          const titleMatch = (n.title || '').toLowerCase().includes(q);
          const contentMatch = (n.content || '').toLowerCase().includes(q);
          const tagMatch = Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase().includes(q));
          if (titleMatch || contentMatch || tagMatch) {
            const prefix = n.type === 'idea' ? 'Idea' : 'Note';
            matches.push(`${prefix}: ${n.title || 'Untitled'} - ${(n.content || '').slice(0, 60)}`);
          }
        }
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
    gripVertical: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical ${cls}"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
    lightbulb: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb ${cls}"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
    flag: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flag ${cls}"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
    hourglass: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hourglass ${cls}"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>`,
    maximize2: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-maximize-2 ${cls}"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`,
    minimize2: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minimize-2 ${cls}"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`,
    minus: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus ${cls}"><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
    externalLink: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link ${cls}"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
    code: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code ${cls}"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    quote: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote ${cls}"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>`,
    bold: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bold ${cls}"><path d="M6 12h9a4 4 0 0 0 0-8H6v8Zm0 0h10a4 4 0 0 1 0 8H6v-8Z"/></svg>`,
    italic: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-italic ${cls}"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>`,
    heading: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading ${cls}"><path d="M6 12h12"/><path d="M6 4v16"/><path d="M18 4v16"/></svg>`,
    checkSquare: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-square ${cls}"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    pin: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pin ${cls}"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`,
    copy: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy ${cls}"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    edit3: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-edit-3 ${cls}"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    eye: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye ${cls}"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
    arrowRightCircle: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right-circle ${cls}"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="m12 16 4-4-4-4"/></svg>`,
    appWindow: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-app-window ${cls}"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/></svg>`,
    grid: (cls) => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid ${cls}"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
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

    // Mac App Window State
    macApp: {
      isOpen: false,
      isMinimized: false,
      isFullscreen: false,
      activeApp: 'clock', // 'clock' | 'notes'
      clockSubTab: 'world', // 'world' | 'stopwatch' | 'timer'
      worldCities: [],
      isAddCityOpen: false,
      // Stopwatch
      swRunning: false,
      swElapsedMs: 0,
      swStartTime: 0,
      swAccumulatedMs: 0,
      swLaps: [],
      // Focus Timer
      timerTotalSec: 25 * 60,
      timerRemainingSec: 25 * 60,
      timerRunning: false,
      // Notes App
      selectedNoteId: null,
      noteFilter: 'all', // 'all' | 'note' | 'idea' | 'pinned'
      noteSearchQuery: '',
      selectedTag: null,
      editMode: 'edit', // 'edit' | 'preview'
      mobileView: 'list', // 'list' | 'editor'
      newTagInput: '',
      copiedCodeIdx: null,
      addedTodoFlash: false,
    },
  };

  let saveDebounceTimer = null;
  let stopwatchInterval = null;
  let macStopwatchInterval = null;
  let macTimerInterval = null;

  // Web Audio Context & Chime Helper
  let sharedAudioCtx = null;

  function unlockAudioContext() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
      if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  function playCompletionChime() {
    try {
      unlockAudioContext();
      if (!sharedAudioCtx) return;
      const ctx = sharedAudioCtx;
      const now = ctx.currentTime;

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Pleasant 3-note chime: C5 (523Hz), E5 (659Hz), G5 (784Hz)
      playTone(523.25, now, 0.4);
      playTone(659.25, now + 0.15, 0.4);
      playTone(783.99, now + 0.30, 0.6);
    } catch (e) {}
  }

  // Mac Clock World Cities configuration
  const MAC_AVAILABLE_CITIES = [
    { id: 'local', name: 'Local Time', tz: 'local' },
    { id: 'nyc', name: 'New York (EDT)', tz: 'America/New_York' },
    { id: 'london', name: 'London (BST)', tz: 'Europe/London' },
    { id: 'paris', name: 'Paris (CEST)', tz: 'Europe/Paris' },
    { id: 'berlin', name: 'Berlin (CEST)', tz: 'Europe/Berlin' },
    { id: 'dubai', name: 'Dubai (GST)', tz: 'Asia/Dubai' },
    { id: 'delhi', name: 'New Delhi (IST)', tz: 'Asia/Kolkata' },
    { id: 'singapore', name: 'Singapore (SGT)', tz: 'Asia/Singapore' },
    { id: 'hongkong', name: 'Hong Kong (HKT)', tz: 'Asia/Hong_Kong' },
    { id: 'tokyo', name: 'Tokyo (JST)', tz: 'Asia/Tokyo' },
    { id: 'sydney', name: 'Sydney (AEST)', tz: 'Australia/Sydney' },
    { id: 'auckland', name: 'Auckland (NZST)', tz: 'Pacific/Auckland' },
    { id: 'sf', name: 'San Francisco (PDT)', tz: 'America/Los_Angeles' },
    { id: 'chicago', name: 'Chicago (CDT)', tz: 'America/Chicago' },
    { id: 'utc', name: 'UTC (Universal)', tz: 'UTC' },
  ];

  const MAC_DEFAULT_CITIES = [
    { id: 'local', name: 'Local Time', tz: 'local' },
    { id: 'nyc', name: 'New York (EDT)', tz: 'America/New_York' },
    { id: 'london', name: 'London (BST)', tz: 'Europe/London' },
    { id: 'tokyo', name: 'Tokyo (JST)', tz: 'Asia/Tokyo' },
  ];

  const MAC_CLOCK_STORAGE_KEY = 'mac_app_clock_cities_v1';

  function initMacCities() {
    try {
      const raw = localStorage.getItem(MAC_CLOCK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.macApp.worldCities = parsed;
          return;
        }
      }
    } catch (e) {}
    state.macApp.worldCities = [...MAC_DEFAULT_CITIES];
  }

  function saveMacCities(cities) {
    try {
      localStorage.setItem(MAC_CLOCK_STORAGE_KEY, JSON.stringify(cities));
    } catch (e) {}
  }

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

  function renderAppsLauncherCardHtml() {
    const now = state.now || new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourAngle = ((hours % 12) + minutes / 60) * 30;
    const minuteAngle = (minutes + seconds / 60) * 6;
    const secondAngle = seconds * 6;

    const notesCount = (state.data?.notes || []).length;

    return `
      <div class="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm space-y-3.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            ${ICONS.grid('w-3.5 h-3.5 text-zinc-400')}
            <span class="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Workspace Apps
            </span>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            MacBook Mode
          </span>
        </div>

        <div class="grid grid-cols-4 gap-2.5 sm:gap-3">
          <!-- Slot 1: Live Analog Clock -->
          <button
            type="button"
            id="launcher-clock-btn"
            class="group flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer select-none text-center"
            title="Open Clock & Stopwatch App"
          >
            <div class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-950 p-1 shadow-md group-hover:scale-105 group-hover:shadow-lg transition-transform flex items-center justify-center overflow-hidden border border-zinc-800">
              <svg class="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" class="fill-zinc-950 stroke-zinc-800" stroke-width="2"/>
                ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
                  .map(
                    (deg) => `
                  <line x1="50" y1="8" x2="50" y2="${deg % 90 === 0 ? 16 : 12}" stroke="${deg % 90 === 0 ? '#f4f4f5' : '#71717a'}" stroke-width="${deg % 90 === 0 ? 3 : 1.5}" stroke-linecap="round" transform="rotate(${deg} 50 50)"/>
                `
                  )
                  .join('')}
                <line x1="50" y1="50" x2="50" y2="25" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" transform="rotate(${hourAngle} 50 50)"/>
                <line x1="50" y1="50" x2="50" y2="15" stroke="#e4e4e7" stroke-width="2.5" stroke-linecap="round" transform="rotate(${minuteAngle} 50 50)"/>
                <line x1="50" y1="58" x2="50" y2="12" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" transform="rotate(${secondAngle} 50 50)"/>
                <circle cx="50" cy="50" r="3" fill="#f97316" stroke="#09090b" stroke-width="1"/>
              </svg>
            </div>
            <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              Clock
            </span>
          </button>

          <!-- Slot 2: Notes & Ideas -->
          <button
            type="button"
            id="launcher-notes-btn"
            class="group flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer select-none text-center"
            title="Open Notes & Ideas App"
          >
            <div class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 p-2 shadow-md group-hover:scale-105 group-hover:shadow-lg transition-transform flex flex-col justify-between overflow-hidden border border-amber-300/80">
              <div class="flex items-center justify-between">
                <div class="h-1.5 w-6 rounded-full bg-amber-600/30"></div>
                <div class="w-2 h-2 rounded-full bg-amber-700/40"></div>
              </div>
              <div class="space-y-1 my-auto px-0.5">
                <div class="h-1 w-full rounded-full bg-amber-900/30"></div>
                <div class="h-1 w-4/5 rounded-full bg-amber-900/25"></div>
                <div class="h-1 w-3/5 rounded-full bg-amber-900/20"></div>
              </div>
              ${
                notesCount > 0
                  ? `
                <div class="absolute top-1 right-1 px-1.5 py-0.2 rounded-full bg-zinc-900 text-white text-[9px] font-mono font-semibold shadow-xs">
                  ${notesCount}
                </div>
              `
                  : ''
              }
            </div>
            <span class="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
              Notes
            </span>
          </button>

          <!-- Slot 3: Soon placeholder -->
          <div class="flex flex-col items-center gap-1.5 p-2 rounded-2xl select-none text-center opacity-60">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
              ${ICONS.plus('w-4 h-4')}
            </div>
            <span class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Soon
            </span>
          </div>

          <!-- Slot 4: Soon placeholder -->
          <div class="flex flex-col items-center gap-1.5 p-2 rounded-2xl select-none text-center opacity-60">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
              ${ICONS.plus('w-4 h-4')}
            </div>
            <span class="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Soon
            </span>
          </div>
        </div>
      </div>
    `;
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
      <!-- Apps Launcher Card Dock (4 Squircle Slots matching sketch) -->
      ${renderAppsLauncherCardHtml()}

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
              <button
                type="button"
                id="clock-card-expand-btn"
                class="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Expand to MacBook Clock Application"
              >
                ${ICONS.maximize2('w-3.5 h-3.5')}
              </button>
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
          <div class="flex items-center gap-2">
            <h2 class="text-base sm:text-lg font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
              ${journalTitle}
            </h2>
            <button
              type="button"
              id="journal-card-expand-btn"
              class="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Expand to MacBook Notes & Ideas Application"
            >
              ${ICONS.maximize2('w-3.5 h-3.5')}
            </button>
          </div>

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

  // =========================================================================
  // MACBOOK APPLICATION WINDOW & WORKSPACE APPS
  // =========================================================================

  function openMacApp(appId) {
    unlockAudioContext();
    initMacCities();
    state.macApp.isOpen = true;
    state.macApp.isMinimized = false;
    if (appId) {
      state.macApp.activeApp = appId;
    }
    const notes = state.data?.notes || [];
    if (notes.length > 0 && !notes.some((n) => n.id === state.macApp.selectedNoteId)) {
      state.macApp.selectedNoteId = notes[0].id;
    }
    renderModals();
  }

  function closeMacApp() {
    state.macApp.isOpen = false;
    state.macApp.isMinimized = false;
    state.macApp.isFullscreen = false;
    renderModals();
  }

  function getCityTimeInfo(city, now) {
    let timeStr = '';
    let dateStr = '';
    let offsetStr = '';

    try {
      const localDay = now.getDate();
      const cityDate =
        city.tz === 'local' ? now : new Date(now.toLocaleString('en-US', { timeZone: city.tz }));

      timeStr = cityDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const diffHours = (cityDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const targetDay = cityDate.getDate();

      let dayRel = 'Today';
      if (targetDay > localDay || (localDay >= 28 && targetDay === 1)) {
        dayRel = 'Tomorrow';
      } else if (targetDay < localDay || (targetDay >= 28 && localDay === 1)) {
        dayRel = 'Yesterday';
      }

      if (city.tz === 'local') {
        offsetStr = 'LOCAL TIME';
      } else {
        const sign = diffHours >= 0 ? '+' : '-';
        const absDiff = Math.abs(diffHours);
        const hoursPart = Math.floor(absDiff);
        const minPart = Math.round((absDiff - hoursPart) * 60);
        const hoursFormatted =
          minPart > 0 ? `${hoursPart}:${String(minPart).padStart(2, '0')}` : `${hoursPart}`;
        offsetStr = `${dayRel}, ${sign}${hoursFormatted} HRS`;
      }

      dateStr = cityDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      timeStr = '--:--:--';
      offsetStr = 'ERROR';
      dateStr = '';
    }

    return { timeStr, dateStr, offsetStr };
  }

  function formatMacStopwatch(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }

  function startMacStopwatch() {
    unlockAudioContext();
    if (state.macApp.swRunning) return;
    state.macApp.swRunning = true;
    state.macApp.swStartTime = performance.now() - state.macApp.swElapsedMs;
    if (macStopwatchInterval) clearInterval(macStopwatchInterval);
    macStopwatchInterval = setInterval(() => {
      state.macApp.swElapsedMs = performance.now() - state.macApp.swStartTime;
      const el = document.getElementById('mac-sw-display');
      if (el) el.textContent = formatMacStopwatch(state.macApp.swElapsedMs);
    }, 40);
    renderModals();
  }

  function pauseMacStopwatch() {
    state.macApp.swRunning = false;
    if (macStopwatchInterval) {
      clearInterval(macStopwatchInterval);
      macStopwatchInterval = null;
    }
    renderModals();
  }

  function resetMacStopwatch() {
    pauseMacStopwatch();
    state.macApp.swElapsedMs = 0;
    state.macApp.swLaps = [];
    renderModals();
  }

  function lapMacStopwatch() {
    const totalMs = state.macApp.swElapsedMs;
    const lastTotal = state.macApp.swLaps.length > 0 ? state.macApp.swLaps[0].totalMs : 0;
    const splitMs = totalMs - lastTotal;
    state.macApp.swLaps.unshift({
      lapNumber: state.macApp.swLaps.length + 1,
      splitMs,
      totalMs,
    });
    renderModals();
  }

  function startMacTimer() {
    unlockAudioContext();
    if (state.macApp.timerRunning) return;
    state.macApp.timerRunning = true;
    if (macTimerInterval) clearInterval(macTimerInterval);
    macTimerInterval = setInterval(() => {
      if (state.macApp.timerRemainingSec <= 1) {
        state.macApp.timerRemainingSec = 0;
        pauseMacTimer();
        playCompletionChime();
        renderModals();
        return;
      }
      state.macApp.timerRemainingSec -= 1;
      const timeEl = document.getElementById('mac-timer-display');
      if (timeEl) {
        const m = Math.floor(state.macApp.timerRemainingSec / 60);
        const s = state.macApp.timerRemainingSec % 60;
        timeEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      const ringEl = document.getElementById('mac-timer-progress-ring');
      if (ringEl && state.macApp.timerTotalSec > 0) {
        const circ = 2 * Math.PI * 100;
        const progress = state.macApp.timerRemainingSec / state.macApp.timerTotalSec;
        ringEl.style.strokeDashoffset = `${circ * (1 - progress)}`;
      }
    }, 1000);
    renderModals();
  }

  function pauseMacTimer() {
    state.macApp.timerRunning = false;
    if (macTimerInterval) {
      clearInterval(macTimerInterval);
      macTimerInterval = null;
    }
    renderModals();
  }

  function resetMacTimer() {
    pauseMacTimer();
    state.macApp.timerRemainingSec = state.macApp.timerTotalSec;
    renderModals();
  }

  function adjustMacTimer(deltaSec) {
    unlockAudioContext();
    const next = Math.max(60, state.macApp.timerRemainingSec + deltaSec);
    state.macApp.timerRemainingSec = next;
    state.macApp.timerTotalSec = Math.max(state.macApp.timerTotalSec, next);
    renderModals();
  }

  function setMacTimerPreset(sec) {
    unlockAudioContext();
    pauseMacTimer();
    state.macApp.timerTotalSec = sec;
    state.macApp.timerRemainingSec = sec;
    renderModals();
  }

  function renderMarkdown(content, noteId) {
    if (!content) {
      return `<p class="text-zinc-400 italic">Empty note...</p>`;
    }

    const lines = content.split('\n');
    let out = '';
    let inCode = false;
    let codeBuffer = [];
    let codeLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeLang = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCode = false;
          const codeText = codeBuffer.join('\n');
          out += `
            <div class="relative group/code my-2 rounded-xl bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 p-3 text-zinc-100 font-mono text-xs overflow-x-auto">
              <div class="flex items-center justify-between pb-1 mb-2 border-b border-zinc-800 text-[10px] text-zinc-500">
                <span>${escapeHtml(codeLang || 'text')}</span>
                <button type="button" class="copy-markdown-code-btn px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer" data-code="${escapeHtml(codeText)}">Copy</button>
              </div>
              <pre class="whitespace-pre overflow-x-auto"><code>${escapeHtml(codeText)}</code></pre>
            </div>
          `;
          codeBuffer = [];
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
        continue;
      }

      // Checkbox list item: "- [ ] " or "- [x] "
      const taskMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (taskMatch) {
        const isChecked = taskMatch[2].toLowerCase() === 'x';
        const taskText = taskMatch[3];
        out += `
          <div class="flex items-start gap-2.5 my-1 text-sm ${isChecked ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}">
            <input
              type="checkbox"
              class="mac-note-checkbox mt-1 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-600 focus:ring-amber-500 cursor-pointer"
              data-note-id="${noteId}"
              data-line-index="${i}"
              ${isChecked ? 'checked' : ''}
            />
            <span class="flex-1">${inlineMarkdown(taskText)}</span>
          </div>
        `;
        continue;
      }

      // Bullet list item
      if (line.match(/^(\s*)[-*]\s+(.*)$/)) {
        const text = line.replace(/^(\s*)[-*]\s+/, '');
        out += `<div class="flex items-start gap-2 my-0.5 text-sm text-zinc-800 dark:text-zinc-200"><span class="text-zinc-400 mt-1">&bull;</span><span class="flex-1">${inlineMarkdown(text)}</span></div>`;
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        out += `<h3 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-3 mb-1">${inlineMarkdown(line.slice(4))}</h3>`;
        continue;
      }
      if (line.startsWith('## ')) {
        out += `<h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-1.5">${inlineMarkdown(line.slice(3))}</h2>`;
        continue;
      }
      if (line.startsWith('# ')) {
        out += `<h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2">${inlineMarkdown(line.slice(2))}</h1>`;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        out += `<blockquote class="border-l-2 border-amber-500/60 pl-3 py-0.5 my-1.5 italic text-sm text-zinc-600 dark:text-zinc-400">${inlineMarkdown(line.slice(2))}</blockquote>`;
        continue;
      }

      if (!line.trim()) {
        out += `<div class="h-2"></div>`;
        continue;
      }

      out += `<p class="my-1 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">${inlineMarkdown(line)}</p>`;
    }

    if (inCode) {
      out += `<pre class="p-3 my-2 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`;
    }

    return out;
  }

  function inlineMarkdown(text) {
    if (!text) return '';
    let t = escapeHtml(text);
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
    t = t.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    t = t.replace(/(^|\s)(#[a-zA-Z0-9_-]+)/g, '$1<span class="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium text-xs">$2</span>');
    t = t.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline inline-flex items-center gap-0.5">$1</a>');
    return t;
  }

  function toggleNoteMarkdownCheckbox(noteId, lineIndex, isChecked) {
    const notes = state.data?.notes;
    if (!Array.isArray(notes)) return;
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const lines = (note.content || '').split('\n');
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    if (isChecked) {
      lines[lineIndex] = line.replace(/^(\s*[-*]\s+)\[\s*\]/, '$1[x]');
    } else {
      lines[lineIndex] = line.replace(/^(\s*[-*]\s+)\[[xX]\]/, '$1[ ]');
    }

    note.content = lines.join('\n');
    note.updatedAt = new Date().toISOString();
    commitSave();
    renderModals();
  }

  function renderMacClockAppHtml() {
    const now = state.now || new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourAngle = ((hours % 12) + minutes / 60) * 30;
    const minuteAngle = (minutes + seconds / 60) * 6;
    const secondAngle = seconds * 6;

    const digitalTimeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const dateFullStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Sub-tab Navigation
    const navBarHtml = `
      <div class="h-11 px-3 sm:px-4 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-1 p-0.5 bg-zinc-200/60 dark:bg-zinc-800/80 rounded-xl text-xs">
          <button
            type="button"
            id="mac-clock-subtab-world"
            class="px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              state.macApp.clockSubTab === 'world'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }"
          >
            World Clock
          </button>
          <button
            type="button"
            id="mac-clock-subtab-stopwatch"
            class="px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              state.macApp.clockSubTab === 'stopwatch'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }"
          >
            Stopwatch
          </button>
          <button
            type="button"
            id="mac-clock-subtab-timer"
            class="px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              state.macApp.clockSubTab === 'timer'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }"
          >
            Focus Timer
          </button>
        </div>

        <div class="text-[11px] font-mono text-zinc-400 hidden sm:block">
          ${digitalTimeStr}
        </div>
      </div>
    `;

    // View 1: World Clock
    let viewContentHtml = '';
    if (state.macApp.clockSubTab === 'world') {
      const availableToAdd = MAC_AVAILABLE_CITIES.filter(
        (c) => !state.macApp.worldCities.some((item) => item.id === c.id)
      );

      let citiesCardsHtml = '';
      for (const city of state.macApp.worldCities) {
        const info = getCityTimeInfo(city, now);
        citiesCardsHtml += `
          <div class="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-3 group">
            <div class="min-w-0">
              <div class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                ${escapeHtml(city.name)}
              </div>
              <div class="text-[10px] font-mono text-zinc-400 mt-0.5">
                ${info.offsetStr}
              </div>
              <div class="text-[10px] text-zinc-500 dark:text-zinc-400">
                ${info.dateStr}
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span class="text-base sm:text-lg font-light font-mono tabular-nums text-zinc-900 dark:text-zinc-50">
                ${info.timeStr}
              </span>
              ${
                city.id !== 'local'
                  ? `
                <button
                  type="button"
                  data-remove-mac-city="${city.id}"
                  class="remove-mac-city-btn p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remove city"
                >
                  ${ICONS.trash2('w-3.5 h-3.5')}
                </button>
              `
                  : `<div class="w-6"></div>`
              }
            </div>
          </div>
        `;
      }

      viewContentHtml = `
        <div class="p-4 sm:p-6 overflow-y-auto h-[calc(100%-2.75rem)] space-y-6">
          <!-- Featured Main Clock -->
          <div class="flex flex-col sm:flex-row items-center gap-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-850/80 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <div class="w-32 h-32 shrink-0 relative">
              <svg class="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" class="fill-zinc-900 stroke-zinc-700/80" stroke-width="2"/>
                ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
                  .map(
                    (deg) => `
                  <line x1="50" y1="9" x2="50" y2="${deg % 90 === 0 ? 16 : 13}" stroke="${deg % 90 === 0 ? '#f4f4f5' : '#71717a'}" stroke-width="${deg % 90 === 0 ? 3 : 1.75}" stroke-linecap="round" transform="rotate(${deg} 50 50)"/>
                `
                  )
                  .join('')}
                <line x1="50" y1="50" x2="50" y2="25" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" transform="rotate(${hourAngle} 50 50)"/>
                <line x1="50" y1="50" x2="50" y2="15" stroke="#e4e4e7" stroke-width="2.5" stroke-linecap="round" transform="rotate(${minuteAngle} 50 50)"/>
                <line x1="50" y1="58" x2="50" y2="12" stroke="#f97316" stroke-width="1.5" stroke-linecap="round" transform="rotate(${secondAngle} 50 50)"/>
                <circle cx="50" cy="50" r="3" fill="#f97316" stroke="#09090b" stroke-width="1"/>
              </svg>
            </div>

            <div class="space-y-1 text-center sm:text-left">
              <div class="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
                Local Time
              </div>
              <div class="text-3xl sm:text-4xl font-light font-mono tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
                ${digitalTimeStr}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">
                ${dateFullStr}
              </div>
            </div>
          </div>

          <!-- World Cities Grid Header -->
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                ${ICONS.globe('w-4 h-4 text-zinc-400')}
                <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Global Clocks (${state.macApp.worldCities.length})
                </h3>
              </div>

              <div class="relative">
                <button
                  type="button"
                  id="mac-clock-toggle-add-btn"
                  class="flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs cursor-pointer"
                >
                  ${ICONS.plus('w-3.5 h-3.5')}
                  <span>Add City</span>
                </button>

                ${
                  state.macApp.isAddCityOpen
                    ? `
                  <div
                    id="mac-add-city-popover"
                    class="absolute right-0 top-full mt-1.5 z-50 w-56 rounded-2xl bg-white dark:bg-zinc-900 p-1.5 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div class="max-h-56 overflow-y-auto space-y-0.5 py-1">
                      ${availableToAdd
                        .map((c) => {
                          const cInfo = getCityTimeInfo(c, now);
                          return `
                          <button
                            type="button"
                            data-add-mac-city="${c.id}"
                            class="add-mac-city-btn w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <span class="font-medium">${escapeHtml(c.name)}</span>
                            <span class="text-[10px] text-zinc-400 font-mono">${cInfo.timeStr.slice(0, 5)}</span>
                          </button>
                        `;
                        })
                        .join('')}
                      ${
                        availableToAdd.length === 0
                          ? `<div class="text-center py-2.5 text-xs text-zinc-400">All cities added</div>`
                          : ''
                      }
                    </div>
                  </div>
                `
                    : ''
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              ${citiesCardsHtml}
            </div>
          </div>
        </div>
      `;
    } else if (state.macApp.clockSubTab === 'stopwatch') {
      // View 2: Stopwatch
      const formattedSw = formatMacStopwatch(state.macApp.swElapsedMs);

      let minSplit = Infinity;
      let maxSplit = -Infinity;
      if (state.macApp.swLaps.length >= 2) {
        for (const l of state.macApp.swLaps) {
          if (l.splitMs < minSplit) minSplit = l.splitMs;
          if (l.splitMs > maxSplit) maxSplit = l.splitMs;
        }
      }

      let lapsHtml = '';
      for (const lap of state.macApp.swLaps) {
        let highlightClass = 'text-zinc-700 dark:text-zinc-300';
        let badgeHtml = '';
        if (state.macApp.swLaps.length >= 2 && minSplit < maxSplit) {
          if (lap.splitMs === minSplit) {
            highlightClass = 'text-emerald-600 dark:text-emerald-400 font-semibold';
            badgeHtml = `<span class="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase">Fastest</span>`;
          } else if (lap.splitMs === maxSplit) {
            highlightClass = 'text-rose-600 dark:text-rose-400 font-semibold';
            badgeHtml = `<span class="px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] uppercase">Slowest</span>`;
          }
        }

        lapsHtml += `
          <tr class="border-b border-zinc-100 dark:border-zinc-800 text-xs">
            <td class="py-2.5 px-3 font-mono text-zinc-400">Lap ${lap.lapNumber}</td>
            <td class="py-2.5 px-3 font-mono ${highlightClass}">
              <div class="flex items-center gap-1.5">
                <span>+${formatMacStopwatch(lap.splitMs)}</span>
                ${badgeHtml}
              </div>
            </td>
            <td class="py-2.5 px-3 font-mono text-zinc-900 dark:text-zinc-100 text-right">
              ${formatMacStopwatch(lap.totalMs)}
            </td>
          </tr>
        `;
      }

      viewContentHtml = `
        <div class="p-4 sm:p-6 overflow-y-auto h-[calc(100%-2.75rem)] flex flex-col items-center justify-start space-y-6">
          <div class="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-850/90 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center space-y-6">
            <div id="mac-sw-display" class="text-4xl sm:text-6xl font-light font-mono tracking-tight text-zinc-900 dark:text-zinc-50 tabular-nums">
              ${formattedSw}
            </div>

            <div class="flex items-center gap-3">
              ${
                !state.macApp.swRunning
                  ? `
                <button
                  type="button"
                  id="mac-sw-start-btn"
                  class="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  ${ICONS.play('w-3.5 h-3.5 fill-current')}
                  <span>Start</span>
                </button>
              `
                  : `
                <button
                  type="button"
                  id="mac-sw-pause-btn"
                  class="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  ${ICONS.pause('w-3.5 h-3.5 fill-current')}
                  <span>Pause</span>
                </button>
              `
              }

              <button
                type="button"
                id="mac-sw-lap-btn"
                ${!state.macApp.swRunning ? 'disabled' : ''}
                class="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1.5"
              >
                ${ICONS.flag('w-3.5 h-3.5')}
                <span>Lap</span>
              </button>

              <button
                type="button"
                id="mac-sw-reset-btn"
                ${state.macApp.swElapsedMs === 0 && !state.macApp.swRunning ? 'disabled' : ''}
                class="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1.5"
              >
                ${ICONS.rotateCcw('w-3.5 h-3.5')}
                <span>Reset</span>
              </button>
            </div>
          </div>

          ${
            state.macApp.swLaps.length > 0
              ? `
            <div class="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-850/90 border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div class="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Laps Recorded (${state.macApp.swLaps.length})
                </span>
                <button
                  type="button"
                  id="mac-sw-copy-laps-btn"
                  class="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  ${ICONS.copy('w-3 h-3')}
                  <span>Copy Laps</span>
                </button>
              </div>
              <div class="max-h-60 overflow-y-auto">
                <table class="w-full text-left">
                  <tbody>
                    ${lapsHtml}
                  </tbody>
                </table>
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
    } else {
      // View 3: Focus Countdown Timer
      const remainingSec = state.macApp.timerRemainingSec;
      const totalSec = state.macApp.timerTotalSec || 25 * 60;
      const m = Math.floor(remainingSec / 60);
      const s = remainingSec % 60;
      const formattedTimer = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const circ = 2 * Math.PI * 100;
      const progress = totalSec > 0 ? remainingSec / totalSec : 0;
      const dashOffset = circ * (1 - progress);

      viewContentHtml = `
        <div class="p-4 sm:p-6 overflow-y-auto h-[calc(100%-2.75rem)] flex flex-col items-center justify-center space-y-6">
          <div class="relative w-64 h-64 flex items-center justify-center">
            <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
              <circle
                cx="120"
                cy="120"
                r="100"
                class="stroke-zinc-200 dark:stroke-zinc-800"
                stroke-width="8"
                fill="none"
              />
              <circle
                id="mac-timer-progress-ring"
                cx="120"
                cy="120"
                r="100"
                class="stroke-orange-500 transition-all duration-300"
                stroke-width="8"
                stroke-linecap="round"
                fill="none"
                stroke-dasharray="${circ}"
                stroke-dashoffset="${dashOffset}"
              />
            </svg>

            <div class="absolute inset-0 flex flex-col items-center justify-center space-y-1 select-none">
              <div id="mac-timer-display" class="text-4xl sm:text-5xl font-light font-mono text-zinc-900 dark:text-zinc-50 tracking-tight tabular-nums">
                ${formattedTimer}
              </div>
              <div class="text-[11px] text-zinc-400 font-mono">
                ${Math.round(totalSec / 60)} min session
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap justify-center">
            <button type="button" data-timer-preset="900" class="mac-timer-preset-btn px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-orange-500/50 transition-colors shadow-2xs cursor-pointer">
              15m
            </button>
            <button type="button" data-timer-preset="1500" class="mac-timer-preset-btn px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-orange-500/50 transition-colors shadow-2xs cursor-pointer">
              25m Pomodoro
            </button>
            <button type="button" data-timer-preset="2700" class="mac-timer-preset-btn px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-orange-500/50 transition-colors shadow-2xs cursor-pointer">
              45m
            </button>
            <button type="button" data-timer-preset="3600" class="mac-timer-preset-btn px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 hover:border-orange-500/50 transition-colors shadow-2xs cursor-pointer">
              60m
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button type="button" data-timer-delta="-300" class="mac-timer-delta-btn px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
              -5m
            </button>
            <button type="button" data-timer-delta="-60" class="mac-timer-delta-btn px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
              -1m
            </button>
            <button type="button" data-timer-delta="60" class="mac-timer-delta-btn px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
              +1m
            </button>
            <button type="button" data-timer-delta="300" class="mac-timer-delta-btn px-2.5 py-1 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
              +5m
            </button>
          </div>

          <div class="flex items-center gap-3">
            ${
              !state.macApp.timerRunning
                ? `
              <button
                type="button"
                id="mac-timer-start-btn"
                class="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                ${ICONS.play('w-3.5 h-3.5 fill-current')}
                <span>Start Focus</span>
              </button>
            `
                : `
              <button
                type="button"
                id="mac-timer-pause-btn"
                class="px-6 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                ${ICONS.pause('w-3.5 h-3.5 fill-current')}
                <span>Pause</span>
              </button>
            `
            }

            <button
              type="button"
              id="mac-timer-reset-btn"
              class="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              ${ICONS.rotateCcw('w-3.5 h-3.5')}
              <span>Reset</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="h-full flex flex-col bg-zinc-50/30 dark:bg-zinc-900/60">
        ${navBarHtml}
        ${viewContentHtml}
      </div>
    `;
  }

  function renderMacNotesAppHtml() {
    const rawNotes = state.data?.notes || [];
    const notesCount = rawNotes.filter((n) => n.type === 'note').length;
    const ideasCount = rawNotes.filter((n) => n.type === 'idea').length;
    const pinnedCount = rawNotes.filter((n) => n.pinned).length;

    const allTagsSet = new Set();
    for (const n of rawNotes) {
      if (Array.isArray(n.tags)) {
        for (const t of n.tags) {
          if (t.trim()) allTagsSet.add(t.trim());
        }
      }
    }
    const allTags = Array.from(allTagsSet).sort();

    const q = (state.macApp.noteSearchQuery || '').toLowerCase().trim();
    let filtered = rawNotes.filter((n) => {
      if (state.macApp.noteFilter === 'note' && n.type !== 'note') return false;
      if (state.macApp.noteFilter === 'idea' && n.type !== 'idea') return false;
      if (state.macApp.noteFilter === 'pinned' && !n.pinned) return false;
      if (state.macApp.selectedTag && (!Array.isArray(n.tags) || !n.tags.includes(state.macApp.selectedTag)))
        return false;
      if (q) {
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        const contentMatch = (n.content || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    let activeNote = filtered.find((n) => n.id === state.macApp.selectedNoteId);
    if (!activeNote && filtered.length > 0) {
      activeNote = filtered[0];
      state.macApp.selectedNoteId = activeNote.id;
    }

    let noteCardsHtml = '';
    for (const n of filtered) {
      const isSelected = activeNote && activeNote.id === n.id;
      const isIdea = n.type === 'idea';
      const snippet = (n.content || '').split('\n').slice(0, 2).join(' ').trim();
      const updatedDate = new Date(n.updatedAt);
      const timeFormatted = updatedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      noteCardsHtml += `
        <div
          data-select-note="${n.id}"
          class="note-list-card p-3 rounded-2xl border transition-all cursor-pointer text-left relative group ${
            isSelected
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400/80 dark:border-amber-500/50 shadow-xs'
              : 'bg-white dark:bg-zinc-850/70 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }"
        >
          <div class="flex items-center justify-between gap-1.5 mb-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-semibold ${
                isIdea
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-zinc-200/70 dark:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300'
              }">
                ${isIdea ? ICONS.lightbulb('w-2.5 h-2.5') : ICONS.fileText('w-2.5 h-2.5')}
                <span>${isIdea ? 'Idea' : 'Note'}</span>
              </span>
              <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                ${escapeHtml(n.title || 'Untitled')}
              </span>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-toggle-pin-note="${n.id}"
                class="p-1 rounded text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer ${n.pinned ? 'text-amber-500' : 'opacity-0 group-hover:opacity-100'}"
                title="${n.pinned ? 'Unpin' : 'Pin'}"
              >
                ${ICONS.pin('w-3 h-3 fill-current')}
              </button>
              <button
                type="button"
                data-delete-note="${n.id}"
                class="p-1 rounded text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Delete note"
              >
                ${ICONS.trash2('w-3 h-3')}
              </button>
            </div>
          </div>

          <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2 font-normal">
            ${escapeHtml(snippet || 'No content')}
          </p>

          <div class="flex items-center justify-between gap-2 text-[10px] text-zinc-400">
            <span class="font-mono">${timeFormatted}</span>
            ${
              Array.isArray(n.tags) && n.tags.length > 0
                ? `
              <div class="flex items-center gap-1 overflow-hidden">
                ${n.tags
                  .slice(0, 2)
                  .map(
                    (tag) => `
                  <span class="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 truncate max-w-[60px]">
                    #${escapeHtml(tag)}
                  </span>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;
    }

    if (filtered.length === 0) {
      noteCardsHtml = `
        <div class="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500 space-y-2">
          <div>No notes or ideas found</div>
          <div class="text-[11px] text-zinc-400">Click below to create one</div>
        </div>
      `;
    }

    let editorHtml = '';
    if (activeNote) {
      const isIdea = activeNote.type === 'idea';
      const activeTags = activeNote.tags || [];

      editorHtml = `
        <div class="h-full flex flex-col bg-white dark:bg-zinc-900">
          <div class="h-12 px-3 sm:px-4 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                id="mac-notes-back-to-list-btn"
                class="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                title="Back to notes list"
              >
                ${ICONS.chevronLeft('w-4 h-4')}
              </button>

              <input
                type="text"
                id="mac-note-title-input"
                value="${escapeHtml(activeNote.title || '')}"
                placeholder="Note or Idea Title..."
                class="flex-1 text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent outline-none placeholder:text-zinc-400 truncate"
              />
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                id="mac-note-toggle-type-btn"
                class="px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Toggle between Note and Idea"
              >
                ${isIdea ? ICONS.lightbulb('w-3.5 h-3.5 text-amber-500') : ICONS.fileText('w-3.5 h-3.5 text-zinc-400')}
                <span class="hidden sm:inline">${isIdea ? 'Idea' : 'Note'}</span>
              </button>

              <button
                type="button"
                id="mac-note-toggle-pin-btn"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${activeNote.pinned ? 'text-amber-500' : ''}"
                title="${activeNote.pinned ? 'Unpin Note' : 'Pin Note'}"
              >
                ${ICONS.pin('w-3.5 h-3.5 fill-current')}
              </button>

              <button
                type="button"
                id="mac-note-add-todo-btn"
                class="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 flex items-center gap-1 transition-opacity shadow-2xs cursor-pointer"
                title="Add as a task to today's To-Dos"
              >
                ${state.macApp.addedTodoFlash ? ICONS.check('w-3.5 h-3.5 text-emerald-400') : ICONS.plus('w-3.5 h-3.5')}
                <span class="hidden sm:inline">${state.macApp.addedTodoFlash ? 'Added!' : 'Add to To-Dos'}</span>
              </button>

              <button
                type="button"
                id="mac-note-copy-btn"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Copy Note Content"
              >
                ${ICONS.copy('w-3.5 h-3.5')}
              </button>

              <button
                type="button"
                id="mac-note-download-btn"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Download as .md file"
              >
                ${ICONS.download('w-3.5 h-3.5')}
              </button>

              <button
                type="button"
                id="mac-note-delete-btn"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Delete note"
              >
                ${ICONS.trash2('w-3.5 h-3.5')}
              </button>

              <div class="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg ml-1">
                <button
                  type="button"
                  id="mac-note-mode-edit"
                  class="px-2 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                    state.macApp.editMode === 'edit'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }"
                >
                  Edit
                </button>
                <button
                  type="button"
                  id="mac-note-mode-preview"
                  class="px-2 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                    state.macApp.editMode === 'preview'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }"
                >
                  Preview
                </button>
              </div>
            </div>
          </div>

          <div class="px-3 sm:px-4 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-950/20 flex items-center gap-1.5 flex-wrap shrink-0">
            ${ICONS.tag('w-3 h-3 text-zinc-400 shrink-0')}
            ${activeTags
              .map(
                (tag) => `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
                <span>#${escapeHtml(tag)}</span>
                <button type="button" data-delete-tag="${escapeHtml(tag)}" class="delete-tag-btn hover:text-rose-500 cursor-pointer">
                  ${ICONS.x('w-2.5 h-2.5')}
                </button>
              </span>
            `
              )
              .join('')}

            <input
              type="text"
              id="mac-note-tag-input"
              placeholder="+ Add tag (Enter)"
              class="text-xs bg-transparent text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 outline-none w-28"
            />
          </div>

          <div class="flex-1 flex flex-col overflow-hidden relative">
            ${
              state.macApp.editMode === 'edit'
                ? `
              <div class="px-3 sm:px-4 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center gap-1 flex-wrap shrink-0 text-xs">
                <button type="button" data-md-action="bold" class="mac-toolbar-btn p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer" title="Bold (**text**)">
                  ${ICONS.bold('w-3.5 h-3.5')}
                </button>
                <button type="button" data-md-action="italic" class="mac-toolbar-btn p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer" title="Italic (*text*)">
                  ${ICONS.italic('w-3.5 h-3.5')}
                </button>
                <button type="button" data-md-action="heading" class="mac-toolbar-btn p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer" title="Heading (###)">
                  ${ICONS.heading('w-3.5 h-3.5')}
                </button>
                <button type="button" data-md-action="list" class="mac-toolbar-btn p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer" title="Bullet List (- item)">
                  ${ICONS.listPlus('w-3.5 h-3.5')}
                </button>
                <button type="button" data-md-action="task" class="mac-toolbar-btn p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer" title="Task List (- [ ] task)">
                  ${ICONS.checkSquare('w-3.5 h-3.5')}
                </button>
                <button type="button" data-md-action="code" class="mac-toolbar-btn p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer" title="Code Block">
                  ${ICONS.code('w-3.5 h-3.5')}
                </button>
                <button type="button" data-md-action="quote" class="mac-toolbar-btn p-1 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer" title="Quote (> quote)">
                  ${ICONS.quote('w-3.5 h-3.5')}
                </button>
              </div>

              <textarea
                id="mac-note-textarea"
                placeholder="Write your note, idea, or markdown checklist (- [ ] task)..."
                class="flex-1 w-full p-4 text-sm text-zinc-900 dark:text-zinc-100 bg-transparent outline-none resize-none font-sans leading-relaxed"
              >${escapeHtml(activeNote.content || '')}</textarea>
            `
                : `
              <div class="mac-notes-preview flex-1 w-full p-4 sm:p-6 overflow-y-auto">
                ${renderMarkdown(activeNote.content, activeNote.id)}
              </div>
            `
            }
          </div>
        </div>
      `;
    } else {
      editorHtml = `
        <div class="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-600 space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            ${ICONS.lightbulb('w-6 h-6')}
          </div>
          <div>
            <div class="text-sm font-medium text-zinc-700 dark:text-zinc-300">No Note Selected</div>
            <div class="text-xs text-zinc-400">Select a note from the left or create a new one</div>
          </div>
          <button
            type="button"
            id="mac-notes-create-first-btn"
            class="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold shadow-md hover:bg-orange-600 transition-colors cursor-pointer"
          >
            Create Note
          </button>
        </div>
      `;
    }

    const isMobileListVisible = state.macApp.mobileView === 'list';

    return `
      <div class="h-full flex overflow-hidden">
        <div class="w-full md:w-72 lg:w-80 border-r border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex flex-col shrink-0 ${
          isMobileListVisible ? 'flex' : 'hidden md:flex'
        }">
          <div class="p-3 border-b border-zinc-200/80 dark:border-zinc-800 space-y-2.5 shrink-0">
            <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
              ${ICONS.search('w-3.5 h-3.5 text-zinc-400 shrink-0')}
              <input
                type="text"
                id="mac-notes-search-input"
                value="${escapeHtml(state.macApp.noteSearchQuery || '')}"
                placeholder="Search notes & tags..."
                class="flex-1 bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
              ${
                state.macApp.noteSearchQuery
                  ? `
                <button type="button" id="mac-notes-clear-search-btn" class="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                  ${ICONS.x('w-3 h-3')}
                </button>
              `
                  : ''
              }
            </div>

            <div class="grid grid-cols-4 gap-1 p-0.5 bg-zinc-200/60 dark:bg-zinc-800/80 rounded-xl text-[11px] font-medium text-center">
              <button
                type="button"
                data-note-filter="all"
                class="mac-filter-tab-btn py-1 rounded-lg transition-all cursor-pointer ${
                  state.macApp.noteFilter === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }"
              >
                All (${rawNotes.length})
              </button>
              <button
                type="button"
                data-note-filter="note"
                class="mac-filter-tab-btn py-1 rounded-lg transition-all cursor-pointer ${
                  state.macApp.noteFilter === 'note'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }"
              >
                Notes (${notesCount})
              </button>
              <button
                type="button"
                data-note-filter="idea"
                class="mac-filter-tab-btn py-1 rounded-lg transition-all cursor-pointer ${
                  state.macApp.noteFilter === 'idea'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }"
              >
                Ideas (${ideasCount})
              </button>
              <button
                type="button"
                data-note-filter="pinned"
                class="mac-filter-tab-btn py-1 rounded-lg transition-all cursor-pointer ${
                  state.macApp.noteFilter === 'pinned'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }"
              >
                Pinned (${pinnedCount})
              </button>
            </div>

            ${
              allTags.length > 0
                ? `
              <div class="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar text-[11px]">
                <button
                  type="button"
                  data-tag-filter=""
                  class="mac-tag-pill-btn px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer ${
                    !state.macApp.selectedTag
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900'
                  }"
                >
                  All Tags
                </button>
                ${allTags
                  .map(
                    (tag) => `
                  <button
                    type="button"
                    data-tag-filter="${escapeHtml(tag)}"
                    class="mac-tag-pill-btn px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer ${
                      state.macApp.selectedTag === tag
                        ? 'bg-amber-500 text-white font-semibold'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900'
                    }"
                  >
                    #${escapeHtml(tag)}
                  </button>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="mac-notes-new-note-btn"
                class="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
              >
                ${ICONS.plus('w-3.5 h-3.5')}
                <span>New Note</span>
              </button>
              <button
                type="button"
                id="mac-notes-new-idea-btn"
                class="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
              >
                ${ICONS.lightbulb('w-3.5 h-3.5')}
                <span>New Idea</span>
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            ${noteCardsHtml}
          </div>
        </div>

        <div class="flex-1 overflow-hidden ${isMobileListVisible ? 'hidden md:flex' : 'flex'} flex-col">
          ${editorHtml}
        </div>
      </div>
    `;
  }

  function renderMacAppWindowHtml() {
    if (!state.macApp.isOpen) return '';

    const notesCount = (state.data?.notes || []).length;

    return `
      ${
        state.macApp.isMinimized
          ? `
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div class="flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-900/90 dark:bg-zinc-800/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl text-white">
            <button
              type="button"
              id="mac-dock-clock-btn"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                state.macApp.activeApp === 'clock'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'hover:bg-white/10 text-zinc-300'
              }"
            >
              <div class="w-5 h-5 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                ${ICONS.timer('w-3.5 h-3.5')}
              </div>
              <span>Clock</span>
            </button>

            <button
              type="button"
              id="mac-dock-notes-btn"
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                state.macApp.activeApp === 'notes'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'hover:bg-white/10 text-zinc-300'
              }"
            >
              <div class="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                ${ICONS.lightbulb('w-3.5 h-3.5')}
              </div>
              <span>Notes & Ideas</span>
              <span class="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                ${notesCount}
              </span>
            </button>

            <div class="h-5 w-px bg-zinc-700 mx-1"></div>

            <button
              type="button"
              id="mac-dock-restore-btn"
              class="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Restore Window"
            >
              ${ICONS.maximize2('w-3.5 h-3.5')}
            </button>

            <button
              type="button"
              id="mac-dock-close-btn"
              class="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Close Application"
            >
              ${ICONS.x('w-3.5 h-3.5')}
            </button>
          </div>
        </div>
      `
          : ''
      }

      <div
        id="mac-window-backdrop"
        class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md transition-all duration-200 ${
          state.macApp.isMinimized ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'
        }"
      >
        <div class="absolute inset-0" id="mac-window-dismiss-overlay"></div>

        <div
          class="relative z-10 flex flex-col bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all duration-200 ${
            state.macApp.isFullscreen
              ? 'w-full h-full rounded-none inset-0 max-w-none max-h-none'
              : 'w-[96vw] max-w-6xl h-[88vh] max-h-[880px] rounded-2xl sm:rounded-3xl'
          }"
        >
          <!-- macOS Title Bar -->
          <div class="h-12 px-2 sm:px-4 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl shrink-0 select-none gap-2">
            <!-- Traffic Lights -->
            <div class="flex items-center gap-2 group/traffic shrink-0">
              <button
                type="button"
                id="mac-traffic-close"
                aria-label="Close"
                title="Close (Esc)"
                class="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-[#e0443e] flex items-center justify-center text-zinc-900 opacity-90 hover:opacity-100 transition-all shadow-2xs cursor-pointer"
              >
                ${ICONS.x('w-2.5 h-2.5 opacity-0 group-hover/traffic:opacity-80 transition-opacity')}
              </button>
              <button
                type="button"
                id="mac-traffic-minimize"
                aria-label="Minimize"
                title="Minimize to Dock"
                class="w-3.5 h-3.5 rounded-full bg-[#febc2e] border border-[#d89e24] flex items-center justify-center text-zinc-900 opacity-90 hover:opacity-100 transition-all shadow-2xs cursor-pointer"
              >
                ${ICONS.minus('w-2.5 h-2.5 opacity-0 group-hover/traffic:opacity-80 transition-opacity')}
              </button>
              <button
                type="button"
                id="mac-traffic-fullscreen"
                aria-label="${state.macApp.isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}"
                title="${state.macApp.isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}"
                class="w-3.5 h-3.5 rounded-full bg-[#28c840] border border-[#1aab29] flex items-center justify-center text-zinc-900 opacity-90 hover:opacity-100 transition-all shadow-2xs cursor-pointer"
              >
                ${state.macApp.isFullscreen ? ICONS.minimize2('w-2 h-2 opacity-0 group-hover/traffic:opacity-80 transition-opacity') : ICONS.maximize2('w-2 h-2 opacity-0 group-hover/traffic:opacity-80 transition-opacity')}
              </button>
            </div>

            <!-- Segmented Tab Switcher (macOS Tabs) -->
            <div class="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80 text-xs font-medium shrink-0">
              <button
                type="button"
                id="mac-tab-clock-btn"
                class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
                  state.macApp.activeApp === 'clock'
                    ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }"
              >
                <div class="w-4 h-4 rounded-md bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white shadow-2xs">
                  ${ICONS.timer('w-2.5 h-2.5 stroke-[2.5]')}
                </div>
                <span class="hidden sm:inline">Clock & Stopwatch</span>
                <span class="sm:hidden">Clock</span>
              </button>

              <button
                type="button"
                id="mac-tab-notes-btn"
                class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer ${
                  state.macApp.activeApp === 'notes'
                    ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }"
              >
                <div class="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-2xs">
                  ${ICONS.lightbulb('w-2.5 h-2.5 stroke-[2.5]')}
                </div>
                <span class="hidden sm:inline">Notes & Ideas</span>
                <span class="sm:hidden">Notes</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-zinc-500">
                  ${notesCount}
                </span>
              </button>
            </div>

            <!-- Right Utilities & Big 'X' Close Button from Sketch media_1789357477399.png -->
            <div class="flex items-center gap-1 sm:gap-2 text-xs shrink-0">
              <span class="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                <span>esc</span>
                <span>to close</span>
              </span>

              <button
                type="button"
                id="mac-window-fullscreen-btn"
                class="hidden sm:inline-flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="${state.macApp.isFullscreen ? 'Restore Window' : 'Full Screen'}"
              >
                ${state.macApp.isFullscreen ? ICONS.minimize2('w-3.5 h-3.5') : ICONS.maximize2('w-3.5 h-3.5')}
              </button>

              <button
                type="button"
                id="mac-window-close-x"
                class="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close Application Window (Esc)"
              >
                ${ICONS.x('w-3.5 h-3.5')}
              </button>
            </div>
          </div>

          <!-- Active Application Body -->
          <div class="flex-1 overflow-hidden relative">
            <div class="h-full ${state.macApp.activeApp === 'clock' ? 'block' : 'hidden'}">
              ${renderMacClockAppHtml()}
            </div>
            <div class="h-full ${state.macApp.activeApp === 'notes' ? 'block' : 'hidden'}">
              ${renderMacNotesAppHtml()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function applyMarkdownAction(action) {
    const textarea = document.getElementById('mac-note-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selectedText = value.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? replacement.length : 1;
        break;
      case 'heading':
        replacement = `### ${selectedText || 'Heading'}`;
        cursorOffset = replacement.length;
        break;
      case 'list':
        replacement = `- ${selectedText || 'List item'}`;
        cursorOffset = replacement.length;
        break;
      case 'task':
        replacement = `- [ ] ${selectedText || 'Task item'}`;
        cursorOffset = replacement.length;
        break;
      case 'quote':
        replacement = `> ${selectedText || 'Quote'}`;
        cursorOffset = replacement.length;
        break;
      case 'code':
        replacement = `\n\`\`\`javascript\n${selectedText || '// code here'}\n\`\`\`\n`;
        cursorOffset = replacement.length;
        break;
      default:
        return;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    textarea.value = newValue;

    const notes = state.data?.notes || [];
    const activeNote = notes.find((n) => n.id === state.macApp.selectedNoteId);
    if (activeNote) {
      activeNote.content = newValue;
      activeNote.updatedAt = new Date().toISOString();
      commitSave();
    }

    textarea.focus();
    textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
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
          <div class="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xl">
            <div class="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
              <div class="flex items-center gap-2">
                ${ICONS.download('w-4 h-4 text-zinc-500 dark:text-zinc-400')}
                <h2 class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Backup & Export
                </h2>
              </div>
              <div class="flex items-center gap-2">
                <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700/60">
                  ESC
                </kbd>
                <button id="close-export-btn" class="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  ${ICONS.x('w-4 h-4')}
                </button>
              </div>
            </div>

            ${
              state.importStatus.type !== 'idle'
                ? `
              <div
                class="mt-3.5 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                  state.importStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                    : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200/80 dark:border-red-800/60'
                }"
              >
                <div class="flex items-center gap-2 min-w-0">
                  ${
                    state.importStatus.type === 'success'
                      ? ICONS.check('w-3.5 h-3.5 text-emerald-500 shrink-0')
                      : ICONS.alertCircle('w-3.5 h-3.5 text-red-500 shrink-0')
                  }
                  <span class="truncate">${escapeHtml(state.importStatus.message)}</span>
                </div>
              </div>
            `
                : ''
            }

            <div class="mt-3.5 divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 overflow-hidden">
              <!-- Export Current Day -->
              <div class="p-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 min-w-0">
                  ${ICONS.fileText('w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0')}
                  <span class="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    Current Day (${state.currentId}.md)
                  </span>
                </div>
                <button
                  id="export-md-btn"
                  class="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  Export
                </button>
              </div>

              <!-- Export Full Backup JSON -->
              <div class="p-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 min-w-0">
                  ${ICONS.fileCode('w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0')}
                  <span class="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    Full System Backup (.json)
                  </span>
                </div>
                <button
                  id="export-json-btn"
                  class="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  Export
                </button>
              </div>

              <!-- Restore from Backup -->
              <div class="p-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2.5 min-w-0">
                    ${ICONS.upload('w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0')}
                    <span class="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      Restore from Backup
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <label class="cursor-pointer px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shadow-2xs">
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
                      class="px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                        state.showPaste
                          ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 hover:text-zinc-700 dark:hover:text-zinc-200'
                      }"
                    >
                      Paste
                    </button>
                  </div>
                </div>

                ${
                  state.showPaste
                    ? `
                  <div class="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 space-y-2 animate-in fade-in duration-100">
                    <textarea
                      id="paste-json-textarea"
                      placeholder="Paste JSON backup content here..."
                      rows="4"
                      class="w-full text-xs font-mono p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                    >${escapeHtml(state.pasteText)}</textarea>
                    <div class="flex items-center justify-end gap-2">
                      <button
                        id="cancel-paste-btn"
                        type="button"
                        class="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="confirm-paste-btn"
                        ${!state.pasteText.trim() ? 'disabled' : ''}
                        class="px-3 py-1 text-xs font-medium rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Confirm Restore
                      </button>
                    </div>
                  </div>
                `
                    : ''
                }
              </div>
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
          id: 'action-mac-clock',
          title: 'Open Clock & Stopwatch App',
          subtitle: 'World clocks, millisecond timer, focus splits',
          icon: 'clock',
          action: () => {
            state.isCommandOpen = false;
            openMacApp('clock');
          },
        },
        {
          id: 'action-mac-notes',
          title: 'Open Notes & Ideas App',
          subtitle: 'Daily rich notes, ideas, checkboxes & tags',
          icon: 'fileText',
          action: () => {
            state.isCommandOpen = false;
            openMacApp('notes');
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

    // 4. MacBook Application Window (Clock & Stopwatch, Notes & Ideas)
    if (state.macApp && state.macApp.isOpen) {
      html += renderMacAppWindowHtml();
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
      if (!state.isConsistencyOpen && !state.isExportOpen && !state.isCommandOpen && (!state.macApp || !state.macApp.isOpen)) {
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
        if (target && target.id === 'mac-note-tag-input') {
          target.blur();
          return;
        }

        if (state.macApp && state.macApp.isOpen) {
          if (state.macApp.isFullscreen) {
            state.macApp.isFullscreen = false;
            renderModals();
          } else {
            closeMacApp();
          }
          return;
        }

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

      // Mac Clock add city popover
      if (state.macApp && state.macApp.isAddCityOpen) {
        const popover = document.getElementById('mac-add-city-popover');
        const trigger = document.getElementById('mac-clock-toggle-add-btn');
        if (popover && !popover.contains(e.target) && trigger && !trigger.contains(e.target)) {
          state.macApp.isAddCityOpen = false;
          renderModals();
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
      if (target.closest('#cancel-paste-btn')) {
        state.showPaste = false;
        state.pasteText = '';
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
        } else if (id === 'action-mac-clock') {
          openMacApp('clock');
        } else if (id === 'action-mac-notes') {
          openMacApp('notes');
        }
        return;
      }

      // Launcher dock buttons & expand buttons
      if (target.closest('#launcher-clock-btn') || target.closest('#clock-card-expand-btn')) {
        openMacApp('clock');
        return;
      }
      if (target.closest('#launcher-notes-btn') || target.closest('#journal-card-expand-btn')) {
        openMacApp('notes');
        return;
      }

      // Mac Window Controls
      if (
        target.closest('#mac-traffic-close') ||
        target.closest('#mac-window-close-x') ||
        target.id === 'mac-window-dismiss-overlay'
      ) {
        closeMacApp();
        return;
      }
      if (target.closest('#mac-traffic-minimize')) {
        state.macApp.isMinimized = true;
        renderModals();
        return;
      }
      if (
        target.closest('#mac-traffic-fullscreen') ||
        target.closest('#mac-window-fullscreen-btn')
      ) {
        state.macApp.isFullscreen = !state.macApp.isFullscreen;
        renderModals();
        return;
      }

      // Minimized Floating Dock
      if (target.closest('#mac-dock-restore-btn')) {
        state.macApp.isMinimized = false;
        renderModals();
        return;
      }
      if (target.closest('#mac-dock-clock-btn')) {
        state.macApp.isMinimized = false;
        state.macApp.activeApp = 'clock';
        renderModals();
        return;
      }
      if (target.closest('#mac-dock-notes-btn')) {
        state.macApp.isMinimized = false;
        state.macApp.activeApp = 'notes';
        renderModals();
        return;
      }
      if (target.closest('#mac-dock-close-btn')) {
        closeMacApp();
        return;
      }

      // Mac Window App Switcher Tabs
      if (target.closest('#mac-tab-clock-btn')) {
        state.macApp.activeApp = 'clock';
        renderModals();
        return;
      }
      if (target.closest('#mac-tab-notes-btn')) {
        state.macApp.activeApp = 'notes';
        renderModals();
        return;
      }

      // Mac Clock Subtabs
      if (target.closest('#mac-clock-subtab-world')) {
        state.macApp.clockSubTab = 'world';
        renderModals();
        return;
      }
      if (target.closest('#mac-clock-subtab-stopwatch')) {
        state.macApp.clockSubTab = 'stopwatch';
        renderModals();
        return;
      }
      if (target.closest('#mac-clock-subtab-timer')) {
        state.macApp.clockSubTab = 'timer';
        renderModals();
        return;
      }

      // World Clock City Management
      if (target.closest('#mac-clock-toggle-add-btn')) {
        state.macApp.isAddCityOpen = !state.macApp.isAddCityOpen;
        renderModals();
        return;
      }
      const addMacCityBtn = target.closest('[data-add-mac-city]');
      if (addMacCityBtn) {
        const cityId = addMacCityBtn.getAttribute('data-add-mac-city');
        const cityObj = MAC_AVAILABLE_CITIES.find((c) => c.id === cityId);
        if (cityObj && !state.macApp.worldCities.some((c) => c.id === cityId)) {
          state.macApp.worldCities.push(cityObj);
          saveMacCities();
          state.macApp.isAddCityOpen = false;
          renderModals();
        }
        return;
      }
      const removeMacCityBtn = target.closest('[data-remove-mac-city]');
      if (removeMacCityBtn) {
        const cityId = removeMacCityBtn.getAttribute('data-remove-mac-city');
        state.macApp.worldCities = state.macApp.worldCities.filter((c) => c.id !== cityId);
        saveMacCities();
        renderModals();
        return;
      }

      // Stopwatch controls
      if (target.closest('#mac-sw-start-btn')) {
        startMacStopwatch();
        return;
      }
      if (target.closest('#mac-sw-pause-btn')) {
        pauseMacStopwatch();
        return;
      }
      if (target.closest('#mac-sw-lap-btn')) {
        lapMacStopwatch();
        return;
      }
      if (target.closest('#mac-sw-reset-btn')) {
        resetMacStopwatch();
        return;
      }
      if (target.closest('#mac-sw-copy-laps-btn')) {
        const lines = state.macApp.swLaps.map(
          (l) =>
            `Lap ${l.lapNumber}: +${formatMacStopwatch(l.splitMs)} (Total: ${formatMacStopwatch(l.totalMs)})`
        );
        navigator.clipboard.writeText(lines.join('\n'));
        const btn = document.getElementById('mac-sw-copy-laps-btn');
        if (btn) {
          btn.innerHTML = `${ICONS.check('w-3 h-3 text-emerald-500')} <span>Copied!</span>`;
          setTimeout(() => {
            renderModals();
          }, 1500);
        }
        return;
      }

      // Focus Timer controls
      const timerPresetBtn = target.closest('[data-timer-preset]');
      if (timerPresetBtn) {
        const sec = parseInt(timerPresetBtn.getAttribute('data-timer-preset'), 10);
        setMacTimerPreset(sec);
        return;
      }
      const timerDeltaBtn = target.closest('[data-timer-delta]');
      if (timerDeltaBtn) {
        const sec = parseInt(timerDeltaBtn.getAttribute('data-timer-delta'), 10);
        adjustMacTimer(sec);
        return;
      }
      if (target.closest('#mac-timer-start-btn')) {
        startMacTimer();
        return;
      }
      if (target.closest('#mac-timer-pause-btn')) {
        pauseMacTimer();
        return;
      }
      if (target.closest('#mac-timer-reset-btn')) {
        resetMacTimer();
        return;
      }

      // Notes Filter Tabs
      const noteFilterBtn = target.closest('[data-note-filter]');
      if (noteFilterBtn) {
        state.macApp.noteFilter = noteFilterBtn.getAttribute('data-note-filter');
        renderModals();
        return;
      }

      // Notes Tag Pills
      const tagFilterPill = target.closest('[data-tag-filter]');
      if (tagFilterPill) {
        state.macApp.selectedTag = tagFilterPill.getAttribute('data-tag-filter') || null;
        renderModals();
        return;
      }

      // Clear Search
      if (target.closest('#mac-notes-clear-search-btn')) {
        state.macApp.noteSearchQuery = '';
        renderModals();
        return;
      }

      // New Note / Idea
      if (
        target.closest('#mac-notes-new-note-btn') ||
        target.closest('#mac-notes-create-first-btn')
      ) {
        if (!Array.isArray(state.data.notes)) state.data.notes = [];
        const newNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: 'New Note',
          content: '',
          type: 'note',
          pinned: false,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.data.notes.unshift(newNote);
        state.macApp.selectedNoteId = newNote.id;
        state.macApp.editMode = 'edit';
        state.macApp.mobileView = 'detail';
        commitSave();
        renderModals();
        renderRightColumn();
        setTimeout(() => {
          const titleInput = document.getElementById('mac-note-title-input');
          if (titleInput) {
            titleInput.focus();
            titleInput.select();
          }
        }, 50);
        return;
      }

      if (target.closest('#mac-notes-new-idea-btn')) {
        if (!Array.isArray(state.data.notes)) state.data.notes = [];
        const newNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: 'New Idea',
          content: '',
          type: 'idea',
          pinned: false,
          tags: ['idea'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.data.notes.unshift(newNote);
        state.macApp.selectedNoteId = newNote.id;
        state.macApp.editMode = 'edit';
        state.macApp.mobileView = 'detail';
        commitSave();
        renderModals();
        renderRightColumn();
        setTimeout(() => {
          const titleInput = document.getElementById('mac-note-title-input');
          if (titleInput) {
            titleInput.focus();
            titleInput.select();
          }
        }, 50);
        return;
      }

      // Select Note
      const selectNoteCard = target.closest('[data-select-note]');
      if (
        selectNoteCard &&
        !target.closest('[data-toggle-pin-note]') &&
        !target.closest('[data-delete-note]')
      ) {
        state.macApp.selectedNoteId = selectNoteCard.getAttribute('data-select-note');
        state.macApp.mobileView = 'detail';
        renderModals();
        return;
      }

      // Pin Note (sidebar card or header)
      const togglePinBtn = target.closest('[data-toggle-pin-note]');
      if (togglePinBtn) {
        const noteId = togglePinBtn.getAttribute('data-toggle-pin-note');
        const note = (state.data?.notes || []).find((n) => n.id === noteId);
        if (note) {
          note.pinned = !note.pinned;
          note.updatedAt = new Date().toISOString();
          commitSave();
          renderModals();
          renderRightColumn();
        }
        return;
      }
      if (target.closest('#mac-note-toggle-pin-btn')) {
        const note = (state.data?.notes || []).find((n) => n.id === state.macApp.selectedNoteId);
        if (note) {
          note.pinned = !note.pinned;
          note.updatedAt = new Date().toISOString();
          commitSave();
          renderModals();
          renderRightColumn();
        }
        return;
      }

      // Delete Note (sidebar card or header)
      const deleteNoteCardBtn = target.closest('[data-delete-note]');
      if (deleteNoteCardBtn) {
        const noteId = deleteNoteCardBtn.getAttribute('data-delete-note');
        if (Array.isArray(state.data?.notes)) {
          state.data.notes = state.data.notes.filter((n) => n.id !== noteId);
          if (state.macApp.selectedNoteId === noteId) {
            state.macApp.selectedNoteId = state.data.notes[0]?.id || null;
          }
          commitSave();
          renderModals();
          renderRightColumn();
        }
        return;
      }
      if (target.closest('#mac-note-delete-btn')) {
        const noteId = state.macApp.selectedNoteId;
        if (noteId && Array.isArray(state.data?.notes)) {
          state.data.notes = state.data.notes.filter((n) => n.id !== noteId);
          state.macApp.selectedNoteId = state.data.notes[0]?.id || null;
          commitSave();
          renderModals();
          renderRightColumn();
        }
        return;
      }

      // Toggle Type (Note <-> Idea)
      if (target.closest('#mac-note-toggle-type-btn')) {
        const note = (state.data?.notes || []).find((n) => n.id === state.macApp.selectedNoteId);
        if (note) {
          note.type = note.type === 'idea' ? 'note' : 'idea';
          note.updatedAt = new Date().toISOString();
          commitSave();
          renderModals();
          renderRightColumn();
        }
        return;
      }

      // Add to To-Dos
      if (target.closest('#mac-note-add-todo-btn')) {
        const note = (state.data?.notes || []).find((n) => n.id === state.macApp.selectedNoteId);
        if (note) {
          const newTodo = {
            id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: note.title || 'New Task from Notes',
            completed: false,
            estimate: 15,
            tags: Array.isArray(note.tags) ? [...note.tags] : [],
            subtasks: [],
            createdAt: new Date().toISOString(),
          };
          if (!Array.isArray(state.data.todos)) state.data.todos = [];
          state.data.todos.push(newTodo);
          commitSave();
          state.macApp.addedTodoFlash = true;
          renderModals();
          renderTodoSection();
          renderLeftNavCard();
          setTimeout(() => {
            state.macApp.addedTodoFlash = false;
            renderModals();
          }, 1500);
        }
        return;
      }

      // Copy Note Content
      if (target.closest('#mac-note-copy-btn')) {
        const note = (state.data?.notes || []).find((n) => n.id === state.macApp.selectedNoteId);
        if (note) {
          navigator.clipboard.writeText(note.content || '');
          const btn = document.getElementById('mac-note-copy-btn');
          if (btn) {
            btn.innerHTML = ICONS.check('w-3.5 h-3.5 text-emerald-500');
            setTimeout(() => {
              if (btn) btn.innerHTML = ICONS.copy('w-3.5 h-3.5');
            }, 1500);
          }
        }
        return;
      }

      // Download Note as .md
      if (target.closest('#mac-note-download-btn')) {
        const note = (state.data?.notes || []).find((n) => n.id === state.macApp.selectedNoteId);
        if (note) {
          const filename = `${(note.title || 'note').replace(/[^a-z0-9_-]/gi, '_')}.md`;
          downloadFile(note.content || '', filename, 'text/markdown');
        }
        return;
      }

      // Edit / Preview Mode Switch
      if (target.closest('#mac-note-mode-edit')) {
        state.macApp.editMode = 'edit';
        renderModals();
        return;
      }
      if (target.closest('#mac-note-mode-preview')) {
        state.macApp.editMode = 'preview';
        renderModals();
        return;
      }

      // Mobile Back to List
      if (target.closest('#mac-notes-back-to-list-btn')) {
        state.macApp.mobileView = 'list';
        renderModals();
        return;
      }

      // Markdown Toolbar Actions
      const mdActionBtn = target.closest('[data-md-action]');
      if (mdActionBtn) {
        const action = mdActionBtn.getAttribute('data-md-action');
        applyMarkdownAction(action);
        return;
      }

      // Delete Tag
      const deleteTagBtn = target.closest('[data-delete-tag]');
      if (deleteTagBtn) {
        const tag = deleteTagBtn.getAttribute('data-delete-tag');
        const note = (state.data?.notes || []).find((n) => n.id === state.macApp.selectedNoteId);
        if (note && Array.isArray(note.tags)) {
          note.tags = note.tags.filter((t) => t !== tag);
          note.updatedAt = new Date().toISOString();
          commitSave();
          renderModals();
        }
        return;
      }

      // Copy code snippet in markdown preview
      const copyCodeBtn = target.closest('.copy-markdown-code-btn');
      if (copyCodeBtn) {
        const code = copyCodeBtn.getAttribute('data-code') || '';
        navigator.clipboard.writeText(code).then(() => {
          copyCodeBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyCodeBtn.textContent = 'Copy';
          }, 1500);
        });
        return;
      }

      // Interactive Checkboxes in Note Markdown Preview
      if (target.classList.contains('mac-note-checkbox')) {
        const noteId = target.getAttribute('data-note-id');
        const lineIndex = parseInt(target.getAttribute('data-line-index'), 10);
        toggleNoteMarkdownCheckbox(noteId, lineIndex, target.checked);
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

      // Mac Notes search
      if (target.id === 'mac-notes-search-input') {
        state.macApp.noteSearchQuery = target.value;
        renderModals();
        const inp = document.getElementById('mac-notes-search-input');
        if (inp) {
          inp.focus();
          inp.selectionStart = inp.selectionEnd = inp.value.length;
        }
        return;
      }

      // Mac Note title editing
      if (target.id === 'mac-note-title-input') {
        const notes = state.data?.notes || [];
        const activeNote = notes.find((n) => n.id === state.macApp.selectedNoteId);
        if (activeNote) {
          activeNote.title = target.value;
          activeNote.updatedAt = new Date().toISOString();
          commitSave();
          const cardTitle = document.querySelector(
            `.note-list-card[data-select-note="${activeNote.id}"] .truncate`
          );
          if (cardTitle) {
            cardTitle.textContent = activeNote.title || 'Untitled';
          }
        }
        return;
      }

      // Mac Note content editing
      if (target.id === 'mac-note-textarea') {
        const notes = state.data?.notes || [];
        const activeNote = notes.find((n) => n.id === state.macApp.selectedNoteId);
        if (activeNote) {
          activeNote.content = target.value;
          activeNote.updatedAt = new Date().toISOString();
          commitSave();
          const snippetEl = document.querySelector(
            `.note-list-card[data-select-note="${activeNote.id}"] p`
          );
          if (snippetEl) {
            const snippet = (activeNote.content || '').split('\n').slice(0, 2).join(' ').trim();
            snippetEl.textContent = snippet || 'No content';
          }
        }
        return;
      }
    });

    // Keydown for inline inputs
    document.addEventListener('keydown', (e) => {
      const target = e.target;

      // Mac Note Tag Input Enter / comma
      if (target.id === 'mac-note-tag-input') {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const tag = target.value.trim().replace(/^#/, '');
          if (tag) {
            const notes = state.data?.notes || [];
            const activeNote = notes.find((n) => n.id === state.macApp.selectedNoteId);
            if (activeNote) {
              if (!Array.isArray(activeNote.tags)) activeNote.tags = [];
              if (!activeNote.tags.includes(tag)) {
                activeNote.tags.push(tag);
                activeNote.updatedAt = new Date().toISOString();
                commitSave();
                renderModals();
                const nextInput = document.getElementById('mac-note-tag-input');
                if (nextInput) nextInput.focus();
              } else {
                target.value = '';
              }
            }
          }
        }
        return;
      }

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
