import { describe, expect, it } from 'vitest';
import { synthesize } from './synthesize.ts';
import type { ResearchEntry, ResearchPlan } from '../research/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-05-08',
};

const entry = (id: string, overrides: Partial<ResearchEntry> = {}): ResearchEntry => ({
  id,
  summary: `summary for ${id}`,
  bestPractices: [],
  antiPatterns: [],
  provenance: [provenance],
  ...overrides,
});

const plan = (overrides: Partial<ResearchPlan> = {}): ResearchPlan => ({
  framework: 'next',
  version: '16.0.0',
  patterns: [],
  missing: [],
  drift: null,
  ...overrides,
});

describe('synthesize — pure recipe lookup + composition', () => {
  it('emits empty SynthesisPlan for empty ResearchPlan', () => {
    const result = synthesize(plan());
    expect(result.rules).toEqual([]);
    expect(result.rulesMd).toBe('');
    expect(JSON.parse(result.eslintConfigSnippet)).toEqual({});
  });

  it('emits one rule (G1) for a single matching pattern', () => {
    const result = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].id).toBe('G1');
    expect(result.rules[0].research.entryId).toBe('nextjs-app-router');
    expect(result.rules[0].check.type).toBe('eslint');
  });

  it('assigns sequential IDs (G1, G2, G3) in input order', () => {
    const result = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('nextjs-pages-router'),
          entry('next-r12-no-server-imports-in-client'),
        ],
      }),
    );
    expect(result.rules.map((r) => r.id)).toEqual(['G1', 'G2', 'G3']);
    expect(result.rules.map((r) => r.research.entryId)).toEqual([
      'nextjs-app-router',
      'nextjs-pages-router',
      'next-r12-no-server-imports-in-client',
    ]);
  });

  it('skips patterns with no recipe (e.g. tailwind under next framework)', () => {
    const result = synthesize(
      plan({
        patterns: [entry('nextjs-app-router'), entry('tailwind-v3-config')],
      }),
    );
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].research.entryId).toBe('nextjs-app-router');
  });

  it('skips all rules when framework is null (own-repo / ts-server case)', () => {
    const result = synthesize(
      plan({ framework: null, patterns: [entry('nextjs-app-router')] }),
    );
    expect(result.rules).toEqual([]);
    expect(result.framework).toBeNull();
  });

  it('skips recipes whose appliesTo does not include the plan framework', () => {
    const result = synthesize(
      plan({ framework: 'astro', patterns: [entry('nextjs-app-router')] }),
    );
    expect(result.rules).toEqual([]);
  });

  it('renders rulesMd with `{{id}}` substituted to the assigned G-id', () => {
    const result = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    expect(result.rulesMd).toContain('## G1 ');
    expect(result.rulesMd).not.toContain('{{id}}');
  });

  it('merges eslintRuleConfig across recipes in input order', () => {
    const result = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('next-r12-no-server-imports-in-client'),
        ],
      }),
    );
    const merged = JSON.parse(result.eslintConfigSnippet);
    expect(merged).toHaveProperty('no-restricted-imports');
    expect(merged).toHaveProperty('rules-as-tests/no-server-imports-in-client');
  });

  // M1: the declarative+eslint-restricted bridge in synthesize() (selector+message
  // → no-restricted-syntax entry) was previously exercised by no test — the gate
  // happy-path built the config by hand. This drives a real declarative recipe
  // through synthesize() end-to-end, which also revives the recipe file.
  it('compiles a declarative+eslint-restricted recipe into a no-restricted-syntax config via synthesize() (bridge end-to-end)', () => {
    const result = synthesize(
      plan({ patterns: [entry('test-only-forbid-declarative')] }),
    );
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].check.type).toBe('declarative');
    const merged = JSON.parse(result.eslintConfigSnippet);
    expect(merged).toHaveProperty('no-restricted-syntax');
    const [severity, ...entries] = merged['no-restricted-syntax'] as [
      string,
      ...{ selector: string }[],
    ];
    expect(severity).toBe('error');
    expect(entries.some((e) => e.selector.includes("property.name='only'"))).toBe(
      true,
    );
  });

  it('loads a declarative recipe that omits rulesMdTemplate (data-only)', () => {
    const result = synthesize(
      plan({ patterns: [entry('test-only-forbid-declarative')] }),
    );
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].check.type).toBe('declarative');
  });

  it('generates rulesMd for a declarative forbid from spec, not from a template', () => {
    const result = synthesize(
      plan({ patterns: [entry('test-only-forbid-declarative')] }),
    );
    expect(result.rulesMd).toContain('## G1 — Forbid `.only` in test calls');
    expect(result.rulesMd).toContain('no-restricted-syntax');
  });
});
