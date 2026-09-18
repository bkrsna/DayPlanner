'use client';

import { useState } from 'react';
import { useMonthData } from '@/hooks/useMonthData';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { NavCard } from '@/components/NavCard';
import { TodoSection } from '@/components/TodoSection';
import { Clock } from '@/components/Clock';
import { Journal } from '@/components/Journal';
import { ConsistencyModal } from '@/components/ConsistencyModal';
import { ExportImportModal } from '@/components/ExportImportModal';
import { CommandPalette } from '@/components/CommandPalette';
import { AppsLauncherCard } from '@/components/AppsLauncherCard';
import { MacAppWindow, MacAppId } from '@/components/MacAppWindow/MacAppWindow';
import { getTodayDateString } from '@/lib/dateUtils';

interface MonthClientProps {
  month: string;
}

export function MonthClient({ month }: MonthClientProps) {
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
    updateJournal,
    addNoteIdea,
    updateNoteIdea,
    deleteNoteIdea,
    togglePinNoteIdea,
    rolloverUnfinishedTasks,
    hasPreviousUnfinishedTasks,
  } = useMonthData(month);

  useKeyboardShortcuts({
    currentDate: getTodayDateString(),
    onOpenCommand: () => setIsCommandOpen(true),
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#090a0d] flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
          <span>Loading monthly workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] dark:bg-[#090a0d] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/20 antialiased">
      {/* 2-Column Responsive Layout: Left = Monthly Goals (from left), Right = All other components */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-6">
        {/* Mobile-only Navigation Card at top */}
        <div className="lg:hidden mb-4">
          <NavCard
            periodType="month"
            currentId={month}
            onOpenCommand={() => setIsCommandOpen(true)}
            onOpenConsistency={() => setIsConsistencyOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (7 cols on lg, 8 cols on xl): Strictly Monthly Goals from the left */}
          <div className="lg:col-span-7 xl:col-span-8 w-full">
            <TodoSection
              todos={data.todos}
              title="Monthly Goals"
              placeholder="Add a monthly goal or focus target..."
              rolloverTitle="Rollover unfinished goals from previous month"
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

          {/* Right Column (5 cols on lg, 4 cols on xl): All other components on right side of todo */}
          <div className="lg:col-span-5 xl:col-span-4 w-full lg:sticky lg:top-6 space-y-4">
            {/* Desktop Navigation Card */}
            <div className="hidden lg:block">
              <NavCard
                periodType="month"
                currentId={month}
                onOpenCommand={() => setIsCommandOpen(true)}
                onOpenConsistency={() => setIsConsistencyOpen(true)}
                onOpenExport={() => setIsExportOpen(true)}
              />
            </div>

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
              title="Monthly Journal"
              placeholder="Write monthly reflection, review, notes..."
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
        currentDate={month}
        journalText={data.journal}
        onAddTodo={(text) => addTodo(text, 'medium')}
      />

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
