'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { exportAllDataAsJSON, importDataFromJSON, getDayData } from '@/lib/storage';
import { generateDayMarkdown, downloadFile } from '@/lib/exportUtils';
import { getTodayDateString } from '@/lib/dateUtils';
import {
  isFileSystemAccessSupported,
  getAutoBackupMeta,
  connectBackupDirectory,
  disconnectBackupDirectory,
  performAutoBackup,
  AutoBackupMeta,
} from '@/lib/autoBackup';
import {
  Download,
  Upload,
  FileCode,
  Check,
  AlertCircle,
  X,
  FileText,
  Folder,
  FolderCheck,
  RefreshCw,
  Unlink,
  HardDrive,
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
}

function formatLastSaved(isoString: string | null): string {
  if (!isoString) return 'Never';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recently';
  }
}

export function ExportImportModal({
  isOpen,
  onClose,
  currentDate,
}: ExportImportModalProps) {
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message?: string;
  }>({ type: 'idle' });
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [autoBackupMeta, setAutoBackupMetaState] = useState<AutoBackupMeta>(() =>
    getAutoBackupMeta()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSupported] = useState(() => isFileSystemAccessSupported());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleMetaChange = (e: Event) => {
      const custom = e as CustomEvent<AutoBackupMeta>;
      if (custom.detail) {
        setAutoBackupMetaState(custom.detail);
      } else {
        setAutoBackupMetaState(getAutoBackupMeta());
      }
    };

    window.addEventListener('dayplanner_autobackup_change', handleMetaChange);
    return () => {
      window.removeEventListener('dayplanner_autobackup_change', handleMetaChange);
    };
  }, []);

  const handleClose = useCallback(() => {
    setImportStatus({ type: 'idle' });
    setPasteText('');
    setShowPaste(false);
    onClose();
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleConnectFolder = async () => {
    setIsSyncing(true);
    const result = await connectBackupDirectory();
    setIsSyncing(false);
    if (!result.success && result.error && result.error !== 'Directory selection cancelled.') {
      setImportStatus({ type: 'error', message: result.error });
    } else if (result.success) {
      setImportStatus({
        type: 'success',
        message: `Connected to "${result.folderName}". Real-time auto-backup active!`,
      });
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const result = await performAutoBackup(true);
    setIsSyncing(false);
    if (result.success) {
      setImportStatus({ type: 'success', message: 'Backup JSON successfully saved to folder!' });
    } else {
      setImportStatus({ type: 'error', message: result.error || 'Failed to save to folder.' });
    }
  };

  const handleDisconnectFolder = async () => {
    await disconnectBackupDirectory();
    setImportStatus({ type: 'idle' });
  };

  const handleExportJSON = () => {
    const json = exportAllDataAsJSON();
    const today = getTodayDateString();
    downloadFile(json, `dayplanner-backup-${today}.json`, 'application/json');
  };

  const handleExportMarkdown = () => {
    const dayData = getDayData(currentDate);
    const md = generateDayMarkdown(dayData);
    downloadFile(md, `${currentDate}.md`, 'text/markdown');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importDataFromJSON(content);
      if (result.success) {
        const parts = [`${result.count} days`];
        if (result.weeksCount) parts.push(`${result.weeksCount} weeks`);
        if (result.monthsCount) parts.push(`${result.monthsCount} months`);
        if (result.settingsRestored) parts.push('settings');
        setImportStatus({
          type: 'success',
          message: `Restored ${parts.join(', ')} successfully!`,
        });
      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Failed to parse JSON file',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    const result = importDataFromJSON(pasteText);
    if (result.success) {
      const parts = [`${result.count} days`];
      if (result.weeksCount) parts.push(`${result.weeksCount} weeks`);
      if (result.monthsCount) parts.push(`${result.monthsCount} months`);
      if (result.settingsRestored) parts.push('settings');
      setImportStatus({
        type: 'success',
        message: `Restored ${parts.join(', ')} successfully!`,
      });
      setPasteText('');
      setShowPaste(false);
    } else {
      setImportStatus({
        type: 'error',
        message: result.error || 'Invalid JSON provided',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Backup & Synchronization
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-mono border border-zinc-200 dark:border-zinc-700/60">
              ESC
            </kbd>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status notification */}
        {importStatus.type !== 'idle' && (
          <div
            className={`mt-3.5 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200/80 dark:border-red-800/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {importStatus.type === 'success' ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              )}
              <span className="truncate">{importStatus.message}</span>
            </div>
            <button
              onClick={() => setImportStatus({ type: 'idle' })}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 shrink-0 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="mt-3.5 space-y-3.5">
          {/* Section 1: Local Folder Auto-Backup */}
          <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Local Folder Auto-Backup
                </span>
              </div>
              {isSupported && autoBackupMeta.enabled && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    autoBackupMeta.status === 'synced'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : autoBackupMeta.status === 'saving'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : autoBackupMeta.status === 'needs_permission'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      autoBackupMeta.status === 'synced'
                        ? 'bg-emerald-500 animate-pulse'
                        : autoBackupMeta.status === 'saving'
                        ? 'bg-blue-500 animate-spin'
                        : autoBackupMeta.status === 'needs_permission'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                  />
                  {autoBackupMeta.status === 'synced' && 'Auto-Saving Active'}
                  {autoBackupMeta.status === 'saving' && 'Saving...'}
                  {autoBackupMeta.status === 'needs_permission' && 'Needs Permission'}
                  {autoBackupMeta.status === 'error' && 'Sync Error'}
                  {autoBackupMeta.status === 'idle' && 'Idle'}
                </span>
              )}
            </div>

            {!isSupported ? (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Direct folder auto-saving requires Chrome, Edge, Brave, Arc, or Opera desktop. You can still export and restore manually using the tools below.
              </p>
            ) : !autoBackupMeta.enabled ? (
              <div className="space-y-2.5">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Select a local folder on your computer. DayPlanner will automatically save and sync your full backup JSON (<code className="text-[10px] font-mono bg-zinc-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded">dayplanner-backup.json</code>) there in real time — zero manual backups required.
                </p>
                <button
                  onClick={handleConnectFolder}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {isSyncing ? 'Connecting...' : 'Select Backup Folder'}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {autoBackupMeta.folderName}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        dayplanner-backup.json
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400 shrink-0 text-right">
                    <div>Last saved</div>
                    <div className="font-medium text-zinc-600 dark:text-zinc-300">
                      {formatLastSaved(autoBackupMeta.lastSavedAt)}
                    </div>
                  </div>
                </div>

                {autoBackupMeta.status === 'needs_permission' && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                    <span>Browser write permission required.</span>
                    <button
                      onClick={handleSyncNow}
                      className="px-2 py-1 bg-amber-600 text-white text-[10px] font-medium rounded hover:bg-amber-700 transition-colors cursor-pointer"
                    >
                      Authorize Access
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Saving...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={handleConnectFolder}
                    disabled={isSyncing}
                    className="py-1.5 px-2.5 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    Change Folder
                  </button>
                  <button
                    onClick={handleDisconnectFolder}
                    disabled={isSyncing}
                    className="py-1.5 px-2.5 text-xs font-medium rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-800/60 transition-colors cursor-pointer disabled:opacity-50"
                    title="Disconnect auto-backup folder"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Manual Export & Restore */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 overflow-hidden">
            {/* Row 1: Full System Backup (.json) */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileCode className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    Full System Backup (.json)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    All days, weeks, months, habits, and settings
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportJSON}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                Export JSON
              </button>
            </div>

            {/* Row 2: Export Current Day Markdown */}
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    Active Day ({currentDate}.md)
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    Markdown summary of active day
                  </div>
                </div>
              </div>
              <button
                onClick={handleExportMarkdown}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                Export MD
              </button>
            </div>

            {/* Row 3: Restore */}
            <div className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Upload className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      Restore from Backup
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Import JSON backup file
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shadow-2xs cursor-pointer"
                  >
                    Select File
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaste(!showPaste)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      showPaste
                        ? 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
                        : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    Paste
                  </button>
                </div>
              </div>

              {/* Paste expansion */}
              {showPaste && (
                <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 space-y-2 animate-in fade-in duration-100">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste JSON backup content here..."
                    rows={4}
                    className="w-full text-xs font-mono p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaste(false);
                        setPasteText('');
                      }}
                      className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteImport}
                      disabled={!pasteText.trim()}
                      className="px-3 py-1 text-xs font-medium rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Confirm Restore
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
