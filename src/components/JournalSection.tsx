'use client';

import { useState } from 'react';
import { DayReflections } from '@/types';
import {
  Sun,
  Moon,
  FileText,
  Maximize2,
  Minimize2,
  Eye,
  Edit3,
  Sparkles,
  CheckCheck,
} from 'lucide-react';

interface JournalSectionProps {
  reflections: DayReflections;
  onChange: (updates: Partial<DayReflections>) => void;
  isSaving: boolean;
  lastSaved: Date | null;
}

type TabType = 'morning' | 'evening' | 'notes';

export function JournalSection({
  reflections,
  onChange,
  isSaving,
  lastSaved,
}: JournalSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('morning');
  const [isZenMode, setIsZenMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const currentContent =
    activeTab === 'morning'
      ? reflections.morningIntentions
      : activeTab === 'evening'
      ? reflections.eveningReflection
      : reflections.notes;

  const handleTextChange = (val: string) => {
    if (activeTab === 'morning') {
      onChange({ morningIntentions: val });
    } else if (activeTab === 'evening') {
      onChange({ eveningReflection: val });
    } else {
      onChange({ notes: val });
    }
  };

  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
  const charCount = currentContent.length;

  const insertTemplate = (template: string) => {
    const combined = currentContent.trim()
      ? `${currentContent.trim()}\n\n${template}`
      : template;
    handleTextChange(combined);
  };

  return (
    <div
      className={`rounded-2xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/70 shadow-xs transition-all ${
        isZenMode
          ? 'fixed inset-4 z-50 p-6 flex flex-col bg-white dark:bg-zinc-950 shadow-2xl border-zinc-300 dark:border-zinc-700'
          : 'p-5 sm:p-6'
      }`}
    >
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-xs">
          <button
            onClick={() => setActiveTab('morning')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'morning'
                ? 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Morning</span>
            {reflections.morningIntentions.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('evening')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'evening'
                ? 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evening</span>
            {reflections.eveningReflection.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'notes'
                ? 'bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Notes</span>
            {reflections.notes.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Right Tools: Preview toggle, Zen mode, Save indicator */}
        <div className="flex items-center gap-2 text-xs self-end sm:self-auto">
          {/* Auto-save indicator */}
          <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 mr-2">
            {isSaving ? (
              <span className="inline-flex items-center gap-1 text-amber-500 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                <CheckCheck className="w-3 h-3 text-emerald-500" />
                Saved locally
              </span>
            ) : null}
          </div>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-1.5 rounded-lg border transition-colors ${
              previewMode
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title={previewMode ? 'Switch to Edit' : 'Preview formatted view'}
          >
            {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isZenMode ? 'Exit Zen Mode' : 'Distraction-free Zen Mode'}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Optional Template Quick Actions */}
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        <div className="text-[11px] font-medium text-zinc-400">
          {activeTab === 'morning' && 'Morning Strategy & Focus'}
          {activeTab === 'evening' && 'Evening Review & Wins'}
          {activeTab === 'notes' && 'Scratchpad'}
        </div>

        {/* Preset Prompt Inserts */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'morning' && (
            <button
              onClick={() =>
                insertTemplate('### Strategy\n- Core objective:\n- Distractions to eliminate:')
              }
              className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Insert Template</span>
            </button>
          )}
          {activeTab === 'evening' && (
            <button
              onClick={() =>
                insertTemplate('### Debrief\n1. What went well:\n2. What to improve tomorrow:\n3. Takeaway:')
              }
              className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Insert Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor / Preview Body */}
      <div className={`relative ${isZenMode ? 'flex-1 flex flex-col' : ''}`}>
        {previewMode ? (
          <div
            className={`w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap ${
              isZenMode ? 'flex-1' : 'min-h-[200px]'
            }`}
          >
            {currentContent.trim() ? (
              currentContent
            ) : (
              <span className="text-zinc-400">No notes written yet.</span>
            )}
          </div>
        ) : (
          <textarea
            value={currentContent}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={
              activeTab === 'morning'
                ? 'Morning intentions, strategic focus, and game plan...'
                : activeTab === 'evening'
                ? 'Evening review, highlights, and learnings...'
                : 'Freeform notes, ideas, code snippets, meeting thoughts...'
            }
            className={`w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all resize-y font-sans leading-relaxed ${
              isZenMode ? 'flex-1 text-base p-6' : 'min-h-[200px]'
            }`}
          />
        )}
      </div>

      {/* Footer info: words & chars */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span className="font-mono">Markdown</span>
        <span className="font-mono">
          {wordCount} words &bull; {charCount} chars
        </span>
      </div>
    </div>
  );
}
