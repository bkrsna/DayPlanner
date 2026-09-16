'use client';

import { useState, useEffect, useCallback, startTransition } from 'react';
import { getAllDaySummaries, getAllSavedDates, getDayData } from '@/lib/storage';
import { getTodayDateString, getPreviousDate, parseDate } from '@/lib/dateUtils';
import { DaySummary } from '@/types';

export interface TrackerStats {
  totalDays: number;
  completedTasksCount: number;
  totalTasksCount: number;
  currentStreak: number;
  bestStreak: number;
  activeRate: number; // percentage of days with tasks completed
}

export function useStorageStats() {
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [stats, setStats] = useState<TrackerStats>({
    totalDays: 0,
    completedTasksCount: 0,
    totalTasksCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    activeRate: 0,
  });

  const refreshStats = useCallback(() => {
    const list = getAllDaySummaries();
    setSummaries(list);

    const totalDays = list.length;
    let completedTasksCount = 0;
    let totalTasksCount = 0;

    for (const item of list) {
      completedTasksCount += item.completedTodos;
      totalTasksCount += item.totalTodos;
    }

    // Calculate streaks based on days with either completed tasks or oneBigThing completed
    const activeDates = new Set(
      list
        .filter((item) => item.completedTodos > 0 || item.oneBigThingDone)
        .map((item) => item.date)
    );

    const today = getTodayDateString();
    const yesterday = getPreviousDate(today);

    // Current streak
    let currentStreak = 0;
    let checkDate = activeDates.has(today) ? today : activeDates.has(yesterday) ? yesterday : null;

    if (checkDate) {
      while (checkDate && activeDates.has(checkDate)) {
        currentStreak++;
        checkDate = getPreviousDate(checkDate);
      }
    }

    // Best streak
    const sortedDates = Array.from(activeDates).sort();
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate: string | null = null;

    for (const d of sortedDates) {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const expected = getPreviousDate(d);
        if (lastDate === expected) {
          tempStreak++;
        } else {
          // Check if exactly 1 day gap
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

    setStats({
      totalDays,
      completedTasksCount,
      totalTasksCount,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      activeRate,
    });
  }, []);

  useEffect(() => {
    refreshStats();
    const handleUpdate = () => {
      startTransition(() => {
        refreshStats();
      });
    };
    window.addEventListener('daily_tracker_data_change', handleUpdate);
    return () => {
      window.removeEventListener('daily_tracker_data_change', handleUpdate);
    };
  }, [refreshStats]);

  const searchAllDays = useCallback((query: string): Array<{ date: string; matches: string[] }> => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const dates = getAllSavedDates();
    const results: Array<{ date: string; matches: string[] }> = [];

    for (const d of dates) {
      const data = getDayData(d);
      const matches: string[] = [];

      if (data.oneBigThing.toLowerCase().includes(q)) {
        matches.push(`Focus: ${data.oneBigThing}`);
      }

      for (const t of data.todos) {
        if (t.text.toLowerCase().includes(q)) {
          matches.push(`Task: ${t.text} (${t.completed ? 'Done' : 'Pending'})`);
        }
      }

      if (data.reflections.morningIntentions.toLowerCase().includes(q)) {
        matches.push(`Morning: ${data.reflections.morningIntentions.slice(0, 80)}...`);
      }
      if (data.reflections.eveningReflection.toLowerCase().includes(q)) {
        matches.push(`Reflection: ${data.reflections.eveningReflection.slice(0, 80)}...`);
      }
      if (data.reflections.notes.toLowerCase().includes(q)) {
        matches.push(`Notes: ${data.reflections.notes.slice(0, 80)}...`);
      }
      if (data.journal && data.journal.toLowerCase().includes(q)) {
        matches.push(`Journal: ${data.journal.slice(0, 80)}...`);
      }

      if (Array.isArray(data.notes)) {
        for (const n of data.notes) {
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q));
          if (matchTitle || matchContent || matchTag) {
            const label = n.type === 'idea' ? 'Idea' : 'Note';
            const snippet = n.content.trim() ? ` - ${n.content.slice(0, 50)}...` : '';
            matches.push(`${label}: ${n.title.trim() || 'Untitled'}${snippet}`);
          }
        }
      }

      if (matches.length > 0) {
        results.push({ date: d, matches });
      }
    }

    return results;
  }, []);

  return {
    summaries,
    stats,
    refreshStats,
    searchAllDays,
  };
}
