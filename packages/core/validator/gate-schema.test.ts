import { describe, expect, it } from 'vitest';
import { runSchemaGate } from './gate-schema.ts';
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

describe('L4 gate 1 — schema check', () => {
  it('passes for an empty SynthesisPlan (own-repo case)', () => {
    const synthPlan = synthesize(plan({ framework: null }));
    const result = runSchemaGate(synthPlan);
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
  });

  it('passes for the next-16 fixture plan (3 recipes)', () => {
    const synthPlan = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('nextjs-pages-router'),
          entry('next-r12-no-server-imports-in-client'),
        ],
      }),
    );
    const result = runSchemaGate(synthPlan);
    expect(result.status).toBe('pass');
  });

  it('fails when a top-level required field is missing', () => {
    const malformed = { framework: 'next', rules: [], rulesMd: '', eslintConfigSnippet: '{}' };
    const result = runSchemaGate(malformed);
    expect(result.status).toBe('fail');
    expect(result.failures[0].reason).toMatch(/schema violation/i);
  });

  it('fails when a SynthesizedRule has malformed check shape', () => {
    const malformed: SynthesisPlan = {
      framework: 'next',
      version: '16.0.0',
      rules: [
        {
          id: 'G1',
          title: 't',
          stack: ['react-next'],
          check: { type: 'eslint' } as never,
          examples: { bad: 'b', good: 'g' },
          research: { entryId: 'x', provenance: [] },
        },
      ],
      rulesMd: '',
      eslintConfigSnippet: '{}',
    };
    const result = runSchemaGate(malformed);
    expect(result.status).toBe('fail');
  });

  it('fails when an eslint-checked rule has no negative-test (semantic check)', () => {
    const malformed: SynthesisPlan = {
      framework: 'next',
      version: '16.0.0',
      rules: [
        {
          id: 'G1',
          title: 'no-restricted-imports rule',
          stack: ['react-next'],
          'applies-to': ['src/app/**/*.tsx'],
          check: { type: 'eslint', rule: 'no-restricted-imports' },
          examples: { bad: 'b', good: 'g' },
          research: { entryId: 'x', provenance: [provenance] },
        },
      ],
      rulesMd: '',
      eslintConfigSnippet: '{}',
    };
    const result = runSchemaGate(malformed);
    expect(result.status).toBe('fail');
    expect(result.failures[0].ruleId).toBe('G1');
    expect(result.failures[0].reason).toMatch(/negative-test/);
  });

  it('does not flag manual-checked rules for missing negative-test', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-pages-router')] }),
    );
    expect(synthPlan.rules[0].check.type).toBe('manual');
    const result = runSchemaGate(synthPlan);
    expect(result.status).toBe('pass');
  });
});
