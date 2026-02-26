import { useState } from 'react';
import type { Priority } from '../types';

interface Props {
  onAdd: (title: string, priority: Priority) => void;
}

export function TaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority);
    setTitle('');
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        className="task-input"
        type="text"
        placeholder="Нова задача..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      <select
        className="priority-select"
        value={priority}
        onChange={e => setPriority(e.target.value as Priority)}
      >
        <option value="low">Низький</option>
        <option value="medium">Середній</option>
        <option value="high">Високий</option>
      </select>
      <button className="btn btn-add" type="submit">
        Додати
      </button>
    </form>
  );
}
