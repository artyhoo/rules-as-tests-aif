// T1 — Tautology adversarial corpus (Gate 4 hardening).
// Paired bad/valid plans prove the gate discriminates — not just always-rejects.
// Principle 02 (paired-negative): BAD fixture + VALID counterpart both required.

import { describe, expect, it } from 'vitest';
import { runTautologyGate } from './gate-tautology.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

// BAD: tautological rule — no-restricted-imports forbidding 'react',
// which negative-corpus/unrelated.tsx imports. Gate 4 MUST reject this.
export const tautologyBadPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G99',
      title: 'adversarial-tautology-no-react',
      stack: ['react-next'],
      check: { type: 'eslint', rule: 'no-restricted-imports' },
      examples: { bad: 'import x from "react"', good: '// nothing imported' },
      'negative-test': {
        input: ['import x from "react"'],
        'expect-violation': 'no-restricted-imports',
      },
      research: { entryId: 'adv-taut', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-imports': [
      'error',
      { paths: [{ name: 'react', message: 'tautology-test' }] },
    ],
  }),
};

// VALID (paired counterpart): non-tautological rule — no-restricted-imports
// forbidding 'lodash', which does NOT appear in any negative-corpus file.
// Gate 4 MUST accept this (no corpus file imports lodash).
export const tautologyValidPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G98',
      title: 'adversarial-valid-no-lodash',
      stack: ['react-next'],
      check: { type: 'eslint', rule: 'no-restricted-imports' },
      examples: { bad: 'import _ from "lodash"', good: 'import _ from "lodash-es"' },
      'negative-test': {
        input: ['import _ from "lodash"'],
        'expect-violation': 'no-restricted-imports',
      },
      research: { entryId: 'adv-valid', provenance: [provenance] },
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

describe('L4 gate 4 — tautology adversarial corpus (paired bad/valid)', () => {
  it('BAD: rejects tautological rule that fires on negative-corpus/unrelated.tsx', () => {
    const result = runTautologyGate(tautologyBadPlan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].ruleId).toBe('G99');
    expect(result.failures[0].reason).toMatch(/tautology/);
    expect(result.failures[0].reason).toMatch(/unrelated\.tsx/);
    expect(result.failures[0].reason).toMatch(/no-restricted-imports/);
  });

  it('VALID (paired): accepts rule whose forbidden import does not appear in corpus', () => {
    const result = runTautologyGate(tautologyValidPlan);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });
});
