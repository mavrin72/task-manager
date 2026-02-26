import { useState } from 'react';
import { useTasks } from './useTasks';
import { TaskForm } from './components/TaskForm';
import { TaskItem } from './components/TaskItem';
import { Filters } from './components/Filters';
import type { Status, Priority } from './types';

export default function App() {
  const { tasks, addTask, toggleTask, deleteTask, updateTask } = useTasks();
  const [status, setStatus] = useState<Status>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');

  const filtered = tasks.filter(t => {
    const statusMatch =
      status === 'all' ||
      (status === 'active' && !t.completed) ||
      (status === 'completed' && t.completed);
    const priorityMatch = priority === 'all' || t.priority === priority;
    return statusMatch && priorityMatch;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="app">
      <header className="header">
        <h1>Task Manager</h1>
        <span className="counter">{activeCount} активних</span>
      </header>

      <TaskForm onAdd={addTask} />

      <Filters
        status={status}
        priority={priority}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />

      {filtered.length === 0 ? (
        <p className="empty">Задач немає</p>
      ) : (
        <ul className="task-list">
          {filtered.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
