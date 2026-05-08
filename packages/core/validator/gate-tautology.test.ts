import { describe, expect, it } from 'vitest';
import { runTautologyGate } from './gate-tautology.ts';
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

describe('L4 gate 4 — tautology check (negative-corpus)', () => {
  it('returns n/a when plan has no eslint rules', () => {
    const synthPlan = synthesize(plan({ framework: null }));
    const result = runTautologyGate(synthPlan);
    expect(result.status).toBe('n/a');
  });

  it('returns n/a when only manual rules are present', () => {
    const synthPlan = synthesize(plan({ patterns: [entry('nextjs-pages-router')] }));
    expect(synthPlan.rules[0].check.type).toBe('manual');
    const result = runTautologyGate(synthPlan);
    expect(result.status).toBe('n/a');
  });

  it('passes for the next-16 fixture (3 recipes, eslint rules cover G1+G3)', () => {
    const synthPlan = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('nextjs-pages-router'),
          entry('react-server-components'),
        ],
      }),
    );
    const result = runTautologyGate(synthPlan);
    expect(result.failures).toEqual([]);
    expect(result.status).toBe('pass');
  });

  it('fails when a synthetic tautology rule is injected (no-restricted-imports forbidding `react`)', () => {
    // Construct a tautology: forbid `react`, which `unrelated.tsx` imports.
    const tautologyPlan: SynthesisPlan = {
      framework: 'next',
      version: '16.0.0',
      rules: [
        {
          id: 'G99',
          title: 'tautology',
          stack: ['react-next'],
          check: { type: 'eslint', rule: 'no-restricted-imports' },
          examples: { bad: 'import x from "react"', good: '// nothing' },
          'negative-test': {
            input: 'import x from "react"',
            'expect-violation': 'no-restricted-imports',
          },
          research: { entryId: 'taut', provenance: [provenance] },
        },
      ],
      rulesMd: '',
      eslintConfigSnippet: JSON.stringify({
        'no-restricted-imports': [
          'error',
          { paths: [{ name: 'react', message: 'taut' }] },
        ],
      }),
    };
    const result = runTautologyGate(tautologyPlan);
    expect(result.status).toBe('fail');
    expect(result.failures[0].ruleId).toBe('G99');
    expect(result.failures[0].reason).toMatch(/tautology/);
    expect(result.failures[0].reason).toMatch(/unrelated\.tsx/);
  });
});
