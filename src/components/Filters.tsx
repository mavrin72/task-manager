import type { Status, Priority } from '../types';

interface Props {
  status: Status;
  priority: Priority | 'all';
  onStatusChange: (s: Status) => void;
  onPriorityChange: (p: Priority | 'all') => void;
}

const statuses: { value: Status; label: string }[] = [
  { value: 'all', label: 'Всі' },
  { value: 'active', label: 'Активні' },
  { value: 'completed', label: 'Виконані' },
];

const priorities: { value: Priority | 'all'; label: string }[] = [
  { value: 'all', label: 'Будь-який' },
  { value: 'high', label: 'Високий' },
  { value: 'medium', label: 'Середній' },
  { value: 'low', label: 'Низький' },
];

export function Filters({ status, priority, onStatusChange, onPriorityChange }: Props) {
  return (
    <div className="filters">
      <div className="filter-group">
        {statuses.map(s => (
          <button
            key={s.value}
            className={`filter-btn ${status === s.value ? 'active' : ''}`}
            onClick={() => onStatusChange(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <select
        className="priority-select"
        value={priority}
        onChange={e => onPriorityChange(e.target.value as Priority | 'all')}
      >
        {priorities.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </div>
  );
}
