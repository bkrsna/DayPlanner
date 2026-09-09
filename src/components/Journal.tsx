'use client';

import { CheckCheck } from 'lucide-react';

interface JournalProps {
  value: string;
  onChange: (val: string) => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  title?: string;
  placeholder?: string;
}

export function Journal({
  value,
  onChange,
  isSaving = false,
  lastSaved = null,
  title = 'Journal',
  placeholder = 'Write thoughts, notes, reflections...',
}: JournalProps) {
  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm space-y-3">
      {/* Minimalist Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>

        {/* Auto-save Status */}
        <div className="flex items-center gap-1.5 text-xs">
          {isSaving ? (
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Saved</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Clean Distraction-free Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors resize-y leading-relaxed font-sans"
      />
    </div>
  );
}
