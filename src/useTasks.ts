import { useState, useEffect } from 'react';
import type { Task, Priority } from './types';

const STORAGE_KEY = 'task-manager-tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (JSON.parse(raw) as any[]).map(t => ({
      id: t.id ?? crypto.randomUUID(),
      title: t.title ?? '',
      description: t.description ?? '',
      initiator: t.initiator ?? '',
      deadline: t.deadline ?? '',
      completed: t.completed ?? false,
      completedAt: t.completedAt ?? undefined,
      priority: t.priority ?? 'medium',
      createdAt: t.createdAt ?? Date.now(),
      comments: Array.isArray(t.comments) ? t.comments : [],
    }));
  } catch {
    return [];
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  function addTask(
    title: string,
    priority: Priority,
    description: string,
    initiator: string,
    deadline: string,
  ) {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      initiator,
      deadline,
      completed: false,
      priority,
      createdAt: Date.now(),
      comments: [],
    };
    setTasks(prev => [task, ...prev]);
  }

  function toggleTask(id: string) {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t;
        const nowCompleted = !t.completed;
        return { ...t, completed: nowCompleted, completedAt: nowCompleted ? Date.now() : undefined };
      })
    );
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  function updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'comments'>>) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...data } : t))
    );
  }

  function addComment(taskId: string, text: string, author: string) {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              comments: [
                ...t.comments,
                { id: crypto.randomUUID(), text, author, createdAt: Date.now() },
              ],
            }
          : t
      )
    );
  }

  return { tasks, addTask, toggleTask, deleteTask, updateTask, addComment };
}
