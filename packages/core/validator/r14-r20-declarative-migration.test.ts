// Migration proof: R14 (require-form-safe-parse) and R20 (require-use-server-directive)
// recipes are now declarative (engine: eslint-restricted, presence: require). This test
// synthesizes them from the shipped recipes and runs the FULL L4 validator, proving the
// declarative form passes every gate — in particular gate-10 (require-vacuity), which the
// migration task requires. Behavioural fixture parity (incl. audit:exempt) is proven
// separately in the preset-next-15-canonical *.parity.test.ts harnesses.

import { describe, expect, it } from 'vitest';
import { synthesize } from '../synthesizer/synthesize.ts';
import { validate } from './validate.ts';
import type { ResearchEntry, ResearchPlan } from '../research/types.ts';

const provenance = {
  url: 'https://nextjs.org/docs/app',
  allowlistKey: 'next.official',
  fetchedAt: '2026-06-23',
};

const entry = (id: string): ResearchEntry => ({
  id,
  summary: `summary for ${id}`,
  bestPractices: [],
  antiPatterns: [],
  provenance: [provenance],
});

const plan = (patterns: ResearchEntry[]): ResearchPlan => ({
  framework: 'next',
  version: '16.0.0',
  patterns,
  missing: [],
  drift: null,
});

describe('R14/R20 declarative migration — validate() passes all L4 gates', () => {
  it('R14 (require-form-safe-parse) synthesizes as declarative and passes gate-10 + validate()', () => {
    const synth = synthesize(plan([entry('next-r14-require-form-safe-parse')]));
    expect(synth.rules).toHaveLength(1);
    expect(synth.rules[0].check.type).toBe('declarative');
    expect((synth.rules[0].check as { presence: string }).presence).toBe('require');

    const report = validate(synth);
    expect(report.gates.requireVacuity.status).toBe('pass');
    expect(report.gates.ruleTester.status).toBe('pass');
    expect(report.ok).toBe(true);
  });

  it('R20 (require-use-server-directive) synthesizes as declarative and passes gate-10 + validate()', () => {
    const synth = synthesize(plan([entry('next-r20-require-use-server-directive')]));
    expect(synth.rules).toHaveLength(1);
    expect(synth.rules[0].check.type).toBe('declarative');
    expect((synth.rules[0].check as { presence: string }).presence).toBe('require');

    const report = validate(synth);
    expect(report.gates.requireVacuity.status).toBe('pass');
    expect(report.gates.ruleTester.status).toBe('pass');
    expect(report.ok).toBe(true);
  });

  it('R14 + R20 together merge into one wrapper config and pass validate()', () => {
    const synth = synthesize(
      plan([
        entry('next-r14-require-form-safe-parse'),
        entry('next-r20-require-use-server-directive'),
      ]),
    );
    expect(synth.rules).toHaveLength(2);
    // Both declarative require rules merge their selectors into ONE wrapper entry.
    const merged = JSON.parse(synth.eslintConfigSnippet) as Record<string, unknown[]>;
    const wrapperEntry = merged['rules-as-tests/restricted-syntax-audit-exempt'];
    expect(wrapperEntry).toBeDefined();
    // ['error', <r14 selectorEntry>, <r20 selectorEntry>]
    expect(wrapperEntry.length).toBe(3);

    const report = validate(synth);
    expect(report.gates.requireVacuity.status).toBe('pass');
    expect(report.ok).toBe(true);
  });
});
