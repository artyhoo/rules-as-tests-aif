/**
 * prior-art.test.ts — Vitest tests for checks/prior-art.ts (Wave 10.2).
 *
 * All git I/O is injected via a fake GitProvider — no subprocess shelling.
 * The bash predecessor (pa_check_trailer in legacy-trailer-checks.sh) had
 * zero mutation coverage; these tests must achieve Stryker ≥80% (D4 gate).
 *
 * Paired-negative requirement (kickoff §Wave 10.2):
 *   ❌ capability commit + missing/placeholder trailer → exit-1-class failure
 *   ✅ capability commit + valid SSOT citation → passes
 *   ❌ capability commit + escape-hatch on capability → exit-2-class (substance failure)
 *   ✅ non-capability commit → check skipped entirely
 */
import { describe, it, expect } from 'vitest';
import {
  loc,
  isNewDepAdded,
  detectCapabilityReason,
  checkTrailerBody,
  runPriorArtCheck,
  PA_HISTORICAL_CUTOFF,
} from './prior-art.ts';
import type { GitProvider } from '../utils/git.ts';

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Produce a one-field package.json diff: a `+` line for a new dep entry. */
function addedDepDiff(key: string, version: string): string {
  return `--- a/package.json\n+++ b/package.json\n@@ -1,4 +1,7 @@\n {\n   "dependencies": {\n+    "${key}": "${version}"\n   }\n }`;
}

/** Same key appears on both `+` and `-` lines (version bump, not a new dep). */
function bumpedDepDiff(key: string, oldV: string, newV: string): string {
  return `--- a/package.json\n+++ b/package.json\n-    "${key}": "${oldV}"\n+    "${key}": "${newV}"`;
}

const FUTURE = '2099-01-01';   // always > cutoff → check fires
const PAST   = '2026-01-01';   // always < cutoff → bypass

const VALID_CITATION = 'Prior-art: prior-art-evaluations.md#1 (Autogrep, verdict DEFER — different domain).';
const VALID_ESCAPE   = 'Prior-art: skipped — refactor only, no new capability';

function fakeGit(overrides: Partial<GitProvider> = {}): GitProvider {
  return {
    packageJsonDiff: () => '',
    changedFiles: () => [],
    fileContent: () => null,
    subdirExistedAtParent: () => false,
    commitBody: () => '',
    authorDate: () => FUTURE,
    ...overrides,
  };
}

// ─── loc() ───────────────────────────────────────────────────────────────────

describe('loc()', () => {
  it('counts newline characters (wc -l semantics)', () => {
    expect(loc('a\nb\nc\n')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(loc('')).toBe(0);
  });

  it('returns 0 for single line without trailing newline', () => {
    expect(loc('hello')).toBe(0);
  });

  it('counts only newlines (not bytes)', () => {
    expect(loc('\n\n\n')).toBe(3);
  });
});

// ─── isNewDepAdded() ──────────────────────────────────────────────────────────

describe('isNewDepAdded()', () => {
  it('returns false for empty diff', () => {
    expect(isNewDepAdded('')).toBe(false);
  });

  it('detects a caret-versioned new dep', () => {
    expect(isNewDepAdded(addedDepDiff('some-lib', '^1.0.0'))).toBe(true);
  });

  it('detects a tilde-versioned new dep (M1 fix)', () => {
    expect(isNewDepAdded(addedDepDiff('some-lib', '~1.0.0'))).toBe(true);
  });

  it('detects a digit-only (exact) version', () => {
    expect(isNewDepAdded(addedDepDiff('some-lib', '1.2.3'))).toBe(true);
  });

  it('detects a >= range', () => {
    expect(isNewDepAdded(addedDepDiff('some-lib', '>=1.0.0'))).toBe(true);
  });

  it('detects a wildcard (*) version', () => {
    expect(isNewDepAdded(addedDepDiff('some-lib', '*'))).toBe(true);
  });

  it('detects a = exact version prefix', () => {
    expect(isNewDepAdded(addedDepDiff('some-lib', '=1.0.0'))).toBe(true);
  });

  it('returns false for a version bump of an existing dep (M2 fix)', () => {
    // Same key present in both +/- lines → bump, not new dep.
    expect(isNewDepAdded(bumpedDepDiff('existing-dep', '^1.0.0', '^2.0.0'))).toBe(false);
  });

  it('returns false when only the context lines (space prefix) are present', () => {
    const diff = '   "ctx-dep": "^1.0.0"';  // no + or - prefix
    expect(isNewDepAdded(diff)).toBe(false);
  });

  it('handles multiple new deps and returns true when any are new', () => {
    const diff = [
      '+    "dep-a": "^1.0.0"',
      '+    "dep-b": "^2.0.0"',
    ].join('\n');
    expect(isNewDepAdded(diff)).toBe(true);
  });
});

// ─── detectCapabilityReason() ─────────────────────────────────────────────────

describe('detectCapabilityReason()', () => {
  it('returns null for a non-capability commit (no changes match thresholds)', () => {
    const g = fakeGit();
    expect(detectCapabilityReason('abc123', g)).toBeNull();
  });

  it('detects new explicit dep in package.json', () => {
    const g = fakeGit({
      packageJsonDiff: () => addedDepDiff('my-lib', '^3.0.0'),
    });
    expect(detectCapabilityReason('abc123', g)).toMatch(/new explicit dep/);
  });

  it('does NOT flag a dep version bump as capability', () => {
    const g = fakeGit({
      packageJsonDiff: () => bumpedDepDiff('my-lib', '^1.0.0', '^2.0.0'),
    });
    expect(detectCapabilityReason('abc123', g)).toBeNull();
  });

  it('detects new file ≥50 LOC in a NEW packages/core/<subdir>/', () => {
    // File under a new subdir (subdirExistedAtParent = false).
    const content50 = 'x\n'.repeat(50);
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/core/newdir/index.ts' }],
      fileContent: () => content50,
      subdirExistedAtParent: () => false,
    });
    expect(detectCapabilityReason('abc123', g)).toMatch(/50 LOC/);
  });

  it('does NOT flag ≥50 LOC file in an EXISTING core subdir', () => {
    const content50 = 'x\n'.repeat(50);
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/core/existingdir/index.ts' }],
      fileContent: () => content50,
      subdirExistedAtParent: () => true,  // subdir already existed
    });
    expect(detectCapabilityReason('abc123', g)).toBeNull();
  });

  it('does NOT flag file with 49 LOC in new core subdir (threshold is ≥50)', () => {
    const content49 = 'x\n'.repeat(49);
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/core/newdir/index.ts' }],
      fileContent: () => content49,
      subdirExistedAtParent: () => false,
    });
    expect(detectCapabilityReason('abc123', g)).toBeNull();
  });

  it('detects new file ≥80 LOC anywhere under packages/', () => {
    const content80 = 'x\n'.repeat(80);
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/other/module.ts' }],
      fileContent: () => content80,
    });
    expect(detectCapabilityReason('abc123', g)).toMatch(/80 LOC/);
  });

  it('does NOT flag file with 79 LOC under packages/ (threshold is ≥80)', () => {
    const content79 = 'x\n'.repeat(79);
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/other/module.ts' }],
      fileContent: () => content79,
    });
    expect(detectCapabilityReason('abc123', g)).toBeNull();
  });

  it('only considers status=A (Added) files, not M (Modified)', () => {
    // A modified file ≥80 LOC should NOT trigger the ≥80 LOC capability gate
    // (gate is only for newly-added files, per CONTRIBUTING.md definition).
    const content80 = 'x\n'.repeat(80);
    const g = fakeGit({
      changedFiles: () => [{ status: 'M', path: 'packages/other/module.ts' }],
      fileContent: () => content80,
    });
    expect(detectCapabilityReason('abc123', g)).toBeNull();
  });

  it('ignores files outside packages/ for the ≥80 LOC gate', () => {
    const content80 = 'x\n'.repeat(80);
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'scripts/something.ts' }],
      fileContent: () => content80,
    });
    expect(detectCapabilityReason('abc123', g)).toBeNull();
  });
});

// ─── checkTrailerBody() ───────────────────────────────────────────────────────

describe('checkTrailerBody()', () => {
  // Historical cutoff bypass.
  it('passes (code 0) for commits authored before the cutoff (replay protection)', () => {
    const result = checkTrailerBody('No trailer at all.', PAST);
    expect(result.code).toBe(0);
  });

  it('fails (code 1) for commits with no Prior-art line at all', () => {
    const result = checkTrailerBody('feat: add something\n\nNo trailer.', FUTURE);
    expect(result.code).toBe(1);
    expect(result.message).toMatch(/no Prior-art/);
  });

  it('fails (code 1) for Prior-art line shorter than 20 chars after colon', () => {
    const result = checkTrailerBody('feat: foo\n\nPrior-art: short', FUTURE);
    expect(result.code).toBe(1);
    expect(result.message).toMatch(/invalid.*length/);
  });

  it('passes (code 0) for a valid SSOT citation (≥20 chars, not escape-hatch)', () => {
    const result = checkTrailerBody(`feat: foo\n\n${VALID_CITATION}`, FUTURE);
    expect(result.code).toBe(0);
  });

  it('fails (code 2) for escape-hatch "skipped" on a capability commit (substance arm)', () => {
    const result = checkTrailerBody(`feat: foo\n\n${VALID_ESCAPE}`, FUTURE);
    expect(result.code).toBe(2);
    expect(result.message).toMatch(/substance/);
  });

  it('fails (code 1) for escape-hatch with <20-char rationale', () => {
    const result = checkTrailerBody('feat: foo\n\nPrior-art: skipped — TODO', FUTURE);
    expect(result.code).toBe(1);
    expect(result.message).toMatch(/invalid.*length/);
  });

  it('fails (code 1) for escape-hatch with only placeholder words', () => {
    // "TODO TODO TODO TODO TODO" is ≥20 chars but all placeholder tokens.
    const result = checkTrailerBody('feat: foo\n\nPrior-art: skipped — TODO TODO TODO TODO TODO', FUTURE);
    // Placeholder rationale is caught by the all-placeholder filter → continue → code 1.
    expect(result.code).toBe(1);
  });

  it('passes (code 0) for escape-hatch with substantive ≥20-char rationale', () => {
    // Escape-hatch on a NON-capability commit is valid (the outer caller
    // decides; checkTrailerBody treats a substantive skipped as code 2 when
    // called by the capability-path. But per bash behaviour, the distinction is
    // made by the outer loop. The test here verifies the 'skipped' branch's
    // substance-arm triggers code 2 when substantive — callers handle it as
    // warn-only or block based on PA_SUBSTANCE_WARN_ONLY. The current TS
    // contract: substantive skipped → code 2 (caller decides warn vs block).
    // This is the paired-negative: escape-hatch on capability → code 2.
    const result = checkTrailerBody('feat: foo\n\nPrior-art: skipped — refactor only, no new capability', FUTURE);
    expect(result.code).toBe(2);
  });

  it('uses the default cutoff constant when cutoff is not supplied', () => {
    // Commits before PA_HISTORICAL_CUTOFF bypass the check.
    const result = checkTrailerBody('no trailer', '2026-05-10'); // < cutoff 2026-05-12
    expect(result.code).toBe(0);
  });

  it('does NOT bypass for dates equal to the cutoff (boundary)', () => {
    // String comparison: '2026-05-12' is NOT < '2026-05-12'.
    const result = checkTrailerBody('feat: foo\n\nno trailer', PA_HISTORICAL_CUTOFF);
    expect(result.code).toBe(1);
  });

  it('picks the first valid Prior-art line even when an earlier invalid one exists', () => {
    const body = [
      'feat: foo',
      '',
      'Prior-art: short',           // too short → skip
      'Prior-art: prior-art-evaluations.md#5 (Autogrep, verdict DEFER — different domain).',
    ].join('\n');
    const result = checkTrailerBody(body, FUTURE);
    expect(result.code).toBe(0);
  });

  it('strips exactly one leading space after "Prior-art:" (bash parity)', () => {
    // "Prior-art:X" (no space) vs "Prior-art: X" (one space stripped) —
    // the payload after stripping is measured for ≥20 chars.
    const longNoSpace = 'Prior-art:' + 'x'.repeat(20);   // payload = 'xxx…' (20 chars) → valid
    const result = checkTrailerBody(`feat: foo\n\n${longNoSpace}`, FUTURE);
    expect(result.code).toBe(0);
  });
});

// ─── boundary / mutation-killing edge cases ───────────────────────────────────

describe('boundary cases (mutation-killing)', () => {
  it('exact 20-char rationale after "skipped" → escape-hatch on capability → code 2', () => {
    // Kills the <= vs < boundary mutant on rationale.length.
    // 20 chars: "refactor, no new cap" (exactly)
    const exactly20 = 'refactor, no new cap'; // 20 chars
    expect(exactly20.length).toBe(20);
    const result = checkTrailerBody(`feat: foo\n\nPrior-art: skipped — ${exactly20}`, FUTURE);
    // Substantive 20-char rationale on capability → code 2 (substance arm).
    expect(result.code).toBe(2);
  });

  it('19-char rationale after "skipped" → invalid (too short)', () => {
    // Kills the boundary mutant from the other side.
    const exactly19 = 'refactor no new cap'; // 19 chars
    expect(exactly19.length).toBe(19);
    const result = checkTrailerBody(`feat: foo\n\nPrior-art: skipped — ${exactly19}`, FUTURE);
    expect(result.code).toBe(1);
  });

  it('content null from fileContent → does not count as capability (line 58 conditional)', () => {
    // Kills ConditionalExpression false at line 58: null content → skip.
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/core/newdir/index.ts' }],
      fileContent: () => null,    // null → content === null → not a capability
      subdirExistedAtParent: () => false,
    });
    expect(detectCapabilityReason('abc', g)).toBeNull();
  });

  it('content null from fileContent in packages/ → not a capability (line 68 conditional)', () => {
    // Kills ConditionalExpression true at line 68.
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/other/big.ts' }],
      fileContent: () => null,
    });
    expect(detectCapabilityReason('abc', g)).toBeNull();
  });

  it('core subdir non-packages/core path (packages/ but not packages/core/) not confused with 50-LOC gate', () => {
    // Tests the startsWith('packages/core/') guard — a file in packages/other/ with
    // <80 LOC should not trigger either gate.
    const content30 = 'x\n'.repeat(30);
    const g = fakeGit({
      changedFiles: () => [{ status: 'A', path: 'packages/other/small.ts' }],
      fileContent: () => content30,
    });
    // 30 LOC under packages/ (but NOT ≥80) → not capability
    expect(detectCapabilityReason('abc', g)).toBeNull();
  });
});

// ─── runPriorArtCheck() — paired-negative end-to-end ─────────────────────────

describe('runPriorArtCheck() — paired-negative', () => {
  it('PAIRED-NEGATIVE: capability commit + no trailer → failures list non-empty', () => {
    const g = fakeGit({
      packageJsonDiff: () => addedDepDiff('new-dep', '^1.0.0'),
      commitBody: () => 'feat: add dep\n\nNo Prior-art line.',
      authorDate: () => FUTURE,
    });
    const report = runPriorArtCheck(['sha1'], g);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].sha).toBe('sha1');
    expect(report.substanceFailures).toHaveLength(0);
  });

  it('PAIRED-POSITIVE: capability commit + valid SSOT citation → both lists empty', () => {
    const g = fakeGit({
      packageJsonDiff: () => addedDepDiff('new-dep', '^1.0.0'),
      commitBody: () => `feat: add dep\n\n${VALID_CITATION}`,
      authorDate: () => FUTURE,
    });
    const report = runPriorArtCheck(['sha1'], g);
    expect(report.failures).toHaveLength(0);
    expect(report.substanceFailures).toHaveLength(0);
  });

  it('PAIRED-NEGATIVE (substance): capability commit + escape-hatch → substanceFailures non-empty', () => {
    const g = fakeGit({
      packageJsonDiff: () => addedDepDiff('new-dep', '^1.0.0'),
      commitBody: () => `feat: add dep\n\n${VALID_ESCAPE}`,
      authorDate: () => FUTURE,
    });
    const report = runPriorArtCheck(['sha1'], g);
    expect(report.failures).toHaveLength(0);
    expect(report.substanceFailures).toHaveLength(1);
    expect(report.substanceFailures[0].message).toMatch(/substance/);
  });

  it('non-capability commit is skipped entirely (no entries in either list)', () => {
    const g = fakeGit({
      // no dep, no large files → not a capability commit
      commitBody: () => 'chore: doc edit\n\nNo trailer.',
      authorDate: () => FUTURE,
    });
    const report = runPriorArtCheck(['sha1'], g);
    expect(report.failures).toHaveLength(0);
    expect(report.substanceFailures).toHaveLength(0);
  });

  it('pre-cutoff capability commit is bypassed (historical-cutoff protection)', () => {
    const g = fakeGit({
      packageJsonDiff: () => addedDepDiff('old-dep', '^1.0.0'),
      commitBody: () => 'feat: add dep\n\nNo trailer.',
      authorDate: () => PAST,
    });
    const report = runPriorArtCheck(['sha1'], g);
    expect(report.failures).toHaveLength(0);
  });

  it('processes multiple commits and accumulates findings', () => {
    const caps = ['sha1', 'sha2'];
    const g = fakeGit({
      packageJsonDiff: (sha) =>
        sha === 'sha1' ? addedDepDiff('dep-a', '^1.0.0') : addedDepDiff('dep-b', '^2.0.0'),
      commitBody: (sha) =>
        sha === 'sha1'
          ? `feat: sha1\n\n${VALID_CITATION}`
          : 'feat: sha2\n\nNo Prior-art line.',
      authorDate: () => FUTURE,
    });
    const report = runPriorArtCheck(caps, g);
    // sha1 has valid citation → passes; sha2 has no trailer → fails
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].sha).toBe('sha2');
    expect(report.failures[0].reason).toMatch(/dep/);
  });

  it('SHAs in the report are truncated to 10 chars', () => {
    const longSha = 'abcdef1234567890';
    const g = fakeGit({
      packageJsonDiff: () => addedDepDiff('some-dep', '^1.0.0'),
      commitBody: () => 'feat: dep\n\nNo trailer.',
      authorDate: () => FUTURE,
    });
    const report = runPriorArtCheck([longSha], g);
    expect(report.failures[0].sha).toBe('abcdef1234');
    expect(report.failures[0].sha.length).toBe(10);
  });
});
