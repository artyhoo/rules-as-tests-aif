// Stage 5 — wiring/degrade-decision tests for runGeneratePath (generate-cli.ts).
// Testable surface = the mode/degrade verdict via injected stubs — NEVER the live
// adapter (no-paid-llm-in-ci.md; Domain T-S5-A). Reuses the Stage-4 frozen RN plan.
// Principle 02 (paired-negative): accept case (a) + reject/degrade case (b) + shape (c).

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { runGeneratePath } from './generate-cli.ts';
import { stubGenerateRN, stubGenerateBad } from './generate-stubs.ts';
import { validate } from '../validator/validate.ts';
import type { ResearchPlan } from '../research/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, 'fixtures');

// Frozen RN ResearchPlan — recipe-less proving case (no recipes/*.json for react-native)
const rnPlan: ResearchPlan = JSON.parse(
  readFileSync(resolve(FIXTURES, 'rn-research-plan.json'), 'utf8'),
) as ResearchPlan;

describe('runGeneratePath — Stage 5 wiring + L4-degrade decision', () => {
  // (a) L4 accepts → synthesis mode, and the emitted plan is itself L4-valid.
  it('(a) stubGenerateRN: L4 accepts → mode=synthesis with a valid SynthesisPlan', async () => {
    const result = await runGeneratePath(rnPlan, stubGenerateRN);
    expect(result.mode).toBe('synthesis');
    expect(validate(result.plan as never).ok).toBe(true);
  });

  // (b, paired negative) L4 rejects everything → degrade to research-only emitting the input plan.
  it('(b) stubGenerateBad: L4 rejects → mode=research-only emitting the input ResearchPlan', async () => {
    const result = await runGeneratePath(rnPlan, stubGenerateBad);
    expect(result.mode).toBe('research-only');
    expect(result.plan).toEqual(rnPlan);
  });

  // (c) The degrade swapped the output TYPE: research-only plan has ResearchPlan shape
  // (has `patterns`, no `rules`) — proves it is not a rejected SynthesisPlan.
  it('(c) stubGenerateBad: degraded plan has ResearchPlan shape (patterns, no rules)', async () => {
    const result = await runGeneratePath(rnPlan, stubGenerateBad);
    expect(result.mode).toBe('research-only');
    expect(result.plan).toHaveProperty('patterns');
    expect(result.plan).not.toHaveProperty('rules');
  });
});
