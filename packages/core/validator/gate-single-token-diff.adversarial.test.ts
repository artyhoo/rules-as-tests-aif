// Gate 7 adversarial corpus — single-token-diff anti-vacuity hardening.
// Paired bad/valid plans prove the gate discriminates — not just always-rejects.
// Principle 02 (paired-negative): BAD fixture + VALID counterpart both required.
// NET-NEW vs gate 2: gate 2 checks the rule fires; this gate checks the
// good/bad PAIR IS MINIMAL — that the bad example isolates the targeted construct.

import { describe, expect, it } from 'vitest';
import { runSingleTokenDiffGate } from './gate-single-token-diff.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

// BAD: declarative rule whose examples.bad is a multi-statement block and
// examples.good is a comment — they differ by many tokens. The pair does not
// isolate the forbidden generator construct; other tokens could be the cause.
export const singleTokenDiffBadPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G91',
      title: 'adversarial-single-token-diff-bad',
      stack: ['react-next'],
      check: {
        type: 'declarative',
        engine: 'eslint-restricted',
        selector: 'FunctionDeclaration[generator=true]',
        message: 'No generator functions allowed',
        presence: 'forbid',
      },
      examples: {
        bad: 'const a = 1; const b = 2; const c = 3; function* gen() { yield a + b + c; }',
        good: '// no generators here',
      },
      'negative-test': {
        input: ['function* gen() { yield 1; }'],
        'expect-violation': 'no-restricted-syntax',
      },
      research: { entryId: 'adv-std-bad', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-syntax': [
      'error',
      {
        selector: 'FunctionDeclaration[generator=true]',
        message: 'No generator functions allowed',
      },
    ],
  }),
};

// VALID (paired counterpart): declarative rule whose examples differ by
// exactly the targeted token — `*` makes the function a generator.
// good and bad differ by ≈2 tokens (function* → function, no yield change).
export const singleTokenDiffValidPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G90',
      title: 'adversarial-single-token-diff-valid',
      stack: ['react-next'],
      check: {
        type: 'declarative',
        engine: 'eslint-restricted',
        selector: 'FunctionDeclaration[generator=true]',
        message: 'No generator functions allowed',
        presence: 'forbid',
      },
      examples: {
        bad: 'function* gen() { return 1; }',
        good: 'function gen() { return 1; }',
      },
      'negative-test': {
        input: ['function* gen() { yield 1; }'],
        'expect-violation': 'no-restricted-syntax',
      },
      research: { entryId: 'adv-std-valid', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-syntax': [
      'error',
      {
        selector: 'FunctionDeclaration[generator=true]',
        message: 'No generator functions allowed',
      },
    ],
  }),
};

describe('L4 gate 7 — single-token-diff adversarial corpus (paired bad/valid)', () => {
  it('BAD: rejects declarative rule whose example pair differs by many tokens', () => {
    const result = runSingleTokenDiffGate(singleTokenDiffBadPlan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.ruleId).toBe('G91');
    expect(result.failures[0]!.reason).toMatch(/single-token-diff/);
    expect(result.failures[0]!.reason).toMatch(/threshold 5/);
  });

  it('VALID (paired): accepts declarative rule whose example pair differs by 1 token', () => {
    const result = runSingleTokenDiffGate(singleTokenDiffValidPlan);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });
});
