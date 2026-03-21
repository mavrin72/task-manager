import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  initiator: string;
  deadline: string;
  completed: boolean;
  completedAt?: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  comments: Comment[];
}

const TASKS_FILE = resolve(process.env.TASKS_FILE ?? '../tasks.json');

export function loadTasks(): Task[] {
  if (!existsSync(TASKS_FILE)) return [];
  try {
    const raw = readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

export function createTask(title: string, priority: Task['priority'] = 'medium', description = '', initiator = '', deadline = ''): Task {
  return {
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
}
