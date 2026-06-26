// T-RCT-B adversarial corpus: paired bad/valid plans for the require anti-vacuity gate.
// Principle 02 (paired-negative): BAD fixture + VALID counterpart BOTH required.
// Three adversarial plans: direction-A-bad, direction-B-bad, valid.

import { describe, expect, it } from 'vitest';
import { runRequireVacuityGate } from './gate-require-vacuity.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-06-23',
};

// BAD-A: direction A vacuous — selector never fires on examples.bad.
// Rule: "async functions must have 'use server'" but selector targets ClassDeclaration
// (no ClassDeclarations appear in the bad/good examples → direction A).
export const requireVacuityBadAPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G99',
      title: 'adversarial-require-direction-A',
      stack: ['react-next'],
      check: {
        type: 'declarative',
        engine: 'eslint-restricted',
        selector: 'ClassDeclaration:not(:has(Identifier))',
        message: 'wrong node type — ClassDeclaration never matches bad example',
        presence: 'require',
      },
      examples: {
        bad: 'async function action() { return 1; }',
        good: "async function action() { 'use server'; return 1; }",
      },
      research: { entryId: 'adv-req-dir-a', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: '{}',
};

// BAD-B: direction B vacuous — selector fires on examples.good.
// Selector: any async FunctionDeclaration not named 'never' — fires on good too
// because 'action' ≠ 'never'.
export const requireVacuityBadBPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G98',
      title: 'adversarial-require-direction-B',
      stack: ['react-next'],
      check: {
        type: 'declarative',
        engine: 'eslint-restricted',
        selector: "FunctionDeclaration[async=true]:not(:has(Identifier[name='never']))",
        message: 'too broad — fires on ALL async functions including compliant ones',
        presence: 'require',
      },
      examples: {
        bad: 'async function action() { return 1; }',
        good: "async function action() { 'use server'; return 1; }",
      },
      research: { entryId: 'adv-req-dir-b', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: '{}',
};

// VALID (paired counterpart): well-formed require rule.
// Selector fires ONLY on async functions that lack 'use server' in body.
// BAD example triggers it; GOOD example (has 'use server') does not.
export const requireVacuityValidPlan: SynthesisPlan = {
  framework: 'next',
  version: '16.0.0',
  rules: [
    {
      id: 'G97',
      title: 'adversarial-require-valid',
      stack: ['react-next'],
      check: {
        type: 'declarative',
        engine: 'eslint-restricted',
        selector: "FunctionDeclaration[async=true]:not(:has(Literal[value='use server']))",
        message: "async functions must include 'use server' directive",
        presence: 'require',
      },
      examples: {
        bad: 'async function action() { return 1; }',
        good: "async function action() { 'use server'; return 1; }",
      },
      research: { entryId: 'adv-req-valid', provenance: [provenance] },
    },
  ],
  rulesMd: '',
  eslintConfigSnippet: '{}',
};

describe('gate-require-vacuity adversarial corpus (paired bad/valid)', () => {
  it('BAD-A: rejects direction-A vacuous rule (selector never fires on examples.bad)', () => {
    const result = runRequireVacuityGate(requireVacuityBadAPlan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].ruleId).toBe('G99');
    expect(result.failures[0].reason).toMatch(/direction A/);
    expect(result.failures[0].reason).toMatch(/never fires/);
  });

  it('BAD-B: rejects direction-B vacuous rule (selector fires on examples.good)', () => {
    const result = runRequireVacuityGate(requireVacuityBadBPlan);
    expect(result.status).toBe('fail');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].ruleId).toBe('G98');
    expect(result.failures[0].reason).toMatch(/direction B/);
    expect(result.failures[0].reason).toMatch(/fires on good/);
  });

  it('VALID (paired): accepts well-formed require rule (fires on bad, not on good)', () => {
    const result = runRequireVacuityGate(requireVacuityValidPlan);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });
});
