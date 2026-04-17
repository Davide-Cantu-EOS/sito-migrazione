import type { AppStatus, UserInfo } from '../types';

interface AppCardProps {
  name: string;
  status: AppStatus;
  updatedBy: UserInfo | null;
  updatedAt: string | null;
  disabled: boolean;
  onStatusChange: (status: AppStatus) => void;
}

const statuses: { key: AppStatus; label: string }[] = [
  { key: 'not_started', label: 'Da fare' },
  { key: 'in_progress', label: 'In corso' },
  { key: 'completed', label: 'Completata' },
];

export function AppCard({ name, status, updatedBy, updatedAt, disabled, onStatusChange }: AppCardProps) {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`app-card app-card--${status} ${disabled ? 'app-card--disabled' : ''}`}>
      <div className="app-card-header">
        <span className="app-card-name">{name}</span>
      </div>
      <div className="app-card-statuses">
        {statuses.map((s) => (
          <button
            key={s.key}
            className={`btn-state btn-state--${s.key} ${status === s.key ? 'btn-state--active' : ''}`}
            onClick={() => onStatusChange(s.key)}
            disabled={disabled}
          >
            {s.label}
          </button>
        ))}
      </div>
      {updatedBy && (
        <div className="app-card-meta">
          <span className="app-card-user">
            {updatedBy.displayName || updatedBy.email}
          </span>
          {updatedAt && (
            <span className="app-card-time">{formatDate(updatedAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}
