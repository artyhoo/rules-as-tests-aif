/**
 * Functional meta-tests for the WorktreeCreate hook
 * (.claude/hooks/worktree-setup.sh) — the Class-B compensating mechanism
 * for the D2 candidate in `dispatch-worktree-automation` R-phase.
 *
 * Asserts the CC WorktreeCreate command-hook contract verified 2026-05-29 via
 * live `--settings` schema probe + code.claude.com/docs/en/hooks:
 *   - stdin  : JSON {session_id, transcript_path, cwd, hook_event_name, name}
 *   - stdout : the worktree absolute path (ONLY thing on stdout)
 *   - exit 0 = success ; non-zero = CC reports creation failure (CAN BLOCK)
 *
 * Tests run against a per-test temporary git repo (mktemp + git init) so they
 * neither touch the real repo nor depend on origin/HEAD. Paired-negative
 * scenarios assert the failure modes the hook is paid to detect (missing
 * `.name`, unresolvable project root) — the principle-02 discipline applied to
 * a bash hook artefact.
 *
 * Skips gracefully when `jq` is unavailable (the hook itself exits 1 when jq
 * is absent — exercising only the jq-missing path would yield no signal).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HOOK = resolve(REPO_ROOT, '.claude/hooks/worktree-setup.sh');

function hasJq(): boolean {
  try {
    execSync('command -v jq', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const JQ = hasJq();

interface Result {
  stdout: string;
  stderr: string;
  status: number;
}

function runHook(
  input: Record<string, unknown>,
  env: Record<string, string> = {},
): Result {
  try {
    const stdout = execFileSync('bash', [HOOK], {
      input: JSON.stringify(input),
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

function setupTempRepo(): string {
  const dir = mkdtempSync(resolve(tmpdir(), 'wtc-test-'));
  execSync('git init -q -b main', { cwd: dir });
  execSync('git config user.email test@example.com', { cwd: dir });
  execSync('git config user.name test', { cwd: dir });
  writeFileSync(resolve(dir, 'README.md'), 'test repo\n');
  // Track packages/core/ so the worktree checkout creates the directory —
  // matches production layout where the dir always exists in HEAD.
  mkdirSync(resolve(dir, 'packages/core'), { recursive: true });
  writeFileSync(resolve(dir, 'packages/core/.keep'), '');
  execSync('git add . && git commit -q -m init', { cwd: dir });
  // Primary node_modules — symlink target.
  mkdirSync(resolve(dir, 'node_modules'), { recursive: true });
  writeFileSync(resolve(dir, 'node_modules/.keep'), '');
  return dir;
}

function teardown(dir: string): void {
  // Remove any sub-worktree before rmSync (git tracks them in .git/worktrees/).
  try {
    const list = execSync(`git -C "${dir}" worktree list --porcelain`, { encoding: 'utf8' });
    for (const line of list.split('\n')) {
      const m = line.match(/^worktree (.+)$/);
      if (m && m[1] !== dir) {
        try {
          execSync(`git -C "${dir}" worktree remove "${m[1]}" --force`, { stdio: 'ignore' });
        } catch {
          /* best-effort */
        }
      }
    }
  } catch {
    /* repo may already be torn down */
  }
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    /* OS will collect /tmp */
  }
}

function payload(name: string, cwd: string, session = 'sess-1'): Record<string, unknown> {
  return {
    session_id: session,
    transcript_path: '/tmp/no-transcript.jsonl',
    cwd,
    hook_event_name: 'WorktreeCreate',
    name,
  };
}

describe.skipIf(!JQ)('worktree-setup.sh — WorktreeCreate hook', () => {
  let repo: string;

  beforeEach(() => {
    repo = setupTempRepo();
  });
  afterEach(() => {
    teardown(repo);
  });

  it('valid stdin → creates worktree, prints absolute path on stdout, exit 0', () => {
    const r = runHook(payload('my-wt', repo), { CLAUDE_PROJECT_DIR: repo });
    expect(r.status).toBe(0);
    const expected = `${repo}/.claude/worktrees/my-wt`;
    expect(r.stdout).toBe(expected);
    expect(existsSync(expected)).toBe(true);
  });

  it('symlinks node_modules from primary checkout (project D2 customisation)', () => {
    const r = runHook(payload('sym-root', repo), { CLAUDE_PROJECT_DIR: repo });
    expect(r.status).toBe(0);
    const wt = `${repo}/.claude/worktrees/sym-root`;
    expect(readlinkSync(`${wt}/node_modules`)).toBe(`${repo}/node_modules`);
  });

  it('symlinks packages/core/node_modules to ../../node_modules (workspace layout)', () => {
    const r = runHook(payload('sym-core', repo), { CLAUDE_PROJECT_DIR: repo });
    expect(r.status).toBe(0);
    const wt = `${repo}/.claude/worktrees/sym-core`;
    expect(readlinkSync(`${wt}/packages/core/node_modules`)).toBe('../../node_modules');
  });

  it('branch name follows CC default convention: worktree-<name>', () => {
    runHook(payload('branch-conv', repo), { CLAUDE_PROJECT_DIR: repo });
    const wtList = execSync(`git -C "${repo}" worktree list --porcelain`, {
      encoding: 'utf8',
    });
    expect(wtList).toContain('branch refs/heads/worktree-branch-conv');
  });

  it('idempotent: re-invoke with same name → reuse (same stdout path, exit 0)', () => {
    const a = runHook(payload('idem', repo), { CLAUDE_PROJECT_DIR: repo });
    const b = runHook(payload('idem', repo), { CLAUDE_PROJECT_DIR: repo });
    expect(a.status).toBe(0);
    expect(b.status).toBe(0);
    expect(b.stdout).toBe(a.stdout);
  });

  it('stdout is a single line (path-only contract — multi-line breaks CC)', () => {
    const r = runHook(payload('one-line', repo), { CLAUDE_PROJECT_DIR: repo });
    expect(r.status).toBe(0);
    expect(r.stdout.split('\n').length).toBe(1);
    expect(r.stdout.startsWith('/')).toBe(true);
  });

  it('CLAUDE_PROJECT_DIR env takes precedence over stdin .cwd', () => {
    const r = runHook(payload('env-precedes', '/nonexistent/bogus-cwd'), {
      CLAUDE_PROJECT_DIR: repo,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe(`${repo}/.claude/worktrees/env-precedes`);
  });

  // ── Paired-negative scenarios: failure modes the hook is paid to detect ──

  it('PAIRED-NEGATIVE: missing .name → exit non-zero, no stdout (creation MUST fail)', () => {
    const r = runHook(
      { session_id: 's', cwd: repo, hook_event_name: 'WorktreeCreate' },
      { CLAUDE_PROJECT_DIR: repo },
    );
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe('');
    expect(r.stderr).toMatch(/missing \.name/);
  });

  it('PAIRED-NEGATIVE: empty .name → exit non-zero (same path as missing)', () => {
    const r = runHook(payload('', repo), { CLAUDE_PROJECT_DIR: repo });
    expect(r.status).not.toBe(0);
    expect(r.stdout).toBe('');
  });

  it('PAIRED-NEGATIVE: unresolvable project root → exit non-zero', () => {
    // No CLAUDE_PROJECT_DIR env, stdin .cwd points nowhere, and we invoke from
    // a directory with no git context.
    const tmp = mkdtempSync(resolve(tmpdir(), 'wtc-norepo-'));
    try {
      const r = (() => {
        try {
          const stdout = execFileSync('bash', [HOOK], {
            input: JSON.stringify(payload('orphan', '/nonexistent')),
            encoding: 'utf8',
            cwd: tmp,
            env: { ...process.env, CLAUDE_PROJECT_DIR: '' },
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
      })();
      expect(r.status).not.toBe(0);
      expect(r.stdout).toBe('');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
