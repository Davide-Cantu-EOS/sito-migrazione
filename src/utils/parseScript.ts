import type { MigrationFileData } from '../types';

/** Format: { "AppName": ["Dep1", "Dep2"], ... } */
type DependenciesJson = Record<string, string[]>;

export function parseDependenciesJson(deps: DependenciesJson): MigrationFileData {
  const parentApps = new Set(Object.keys(deps));
  const childApps = new Set<string>();

  for (const depList of Object.values(deps)) {
    for (const dep of depList) {
      childApps.add(dep);
    }
  }

  // Apps to install = dependencies that are not themselves parent apps
  const installApps = [...childApps].filter((a) => !parentApps.has(a)).sort();

  // Apps to compile = all parent apps
  const appsToCompile = new Set(parentApps);

  // Build dependency map removing install-only apps
  const depMap = new Map<string, Set<string>>();
  for (const [app, depList] of Object.entries(deps)) {
    const filtered = new Set<string>();
    for (const d of depList) {
      if (!installApps.includes(d)) {
        filtered.add(d);
      }
    }
    depMap.set(app, filtered);
  }

  // Topological sort by levels
  const remaining = new Set(appsToCompile);
  const compileLevels: { level: number; apps: string[] }[] = [];
  let level = 0;

  while (remaining.size > 0) {
    const zeroDeps = [...remaining]
      .filter((app) => {
        const d = depMap.get(app);
        return !d || d.size === 0;
      })
      .sort();

    if (zeroDeps.length === 0) {
      throw new Error('Dipendenze circolari o mancanti, impossibile continuare.');
    }

    compileLevels.push({ level, apps: zeroDeps });

    for (const app of zeroDeps) {
      remaining.delete(app);
    }
    for (const d of depMap.values()) {
      for (const app of zeroDeps) {
        d.delete(app);
      }
    }

    level++;
  }

  // Build compile-to-compile dependency map for graph
  const dependencies: Record<string, string[]> = {};
  for (const [app, depList] of Object.entries(deps)) {
    const compileDeps = depList.filter((d) => parentApps.has(d));
    dependencies[app] = compileDeps;
  }

  return { installApps, compileLevels, dependencies };
}

export function parseScriptOutput(text: string): MigrationFileData {
  const lines = text.split('\n').map((l) => l.trimEnd());
  const installApps: string[] = [];
  const compileLevels: { level: number; apps: string[] }[] = [];

  let section: 'none' | 'install' | 'compile' = 'none';
  let currentLevel = -1;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/app\s+da\s+installare/i.test(trimmed)) {
      section = 'install';
      continue;
    }

    if (/app\s+da\s+compilare/i.test(trimmed)) {
      section = 'compile';
      continue;
    }

    const levelMatch = trimmed.match(/^livello\s+(\d+)$/i);
    if (levelMatch) {
      currentLevel = parseInt(levelMatch[1], 10);
      compileLevels.push({ level: currentLevel, apps: [] });
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      const appName = trimmed.replace(/^[-•]\s+/, '').trim();
      if (!appName) continue;

      if (section === 'install') {
        installApps.push(appName);
      } else if (section === 'compile' && currentLevel >= 0) {
        const lvl = compileLevels.find((l) => l.level === currentLevel);
        if (lvl) lvl.apps.push(appName);
      }
    }
  }

  return { installApps, compileLevels };
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
