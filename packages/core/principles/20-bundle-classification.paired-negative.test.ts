/**
 * Principle 20 paired-negative — bundle-curate.sh correctness (principle 02 mandate)
 *
 * REWRITTEN 2026-06-27 (DN-T3-2, §13.32 DN-M1 Task-3 fix). The prior version built
 * fabricated markdown strings locally (brokenBundleNoFilter/NoCap/NoOverlap) and never
 * executed bundle-curate.sh — it asserted properties of hand-written rows, proving
 * nothing about the real checker. That was the SUSPECT-TAUTOLOGY finding in
 * docs/meta-factory/research-patches/2026-06-27-§13.32-DN-M1-task3-principle-test-assertion-audit.md §4.2.
 *
 * This version runs a deliberately-MUTATED copy of the REAL bundle-curate.sh against the
 * REAL fixtures and asserts the positive checks in 20-bundle-classification.test.ts would
 * FAIL — the genuine principle-02 paired-negative: break the subject, the gate must catch it.
 * Each mutant disables exactly ONE rule (eligibility filter / max-5 cap / file-overlap),
 * and each arm asserts the matching positive expectation no longer holds. A `control` arm
 * proves the un-mutated script DOES produce the positive expectations, so a mutant arm
 * failing means the mutation broke it — not a fixture/runner regression.
 *
 * The mutant runs from a COPY of the whole helpers dir in a temp dir (so the script's
 * sibling lookups — classify-work.sh / assign-skill.sh via SCRIPT_DIR — still resolve)
 * and never writes into the tracked tree (parallel-safe w.r.t. principle 14 skill-drift).
 *
 * T-BA-C: the eligibility-filter mutant proves a bundle with an R-phase item (filter
 * broken) loses the `excluded: type=R-phase` row the positive check (:104) asserts.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  readFileSync,
  writeFileSync,
  chmodSync,
  mkdtempSync,
  rmSync,
  cpSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HELPER = resolve(REPO_ROOT, '.claude/skills/pipeline/helpers/bundle-curate.sh');
const HELPERS_DIR = dirname(HELPER);
const FIXTURES = resolve(HERE, '__fixtures__/bundle');

/**
 * Per-arm timeout. bundle-curate.sh spawns classify-work.sh + assign-skill.sh ONCE PER
 * backlog item (8 for backlog-2), so a single run is ~3-5s; under the parallel principle
 * suite (where the positive 20-bundle file ALSO spawns bundle-curate concurrently) a run
 * can exceed vitest's 5s default and false-fail on timeout, not on a real assertion.
 * Mirrors the principle-02 bash-mutator precedent (60s for inherently slow shell spawns).
 */
const SLOW_SHELL_MS = 60_000;

/** Count rows whose notes cell contains a pattern (same shape as the positive file). */
function countRows(output: string, notesPattern: string): number {
  return output
    .split('\n')
    .filter((line) => line.startsWith('|') && line.includes(notesPattern))
    .length;
}

/**
 * Copy the whole helpers dir to a temp dir, apply ONE literal break to the
 * bundle-curate.sh copy, run it on a fixture, and always clean up. Throws if the
 * mutation target is absent (so a future edit that moves the line fails loudly
 * instead of silently testing an un-mutated script).
 */
function runMutant(find: string, replace: string, fixtureName: string): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'p20-pn-'));
  try {
    const helpersCopy = join(tmpDir, 'helpers');
    cpSync(HELPERS_DIR, helpersCopy, { recursive: true });

    const mutantHelper = join(helpersCopy, 'bundle-curate.sh');
    const original = readFileSync(mutantHelper, 'utf8');
    const mutated = original.replace(find, replace);
    if (mutated === original) {
      throw new Error(
        `mutation target not found in bundle-curate.sh: ${JSON.stringify(find)} — ` +
          `the script changed; update this paired-negative's mutation target`,
      );
    }
    writeFileSync(mutantHelper, mutated);
    chmodSync(mutantHelper, 0o755);

    return execFileSync('/bin/bash', [mutantHelper, resolve(FIXTURES, fixtureName)], {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    });
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('Principle 20 paired-negative — a broken bundle-curate.sh fails the positive checks', () => {
  // ── control: the un-mutated script DOES produce the positive expectations ────
  // Proves the mutant arms below fail BECAUSE of the mutation, not a fixture/runner bug.
  it('control: the real (un-mutated) bundle-curate.sh excludes the R-phase item and caps at 5', () => {
    const out = execFileSync('/bin/bash', [HELPER, resolve(FIXTURES, 'backlog-2-mixed.txt')], {
      encoding: 'utf8',
      cwd: REPO_ROOT,
    });
    expect(out).toContain('excluded: type=R-phase not in {fix,I-phase-small}');
    expect(countRows(out, 'in-bundle')).toBe(5);
  }, SLOW_SHELL_MS);

  // ── T-BA-C: eligibility-filter mutant → R-phase item no longer excluded ──────
  it('T-BA-C: broken B1 eligibility filter → R-phase item is NOT excluded (positive :104 would fail)', () => {
    // Replace the B1 condition with a hard-false test (`[[ 1 -eq 0 ]]`), NOT the string
    // `false` — `[[ false ]]` is truthy in bash (non-empty string), which would keep the
    // exclusion firing. `1 -eq 0` makes the condition genuinely false → filter disabled.
    const out = runMutant(
      '"${ITEM_TYPE}" != "fix" && "${ITEM_TYPE}" != "I-phase-small"',
      '1 -eq 0',
      'backlog-2-mixed.txt',
    );
    expect(out).not.toContain('excluded: type=R-phase not in {fix,I-phase-small}');
  }, SLOW_SHELL_MS);

  // ── max-5 cap mutant → more than 5 items enter the bundle ────────────────────
  it('broken max-5 cap → >5 items in-bundle (positive :99 toBe(5) would fail)', () => {
    const out = runMutant('"${BUNDLE_COUNT}" -lt 5', '"${BUNDLE_COUNT}" -lt 999', 'backlog-2-mixed.txt');
    // backlog-2 has 6 items passing the filter; with the cap broken all 6 enter (not 5).
    expect(countRows(out, 'in-bundle')).toBeGreaterThan(5);
  }, SLOW_SHELL_MS);

  // ── file-overlap mutant → overlapping items no longer rejected ───────────────
  it('broken file-overlap rejection → overlapping items stay in-bundle (positive :130 toBe(3) would fail)', () => {
    const out = runMutant('"${OVERLAP}" -eq 1', '"${OVERLAP}" -eq 999', 'backlog-3-overlap.txt');
    // backlog-3 has 5 fix items (3 share a file); with overlap rejection broken, >3 enter.
    expect(countRows(out, 'in-bundle')).toBeGreaterThan(3);
    expect(countRows(out, 'file-overlap with prior candidate')).toBe(0);
  }, SLOW_SHELL_MS);
});
