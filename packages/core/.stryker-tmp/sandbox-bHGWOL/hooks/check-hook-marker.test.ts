/**
 * Functional meta-tests for the PostToolUse hook-marker gate
 * (.claude/hooks/check-hook-marker.sh) — Wave N8 C4, edit-time enforcement of
 * dual-implementation-discipline.md §6 (every .claude/hooks/*.sh declares a
 * delivery-channel marker: @dual-pair or @cc-only-rationale).
 *
 * Channel: edit-time PostToolUse — fires when a hook is written, which IS the
 * "at next touch" semantics §9 wants (legacy hooks never flagged unless edited).
 *
 * Paired-negative contract:
 *   ❌ a .claude/hooks/*.sh with NO marker → exit 1 (the silent-CC-lock-in gap)
 *   ✅ @cc-only-rationale present          → exit 0
 *   ✅ @dual-pair present                  → exit 0
 *   ✅ non-hook path / wrong tool          → exit 0 (off-path skip)
 *
 * Spawns the real hook with fixture stdin (the check-kickoff-traps.test.ts
 * precedent). Skips gracefully when `jq` is unavailable.
 */
// @ts-nocheck

import { describe, it, expect, afterEach } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HOOK = resolve(REPO_ROOT, '.claude/hooks/check-hook-marker.sh');

function hasJq(): boolean {
  try {
    execSync('command -v jq', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const JQ = hasJq();

const tmpFiles: string[] = [];
afterEach(() => {
  for (const f of tmpFiles.splice(0)) rmSync(f, { recursive: true, force: true });
});

/**
 * Write `body` to a real `.claude/hooks/<name>.sh` so the hook's path matcher
 * fires against an on-disk file (PostToolUse reads post-edit content). Returns
 * the absolute path; removed in afterEach. Uses a unique name to avoid clobber.
 */
function writeHook(body: string): string {
  const name = `c4-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sh`;
  const abs = resolve(REPO_ROOT, '.claude/hooks', name);
  writeFileSync(abs, body, 'utf8');
  tmpFiles.push(abs);
  return abs;
}

function runHook(tool: string, absPath: string): number {
  const r = spawnSync('bash', [HOOK], {
    input: JSON.stringify({ tool_name: tool, tool_input: { file_path: absPath } }),
    encoding: 'utf8',
  });
  return r.status ?? -1;
}

describe.skipIf(!JQ)('check-hook-marker.sh — PostToolUse delivery-channel marker gate', () => {
  it('PAIRED-NEGATIVE: hook with no marker → exit 1', () => {
    const abs = writeHook('#!/usr/bin/env bash\n# just a comment, no marker\nexit 0\n');
    expect(runHook('Write', abs)).toBe(1);
  });

  it('PAIRED-POSITIVE: @cc-only-rationale present → exit 0', () => {
    const abs = writeHook('#!/usr/bin/env bash\n# @cc-only-rationale: edit-time gate, no portable equivalent\nexit 0\n');
    expect(runHook('Write', abs)).toBe(0);
  });

  it('PAIRED-POSITIVE: @dual-pair present → exit 0', () => {
    const abs = writeHook('#!/usr/bin/env bash\n# @dual-pair: some-anchor-slug\nexit 0\n');
    expect(runHook('Edit', abs)).toBe(0);
  });

  it('marker must be on its own comment line: prose mention in a heredoc does NOT count → exit 1', () => {
    // The string "@cc-only-rationale:" appears, but not as a leading "# " comment line.
    const abs = writeHook('#!/usr/bin/env bash\necho "add a @cc-only-rationale: marker"\nexit 0\n');
    expect(runHook('Write', abs)).toBe(1);
  });

  it('wrong tool (Read) → exit 0 even on a marker-less hook', () => {
    const abs = writeHook('#!/usr/bin/env bash\n# no marker\nexit 0\n');
    expect(runHook('Read', abs)).toBe(0);
  });

  it('off-path: a .sh outside .claude/hooks/ → exit 0', () => {
    const dir = mkdtempSync(join(tmpdir(), 'c4-offpath-'));
    tmpFiles.push(dir);
    const abs = join(dir, 'random.sh');
    writeFileSync(abs, '#!/usr/bin/env bash\n# no marker\n', 'utf8');
    expect(runHook('Write', abs)).toBe(0);
  });

  it('off-path: a non-.sh file under .claude/hooks/ → exit 0', () => {
    const name = `c4-test-${Date.now()}.md`;
    const abs = resolve(REPO_ROOT, '.claude/hooks', name);
    writeFileSync(abs, '# no marker, but markdown\n', 'utf8');
    tmpFiles.push(abs);
    expect(runHook('Write', abs)).toBe(0);
  });
});
