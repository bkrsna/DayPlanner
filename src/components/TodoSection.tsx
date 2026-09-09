'use client';

import { useState } from 'react';
import { TodoItem, Priority } from '@/types';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Flame,
  Zap,
  Coffee,
  ArrowRightLeft,
  Tag,
  Clock,
  Filter,
} from 'lucide-react';

interface TodoSectionProps {
  todos: TodoItem[];
  onAddTodo: (text: string, priority: Priority, tag?: string, estimate?: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<TodoItem>) => void;
  onRollover: () => void;
  hasPreviousTasks: boolean;
}

const COMMON_TAGS = ['work', 'personal', 'deepwork', 'health', 'learning'];
const COMMON_ESTIMATES = ['15m', '30m', '45m', '1h', '2h'];

export function TodoSection({
  todos,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodo,
  onRollover,
  hasPreviousTasks,
}: TodoSectionProps) {
  const [newText, setNewText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedEstimate, setSelectedEstimate] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'high'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddTodo(
      newText,
      priority,
      selectedTag || undefined,
      selectedEstimate || undefined
    );
    setNewText('');
    setSelectedTag('');
    setSelectedEstimate('');
    setPriority('medium');
    setShowDetails(false);
  };

  const handleStartEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const handleSaveEdit = (id: string) => {
    if (editText.trim()) {
      onUpdateTodo(id, { text: editText.trim() });
    }
    setEditingId(null);
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    if (filter === 'high') return t.priority === 'high';
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 p-5 shadow-xs">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Daily To-Dos</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {completedCount}/{todos.length}
            </span>
          </h2>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All ({todos.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Active ({todos.length - completedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Done ({completedCount})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
              filter === 'high'
                ? 'bg-amber-500 text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            High
          </button>
        </div>
      </div>

      {/* Rollover Banner if previous day had incomplete tasks */}
      {hasPreviousTasks && (
        <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <ArrowRightLeft className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>You have unfinished tasks from a previous day.</span>
          </div>
          <button
            onClick={onRollover}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shrink-0 shadow-xs"
          >
            Rollover to Today
          </button>
        </div>
      )}

      {/* Quick Add Form */}
      <form onSubmit={handleAdd} className="mb-4">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-1.5 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a new task (Press Enter to add)..."
            className="flex-1 bg-transparent px-3 py-1 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
          />

          {/* Quick details toggle button */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
              showDetails || selectedTag || selectedEstimate || priority !== 'medium'
                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
            title="Configure priority, tag, estimate"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>

          <button
            type="submit"
            disabled={!newText.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Extended options drawer */}
        {showDetails && (
          <div className="mt-2 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-950/40 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-100">
            {/* Priority Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">Priority:</span>
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                  priority === 'high'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Flame className="w-3 h-3 text-red-500" /> High
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                  priority === 'medium'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Zap className="w-3 h-3 text-blue-500" /> Normal
              </button>
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                  priority === 'low'
                    ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                <Coffee className="w-3 h-3 text-zinc-500" /> Low
              </button>
            </div>

            {/* Tag Selector */}
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-zinc-400" />
              <div className="flex items-center gap-1">
                {COMMON_TAGS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                    className={`px-2 py-0.5 rounded-md text-[11px] transition-colors ${
                      selectedTag === t
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                        : 'text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimate Selector */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-zinc-400" />
              <div className="flex items-center gap-1">
                {COMMON_ESTIMATES.map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setSelectedEstimate(selectedEstimate === est ? '' : est)}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] transition-colors ${
                      selectedEstimate === est
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                        : 'text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {est}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Task List */}
      <div className="space-y-1.5">
        {filteredTodos.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 dark:text-zinc-600 text-xs">
            {filter === 'all'
              ? 'No tasks yet for this day. Add your first goal above!'
              : `No ${filter} tasks found.`}
          </div>
        ) : (
          filteredTodos.map((todo) => {
            const isEditing = editingId === todo.id;

            return (
              <div
                key={todo.id}
                className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                  todo.completed
                    ? 'bg-zinc-50/50 dark:bg-zinc-950/30 border-transparent text-zinc-400 dark:text-zinc-500'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Left: Checkbox + Text */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <button
                    onClick={() => onToggleTodo(todo.id)}
                    className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  >
                    {todo.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  {isEditing ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => handleSaveEdit(todo.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(todo.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 outline-none border-b border-zinc-400"
                    />
                  ) : (
                    <span
                      onClick={() => handleStartEdit(todo)}
                      className={`text-sm cursor-pointer truncate ${
                        todo.completed
                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                      title="Click to edit task"
                    >
                      {todo.text}
                    </span>
                  )}
                </div>

                {/* Right: Badges & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Priority indicator */}
                  {todo.priority === 'high' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300">
                      <Flame className="w-2.5 h-2.5" /> High
                    </span>
                  )}
                  {todo.priority === 'low' && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800">
                      Low
                    </span>
                  )}

                  {/* Tag badge */}
                  {todo.tag && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      #{todo.tag}
                    </span>
                  )}

                  {/* Estimate badge */}
                  {todo.estimate && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {todo.estimate}
                    </span>
                  )}

                  {/* Delete button (shows on hover) */}
                  <button
                    onClick={() => onDeleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
