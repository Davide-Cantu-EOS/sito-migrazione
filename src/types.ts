export type AppStatus = 'not_started' | 'in_progress' | 'completed';

export type LevelStatus = 'blocked' | 'available' | 'completed';

export interface UserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export interface InstallApp {
  id: string;
  name: string;
  installed: boolean;
  updatedBy: UserInfo | null;
  updatedAt: string | null;
}

export interface CompileApp {
  id: string;
  name: string;
  level: number;
  status: AppStatus;
  updatedBy: UserInfo | null;
  updatedAt: string | null;
}

export interface MigrationData {
  name: string;
  createdAt: string;
  updatedAt: string;
  installApps: Record<string, InstallApp>;
  compileApps: Record<string, CompileApp>;
  dependencies: Record<string, string[]>;
}

export interface MigrationFileData {
  name?: string;
  installApps: string[];
  compileLevels: {
    level: number;
    apps: string[];
  }[];
  dependencies?: Record<string, string[]>;
}
