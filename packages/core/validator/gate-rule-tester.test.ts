import { describe, expect, it } from 'vitest';
import { runRuleTesterGate } from './gate-rule-tester.ts';
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

describe('L4 gate 2 — rule-tester roundtrip', () => {
  it('marks status n/a when plan has no eslint-checked rules', () => {
    const synthPlan = synthesize(plan({ framework: null }));
    const result = runRuleTesterGate(synthPlan);
    expect(result.status).toBe('n/a');
  });

  it('marks status n/a when only manual rules are present', () => {
    const synthPlan = synthesize(plan({ patterns: [entry('nextjs-pages-router')] }));
    expect(synthPlan.rules).toHaveLength(1);
    expect(synthPlan.rules[0].check.type).toBe('manual');
    const result = runRuleTesterGate(synthPlan);
    expect(result.status).toBe('n/a');
  });

  it('passes for the next-16 fixture (G1 builtin + G3 plugin)', () => {
    const synthPlan = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('next-r12-no-server-imports-in-client'),
        ],
      }),
    );
    const result = runRuleTesterGate(synthPlan);
    expect(result.failures).toEqual([]);
    expect(result.status).toBe('pass');
  });

  it('passes for the full 3-recipe next-16 plan; manual rule is skipped', () => {
    const synthPlan = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('nextjs-pages-router'),
          entry('next-r12-no-server-imports-in-client'),
        ],
      }),
    );
    const result = runRuleTesterGate(synthPlan);
    expect(result.status).toBe('pass');
  });

  it('fails when negative-test.input does not produce the expected violation', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    const broken: SynthesisPlan = {
      ...synthPlan,
      rules: synthPlan.rules.map((r) => ({
        ...r,
        'negative-test': {
          input: '// no imports here, just a comment',
          'expect-violation': 'no-restricted-imports',
        },
      })),
    };
    const result = runRuleTesterGate(broken);
    expect(result.status).toBe('fail');
    expect(result.failures[0].ruleId).toBe('G1');
    expect(result.failures[0].reason).toMatch(/did not produce expected violation/);
  });

  it('fails when examples.good triggers a false positive', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    const broken: SynthesisPlan = {
      ...synthPlan,
      rules: synthPlan.rules.map((r) => ({
        ...r,
        examples: {
          ...r.examples,
          good: "import { useRouter } from 'next/router';\nexport default function Page() { return null; }",
        },
      })),
    };
    const result = runRuleTesterGate(broken);
    expect(result.status).toBe('fail');
    expect(result.failures[0].reason).toMatch(/examples\.good produced unexpected violation/);
  });

  it('fails when an eslint rule is missing negative-test', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    const broken: SynthesisPlan = {
      ...synthPlan,
      rules: synthPlan.rules.map((r) => {
        const { 'negative-test': _drop, ...rest } = r;
        return rest;
      }),
    };
    const result = runRuleTesterGate(broken);
    expect(result.status).toBe('fail');
    expect(result.failures[0].reason).toMatch(/no negative-test/);
  });
});
