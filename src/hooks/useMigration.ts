import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import type { MigrationData, MigrationFileData, AppStatus, UserInfo, InstallApp, CompileApp } from '../types';
import { slugify } from '../utils/parseScript';

export function useMigration() {
  const [data, setData] = useState<MigrationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data: migration } = await supabase
      .from('migrations')
      .select('*')
      .eq('id', 'active')
      .single();

    if (!migration) {
      setData(null);
      setLoading(false);
      return;
    }

    const { data: installs } = await supabase
      .from('install_apps')
      .select('*')
      .eq('migration_id', 'active');

    const { data: compiles } = await supabase
      .from('compile_apps')
      .select('*')
      .eq('migration_id', 'active');

    const installApps: Record<string, InstallApp> = {};
    for (const row of installs || []) {
      installApps[row.id] = {
        id: row.id,
        name: row.name,
        installed: row.installed,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      };
    }

    const compileApps: Record<string, CompileApp> = {};
    for (const row of compiles || []) {
      compileApps[row.id] = {
        id: row.id,
        name: row.name,
        level: row.level,
        status: row.status,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      };
    }

    setData({
      name: migration.name,
      createdAt: migration.created_at,
      updatedAt: migration.updated_at,
      installApps,
      compileApps,
      dependencies: migration.dependencies || {},
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const migrationSub = supabase
      .channel('migrations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'migrations' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'install_apps' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compile_apps' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(migrationSub);
    };
  }, [fetchAll]);

  const importMigration = useCallback(async (fileData: MigrationFileData) => {
    const now = new Date().toISOString();

    // Clear existing data
    await supabase.from('compile_apps').delete().eq('migration_id', 'active');
    await supabase.from('install_apps').delete().eq('migration_id', 'active');
    await supabase.from('migrations').delete().eq('id', 'active');

    // Insert migration
    await supabase.from('migrations').insert({
      id: 'active',
      name: fileData.name || `Migrazione ${new Date().toLocaleDateString('it-IT')}`,
      created_at: now,
      updated_at: now,
      dependencies: fileData.dependencies || {},
    });

    // Insert install apps
    const installRows = fileData.installApps.map((name) => ({
      id: slugify(name),
      migration_id: 'active',
      name,
      installed: false,
      updated_by: null,
      updated_at: null,
    }));
    if (installRows.length > 0) {
      await supabase.from('install_apps').insert(installRows);
    }

    // Insert compile apps
    const compileRows = fileData.compileLevels.flatMap((level) =>
      level.apps.map((name) => ({
        id: slugify(name),
        migration_id: 'active',
        name,
        level: level.level,
        status: 'not_started' as AppStatus,
        updated_by: null,
        updated_at: null,
      }))
    );
    if (compileRows.length > 0) {
      await supabase.from('compile_apps').insert(compileRows);
    }
  }, []);

  const toggleInstallApp = useCallback(async (appId: string, installed: boolean, user: UserInfo) => {
    const now = new Date().toISOString();
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: now,
        installApps: {
          ...prev.installApps,
          [appId]: { ...prev.installApps[appId], installed, updatedBy: user, updatedAt: now },
        },
      };
    });
    await supabase
      .from('install_apps')
      .update({ installed, updated_by: user, updated_at: now })
      .eq('id', appId);
    await supabase
      .from('migrations')
      .update({ updated_at: now })
      .eq('id', 'active');
  }, []);

  const updateCompileAppStatus = useCallback(async (appId: string, status: AppStatus, user: UserInfo) => {
    const now = new Date().toISOString();
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: now,
        compileApps: {
          ...prev.compileApps,
          [appId]: { ...prev.compileApps[appId], status, updatedBy: user, updatedAt: now },
        },
      };
    });
    await supabase
      .from('compile_apps')
      .update({ status, updated_by: user, updated_at: now })
      .eq('id', appId);
    await supabase
      .from('migrations')
      .update({ updated_at: now })
      .eq('id', 'active');
  }, []);

  return { data, loading, importMigration, toggleInstallApp, updateCompileAppStatus, refetch: fetchAll };
}
