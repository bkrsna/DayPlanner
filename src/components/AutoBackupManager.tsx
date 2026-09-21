'use client';

import { useEffect, useRef } from 'react';
import {
  getAutoBackupMeta,
  getSavedDirectoryHandle,
  verifyDirectoryPermission,
  performAutoBackup,
  setAutoBackupMeta,
} from '@/lib/autoBackup';

export function AutoBackupManager() {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Initial health check on mount
    const checkStatus = async () => {
      const meta = getAutoBackupMeta();
      if (!meta.enabled) return;

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
          errorMessage: `Permission required to write to folder "${meta.folderName}". Click Reconnect to authorize.`,
        });
      }
    };

    checkStatus();

    // 2. Debounced auto-save handler on data change
    const triggerDebouncedSave = () => {
      const meta = getAutoBackupMeta();
      if (!meta.enabled) return;

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
      const meta = getAutoBackupMeta();
      if (meta.enabled && meta.status === 'synced') {
        performAutoBackup(false);
      }
    }, 5 * 60 * 1000);

    // 4. Flush on visibility change or page unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingSaveRef.current) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        pendingSaveRef.current = false;
        performAutoBackup(false);
      }
    };

    const handleBeforeUnload = () => {
      if (pendingSaveRef.current) {
        performAutoBackup(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearInterval(intervalId);
      window.removeEventListener('daily_tracker_data_change', triggerDebouncedSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
}
