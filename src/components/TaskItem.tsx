import { useState } from 'react';
import type { Task, Priority } from '../types';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'comments'>>) => void;
  onAddComment: (taskId: string, text: string, author: string) => void;
}

const priorityLabel: Record<Priority, string> = {
  low: 'Низький',
  medium: 'Середній',
  high: 'Високий',
};

function getDeadlineInfo(deadline: string): { label: string; cls: string } | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + 'T00:00:00');
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: `Прострочено ${Math.abs(diff)}д`, cls: 'deadline--overdue' };
  if (diff === 0) return { label: 'Сьогодні', cls: 'deadline--today' };
  if (diff <= 3) return { label: `${diff} дн`, cls: 'deadline--soon' };
  return { label: `${diff} дн`, cls: 'deadline--ok' };
}

function Initials({ name }: { name: string }) {
  if (!name) return null;
  const parts = name.trim().split(' ');
  const abbr = parts.length >= 2
    ? parts[0][0] + parts[1][0]
    : name.slice(0, 2);
  return <span className="avatar">{abbr.toUpperCase()}</span>;
}

export function TaskItem({ task, onToggle, onDelete, onUpdate, onAddComment }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [commentText, setCommentText] = useState('');

  // edit state
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description);
  const [editInitiator, setEditInitiator] = useState(task.initiator);
  const [editDeadline, setEditDeadline] = useState(task.deadline);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);

  const deadlineInfo = getDeadlineInfo(task.deadline);

  function handleDelete() {
    setRemoving(true);
    setTimeout(() => onDelete(task.id), 320);
  }

  function handleSave() {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    onUpdate(task.id, {
      title: trimmed,
      description: editDesc.trim(),
      initiator: editInitiator.trim(),
      deadline: editDeadline,
      priority: editPriority,
    });
    setEditing(false);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText.trim(), '');
    setCommentText('');
  }

  return (
    <li
      className={[
        'task-item',
        `priority-${task.priority}`,
        task.completed ? 'completed' : '',
        removing ? 'removing' : '',
      ].filter(Boolean).join(' ')}
    >
      {editing ? (
        <div className="task-edit">
          <div className="form-field">
            <label>Назва</label>
            <input
              className="field-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Опис</label>
            <textarea
              className="field-input field-textarea"
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={2}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Ініціатор</label>
              <input
                className="field-input"
                value={editInitiator}
                onChange={e => setEditInitiator(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>Дедлайн</label>
              <input
                className="field-input"
                type="date"
                value={editDeadline}
                onChange={e => setEditDeadline(e.target.value)}
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
                  className={`priority-pill priority-pill--${p} ${editPriority === p ? 'active' : ''}`}
                  onClick={() => setEditPriority(p)}
                >
                  {priorityLabel[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-cancel" onClick={() => setEditing(false)}>Скасувати</button>
            <button className="btn btn-save" onClick={handleSave}>Зберегти</button>
          </div>
        </div>
      ) : (
        <>
          <div className="task-top" onClick={() => setExpanded(v => !v)}>
            <div className="task-check-wrap" onClick={e => { e.stopPropagation(); onToggle(task.id); }}>
              <input
                type="checkbox"
                className="task-checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
              />
            </div>

            <div className="task-main">
              <span className="task-title">{task.title}</span>
              <div className="task-meta">
                <span className={`badge badge-${task.priority}`}>{priorityLabel[task.priority]}</span>
                {task.initiator && (
                  <span className="meta-initiator">
                    <Initials name={task.initiator} />
                    <span className="meta-initiator__name">{task.initiator}</span>
                  </span>
                )}
                {deadlineInfo && (
                  <span className={`deadline ${deadlineInfo.cls}`}>
                    📅 {deadlineInfo.label}
                  </span>
                )}
                <span className="meta-date">
                  🗓 {new Date(task.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                </span>
                {task.comments.length > 0 && (
                  <span className="meta-comments">💬 {task.comments.length}</span>
                )}
              </div>
            </div>

            <div className="task-actions" onClick={e => e.stopPropagation()}>
              <button className="icon-btn icon-btn--edit" title="Редагувати" onClick={() => { setEditing(true); setExpanded(false); }}>✏️</button>
              <button className="icon-btn icon-btn--delete" title="Видалити" onClick={handleDelete}>🗑️</button>
            </div>

            <span className={`expand-arrow ${expanded ? 'expanded' : ''}`}>›</span>
          </div>

          {expanded && (
            <div className="task-body">
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}

              <div className="task-details-grid">
                {task.initiator && (
                  <div className="detail-item">
                    <span className="detail-label">Ініціатор</span>
                    <span className="detail-value">
                      <Initials name={task.initiator} />
                      {task.initiator}
                    </span>
                  </div>
                )}
                {task.deadline && (
                  <div className="detail-item">
                    <span className="detail-label">Дедлайн</span>
                    <span className={`detail-value ${deadlineInfo?.cls ?? ''}`}>
                      {new Date(task.deadline + 'T00:00:00').toLocaleDateString('uk-UA', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                      {deadlineInfo && ` (${deadlineInfo.label})`}
                    </span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Створено</span>
                  <span className="detail-value">
                    {new Date(task.createdAt).toLocaleDateString('uk-UA', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="comments-section">
                <h4 className="comments-title">
                  Коментарі
                  {task.comments.length > 0 && <span className="comments-count">{task.comments.length}</span>}
                </h4>

                {task.comments.length > 0 && (
                  <ul className="comments-list">
                    {task.comments.map(c => (
                      <li key={c.id} className="comment-item">
                        <div className="comment-body">
                          <span className="comment-time">
                            {new Date(c.createdAt).toLocaleString('uk-UA', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                          <p className="comment-text">{c.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <form className="comment-form" onSubmit={handleAddComment}>
                  <input
                    className="field-input field-input--sm"
                    placeholder="Напишіть коментар..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-comment">Додати</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
}
