'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPreviousDate, getNextDate, getTodayDateString } from '@/lib/dateUtils';

interface ShortcutOptions {
  currentDate?: string;
  onOpenCommand: () => void;
}

export function useKeyboardShortcuts({
  currentDate,
  onOpenCommand,
}: ShortcutOptions) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger navigation hotkeys if typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K / Ctrl+K (always active)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommand();
        return;
      }

      if (isTyping) return;

      if (!currentDate) return;

      // [ -> previous day
      if (e.key === '[') {
        e.preventDefault();
        router.push(`/day/${getPreviousDate(currentDate)}`);
      }

      // ] -> next day
      if (e.key === ']') {
        e.preventDefault();
        router.push(`/day/${getNextDate(currentDate)}`);
      }

      // t or T -> today
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        router.push(`/day/${getTodayDateString()}`);
      }

      // 1 -> Day view
      if (e.key === '1') {
        e.preventDefault();
        router.push(`/day/${getTodayDateString()}`);
      }

      // 2 -> Week view
      if (e.key === '2') {
        e.preventDefault();
        router.push('/week');
      }

      // 3 -> Month view
      if (e.key === '3') {
        e.preventDefault();
        router.push('/month');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDate, onOpenCommand, router]);
}
