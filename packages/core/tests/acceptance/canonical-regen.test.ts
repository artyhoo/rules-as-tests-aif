// Phase 8 Task 8.6 — canonical regen acceptance.
// Synthesize the curated preset-next-15-canonical plan via L2+L3+L4, compare
// to the frozen baseline at tests/snapshots/expected-canonical-v15.json via
// the Phase 8 similarity metric. Acceptance: similarity ≥ 0.95 (≤5% diff).
//
// Per phase-8-research.md §3, the metric is deterministic; with no recipe /
// research drift, similarity == 1.0. Threshold gives 5% headroom for drift
// like minor recipe edits between baseline freeze and CI regen.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ACCEPTANCE_THRESHOLD, meetsAcceptance, presetSimilarity } from '../../diff/index.ts';
import { loadEntries } from '../../research/load.ts';
import { synthesize } from '../../synthesizer/synthesize.ts';
import type { SynthesisPlan } from '../../synthesizer/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = resolve(HERE, '..', 'snapshots', 'expected-canonical-v15.json');

const CANONICAL_V15_PATTERNS = [
  'next-r12-no-server-imports-in-client',
  'next-r14-require-form-safe-parse',
  'next-r20-require-use-server-directive',
] as const;

function regenerateCanonicalV15(): SynthesisPlan {
  const patterns = loadEntries('next', '15.4.0', [...CANONICAL_V15_PATTERNS]);
  return synthesize({
    framework: 'next',
    version: '15.4.0',
    patterns,
    missing: [],
    drift: null,
  });
}

describe('Phase 8 acceptance: canonical Next 15 preset regen', () => {
  it('frozen baseline exists at tests/snapshots/expected-canonical-v15.json', () => {
    const frozen = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as SynthesisPlan;
    expect(frozen.framework).toBe('next');
    expect(frozen.rules.length).toBe(3);
  });

  it('regen via L2+L3 loads exactly 3 patterns', () => {
    const patterns = loadEntries('next', '15.4.0', [...CANONICAL_V15_PATTERNS]);
    expect(patterns.map((p) => p.id).sort()).toEqual([...CANONICAL_V15_PATTERNS].sort());
  });

  it('synthesizer regen produces 3 rules + populated eslintConfigSnippet', () => {
    const regen = regenerateCanonicalV15();
    expect(regen.rules.length).toBe(3);
    const snippet = JSON.parse(regen.eslintConfigSnippet) as Record<string, unknown>;
    // R12 stays a named eslint rule; R14 + R20 are now declarative and merge their
    // selectors under the single exempt-aware wrapper key (audit:exempt migration).
    expect(Object.keys(snippet)).toEqual([
      'rules-as-tests/no-server-imports-in-client',
      'rules-as-tests/restricted-syntax-audit-exempt',
    ]);
  });

  it('similarity(regen, frozen) >= ACCEPTANCE_THRESHOLD (Phase 8 acceptance gate)', () => {
    const regen = regenerateCanonicalV15();
    const frozen = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as SynthesisPlan;
    const score = presetSimilarity(regen, frozen);
    expect(score.components.ruleIds).toBeGreaterThanOrEqual(ACCEPTANCE_THRESHOLD);
    expect(score.components.eslintKeys).toBeGreaterThanOrEqual(ACCEPTANCE_THRESHOLD);
    // Phase 8 acceptance: similarity(regen, frozen) ≥ 0.95.
    expect(meetsAcceptance(score.similarity)).toBe(true);
    // Deterministic synthesis under unchanged inputs ⇒ similarity is exactly 1.0.
    expect(score.similarity).toBe(1.0);
  });
});
