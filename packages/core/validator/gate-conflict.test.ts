import { describe, expect, it } from 'vitest';
import { runConflictGate } from './gate-conflict.ts';
import { synthesize } from '../synthesizer/synthesize.ts';
import type { ResearchEntry, ResearchPlan } from '../research/types.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

const entry = (id: string): ResearchEntry => ({
  id,
  summary: `summary for ${id}`,
  bestPractices: [],
  antiPatterns: [],
  provenance: [provenance],
});

const plan = (overrides: Partial<ResearchPlan> = {}): ResearchPlan => ({
  framework: 'next',
  version: '16.0.0',
  patterns: [],
  missing: [],
  drift: null,
  ...overrides,
});

describe('L4 gate 6 — cross-rule conflict', () => {
  it('passes for empty plan', () => {
    const synthPlan = synthesize(plan({ framework: null }));
    const result = runConflictGate(synthPlan);
    expect(result.status).toBe('pass');
  });

  it('passes for next-16 fixture (3 recipes — RSC reuses preset rule, not orphan)', () => {
    const synthPlan = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('nextjs-pages-router'),
          entry('react-server-components'),
        ],
      }),
    );
    const result = runConflictGate(synthPlan);
    expect(result.failures).toEqual([]);
    expect(result.status).toBe('pass');
  });

  it('fails when a synthesized rule references an orphan plugin rule', () => {
    const orphan: SynthesisPlan = {
      framework: 'next',
      version: '16.0.0',
      rules: [
        {
          id: 'G99',
          title: 'orphan',
          stack: ['react-next'],
          check: { type: 'eslint', rule: 'rules-as-tests/does-not-exist' },
          examples: { bad: 'b', good: 'g' },
          'negative-test': { input: 'x', 'expect-violation': 'foo' },
          research: { entryId: 'x', provenance: [provenance] },
        },
      ],
      rulesMd: '',
      eslintConfigSnippet: JSON.stringify({
        'rules-as-tests/does-not-exist': 'error',
      }),
    };
    const result = runConflictGate(orphan);
    expect(result.status).toBe('fail');
    expect(result.failures[0].reason).toMatch(/does not exist in the preset plugin registry/);
  });

  it('fails when an eslint-checked rule has no eslintConfigSnippet entry (snippet drop)', () => {
    const dropped: SynthesisPlan = {
      framework: 'next',
      version: '16.0.0',
      rules: [
        {
          id: 'G99',
          title: 'snippet drop',
          stack: ['react-next'],
          check: { type: 'eslint', rule: 'no-restricted-imports' },
          examples: { bad: 'b', good: 'g' },
          'negative-test': { input: 'x', 'expect-violation': 'no-restricted-imports' },
          research: { entryId: 'x', provenance: [provenance] },
        },
      ],
      rulesMd: '',
      eslintConfigSnippet: '{}',
    };
    const result = runConflictGate(dropped);
    expect(result.status).toBe('fail');
    expect(result.failures[0].ruleId).toBe('G99');
    expect(result.failures[0].reason).toMatch(/eslintConfigSnippet has no entry/);
  });
});
