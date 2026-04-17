import { useRef, useState } from 'react';
import type { MigrationFileData } from '../types';
import { parseScriptOutput, parseDependenciesJson } from '../utils/parseScript';

interface FileUploadProps {
  onImport: (data: MigrationFileData) => Promise<void>;
}

function isDependenciesJson(obj: unknown): obj is Record<string, string[]> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
  return Object.values(obj as Record<string, unknown>).every(
    (v) => Array.isArray(v) && v.every((i) => typeof i === 'string')
  );
}

export function FileUpload({ onImport }: FileUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<MigrationFileData | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    let parsed: MigrationFileData;

    if (file.name.endsWith('.json')) {
      const json = JSON.parse(text);
      if (isDependenciesJson(json)) {
        // Format: { "AppName": ["Dep1", ...], ... }
        parsed = parseDependenciesJson(json);
      } else {
        // Legacy format: { installApps: [...], compileLevels: [...] }
        parsed = json as MigrationFileData;
      }
    } else {
      parsed = parseScriptOutput(text);
    }

    setPendingData(parsed);
    setShowConfirm(true);

    if (fileRef.current) fileRef.current.value = '';
  };

  const confirmImport = async () => {
    if (!pendingData) return;
    setImporting(true);
    try {
      await onImport(pendingData);
    } finally {
      setImporting(false);
      setShowConfirm(false);
      setPendingData(null);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json,.txt"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <button
        className="btn-upload"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
      >
        📄 Importa migrazione
      </button>

      {showConfirm && pendingData && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Conferma importazione</h3>
            <p>
              Verranno importate <strong>{pendingData.installApps.length}</strong> app da installare
              e <strong>{pendingData.compileLevels.reduce((s, l) => s + l.apps.length, 0)}</strong> app
              da compilare su <strong>{pendingData.compileLevels.length}</strong> livelli.
            </p>
            <p className="modal-warning">
              ⚠️ Questa operazione sovrascriverà i dati di migrazione esistenti.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Annulla</button>
              <button className="btn-confirm" onClick={confirmImport} disabled={importing}>
                {importing ? 'Importazione...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
