'use client';

import { useState } from 'react';
import { useDayData } from '@/hooks/useDayData';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LeftNavCard } from '@/components/LeftNavCard';
import { SpecialTasksCard } from '@/components/SpecialTasksCard';
import { TodoSection } from '@/components/TodoSection';
import { Clock } from '@/components/Clock';
import { Journal } from '@/components/Journal';
import { ConsistencyModal } from '@/components/ConsistencyModal';
import { ExportImportModal } from '@/components/ExportImportModal';
import { CommandPalette } from '@/components/CommandPalette';
import { AppsLauncherCard } from '@/components/AppsLauncherCard';
import { MacAppWindow, MacAppId } from '@/components/MacAppWindow/MacAppWindow';

interface DayClientProps {
  date: string;
}

export function DayClient({ date }: DayClientProps) {
  const [isConsistencyOpen, setIsConsistencyOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isMacAppOpen, setIsMacAppOpen] = useState(false);
  const [activeMacApp, setActiveMacApp] = useState<MacAppId>('clock');

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
    addNoteIdea,
    updateNoteIdea,
    deleteNoteIdea,
    togglePinNoteIdea,
    rolloverUnfinishedTasks,
    hasPreviousUnfinishedTasks,
  } = useDayData(date);

  useKeyboardShortcuts({
    currentDate: date,
    onOpenCommand: () => setIsCommandOpen(true),
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-[#090a0d]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
          <p className="text-xs font-mono text-zinc-400">Loading daily log...</p>
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
              periodType="day"
              currentId={date}
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

          {/* Middle Column (6 cols): Strictly ONLY To-Dos with large height */}
          <div className="lg:col-span-6 w-full">
            <TodoSection
              todos={data.todos}
              title="To-Dos"
              placeholder="Add a new task..."
              rolloverTitle="Rollover unfinished tasks"
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

          {/* Right Column (3 cols): Apps Launcher Card, Clock & Journal */}
          <div className="lg:col-span-3 w-full lg:sticky lg:top-6 space-y-4">
            <AppsLauncherCard
              notesCount={data.notes?.length || 0}
              onOpenApp={(app) => {
                setActiveMacApp(app);
                setIsMacAppOpen(true);
              }}
            />
            <Clock
              onExpand={() => {
                setActiveMacApp('clock');
                setIsMacAppOpen(true);
              }}
            />
            <Journal
              value={data.journal || ''}
              onChange={updateJournal}
              isSaving={isSaving}
              lastSaved={lastSaved}
              title="Journal"
              placeholder="Write thoughts, notes, reflections..."
              onExpand={() => {
                setActiveMacApp('notes');
                setIsMacAppOpen(true);
              }}
            />
          </div>
        </div>
      </main>

      {/* MacBook Application Window / Popup */}
      <MacAppWindow
        isOpen={isMacAppOpen}
        onClose={() => setIsMacAppOpen(false)}
        activeApp={activeMacApp}
        onSelectApp={setActiveMacApp}
        notes={data.notes || []}
        onAddNoteIdea={addNoteIdea}
        onUpdateNoteIdea={updateNoteIdea}
        onDeleteNoteIdea={deleteNoteIdea}
        onTogglePinNoteIdea={togglePinNoteIdea}
        currentDate={date}
        journalText={data.journal}
        onAddTodo={(text) => addTodo(text, 'medium')}
      />

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
        onOpenClock={() => {
          setActiveMacApp('clock');
          setIsMacAppOpen(true);
        }}
        onOpenNotes={() => {
          setActiveMacApp('notes');
          setIsMacAppOpen(true);
        }}
      />
    </div>
  );
}
