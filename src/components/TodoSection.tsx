'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { TodoItem, Priority } from '@/types';
import confetti from 'canvas-confetti';
import {
  Plus,
  Check,
  Circle,
  Trash2,
  Flame,
  Clock,
  Tag,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  CheckCheck,
  Pencil,
  ArrowRight,
  Timer,
  ListPlus,
  ListChecks,
  CornerDownRight,
  GripVertical,
} from 'lucide-react';

interface TodoSectionProps {
  todos: TodoItem[];
  title?: string;
  placeholder?: string;
  rolloverTitle?: string;
  onAddTodo: (text: string, priority: Priority, tag?: string, estimate?: string, isSpecial?: boolean) => void;
  onToggleTodo: (id: string) => void;
  onToggleInProgress?: (id: string) => void;
  onAddSubTask?: (todoId: string, text: string) => void;
  onToggleSubTask?: (todoId: string, subtaskId: string) => void;
  onDeleteSubTask?: (todoId: string, subtaskId: string) => void;
  onUpdateSubTask?: (todoId: string, subtaskId: string, text: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<TodoItem>) => void;
  onReorderTodos?: (sourceId: string, targetId: string, position?: 'before' | 'after') => void;
  onClearCompleted?: () => void;
  onRollover: () => void;
  hasPreviousTasks: boolean;
}

const PRESET_TAGS = ['design', 'dev', 'deepwork', 'ops', 'review', 'health', 'personal'];
const PRESET_ESTIMATES = ['15m', '30m', '45m', '1h', '2h', '3h'];

export function TodoSection({
  todos,
  title = 'To-Dos',
  placeholder = 'Add a new task...',
  rolloverTitle = 'Rollover unfinished tasks',
  onAddTodo,
  onToggleTodo,
  onToggleInProgress,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
  onUpdateSubTask,
  onDeleteTodo,
  onUpdateTodo,
  onReorderTodos,
  onClearCompleted,
  onRollover,
  hasPreviousTasks,
}: TodoSectionProps) {
  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedEstimate, setSelectedEstimate] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'active' | 'in_progress' | 'completed' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showEstimateMenu, setShowEstimateMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Drag-and-drop state
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  // Subtask management state
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});
  const [activeSubtaskInputId, setActiveSubtaskInputId] = useState<string | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskText, setEditSubtaskText] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);
  const estimateMenuRef = useRef<HTMLDivElement>(null);
  const prevCompletedCountRef = useRef<number>(0);

  // Regular todos (all todos)
  const regularTodos = todos;

  const totalCount = regularTodos.length;
  const completedCount = useMemo(() => regularTodos.filter((t) => t.completed).length, [regularTodos]);
  const inProgressCount = useMemo(
    () => regularTodos.filter((t) => !t.completed && t.status === 'in_progress').length,
    [regularTodos]
  );
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Celebration confetti on 100% completion
  useEffect(() => {
    if (
      totalCount > 0 &&
      completedCount === totalCount &&
      prevCompletedCountRef.current < totalCount
    ) {
      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.7 },
          colors: ['#10b981', '#6366f1', '#f59e0b', '#3b82f6'],
        });
      } catch {
        // ignore if not supported
      }
    }
    prevCompletedCountRef.current = completedCount;
  }, [completedCount, totalCount]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target as Node)) {
        setShowTagMenu(false);
      }
      if (estimateMenuRef.current && !estimateMenuRef.current.contains(e.target as Node)) {
        setShowEstimateMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cycle priority: medium -> high -> low -> medium
  const cyclePriority = () => {
    if (priority === 'medium') setPriority('high');
    else if (priority === 'high') setPriority('low');
    else setPriority('medium');
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim()) return;

    onAddTodo(
      newText.trim(),
      priority,
      selectedTag || undefined,
      selectedEstimate || undefined
    );

    setNewText('');
    setSelectedTag('');
    setSelectedEstimate('');
    setPriority('medium');
    setShowTagMenu(false);
    setShowEstimateMenu(false);
  };

  const handleStartEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setTimeout(() => editInputRef.current?.focus(), 30);
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) {
      onUpdateTodo(id, { text: editText.trim() });
    }
    setEditingId(null);
  };

  // Subtask handlers
  const handleAddSubtask = (todoId: string) => {
    const text = (subtaskInputs[todoId] || '').trim();
    if (!text) return;
    onAddSubTask?.(todoId, text);
    setSubtaskInputs((prev) => ({ ...prev, [todoId]: '' }));
    setExpandedSubtasks((prev) => ({ ...prev, [todoId]: true }));
  };

  const toggleSubtasksExpanded = (todoId: string, currentExpanded?: boolean) => {
    setExpandedSubtasks((prev) => {
      const isCurrentlyExpanded = currentExpanded !== undefined ? currentExpanded : Boolean(prev[todoId]);
      return { ...prev, [todoId]: !isCurrentlyExpanded };
    });
  };

  const handleOpenSubtaskInput = (todoId: string) => {
    setExpandedSubtasks((prev) => ({ ...prev, [todoId]: true }));
    setActiveSubtaskInputId(todoId);
  };

  const handleStartEditSubtask = (subId: string, currentText: string) => {
    setEditingSubtaskId(subId);
    setEditSubtaskText(currentText);
  };

  const handleSaveSubtaskEdit = (todoId: string, subId: string) => {
    if (editSubtaskText.trim() && onUpdateSubTask) {
      onUpdateSubTask(todoId, subId, editSubtaskText.trim());
    }
    setEditingSubtaskId(null);
    setEditSubtaskText('');
  };

  // Drag-and-drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (editingId) {
      e.preventDefault();
      return;
    }
    setDraggedTodoId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedTodoId || draggedTodoId === id) return;
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const isBottom = e.clientY - rect.top > rect.height / 2;
    const position: 'before' | 'after' = isBottom ? 'after' : 'before';
    if (dragOverInfo?.id !== id || dragOverInfo?.position !== position) {
      setDragOverInfo({ id, position });
    }
  };

  const handleDragLeave = (e: React.DragEvent, id: string) => {
    if (dragOverInfo?.id === id) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX >= rect.right ||
        e.clientY < rect.top ||
        e.clientY >= rect.bottom
      ) {
        setDragOverInfo(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedTodoId && draggedTodoId !== targetId) {
      const position = dragOverInfo?.position || 'before';
      onReorderTodos?.(draggedTodoId, targetId, position);
    }
    setDraggedTodoId(null);
    setDragOverInfo(null);
  };

  const handleDragEnd = () => {
    setDraggedTodoId(null);
    setDragOverInfo(null);
  };

  // Filter & Search
  const filteredTodos = useMemo(() => {
    return regularTodos.filter((t) => {
      if (filter === 'active' && t.completed) return false;
      if (filter === 'in_progress' && (t.completed || t.status !== 'in_progress')) return false;
      if (filter === 'completed' && !t.completed) return false;
      if (filter === 'high' && t.priority !== 'high') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = t.text.toLowerCase().includes(q);
        const matchesTag = t.tag ? t.tag.toLowerCase().includes(q) : false;
        const matchesSubtask = t.subtasks?.some((s) => s.text.toLowerCase().includes(q));
        if (!matchesText && !matchesTag && !matchesSubtask) return false;
      }

      return true;
    });
  }, [regularTodos, filter, searchQuery]);

  const sortedTodos = useMemo(() => {
    const active = filteredTodos.filter((t) => !t.completed);
    const completed = filteredTodos.filter((t) => t.completed);
    return [...active, ...completed];
  }, [filteredTodos]);

  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 shadow-sm flex flex-col min-h-[calc(100vh-3rem)] space-y-4">
      {/* Concise Header: Title on Left, Minimal Icons on Right */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Prominent Title & Counter */}
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            <span className="text-xs sm:text-sm font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-0.5 rounded-full">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Right: Shifted Concise Actions as Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
            {/* Search Toggle Icon */}
            {isSearchOpen ? (
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl px-2.5 py-1.5 border border-zinc-200/80 dark:border-zinc-700/80">
                <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  autoFocus
                  className="w-32 sm:w-48 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none"
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Compact Filter Segmented Control */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 sm:p-1 rounded-xl text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="All"
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all ${
                  filter === 'active'
                    ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Active"
              >
                Active
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  filter === 'in_progress'
                    ? 'bg-white text-amber-600 dark:bg-zinc-900 dark:text-amber-400 shadow-2xs font-medium'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="In Progress tasks"
              >
                <span className="hidden xs:inline">In Progress</span>
                <span className="xs:hidden">Progress</span>
                {inProgressCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all ${
                  filter === 'completed'
                    ? 'bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-2xs font-medium'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Done"
              >
                Done
              </button>
              <button
                onClick={() => setFilter('high')}
                className={`p-1.5 rounded-lg transition-all ${
                  filter === 'high'
                    ? 'bg-rose-500 text-white'
                    : 'hover:text-rose-500'
                }`}
                title="High priority"
              >
                <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Rollover Icon Button */}
            {hasPreviousTasks && (
              <button
                onClick={onRollover}
                className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                title={rolloverTitle}
              >
                <ArrowRightLeft className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Clear Completed Icon Button */}
            {completedCount > 0 && onClearCompleted && (
              <button
                onClick={onClearCompleted}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Clear completed tasks"
              >
                <CheckCheck className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Minimalist 2px Progress Hairline */}
        {totalCount > 0 && (
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Enlarged Quick Add Bar */}
      <form onSubmit={handleAdd} className="relative">
        <div className="flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/50 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:bg-white dark:focus-within:bg-zinc-900 transition-all shadow-2xs">
          <Plus className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
          />

          {/* Right-aligned concise icon triggers */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Priority cycle icon */}
            <button
              type="button"
              onClick={cyclePriority}
              title={`Priority: ${priority}`}
              className={`p-2 rounded-xl text-sm transition-colors ${
                priority === 'high'
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/50'
                  : priority === 'low'
                  ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  : 'text-zinc-400 hover:text-blue-500'
              }`}
            >
              <Flame className="w-4 h-4" />
            </button>

            {/* Tag picker icon */}
            <div className="relative" ref={tagMenuRef}>
              <button
                type="button"
                onClick={() => setShowTagMenu(!showTagMenu)}
                title={selectedTag ? `#${selectedTag}` : 'Add tag'}
                className={`p-2 rounded-xl text-sm transition-colors ${
                  selectedTag
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                <Tag className="w-4 h-4" />
              </button>

              {showTagMenu && (
                <div className="absolute right-0 top-full mt-2 z-30 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-wrap gap-1.5 w-48 animate-in fade-in duration-100">
                  {PRESET_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedTag(selectedTag === t ? '' : t);
                        setShowTagMenu(false);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        selectedTag === t
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Estimate picker icon */}
            <div className="relative" ref={estimateMenuRef}>
              <button
                type="button"
                onClick={() => setShowEstimateMenu(!showEstimateMenu)}
                title={selectedEstimate || 'Estimate time'}
                className={`p-2 rounded-xl text-sm transition-colors ${
                  selectedEstimate
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                <Clock className="w-4 h-4" />
              </button>

              {showEstimateMenu && (
                <div className="absolute right-0 top-full mt-2 z-30 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-wrap gap-1.5 w-40 animate-in fade-in duration-100">
                  {PRESET_ESTIMATES.map((est) => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => {
                        setSelectedEstimate(selectedEstimate === est ? '' : est);
                        setShowEstimateMenu(false);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                        selectedEstimate === est
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {est}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit icon button */}
            <button
              type="submit"
              disabled={!newText.trim()}
              className="p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-20 hover:opacity-90 transition-all ml-1"
              title="Add task (Enter)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Task List Section */}
      <div className="space-y-4 flex-1 flex flex-col">
        {/* Tasks List */}
        <div className="space-y-2.5">
          {sortedTodos.map((todo) => {
            const isEditing = editingId === todo.id;
            const isInProgress = todo.status === 'in_progress';
            const isExpanded =
              expandedSubtasks[todo.id] !== undefined
                ? expandedSubtasks[todo.id]
                : (isInProgress || activeSubtaskInputId === todo.id);
            const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
            const completedSubtasks = todo.subtasks ? todo.subtasks.filter((s) => s.completed).length : 0;
            const totalSubtasks = todo.subtasks ? todo.subtasks.length : 0;
            const isCompleted = todo.completed;

            return (
              <div
                key={todo.id}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, todo.id)}
                onDragOver={(e) => handleDragOver(e, todo.id)}
                onDragLeave={(e) => handleDragLeave(e, todo.id)}
                onDrop={(e) => handleDrop(e, todo.id)}
                onDragEnd={handleDragEnd}
                className={`group relative rounded-2xl border transition-all shadow-2xs ${
                  draggedTodoId === todo.id
                    ? 'opacity-40 border-dashed border-zinc-400 dark:border-zinc-600 scale-[0.99]'
                    : dragOverInfo?.id === todo.id
                    ? dragOverInfo.position === 'before'
                      ? 'border-t-2 !border-t-zinc-900 dark:!border-t-zinc-100 bg-zinc-50/70 dark:bg-zinc-800/40'
                      : 'border-b-2 !border-b-zinc-900 dark:!border-b-zinc-100 bg-zinc-50/70 dark:bg-zinc-800/40'
                    : isCompleted
                    ? 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-950/20 hover:border-zinc-300 dark:hover:border-zinc-700 opacity-85 hover:opacity-100'
                    : isInProgress
                    ? 'border-amber-500/40 dark:border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-500/[0.03]'
                    : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Main Task Row */}
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3">
                  {/* Drag Handle + Checkbox + Task Text */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className="opacity-30 sm:opacity-0 group-hover:opacity-80 hover:!opacity-100 cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-500 p-0.5 -ml-1 transition-opacity shrink-0 select-none"
                      title="Drag with mouse to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                      onClick={() => onToggleTodo(todo.id)}
                      title={isCompleted ? 'Unmark task' : isInProgress ? 'Mark complete' : 'Complete task'}
                      className={`shrink-0 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : isInProgress
                          ? 'border-amber-500 text-amber-500 hover:border-emerald-500 hover:text-emerald-500'
                          : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : isInProgress ? (
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-transparent" />
                      )}
                    </button>

                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={() => handleSaveEdit(todo.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(todo.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 bg-transparent text-base text-zinc-900 dark:text-zinc-100 outline-none border-b border-zinc-400 py-0.5"
                      />
                    ) : (
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {/* Strictly NO strikethrough line - kept marked cleanly */}
                        <span
                          onClick={() => handleStartEdit(todo)}
                          className={`text-base font-medium cursor-pointer truncate ${
                            isCompleted
                              ? 'text-zinc-400 dark:text-zinc-500'
                              : 'text-zinc-850 dark:text-zinc-150'
                          }`}
                        >
                          {todo.text}
                        </span>

                        {/* In Progress Badge */}
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0 select-none">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            In Progress
                          </span>
                        )}

                        {/* Done Badge */}
                        {isCompleted && (
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md shrink-0 select-none">
                            Done
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Badges & Hover Icons */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Subtasks Counter / Expand Trigger */}
                    {hasSubtasks && (
                      <button
                        type="button"
                        onClick={() => toggleSubtasksExpanded(todo.id, isExpanded)}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Toggle subtasks checklist"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-zinc-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-zinc-400" />
                        )}
                      </button>
                    )}

                    {todo.priority === 'high' && (
                      <Flame className="w-4 h-4 text-rose-500" />
                    )}

                    {todo.tag && (
                      <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                        #{todo.tag}
                      </span>
                    )}

                    {todo.estimate && (
                      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md">
                        {todo.estimate}
                      </span>
                    )}

                    {/* Hover Action Buttons */}
                    <div className="opacity-60 sm:opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      {/* Mark In Progress / Remove In Progress */}
                      <button
                        onClick={() => onToggleInProgress?.(todo.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isInProgress
                            ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                            : 'text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }`}
                        title={isInProgress ? 'Remove In Progress' : 'Mark as In Progress'}
                      >
                        <Timer className="w-4 h-4" />
                      </button>

                      {/* Add Subtask Trigger */}
                      <button
                        onClick={() => handleOpenSubtaskInput(todo.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Add subtask"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>

                      {/* Edit Main Task */}
                      <button
                        onClick={() => handleStartEdit(todo)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete Task */}
                      <button
                        onClick={() => onDeleteTodo(todo.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nested Subtasks Drawer */}
                {(isExpanded || activeSubtaskInputId === todo.id) && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-b-2xl space-y-2.5">
                    {/* Subtask list */}
                    {hasSubtasks && (
                      <div className="space-y-1.5 pl-5 border-l-2 border-zinc-200/80 dark:border-zinc-800 ml-2">
                        {todo.subtasks!.map((sub) => (
                          <div
                            key={sub.id}
                            className="group/sub flex items-center justify-between gap-2.5 py-0.5"
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => onToggleSubTask?.(todo.id, sub.id)}
                                className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  sub.completed
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'border border-zinc-300 dark:border-zinc-600 hover:border-emerald-500'
                                }`}
                              >
                                {sub.completed ? (
                                  <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                ) : (
                                  <Circle className="w-2.5 h-2.5 text-transparent" />
                                )}
                              </button>

                              {/* NO STRIKETHROUGH - strictly kept marked */}
                              {editingSubtaskId === sub.id ? (
                                <input
                                  type="text"
                                  value={editSubtaskText}
                                  onChange={(e) => setEditSubtaskText(e.target.value)}
                                  onBlur={() => handleSaveSubtaskEdit(todo.id, sub.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveSubtaskEdit(todo.id, sub.id);
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingSubtaskId(null);
                                      setEditSubtaskText('');
                                    }
                                  }}
                                  autoFocus
                                  className="text-sm bg-transparent border-b border-zinc-400 dark:border-zinc-500 text-zinc-900 dark:text-zinc-100 outline-none flex-1 py-0.5"
                                />
                              ) : (
                                <span
                                  onClick={() => handleStartEditSubtask(sub.id, sub.text)}
                                  className={`text-sm select-none truncate cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 ${
                                    sub.completed
                                      ? 'text-zinc-500 dark:text-zinc-400 font-medium'
                                      : 'text-zinc-800 dark:text-zinc-200'
                                  }`}
                                  title="Click to edit subtask"
                                >
                                  {sub.text}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => onDeleteSubTask?.(todo.id, sub.id)}
                              className="opacity-0 group-hover/sub:opacity-100 p-1 text-zinc-400 hover:text-rose-500 transition-opacity"
                              title="Delete subtask"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Subtask Input */}
                    <div className="flex items-center gap-2 pl-5 ml-2 pt-0.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <input
                        type="text"
                        value={subtaskInputs[todo.id] || ''}
                        onChange={(e) =>
                          setSubtaskInputs((prev) => ({ ...prev, [todo.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask(todo.id);
                          }
                          if (e.key === 'Escape') {
                            setActiveSubtaskInputId(null);
                          }
                        }}
                        placeholder="Add a subtask (press Enter)..."
                        className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none py-1 border-b border-zinc-200/60 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubtask(todo.id)}
                        disabled={!(subtaskInputs[todo.id] || '').trim()}
                        className="px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-20 transition-all text-xs font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Minimalist Empty State */}
        {sortedTodos.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-20 text-center text-zinc-400 dark:text-zinc-600 text-sm font-medium">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}


