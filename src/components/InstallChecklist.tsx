import type { InstallApp, UserInfo } from '../types';

interface InstallChecklistProps {
  apps: InstallApp[];
  onToggle: (appId: string, installed: boolean, user: UserInfo) => Promise<void>;
  currentUser: UserInfo;
}

export function InstallChecklist({ apps, onToggle, currentUser }: InstallChecklistProps) {
  const installedCount = apps.filter((a) => a.installed).length;
  const total = apps.length;
  const progress = total > 0 ? Math.round((installedCount / total) * 100) : 0;
  const allInstalled = installedCount === total;

  return (
    <div className="install-section">
      <div className="install-header">
        <h2>App da installare</h2>
        <div className="install-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: allInstalled ? 'var(--color-green)' : 'var(--color-amber)',
              }}
            />
          </div>
          <span className="progress-text">{installedCount}/{total}</span>
        </div>
      </div>
      <div className="install-grid">
        {apps.map((app) => (
          <label key={app.id} className={`install-item ${app.installed ? 'installed' : ''}`} title={app.updatedBy ? `${app.updatedBy.displayName || app.updatedBy.email}` : undefined}>
            <input
              type="checkbox"
              checked={app.installed}
              onChange={(e) => onToggle(app.id, e.target.checked, currentUser)}
            />
            <span className="install-name">{app.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
