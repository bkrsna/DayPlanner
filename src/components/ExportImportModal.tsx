'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { exportAllDataAsJSON, importDataFromJSON, getDayData } from '@/lib/storage';
import { generateDayMarkdown, downloadFile } from '@/lib/exportUtils';
import { getTodayDateString } from '@/lib/dateUtils';
import {
  Download,
  Upload,
  FileCode,
  Check,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportJSON = () => {
    const json = exportAllDataAsJSON();
    const today = getTodayDateString();
    downloadFile(json, `daily-goals-backup-${today}.json`, 'application/json');
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
        setImportStatus({
          type: 'success',
          message: `Imported ${result.count} days of records`,
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
      setImportStatus({
        type: 'success',
        message: `Imported ${result.count} days of records`,
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
        className="relative w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Backup & Export
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

        {/* Actions List */}
        <div className="mt-3.5 divide-y divide-zinc-100 dark:divide-zinc-800/80 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-950/40 overflow-hidden">
          {/* Row 1: Export Current Day */}
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                Current Day ({currentDate}.md)
              </span>
            </div>
            <button
              onClick={handleExportMarkdown}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Export
            </button>
          </div>

          {/* Row 2: Export All JSON */}
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCode className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                Full System Backup (.json)
              </span>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              Export
            </button>
          </div>

          {/* Row 3: Restore */}
          <div className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Upload className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  Restore from Backup
                </span>
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
  );
}
