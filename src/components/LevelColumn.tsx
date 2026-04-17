import type { CompileApp, LevelStatus, AppStatus, UserInfo } from '../types';
import { AppCard } from './AppCard';

interface LevelColumnProps {
  level: number;
  apps: CompileApp[];
  levelStatus: LevelStatus;
  onStatusChange: (appId: string, status: AppStatus, user: UserInfo) => Promise<void>;
  currentUser: UserInfo;
}

const levelColors: Record<LevelStatus, string> = {
  blocked: 'var(--color-red)',
  available: 'var(--color-amber)',
  completed: 'var(--color-green)',
};

const levelLabels: Record<LevelStatus, string> = {
  blocked: '🔒 Bloccato',
  available: '🔓 In lavorazione',
  completed: '✅ Completato',
};

export function LevelColumn({ level, apps, levelStatus, onStatusChange, currentUser }: LevelColumnProps) {
  const completedCount = apps.filter((a) => a.status === 'completed').length;
  const progress = apps.length > 0 ? Math.round((completedCount / apps.length) * 100) : 0;

  return (
    <div className={`level-column level-column--${levelStatus}`}>
      <div className="level-header" style={{ borderTopColor: levelColors[levelStatus] }}>
        <div className="level-title-row">
          <h3 className="level-title">Livello {level}</h3>
          <span className="level-badge" style={{ backgroundColor: levelColors[levelStatus] }}>
            {levelLabels[levelStatus]}
          </span>
        </div>
        <div className="level-progress">
          <div className="progress-bar progress-bar--small">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: levelColors[levelStatus],
              }}
            />
          </div>
          <span className="progress-text-small">{completedCount}/{apps.length}</span>
        </div>
      </div>
      {levelStatus === 'blocked' && (
        <div className="level-blocked-hint">Completa tutti gli elementi del livello precedente per sbloccare</div>
      )}
      <div className="level-apps">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            name={app.name}
            status={app.status}
            updatedBy={app.updatedBy}
            updatedAt={app.updatedAt}
            disabled={levelStatus === 'blocked'}
            onStatusChange={(status) => onStatusChange(app.id, status, currentUser)}
          />
        ))}
      </div>
    </div>
  );
}
