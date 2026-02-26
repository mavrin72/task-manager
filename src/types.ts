export type Priority = 'low' | 'medium' | 'high';
export type Status = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
}
