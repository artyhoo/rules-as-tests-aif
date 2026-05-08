import { describe, expect, it } from 'vitest';
import type { SynthesisPlan, SynthesizedRule } from '../synthesizer/types.ts';
import {
  ACCEPTANCE_THRESHOLD,
  FILE_CORPUS,
  meetsAcceptance,
  presetSimilarity,
} from './preset-similarity.ts';

function rule(over: Partial<SynthesizedRule>): SynthesizedRule {
  return {
    id: 'G1',
    title: 't',
    stack: ['react-next'],
    'applies-to': ['src/app/**/*.tsx'],
    check: { type: 'eslint', rule: 'no-restricted-imports' },
    examples: { bad: 'b', good: 'g' },
    research: { entryId: 'x', provenance: [] },
    ...over,
  };
}

function plan(over: Partial<SynthesisPlan>): SynthesisPlan {
  return {
    framework: 'next',
    version: '15.0.0',
    rules: [],
    rulesMd: '',
    eslintConfigSnippet: '{}',
    ...over,
  };
}

describe('presetSimilarity', () => {
  it('returns 1.0 for two identical plans', () => {
    const r1 = rule({ check: { type: 'eslint', rule: 'rules-as-tests/r12' } });
    const p = plan({
      rules: [r1],
      eslintConfigSnippet: JSON.stringify({ 'rules-as-tests/r12': 'error' }),
    });
    const score = presetSimilarity(p, p);
    expect(score.similarity).toBe(1.0);
    expect(score.components).toEqual({ ruleIds: 1, eslintKeys: 1, globOverlap: 1 });
  });

  it('returns 1.0 for two empty plans (jaccard empty/empty = 1.0)', () => {
    const score = presetSimilarity(plan({}), plan({}));
    expect(score.similarity).toBe(1.0);
  });

  it('returns 0.0 for fully disjoint plans', () => {
    const a = plan({
      rules: [rule({ check: { type: 'eslint', rule: 'a' }, 'applies-to': ['src/app/**/*.tsx'] })],
      eslintConfigSnippet: JSON.stringify({ a: 'error' }),
    });
    const b = plan({
      rules: [rule({ check: { type: 'eslint', rule: 'b' }, 'applies-to': ['middleware.ts'] })],
      eslintConfigSnippet: JSON.stringify({ b: 'error' }),
    });
    const score = presetSimilarity(a, b);
    expect(score.components.ruleIds).toBe(0);
    expect(score.components.eslintKeys).toBe(0);
    expect(score.components.globOverlap).toBe(0);
    expect(score.similarity).toBe(0);
  });

  it('partial rule overlap: 1-of-3 matches → ruleIds = 1/5', () => {
    const a = plan({
      rules: [
        rule({ id: 'G1', check: { type: 'eslint', rule: 'r1' }, 'applies-to': [] }),
        rule({ id: 'G2', check: { type: 'eslint', rule: 'r2' }, 'applies-to': [] }),
        rule({ id: 'G3', check: { type: 'eslint', rule: 'r3' }, 'applies-to': [] }),
      ],
      eslintConfigSnippet: JSON.stringify({ r1: 'e', r2: 'e', r3: 'e' }),
    });
    const b = plan({
      rules: [
        rule({ id: 'G1', check: { type: 'eslint', rule: 'r1' }, 'applies-to': [] }),
        rule({ id: 'G2', check: { type: 'eslint', rule: 'r4' }, 'applies-to': [] }),
        rule({ id: 'G3', check: { type: 'eslint', rule: 'r5' }, 'applies-to': [] }),
      ],
      eslintConfigSnippet: JSON.stringify({ r1: 'e', r4: 'e', r5: 'e' }),
    });
    const score = presetSimilarity(a, b);
    expect(score.components.ruleIds).toBeCloseTo(1 / 5, 5);
    expect(score.components.eslintKeys).toBeCloseTo(1 / 5, 5);
  });

  it('partial eslint-key overlap: ruleIds match but snippet keys diverge', () => {
    const r1 = rule({ check: { type: 'eslint', rule: 'r1' }, 'applies-to': [] });
    const a = plan({
      rules: [r1],
      eslintConfigSnippet: JSON.stringify({ r1: 'error', extra: 'warn' }),
    });
    const b = plan({
      rules: [r1],
      eslintConfigSnippet: JSON.stringify({ r1: 'error' }),
    });
    const score = presetSimilarity(a, b);
    expect(score.components.ruleIds).toBe(1);
    expect(score.components.eslintKeys).toBeCloseTo(1 / 2, 5);
  });

  it('glob-overlap edge: src/app/**/*.tsx ⊂ src/**/*.tsx — Jaccard 3/5', () => {
    // src/app/**/*.tsx hits {src/app/page.tsx, src/app/layout.tsx,
    //   src/app/(group)/post/[id]/page.tsx} = 3 files in FILE_CORPUS.
    // src/**/*.tsx additionally hits src/components/{Card,Header}.tsx — 5 total.
    // Jaccard = 3/5.
    const a = plan({
      rules: [rule({ 'applies-to': ['src/app/**/*.tsx'] })],
    });
    const b = plan({
      rules: [rule({ 'applies-to': ['src/**/*.tsx'] })],
    });
    const score = presetSimilarity(a, b);
    expect(score.components.globOverlap).toBeCloseTo(3 / 5, 5);
  });

  it('`**/` matches zero or more directory segments (src/app/page.tsx must hit)', () => {
    // Regression guard: pre-fix `globToRegex` required at least one `/` between
    // `src/app/` and the leaf, missing src/app/page.tsx + src/app/layout.tsx.
    const a = plan({ rules: [rule({ 'applies-to': ['src/app/**/*.tsx'] })] });
    const b = plan({ rules: [rule({ 'applies-to': ['src/app/page.tsx'] })] });
    const score = presetSimilarity(a, b);
    // a: {src/app/page.tsx, src/app/layout.tsx, src/app/(group)/post/[id]/page.tsx}
    // b: {src/app/page.tsx}
    // Jaccard = 1/3.
    expect(score.components.globOverlap).toBeCloseTo(1 / 3, 5);
  });

  it('full canonical-shape fixture: similarity ≥ ACCEPTANCE_THRESHOLD on identical regen', () => {
    const canonical = plan({
      framework: 'next',
      version: '15.4.0',
      rules: [
        rule({
          id: 'G1',
          check: { type: 'eslint', rule: 'rules-as-tests/no-server-imports-in-client' },
          'applies-to': ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
        }),
        rule({
          id: 'G2',
          check: { type: 'eslint', rule: 'rules-as-tests/require-form-safe-parse' },
          'applies-to': ['src/app/**/actions.ts'],
        }),
        rule({
          id: 'G3',
          check: { type: 'eslint', rule: 'rules-as-tests/require-use-server-directive' },
          'applies-to': ['src/app/**/actions.ts'],
        }),
      ],
      eslintConfigSnippet: JSON.stringify({
        'rules-as-tests/no-server-imports-in-client': 'error',
        'rules-as-tests/require-form-safe-parse': 'error',
        'rules-as-tests/require-use-server-directive': 'error',
      }),
    });
    const score = presetSimilarity(canonical, canonical);
    expect(score.similarity).toBe(1.0);
    expect(meetsAcceptance(score.similarity)).toBe(true);
  });

  it('FILE_CORPUS is exactly 20 representative files', () => {
    expect(FILE_CORPUS.length).toBe(20);
    expect(FILE_CORPUS).toContain('middleware.ts');
    expect(FILE_CORPUS).toContain('proxy.ts');
  });

  it('meetsAcceptance threshold gate: 0.94 below, 0.95 at boundary, 0.96 above', () => {
    expect(meetsAcceptance(0.94)).toBe(false);
    expect(meetsAcceptance(ACCEPTANCE_THRESHOLD)).toBe(true);
    expect(meetsAcceptance(0.96)).toBe(true);
  });
});
