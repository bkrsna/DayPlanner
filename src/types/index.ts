export type Priority = 'high' | 'medium' | 'low';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  tag?: string;
  estimate?: string;
  createdAt: string;
  completedAt?: string;
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
