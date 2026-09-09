'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DayData, Priority, TodoItem, DayVitals, DayReflections } from '@/types';
import {
  getDayData,
  saveDayData,
  getDefaultDayData,
  getPreviousActiveDayData,
} from '@/lib/storage';

export function useDayData(date: string) {
  const [data, setData] = useState<DayData>(() => getDefaultDayData(date));
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dataRef = useRef<DayData>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep dataRef in sync
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Initial load from localStorage
  useEffect(() => {
    const loaded = getDayData(date);
    dataRef.current = loaded;
    setData(loaded);
    setIsLoaded(true);
    setLastSaved(new Date(loaded.updatedAt));
  }, [date]);

  // Listen for storage events (e.g., imports from backup)
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'import') {
        const loaded = getDayData(date);
        dataRef.current = loaded;
        setData(loaded);
      }
    };

    window.addEventListener('daily_tracker_data_change', handleUpdate);
    return () => {
      window.removeEventListener('daily_tracker_data_change', handleUpdate);
    };
  }, [date]);

  // Save helper
  const commitSave = useCallback((updated: DayData) => {
    setIsSaving(true);
    saveDayData(updated);
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 300);
  }, []);

  // Debounced save for text areas
  const debouncedSave = useCallback(
    (updater: (prev: DayData) => DayData) => {
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        commitSave(next);
      }, 400);
    },
    [commitSave]
  );

  // Instant mutations (for checkboxes, adds, deletes)
  const mutateImmediate = useCallback(
    (updater: (prev: DayData) => DayData) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);
      commitSave(next);
    },
    [commitSave]
  );

  // One Big Thing
  const setOneBigThing = useCallback(
    (text: string) => {
      debouncedSave((prev) => ({
        ...prev,
        oneBigThing: text,
      }));
    },
    [debouncedSave]
  );

  const toggleOneBigThing = useCallback(() => {
    mutateImmediate((prev) => ({
      ...prev,
      oneBigThingDone: !prev.oneBigThingDone,
    }));
  }, [mutateImmediate]);

  // Todos
  const addTodo = useCallback(
    (text: string, priority: Priority = 'medium', tag?: string, estimate?: string) => {
      if (!text.trim()) return;
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: text.trim(),
        completed: false,
        priority,
        tag: tag?.trim() ? tag.trim().toLowerCase() : undefined,
        estimate: estimate?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      mutateImmediate((prev) => ({
        ...prev,
        todos: [newTodo, ...prev.todos],
      }));
    },
    [mutateImmediate]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? new Date().toISOString() : undefined,
              }
            : t
        ),
      }));
    },
    [mutateImmediate]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.filter((t) => t.id !== id),
      }));
    },
    [mutateImmediate]
  );

  const updateTodo = useCallback(
    (id: string, updates: Partial<TodoItem>) => {
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [mutateImmediate]
  );

  // Habits
  const toggleHabit = useCallback(
    (id: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        habits: prev.habits.map((h) =>
          h.id === id ? { ...h, completed: !h.completed } : h
        ),
      }));
    },
    [mutateImmediate]
  );

  const addCustomHabit = useCallback(
    (title: string) => {
      if (!title.trim()) return;
      mutateImmediate((prev) => ({
        ...prev,
        habits: [
          ...prev.habits,
          {
            id: `habit-${Date.now()}`,
            title: title.trim(),
            completed: false,
          },
        ],
      }));
    },
    [mutateImmediate]
  );

  const removeHabit = useCallback(
    (id: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== id),
      }));
    },
    [mutateImmediate]
  );

  // Vitals
  const updateVitals = useCallback(
    (vitals: Partial<DayVitals>) => {
      mutateImmediate((prev) => ({
        ...prev,
        vitals: { ...prev.vitals, ...vitals },
      }));
    },
    [mutateImmediate]
  );

  // Reflections (debounced)
  const updateReflections = useCallback(
    (reflections: Partial<DayReflections>) => {
      debouncedSave((prev) => ({
        ...prev,
        reflections: { ...prev.reflections, ...reflections },
      }));
    },
    [debouncedSave]
  );

  // Rollover Unfinished tasks from previous day
  const rolloverUnfinishedTasks = useCallback(() => {
    const prevDay = getPreviousActiveDayData(date);
    if (!prevDay) return 0;

    const uncompleted = prevDay.todos.filter((t) => !t.completed);
    if (uncompleted.length === 0) return 0;

    const currentTexts = new Set(dataRef.current.todos.map((t) => t.text.toLowerCase()));
    const rolledOver = uncompleted
      .filter((t) => !currentTexts.has(t.text.toLowerCase()))
      .map((t) => ({
        ...t,
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      }));

    if (rolledOver.length > 0) {
      mutateImmediate((prev) => ({
        ...prev,
        todos: [...rolledOver, ...prev.todos],
      }));
    }

    return rolledOver.length;
  }, [date, mutateImmediate]);

  const hasPreviousUnfinishedTasks = useCallback(() => {
    const prevDay = getPreviousActiveDayData(date);
    if (!prevDay) return false;
    const currentTexts = new Set(dataRef.current.todos.map((t) => t.text.toLowerCase()));
    return prevDay.todos.some((t) => !t.completed && !currentTexts.has(t.text.toLowerCase()));
  }, [date]);

  return {
    data,
    isLoaded,
    isSaving,
    lastSaved,
    setOneBigThing,
    toggleOneBigThing,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    toggleHabit,
    addCustomHabit,
    removeHabit,
    updateVitals,
    updateReflections,
    rolloverUnfinishedTasks,
    hasPreviousUnfinishedTasks,
  };
}
