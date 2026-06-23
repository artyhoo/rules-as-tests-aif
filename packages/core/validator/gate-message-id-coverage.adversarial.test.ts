// Gate 8 adversarial corpus — messageId-coverage anti-vacuity hardening.
// Paired bad/valid plans prove the gate discriminates — not just always-rejects.
// Principle 02 (paired-negative): BAD fixture + VALID counterpart both required.
// NET-NEW vs gate 2: gate 2 passes on loose ruleId fallback (m.ruleId===ruleName).
// This gate verifies the DECLARED check.message is the one actually emitted —
// a dead/unreachable declared message is a vacuity signal.

import { describe, expect, it } from 'vitest';
import { runMessageIdCoverageGate } from './gate-message-id-coverage.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

// BAD: declarative rule declares check.message='Do not use generators' but
// eslintConfigSnippet configures no-restricted-syntax with a DIFFERENT message
// 'No generators!'. When examples.bad is linted, the emitted message is
// 'No generators!' — the declared message is unreachable.
export const messageIdCoverageBadPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G89',
      title: 'adversarial-messageId-coverage-bad',
      stack: ['react-next'],
      check: {
        type: 'declarative',
        engine: 'eslint-restricted',
        selector: 'FunctionDeclaration[generator=true]',
        message: 'Do not use generators',
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
      research: { entryId: 'adv-mic-bad', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: JSON.stringify({
    'no-restricted-syntax': [
      'error',
      {
        selector: 'FunctionDeclaration[generator=true]',
        message: 'No generators!',
      },
    ],
  }),
};

// VALID (paired counterpart): declarative rule declares check.message='No generator
// functions allowed' and eslintConfigSnippet configures the SAME message.
// When examples.bad is linted, the emitted message IS 'No generator functions allowed'.
export const messageIdCoverageValidPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G88',
      title: 'adversarial-messageId-coverage-valid',
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
      research: { entryId: 'adv-mic-valid', provenance: [provenance] },
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

describe('L4 gate 8 — messageId-coverage adversarial corpus (paired bad/valid)', () => {
  it('BAD: rejects rule whose declared check.message is not the emitted message', () => {
    const result = runMessageIdCoverageGate(messageIdCoverageBadPlan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]!.ruleId).toBe('G89');
    expect(result.failures[0]!.reason).toMatch(/messageId-coverage/);
    expect(result.failures[0]!.reason).toMatch(/Do not use generators/);
    expect(result.failures[0]!.reason).toMatch(/unreachable/);
  });

  it('VALID (paired): accepts rule whose declared check.message is the emitted message', () => {
    const result = runMessageIdCoverageGate(messageIdCoverageValidPlan);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });
});
