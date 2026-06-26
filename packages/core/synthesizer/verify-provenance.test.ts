// S5 — anti-hand-edit gate, paired-negative test.
// Proves the gate is NOT vacuous (T14): a freshly-emitted bundle passes, and a
// hand-edit of the emitted rule content mechanically reds the verifier — the
// "прогнанный отказ" the umbrella S5 acceptance demands, not "should bе".

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { emit } from './emit.ts';
import { synthesize } from './synthesize.ts';
import { ProvenanceVerifyError, verifyProvenance } from './verify-provenance.ts';
import type { ResearchEntry, ResearchPlan } from '../research/types.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

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

function emitDeclarativeBundle(dir: string): void {
  // A declarative forbid rule (test-only-forbid-declarative → id G1) is emitted
  // with a provenance.json carrying contentHash = canonicalRuleHash(G1).
  const synthPlan = synthesize(plan({ patterns: [entry('test-only-forbid-declarative')] }));
  emit(synthPlan, dir);
}

const manifestPath = (dir: string) => resolve(dir, 'rules-manifest-additions.json');
const provenancePath = (dir: string) => resolve(dir, 'provenance.json');
const readJson = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const writeJson = (p: string, v: unknown) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

describe('verifyProvenance — S5 anti-hand-edit gate', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(resolve(tmpdir(), 'synth-verify-'));
    emitDeclarativeBundle(dir);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('passes (ok) for a freshly emitted, un-edited bundle', () => {
    const result = verifyProvenance(dir);

    expect(result.ok).toBe(true);
    expect(result.rulesChecked).toBeGreaterThanOrEqual(1);
    expect(result.mismatches).toEqual([]);
  });

  it('reds (content-hash-mismatch) when a rule field is hand-edited in the manifest', () => {
    const manifest = readJson(manifestPath(dir));
    manifest.G1.examples.bad = `${manifest.G1.examples.bad}\n// hand-edited`;
    writeJson(manifestPath(dir), manifest);

    const result = verifyProvenance(dir);

    expect(result.ok).toBe(false);
    expect(result.mismatches).toContainEqual(
      expect.objectContaining({ ruleId: 'G1', kind: 'content-hash-mismatch' }),
    );
  });

  it('reds (content-hash-mismatch) when the check selector is hand-edited', () => {
    const manifest = readJson(manifestPath(dir));
    manifest.G1.check.message = 'silently weakened message';
    writeJson(manifestPath(dir), manifest);

    const result = verifyProvenance(dir);

    expect(result.ok).toBe(false);
    expect(result.mismatches.some((m: { kind: string }) => m.kind === 'content-hash-mismatch')).toBe(true);
  });

  it('reds (missing-in-provenance) when a rule is added to the manifest by hand', () => {
    const manifest = readJson(manifestPath(dir));
    manifest.G2 = { ...manifest.G1, title: 'sneaked-in rule' };
    writeJson(manifestPath(dir), manifest);

    const result = verifyProvenance(dir);

    expect(result.ok).toBe(false);
    expect(result.mismatches).toContainEqual(
      expect.objectContaining({ ruleId: 'G2', kind: 'missing-in-provenance' }),
    );
  });

  it('reds (missing-in-manifest) when a rule is deleted from the manifest by hand', () => {
    const manifest = readJson(manifestPath(dir));
    delete manifest.G1;
    writeJson(manifestPath(dir), manifest);

    const result = verifyProvenance(dir);

    expect(result.ok).toBe(false);
    expect(result.mismatches).toContainEqual(
      expect.objectContaining({ ruleId: 'G1', kind: 'missing-in-manifest' }),
    );
  });

  it('reds (marker-stripped) when the generated "do not edit" marker is removed', () => {
    const prov = readJson(provenancePath(dir));
    delete prov.note;
    writeJson(provenancePath(dir), prov);

    const result = verifyProvenance(dir);

    expect(result.ok).toBe(false);
    expect(result.mismatches.some((m: { kind: string }) => m.kind === 'marker-stripped')).toBe(true);
  });

  it('throws ProvenanceVerifyError when provenance.json is missing (deleted)', () => {
    rmSync(provenancePath(dir));

    expect(() => verifyProvenance(dir)).toThrow(ProvenanceVerifyError);
  });

  it('CLI exits non-zero on a hand-edited bundle (mechanical CI red)', () => {
    const manifest = readJson(manifestPath(dir));
    manifest.G1.examples.good = `${manifest.G1.examples.good}\n// hand-edited`;
    writeJson(manifestPath(dir), manifest);

    let exitCode = 0;
    try {
      execFileSync('npx', ['tsx', resolve(HERE, 'verify-provenance-cli.ts'), dir], {
        stdio: 'pipe',
      });
    } catch (err) {
      exitCode = (err as { status?: number }).status ?? 1;
    }

    expect(exitCode).toBe(1);
  });
});
