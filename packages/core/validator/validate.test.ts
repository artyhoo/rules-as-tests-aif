import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validate } from './validate.ts';
import { synthesize } from '../synthesizer/synthesize.ts';
import { synthesizeGenerate } from '../synthesizer/generate.ts';
import { stubGenerateRN } from '../synthesizer/generate-stubs.ts';
import type { ResearchEntry, ResearchPlan } from '../research/types.ts';
import type { SynthesisPlan } from '../synthesizer/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const rnPlan: ResearchPlan = JSON.parse(
  readFileSync(
    resolve(HERE, '..', 'synthesizer', 'fixtures', 'rn-research-plan.json'),
    'utf8',
  ),
) as ResearchPlan;

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

describe('validate — pure aggregator over 4 REQUIRED gates', () => {
  it('reports ok=true with all gates n/a for an empty plan', () => {
    const synthPlan = synthesize(plan({ framework: null }));
    const report = validate(synthPlan);
    expect(report.ok).toBe(true);
    expect(report.gates.schema.status).toBe('pass');
    expect(report.gates.ruleTester.status).toBe('n/a');
    expect(report.gates.tautology.status).toBe('n/a');
    expect(report.gates.conflict.status).toBe('pass');
  });

  it('reports ok=true with all gates pass for the next-16 fixture', () => {
    const synthPlan = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('nextjs-pages-router'),
          entry('next-r12-no-server-imports-in-client'),
        ],
      }),
    );
    const report = validate(synthPlan);
    expect(report.ok).toBe(true);
    expect(report.gates.schema.status).toBe('pass');
    expect(report.gates.ruleTester.status).toBe('pass');
    expect(report.gates.tautology.status).toBe('pass');
    expect(report.gates.conflict.status).toBe('pass');
  });

  it('skips downstream gates when gate 1 (schema) fails', () => {
    const malformed = { framework: 'next', rules: [] } as unknown as SynthesisPlan;
    const report = validate(malformed);
    expect(report.ok).toBe(false);
    expect(report.gates.schema.status).toBe('fail');
    expect(report.gates.ruleTester.status).toBe('skip');
    expect(report.gates.tautology.status).toBe('skip');
    expect(report.gates.conflict.status).toBe('skip');
  });

  it('reports ok=false when any gate fails', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    const broken: SynthesisPlan = {
      ...synthPlan,
      rules: synthPlan.rules.map((r) => ({
        ...r,
        examples: { ...r.examples, good: "import { useRouter } from 'next/router';\nexport default function P() { return null; }" },
      })),
    };
    const report = validate(broken);
    expect(report.ok).toBe(false);
    expect(report.gates.schema.status).toBe('pass');
    expect(report.gates.ruleTester.status).toBe('fail');
  });
});

describe('validate — manual-rule visibility (seam i-2 Task 5)', () => {
  // Reuse the proven generate-path plan: stubGenerateRN emits G1/G4 as eslint and
  // G2 (rn-styles) + G3 (rn-a11y) as manual (generate-stubs.ts). generate.test.ts (a)
  // proves validate().ok===true on this plan — manual rules do NOT flip ok. This makes
  // them visible (manualCount/manualRuleIds) without a hand-built, schema-invalid plan.
  it('reports manual rule count without failing ok', async () => {
    const plan = await synthesizeGenerate(rnPlan, stubGenerateRN);
    const report = validate(plan);
    expect(report.ok).toBe(true);
    expect(report.manualCount).toBe(2);
    expect(report.manualRuleIds).toEqual(['G2', 'G3']);
  });
});
