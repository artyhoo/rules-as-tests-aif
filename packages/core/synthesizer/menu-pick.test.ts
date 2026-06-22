// Stage 2 — L4-verdict tests for synthesizeLive (menu-pick generate-path).
// Testable surface = the L4 verdict on the output, NOT the LLM bytes (T-S2-B).
// Stubs inject deterministic selections; no live LLM calls (no-paid-llm-in-ci.md).
// Principle 02 (paired-negative): valid case (a,b) + invalid negative case (c).

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { synthesize } from './synthesize.ts';
import { synthesizeLive } from './menu-pick.ts';
import { stubPickAll, stubPickBad } from './menu-pick-stubs.ts';
import { validate } from '../validator/validate.ts';
import type { ResearchEntry, ResearchPlan } from '../research/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const STORE_ROOT = resolve(HERE, '../research/store');

// Frozen ResearchPlan — Next 15 canonical proving case (L2 frozen per Stage 2 scope).
// One pattern: nextjs-app-router from the 15.x store.
const nextjsAppRouterEntry: ResearchEntry = JSON.parse(
  readFileSync(resolve(STORE_ROOT, 'next/15.x/nextjs-app-router.json'), 'utf8'),
) as ResearchEntry;

const frozenPlan: ResearchPlan = {
  framework: 'next',
  version: '15.0.0',
  patterns: [nextjsAppRouterEntry],
  missing: [],
  drift: null,
};

describe('synthesizeLive — Stage 2 menu-pick generate-path (Next 15 canonical)', () => {
  // (a) L4 accepts: validate(synthesizeLive(frozen, stubPickAll)).ok === true
  it('(a) stubPickAll: L4 accepts the menu-picked SynthesisPlan', async () => {
    const plan = await synthesizeLive(frozenPlan, stubPickAll);
    const report = validate(plan);
    expect(report.ok).toBe(true);
  });

  // (b) Regression-match: synthesizeLive with stubPickAll reproduces the curated recipe
  // (empty diff — same rules, same rulesMd, same eslintConfigSnippet as synthesize())
  it('(b) stubPickAll: live output matches curated synthesize() output (empty diff)', async () => {
    const liveResult = await synthesizeLive(frozenPlan, stubPickAll);
    const curatedResult = synthesize(frozenPlan);
    expect(liveResult).toEqual(curatedResult);
  });

  // (c) Paired negative (principle 02): stubPickBad overrides eslintRuleConfig with a
  // tautological no-restricted-imports rule that forbids 'react'.
  // negative-corpus/unrelated.tsx imports 'react' → L4 gate 4 (tautology) fires → ok === false.
  it('(c) stubPickBad: L4 rejects the tautological menu-picked SynthesisPlan (paired negative)', async () => {
    const plan = await synthesizeLive(frozenPlan, stubPickBad);
    const report = validate(plan);
    expect(report.ok).toBe(false);
  });
});
