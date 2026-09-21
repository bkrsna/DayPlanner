'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WeekData, Priority, TodoItem, SubTask, NoteIdeaItem } from '@/types';
import {
  getWeekData,
  saveWeekData,
  getDefaultWeekData,
  getPreviousActiveWeekData,
} from '@/lib/storage';

export function useWeekData(week: string) {
  const [data, setData] = useState<WeekData>(() => getDefaultWeekData(week));
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const dataRef = useRef<WeekData>(data);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    const loaded = getWeekData(week);
    dataRef.current = loaded;
    setData(loaded);
    setIsLoaded(true);
    setLastSaved(new Date(loaded.updatedAt));
  }, [week]);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === 'import' || (customEvent.detail?.type === 'week' && customEvent.detail?.week === week)) {
        const loaded = getWeekData(week);
        dataRef.current = loaded;
        setData(loaded);
      }
    };

    window.addEventListener('daily_tracker_data_change', handleUpdate);
    return () => {
      window.removeEventListener('daily_tracker_data_change', handleUpdate);
    };
  }, [week]);

  const commitSave = useCallback((updated: WeekData) => {
    setIsSaving(true);
    saveWeekData(updated);
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 300);
  }, []);

  const debouncedSave = useCallback(
    (updater: (prev: WeekData) => WeekData) => {
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

  const mutateImmediate = useCallback(
    (updater: (prev: WeekData) => WeekData) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);
      commitSave(next);
    },
    [commitSave]
  );

  const addTodo = useCallback(
    (text: string, priority: Priority = 'medium', tag?: string, estimate?: string, isSpecial: boolean = false, category?: string) => {
      if (!text.trim()) return;
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: text.trim(),
        completed: false,
        status: 'todo',
        priority,
        category: category?.trim() ? category.trim().toLowerCase() : undefined,
        tag: tag?.trim() ? tag.trim().toLowerCase() : undefined,
        estimate: estimate?.trim() || undefined,
        subtasks: [],
        createdAt: new Date().toISOString(),
        isSpecial: Boolean(isSpecial),
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
        todos: prev.todos.map((t) => {
          if (t.id !== id) return t;
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            status: nextCompleted ? 'completed' : 'todo',
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }),
      }));
    },
    [mutateImmediate]
  );

  const toggleInProgress = useCallback(
    (id: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.map((t) => {
          if (t.id !== id) return t;
          const isCurrentlyInProgress = t.status === 'in_progress';
          return {
            ...t,
            status: isCurrentlyInProgress ? 'todo' : 'in_progress',
            completed: false,
            completedAt: undefined,
          };
        }),
      }));
    },
    [mutateImmediate]
  );

  const addSubTask = useCallback(
    (todoId: string, text: string) => {
      if (!text.trim()) return;
      const newSub: SubTask = {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.map((t) =>
          t.id === todoId
            ? { ...t, subtasks: [...(t.subtasks || []), newSub] }
            : t
        ),
      }));
    },
    [mutateImmediate]
  );

  const toggleSubTask = useCallback(
    (todoId: string, subtaskId: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.map((t) => {
          if (t.id !== todoId) return t;
          const updatedSubtasks = (t.subtasks || []).map((sub) =>
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
          );
          return {
            ...t,
            subtasks: updatedSubtasks,
          };
        }),
      }));
    },
    [mutateImmediate]
  );

  const deleteSubTask = useCallback(
    (todoId: string, subtaskId: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.map((t) =>
          t.id === todoId
            ? {
                ...t,
                subtasks: (t.subtasks || []).filter((sub) => sub.id !== subtaskId),
              }
            : t
        ),
      }));
    },
    [mutateImmediate]
  );

  const updateSubTask = useCallback(
    (todoId: string, subtaskId: string, text: string) => {
      if (!text.trim()) return;
      mutateImmediate((prev) => ({
        ...prev,
        todos: prev.todos.map((t) =>
          t.id === todoId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((sub) =>
                  sub.id === subtaskId ? { ...sub, text: text.trim() } : sub
                ),
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

  const reorderTodos = useCallback(
    (sourceId: string, targetId: string, position: 'before' | 'after' = 'before') => {
      if (sourceId === targetId) return;
      mutateImmediate((prev) => {
        const todos = [...prev.todos];
        const sourceIndex = todos.findIndex((t) => t.id === sourceId);
        if (sourceIndex === -1) return prev;
        const [movedItem] = todos.splice(sourceIndex, 1);

        const targetIndex = todos.findIndex((t) => t.id === targetId);
        if (targetIndex === -1) return prev;

        const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
        todos.splice(insertIndex, 0, movedItem);
        return {
          ...prev,
          todos,
        };
      });
    },
    [mutateImmediate]
  );

  const clearCompletedTodos = useCallback(() => {
    mutateImmediate((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => !t.completed),
    }));
  }, [mutateImmediate]);

  const clearCompletedSpecialTodos = useCallback(() => {
    mutateImmediate((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => !(t.completed && t.isSpecial)),
    }));
  }, [mutateImmediate]);

  const updateJournal = useCallback(
    (text: string) => {
      debouncedSave((prev) => ({
        ...prev,
        journal: text,
      }));
    },
    [debouncedSave]
  );

  // Notes & Ideas (saved into main week JSON)
  const addNoteIdea = useCallback(
    (item: Omit<NoteIdeaItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newItem: NoteIdeaItem = {
        ...item,
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
      mutateImmediate((prev) => ({
        ...prev,
        notes: [newItem, ...(prev.notes || [])],
      }));
      return newItem;
    },
    [mutateImmediate]
  );

  const updateNoteIdea = useCallback(
    (id: string, updates: Partial<NoteIdeaItem>) => {
      debouncedSave((prev) => ({
        ...prev,
        notes: (prev.notes || []).map((n) =>
          n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
        ),
      }));
    },
    [debouncedSave]
  );

  const deleteNoteIdea = useCallback(
    (id: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        notes: (prev.notes || []).filter((n) => n.id !== id),
      }));
    },
    [mutateImmediate]
  );

  const togglePinNoteIdea = useCallback(
    (id: string) => {
      mutateImmediate((prev) => ({
        ...prev,
        notes: (prev.notes || []).map((n) =>
          n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
        ),
      }));
    },
    [mutateImmediate]
  );

  const rolloverUnfinishedTasks = useCallback(() => {
    const prevWeek = getPreviousActiveWeekData(week);
    if (!prevWeek) return 0;

    const uncompleted = prevWeek.todos.filter((t) => !t.completed);
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
  }, [week, mutateImmediate]);

  const hasPreviousUnfinishedTasks = useCallback(() => {
    const prevWeek = getPreviousActiveWeekData(week);
    if (!prevWeek) return false;
    const currentTexts = new Set(dataRef.current.todos.map((t) => t.text.toLowerCase()));
    return prevWeek.todos.some((t) => !t.completed && !currentTexts.has(t.text.toLowerCase()));
  }, [week]);

  return {
    data,
    isLoaded,
    isSaving,
    lastSaved,
    addTodo,
    toggleTodo,
    toggleInProgress,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    updateSubTask,
    deleteTodo,
    updateTodo,
    reorderTodos,
    clearCompletedTodos,
    clearCompletedSpecialTodos,
    updateJournal,
    addNoteIdea,
    updateNoteIdea,
    deleteNoteIdea,
    togglePinNoteIdea,
    rolloverUnfinishedTasks,
    hasPreviousUnfinishedTasks,
  };
}
