import { useState, useEffect } from 'react';
import { useTasks } from './useTasks';
import { TaskForm } from './components/TaskForm';
import { TaskItem } from './components/TaskItem';
import { Filters } from './components/Filters';
import { Chihuahua } from './components/Chihuahua';
import type { Status, Priority } from './types';

const PASSWORD = 'Zrj[f.vfhsire7474';

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (input === PASSWORD) {
      localStorage.setItem('tm-auth', '1');
      onSuccess();
    } else {
      setError(true);
      setInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px' }}>
      <h2>Task Manager</h2>
      <input
        type="password"
        placeholder="Пароль"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        style={{ padding: '8px 12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', width: '240px' }}
        autoFocus
      />
      {error && <span style={{ color: 'red', fontSize: '14px' }}>Невірний пароль</span>}
      <button onClick={submit} style={{ padding: '8px 24px', fontSize: '16px', borderRadius: '6px', cursor: 'pointer' }}>
        Увійти
      </button>
    </div>
  );
}

function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('tm-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('tm-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark(v => !v) };
}

function TaskApp() {
  const { tasks, addTask, toggleTask, deleteTask, updateTask, addComment } = useTasks();
  const [status, setStatus] = useState<Status>('all');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const { dark, toggle } = useTheme();

  const filtered = tasks.filter(t => {
    const statusMatch =
      status === 'all' ||
      (status === 'active' && !t.completed) ||
      (status === 'completed' && t.completed);
    const priorityMatch = priority === 'all' || t.priority === priority;
    return statusMatch && priorityMatch;
  });

  const activeCount = tasks.filter(t => !t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title-wrap">
            <h1 className="header-title">Task Manager</h1>
          </div>
          <div className="header-right">
            <div className="header-stats">
              <div className="stat">
                <span className="stat-value">{totalCount}</span>
                <span className="stat-label">всього</span>
              </div>
              <div className="stat stat--active">
                <span className="stat-value">{activeCount}</span>
                <span className="stat-label">активних</span>
              </div>
              <div className="stat stat--done">
                <span className="stat-value">{totalCount - activeCount}</span>
                <span className="stat-label">виконано</span>
              </div>
            </div>
            <button className="theme-toggle" onClick={toggle} title={dark ? 'Світла тема' : 'Темна тема'}>
              <span className="theme-toggle__track">
                <span className="theme-toggle__thumb" />
              </span>
              <span className="theme-toggle__icon">{dark ? '🌙' : '☀️'}</span>
            </button>
          </div>
        </div>
      </header>

      <TaskForm onAdd={addTask} />

      <Filters
        status={status}
        priority={priority}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />

      {filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">📋</span>
          <p>Задач немає</p>
          <span className="empty-hint">Натисни «Нова задача» щоб почати</span>
        </div>
      ) : (
        <ul className="task-list">
          {filtered.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onAddComment={addComment}
            />
          ))}
        </ul>
      )}

      <Chihuahua />
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => localStorage.getItem('tm-auth') === '1');
  if (!auth) return <LoginScreen onSuccess={() => setAuth(true)} />;
  return <TaskApp />;
}
