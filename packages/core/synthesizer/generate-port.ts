// Stage 4 — injectable LLM port for the recipe-less generate-path (Path A).
// Unlike Stage-2 menu-pick, the client here supplies the full rule body
// (ruleId + eslintConfig + examples + negativeTest) — no recipe lookup needed.
// Our code assembles SynthesisPlan from the selection; the LLM never authors TS.
//
// Menu type reused from menu-pick-port.ts (same framework/version/candidates shape).
// In CI, inject stubGenerateRN / stubGenerateBad from generate-stubs.ts.
// At install-time (Stage 5), inject the live Anthropic adapter.

import type { Menu } from './menu-pick-port.ts';

export type { Menu, MenuCandidate } from './menu-pick-port.ts';

export interface GenerateCandidate {
  /** ResearchEntry.id this rule was derived from. */
  entryId: string;
  /** EXISTING ESLint rule id, e.g. 'no-restricted-globals' | 'no-restricted-imports'. Never an invented selector. */
  ruleId: string;
  title: string;
  stack: string[];
  /**
   * ESLint config for ruleId in the ['severity', options] tuple form required by mergeEslintRuleConfig.
   * Absent or empty → synthesizeGenerate emits check.type:'manual' (plugin rule not in L4 harness registry).
   */
  eslintConfig?: Record<string, unknown>;
  examples: { bad: string; good: string };
  /**
   * Required when eslintConfig is present — L4 gate-2 enforces presence at runtime for check.type:'eslint'.
   * Absent for manual-type rules.
   */
  negativeTest?: { input: string[]; 'expect-violation': string };
}

export interface GenerateSelection {
  rules: GenerateCandidate[];
}

export interface GenerateClient {
  generate(menu: Menu): Promise<GenerateSelection>;
}
