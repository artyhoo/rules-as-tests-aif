// T2 — Never-firing adversarial corpus (Gate 2 hardening).
// Paired bad/valid plans prove the gate discriminates — not just always-rejects.
// Principle 02 (paired-negative): BAD fixture + VALID counterpart both required.

import { describe, expect, it } from 'vitest';
import { runRuleTesterGate } from './gate-rule-tester.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

// BAD: never-firing rule — negative-test.input is a comment that does NOT
// trigger no-restricted-imports. Gate 2 MUST reject this (no violation produced).
export const neverFiringBadPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G97',
      title: 'adversarial-never-firing',
      stack: ['react-next'],
      check: { type: 'eslint', rule: 'no-restricted-imports' },
      examples: { bad: 'import _ from "lodash"', good: 'import _ from "lodash-es"' },
      'negative-test': {
        // This comment-only input never triggers no-restricted-imports.
        input: ['// no imports here — this input never triggers the rule'],
        'expect-violation': 'no-restricted-imports',
      },
      research: { entryId: 'adv-never-fire', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-imports': [
      'error',
      { paths: [{ name: 'lodash', message: 'use lodash-es' }] },
    ],
  }),
};

// VALID (paired counterpart): correctly-firing rule — negative-test.input
// actually imports 'lodash', which triggers no-restricted-imports.
// Gate 2 MUST accept this.
export const firingValidPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G96',
      title: 'adversarial-valid-firing',
      stack: ['react-next'],
      check: { type: 'eslint', rule: 'no-restricted-imports' },
      examples: { bad: 'import _ from "lodash"', good: 'import _ from "lodash-es"' },
      'negative-test': {
        input: ['import _ from "lodash"'],
        'expect-violation': 'no-restricted-imports',
      },
      research: { entryId: 'adv-firing', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-imports': [
      'error',
      { paths: [{ name: 'lodash', message: 'use lodash-es' }] },
    ],
  }),
};

describe('L4 gate 2 — rule-tester adversarial corpus (paired bad/valid)', () => {
  it('BAD: rejects rule whose negative-test.input produces no violation', () => {
    const result = runRuleTesterGate(neverFiringBadPlan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].ruleId).toBe('G97');
    expect(result.failures[0].reason).toMatch(/did not produce expected violation/);
    expect(result.failures[0].reason).toMatch(/no-restricted-imports/);
  });

  it('VALID (paired): accepts rule whose negative-test.input fires correctly', () => {
    const result = runRuleTesterGate(firingValidPlan);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });
});
