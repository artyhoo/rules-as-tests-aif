// Self-application snapshot for the Research Agent (Phase 5 / L2 invariant).
// Mirror of detector/snapshot.test.ts pattern: emits the frozen plan for own
// repo and diffs against expected-self-research.json. CI job
// `framework-self-research` runs the same comparison via shell on every push.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { detectStack } from '../detector/index.ts';
import { detectDrift } from './drift.ts';
import { research } from './index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const EXPECTED_PATH = resolve(HERE, 'expected-self-research.json');

describe('research — self-application snapshot stability (L2 invariant b)', () => {
  it('emits frozen ResearchPlan for own repo with zero drift', () => {
    const detection = detectStack(REPO_ROOT);
    const plan = research(detection);
    plan.drift = detectDrift(REPO_ROOT);

    const expected = JSON.parse(readFileSync(EXPECTED_PATH, 'utf8'));
    expect(plan).toEqual(expected);
  });
});
