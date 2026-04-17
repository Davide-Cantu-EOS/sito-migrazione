import { useAuth } from './context/AuthContext';
import { useMigration } from './hooks/useMigration';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { KanbanBoard } from './components/KanbanBoard';
import { FileUpload } from './components/FileUpload';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import type { UserInfo } from './types';
import './App.css';

function AppContent() {
  const { user, loading: authLoading, isRecovery } = useAuth();
  const { data, loading: dataLoading, importMigration, toggleInstallApp, updateCompileAppStatus } = useMigration();

  if (authLoading) {
    return <div className="loading">Caricamento...</div>;
  }

  if (isRecovery) {
    return <ResetPasswordModal />;
  }

  if (!user) {
    return <Login />;
  }

  const currentUser: UserInfo = {
    uid: user.id,
    displayName: user.user_metadata?.display_name ?? null,
    email: user.email ?? null,
  };

  if (dataLoading) {
    return (
      <>
        <Header migrationName={null} onImport={importMigration} />
        <div className="loading">Caricamento dati migrazione...</div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header migrationName={null} onImport={importMigration} />
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h2>Nessuna migrazione caricata</h2>
          <p>
            Importa un file di migrazione (.json o .txt dall'output dello script)
            per iniziare a tracciare il progresso.
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <FileUpload onImport={importMigration} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header migrationName={data.name} onImport={importMigration} />
      <KanbanBoard
        data={data}
        onToggleInstall={toggleInstallApp}
        onCompileStatusChange={updateCompileAppStatus}
        currentUser={currentUser}
      />
    </>
  );
}

export default function App() {
  return <AppContent />;
}
