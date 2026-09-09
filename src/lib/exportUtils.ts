import { DayData } from '@/types';
import { formatFullDate } from './dateUtils';

export function generateDayMarkdown(day: DayData): string {
  const lines: string[] = [];

  lines.push(`---`);
  lines.push(`date: ${day.date}`);
  lines.push(`created: ${day.createdAt}`);
  lines.push(`updated: ${day.updatedAt}`);
  if (day.vitals.mood) lines.push(`mood: ${day.vitals.mood}/5`);
  if (day.vitals.energy) lines.push(`energy: ${day.vitals.energy}/5`);
  lines.push(`---`);
  lines.push(``);
  lines.push(`# Daily Log: ${formatFullDate(day.date)}`);
  lines.push(``);

  // To-Dos
  lines.push(`## Daily Tasks`);
  if (day.todos.length === 0) {
    lines.push(`*No tasks recorded for this day.*`);
  } else {
    for (const todo of day.todos) {
      const check = todo.completed ? '[x]' : '[ ]';
      const statusStr = todo.status === 'in_progress' ? '[In Progress] ' : '';
      const prioStr = todo.priority === 'high' ? '[High] ' : '';
      const tagStr = todo.tag ? ` #${todo.tag}` : '';
      const estStr = todo.estimate ? ` (${todo.estimate})` : '';
      lines.push(`- ${check} ${statusStr}${prioStr}${todo.text}${tagStr}${estStr}`);
      if (todo.subtasks && todo.subtasks.length > 0) {
        for (const sub of todo.subtasks) {
          const subCheck = sub.completed ? '[x]' : '[ ]';
          lines.push(`  - ${subCheck} ${sub.text}`);
        }
      }
    }
  }
  lines.push(``);

  // Habits
  if (day.habits.length > 0) {
    lines.push(`## Habits & Rituals`);
    for (const habit of day.habits) {
      lines.push(`- ${habit.completed ? '[x]' : '[ ]'} ${habit.title}`);
    }
    lines.push(``);
  }

  // Reflections
  if (day.reflections.morningIntentions.trim()) {
    lines.push(`## Morning Intentions`);
    lines.push(day.reflections.morningIntentions.trim());
    lines.push(``);
  }

  if (day.reflections.eveningReflection.trim()) {
    lines.push(`## Evening Review`);
    lines.push(day.reflections.eveningReflection.trim());
    lines.push(``);
  }

  if (day.reflections.notes.trim()) {
    lines.push(`## Notes & Scratchpad`);
    lines.push(day.reflections.notes.trim());
    lines.push(``);
  }

  if (day.journal && day.journal.trim()) {
    lines.push(`## Journal`);
    lines.push(day.journal.trim());
    lines.push(``);
  }

  return lines.join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
