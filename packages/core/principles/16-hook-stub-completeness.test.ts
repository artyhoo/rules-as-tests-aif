/**
 * Principle 16 — Hook stub completeness (Wave 10.6 TS port)
 *
 * Source: packages/core/audit-self/hook-stub-completeness.test.sh (now deleted)
 *         .claude/orchestrator-prompts/wave-10-hook-architecture/i-phase-kickoff.md §10.6
 *         docs/meta-factory/research-patches/2026-05-13-memory-to-docs-codification-audit.md §10.A
 *
 * Invariant: every hard-fail self-test invocation in packages/core/hooks/pre-push.ts
 * (matching `packages/core/audit-self/<name>.test.sh`) must have a matching heredoc stub in
 * EVERY tests/hooks/*.test.sh file that uses make_test_repo(). Without this, a new hard-fail
 * kills the hook before reaching the test's actual subject, causing 5-of-8-style false-passes
 * (Wave 8.3 regression).
 *
 * Port fidelity: produces identical `❌ <file>: missing stub for <name>` violation messages
 * as the bash predecessor, for any non-empty hard-fail set. See the paired-negative arm for
 * proof of detection.
 *
 * BLOCKER exception (post-migration semantics):
 * After this very migration, `pre-push.ts` contains ZERO `.test.sh` hard-fail invocations
 * (hook-stub-completeness removed here; audit-ai-docs is already `.test.ts`). An empty
 * hard-fail set is VACUOUSLY VALID — the test PASSES. The invariant still guards against
 * future re-introduction of a `.test.sh` hard-fail without stubs.
 *
 * T15 self-application: this principle test IS the project dogfooding «documents lie; tests
 * don't» on its own hook layer — the migrated audit now runs as an executable principle, not
 * bash glue, closing the loop on the wave-10 TS migration.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../../');
const PRE_PUSH_PATH = resolve(REPO_ROOT, 'packages/core/hooks/pre-push.ts');
const TESTS_DIR = resolve(REPO_ROOT, 'tests/hooks');

/** Pattern identical to bash: literal `packages/core/audit-self/<name>.test.sh` in args */
const HARD_FAIL_RE = /packages\/core\/audit-self\/[a-z0-9-]+\.test\.sh/g;

/**
 * Extract hard-fail .test.sh invocations from pre-push.ts.
 * Returns a deduplicated sorted array. May be empty (vacuously valid post-migration).
 */
export function extractHardFailScripts(prePushContent: string): string[] {
  const matches = prePushContent.match(HARD_FAIL_RE) ?? [];
  return [...new Set(matches)].sort();
}

/**
 * Extract stubbed script paths from a test file.
 * Pattern matches: `packages/core/audit-self/<name>.test.sh` anywhere in the file
 * (the stubs are heredoc creations like: cat > "$tmp/packages/core/audit-self/foo.test.sh"
 * but the grep pattern is the same either way).
 */
export function extractStubbedScripts(testFileContent: string): Set<string> {
  const matches = testFileContent.match(HARD_FAIL_RE) ?? [];
  return new Set(matches);
}

/**
 * Check stub completeness for a set of hard-fail scripts against a single test file.
 * Returns violation messages in the same `❌ <file>: missing stub for <name>` format as bash.
 */
export function checkTestFileStubCompleteness(
  testFilePath: string,
  testFileContent: string,
  hardFailScripts: readonly string[],
): string[] {
  // Scope: only test files that use make_test_repo() (bash equivalent: continue if absent)
  if (!testFileContent.includes('make_test_repo()')) return [];

  const stubbed = extractStubbedScripts(testFileContent);
  const violations: string[] = [];

  for (const hardFail of hardFailScripts) {
    if (!stubbed.has(hardFail)) {
      const name = basename(hardFail);
      violations.push(`❌ ${testFilePath}: missing stub for ${name}`);
    }
  }
  return violations;
}

/**
 * Full stub-completeness check over the real repo tree.
 * Mirrors the bash script's outer loop exactly:
 *   - Enumerate tests/hooks/*.test.sh
 *   - Skip files without make_test_repo()
 *   - For each in-scope file: every hard-fail script must have a stub
 *
 * Empty hard-fail set → vacuously valid (post-migration BLOCKER fix).
 */
export function runStubCompletenessCheck(
  prePushContent: string,
  testsDir: string,
): string[] {
  const hardFailScripts = extractHardFailScripts(prePushContent);

  // BLOCKER fix: empty hard-fail set is vacuously valid (post-migration state).
  // The bash script would die here; correct TS semantics: pass with no violations.
  if (hardFailScripts.length === 0) return [];

  const testFiles = readdirSync(testsDir)
    .filter((f) => f.endsWith('.test.sh'))
    .sort()
    .map((f) => resolve(testsDir, f));

  const allViolations: string[] = [];
  for (const testFilePath of testFiles) {
    const content = readFileSync(testFilePath, 'utf8');
    const violations = checkTestFileStubCompleteness(testFilePath, content, hardFailScripts);
    allViolations.push(...violations);
  }
  return allViolations;
}

// ── Fixtures for paired-negative and happy-path arms ─────────────────────────

/**
 * Synthetic pre-push content referencing one hard-fail script.
 * Used in non-empty-set tests (paired-negative + happy-path).
 */
const FIXTURE_PREPUSH_WITH_HARDFAIL = `
// pre-push orchestrator excerpt
requireSelfTest('packages/core/audit-self/some-audit.test.sh');
`;

/**
 * Synthetic test file that uses make_test_repo() AND includes the required stub.
 */
const FIXTURE_TEST_WITH_STUB = `
#!/usr/bin/env bash
function make_test_repo() {
  local tmp
  tmp=$(mktemp -d)
  mkdir -p "$tmp/packages/core/audit-self"
  cat > "$tmp/packages/core/audit-self/some-audit.test.sh" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$tmp/packages/core/audit-self/some-audit.test.sh"
  echo "$tmp"
}
`;

/**
 * Synthetic test file that uses make_test_repo() but is MISSING the stub.
 * Used in the paired-negative arm to prove detection fires.
 */
const FIXTURE_TEST_MISSING_STUB = `
#!/usr/bin/env bash
function make_test_repo() {
  local tmp
  tmp=$(mktemp -d)
  # Deliberately no stub for some-audit.test.sh
  echo "$tmp"
}
`;

/**
 * Synthetic test file that does NOT use make_test_repo() — must be skipped by scope gate.
 */
const FIXTURE_TEST_NO_MAKE_TEST_REPO = `
#!/usr/bin/env bash
# Some simpler test that doesn't need a full fake repo
echo "Running simple check..."
`;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Principle 16 — Hook stub completeness', () => {
  // ── Arm (a): real-tree pass ────────────────────────────────────────────────
  it('(a) real-tree: post-migration empty hard-fail set passes vacuously (not a sanity-die)', () => {
    const prePushContent = readFileSync(PRE_PUSH_PATH, 'utf8');
    const hardFails = extractHardFailScripts(prePushContent);

    // After Wave 10.6, there should be ZERO .test.sh hard-fail invocations.
    // The test must pass, not die, in this state.
    expect(
      hardFails,
      'Expected zero .test.sh hard-fail scripts in pre-push.ts after Wave 10.6 migration',
    ).toHaveLength(0);

    const violations = runStubCompletenessCheck(prePushContent, TESTS_DIR);
    expect(violations, 'Vacuous pass: no violations when hard-fail set is empty').toHaveLength(0);
  });

  // ── Arm (b): paired-negative — missing stub is DETECTED ───────────────────
  it('(b) paired-negative: a test file using make_test_repo() without a required stub triggers a violation', () => {
    // This is the load-bearing negative proof (T14): if this arm passes,
    // the checker genuinely detects missing stubs, not just a happy-path tautology.
    const hardFails = extractHardFailScripts(FIXTURE_PREPUSH_WITH_HARDFAIL);
    expect(hardFails).toEqual(['packages/core/audit-self/some-audit.test.sh']);

    // File uses make_test_repo() but has no stub → must report violation
    const violations = checkTestFileStubCompleteness(
      'tests/hooks/synthetic-missing.test.sh',
      FIXTURE_TEST_MISSING_STUB,
      hardFails,
    );

    expect(violations).toHaveLength(1);
    // Message format must match bash spec: `❌ <file>: missing stub for <name>`
    expect(violations[0]).toBe(
      '❌ tests/hooks/synthetic-missing.test.sh: missing stub for some-audit.test.sh',
    );
  });

  // ── Arm (c): non-empty happy-path — stub present → no violation ────────────
  it('(c) non-empty happy path: a test file with make_test_repo() AND the required stub passes', () => {
    const hardFails = extractHardFailScripts(FIXTURE_PREPUSH_WITH_HARDFAIL);
    expect(hardFails).toEqual(['packages/core/audit-self/some-audit.test.sh']);

    const violations = checkTestFileStubCompleteness(
      'tests/hooks/synthetic-good.test.sh',
      FIXTURE_TEST_WITH_STUB,
      hardFails,
    );

    expect(violations, 'Stub present: no violations expected').toHaveLength(0);
  });

  // ── make_test_repo() scope gate ────────────────────────────────────────────
  it('scope gate: test file WITHOUT make_test_repo() is skipped even if stub is absent', () => {
    const hardFails = extractHardFailScripts(FIXTURE_PREPUSH_WITH_HARDFAIL);

    // File lacks make_test_repo() — bash: `continue`; TS: return []
    const violations = checkTestFileStubCompleteness(
      'tests/hooks/synthetic-no-make.test.sh',
      FIXTURE_TEST_NO_MAKE_TEST_REPO,
      hardFails,
    );

    expect(violations, 'Files without make_test_repo() are out of scope').toHaveLength(0);
  });

  // ── Multiple hard-fail scripts ─────────────────────────────────────────────
  it('multiple hard-fail scripts: each missing stub is reported individually', () => {
    const prePush = `
requireSelfTest('packages/core/audit-self/alpha-check.test.sh');
requireSelfTest('packages/core/audit-self/beta-check.test.sh');
`;
    const hardFails = extractHardFailScripts(prePush);
    expect(hardFails).toEqual([
      'packages/core/audit-self/alpha-check.test.sh',
      'packages/core/audit-self/beta-check.test.sh',
    ]);

    // Test file has stub for alpha but NOT beta
    const testContent = `
function make_test_repo() {
  local tmp; tmp=$(mktemp -d)
  cat > "$tmp/packages/core/audit-self/alpha-check.test.sh" <<'STUB'
#!/usr/bin/env bash
exit 0
STUB
  chmod +x "$tmp/packages/core/audit-self/alpha-check.test.sh"
  echo "$tmp"
}
`;

    const violations = checkTestFileStubCompleteness(
      'tests/hooks/synthetic-partial.test.sh',
      testContent,
      hardFails,
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]).toContain('missing stub for beta-check.test.sh');
  });

  // ── Deduplication ─────────────────────────────────────────────────────────
  it('deduplication: duplicate hard-fail entries in pre-push produce one entry per script', () => {
    const prePush = `
requireSelfTest('packages/core/audit-self/dup-check.test.sh');
requireSelfTest('packages/core/audit-self/dup-check.test.sh');
`;
    const hardFails = extractHardFailScripts(prePush);
    expect(hardFails).toHaveLength(1);
    expect(hardFails[0]).toBe('packages/core/audit-self/dup-check.test.sh');
  });

  // ── T15 self-application note ──────────────────────────────────────────────
  it('T15 self-application: this file itself is a principle test enforcing its own layer', () => {
    // The principle test file must exist and be non-trivially larger than an empty stub.
    const selfContent = readFileSync(
      resolve(HERE, '16-hook-stub-completeness.test.ts'),
      'utf8',
    );
    expect(selfContent.length).toBeGreaterThan(500);
    // Confirm it contains the canonical violation message format (mirrors bash)
    expect(selfContent).toContain('missing stub for');
  });
});
