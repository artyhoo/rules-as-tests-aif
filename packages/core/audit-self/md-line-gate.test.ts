/**
 * Paired-negative contract for md-line-gate.sh — the markdown overweight gate
 * (≤600 lines) extracted from .github/workflows/audit-self.yml so the kickoff
 * exemption ships with a real test (cross-session kickoff portability I-phase,
 * SSOT #116; kickoff D3 acceptance — "a >600-line kickoff WITH the marker
 * commits; an identical one WITHOUT it fails the gate").
 *
 * Script under test: packages/core/audit-self/md-line-gate.sh
 *
 * Channel: CI (.github/workflows/audit-self.yml "No file > 500 lines (markdown)"
 * step calls this script — it is the load-bearing gate, not a replica).
 *
 * Paired-negative contract (each positive has a mirror differing only in the
 * one property under test, so the test kills a mutant removing the relevant guard):
 *   D3 POSITIVE/NEGATIVE  — oversized kickoff WITH/WITHOUT "transient artifact" marker
 *   PARITY (EXECUTION-PLAN) — per-file EXEMPT marker guard preserved
 *   PARITY (research-patches/) — directory-level exemption preserved
 *   PARITY (normal md)    — non-exempt oversized file still fails
 *   EDGE                  — small kickoff (no marker) is not flagged
 *
 * T3 compliance: each assertion cites the script region it targets.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const SCRIPT = resolve(REPO_ROOT, 'packages/core/audit-self/md-line-gate.sh');

const sandboxes: string[] = [];
afterEach(() => {
  for (const d of sandboxes.splice(0)) rmSync(d, { recursive: true, force: true });
});

function makeRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'md-line-gate-test-'));
  sandboxes.push(d);
  return d;
}

/** Build a markdown body of `lines` total lines, optionally with the marker. */
function mdBody(lines: number, withMarker: boolean): string {
  const head = withMarker
    ? '# Title\n\n> **transient artifact** — orchestration design doc, exempt from line gate.\n'
    : '# Title\n\n> A normal heading line.\n';
  const headLines = head.split('\n').length - 1; // trailing newline
  const filler = Array.from(
    { length: Math.max(0, lines - headLines) },
    (_, i) => `- line ${i + 1}`,
  ).join('\n');
  return `${head}${filler}\n`;
}

function writeMd(
  root: string,
  rel: string,
  lines: number,
  withMarker: boolean,
): void {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, mdBody(lines, withMarker), 'utf8');
}

function run(root: string): { status: number; stdout: string } {
  const r = spawnSync('bash', [SCRIPT, root], { encoding: 'utf8' });
  return { status: r.status ?? -1, stdout: r.stdout };
}

describe('md-line-gate.sh — kickoff exemption (D3 paired-negative contract)', () => {
  it('D3 POSITIVE — >600-line kickoff WITH "transient artifact" marker → exit 0 (exempt)', () => {
    // Targets the kickoff case: head -20 | grep -qi "transient artifact" → continue (skip size check).
    const root = makeRoot();
    writeMd(root, '.claude/orchestrator-prompts/big-umbrella/kickoff.md', 700, true);
    const r = run(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('declared transient kickoff');
    expect(r.stdout).not.toContain('::error');
  });

  it('D3 NEGATIVE — identical >600-line kickoff WITHOUT marker → exit 1 (overweight)', () => {
    // Paired negative: same file, no marker → falls through to the 600-line check → ::error + fail.
    const root = makeRoot();
    writeMd(root, '.claude/orchestrator-prompts/big-umbrella/kickoff.md', 700, false);
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('::error');
    expect(r.stdout).toContain('overweight');
  });

  it('EDGE — small kickoff (≤600) WITHOUT marker → exit 0 (not flagged)', () => {
    // A normal-sized kickoff needs no marker — confirms the gate only bites oversized files.
    const root = makeRoot();
    writeMd(root, '.claude/orchestrator-prompts/small-umbrella/kickoff.md', 120, false);
    const r = run(root);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain('::error');
  });
});

describe('md-line-gate.sh — parity with the prior inline gate', () => {
  it('PARITY POSITIVE — oversized EXECUTION-PLAN.md WITH marker → exit 0 (per-file EXEMPT)', () => {
    // Targets the EXEMPT loop: exact-match + marker → ::notice + continue 2.
    const root = makeRoot();
    writeMd(root, 'docs/meta-factory/EXECUTION-PLAN.md', 800, true);
    const r = run(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('skipped overweight check (declared transient)');
  });

  it('PARITY NEGATIVE — oversized EXECUTION-PLAN.md WITHOUT marker → exit 1 (EXEMPT-but-no-marker guard)', () => {
    // Targets the EXEMPT-without-marker arm: ::error "listed in EXEMPT but no marker" + fail.
    const root = makeRoot();
    writeMd(root, 'docs/meta-factory/EXECUTION-PLAN.md', 800, false);
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("listed in EXEMPT but no 'transient artifact' marker");
  });

  it('PARITY — oversized file under research-patches/ (no marker) → exit 0 (directory exemption)', () => {
    // Targets the EXEMPT_DIRS loop: case "$ex_dir"* → continue 2 (no marker required).
    const root = makeRoot();
    writeMd(root, 'docs/meta-factory/research-patches/2026-06-14-big.md', 900, false);
    const r = run(root);
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain('::error');
  });

  it('PARITY NEGATIVE — oversized non-exempt markdown → exit 1 (overweight)', () => {
    // A normal oversized doc with no exemption path still fails (the gate is live).
    const root = makeRoot();
    writeMd(root, 'README.md', 700, false);
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('::error');
    expect(r.stdout).toContain('overweight');
  });
});
