import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logOut } from '../supabase';
import { FileUpload } from './FileUpload';
import type { MigrationFileData } from '../types';

interface HeaderProps {
  migrationName: string | null;
  onImport: (data: MigrationFileData) => Promise<void>;
}

export function Header({ migrationName, onImport }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">📦 BC Migration Tracker</h1>
        {migrationName && <span className="header-migration-name">{migrationName}</span>}
      </div>
      <div className="header-right">
        <button className="btn-theme" onClick={toggle} title={theme === 'light' ? 'Tema scuro' : 'Tema chiaro'}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <FileUpload onImport={onImport} />
        {user && (
          <div className="header-user">
            <span className="header-user-name">{user.user_metadata?.display_name || user.email}</span>
            <button className="btn-logout" onClick={logOut}>Esci</button>
          </div>
        )}
      </div>
    </header>
  );
}
