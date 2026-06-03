/**
 * dispatcher monitor-classify.sh tests (T-DUX-B)
 * (a) Transition test: stubbed task-status objects → correct RUNNING/DONE/PARKED classification
 * (b) Safety check: SKILL.md §2.2 contains no harness-blocked patterns (sleep, ;-chains)
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../..');
const CLASSIFY = resolve(REPO_ROOT, '.claude/skills/dispatcher/helpers/monitor-classify.sh');
const SKILL = resolve(REPO_ROOT, '.claude/skills/dispatcher/SKILL.md');

function classify(json: object): string {
  return execFileSync('bash', [CLASSIFY], {
    encoding: 'utf8',
    env: { ...process.env, TASK_JSON: JSON.stringify(json) },
  }).trim();
}

// ── (a) Transition test ───────────────────────────────────────────────────────

describe('monitor-classify.sh — transition test (T-DUX-B a)', () => {
  it('implementing → RUNNING', () =>
    expect(classify({ status: 'implementing' })).toMatch(/^RUNNING:/));
  it('planning → RUNNING', () =>
    expect(classify({ status: 'planning' })).toMatch(/^RUNNING:/));
  it('done → DONE', () =>
    expect(classify({ status: 'done' })).toMatch(/^DONE:/));
  it('verified → DONE', () =>
    expect(classify({ status: 'verified' })).toMatch(/^DONE:/));
  it('blocked_external → PARKED', () =>
    expect(classify({ status: 'blocked_external' })).toMatch(/^PARKED:/));
  it('manualReviewRequired:true → PARKED', () =>
    expect(classify({ status: 'implementing', manualReviewRequired: true })).toMatch(/^PARKED:/));
  it('blockedReason non-empty → PARKED', () =>
    expect(classify({ status: 'implementing', blockedReason: 'needs answer' })).toMatch(/^PARKED:/));
  it('isParked:true → PARKED', () =>
    expect(classify({ status: 'implementing', isParked: true })).toMatch(/^PARKED:/));
});

// ── (b) Safety check — paired-negative ───────────────────────────────────────

describe('SKILL.md §2.2 safety — no harness-blocked patterns (T-DUX-B b)', () => {
  const skill = readFileSync(SKILL, 'utf8');
  const s22start = skill.indexOf('**§2.2 —');
  const s23start = skill.indexOf('**§2.3 —');
  const section = skill.slice(s22start, s23start > s22start ? s23start : undefined);

  it('§2.2 contains no foreground sleep (harness-blocked)', () => {
    expect(section).not.toMatch(/\bsleep\s+\d/);
  });
  it('§2.2 contains no compound ;-chain ≥3 semicolons on one line (harness-blocked)', () => {
    const violating = section.split('\n').filter((l) => (l.match(/;/g) ?? []).length >= 3);
    expect(violating, `violating lines: ${JSON.stringify(violating)}`).toHaveLength(0);
  });
});
