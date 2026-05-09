// A8 calibration corpus — regression guard for preset-similarity weights formula.
// Per docs/meta-factory/PHASE-9-PROMPT.md §4 T3.
// 5 mutants × 3 dimensions verify the formula behaves as designed.
// NOT statistical calibration of W_RULES=0.4 / W_KEYS=0.4 / W_GLOBS=0.2 values
// — those require real divergent-plan data per retros/phase-8.md Self-reflection #9.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SynthesisPlan } from '../synthesizer/types.ts';
import { presetSimilarity } from './preset-similarity.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = resolve(
  HERE, '..', 'tests', 'snapshots', 'expected-canonical-v15.json',
);

const W_RULES = 0.4;
const W_KEYS = 0.4;
const W_GLOBS = 0.2;
const TOLERANCE = 0.01;

// ---------------------------------------------------------------------------
// Mutator helpers — pure deep-clone-and-edit
// ---------------------------------------------------------------------------

/**
 * Remove the second-to-last rule from a deep-cloned plan.
 * For canonical-v15, rules G2 and G3 share identical globs
 * (`src/app/**\/*.ts`, `src/lib/actions/**\/*.ts`), so removing G2 (index N-2)
 * leaves the glob file-set unchanged — isolating the rule-dimension.
 */
function dropRule(p: SynthesisPlan): SynthesisPlan {
  const clone: SynthesisPlan = JSON.parse(JSON.stringify(p)) as SynthesisPlan;
  // Drop the second-to-last rule (index N-2): its globs are covered by the
  // last rule, so globOverlap stays 1.0.
  const dropIdx = clone.rules.length - 2;
  clone.rules = clone.rules.filter((_, i) => i !== dropIdx);
  return clone;
}

/** Remove the first top-level ESLint config key from a deep-cloned plan. */
function dropEslintKey(p: SynthesisPlan): SynthesisPlan {
  const clone: SynthesisPlan = JSON.parse(JSON.stringify(p)) as SynthesisPlan;
  const snippet = JSON.parse(clone.eslintConfigSnippet) as Record<string, unknown>;
  const firstKey = Object.keys(snippet)[0];
  if (firstKey !== undefined) {
    const { [firstKey]: _removed, ...rest } = snippet;
    clone.eslintConfigSnippet = JSON.stringify(rest);
  }
  return clone;
}

/**
 * Tighten the first `applies-to` entry across all rules.
 * Replaces `src/**\/*.tsx` with `src/app/**\/*.tsx`, which is a strictly
 * narrower glob over FILE_CORPUS (3 matches vs 5).
 */
function tightenGlob(p: SynthesisPlan): SynthesisPlan {
  const clone: SynthesisPlan = JSON.parse(JSON.stringify(p)) as SynthesisPlan;
  let replaced = false;
  for (const rule of clone.rules) {
    if (!replaced && rule['applies-to'] !== undefined) {
      rule['applies-to'] = rule['applies-to'].map((g) => {
        if (!replaced && g === 'src/**/*.tsx') {
          replaced = true;
          return 'src/app/**/*.tsx';
        }
        return g;
      });
    }
  }
  return clone;
}

/** Compound mutant: drop 1 rule AND drop 1 ESLint key. */
function compound(p: SynthesisPlan): SynthesisPlan {
  return dropEslintKey(dropRule(p));
}

// ---------------------------------------------------------------------------
// Corpus
// ---------------------------------------------------------------------------

describe('A8 — preset-similarity calibration corpus (5 mutants from canonical-v15)', () => {
  const canonical = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as SynthesisPlan;
  const N = canonical.rules.length;
  const K = Object.keys(
    JSON.parse(canonical.eslintConfigSnippet) as Record<string, unknown>,
  ).length;

  it('sanity: canonical-v15 has N=3 rules and K=3 ESLint keys', () => {
    expect(N).toBe(3);
    expect(K).toBe(3);
  });

  it('mutant 1 — identity → similarity 1.0', () => {
    const s = presetSimilarity(canonical, canonical).similarity;
    expect(Math.abs(s - 1.0)).toBeLessThan(TOLERANCE);
  });

  it('mutant 2 — drop 1 rule → ruleIds=(N-1)/N, keys/globs unchanged', () => {
    const mutated = dropRule(canonical);
    const result = presetSimilarity(canonical, mutated);
    const expected = W_RULES * ((N - 1) / N) + W_KEYS * 1 + W_GLOBS * 1;
    expect(result.components.eslintKeys).toBe(1.0);
    expect(result.components.globOverlap).toBe(1.0);
    expect(Math.abs(result.similarity - expected)).toBeLessThan(TOLERANCE);
  });

  it('mutant 3 — drop 1 ESLint key → eslintKeys=(K-1)/K, rules/globs unchanged', () => {
    const mutated = dropEslintKey(canonical);
    const result = presetSimilarity(canonical, mutated);
    const expected = W_RULES * 1 + W_KEYS * ((K - 1) / K) + W_GLOBS * 1;
    expect(result.components.ruleIds).toBe(1.0);
    expect(result.components.globOverlap).toBe(1.0);
    expect(Math.abs(result.similarity - expected)).toBeLessThan(TOLERANCE);
  });

  it('mutant 4 — tighten 1 glob → globOverlap<1.0, rules/keys unchanged', () => {
    const mutated = tightenGlob(canonical);
    const result = presetSimilarity(canonical, mutated);
    // src/**/*.tsx (5 corpus hits) → src/app/**/*.tsx (3 corpus hits):
    // intersection with other rules' globs included:
    // canonical: {src/app/page.tsx, src/app/layout.tsx, src/app/(group)/post/[id]/page.tsx,
    //             src/components/Card.tsx, src/components/Header.tsx,
    //             src/app/actions.ts, src/lib/actions/createPost.ts} = 7 files
    // tightened: {src/app/page.tsx, src/app/layout.tsx, src/app/(group)/post/[id]/page.tsx,
    //             src/app/actions.ts, src/lib/actions/createPost.ts} = 5 files
    // Jaccard = 5 / 7
    expect(result.components.globOverlap).toBeLessThan(1.0);
    expect(result.components.ruleIds).toBe(1.0);
    expect(result.components.eslintKeys).toBe(1.0);
    const expected = W_RULES * 1 + W_KEYS * 1 + W_GLOBS * result.components.globOverlap;
    expect(Math.abs(result.similarity - expected)).toBeLessThan(TOLERANCE);
  });

  it('mutant 5 — compound (drop rule + drop key) → both dimensions reduced', () => {
    const mutated = compound(canonical);
    const result = presetSimilarity(canonical, mutated);
    const expected =
      W_RULES * ((N - 1) / N) + W_KEYS * ((K - 1) / K) + W_GLOBS * 1;
    expect(result.components.globOverlap).toBe(1.0);
    expect(Math.abs(result.similarity - expected)).toBeLessThan(TOLERANCE);
  });
});
