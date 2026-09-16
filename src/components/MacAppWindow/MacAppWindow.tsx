'use client';

import { useState, useEffect, useCallback } from 'react';
import { NoteIdeaItem } from '@/types';
import { MacClockApp } from './MacClockApp';
import { MacNotesApp } from './MacNotesApp';
import {
  Timer,
  Lightbulb,
  Maximize2,
  Minimize2,
  X,
  Minus,
} from 'lucide-react';

export type MacAppId = 'clock' | 'notes';

interface MacAppWindowProps {
  isOpen: boolean;
  onClose: () => void;
  activeApp: MacAppId;
  onSelectApp: (app: MacAppId) => void;
  notes: NoteIdeaItem[];
  onAddNoteIdea: (item: Omit<NoteIdeaItem, 'id' | 'createdAt' | 'updatedAt'>) => NoteIdeaItem;
  onUpdateNoteIdea: (id: string, updates: Partial<NoteIdeaItem>) => void;
  onDeleteNoteIdea: (id: string) => void;
  onTogglePinNoteIdea: (id: string) => void;
  currentDate: string;
  journalText?: string;
  onAddTodo?: (text: string) => void;
}

export function MacAppWindow({
  isOpen,
  onClose,
  activeApp,
  onSelectApp,
  notes,
  onAddNoteIdea,
  onUpdateNoteIdea,
  onDeleteNoteIdea,
  onTogglePinNoteIdea,
  currentDate,
  journalText,
  onAddTodo,
}: MacAppWindowProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Close handler resetting window states
  const handleClose = useCallback(() => {
    setIsMinimized(false);
    setIsFullscreen(false);
    onClose();
  }, [onClose]);

  // Handle ESC to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (!isMinimized) {
          handleClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, isMinimized, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Minimized state: Render floating macOS Dock at bottom */}
      {isMinimized && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-900/90 dark:bg-zinc-800/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl text-white">
            <button
              onClick={() => {
                setIsMinimized(false);
                onSelectApp('clock');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeApp === 'clock'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                  : 'hover:bg-white/10 text-zinc-300'
              }`}
            >
              <div className="w-5 h-5 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                <Timer className="w-3.5 h-3.5" />
              </div>
              <span>Clock</span>
            </button>

            <button
              onClick={() => {
                setIsMinimized(false);
                onSelectApp('notes');
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeApp === 'notes'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'hover:bg-white/10 text-zinc-300'
              }`}
            >
              <div className="w-5 h-5 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <span>Notes & Ideas</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {notes.length}
              </span>
            </button>

            <div className="h-5 w-px bg-zinc-700 mx-1" />

            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
              title="Restore Window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors"
              title="Close Application"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main macOS Application Window Container (Kept mounted when minimized to preserve background timers) */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md transition-all duration-200 ${
          isMinimized ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100'
        }`}
      >
        {/* Click outside to close (light dismiss) */}
        <div className="absolute inset-0" onClick={handleClose} />

        {/* Outer Window Frame (Clean rounded double-border frame matching user sketch) */}
        <div
          className={`relative z-10 flex flex-col transition-all duration-200 ${
            isFullscreen
              ? 'w-full h-full rounded-none inset-0 max-w-none max-h-none p-0 border-0 shadow-none'
              : 'w-[96vw] max-w-6xl h-[88vh] max-h-[880px] rounded-3xl sm:rounded-[32px] p-2 sm:p-2.5 bg-zinc-200/90 dark:bg-zinc-800/90 border-2 border-zinc-300/90 dark:border-zinc-700/80 shadow-2xl ring-1 ring-black/10 dark:ring-white/10'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Inner Window Frame Container */}
          <div
            className={`w-full h-full flex flex-col bg-zinc-100 dark:bg-zinc-900 overflow-hidden shadow-sm ${
              isFullscreen
                ? 'rounded-none border-0'
                : 'rounded-2xl sm:rounded-[24px] border border-zinc-300/80 dark:border-zinc-800/90'
            }`}
          >
            {/* ======================================================== */}
            {/* macOS Title Bar                                          */}
            {/* ======================================================== */}
            <div className="h-12 sm:h-13 px-2 sm:px-4 flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl shrink-0 select-none gap-1 sm:gap-2">
              {/* Traffic Light Buttons (Top-Left) */}
              <div className="flex items-center gap-1.5 sm:gap-2 group/traffic shrink-0">
                {/* Close Button (Red) */}
                <button
                  onClick={handleClose}
                  aria-label="Close"
                  title="Close (Esc)"
                  className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-[#e0443e] flex items-center justify-center text-zinc-900 opacity-90 hover:opacity-100 transition-all shadow-2xs"
                >
                  <X className="w-2.5 h-2.5 opacity-0 group-hover/traffic:opacity-80 transition-opacity" />
                </button>

                {/* Minimize Button (Yellow) */}
                <button
                  onClick={() => setIsMinimized(true)}
                  aria-label="Minimize"
                  title="Minimize to Dock"
                  className="w-3.5 h-3.5 rounded-full bg-[#febc2e] border border-[#d89e24] flex items-center justify-center text-zinc-900 opacity-90 hover:opacity-100 transition-all shadow-2xs"
                >
                  <Minus className="w-2.5 h-2.5 opacity-0 group-hover/traffic:opacity-80 transition-opacity" />
                </button>

                {/* Fullscreen / Maximize Button (Green) */}
                <button
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                  title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
                  className="w-3.5 h-3.5 rounded-full bg-[#28c840] border border-[#1aab29] flex items-center justify-center text-zinc-900 opacity-90 hover:opacity-100 transition-all shadow-2xs"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-2 h-2 opacity-0 group-hover/traffic:opacity-80 transition-opacity" />
                  ) : (
                    <Maximize2 className="w-2 h-2 opacity-0 group-hover/traffic:opacity-80 transition-opacity" />
                  )}
                </button>
              </div>

              {/* Centered Segmented Tab Switcher (macOS Tabs) */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80 text-xs font-medium shrink-0">
                {/* Tab 1: Clock & Stopwatch */}
                <button
                  onClick={() => onSelectApp('clock')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg transition-all ${
                    activeApp === 'clock'
                      ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="w-4 h-4 rounded-md bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <Timer className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="hidden sm:inline">Clock & Stopwatch</span>
                  <span className="sm:hidden">Clock</span>
                </button>

                {/* Tab 2: Notes & Ideas */}
                <button
                  onClick={() => onSelectApp('notes')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg transition-all ${
                    activeApp === 'notes'
                      ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <div className="w-4 h-4 rounded-md bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-white shadow-2xs shrink-0">
                    <Lightbulb className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                  <span className="hidden sm:inline">Notes & Ideas</span>
                  <span className="sm:hidden">Notes</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-zinc-500">
                    {notes.length}
                  </span>
                </button>
              </div>

              {/* Right Side: Window Utilities & Prominent Close 'X' matching user sketch */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <span>esc</span>
                  <span>to close</span>
                </span>

                <button
                  onClick={() => setIsFullscreen((prev) => !prev)}
                  className="hidden sm:inline-flex p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title={isFullscreen ? 'Restore Window' : 'Full Screen'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Prominent Top-Right 'X' Close Button from hand-drawn sketch */}
                <button
                  onClick={handleClose}
                  aria-label="Close Application Window"
                  title="Close Window (Esc)"
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl flex items-center justify-center bg-zinc-200/90 dark:bg-zinc-800/90 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 text-zinc-700 dark:text-zinc-200 transition-all shadow-2xs hover:shadow-xs active:scale-95 group"
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* Active Application Body (Kept alive)                      */}
            {/* ======================================================== */}
            <div className="flex-1 overflow-hidden">
              <div className={`h-full ${activeApp === 'clock' ? 'block' : 'hidden'}`}>
                <MacClockApp />
              </div>
              <div className={`h-full ${activeApp === 'notes' ? 'block' : 'hidden'}`}>
                <MacNotesApp
                  notes={notes}
                  onAddNoteIdea={onAddNoteIdea}
                  onUpdateNoteIdea={onUpdateNoteIdea}
                  onDeleteNoteIdea={onDeleteNoteIdea}
                  onTogglePinNoteIdea={onTogglePinNoteIdea}
                  currentDate={currentDate}
                  journalText={journalText}
                  onAddTodo={onAddTodo}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
