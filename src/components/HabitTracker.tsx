'use client';

import { useState } from 'react';
import { HabitItem, DayVitals } from '@/types';
import { Plus, Check, Trash2, Sparkles, Smile, BatteryCharging } from 'lucide-react';

interface HabitTrackerProps {
  habits: HabitItem[];
  vitals: DayVitals;
  onToggleHabit: (id: string) => void;
  onAddHabit: (title: string) => void;
  onRemoveHabit: (id: string) => void;
  onUpdateVitals: (vitals: Partial<DayVitals>) => void;
}

const MOODS = [
  { val: 1, label: 'Rough', emoji: '🌧️' },
  { val: 2, label: 'Low', emoji: '☁️' },
  { val: 3, label: 'Okay', emoji: '⛅' },
  { val: 4, label: 'Good', emoji: '☀️' },
  { val: 5, label: 'Thriving', emoji: '⚡' },
];

const ENERGIES = [
  { val: 1, label: 'Depleted' },
  { val: 2, label: 'Sluggish' },
  { val: 3, label: 'Balanced' },
  { val: 4, label: 'High' },
  { val: 5, label: 'Peak' },
];

export function HabitTracker({
  habits,
  vitals,
  onToggleHabit,
  onAddHabit,
  onRemoveHabit,
  onUpdateVitals,
}: HabitTrackerProps) {
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;
    onAddHabit(newHabitTitle);
    setNewHabitTitle('');
    setIsAdding(false);
  };

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <div className="space-y-4">
      {/* Habits Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Daily Habits & Rituals
            </h2>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {completedCount}/{habits.length} Done
          </span>
        </div>

        {/* Habit chips/cards */}
        <div className="space-y-1.5">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer select-none ${
                habit.completed
                  ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40 text-purple-900 dark:text-purple-200'
                  : 'bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200/70 dark:border-zinc-800/70 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
              onClick={() => onToggleHabit(habit.id)}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                    habit.completed
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                  }`}
                >
                  {habit.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={`text-xs font-medium ${habit.completed ? 'line-through opacity-85' : ''}`}>
                  {habit.title}
                </span>
              </div>

              {/* Remove custom habit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveHabit(habit.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-opacity"
                title="Remove habit"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add custom habit */}
        {isAdding ? (
          <form onSubmit={handleAdd} className="mt-2.5 flex items-center gap-2">
            <input
              type="text"
              value={newHabitTitle}
              onChange={(e) => setNewHabitTitle(e.target.value)}
              placeholder="e.g. 🧘 10m Meditation"
              autoFocus
              className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-xs rounded-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-2 py-1 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2.5 w-full flex items-center justify-center gap-1 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-dashed border-zinc-200 dark:border-zinc-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ritual</span>
          </button>
        )}
      </div>

      {/* Daily Vitals (Mood & Energy) */}
      <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
          <Smile className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Daily Vitals
          </h3>
        </div>

        {/* Mood */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span>Mood Check-in</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {MOODS.find((m) => m.val === vitals.mood)?.label || 'Unset'}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {MOODS.map((m) => (
              <button
                key={m.val}
                onClick={() =>
                  onUpdateVitals({ mood: vitals.mood === m.val ? 0 : m.val })
                }
                title={m.label}
                className={`py-1.5 rounded-lg flex flex-col items-center justify-center transition-all ${
                  vitals.mood === m.val
                    ? 'bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 scale-105'
                    : 'bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                }`}
              >
                <span className="text-base leading-none">{m.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-blue-500" />
              <span>Energy</span>
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {ENERGIES.find((e) => e.val === vitals.energy)?.label || 'Unset'}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {ENERGIES.map((e) => (
              <button
                key={e.val}
                onClick={() =>
                  onUpdateVitals({ energy: vitals.energy === e.val ? 0 : e.val })
                }
                className={`h-2.5 rounded-full transition-all ${
                  (vitals.energy || 0) >= e.val
                    ? 'bg-blue-500 dark:bg-blue-400'
                    : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300'
                }`}
                title={`${e.label} (${e.val}/5)`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
