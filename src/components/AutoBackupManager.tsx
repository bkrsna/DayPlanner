'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getAutoBackupMeta,
  getSavedDirectoryHandle,
  verifyDirectoryPermission,
  performAutoBackup,
  performAutoFetch,
  readBackupFromDirectory,
  setAutoBackupMeta,
  AutoBackupMeta,
} from '@/lib/autoBackup';
import { Folder } from 'lucide-react';

export function AutoBackupManager() {
  const [meta, setMeta] = useState<AutoBackupMeta>(() => getAutoBackupMeta());
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [dismissPrompt, setDismissPrompt] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<boolean>(false);

  // Keep meta state updated on broadcast events
  useEffect(() => {
    const handleMetaChange = (e: Event) => {
      const custom = e as CustomEvent<AutoBackupMeta>;
      if (custom.detail) {
        setMeta(custom.detail);
      } else {
        setMeta(getAutoBackupMeta());
      }
    };

    window.addEventListener('dayplanner_autobackup_change', handleMetaChange);
    return () => {
      window.removeEventListener('dayplanner_autobackup_change', handleMetaChange);
    };
  }, []);

  useEffect(() => {
    // 1. Initial load on mount: fetch from saved file automatically
    const initSync = async () => {
      const currentMeta = getAutoBackupMeta();
      if (!currentMeta.enabled) return;

      const handle = await getSavedDirectoryHandle();
      if (!handle) {
        setAutoBackupMeta({
          status: 'error',
          errorMessage: 'Backup folder handle missing. Please re-select the folder.',
        });
        return;
      }

      const hasPerm = await verifyDirectoryPermission(handle, false);
      if (!hasPerm) {
        setAutoBackupMeta({
          status: 'needs_permission',
          errorMessage: `Permission required to sync with folder "${currentMeta.folderName}". Click to authorize.`,
        });
        return;
      }

      // Silent auto-fetch from disk on startup
      await performAutoFetch(false);
    };

    initSync();

    // 2. Debounced auto-save handler on data change
    const triggerDebouncedSave = (e: Event) => {
      const custom = e as CustomEvent;
      // Echo prevention: if this change was triggered by our own fetch from disk, do NOT save back to disk!
      if (custom.detail?.source === 'auto_backup_fetch') {
        return;
      }

      const currentMeta = getAutoBackupMeta();
      if (!currentMeta.enabled) return;

      pendingSaveRef.current = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        pendingSaveRef.current = false;
        await performAutoBackup(false);
      }, 3000); // 3 seconds debounce
    };

    window.addEventListener('daily_tracker_data_change', triggerDebouncedSave);

    // 3. Periodic sync check every 5 minutes
    const intervalId = setInterval(() => {
      const currentMeta = getAutoBackupMeta();
      if (currentMeta.enabled && currentMeta.status === 'synced') {
        performAutoBackup(false);
      }
    }, 5 * 60 * 1000);

    // 4. Tab focus & visibility change handler
    const handleTabFocus = async () => {
      const currentMeta = getAutoBackupMeta();
      if (!currentMeta.enabled) return;

      const handle = await getSavedDirectoryHandle();
      if (!handle) return;
      const hasPerm = await verifyDirectoryPermission(handle, false);
      if (!hasPerm) return;

      // Check if file was updated externally on disk
      try {
        const readResult = await readBackupFromDirectory(handle);
        if (readResult.exists && readResult.lastModified && currentMeta.lastSavedAt) {
          const lastSavedTime = new Date(currentMeta.lastSavedAt).getTime();
          const lastFetchedTime = currentMeta.lastFetchedAt ? new Date(currentMeta.lastFetchedAt).getTime() : 0;
          const latestKnownTime = Math.max(lastSavedTime, lastFetchedTime);

          if (readResult.lastModified > latestKnownTime + 1000) {
            // File was updated on disk while away! Fetch and merge it.
            await performAutoFetch(false);
          }
        }
      } catch (err) {
        console.warn('Focus sync check failed:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingSaveRef.current) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        pendingSaveRef.current = false;
        performAutoBackup(false);
      } else if (document.visibilityState === 'visible') {
        handleTabFocus();
      }
    };

    const handleBeforeUnload = () => {
      if (pendingSaveRef.current) {
        performAutoBackup(false);
      }
    };

    const handleWindowFocus = () => {
      handleTabFocus();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearInterval(intervalId);
      window.removeEventListener('daily_tracker_data_change', triggerDebouncedSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    await performAutoFetch(true);
    setIsAuthorizing(false);
  };

  if (!meta.enabled || meta.status !== 'needs_permission' || dismissPrompt) {
    return null;
  }

  return (
    <aside
      aria-label="Folder permission required"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-amber-500/30 bg-amber-50/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 shadow-xl animate-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-start gap-2.5">
        <Folder className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Authorize Folder Sync
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-tight">
            Allow access to <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate inline-block max-w-[150px] align-bottom">&quot;{meta.folderName}&quot;</span> to resume automatic two-way sync.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={handleAuthorize}
              disabled={isAuthorizing}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isAuthorizing ? 'Authorizing...' : 'Grant Access'}
            </button>
            <button
              onClick={() => setDismissPrompt(true)}
              className="px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
