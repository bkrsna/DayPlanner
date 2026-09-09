export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  status?: TaskStatus;
  priority: Priority;
  tag?: string;
  estimate?: string;
  subtasks?: SubTask[];
  createdAt: string;
  completedAt?: string;
  isSpecial?: boolean;
}

export interface HabitItem {
  id: string;
  title: string;
  completed: boolean;
  category?: 'health' | 'mind' | 'focus' | 'body';
}

export interface DayVitals {
  mood?: number; // 1 to 5
  energy?: number; // 1 to 5
}

export interface DayReflections {
  morningIntentions: string;
  eveningReflection: string;
  notes: string;
}

export type PeriodType = 'day' | 'week' | 'month';

export interface DayData {
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  oneBigThing: string;
  oneBigThingDone: boolean;
  todos: TodoItem[];
  habits: HabitItem[];
  vitals: DayVitals;
  reflections: DayReflections;
  journal?: string;
}

export interface WeekData {
  week: string; // YYYY-Www, e.g. 2026-W36
  createdAt: string;
  updatedAt: string;
  todos: TodoItem[];
  journal?: string;
}

export interface MonthData {
  month: string; // YYYY-MM, e.g. 2026-09
  createdAt: string;
  updatedAt: string;
  todos: TodoItem[];
  journal?: string;
}

export interface DaySummary {
  date: string;
  totalTodos: number;
  completedTodos: number;
  hasOneBigThing: boolean;
  oneBigThingDone: boolean;
  totalHabits: number;
  completedHabits: number;
  hasNotes: boolean;
  mood?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  defaultHabits: string[];
  soundEnabled: boolean;
  confettiEnabled: boolean;
}
