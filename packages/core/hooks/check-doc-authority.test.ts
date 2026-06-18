/**
 * Functional meta-tests for the PostToolUse authority-header gate
 * (.claude/hooks/check-doc-authority.sh) — paired-negative contract for
 * doc-authority-hierarchy.md §2 enforcement (every REQUIRED_HEADER_DOCS path
 * edited post-Edit/Write must contain "> **Authoritative for:**" in its content).
 *
 * Reference pattern: packages/core/hooks/check-hook-marker.test.ts
 * (vitest + spawnSync + mkdtempSync fixture files + jq-availability skip).
 *
 * Paired-negative contract:
 *   ❌ a REQUIRED_HEADER_DOCS file edited WITHOUT `Authoritative for:` → exit 1
 *   ✅ same file WITH `> **Authoritative for:**` header              → exit 0
 *   ✅ a non-required file edited (e.g. packages/foo.ts)             → exit 0
 *   ✅ boundary: `Authoritative for:` appears mid-prose (not in blockquote) → exit 1
 *   ✅ boundary: `Authoritative for:` only inside fenced code block → exit 1 (stripped)
 *
 * Spawns the real hook with fixture stdin (spawnSync) and on-disk fixture files.
 * Skips gracefully when `jq` is unavailable.
 *
 * T3 compliance: each assertion cites the hook source line it targets.
 * T-M4-B compliance: asserts both exit code AND stderr diagnostic text.
 *
 * Isolation strategy for REQUIRED_HEADER_DOCS files:
 *   - Tests that need to write fixture content to a required-doc path use a
 *     NEW file placed in packages/core/fixtures/ under a name that IS in
 *     REQUIRED_HEADER_DOCS only if we register it — which we do NOT.
 *   - Instead, we write to a TEMPORARY file placed INSIDE the repo and inject
 *     its absolute path into the hook's stdin. The hook computes REL_PATH by
 *     stripping REPO_ROOT (line 19), and then the bin.ts's selectRequiredPaths()
 *     filters on that relative path.
 *   - For the ❌/✅ required-doc tests, we use a fixture file whose relPath
 *     IS in REQUIRED_HEADER_DOCS — specifically CLAUDE.md. We save its original
 *     content before overwriting and restore it in afterEach (never delete it).
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { REQUIRED_HEADER_DOCS } from '../principles/09-doc-authority-hierarchy.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HOOK = resolve(REPO_ROOT, '.claude/hooks/check-doc-authority.sh');

function hasJq(): boolean {
  try {
    execSync('command -v jq', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const JQ = hasJq();

// The hook spawns $REPO_ROOT/node_modules/.bin/tsx; when it is absent the hook
// graceful-skips (exit 0) rather than running the bin, so the exit-1 assertions
// below would false-fail. Skip when tsx is not resolvable at the repo root (e.g. a
// worktree whose node_modules was never symlinked). CI installs it (root npm install),
// so the gate still runs there. (CI-gap option C — env-dependent marking.)
const TSX = existsSync(resolve(REPO_ROOT, 'node_modules/.bin/tsx'));

/**
 * Restoration record: absolute path → original content (or null if file did not exist).
 * Populated by writeFixtureOverRepoFile(); restored in afterEach.
 */
const originalContents: Map<string, string | null> = new Map();

/** Temporary paths to rmSync entirely (files created fresh, not overwriting existing). */
const tmpPaths: string[] = [];

afterEach(() => {
  // Restore overwritten required-doc files to their original content
  for (const [abs, original] of originalContents) {
    if (original === null) {
      rmSync(abs, { force: true });
    } else {
      writeFileSync(abs, original, 'utf8');
    }
  }
  originalContents.clear();

  // Delete any freshly-created temp files
  for (const p of tmpPaths.splice(0)) rmSync(p, { recursive: true, force: true });
});

/**
 * Run the hook, feeding it `absPath` as tool_input.file_path.
 * Returns { status, stderr }.
 *
 * hook stdin contract: JSON with `.tool_input.file_path`
 * (check-doc-authority.sh line 15: `cat | jq -r '.tool_input.file_path // ""'`)
 *
 * cwd is set to REPO_ROOT so that `tsx "$BIN" "$REL_PATH"` invoked inside
 * the hook inherits a process.cwd() matching REPO_ROOT — the bin.ts resolves
 * file paths relative to process.cwd() (09-doc-authority-hierarchy.ts line 168:
 * `repoRoot: string = process.cwd()`). Without cwd override, the test runner's
 * cwd (packages/core/) is inherited → bin cannot find REPO_ROOT-relative files.
 */
function runHook(absPath: string): { status: number; stderr: string } {
  const r = spawnSync('bash', [HOOK], {
    input: JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: absPath } }),
    encoding: 'utf8',
    cwd: REPO_ROOT,
  });
  return { status: r.status ?? -1, stderr: r.stderr ?? '' };
}

/**
 * Overwrite `relPath` (relative to REPO_ROOT) with `content`.
 * Saves the original content (or null if file did not exist) so afterEach
 * can restore it. Returns the absolute path.
 *
 * Use this for paths that ARE in REQUIRED_HEADER_DOCS (e.g. CLAUDE.md),
 * where we need the hook's `selectRequiredPaths` to treat the file as required.
 */
function writeFixtureOverRepoFile(relPath: string, content: string): string {
  const abs = resolve(REPO_ROOT, relPath);
  if (!originalContents.has(abs)) {
    const prior = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
    originalContents.set(abs, prior);
  }
  writeFileSync(abs, content, 'utf8');
  return abs;
}

/**
 * Create a FRESH file at `REPO_ROOT/<relPath>` — does NOT exist beforehand.
 * Tracked in tmpPaths for rm in afterEach.
 * Use this for paths NOT in REQUIRED_HEADER_DOCS (off-path tests).
 */
function writeFreshRepoFile(relPath: string, content: string): string {
  const abs = resolve(REPO_ROOT, relPath);
  const dir = dirname(abs);
  mkdirSync(dir, { recursive: true });
  writeFileSync(abs, content, 'utf8');
  tmpPaths.push(abs);
  return abs;
}

/**
 * REQUIRED_HEADER_DOCS target for the ❌/✅ paired tests.
 * Must be a path that: (a) is in REQUIRED_HEADER_DOCS, (b) exists on disk.
 * Using '.claude/rules/doc-authority-hierarchy.md' — always present in the
 * repo root (created at Wave 7 before this worktree's base commit).
 * (09-doc-authority-hierarchy.ts line 38: '.claude/rules/doc-authority-hierarchy.md')
 */
const FIXTURE_REQUIRED_DOC = '.claude/rules/doc-authority-hierarchy.md';

/** Minimal content that satisfies AUTHORITY_HEADER_RE (09-doc-authority-hierarchy.ts line 14) */
const VALID_HEADER = `# Test fixture

> **Authoritative for:** test purposes only.
> **NOT authoritative for:** production use.

Some body text.
`;

/** Content WITHOUT the required blockquote marker */
const MISSING_HEADER = `# Test fixture

Some body text with no authority header.
`;

describe.skipIf(!JQ || !TSX)('check-doc-authority.sh — PostToolUse authority header gate', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // PAIRED-NEGATIVE: the core contract
  // ──────────────────────────────────────────────────────────────────────────

  it('PAIRED-NEGATIVE: REQUIRED_HEADER_DOC written WITHOUT `> **Authoritative for:**` → exit 1 + diagnostic', () => {
    // check-doc-authority.sh line 29: `"$TSX" "$BIN" "$REL_PATH"` — delegates to bin
    // 09-doc-authority-hierarchy.bin.ts line 36-41: exits 1 when violations found
    // 09-doc-authority-hierarchy.ts line 14: AUTHORITY_HEADER_RE = /^> \*\*Authoritative for:\*\*/m
    const abs = writeFixtureOverRepoFile(FIXTURE_REQUIRED_DOC, MISSING_HEADER);
    const { status, stderr } = runHook(abs);
    expect(status).toBe(1);
    // 09-doc-authority-hierarchy.bin.ts line 40: `process.stderr.write(\`FAIL  ${v.path}: ${v.reason}\n\`)`
    expect(stderr).toMatch(/FAIL/);
    expect(stderr).toMatch(/missing.*Authoritative for/i);
  });

  it('PAIRED-POSITIVE: same REQUIRED_HEADER_DOC WITH `> **Authoritative for:**` → exit 0', () => {
    // check-doc-authority.sh line 29: delegates to tsx "$BIN" "$REL_PATH"
    // 09-doc-authority-hierarchy.ts line 145: hasAuthorityHeader returns true
    // 09-doc-authority-hierarchy.bin.ts line 44-46: exits 0 with OK message on stdout
    const abs = writeFixtureOverRepoFile(FIXTURE_REQUIRED_DOC, VALID_HEADER);
    const { status } = runHook(abs);
    expect(status).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // OFF-PATH skips
  // ──────────────────────────────────────────────────────────────────────────

  it('off-path: a non-REQUIRED file inside repo → exit 0', () => {
    // check-doc-authority.sh line 19: REL_PATH = strip REPO_ROOT prefix
    // 09-doc-authority-hierarchy.ts line 132-135: selectRequiredPaths returns [] for non-required paths
    // empty filtered list → 09-doc-authority-hierarchy.bin.ts line 32: process.exit(0) silently
    const tmpName = `test-tmp-check-doc-${Date.now()}.ts`;
    const abs = writeFreshRepoFile(`packages/core/${tmpName}`, '// no authority header\n');
    const { status } = runHook(abs);
    expect(status).toBe(0);
  });

  it('off-path: a path outside repo entirely → exit 0', () => {
    // check-doc-authority.sh line 20: `[[ "$REL_PATH" = "$ABS_PATH" ]] && exit 0`
    // When the absolute path has no REPO_ROOT prefix, the bash strip is a no-op
    // so REL_PATH == ABS_PATH → early exit 0 before even reaching the bin
    const tmpDir = mkdtempSync(join(tmpdir(), 'check-doc-auth-offpath-'));
    tmpPaths.push(tmpDir);
    const abs = join(tmpDir, 'CLAUDE.md'); // named like a required doc, but outside repo
    writeFileSync(abs, MISSING_HEADER, 'utf8');
    const { status } = runHook(abs);
    expect(status).toBe(0);
  });

  it('off-path: empty stdin file_path → exit 0', () => {
    // check-doc-authority.sh line 16: `[[ -z "$ABS_PATH" ]] && exit 0`
    // jq -r '.tool_input.file_path // ""' on a payload without file_path key returns ""
    const r = spawnSync('bash', [HOOK], {
      input: JSON.stringify({ tool_name: 'Edit', tool_input: {} }),
      encoding: 'utf8',
      cwd: REPO_ROOT,
    });
    expect(r.status).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Boundary: mid-prose mention does NOT satisfy the blockquote regex
  // ──────────────────────────────────────────────────────────────────────────

  it('boundary: `Authoritative for:` in mid-prose (no blockquote) → exit 1', () => {
    // 09-doc-authority-hierarchy.ts line 14: AUTHORITY_HEADER_RE = /^> \*\*Authoritative for:\*\*/m
    // Only `> **Authoritative for:**` at line-start (after `>`) matches.
    // Plain prose "Authoritative for:" does NOT match → FAIL
    const content =
      '# Test fixture\n\nThis doc is authoritative for certain things but lacks the blockquote form.\n';
    const abs = writeFixtureOverRepoFile(FIXTURE_REQUIRED_DOC, content);
    const { status, stderr } = runHook(abs);
    expect(status).toBe(1);
    expect(stderr).toMatch(/FAIL/);
  });

  it('boundary: `Authoritative for:` inside a fenced code block → exit 1 (stripped)', () => {
    // 09-doc-authority-hierarchy.ts line 141-143: stripFencedCodeBlocks() removes ``` blocks
    // before AUTHORITY_HEADER_RE is tested. Content inside ``` does not satisfy the check.
    const content = [
      '# Test fixture',
      '',
      'Some prose.',
      '',
      '```markdown',
      '> **Authoritative for:** inside a code block — stripped out',
      '```',
      '',
    ].join('\n');
    const abs = writeFixtureOverRepoFile(FIXTURE_REQUIRED_DOC, content);
    const { status, stderr } = runHook(abs);
    expect(status).toBe(1);
    expect(stderr).toMatch(/FAIL/);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Sanity: our fixture doc IS in REQUIRED_HEADER_DOCS
  // ──────────────────────────────────────────────────────────────────────────

  it('sanity: FIXTURE_REQUIRED_DOC is actually in REQUIRED_HEADER_DOCS', () => {
    // T3: verify our fixture choice against the canonical list
    // (09-doc-authority-hierarchy.ts line 38: '.claude/rules/doc-authority-hierarchy.md')
    expect(REQUIRED_HEADER_DOCS).toContain(FIXTURE_REQUIRED_DOC);
  });
});
