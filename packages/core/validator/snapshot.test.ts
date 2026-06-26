// L4 self-application snapshots — frozen ValidationReport shapes for:
//   (a) own repo (rules=[], gates pass/n/a),
//   (b) next-16 fixture (3 recipes — 2 eslint + 1 manual; all gates pass).
// Mirrors Phase 4/5/6 snapshot pattern; CI gate framework-self-validate
// re-runs (a) on every commit.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectStack } from '../detector/index.ts';
import { research } from '../research/index.ts';
import { synthesize } from '../synthesizer/synthesize.ts';
import type { ResearchEntry, ResearchPlan } from '../research/types.ts';
import { validate } from './validate.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const SELF_EXPECTED = resolve(HERE, 'expected-self-validate.json');
const FIXTURE_EXPECTED = resolve(HERE, 'expected-fixture-validate.json');

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

const fixturePlan = (): ResearchPlan => ({
  framework: 'next',
  version: '16.0.0',
  // Order mirrors the on-disk next-16-fixture detect→research order
  // (next-r12 → app-router → pages-router) so the synthesized rule ids match
  // the CI `validate` CLI's self-application gate. Before manualRuleIds was
  // surfaced, only ok+gates were compared (order-independent), so the inline
  // order drifted harmlessly; manualRuleIds exposes the id, which IS order-bound.
  patterns: [
    entry('next-r12-no-server-imports-in-client'),
    entry('nextjs-app-router'),
    entry('nextjs-pages-router'),
  ],
  missing: [],
  drift: null,
});

describe('validator self-application snapshots', () => {
  it('own repo synth-validate matches expected-self-validate.json', () => {
    const synthPlan = synthesize(research(detectStack(REPO_ROOT)));
    const report = validate(synthPlan);
    const expected = JSON.parse(readFileSync(SELF_EXPECTED, 'utf8'));
    expect(report).toEqual(expected);
  });

  it('next-16 fixture validate matches expected-fixture-validate.json', () => {
    const synthPlan = synthesize(fixturePlan());
    const report = validate(synthPlan);
    const expected = JSON.parse(readFileSync(FIXTURE_EXPECTED, 'utf8'));
    expect(report).toEqual(expected);
  });

  // S4: a declarative forbid activates anti-vacuity gates 7-8 (n/a → pass) on
  // real generator output. Kept as an INLINE expectation — deliberately NOT
  // folded into the next-16 fixture snapshot, whose CI job validates the on-disk
  // next-16-fixture/ directory (3 recipes, no declarative forbid → its gates 7-8
  // stay n/a). Sharing expected-fixture-validate.json across both inputs is what
  // caused the S4 round-1 drift.
  it('activates gates 7-8 on a declarative forbid (singleTokenDiff + messageIdCoverage n/a → pass)', () => {
    const declarativePlan: ResearchPlan = {
      framework: 'next',
      version: '16.0.0',
      patterns: [entry('test-only-forbid-declarative')],
      missing: [],
      drift: null,
    };
    const report = validate(synthesize(declarativePlan));
    expect(report.gates.singleTokenDiff.status).toBe('pass');
    expect(report.gates.messageIdCoverage.status).toBe('pass');
    expect(report.gates.autofixClean.status).toBe('n/a'); // forbid has no fixer
    expect(report.ok).toBe(true);
  });
});
