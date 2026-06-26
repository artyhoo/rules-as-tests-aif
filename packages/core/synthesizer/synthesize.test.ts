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
  it('compiles a declarative+eslint-restricted recipe into a restricted-syntax-audit-exempt config via synthesize() (bridge end-to-end)', () => {
    const result = synthesize(
      plan({ patterns: [entry('test-only-forbid-declarative')] }),
    );
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].check.type).toBe('declarative');
    const merged = JSON.parse(result.eslintConfigSnippet);
    // Declarative tier emits the exempt-aware wrapper, not the built-in
    // no-restricted-syntax (which cannot honour per-line audit:exempt).
    expect(merged).toHaveProperty('rules-as-tests/restricted-syntax-audit-exempt');
    expect(merged).not.toHaveProperty('no-restricted-syntax');
    const [severity, ...entries] = merged[
      'rules-as-tests/restricted-syntax-audit-exempt'
    ] as [string, ...{ selector: string }[]];
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

  // S2: presence:'require' end-to-end — recipe → synthesize → eslintConfigSnippet + rulesMd
  it('compiles a declarative+require recipe into restricted-syntax-audit-exempt config (S2 end-to-end)', () => {
    const result = synthesize(
      plan({ patterns: [entry('test-only-require-declarative')] }),
    );
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0].check.type).toBe('declarative');
    expect((result.rules[0].check as { presence: string }).presence).toBe('require');
    const merged = JSON.parse(result.eslintConfigSnippet);
    expect(merged).toHaveProperty('rules-as-tests/restricted-syntax-audit-exempt');
    const [severity, ...entries] = merged[
      'rules-as-tests/restricted-syntax-audit-exempt'
    ] as [string, ...{ selector: string }[]];
    expect(severity).toBe('error');
    expect(entries.some((e) => e.selector.includes(':not(:has('))).toBe(true);
  });

  it('generates rulesMd with "require" wording for presence:require declarative recipe', () => {
    const result = synthesize(
      plan({ patterns: [entry('test-only-require-declarative')] }),
    );
    expect(result.rulesMd).toContain('require');
    expect(result.rulesMd).toContain('no-restricted-syntax');
    expect(result.rulesMd).not.toContain('forbid');
  });
});
