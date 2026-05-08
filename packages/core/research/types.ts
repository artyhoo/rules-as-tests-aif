// Research Agent (Layer 2) public types.
// Consumed by L3 (Synthesizer) via index.ts; load.ts/diff.ts/drift.ts internal.

export interface Provenance {
  url: string;
  allowlistKey: string;
  fetchedAt: string;
}

export interface ResearchEntry {
  id: string;
  summary: string;
  bestPractices: string[];
  antiPatterns: string[];
  provenance: Provenance[];
  extras?: Record<string, unknown>;
}

export type DriftKind = 'modal-verb' | 'term-presence';

export interface DriftMismatch {
  kind: DriftKind;
  detail: string;
  foundIn: string[];
  missingIn: string[];
}

export interface DriftReport {
  sources: string[];
  mismatches: DriftMismatch[];
}

export interface ResearchPlan {
  framework: string | null;
  version: string | null;
  patterns: ResearchEntry[];
  missing: string[];
  drift: DriftReport | null;
}
