import { parseTaskInput } from './task-parser';
import type { CronoList, Task } from './types';

export const defaultLists: CronoList[] = [
  { id: 'today', name: 'Today', color: '#2563eb' },
  { id: 'home', name: 'Home', color: '#16a34a' },
  { id: 'work', name: 'Work', color: '#f97316' },
];

export const listColors = ['#2563eb', '#16a34a', '#f97316', '#9333ea', '#dc2626', '#0891b2'];

export function createDefaultTasks(): Task[] {
  return [
    createDefaultTask({
      id: '1',
      listId: 'today',
      title: 'Plan weekend groceries',
      text: 'Plan weekend groceries today evening',
    }),
    createDefaultTask({
      id: '2',
      listId: 'home',
      title: 'Water plants',
      text: 'Water plants weekly',
    }),
    createDefaultTask({
      id: '3',
      listId: 'work',
      title: 'Review launch checklist',
      text: 'Review launch checklist tomorrow 9am',
    }),
  ];
}

function createDefaultTask({
  id,
  listId,
  text,
  title,
}: {
  id: string;
  listId: string;
  text: string;
  title: string;
}): Task {
  const parsed = parseTaskInput(text);

  return {
    id,
    title,
    listId,
    completed: false,
    dueAt: parsed.detectedReminder?.date.toISOString() ?? null,
    dueLabel: parsed.reminderLabel,
    recurrence: parsed.recurrence,
  };
}
