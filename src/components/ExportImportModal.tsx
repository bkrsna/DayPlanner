'use client';

import { useState } from 'react';
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
          message: `Successfully imported ${result.count} days of records!`,
        });
      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Failed to parse JSON file.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    const result = importDataFromJSON(pasteText);
    if (result.success) {
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${result.count} days of records!`,
      });
      setPasteText('');
      setShowPaste(false);
    } else {
      setImportStatus({
        type: 'error',
        message: result.error || 'Invalid JSON provided.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-500" />
              <span>Data Portability & Backup</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              100% private. All your data lives locally in your browser.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status notice */}
        {importStatus.type !== 'idle' && (
          <div
            className={`my-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {importStatus.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="my-5 space-y-3">
          {/* Export Day as Markdown */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Export Current Day as Markdown</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Download {currentDate}.md ready for Obsidian, Logseq, or Notion.
              </p>
            </div>
            <button
              onClick={handleExportMarkdown}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shrink-0"
            >
              Export .md
            </button>
          </div>

          {/* Export Full Backup JSON */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                <span>Full System Backup (JSON)</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Export all historical days, tasks, habits, and reflections in a single file.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 shadow-xs"
            >
              Download JSON
            </button>
          </div>

          {/* Restore / Import */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Restore from Backup</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Import a previously saved JSON file to restore your progress.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700">
                  <span>Select File</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setShowPaste(!showPaste)}
                  className="px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  {showPaste ? 'Hide' : 'Paste'}
                </button>
              </div>
            </div>

            {showPaste && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste backup JSON content here..."
                  rows={4}
                  className="w-full text-xs font-mono p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none"
                />
                <button
                  onClick={handlePasteImport}
                  disabled={!pasteText.trim()}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                >
                  Confirm Restore
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
