import { useState } from 'react';
import type { Priority } from '../types';

interface Props {
  onAdd: (title: string, priority: Priority, description: string, initiator: string, deadline: string) => void;
}

export function TaskForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initiator, setInitiator] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority, description.trim(), initiator.trim(), deadline);
    setTitle('');
    setDescription('');
    setInitiator('');
    setDeadline('');
    setPriority('medium');
    setOpen(false);
  }

  function handleCancel() {
    setOpen(false);
    setTitle('');
    setDescription('');
    setInitiator('');
    setDeadline('');
    setPriority('medium');
  }

  if (!open) {
    return (
      <button className="btn-new-task" onClick={() => setOpen(true)}>
        <span className="btn-new-task__icon">＋</span>
        Нова задача
      </button>
    );
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>Нова задача</h3>
      </div>

      <div className="form-field">
        <label>Назва *</label>
        <input
          className="field-input"
          type="text"
          placeholder="Введіть назву задачі..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="form-field">
        <label>Короткий опис</label>
        <textarea
          className="field-input field-textarea"
          placeholder="Опишіть задачу детальніше..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>Ініціатор</label>
          <input
            className="field-input"
            type="text"
            placeholder="Ім'я..."
            value={initiator}
            onChange={e => setInitiator(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label>Дедлайн</label>
          <input
            className="field-input"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label>Пріоритет</label>
        <div className="priority-pills">
          {(['low', 'medium', 'high'] as Priority[]).map(p => (
            <button
              key={p}
              type="button"
              className={`priority-pill priority-pill--${p} ${priority === p ? 'active' : ''}`}
              onClick={() => setPriority(p)}
            >
              {p === 'low' ? 'Низький' : p === 'medium' ? 'Середній' : 'Високий'}
            </button>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-cancel" onClick={handleCancel}>
          Скасувати
        </button>
        <button type="submit" className="btn btn-add">
          Додати задачу
        </button>
      </div>
    </form>
  );
}
