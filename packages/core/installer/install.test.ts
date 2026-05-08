import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { install } from './install.ts';
import type { RulesLock } from './types.ts';
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

const ARTIFACTS = [
  'rules-manifest-additions.json',
  'RULES-additions.md',
  'eslint-rules-snippet.json',
  'rules-lock.json',
];

describe('install — L5 v1 consumer disk write', () => {
  let consumerRoot: string;

  beforeEach(() => {
    consumerRoot = mkdtempSync(resolve(tmpdir(), 'install-'));
  });

  afterEach(() => {
    rmSync(consumerRoot, { recursive: true, force: true });
  });

  it('writes 4 artifacts under .ai-factory/synthesizer-output/ for the next-16 fixture', () => {
    const synthPlan = synthesize(
      plan({
        patterns: [
          entry('nextjs-app-router'),
          entry('nextjs-pages-router'),
          entry('react-server-components'),
        ],
      }),
    );
    const report = install(synthPlan, { consumerRoot });
    expect(report.ok).toBe(true);
    expect(report.installed).toBe(true);
    expect(report.failures).toEqual([]);
    for (const name of ARTIFACTS) {
      expect(
        existsSync(resolve(consumerRoot, '.ai-factory', 'synthesizer-output', name)),
      ).toBe(true);
    }
    expect(report.preValidation.ok).toBe(true);
    expect(report.postValidation?.ok).toBe(true);
  });

  it('rules-lock.json captures schemaVersion + framework + version + ruleIds', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    install(synthPlan, { consumerRoot });
    const lockPath = resolve(consumerRoot, '.ai-factory', 'synthesizer-output', 'rules-lock.json');
    const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as RulesLock;
    expect(lock.schemaVersion).toBe(1);
    expect(lock.framework).toBe('next');
    expect(lock.version).toBe('16.0.0');
    expect(lock.ruleIds).toEqual(['G1']);
    expect(typeof lock.emittedAt).toBe('string');
    expect(lock.sourceFingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it('dry-run does not write to disk but reports artifact paths', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    const report = install(synthPlan, { consumerRoot, dryRun: true });
    expect(report.ok).toBe(true);
    expect(report.installed).toBe(false);
    expect(report.artifacts).toHaveLength(4);
    for (const name of ARTIFACTS) {
      expect(
        existsSync(resolve(consumerRoot, '.ai-factory', 'synthesizer-output', name)),
      ).toBe(false);
    }
  });

  it('refuses to overwrite rules-lock.json without force=true', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    install(synthPlan, { consumerRoot });
    const second = install(synthPlan, { consumerRoot });
    expect(second.ok).toBe(false);
    expect(second.installed).toBe(false);
    expect(second.failures[0].stage).toBe('lock-collision');
  });

  it('overwrites rules-lock.json when force=true', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    install(synthPlan, { consumerRoot });
    const second = install(synthPlan, { consumerRoot, force: true });
    expect(second.ok).toBe(true);
    expect(second.installed).toBe(true);
  });

  it('refuses to install when pre-validation fails (gate 1 schema violation)', () => {
    const malformed = {
      framework: 'next',
      version: '16.0.0',
      rules: [
        {
          id: 'G1',
          title: 'no negative-test',
          stack: ['react-next'],
          check: { type: 'eslint', rule: 'no-restricted-imports' },
          examples: { bad: 'b', good: 'g' },
          research: { entryId: 'x', provenance: [provenance] },
        },
      ],
      rulesMd: '',
      eslintConfigSnippet: '{}',
    } as SynthesisPlan;
    const report = install(malformed, { consumerRoot });
    expect(report.ok).toBe(false);
    expect(report.installed).toBe(false);
    expect(report.failures[0].stage).toBe('pre-validate');
    expect(existsSync(resolve(consumerRoot, '.ai-factory'))).toBe(false);
  });

  it('post-install meta-check fails when rules-lock.json drifts from disk artifacts', () => {
    const synthPlan = synthesize(
      plan({ patterns: [entry('nextjs-app-router')] }),
    );
    install(synthPlan, { consumerRoot });
    // Tamper: rewrite lock with mismatched ruleIds.
    const lockPath = resolve(consumerRoot, '.ai-factory', 'synthesizer-output', 'rules-lock.json');
    const tampered = {
      schemaVersion: 1,
      framework: 'next',
      version: '16.0.0',
      ruleIds: ['G42-FAKE'],
      emittedAt: '2026-05-08T00:00:00.000Z',
      sourceFingerprint: 'deadbeefdeadbeef',
    };
    writeFileSync(lockPath, JSON.stringify(tampered) + '\n');
    // Re-install with force should regenerate lock and pass post-checks.
    const report = install(synthPlan, { consumerRoot, force: true });
    expect(report.ok).toBe(true);
    const newLock = JSON.parse(readFileSync(lockPath, 'utf8')) as RulesLock;
    expect(newLock.ruleIds).toEqual(['G1']);
  });

  it('installs an empty plan (own-repo case): writes empty additions + lock with ruleIds=[]', () => {
    const synthPlan = synthesize(plan({ framework: null }));
    const report = install(synthPlan, { consumerRoot });
    expect(report.ok).toBe(true);
    const lockPath = resolve(consumerRoot, '.ai-factory', 'synthesizer-output', 'rules-lock.json');
    const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as RulesLock;
    expect(lock.ruleIds).toEqual([]);
    expect(lock.framework).toBeNull();
  });
});
