// Self-application snapshots for the Synthesizer (Phase 6 / L3 invariant a).
// Two-fixture coverage:
// 1. Own repo (ts-server, no patterns) — empty SynthesisPlan baseline
// 2. next-16 fixture (3 patterns: app, pages, RSC) — 3 synthesized rules
// Canonical regen ≤5% diff vs packages/preset-next-15-canonical/ deferred to
// Phase 6 v2 / Phase 7 with documented split-point in retros/phase-6.md.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectStack } from '../detector/index.ts';
import { research } from '../research/index.ts';
import { synthesize } from './synthesize.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const FIXTURE = resolve(HERE, 'fixtures', 'next-16-fixture');
const EXPECTED_SELF = resolve(HERE, 'expected-self-synth.json');
const EXPECTED_FIXTURE = resolve(HERE, 'expected-fixture-synth.json');

describe('synthesize — self-application snapshot stability (L3 invariant a)', () => {
  it('emits frozen empty plan for own repo (ts-server, no patterns)', () => {
    const plan = synthesize(research(detectStack(REPO_ROOT)));
    const expected = JSON.parse(readFileSync(EXPECTED_SELF, 'utf8'));
    expect(plan).toEqual(expected);
  });

  it('emits frozen 3-rule plan for next-16 fixture (app + pages + RSC patterns)', () => {
    const plan = synthesize(research(detectStack(FIXTURE)));
    const expected = JSON.parse(readFileSync(EXPECTED_FIXTURE, 'utf8'));
    expect(plan).toEqual(expected);
    expect(plan.rules.map((r) => r.id)).toEqual(['G1', 'G2', 'G3']);
    expect(plan.rules.map((r) => r.research.entryId)).toEqual([
      'nextjs-app-router',
      'nextjs-pages-router',
      'react-server-components',
    ]);
  });
});
