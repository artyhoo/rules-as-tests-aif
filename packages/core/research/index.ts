// Layer 2 Research Agent — public API.
// Module surface enforces Planner-Executor isolation: only `research()` and
// types are exposed. No file-write helpers leak through this module — the CLI
// reaches into internals (load/diff/drift) for its own convenience but Layer 3
// in Phase 6 imports only the schema below.

import type { DetectionResult } from '../detector/types.ts';
import { loadEntries } from './load.ts';
import type { ResearchPlan } from './types.ts';

export function research(detection: DetectionResult): ResearchPlan {
  const framework = detection.framework.name;
  const version = detection.framework.version;
  const patterns = loadEntries(framework, version, detection.patterns ?? []);
  return {
    framework,
    version,
    patterns,
    missing: detection.missing ?? [],
    drift: null,
  };
}

export type {
  Provenance,
  ResearchEntry,
  ResearchPlan,
  DriftKind,
  DriftMismatch,
  DriftReport,
} from './types.ts';
