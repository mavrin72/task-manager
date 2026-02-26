import { useState, useEffect } from 'react';
import type { Task, Priority } from './types';

const STORAGE_KEY = 'task-manager-tasks';

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
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
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
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
