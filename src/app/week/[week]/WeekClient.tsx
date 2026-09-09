'use client';

import { useState } from 'react';
import { useWeekData } from '@/hooks/useWeekData';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LeftNavCard } from '@/components/LeftNavCard';
import { SpecialTasksCard } from '@/components/SpecialTasksCard';
import { TodoSection } from '@/components/TodoSection';
import { Clock } from '@/components/Clock';
import { Journal } from '@/components/Journal';
import { ConsistencyModal } from '@/components/ConsistencyModal';
import { ExportImportModal } from '@/components/ExportImportModal';
import { CommandPalette } from '@/components/CommandPalette';
import { getTodayDateString } from '@/lib/dateUtils';

interface WeekClientProps {
  week: string;
}

export function WeekClient({ week }: WeekClientProps) {
  const [isConsistencyOpen, setIsConsistencyOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const {
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
    rolloverUnfinishedTasks,
    hasPreviousUnfinishedTasks,
  } = useWeekData(week);

  useKeyboardShortcuts({
    currentDate: getTodayDateString(),
    onOpenCommand: () => setIsCommandOpen(true),
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#090a0d] flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
          <span>Loading weekly workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] dark:bg-[#090a0d] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/20 antialiased">
      {/* Strict 3-Column Layout: Left = Navigation/Brand/Timeline, Middle = ONLY To-Dos (large height), Right = Clock & Journal */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (3 cols): Navigation Card + Special Tasks Card */}
          <div className="lg:col-span-3 w-full lg:sticky lg:top-6 space-y-4">
            <LeftNavCard
              periodType="week"
              currentId={week}
              onOpenCommand={() => setIsCommandOpen(true)}
              onOpenConsistency={() => setIsConsistencyOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
            />
            <SpecialTasksCard
              todos={data.todos.filter((t) => t.isSpecial)}
              onToggleTodo={toggleTodo}
              onToggleInProgress={toggleInProgress}
              onAddSubTask={addSubTask}
              onToggleSubTask={toggleSubTask}
              onDeleteSubTask={deleteSubTask}
              onUpdateSubTask={updateSubTask}
              onDeleteTodo={deleteTodo}
              onUpdateTodo={updateTodo}
              onReorderTodos={reorderTodos}
              onClearCompleted={clearCompletedSpecialTodos}
            />
          </div>

          {/* Middle Column (6 cols): Strictly ONLY Weekly Goals with large height */}
          <div className="lg:col-span-6 w-full">
            <TodoSection
              todos={data.todos}
              title="Weekly Goals"
              placeholder="Add a weekly goal or key milestone..."
              rolloverTitle="Rollover unfinished goals from previous week"
              onAddTodo={addTodo}
              onToggleTodo={toggleTodo}
              onToggleInProgress={toggleInProgress}
              onAddSubTask={addSubTask}
              onToggleSubTask={toggleSubTask}
              onDeleteSubTask={deleteSubTask}
              onUpdateSubTask={updateSubTask}
              onDeleteTodo={deleteTodo}
              onUpdateTodo={updateTodo}
              onReorderTodos={reorderTodos}
              onClearCompleted={clearCompletedTodos}
              onRollover={rolloverUnfinishedTasks}
              hasPreviousTasks={hasPreviousUnfinishedTasks()}
            />
          </div>

          {/* Right Column (3 cols): Other components - Clock & Journal */}
          <div className="lg:col-span-3 w-full lg:sticky lg:top-6 space-y-5">
            <Clock />
            <Journal
              value={data.journal || ''}
              onChange={updateJournal}
              isSaving={isSaving}
              lastSaved={lastSaved}
              title="Weekly Journal"
              placeholder="Write weekly review, priorities, reflections..."
            />
          </div>
        </div>
      </main>

      {/* Global Modals */}
      <ConsistencyModal
        isOpen={isConsistencyOpen}
        onClose={() => setIsConsistencyOpen(false)}
        currentDate={getTodayDateString()}
      />

      <ExportImportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        currentDate={getTodayDateString()}
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
