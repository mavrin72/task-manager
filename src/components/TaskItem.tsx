import { useState } from 'react';
import type { Task, Priority } from '../types';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, priority: Priority) => void;
}

const priorityLabel: Record<Priority, string> = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
};

export function TaskItem({ task, onToggle, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);

  function handleSave() {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    onUpdate(task.id, trimmed, editPriority);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  }

  return (
    <li className={`task-item priority-${task.priority} ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />

      {editing ? (
        <div className="edit-row">
          <input
            className="task-input"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <select
            className="priority-select"
            value={editPriority}
            onChange={e => setEditPriority(e.target.value as Priority)}
          >
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
          </select>
          <button className="btn btn-save" onClick={handleSave}>Зберегти</button>
          <button className="btn btn-cancel" onClick={() => setEditing(false)}>Скасувати</button>
        </div>
      ) : (
        <div className="task-content">
          <span className="task-title">{task.title}</span>
          <span className={`badge badge-${task.priority}`}>{priorityLabel[task.priority]}</span>
          <div className="task-actions">
            <button className="btn btn-edit" onClick={() => setEditing(true)}>Редагувати</button>
            <button className="btn btn-delete" onClick={() => onDelete(task.id)}>Видалити</button>
          </div>
        </div>
      )}
    </li>
  );
}
