'use client';

import { useState } from 'react';
import { useDayData } from '@/hooks/useDayData';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Header } from '@/components/Header';
import { DateNavigator } from '@/components/DateNavigator';
import { OneBigThing } from '@/components/OneBigThing';
import { TodoSection } from '@/components/TodoSection';
import { HabitTracker } from '@/components/HabitTracker';
import { JournalSection } from '@/components/JournalSection';
import { ProgressRing } from '@/components/ProgressRing';
import { ConsistencyModal } from '@/components/ConsistencyModal';
import { ExportImportModal } from '@/components/ExportImportModal';
import { CommandPalette } from '@/components/CommandPalette';
import { CheckCircle2, ListTodo, PenLine, Sparkles } from 'lucide-react';

interface DayClientProps {
  date: string;
}

export function DayClient({ date }: DayClientProps) {
  const [isConsistencyOpen, setIsConsistencyOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const {
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
  } = useDayData(date);

  useKeyboardShortcuts({
    currentDate: date,
    onOpenCommand: () => setIsCommandOpen(true),
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
          <span>Loading day...</span>
        </div>
      </div>
    );
  }

  const completedTodos = data.todos.filter((t) => t.completed).length;
  const totalTodos = data.todos.length;
  const completedHabits = data.habits.filter((h) => h.completed).length;
  const totalHabits = data.habits.length;

  const totalReflectionWords =
    (data.reflections.morningIntentions.trim() ? data.reflections.morningIntentions.trim().split(/\s+/).length : 0) +
    (data.reflections.eveningReflection.trim() ? data.reflections.eveningReflection.trim().split(/\s+/).length : 0) +
    (data.reflections.notes.trim() ? data.reflections.notes.trim().split(/\s+/).length : 0);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/70 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/20">
      {/* Top Header */}
      <Header
        onOpenCommand={() => setIsCommandOpen(true)}
        onOpenConsistency={() => setIsConsistencyOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Date Navigator Bar */}
        <DateNavigator currentDate={date} />

        {/* Hero Goal & Progress Section */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
          {/* One Big Thing Card (spans 3 columns) */}
          <div className="lg:col-span-3">
            <OneBigThing
              value={data.oneBigThing}
              isDone={data.oneBigThingDone}
              onChange={setOneBigThing}
              onToggle={toggleOneBigThing}
            />
          </div>

          {/* Daily Progress Gauge (spans 1 column) */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Daily Completion
              </span>
              {totalTodos > 0 && completedTodos === totalTodos && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> All Done!
                </span>
              )}
            </div>

            <div className="my-2 flex items-center justify-center gap-4">
              <ProgressRing completed={completedTodos} total={totalTodos} size={58} />
              <div className="text-left">
                <div className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                  {completedTodos}/{totalTodos}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {totalTodos === 0 ? 'No tasks yet' : 'tasks checked off'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Habits: {completedHabits}/{totalHabits}</span>
              <span>{totalReflectionWords} words</span>
            </div>
          </div>
        </div>

        {/* Core Layout: 2 Columns */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 spans): To-Dos + Reflections */}
          <div className="lg:col-span-2 space-y-6">
            {/* To-Do List */}
            <TodoSection
              todos={data.todos}
              onAddTodo={addTodo}
              onToggleTodo={toggleTodo}
              onDeleteTodo={deleteTodo}
              onUpdateTodo={updateTodo}
              onRollover={rolloverUnfinishedTasks}
              hasPreviousTasks={hasPreviousUnfinishedTasks()}
            />

            {/* Reflection and Text Areas */}
            <JournalSection
              reflections={data.reflections}
              onChange={updateReflections}
              isSaving={isSaving}
              lastSaved={lastSaved}
            />
          </div>

          {/* Right Column (1 span): Habits, Vitals & Daily Summary */}
          <div className="space-y-6">
            <HabitTracker
              habits={data.habits}
              vitals={data.vitals}
              onToggleHabit={toggleHabit}
              onAddHabit={addCustomHabit}
              onRemoveHabit={removeHabit}
              onUpdateVitals={updateVitals}
            />

            {/* Daily Summary / Inspiration Box */}
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-4 shadow-xs text-xs space-y-3">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Daily Execution Check</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                Consistency compounds. Win the morning by defining your One Big Thing, execute your highest-priority tasks, and close the loop with an evening reflection.
              </p>
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <ListTodo className="w-3 h-3 text-zinc-400" />
                  {totalTodos} Goals
                </span>
                <span className="flex items-center gap-1">
                  <PenLine className="w-3 h-3 text-zinc-400" />
                  {totalReflectionWords} Words Logged
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global Modals */}
      <ConsistencyModal
        isOpen={isConsistencyOpen}
        onClose={() => setIsConsistencyOpen(false)}
        currentDate={date}
      />

      <ExportImportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentDate={date}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenConsistency={() => setIsConsistencyOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
      />
    </div>
  );
}
