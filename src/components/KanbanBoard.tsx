import { useMemo } from 'react';
import type { MigrationData, CompileApp, LevelStatus, AppStatus, UserInfo } from '../types';
import { LevelColumn } from './LevelColumn';
import { InstallChecklist } from './InstallChecklist';
import { DependencyGraph } from './DependencyGraph';

interface KanbanBoardProps {
  data: MigrationData;
  onToggleInstall: (appId: string, installed: boolean, user: UserInfo) => Promise<void>;
  onCompileStatusChange: (appId: string, status: AppStatus, user: UserInfo) => Promise<void>;
  currentUser: UserInfo;
}

export function KanbanBoard({ data, onToggleInstall, onCompileStatusChange, currentUser }: KanbanBoardProps) {
  const installApps = useMemo(
    () => Object.values(data.installApps).sort((a, b) => a.name.localeCompare(b.name)),
    [data.installApps]
  );

  const levels = useMemo(() => {
    const appsArray = Object.values(data.compileApps);
    const levelMap = new Map<number, CompileApp[]>();

    for (const app of appsArray) {
      if (!levelMap.has(app.level)) levelMap.set(app.level, []);
      levelMap.get(app.level)!.push(app);
    }

    const sortedLevels = [...levelMap.entries()]
      .sort(([a], [b]) => a - b)
      .map(([level, apps]) => ({
        level,
        apps: apps.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    return sortedLevels;
  }, [data.compileApps]);

  const levelStatuses = useMemo(() => {
    const statuses = new Map<number, LevelStatus>();

    for (let i = 0; i < levels.length; i++) {
      const { level, apps } = levels[i];
      const allCompleted = apps.every((a) => a.status === 'completed');
      const someCompleted = apps.some((a) => a.status === 'completed') || apps.some((a) => a.status === 'in_progress');

      if (i === 0) {
        statuses.set(level, allCompleted ? 'completed' : 'available');
      } else {
        const prevLevel = levels[i - 1].level;
        const prevStatus = statuses.get(prevLevel);

        if (prevStatus !== 'completed') {
          statuses.set(level, allCompleted ? 'completed' : 'blocked');
        } else {
          statuses.set(level, allCompleted ? 'completed' : someCompleted ? 'available' : 'available');
        }
      }
    }

    return statuses;
  }, [levels]);

  return (
    <div className="kanban-container">
      <InstallChecklist
        apps={installApps}
        onToggle={onToggleInstall}
        currentUser={currentUser}
      />

      <h2 className="compile-title">App da compilare per livello</h2>

      <div className="kanban-board">
        {levels.map(({ level, apps }) => (
          <LevelColumn
            key={level}
            level={level}
            apps={apps}
            levelStatus={levelStatuses.get(level) || 'blocked'}
            onStatusChange={onCompileStatusChange}
            currentUser={currentUser}
          />
        ))}
      </div>

      <DependencyGraph data={data} />
    </div>
  );
}
