export type Priority = 'low' | 'medium' | 'high';
export type Status = 'all' | 'active' | 'completed';

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
  deadline: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: number;
  priority: Priority;
  createdAt: number;
  comments: Comment[];
}
