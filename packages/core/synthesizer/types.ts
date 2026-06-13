// Layer 3 Synthesizer (Path A) public types.
// SynthesizedRule shape is intentionally aligned with manifest's RuleEntry
// (rules-manifest.schema.json#/definitions/RuleEntry) so generated rules
// validate identically to manually authored ones — Phase 5 retro Q1 reuse.

import type { Provenance } from '../research/types.ts';

export type ManifestCheck =
  | { type: 'eslint'; rule: string }
  | { type: 'command'; command: string }
  | { type: 'script'; script: string }
  | { type: 'manual'; rationale?: string };

export interface NegativeTest {
  /** One or more code snippets — each must produce the expected violation (bypass variants). */
  input: string[];
  'expect-violation': string;
}

export interface Fixture {
  'setup-script': string;
  'cleanup-script'?: string;
  cwd?: string;
}

/** Rationalizing pressures a baseline-prompt may apply — the forcing function (T-V3-A). */
export type PressureType = 'time' | 'authority' | 'sunk-cost' | 'scope-creep';

export interface PressureScenario {
  'baseline-prompt': string;
  'observable-failure': string;
  'observable-compliance': string;
  /** Which pressure(s) the baseline-prompt applies (≥1). A scenario with no pressure is a
   *  violating example, not a forcing function (T-V3-A). */
  pressure: PressureType[];
}

export interface SynthesizedRule {
  id: string;
  title: string;
  stack: string[];
  'applies-to'?: string[];
  check: ManifestCheck;
  examples: { bad: string; good: string };
  'negative-test'?: NegativeTest;
  fixture?: Fixture;
  'pressure-scenario'?: PressureScenario;
  research: { entryId: string; provenance: Provenance[] };
}

export interface SynthesisPlan {
  framework: string | null;
  version: string | null;
  rules: SynthesizedRule[];
  rulesMd: string;
  eslintConfigSnippet: string;
}
