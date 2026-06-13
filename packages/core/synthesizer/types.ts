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

/**
 * Optional override for the cmd/script guard-liveness mode (v1.5). The mode is
 * DERIVED from check.type by default (command → run-and-assert, script →
 * resolve-and-run); this field overrides it for the exceptions:
 *   - "run"             force run-and-assert (a script that is directly runnable)
 *   - "workflow-exists" liveness = the named CI workflow exists + references jobs
 *   - "config-presence" liveness = the rule's required config exists in the repo
 *   - "exempt"          no runnable form — excluded from the gate + fixture-required flip
 */
export type LivenessModeOverride = 'run' | 'workflow-exists' | 'config-presence' | 'exempt';

export interface PressureScenario {
  'baseline-prompt': string;
  'observable-failure': string;
  'observable-compliance': string;
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
  'liveness-mode'?: LivenessModeOverride;
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
