import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { logOut, updateDisplayName } from '../supabase';
import { FileUpload } from './FileUpload';
import type { MigrationFileData } from '../types';

interface HeaderProps {
  migrationName: string | null;
  onImport: (data: MigrationFileData) => Promise<void>;
}

export function Header({ migrationName, onImport }: HeaderProps) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const openEditName = () => {
    setNewName(user?.user_metadata?.display_name || '');
    setEditingName(true);
  };

  const saveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingName(true);
    await updateDisplayName(newName.trim());
    setSavingName(false);
    setEditingName(false);
  };

  return (
    <>
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
              <button className="btn-edit-name" onClick={openEditName} title="Cambia nome visualizzato">✏️</button>
              <button className="btn-logout" onClick={() => setConfirmLogout(true)}>Esci</button>
            </div>
          )}
        </div>
      </header>

      {editingName && (
        <div className="modal-overlay" onClick={() => setEditingName(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cambia nome visualizzato</h3>
            <form onSubmit={saveDisplayName} className="login-form" style={{ marginBottom: 0 }}>
              <input
                type="text"
                className="login-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome visualizzato"
                autoFocus
                required
              />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingName(false)}>Annulla</button>
                <button type="submit" className="btn-confirm" disabled={savingName || !newName.trim()}>
                  {savingName ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmLogout && (
        <div className="modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Conferma uscita</h3>
            <p>Sei sicuro di voler uscire?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmLogout(false)}>Annulla</button>
              <button className="btn-confirm btn-confirm--danger" onClick={logOut}>Esci</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
