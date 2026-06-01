// @ts-nocheck
// Pattern-keyed delta between two ResearchPlans.
// Granularity: entry.id is the join key. `modified` set requires a stable
// content hash so key-order changes alone don't trigger churn.

import type { ResearchEntry, ResearchPlan } from './types.ts';

export interface ResearchModification {
  id: string;
  before: ResearchEntry;
  after: ResearchEntry;
}

export interface ResearchDelta {
  added: ResearchEntry[];
  removed: string[];
  modified: ResearchModification[];
  frameworkChanged: { before: string | null; after: string | null } | null;
  versionChanged: { before: string | null; after: string | null } | null;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys
      .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function diffPlans(a: ResearchPlan, b: ResearchPlan): ResearchDelta {
  const aById = new Map(a.patterns.map((e) => [e.id, e]));
  const bById = new Map(b.patterns.map((e) => [e.id, e]));

  const added: ResearchEntry[] = [];
  const removed: string[] = [];
  const modified: ResearchModification[] = [];

  for (const [id, after] of bById) {
    const before = aById.get(id);
    if (!before) {
      added.push(after);
      continue;
    }
    if (stableStringify(before) !== stableStringify(after)) {
      modified.push({ id, before, after });
    }
  }
  for (const [id] of aById) {
    if (!bById.has(id)) removed.push(id);
  }

  added.sort((x, y) => x.id.localeCompare(y.id));
  removed.sort();
  modified.sort((x, y) => x.id.localeCompare(y.id));

  return {
    added,
    removed,
    modified,
    frameworkChanged:
      a.framework !== b.framework
        ? { before: a.framework, after: b.framework }
        : null,
    versionChanged:
      a.version !== b.version ? { before: a.version, after: b.version } : null,
  };
}
