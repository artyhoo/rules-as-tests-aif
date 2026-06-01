/**
 * Functional tests for the UserPromptSubmit hook
 * (.claude/hooks/deps-hash-check.sh) — D7=a (Wave 5.3).
 *
 * Hook contract (.claude/hooks/deps-hash-check.sh):
 *   - UserPromptSubmit: fires on every user prompt in the consumer's working dir.
 *   - Does NOT read stdin for path filtering (unlike PostToolUse hooks).
 *   - Reads .ai-factory/tool-decisions.md for stored "deps-hash:" frontmatter value.
 *   - Recomputes sha256 of merged dependencies+devDependencies from package.json.
 *   - On mismatch → prints warning line to stdout (line 41).
 *   - ALWAYS exits 0 — non-blocking, context injection only (line 44).
 *
 * Paired-negative contract:
 *   ❌ deps-hash present but stale (current ≠ stored) → warning printed to stdout
 *   ✅ deps-hash present and matching (current = stored) → silent, no stdout
 *   ✅ no .ai-factory/tool-decisions.md → silent exit 0
 *   ✅ tool-decisions.md exists but no deps-hash: line → silent exit 0
 *   ✅ no package.json → silent exit 0
 *   ✅ package.json has no dependencies or devDependencies → no warning if hash matches
 *
 * Pattern: check-hook-marker.test.ts (vitest + spawnSync + mkdtempSync on-disk fixtures).
 * Reference: packages/core/hooks/check-hook-marker.test.ts:19-64
 */
// @ts-nocheck

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HOOK = resolve(REPO_ROOT, '.claude/hooks/deps-hash-check.sh');

/** Compute the same sha256 the hook computes for a given deps JSON string. */
function computeHash(depsJson: string): string {
  const hash = crypto.createHash('sha256').update(depsJson).digest('hex');
  return `sha256-${hash}`;
}

/** Build the deps JSON in the same way node -e does in the hook (line 26-29). */
function buildDepsJson(pkg: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): string {
  return JSON.stringify({
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  });
}

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** Create a temp dir with optional fixtures. Returns the temp dir path. */
function makeFixtureDir(opts: {
  packageJson?: object;
  toolDecisions?: string; // full file content; null = don't create
} = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'deps-hash-test-'));
  tmpDirs.push(dir);

  if (opts.packageJson !== undefined) {
    writeFileSync(join(dir, 'package.json'), JSON.stringify(opts.packageJson), 'utf8');
  }

  if (opts.toolDecisions !== undefined) {
    const aiDir = join(dir, '.ai-factory');
    mkdirSync(aiDir, { recursive: true });
    writeFileSync(join(aiDir, 'tool-decisions.md'), opts.toolDecisions, 'utf8');
  }

  return dir;
}

/** Run the hook with cwd set to the fixture dir. Returns { status, stdout, stderr }. */
function runHook(cwd: string): { status: number; stdout: string; stderr: string } {
  const r = spawnSync('bash', [HOOK], {
    cwd,
    encoding: 'utf8',
    // Hook is UserPromptSubmit — does not read stdin for dispatch logic.
    // Provide empty object as stdin to match CC harness pattern.
    input: JSON.stringify({}),
  });
  return {
    status: r.status ?? -1,
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
  };
}

describe('deps-hash-check.sh — UserPromptSubmit deps-drift context injector', () => {
  // ---------------------------------------------------------------------------
  // PAIRED-NEGATIVE: the one case that should produce output
  // ---------------------------------------------------------------------------

  it('PAIRED-NEGATIVE: stale stored hash → warning printed to stdout, exit 0', () => {
    // Hook line 40-42: if CURRENT_HASH != STORED_HASH → printf warning.
    // Hook line 44: always exit 0.
    const pkg = { dependencies: { react: '^18.0.0' }, devDependencies: { vitest: '^4.0.0' } };
    const depsJson = buildDepsJson(pkg);
    const correctHash = computeHash(depsJson);
    // Deliberately store a wrong hash so the hook sees a mismatch.
    const staleHash = correctHash.replace(/[a-f]/, '0');

    const cwd = makeFixtureDir({
      packageJson: pkg,
      toolDecisions: `---\ndeps-hash: ${staleHash}\n---\n# tool decisions\n`,
    });

    const { status, stdout } = runHook(cwd);

    // Hook always exits 0 (line 44) — diagnostic only, never a gate.
    expect(status).toBe(0);
    // Warning MUST be present when hash is stale (line 41).
    expect(stdout).toContain('⚠');
    expect(stdout).toContain('package.json deps changed since last tool-bootstrap');
    expect(stdout).toContain('/tool-bootstrapping');
  });

  // ---------------------------------------------------------------------------
  // PAIRED-POSITIVE: clean states — must be silent
  // ---------------------------------------------------------------------------

  it('PAIRED-POSITIVE: matching stored hash → no stdout, exit 0', () => {
    // Hook lines 40-42: only prints if CURRENT_HASH != STORED_HASH.
    const pkg = { dependencies: { react: '^18.0.0' }, devDependencies: { vitest: '^4.0.0' } };
    const depsJson = buildDepsJson(pkg);
    const correctHash = computeHash(depsJson);

    const cwd = makeFixtureDir({
      packageJson: pkg,
      toolDecisions: `---\ndeps-hash: ${correctHash}\n---\n# tool decisions\n`,
    });

    const { status, stdout } = runHook(cwd);

    expect(status).toBe(0);
    // Silent on match — no warning injected into context.
    expect(stdout).toBe('');
  });

  it('SKIP: no .ai-factory/tool-decisions.md → silent exit 0', () => {
    // Hook line 16: [ -f "$DECISIONS" ] || exit 0
    const cwd = makeFixtureDir({
      packageJson: { dependencies: { react: '^18.0.0' } },
      // No toolDecisions → file not created.
    });

    const { status, stdout } = runHook(cwd);

    expect(status).toBe(0);
    expect(stdout).toBe('');
  });

  it('SKIP: tool-decisions.md exists but has no deps-hash: line → silent exit 0', () => {
    // Hook lines 19-20: STORED_HASH empty → exit 0.
    const cwd = makeFixtureDir({
      packageJson: { dependencies: { react: '^18.0.0' } },
      toolDecisions: `---\ntool-decisions: something\n---\n# no deps-hash here\n`,
    });

    const { status, stdout } = runHook(cwd);

    expect(status).toBe(0);
    expect(stdout).toBe('');
  });

  it('SKIP: no package.json → silent exit 0', () => {
    // Hook line 23: [ -f package.json ] || exit 0
    const cwd = makeFixtureDir({
      // No packageJson → file not created.
      toolDecisions: `---\ndeps-hash: sha256-deadbeef\n---\n`,
    });

    const { status, stdout } = runHook(cwd);

    expect(status).toBe(0);
    expect(stdout).toBe('');
  });

  it('BOUNDARY: empty deps object ({} + {}) → hash computed; matching stored hash → silent', () => {
    // Edge case: package.json with neither dependencies nor devDependencies.
    // buildDepsJson({}) → "{}", sha256 deterministic.
    // Cast to the deps-only type: name/version are valid package.json fields but
    // not part of the deps-extraction contract — the hook spreads only dep keys.
    const pkg = { name: 'test', version: '1.0.0' } as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const depsJson = buildDepsJson(pkg);
    const correctHash = computeHash(depsJson);

    const cwd = makeFixtureDir({
      packageJson: pkg,
      toolDecisions: `---\ndeps-hash: ${correctHash}\n---\n`,
    });

    const { status, stdout } = runHook(cwd);

    expect(status).toBe(0);
    expect(stdout).toBe('');
  });

  it('BOUNDARY: deps-hash: line has extra whitespace → still parsed correctly', () => {
    // Hook line 19: grep -m1 "^deps-hash:" | sed strip leading spaces.
    // Verify the sed pattern handles extra spaces after the colon.
    const pkg = { dependencies: { lodash: '^4.0.0' } };
    const depsJson = buildDepsJson(pkg);
    const correctHash = computeHash(depsJson);

    const cwd = makeFixtureDir({
      packageJson: pkg,
      toolDecisions: `---\ndeps-hash:   ${correctHash}\n---\n`,
    });

    const { status, stdout } = runHook(cwd);

    // Should parse the hash correctly and NOT emit a warning (they match).
    expect(status).toBe(0);
    expect(stdout).toBe('');
  });
});
