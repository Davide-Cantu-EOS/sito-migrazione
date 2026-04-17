import { useState, useMemo } from 'react';
import type { MigrationData, CompileApp } from '../types';

const NODE_W = 220;
const NODE_H = 32;
const LEVEL_GAP_X = 280;
const NODE_GAP_Y = 12;
const PAD_X = 50;
const PAD_Y = 30;

function getStatusColor(status: string): string {
  return `var(--graph-node-${status === 'completed' ? 'done' : status === 'in_progress' ? 'progress' : 'default'})`;
}

function getStatusBorder(status: string): string {
  return `var(--graph-node-border-${status === 'completed' ? 'done' : status === 'in_progress' ? 'progress' : 'default'})`;
}

interface NodePos {
  x: number;
  y: number;
  app: CompileApp;
}

export function DependencyGraph({ data }: { data: MigrationData }) {
  const [selected, setSelected] = useState<string | null>(null);

  const deps = data.dependencies || {};

  // Build name -> CompileApp lookup
  const appByName = useMemo(() => {
    const map = new Map<string, CompileApp>();
    for (const app of Object.values(data.compileApps)) {
      map.set(app.name, app);
    }
    return map;
  }, [data.compileApps]);

  // Group by level
  const levels = useMemo(() => {
    const map = new Map<number, CompileApp[]>();
    for (const app of Object.values(data.compileApps)) {
      if (!map.has(app.level)) map.set(app.level, []);
      map.get(app.level)!.push(app);
    }
    for (const apps of map.values()) {
      apps.sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [data.compileApps]);

  // Node positions
  const positions = useMemo(() => {
    const pos = new Map<string, NodePos>();
    const maxApps = Math.max(...levels.map(([, apps]) => apps.length), 1);
    const totalHeight = maxApps * (NODE_H + NODE_GAP_Y);

    for (const [level, apps] of levels) {
      const x = PAD_X + level * LEVEL_GAP_X;
      const levelHeight = apps.length * (NODE_H + NODE_GAP_Y);
      const offsetY = (totalHeight - levelHeight) / 2;

      apps.forEach((app, i) => {
        const y = PAD_Y + offsetY + i * (NODE_H + NODE_GAP_Y);
        pos.set(app.name, { x, y, app });
      });
    }
    return pos;
  }, [levels]);

  // Edges
  const edges = useMemo(() => {
    const result: { from: string; to: string }[] = [];
    for (const [appName, depNames] of Object.entries(deps)) {
      if (!positions.has(appName)) continue;
      for (const dep of depNames) {
        if (positions.has(dep)) {
          result.push({ from: dep, to: appName });
        }
      }
    }
    return result;
  }, [deps, positions]);

  // Transitive dependency chain for selected node
  const selectedChain = useMemo(() => {
    if (!selected) return [];
    const visited = new Set<string>();

    function dfs(name: string) {
      if (visited.has(name)) return;
      visited.add(name);
      for (const dep of deps[name] || []) {
        if (appByName.has(dep)) dfs(dep);
      }
    }

    for (const dep of deps[selected] || []) {
      if (appByName.has(dep)) dfs(dep);
    }

    return [...visited]
      .map((name) => appByName.get(name)!)
      .filter(Boolean)
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [selected, deps, appByName]);

  // Highlighted nodes set
  const highlightedSet = useMemo(() => {
    if (!selected) return null;
    const set = new Set(selectedChain.map((a) => a.name));
    set.add(selected);
    return set;
  }, [selected, selectedChain]);

  // Highlighted edges set
  const highlightedEdges = useMemo(() => {
    if (!highlightedSet) return null;
    const set = new Set<string>();
    for (const e of edges) {
      if (highlightedSet.has(e.from) && highlightedSet.has(e.to)) {
        set.add(`${e.from}→${e.to}`);
      }
    }
    return set;
  }, [highlightedSet, edges]);

  if (Object.keys(deps).length === 0) {
    return null;
  }

  const svgWidth = PAD_X * 2 + (levels.length - 1) * LEVEL_GAP_X + NODE_W;
  const maxApps = Math.max(...levels.map(([, apps]) => apps.length), 1);
  const svgHeight = PAD_Y * 2 + maxApps * (NODE_H + NODE_GAP_Y);

  return (
    <div className="dep-graph-section">
      <h2 className="compile-title">Mappa dipendenze</h2>
      <div className="dep-graph-wrapper">
        <div className="dep-graph-svg-scroll">
          <svg width={svgWidth} height={svgHeight} className="dep-graph-svg">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="var(--graph-edge)" opacity="0.5" />
              </marker>
              <marker id="arrow-hl" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((e, i) => {
              const from = positions.get(e.from);
              const to = positions.get(e.to);
              if (!from || !to) return null;

              const key = `${e.from}→${e.to}`;
              const isHl = highlightedEdges?.has(key);
              const isDimmed = highlightedEdges && !isHl;

              const x1 = from.x + NODE_W;
              const y1 = from.y + NODE_H / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_H / 2;
              const cx = (x1 + x2) / 2;

              return (
                <path
                  key={i}
                  d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                  fill="none"
                  stroke={isHl ? '#3b82f6' : 'var(--graph-edge)'}
                  strokeWidth={isHl ? 2 : 1}
                  opacity={isDimmed ? 0.06 : isHl ? 0.85 : 0.2}
                  markerEnd={isHl ? 'url(#arrow-hl)' : 'url(#arrow)'}
                />
              );
            })}

            {/* Level labels */}
            {levels.map(([level]) => (
              <text
                key={`lbl-${level}`}
                x={PAD_X + level * LEVEL_GAP_X + NODE_W / 2}
                y={14}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="var(--graph-label)"
              >
                Livello {level}
              </text>
            ))}

            {/* Nodes */}
            {[...positions.entries()].map(([name, pos]) => {
              const isSelected = selected === name;
              const isDimmed = highlightedSet && !highlightedSet.has(name);

              return (
                <g
                  key={name}
                  className="dep-node"
                  onClick={() => setSelected(isSelected ? null : name)}
                  style={{ cursor: 'pointer' }}
                  opacity={isDimmed ? 0.15 : 1}
                >
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={6}
                    fill={getStatusColor(pos.app.status)}
                    stroke={isSelected ? '#3b82f6' : getStatusBorder(pos.app.status)}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={pos.x + NODE_W / 2}
                    y={pos.y + NODE_H / 2 + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="500"
                    fill="var(--graph-node-text)"
                    pointerEvents="none"
                  >
                    {name.length > 28 ? name.slice(0, 26) + '…' : name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="dep-detail-panel">
            <div className="dep-detail-header">
              <h3>{selected}</h3>
              <button className="dep-detail-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            {selectedChain.length > 0 ? (
              <>
                <p className="dep-detail-subtitle">
                  Ordine di compilazione ({selectedChain.length} dipendenze):
                </p>
                <ol className="dep-detail-list">
                  {selectedChain.map((app) => (
                    <li key={app.name} className={`dep-detail-item dep-detail-item--${app.status}`}>
                      <span className="dep-detail-level">L{app.level}</span>
                      <span className="dep-detail-name">{app.name}</span>
                      <span className="dep-detail-status">
                        {app.status === 'completed' ? '✅' : app.status === 'in_progress' ? '🔄' : '⬜'}
                      </span>
                    </li>
                  ))}
                  <li className="dep-detail-item dep-detail-item--target">
                    <span className="dep-detail-level">L{appByName.get(selected)?.level}</span>
                    <span className="dep-detail-name"><strong>{selected}</strong></span>
                    <span>🎯</span>
                  </li>
                </ol>
              </>
            ) : (
              <p className="dep-detail-subtitle">Nessuna dipendenza da compilare</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
