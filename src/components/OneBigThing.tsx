'use client';

import { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle } from 'lucide-react';

interface OneBigThingProps {
  value: string;
  isDone: boolean;
  onChange: (text: string) => void;
  onToggle: () => void;
}

export function OneBigThing({
  value,
  isDone,
  onChange,
  onToggle,
}: OneBigThingProps) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (newVal: string) => {
    setText(newVal);
    onChange(newVal);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 ${
        isDone
          ? 'border-emerald-500/30 bg-emerald-50/40 dark:border-emerald-500/20 dark:bg-emerald-950/15'
          : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isDone
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              One Big Thing
            </h2>
          </div>
        </div>

        {text.trim() && (
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
              isDone
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
            }`}
          >
            {isDone ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Achieved</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 text-zinc-400" />
                <span>Mark Achieved</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="What single focus makes today a total win?"
          className={`w-full bg-transparent text-base sm:text-lg font-medium tracking-tight outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all ${
            isDone
              ? 'text-zinc-500 dark:text-zinc-400 line-through decoration-emerald-500/60'
              : 'text-zinc-900 dark:text-zinc-100'
          }`}
        />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span>The North Star goal for this day</span>
        {isDone && <span className="text-emerald-600 dark:text-emerald-400 font-medium">✨ Priority objective completed!</span>}
      </div>
    </div>
  );
}
