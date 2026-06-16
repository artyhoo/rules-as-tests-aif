/**
 * Principle 21 — Agnosticism conformance (agnosticism-remediation umbrella, PR #564)
 *
 * Source: .claude/orchestrator-prompts/agnosticism-remediation/kickoff.md §5/§6 task T-C;
 *         README.md#why-this-exists invariant 4 (multi-channel enforcement);
 *         .claude/rules/rule-enforcement-channel-selection.md §4 (principle test = gate,
 *         repo-wide, deterministic, zero standing cost).
 *
 * Invariant: every deterministic conformance probe in
 *   tests/agnosticism/probes/*.sh
 * must report verdict PORTABLE — meaning the repo's rules, hooks, CI jobs, and
 * doc-claims function correctly for AI harnesses OTHER than Claude Code (Cursor,
 * Aider, Codex, etc.), without requiring CC presence.
 *
 * Dependency: T-A (doc-claims probe, b3872b14, PR #570) and T-B (AGENTS.md portable
 * rule index + rules-autoload probe, eb0faae9, PR #575) must be on this branch — they
 * are the commits that flipped doc-claims and rules-autoload from CC-ONLY → PORTABLE.
 * Both are present on feature/agnosticism-remediation-t-c-853487 (verified at plan time).
 *
 * How the test works:
 *  1. Runs `bash tests/agnosticism/run-audit.sh` via execSync (cwd = REPO_ROOT).
 *     The harness writes tests/agnosticism/conformance-record.tsv (gitignored, §34 of
 *     .gitignore). The script uses `set -uo pipefail` with no `-e`, so the harmless
 *     `column -t` failure (absent in lean CI images) does not abort the record write.
 *  2. Reads the TSV; filters out the header row + any PORTABLE rows.
 *  3. Asserts the non-PORTABLE list is empty.
 *  4. Population sentinel: asserts at least 6 deterministic rows — guards against a
 *     vacuous pass from a silently-truncated or empty record file.
 *
 * T15 self-application: this test IS agnosticism applied to itself — it runs inside
 * the CI principle suite, a channel that operates entirely independently of CC.
 *
 * No paid LLM: pure bash + file read, zero API calls (no-paid-llm-in-ci.md §1 satisfied).
 *
 * Build-vs-reuse note: REUSE existing harness (tests/agnosticism/run-audit.sh +
 * probes/*.sh); only the vitest wrapper (this file) is new — not a capability commit
 * per CLAUDE.md definition (no new dependency, no new module ≥80 LOC). Prior-art:
 * no upstream tool targets "agnosticism conformance as a CI principle test" for this
 * project-specific probe structure — BUILD verdict for the wrapper is self-evident.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');
const RECORD_FILE = resolve(REPO_ROOT, 'tests/agnosticism/conformance-record.tsv');
const HARNESS = resolve(REPO_ROOT, 'tests/agnosticism/run-audit.sh');

/**
 * Parse a conformance-record TSV and return the non-PORTABLE rows.
 * Skips the header row. A row is non-PORTABLE when its last tab-delimited
 * field is NOT exactly "PORTABLE".
 */
export function nonPortableFindings(tsv: string): string[] {
  return tsv
    .split('\n')
    .filter((line) => line.trim() !== '')
    .slice(1) // skip header
    .filter((line) => {
      const fields = line.split('\t');
      const verdict = fields[fields.length - 1]?.trim() ?? '';
      return verdict !== 'PORTABLE';
    });
}

describe('Principle 21 — agnosticism conformance', () => {
  it('runs the conformance harness (harness file must exist)', () => {
    expect(existsSync(HARNESS), `harness not found: ${HARNESS}`).toBe(true);
  });

  it('produces a conformance-record.tsv with at least 6 deterministic rows (population sentinel)', () => {
    execSync(`bash "${HARNESS}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
    expect(existsSync(RECORD_FILE), `record file not produced: ${RECORD_FILE}`).toBe(true);

    const tsv = readFileSync(RECORD_FILE, 'utf8');
    const dataRows = tsv
      .split('\n')
      .filter((line) => line.trim() !== '')
      .slice(1); // skip header

    expect(
      dataRows.length,
      `expected ≥6 deterministic probe rows in conformance-record.tsv; got ${dataRows.length} — ` +
        `this guard prevents a vacuous pass from a silently-empty record file`,
    ).toBeGreaterThanOrEqual(6);
  });

  it('all deterministic conformance probes report PORTABLE (zero non-PORTABLE findings)', () => {
    // Harness already ran in the previous test; re-run to get a fresh record.
    execSync(`bash "${HARNESS}"`, { cwd: REPO_ROOT, stdio: 'pipe' });
    const tsv = readFileSync(RECORD_FILE, 'utf8');
    const nonPortable = nonPortableFindings(tsv);
    expect(
      nonPortable,
      `non-PORTABLE agnosticism findings detected — rule/hook/doc must be fixed before merge:\n` +
        nonPortable.join('\n'),
    ).toEqual([]);
  });

  // ── Paired-negative: prove nonPortableFindings CATCHES real violations ─────────
  it('paired-negative: detects a CC-ONLY verdict row', () => {
    const tsv = [
      'surface\tprobe\tcmd\texit\tverdict',
      'hooks\tsome-hook\tgrep check\t1\tCC-ONLY',
      'substrate\tconfig\tconfig-check\t0\tPORTABLE',
    ].join('\n');
    expect(nonPortableFindings(tsv).length).toBeGreaterThan(0);
  });

  it('paired-negative: detects a DEGRADED verdict row', () => {
    const tsv = [
      'surface\tprobe\tcmd\texit\tverdict',
      'rules-autoload\tmanual-read-burden\tAGENTS.md missing 3/12 rules\t1\tDEGRADED:12-rules',
    ].join('\n');
    expect(nonPortableFindings(tsv).length).toBeGreaterThan(0);
  });

  it('paired-negative: does NOT false-positive on an all-PORTABLE TSV', () => {
    const tsv = [
      'surface\tprobe\tcmd\texit\tverdict',
      'hooks\t.husky/pre-commit\tgrep CC coupling\t0\tPORTABLE',
      'substrate\tconfig-cc-coupling\tgrep CLAUDE_\t0\tPORTABLE',
    ].join('\n');
    expect(nonPortableFindings(tsv)).toEqual([]);
  });
});
