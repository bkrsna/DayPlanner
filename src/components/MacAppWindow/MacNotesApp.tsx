'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { NoteIdeaItem } from '@/types';
import {
  Search,
  Plus,
  Pin,
  Trash2,
  Lightbulb,
  FileText,
  CheckCheck,
  Eye,
  Edit3,
  Sparkles,
  Bold,
  Italic,
  List,
  CheckSquare,
  Code,
  Quote,
  Heading,
  Import,
  Copy,
  Download,
  Tag,
  X,
  ChevronLeft,
  ArrowRightCircle,
  Check,
} from 'lucide-react';

interface MacNotesAppProps {
  notes: NoteIdeaItem[];
  onAddNoteIdea: (item: Omit<NoteIdeaItem, 'id' | 'createdAt' | 'updatedAt'>) => NoteIdeaItem;
  onUpdateNoteIdea: (id: string, updates: Partial<NoteIdeaItem>) => void;
  onDeleteNoteIdea: (id: string) => void;
  onTogglePinNoteIdea: (id: string) => void;
  currentDate: string;
  journalText?: string;
  onAddTodo?: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Markdown Renderer Component
// ---------------------------------------------------------------------------
interface MarkdownRendererProps {
  content: string;
  onToggleCheckbox: (lineIndex: number, checked: boolean) => void;
  onSendTaskToTodo?: (taskText: string) => void;
}

function MarkdownRenderer({ content, onToggleCheckbox, onSendTaskToTodo }: MarkdownRendererProps) {
  const lines = useMemo(() => content.split('\n'), [content]);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const copyCode = (codeText: string, idx: number) => {
    navigator.clipboard?.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  // Group lines into blocks (handling multi-line code blocks)
  interface Block {
    type: 'code' | 'line';
    lineIndex: number;
    lines: string[];
    language?: string;
  }

  const blocks = useMemo(() => {
    const result: Block[] = [];
    let inCode = false;
    let codeBuffer: string[] = [];
    let codeStartIdx = 0;
    let codeLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        if (!inCode) {
          inCode = true;
          codeStartIdx = i;
          codeLang = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCode = false;
          result.push({
            type: 'code',
            lineIndex: codeStartIdx,
            lines: codeBuffer,
            language: codeLang,
          });
          codeBuffer = [];
          codeLang = '';
        }
      } else if (inCode) {
        codeBuffer.push(line);
      } else {
        result.push({
          type: 'line',
          lineIndex: i,
          lines: [line],
        });
      }
    }

    if (inCode && codeBuffer.length > 0) {
      result.push({
        type: 'code',
        lineIndex: codeStartIdx,
        lines: codeBuffer,
        language: codeLang,
      });
    }

    return result;
  }, [lines]);

  // Helper to format inline markdown: bold, italic, code, tags, links
  const renderInline = (text: string) => {
    if (!text) return null;

    // Tokenize markdown bold, italic, inline code, tags, urls
    const parts: (string | React.ReactNode)[] = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|~~[^~]+~~|#[a-zA-Z0-9_\-]+|https?:\/\/[^\s]+)/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }
      const token = match[0];
      const key = `${match.index}-${token}`;

      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={key} className="font-semibold text-zinc-900 dark:text-zinc-100">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={key} className="italic">{token.slice(1, -1)}</em>);
      } else if (token.startsWith('~~') && token.endsWith('~~')) {
        parts.push(<del key={key} className="line-through text-zinc-400">{token.slice(2, -2)}</del>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={key} className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400 font-mono text-xs">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('#')) {
        parts.push(
          <span key={key} className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-medium">
            {token}
          </span>
        );
      } else if (token.startsWith('http')) {
        parts.push(
          <a key={key} href={token} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {token}
          </a>
        );
      } else {
        parts.push(token);
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  if (content.trim().length === 0) {
    return <p className="text-zinc-400 italic py-4">No content to preview.</p>;
  }

  return (
    <div className="space-y-2 font-sans text-sm sm:text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
      {blocks.map((block, blockIdx) => {
        if (block.type === 'code') {
          const codeString = block.lines.join('\n');
          return (
            <div
              key={blockIdx}
              className="relative my-3 rounded-2xl bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs p-4 overflow-x-auto shadow-sm group"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-zinc-400 text-[11px]">
                <span>{block.language || 'code'}</span>
                <button
                  onClick={() => copyCode(codeString, blockIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedCodeIdx === blockIdx ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="whitespace-pre overflow-x-auto">{codeString}</pre>
            </div>
          );
        }

        const line = block.lines[0];
        const trimmed = line.trim();

        // Horizontal rule
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={blockIdx} className="my-4 border-zinc-200 dark:border-zinc-800" />;
        }

        // Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={blockIdx} className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-4 mb-2">
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={blockIdx} className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-3 mb-1.5">
              {renderInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={blockIdx} className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-200 mt-2 mb-1">
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={blockIdx}
              className="pl-3.5 my-2 border-l-3 border-amber-500/80 bg-amber-50/20 dark:bg-amber-950/20 py-1.5 rounded-r-xl italic text-zinc-700 dark:text-zinc-300"
            >
              {renderInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Checkbox Task Item (- [ ] or - [x])
        const checkboxMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.*)$/);
        if (checkboxMatch) {
          const isChecked = checkboxMatch[1].toLowerCase() === 'x';
          const taskLabel = checkboxMatch[2];

          return (
            <div
              key={blockIdx}
              className="group flex items-center justify-between gap-2.5 py-1 px-2 -mx-2 rounded-xl hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <button
                  onClick={() => onToggleCheckbox(block.lineIndex, !isChecked)}
                  className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                    isChecked
                      ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                      : 'border-zinc-300 dark:border-zinc-600 hover:border-amber-500'
                  }`}
                  title={isChecked ? 'Mark as incomplete' : 'Mark as completed'}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    isChecked
                      ? 'line-through text-zinc-400 dark:text-zinc-500'
                      : 'text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  {renderInline(taskLabel)}
                </span>
              </div>

              {/* Optional Quick Convert to Daily Todo */}
              {onSendTaskToTodo && !isChecked && taskLabel.trim() && (
                <button
                  onClick={() => onSendTaskToTodo(taskLabel.trim())}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 hover:underline px-1.5 py-0.5 rounded bg-amber-500/10 transition-opacity shrink-0"
                  title="Send this checklist item directly to today's To-Dos"
                >
                  <ArrowRightCircle className="w-3 h-3" />
                  <span>To-Do</span>
                </button>
              )}
            </div>
          );
        }

        // Bullet List (- or *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={blockIdx} className="flex items-start gap-2.5 pl-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <span className="flex-1 text-sm">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Empty line
        if (trimmed === '') {
          return <div key={blockIdx} className="h-2" />;
        }

        // Regular paragraph
        return (
          <p key={blockIdx} className="text-sm sm:text-base leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main MacNotesApp
// ---------------------------------------------------------------------------
export function MacNotesApp({
  notes,
  onAddNoteIdea,
  onUpdateNoteIdea,
  onDeleteNoteIdea,
  onTogglePinNoteIdea,
  currentDate,
  journalText = '',
  onAddTodo,
}: MacNotesAppProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'idea' | 'note' | 'pinned'>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [addedTodoSuccess, setAddedTodoSuccess] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  // Collect all unique tags across notes
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => {
      n.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [notes]);

  // Filter notes list
  const filteredNotes = useMemo(() => {
    let list = [...notes];

    // Category / pinned filter
    if (activeFilter === 'idea') {
      list = list.filter((n) => n.type === 'idea');
    } else if (activeFilter === 'note') {
      list = list.filter((n) => n.type === 'note');
    } else if (activeFilter === 'pinned') {
      list = list.filter((n) => n.pinned);
    }

    // Tag filter
    if (selectedTagFilter) {
      list = list.filter((n) => n.tags?.includes(selectedTagFilter));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort: pinned first, then by updatedAt desc
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, activeFilter, selectedTagFilter, searchQuery]);

  // Synchronize selection: ensure activeNote tracks filtered list
  const activeNote = useMemo(() => {
    if (filteredNotes.length === 0) return null;
    const found = filteredNotes.find((n) => n.id === selectedNoteId);
    return found || filteredNotes[0];
  }, [filteredNotes, selectedNoteId]);

  const handleCreateNote = useCallback(
    (type: 'note' | 'idea') => {
      const isIdea = type === 'idea';
      const newNote = onAddNoteIdea({
        title: isIdea ? 'New Idea' : 'New Note',
        content: '',
        type,
        tags: selectedTagFilter ? [selectedTagFilter] : [],
        pinned: false,
      });
      setSelectedNoteId(newNote.id);
      setPreviewMode(false);
      setMobileView('editor');
    },
    [onAddNoteIdea, selectedTagFilter]
  );

  // Keyboard shortcuts (Cmd/Ctrl+N for new note, Cmd/Ctrl+Shift+I for new idea, Cmd/Ctrl+P for preview)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger new note shortcuts when user is typing in inputs or textareas
      const activeEl = document.activeElement;
      const isTyping =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        handleCreateNote('note');
      } else if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'i' && !isTyping) {
        e.preventDefault();
        handleCreateNote('idea');
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'p' && !isTyping) {
        e.preventDefault();
        setPreviewMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateNote]);

  const handleApplyTemplate = (
    templateTitle: string,
    templateBody: string,
    type: 'note' | 'idea',
    tags: string[] = []
  ) => {
    const newNote = onAddNoteIdea({
      title: templateTitle,
      content: templateBody,
      type,
      tags,
      pinned: false,
    });
    setSelectedNoteId(newNote.id);
    setShowTemplates(false);
    setPreviewMode(false);
    setMobileView('editor');
  };

  const handleImportJournal = () => {
    if (!journalText.trim()) return;
    const newNote = onAddNoteIdea({
      title: `Journal Reflection - ${currentDate}`,
      content: journalText,
      type: 'note',
      tags: ['journal'],
      pinned: false,
    });
    setSelectedNoteId(newNote.id);
    setMobileView('editor');
  };

  const handleDeleteActiveNote = (id: string) => {
    onDeleteNoteIdea(id);
    const remaining = notes.filter((n) => n.id !== id);
    if (remaining.length > 0) {
      setSelectedNoteId(remaining[0].id);
    } else {
      setSelectedNoteId(null);
      setMobileView('list');
    }
  };

  const handleInsertMarkdown = (prefix: string, suffix: string = '') => {
    if (!activeNote) return;
    const textarea = document.getElementById('mac-note-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = activeNote.content;
    const selected = current.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    const nextContent = current.substring(0, start) + replacement + current.substring(end);

    onUpdateNoteIdea(activeNote.id, { content: nextContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  // Toggle interactive markdown checkbox
  const handleToggleCheckbox = (targetLineIdx: number, newChecked: boolean) => {
    if (!activeNote) return;
    const lines = activeNote.content.split('\n');
    if (targetLineIdx < 0 || targetLineIdx >= lines.length) return;

    const line = lines[targetLineIdx];
    const updatedLine = newChecked
      ? line.replace(/^-\s*\[\s*\]/, '- [x]')
      : line.replace(/^-\s*\[[xX]\]/, '- [ ]');

    lines[targetLineIdx] = updatedLine;
    onUpdateNoteIdea(activeNote.id, { content: lines.join('\n') });
  };

  // Convert checklist item or whole note to daily todo
  const handleSendToDailyTodo = (todoText: string) => {
    if (!onAddTodo || !todoText.trim()) return;
    onAddTodo(todoText.trim());
    setAddedTodoSuccess(true);
    setTimeout(() => setAddedTodoSuccess(false), 2200);
  };

  // Add tag to active note
  const handleAddTag = () => {
    if (!activeNote || !newTagInput.trim()) return;
    const tag = newTagInput.trim().replace(/^#/, '').toLowerCase();
    const currentTags = activeNote.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdateNoteIdea(activeNote.id, { tags: [...currentTags, tag] });
    }
    setNewTagInput('');
    setIsAddingTag(false);
  };

  // Remove tag from active note
  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNote) return;
    const currentTags = activeNote.tags || [];
    onUpdateNoteIdea(activeNote.id, {
      tags: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  // Copy note content
  const handleCopyNote = () => {
    if (!activeNote) return;
    const text = `# ${activeNote.title}\n\n${activeNote.content}`;
    navigator.clipboard?.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Download note as markdown file
  const handleDownloadNote = () => {
    if (!activeNote) return;
    const text = `# ${activeNote.title}\n\n${activeNote.content}`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'note'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ideasCount = notes.filter((n) => n.type === 'idea').length;
  const notesCount = notes.filter((n) => n.type === 'note').length;
  const pinnedCount = notes.filter((n) => n.pinned).length;

  const wordCount = activeNote?.content
    ? activeNote.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = activeNote?.content ? activeNote.content.length : 0;

  return (
    <div className="flex h-full bg-[#fbfbfd] dark:bg-[#18181b] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-amber-500/20 overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* Left Sidebar: Notes & Ideas List                              */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`w-full md:w-72 lg:w-80 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 flex flex-col shrink-0 transition-all duration-200 ${
          mobileView === 'editor' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Header: Search & Filter Tabs */}
        <div className="p-3.5 space-y-2.5 border-b border-zinc-200/70 dark:border-zinc-800/70">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, content, or #tags..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 text-xs placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium pb-0.5 scrollbar-none">
            <button
              onClick={() => {
                setActiveFilter('all');
                setSelectedTagFilter(null);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                activeFilter === 'all' && !selectedTagFilter
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
              }`}
            >
              All ({notes.length})
            </button>
            <button
              onClick={() => setActiveFilter('idea')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                activeFilter === 'idea'
                  ? 'bg-amber-500 text-white font-semibold shadow-2xs'
                  : 'text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Lightbulb className="w-3 h-3" />
              <span>Ideas ({ideasCount})</span>
            </button>
            <button
              onClick={() => setActiveFilter('note')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                activeFilter === 'note'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Notes ({notesCount})</span>
            </button>
            {pinnedCount > 0 && (
              <button
                onClick={() => setActiveFilter('pinned')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all shrink-0 ${
                  activeFilter === 'pinned'
                    ? 'bg-purple-600 text-white font-semibold shadow-2xs'
                    : 'text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10'
                }`}
              >
                <Pin className="w-3 h-3" />
                <span>({pinnedCount})</span>
              </button>
            )}
          </div>

          {/* Tags Filter Row (if any tags exist) */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono py-1 border-t border-zinc-200/60 dark:border-zinc-800/60 scrollbar-none">
              <span className="text-zinc-400 shrink-0">Tags:</span>
              {allTags.map((tag) => {
                const isSelected = selectedTagFilter === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                    className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-white font-semibold'
                        : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-amber-500/20'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action Buttons: Add Note, Add Idea */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => handleCreateNote('idea')}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-all shadow-2xs"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>+ Idea</span>
            </button>
            <button
              onClick={() => handleCreateNote('note')}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-semibold bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300/80 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Note</span>
            </button>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50 p-2 space-y-1">
          {filteredNotes.map((note) => {
            const isSelected = activeNote?.id === note.id;
            const updatedDate = new Date(note.updatedAt);
            const timeStr = updatedDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setMobileView('editor');
                }}
                className={`group relative p-3 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 shadow-2xs'
                    : 'hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {note.type === 'idea' ? (
                      <span className="shrink-0 p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Lightbulb className="w-3 h-3 fill-current" />
                      </span>
                    ) : (
                      <span className="shrink-0 p-1 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        <FileText className="w-3 h-3" />
                      </span>
                    )}
                    <span
                      className={`font-medium text-xs truncate ${
                        isSelected
                          ? 'text-zinc-950 dark:text-white font-semibold'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {note.title.trim() || (note.type === 'idea' ? 'Untitled Idea' : 'Untitled Note')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {note.pinned && (
                      <Pin className="w-3 h-3 text-amber-500 fill-amber-500 rotate-45" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteActiveNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-rose-500 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content snippet */}
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                  {note.content.trim() || 'Empty note'}
                </p>

                {/* Tags chips in list */}
                {note.tags && note.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500 font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer time */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{timeStr}</span>
                  <span className="uppercase tracking-wider text-[9px] px-1 rounded bg-zinc-200/50 dark:bg-zinc-800 text-zinc-500">
                    {note.type}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredNotes.length === 0 && (
            <div className="py-12 px-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {searchQuery || selectedTagFilter ? 'No matching notes found' : 'No notes or ideas yet'}
              </p>
              <button
                onClick={() => handleCreateNote('idea')}
                className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Create your first idea
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer: Daily JSON sync info */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <CheckCheck className="w-3 h-3 text-emerald-500" />
            <span>Saved in daily JSON</span>
          </span>
          <span className="font-mono text-[9px] text-zinc-400">{currentDate}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Right Main Panel: Note Editor & Markdown                      */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col bg-white dark:bg-zinc-900/90 overflow-hidden ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeNote ? (
          <>
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 text-xs">
              {/* Left Toolbar: Mobile Back + Formatting shortcuts */}
              <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 overflow-x-auto">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden flex items-center gap-1 px-2 py-1 -ml-1 mr-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Notes</span>
                </button>

                <button
                  onClick={() => handleInsertMarkdown('**', '**')}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Bold (**text**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertMarkdown('*', '*')}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Italic (*text*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertMarkdown('### ')}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Heading (### )"
                >
                  <Heading className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertMarkdown('- ')}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Bullet List (- )"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertMarkdown('- [ ] ')}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Interactive Checkbox Task (- [ ] )"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertMarkdown('```\n', '\n```')}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Code Block"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertMarkdown('> ')}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Blockquote (> )"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

                {/* Templates Dropdown */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowTemplates((prev) => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Templates</span>
                  </button>

                  {showTemplates && (
                    <div className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl bg-white dark:bg-zinc-900 p-2 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase px-2 py-1">
                        Starter Templates
                      </div>
                      <button
                        onClick={() =>
                          handleApplyTemplate(
                            'Brainstorm Idea',
                            '## 🎯 Objective\nWhat problem does this solve?\n\n## 💡 Core Concept\nDescribe the approach...\n\n## 🛠️ Architecture / Checklist\n- [ ] Prototype phase 1\n- [ ] Review with team',
                            'idea',
                            ['brainstorm']
                          )
                        }
                        className="w-full text-left px-2 py-1.5 rounded-xl text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                      >
                        💡 Brainstorm Idea
                      </button>
                      <button
                        onClick={() =>
                          handleApplyTemplate(
                            'Meeting Notes',
                            '## 👥 Attendees\n- \n\n## 📋 Agenda & Discussion\n- Point 1\n- Point 2\n\n## ⚡ Action Items\n- [ ] Task 1\n- [ ] Task 2',
                            'note',
                            ['meeting']
                          )
                        }
                        className="w-full text-left px-2 py-1.5 rounded-xl text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                      >
                        📝 Meeting Notes
                      </button>
                      <button
                        onClick={() =>
                          handleApplyTemplate(
                            'Daily Scratchpad',
                            '### Quick Notes\n- \n\n### Open Questions\n- \n',
                            'note',
                            ['scratchpad']
                          )
                        }
                        className="w-full text-left px-2 py-1.5 rounded-xl text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                      >
                        ⚡ Quick Scratchpad
                      </button>
                    </div>
                  )}
                </div>

                {/* Import Journal */}
                {journalText.trim() && (
                  <button
                    onClick={handleImportJournal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors shrink-0"
                    title="Convert today's journal reflection into a dedicated note"
                  >
                    <Import className="w-3.5 h-3.5" />
                    <span>Import Journal</span>
                  </button>
                )}
              </div>

              {/* Right Toolbar: Add to To-Do, Copy, Download, Pin, Edit/Preview, Delete */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Send Note/Idea to Daily To-Dos */}
                {onAddTodo && (
                  <button
                    onClick={() => handleSendToDailyTodo(activeNote.title || 'Note item')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      addedTodoSuccess
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    title="Add this note or idea as a task into today's To-Dos"
                  >
                    {addedTodoSuccess ? (
                      <>
                        <CheckCheck className="w-3 h-3" />
                        <span>Added to To-Dos!</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Add to To-Dos</span>
                      </>
                    )}
                  </button>
                )}

                {/* Copy Note */}
                <button
                  onClick={handleCopyNote}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Copy note content"
                >
                  {copiedNotification ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Download as Markdown */}
                <button
                  onClick={handleDownloadNote}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Export note as .md file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Note/Idea Type Toggle */}
                <button
                  onClick={() =>
                    onUpdateNoteIdea(activeNote.id, {
                      type: activeNote.type === 'idea' ? 'note' : 'idea',
                    })
                  }
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeNote.type === 'idea'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                  }`}
                  title="Toggle between Idea and Note"
                >
                  {activeNote.type === 'idea' ? (
                    <>
                      <Lightbulb className="w-3 h-3 fill-current" />
                      <span>Idea</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3" />
                      <span>Note</span>
                    </>
                  )}
                </button>

                {/* Pin Button */}
                <button
                  onClick={() => onTogglePinNoteIdea(activeNote.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    activeNote.pinned
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                  title={activeNote.pinned ? 'Unpin note' : 'Pin note to top'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                {/* Edit / Preview Toggle */}
                <button
                  onClick={() => setPreviewMode((prev) => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    previewMode
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                  }`}
                  title="Toggle Markdown Preview (Cmd+P)"
                >
                  {previewMode ? (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </>
                  )}
                </button>

                {/* Delete Note */}
                <button
                  onClick={() => handleDeleteActiveNote(activeNote.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note Title & Tags Header */}
            <div className="px-6 sm:px-8 pt-5 pb-2 space-y-2">
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => onUpdateNoteIdea(activeNote.id, { title: e.target.value })}
                placeholder="Note or Idea Title..."
                className="w-full text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 bg-transparent border-none outline-none tracking-tight font-sans"
              />

              {/* Tags Bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {activeNote.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 font-mono text-xs"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-rose-500 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}

                {/* Add Tag Input */}
                {isAddingTag ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTag();
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsAddingTag(false);
                        }
                      }}
                      placeholder="tag name..."
                      autoFocus
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-amber-500 text-xs font-mono outline-none w-24"
                    />
                    <button
                      onClick={handleAddTag}
                      className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-1"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setIsAddingTag(false)}
                      className="text-xs text-zinc-400 px-0.5"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 font-mono px-2 py-0.5 rounded-md hover:bg-amber-500/10 transition-colors"
                  >
                    <Tag className="w-3 h-3" />
                    <span>+ Tag</span>
                  </button>
                )}

                <span className="text-zinc-300 dark:text-zinc-700 mx-1">&bull;</span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Updated {new Date(activeNote.updatedAt).toLocaleTimeString()}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 mx-1">&bull;</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  <CheckCheck className="w-3 h-3" />
                  Auto-saved in daily JSON
                </span>
              </div>
            </div>

            {/* Editor Body or Markdown Preview */}
            <div className="flex-1 px-6 sm:px-8 py-3 overflow-y-auto">
              {!previewMode ? (
                <textarea
                  id="mac-note-textarea"
                  value={activeNote.content}
                  onChange={(e) => onUpdateNoteIdea(activeNote.id, { content: e.target.value })}
                  placeholder="Capture your thoughts, ideas, specifications, brainstorms, or action checklists here... Supports markdown formatting."
                  className="w-full h-full min-h-[360px] bg-transparent border-none outline-none resize-none text-zinc-800 dark:text-zinc-200 text-sm sm:text-base leading-relaxed font-sans placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              ) : (
                <div className="py-2">
                  <MarkdownRenderer
                    content={activeNote.content}
                    onToggleCheckbox={handleToggleCheckbox}
                    onSendTaskToTodo={onAddTodo ? handleSendToDailyTodo : undefined}
                  />
                </div>
              )}
            </div>

            {/* Editor Footer Status Bar */}
            <div className="px-6 sm:px-8 py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-3">
                <span>{wordCount} words</span>
                <span>&bull;</span>
                <span>{charCount} characters</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                <span>Daily Log JSON:</span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                  daily_goal_tracker_day_{currentDate}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <Lightbulb className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              Select or Create an Idea / Note
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-4">
              All ideas and notes are saved directly into the main JSON of your daily tracker.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCreateNote('idea')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-400 transition-colors shadow-xs"
              >
                + New Idea
              </button>
              <button
                onClick={() => handleCreateNote('note')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-xs"
              >
                + New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
