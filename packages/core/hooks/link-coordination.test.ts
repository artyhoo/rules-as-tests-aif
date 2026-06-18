/**
 * Tests for scripts/link-coordination.sh — cross-worktree symlink-to-canonical
 * coordination doc sync (SSOT #110).
 *
 * Decision origin: research-patch 2026-05-17-cross-worktree-coord-doc-sync.md §5
 * Granularity: OPTION (i) — per-file symlinks only. Umbrella dirs stay real;
 *   symlinks only created for gitignored per-file content (not done.md/README.md).
 *
 * Tests:
 *   (a) SYMLINK: kickoff.md is a symlink into $CANON after helper runs
 *   (b) GIT-CLEAN: tracked README.md and done.md stay real — no phantom deletes
 *   (c) CONFLICT: pre-existing real file in both worktree and CANON → exit 1, no clobber
 *   (d) WRITE-BACK: edit through symlink is visible in CANON and a second linked worktree
 *   (e) PAIRED-NEGATIVE: stripped helper (LINK step removed) leaves kickoff NOT a symlink
 *   (f) SEED: seed-source seeds $CANON when empty
 *
 * ALL tests set CLAUDE_COORDINATION_DIR to a temp dir — never touches real $HOME.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HELPER = resolve(REPO_ROOT, 'scripts/link-coordination.sh');

// ── Availability checks ──────────────────────────────────────────────────────

function hasRsync(): boolean {
  try {
    execSync('command -v rsync', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const RSYNC = hasRsync();

// ── Helpers ──────────────────────────────────────────────────────────────────

interface RunResult {
  stdout: string;
  stderr: string;
  status: number;
}

function runHelper(
  args: string[],
  env: Record<string, string> = {},
): RunResult {
  try {
    const stdout = execFileSync('bash', [HELPER, ...args], {
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });
    return { stdout: stdout.toString().trim(), stderr: '', status: 0 };
  } catch (e) {
    const err = e as { stdout?: Buffer | string; stderr?: Buffer | string; status?: number };
    return {
      stdout: (err.stdout?.toString() ?? '').trim(),
      stderr: (err.stderr?.toString() ?? '').trim(),
      status: err.status ?? 1,
    };
  }
}

/**
 * Create a minimal git repo with:
 *   - tracked README.md (root)
 *   - .gitignore mirroring production:
 *       .claude/orchestrator-prompts/* ignored
 *       README.md and done.md tracked per umbrella
 *   - umbrella subdir with tracked done.md and gitignored kickoff.md
 */
function setupRepo(name: string): string {
  const dir = mkdtempSync(resolve(tmpdir(), `link-coord-${name}-`));
  execSync('git init -q -b main', { cwd: dir });
  execSync('git config user.email test@example.com', { cwd: dir });
  execSync('git config user.name test', { cwd: dir });
  writeFileSync(resolve(dir, 'README.md'), 'test\n');

  mkdirSync(resolve(dir, 'packages/core'), { recursive: true });
  writeFileSync(resolve(dir, 'packages/core/.keep'), '');

  const gitignore = [
    'node_modules',
    '.claude/orchestrator-prompts/*',
    '!.claude/orchestrator-prompts/README.md',
    '!.claude/orchestrator-prompts/*/',
    '.claude/orchestrator-prompts/*/*',
    '!.claude/orchestrator-prompts/*/done.md',
  ].join('\n');
  writeFileSync(resolve(dir, '.gitignore'), gitignore + '\n');

  mkdirSync(resolve(dir, '.claude/orchestrator-prompts/my-umbrella'), { recursive: true });
  writeFileSync(resolve(dir, '.claude/orchestrator-prompts/README.md'), '# OPs\n');
  writeFileSync(
    resolve(dir, '.claude/orchestrator-prompts/my-umbrella/done.md'),
    'done-from-primary\n',
  );

  execSync('git add . && git commit -q -m init', { cwd: dir });

  // Add gitignored kickoff (not committed)
  writeFileSync(
    resolve(dir, '.claude/orchestrator-prompts/my-umbrella/kickoff.md'),
    '# my-umbrella kickoff\nOriginal content.\n',
  );

  return dir;
}

/** Create a fake worktree dir (no git worktree mechanics — just the directory structure). */
function setupWorktreeDir(primaryRepo: string, name: string): string {
  const wt = resolve(primaryRepo, `.claude/worktrees/${name}`);
  mkdirSync(resolve(wt, '.claude/orchestrator-prompts/my-umbrella'), { recursive: true });
  // Write tracked done.md (real file, not symlink)
  writeFileSync(
    resolve(wt, '.claude/orchestrator-prompts/my-umbrella/done.md'),
    'done-from-worktree\n',
  );
  // Write tracked README.md (real file)
  writeFileSync(resolve(wt, '.claude/orchestrator-prompts/README.md'), '# OPs\n');
  return wt;
}

function teardown(...dirs: string[]): void {
  for (const d of dirs) {
    try { rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('link-coordination.sh', () => {
  let canon: string;
  let primaryRepo: string;

  beforeEach(() => {
    canon = mkdtempSync(resolve(tmpdir(), 'link-coord-canon-'));
    primaryRepo = setupRepo('primary');
  });

  afterEach(() => {
    teardown(canon, primaryRepo);
  });

  // ── (a) SYMLINK ────────────────────────────────────────────────────────────

  it('(a) SYMLINK: state.md is a symlink pointing into $CANON after helper runs', () => {
    // SSOT #116: kickoff.md became a tracked durable doc (helper skips */kickoff.md);
    // state.md is the per-umbrella gitignored regenerable runtime the helper manages.
    // Pre-populate $CANON with the umbrella + state
    mkdirSync(resolve(canon, 'my-umbrella'), { recursive: true });
    writeFileSync(
      resolve(canon, 'my-umbrella/state.md'),
      '# my-umbrella state\nCanonical content.\n',
    );

    const wt = setupWorktreeDir(primaryRepo, 'lnk-a');

    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);

    const statePath = resolve(wt, '.claude/orchestrator-prompts/my-umbrella/state.md');
    expect(existsSync(statePath), 'state.md must exist').toBe(true);

    const stat = lstatSync(statePath);
    expect(stat.isSymbolicLink(), 'state.md must be a symlink').toBe(true);

    const content = readFileSync(statePath, 'utf8');
    expect(content).toContain('Canonical content');
  });

  // ── (b) GIT-CLEAN ─────────────────────────────────────────────────────────

  it('(b) GIT-CLEAN: tracked README.md and done.md stay as real files after linking', () => {
    // Pre-populate $CANON
    mkdirSync(resolve(canon, 'my-umbrella'), { recursive: true });
    writeFileSync(
      resolve(canon, 'my-umbrella/kickoff.md'),
      '# kickoff\n',
    );

    const wt = setupWorktreeDir(primaryRepo, 'lnk-b');

    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);

    const readmePath = resolve(wt, '.claude/orchestrator-prompts/README.md');
    const donePath = resolve(wt, '.claude/orchestrator-prompts/my-umbrella/done.md');

    // Both must exist as REAL files (not symlinks)
    expect(existsSync(readmePath), 'README.md must exist').toBe(true);
    expect(lstatSync(readmePath).isSymbolicLink(), 'README.md must NOT be a symlink').toBe(false);

    expect(existsSync(donePath), 'done.md must exist').toBe(true);
    expect(lstatSync(donePath).isSymbolicLink(), 'done.md must NOT be a symlink').toBe(false);

    // Content of done.md stays as worktree version
    const doneContent = readFileSync(donePath, 'utf8');
    expect(doneContent).toBe('done-from-worktree\n');
  });

  // ── (c) CONFLICT ──────────────────────────────────────────────────────────

  it('(c) CONFLICT: real file in both worktree and CANON → exit 1, content unchanged', () => {
    // Managed-file fixture is state.md (SSOT #116: kickoff.md is tracked, skipped).
    // Pre-populate $CANON with its version
    mkdirSync(resolve(canon, 'my-umbrella'), { recursive: true });
    writeFileSync(
      resolve(canon, 'my-umbrella/state.md'),
      '# canon version\n',
    );

    const wt = setupWorktreeDir(primaryRepo, 'lnk-c');
    // Also plant a REAL state.md in the worktree (not a symlink)
    writeFileSync(
      resolve(wt, '.claude/orchestrator-prompts/my-umbrella/state.md'),
      '# worktree version\n',
    );

    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, 'helper must exit 1 on conflict').toBe(1);
    expect(r.stderr).toContain('CONFLICT');

    // Neither file changed
    const canonContent = readFileSync(resolve(canon, 'my-umbrella/state.md'), 'utf8');
    expect(canonContent).toBe('# canon version\n');

    const wtContent = readFileSync(
      resolve(wt, '.claude/orchestrator-prompts/my-umbrella/state.md'),
      'utf8',
    );
    expect(wtContent).toBe('# worktree version\n');
  });

  // ── (d) WRITE-BACK ────────────────────────────────────────────────────────

  it('(d) WRITE-BACK: edit via symlink is visible in $CANON and a second linked worktree', () => {
    // Managed-file fixture is state.md (SSOT #116: kickoff.md is tracked, skipped).
    // Pre-populate $CANON
    mkdirSync(resolve(canon, 'my-umbrella'), { recursive: true });
    writeFileSync(
      resolve(canon, 'my-umbrella/state.md'),
      '# original\n',
    );

    const wt1 = setupWorktreeDir(primaryRepo, 'lnk-d1');
    const wt2 = setupWorktreeDir(primaryRepo, 'lnk-d2');

    const r1 = runHelper([wt1], { CLAUDE_COORDINATION_DIR: canon });
    expect(r1.status, `wt1 stderr: ${r1.stderr}`).toBe(0);

    const r2 = runHelper([wt2], { CLAUDE_COORDINATION_DIR: canon });
    expect(r2.status, `wt2 stderr: ${r2.stderr}`).toBe(0);

    // Write new content through wt1's symlink
    const stateViaWt1 = resolve(wt1, '.claude/orchestrator-prompts/my-umbrella/state.md');
    writeFileSync(stateViaWt1, '# updated content\n');

    // Visible in $CANON
    const canonContent = readFileSync(resolve(canon, 'my-umbrella/state.md'), 'utf8');
    expect(canonContent).toBe('# updated content\n');

    // Visible in wt2 (same inode via symlink)
    const stateViaWt2 = resolve(wt2, '.claude/orchestrator-prompts/my-umbrella/state.md');
    const wt2Content = readFileSync(stateViaWt2, 'utf8');
    expect(wt2Content).toBe('# updated content\n');

    teardown(wt1, wt2);
  });

  // ── (e) PAIRED-NEGATIVE ──────────────────────────────────────────────────

  it('(e) PAIRED-NEGATIVE: stripped helper (LINK step removed) leaves state NOT a symlink', () => {
    // Managed-file fixture is state.md (SSOT #116: kickoff.md is tracked, skipped).
    // Pre-populate $CANON
    mkdirSync(resolve(canon, 'my-umbrella'), { recursive: true });
    writeFileSync(
      resolve(canon, 'my-umbrella/state.md'),
      '# canonical\n',
    );

    const wt = setupWorktreeDir(primaryRepo, 'lnk-e');

    // Strip the LINK step (the "for each file in CANON" loop that creates symlinks)
    const src = readFileSync(HELPER, 'utf8');
    // Remove the block between "# ── LINK" comment and the final exit lines
    const stripped = src.replace(
      /# ── LINK[\s\S]*?# ── EXIT/,
      '# ── EXIT',
    );

    const tmpHelper = resolve(tmpdir(), 'link-coordination-stripped.sh');
    writeFileSync(tmpHelper, stripped, { mode: 0o755 });

    try {
      execFileSync('bash', [tmpHelper, wt], {
        encoding: 'utf8',
        env: { ...process.env, CLAUDE_COORDINATION_DIR: canon },
      });
    } catch {
      // May fail or succeed — we only care about the symlink state
    }

    const statePath = resolve(wt, '.claude/orchestrator-prompts/my-umbrella/state.md');
    // Either absent or a real file — NOT a symlink
    if (existsSync(statePath)) {
      expect(
        lstatSync(statePath).isSymbolicLink(),
        'stripped helper must NOT create a symlink',
      ).toBe(false);
    }
    // (If absent, the test passes trivially — stripped helper didn't link anything)

    try { rmSync(tmpHelper); } catch { /* ignore */ }
    teardown(wt);
  });

  // ── (f) ADOPT-THEN-LINK: orphan real file in worktree gets moved to $CANON ──

  it('(f) ADOPT: real gitignored file in worktree with no CANON equivalent is adopted (mv to CANON, then linked)', () => {
    // Managed-file fixture is state.md (SSOT #116: kickoff.md is tracked, skipped).
    // $CANON has NO my-umbrella yet
    const wt = setupWorktreeDir(primaryRepo, 'lnk-f');
    // Place a real state.md in the worktree (not a symlink, not in CANON)
    writeFileSync(
      resolve(wt, '.claude/orchestrator-prompts/my-umbrella/state.md'),
      '# adopt-me\n',
    );

    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);

    // After adoption: worktree path is now a symlink
    const statePath = resolve(wt, '.claude/orchestrator-prompts/my-umbrella/state.md');
    expect(existsSync(statePath)).toBe(true);
    expect(lstatSync(statePath).isSymbolicLink(), 'state must be symlink after adoption').toBe(true);

    // Content is in $CANON
    const canonContent = readFileSync(resolve(canon, 'my-umbrella/state.md'), 'utf8');
    expect(canonContent).toBe('# adopt-me\n');

    teardown(wt);
  });

  // ── (g) SEED ─────────────────────────────────────────────────────────────

  describe.skipIf(!RSYNC)('(g) SEED (requires rsync)', () => {
    it('SEED: when $CANON is empty and seed-source provided, seeds from primary checkout', () => {
      // $CANON is empty (already created in beforeEach)
      // primaryRepo has my-umbrella/kickoff.md as a real file

      const wt = setupWorktreeDir(primaryRepo, 'lnk-g');

      // Run helper with seed-source = primaryRepo
      const r = runHelper([wt, primaryRepo], { CLAUDE_COORDINATION_DIR: canon });
      expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);

      // $CANON should now have the seeded kickoff
      const canonKickoff = resolve(canon, 'my-umbrella/kickoff.md');
      expect(existsSync(canonKickoff), '$CANON/my-umbrella/kickoff.md seeded').toBe(true);

      // done.md should NOT be seeded (it's tracked — excluded via --exclude='done.md')
      const canonDone = resolve(canon, 'my-umbrella/done.md');
      expect(existsSync(canonDone), 'done.md must NOT be seeded into $CANON').toBe(false);

      teardown(wt);
    });
  });

  // ── (h) ON-CONFLICT flag (Task A1) ─────────────────────────────────────────

  it('on-conflict=canon: canonical wins, worktree file relinked', () => {
    mkdirSync(resolve(canon, 'u1'), { recursive: true });
    writeFileSync(resolve(canon, 'u1/state.md'), 'CANON');
    const wt = setupWorktreeDir(primaryRepo, 'lnk-oc-canon');
    mkdirSync(resolve(wt, '.claude/orchestrator-prompts/u1'), { recursive: true });
    writeFileSync(resolve(wt, '.claude/orchestrator-prompts/u1/state.md'), 'WORKTREE');
    const r = runHelper([wt, '', '--on-conflict=canon'], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);
    const p = resolve(wt, '.claude/orchestrator-prompts/u1/state.md');
    expect(lstatSync(p).isSymbolicLink()).toBe(true);
    expect(readFileSync(p, 'utf8')).toBe('CANON');
    teardown(wt);
  });

  it('on-conflict=worktree: worktree wins, adopted into CANON', () => {
    mkdirSync(resolve(canon, 'u1'), { recursive: true });
    writeFileSync(resolve(canon, 'u1/state.md'), 'CANON');
    const wt = setupWorktreeDir(primaryRepo, 'lnk-oc-worktree');
    mkdirSync(resolve(wt, '.claude/orchestrator-prompts/u1'), { recursive: true });
    writeFileSync(resolve(wt, '.claude/orchestrator-prompts/u1/state.md'), 'WORKTREE');
    const r = runHelper([wt, '', '--on-conflict=worktree'], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);
    const p = resolve(wt, '.claude/orchestrator-prompts/u1/state.md');
    expect(lstatSync(p).isSymbolicLink()).toBe(true);
    expect(readFileSync(resolve(canon, 'u1/state.md'), 'utf8')).toBe('WORKTREE');
    teardown(wt);
  });

  it('on-conflict=skip (default): exits 1, leaves both files intact', () => {
    mkdirSync(resolve(canon, 'u1'), { recursive: true });
    writeFileSync(resolve(canon, 'u1/state.md'), 'CANON');
    const wt = setupWorktreeDir(primaryRepo, 'lnk-oc-skip');
    mkdirSync(resolve(wt, '.claude/orchestrator-prompts/u1'), { recursive: true });
    writeFileSync(resolve(wt, '.claude/orchestrator-prompts/u1/state.md'), 'WORKTREE');
    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status).toBe(1);
    expect(
      readFileSync(resolve(wt, '.claude/orchestrator-prompts/u1/state.md'), 'utf8'),
    ).toBe('WORKTREE');
    expect(readFileSync(resolve(canon, 'u1/state.md'), 'utf8')).toBe('CANON');
    teardown(wt);
  });

  it('on-conflict=bogus: exits 2 (validation)', () => {
    const wt = setupWorktreeDir(primaryRepo, 'lnk-oc-bogus');
    const r = runHelper([wt, '', '--on-conflict=bogus'], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status).toBe(2);
    teardown(wt);
  });

  // ── (i) ROOT-FILE loop (Task A2) ───────────────────────────────────────────

  it('root-file loop: _plan-cache.md adopted into CANON root and symlinked back', () => {
    const wt = setupWorktreeDir(primaryRepo, 'lnk-root-cache');
    const wtPrompts = resolve(wt, '.claude/orchestrator-prompts');
    writeFileSync(resolve(wtPrompts, '_plan-cache.md'), 'CACHE-v1');
    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);
    const p = resolve(wtPrompts, '_plan-cache.md');
    expect(lstatSync(p).isSymbolicLink()).toBe(true);
    expect(readFileSync(resolve(canon, '_plan-cache.md'), 'utf8')).toBe('CACHE-v1');
    teardown(wt);
  });

  it('root-file loop: _master-backlog-delta.json linked from CANON into a fresh worktree', () => {
    writeFileSync(resolve(canon, '_master-backlog-delta.json'), '{"untracked_seen":[]}');
    const wt = setupWorktreeDir(primaryRepo, 'lnk-root-delta');
    const wtPrompts = resolve(wt, '.claude/orchestrator-prompts');
    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);
    expect(
      lstatSync(resolve(wtPrompts, '_master-backlog-delta.json')).isSymbolicLink(),
    ).toBe(true);
    teardown(wt);
  });

  it('root-file loop: root README.md stays a real file (tracked-skip)', () => {
    const wt = setupWorktreeDir(primaryRepo, 'lnk-root-readme');
    const wtPrompts = resolve(wt, '.claude/orchestrator-prompts');
    writeFileSync(resolve(wtPrompts, 'README.md'), 'TRACKED');
    const r = runHelper([wt], { CLAUDE_COORDINATION_DIR: canon });
    expect(r.status, `helper stderr: ${r.stderr}`).toBe(0);
    expect(lstatSync(resolve(wtPrompts, 'README.md')).isSymbolicLink()).toBe(false);
    teardown(wt);
  });
});
