'use client';

import { useState, useRef } from 'react';
import { TodoItem } from '@/types';
import {
  Check,
  CheckCheck,
  Circle,
  Trash2,
  Flame,
  ChevronDown,
  ChevronRight,
  Pencil,
  Timer,
  ListPlus,
  ListChecks,
  CornerDownRight,
  Star,
  GripVertical,
} from 'lucide-react';

export interface SpecialTasksCardProps {
  todos: TodoItem[];
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
}

export function SpecialTasksCard({
  todos,
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
}: SpecialTasksCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});
  const [activeSubtaskInputId, setActiveSubtaskInputId] = useState<string | null>(null);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubtaskText, setEditSubtaskText] = useState('');

  // Drag-and-drop state
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

  const activeTodos = todos.filter((t) => !t.completed);
  const doneTodos = todos.filter((t) => t.completed);
  const sortedTodos = [...activeTodos, ...doneTodos];

  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/80 p-3 sm:p-3.5 shadow-sm space-y-3">
      {/* Header: Simple & Minimal, same as To-Dos */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50">
              Special Tasks
            </h2>
            <span className="text-xs sm:text-sm font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Clear Completed Icon Button */}
          {completedCount > 0 && onClearCompleted && (
            <button
              onClick={onClearCompleted}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Clear completed special tasks"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Minimalist 1.5px Progress Hairline */}
        {totalCount > 0 && (
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
        {sortedTodos.map((todo) => {
          const isEditing = editingId === todo.id;
          const isInProgress = todo.status === 'in_progress';
          // Auto-expand subtasks if task is in progress
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
              <div className="flex items-center justify-between gap-1.5 px-2 py-1.5 sm:py-2">
                {/* Drag Handle + Checkbox + Task Text */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div
                    className="opacity-0 group-hover:opacity-70 hover:!opacity-100 cursor-grab active:cursor-grabbing text-zinc-400 dark:text-zinc-500 p-0 -ml-0.5 transition-opacity shrink-0 select-none"
                    title="Drag with mouse to reorder"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleTodo(todo.id)}
                    title={isCompleted ? 'Unmark task' : isInProgress ? 'Mark complete' : 'Complete task'}
                    className={`shrink-0 w-4.5 h-4.5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : isInProgress
                        ? 'border-amber-500 text-amber-500 hover:border-emerald-500 hover:text-emerald-500'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    ) : isInProgress ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    ) : (
                      <Circle className="w-3 h-3 text-transparent" />
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
                      className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 outline-none border-b border-zinc-400 py-0.5"
                    />
                  ) : (
                    <div
                      onClick={() => handleStartEdit(todo)}
                      className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        className={`truncate text-xs sm:text-sm font-normal ${
                          isCompleted
                            ? 'text-zinc-400 dark:text-zinc-500'
                            : isInProgress
                            ? 'text-zinc-900 dark:text-zinc-50 font-normal'
                            : 'text-zinc-800 dark:text-zinc-200 font-normal'
                        }`}
                      >
                        {todo.text}
                      </span>
                      {isInProgress && (
                        <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded shrink-0 select-none">
                          Done
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Badges & Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {hasSubtasks && (
                    <button
                      type="button"
                      onClick={() => toggleSubtasksExpanded(todo.id, isExpanded)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      title="Toggle subtasks checklist"
                    >
                      <ListChecks className="w-3 h-3" />
                      <span>
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
                      ) : (
                        <ChevronRight className="w-2.5 h-2.5 text-zinc-400" />
                      )}
                    </button>
                  )}

                  {todo.priority === 'high' && <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />}

                  {/* Actions on hover - hidden by default to keep text 100% visible */}
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleInProgress?.(todo.id)}
                      className={`p-1 rounded transition-colors ${
                        isInProgress
                          ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50'
                          : 'text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      }`}
                      title={isInProgress ? 'Remove In Progress' : 'Mark as In Progress'}
                    >
                      <Timer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenSubtaskInput(todo.id)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Add subtask"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateTodo(todo.id, { isSpecial: false })}
                      className="p-1 rounded text-amber-500 hover:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Move back to main to-dos"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(todo)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTodo(todo.id)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Nested Subtasks Drawer */}
              {(isExpanded || activeSubtaskInputId === todo.id) && (
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-2.5 py-2 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-b-2xl space-y-2">
                  {hasSubtasks && (
                    <div className="space-y-1.5 pl-3 border-l-2 border-zinc-200/80 dark:border-zinc-800 ml-1">
                      {todo.subtasks!.map((sub) => (
                        <div
                          key={sub.id}
                          className="group/sub flex items-center justify-between gap-1.5 py-0.5"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => onToggleSubTask?.(todo.id, sub.id)}
                              className={`shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
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
                                  }
                                }}
                                autoFocus
                                className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 outline-none border-b border-zinc-400 py-0.5"
                              />
                            ) : (
                              <span
                                onClick={() => handleStartEditSubtask(sub.id, sub.text)}
                                className={`text-xs cursor-pointer truncate ${
                                  sub.completed
                                    ? 'text-zinc-400 dark:text-zinc-500 font-medium'
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                {sub.text}
                              </span>
                            )}
                          </div>

                          <div className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                            <button
                              type="button"
                              onClick={() => onDeleteSubTask?.(todo.id, sub.id)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-500 transition-colors"
                              title="Delete subtask"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Add Subtask Input */}
                  <div className="flex items-center gap-1.5 pl-3 ml-1 pt-0.5">
                    <CornerDownRight className="w-3 h-3 text-zinc-400 shrink-0" />
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
                      className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none py-1 border-b border-zinc-200/60 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors min-w-0"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSubtask(todo.id)}
                      disabled={!(subtaskInputs[todo.id] || '').trim()}
                      className="px-2 py-0.5 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-20 transition-all text-xs font-medium shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sortedTodos.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-10 text-center text-zinc-400 dark:text-zinc-600 text-sm font-medium">
            No special tasks
          </div>
        )}
      </div>
    </div>
  );
}

// Alias export for backwards compatibility
export const SpecialTasks = SpecialTasksCard;
