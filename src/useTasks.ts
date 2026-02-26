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

  function addTask(title: string, priority: Priority) {
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      priority,
      createdAt: Date.now(),
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

  function updateTask(id: string, title: string, priority: Priority) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, title, priority } : t))
    );
  }

  return { tasks, addTask, toggleTask, deleteTask, updateTask };
}
