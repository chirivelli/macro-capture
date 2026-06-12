import { createContext, useContext, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { createDefaultTasks, defaultLists, listColors } from './default-data';
import { cancelReminder, scheduleReminder } from './notifications';
import type { CronoList, Task, TaskInput, TaskUpdateInput } from './types';

type CronoContextValue = {
  lists: CronoList[];
  tasks: Task[];
  addList: (name: string) => CronoList;
  addTask: (input: TaskInput) => Promise<void>;
  updateTask: (task: Task, input: TaskUpdateInput) => Promise<void>;
  deleteTask: (task: Task) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
};

const CronoContext = createContext<CronoContextValue | null>(null);

export function CronoProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<CronoList[]>(defaultLists);
  const [tasks, setTasks] = useState<Task[]>(createDefaultTasks);

  function addList(name: string) {
    const list: CronoList = {
      id: slugify(name, lists),
      name: name.trim(),
      color: listColors[lists.length % listColors.length],
    };

    setLists(current => [...current, list]);
    return list;
  }

  async function addTask(input: TaskInput) {
    const task: Task = {
      id: `${Date.now()}`,
      title: input.title,
      listId: input.listId,
      completed: false,
      dueAt: input.dueAt,
      dueLabel: input.dueLabel,
      recurrence: input.recurrence,
    };

    try {
      const notificationId = await scheduleReminder(task);
      setTasks(current => [{ ...task, notificationId }, ...current]);
    } catch {
      Alert.alert('Reminder not scheduled', 'The task was added, but Crono could not schedule its notification.');
      setTasks(current => [task, ...current]);
    }
  }

  async function updateTask(task: Task, input: TaskUpdateInput) {
    await cancelReminder(task.notificationId);

    const updatedTask: Task = {
      ...task,
      title: input.title,
      dueAt: input.dueAt,
      dueLabel: input.dueLabel,
      recurrence: input.recurrence,
      notificationId: undefined,
    };

    try {
      const notificationId = task.completed ? undefined : await scheduleReminder(updatedTask);
      setTasks(current =>
        current.map(item => (item.id === task.id ? { ...updatedTask, notificationId } : item))
      );
    } catch {
      Alert.alert('Reminder not scheduled', 'The task was updated, but Crono could not schedule its notification.');
      setTasks(current => current.map(item => (item.id === task.id ? updatedTask : item)));
    }
  }

  async function toggleTask(task: Task) {
    if (!task.completed) {
      await cancelReminder(task.notificationId);
    }

    setTasks(current =>
      current.map(item => (item.id === task.id ? { ...item, completed: !item.completed } : item))
    );
  }

  async function deleteTask(task: Task) {
    await cancelReminder(task.notificationId);
    setTasks(current => current.filter(item => item.id !== task.id));
  }

  return (
    <CronoContext.Provider value={{ lists, tasks, addList, addTask, updateTask, deleteTask, toggleTask }}>
      {children}
    </CronoContext.Provider>
  );
}

export function useCrono() {
  const value = useContext(CronoContext);
  if (!value) {
    throw new Error('Crono components must be rendered inside CronoProvider.');
  }

  return value;
}

function slugify(name: string, existingLists: CronoList[]) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'list';
  let candidate = base;
  let suffix = 2;

  while (existingLists.some(list => list.id === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
