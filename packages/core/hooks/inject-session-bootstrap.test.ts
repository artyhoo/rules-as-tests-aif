/**
 * Functional tests for the UserPromptSubmit bootstrap-injection hook
 * (.claude/hooks/inject-session-bootstrap.sh) — Wave 7 sub-wave 7.2.a.
 *
 * Contract (from hook source lines 1-14):
 *   - UserPromptSubmit hook: stdout is injected into Claude Code's prompt
 *     context automatically by the harness (line 3).
 *   - Always emits the static digest via heredoc (lines 6-14); no session cache,
 *     no skip conditions, stdin is ignored.
 *   - Digest is bounded by sentinel tags:
 *       opening: "[session-bootstrap digest — auto-injected at prompt submit]" (line 7)
 *       closing: "[/session-bootstrap digest]" (line 13)
 *   - Content invariants (lines 8-12): project goal, 4 invariants, Step-0 reading
 *     order, recommendation discipline.
 *
 * Paired-negative contract:
 *   ❌ hook output MUST NOT be empty (the core injection contract)
 *   ✅ stdout contains the opening sentinel tag (line 7)
 *   ✅ stdout contains the closing sentinel tag (line 13)
 *   ✅ stdout contains the goal anchor phrase (line 8)
 *   ✅ repeat invocations (same or different session_id) still emit (no false cache)
 *   ✅ exit code is 0 on every invocation
 *
 * Reference pattern: check-hook-marker.test.ts (vitest + spawnSync harness).
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HOOK = resolve(REPO_ROOT, '.claude/hooks/inject-session-bootstrap.sh');

/**
 * Run the hook with a simulated UserPromptSubmit stdin payload.
 * The hook ignores stdin (pure stdout emitter, line 6-14) but we send
 * realistic input matching CC's UserPromptSubmit shape for accuracy.
 */
function runHook(session_id = 'test-session'): { stdout: string; status: number } {
  const r = spawnSync('bash', [HOOK], {
    input: JSON.stringify({
      hook_event_name: 'UserPromptSubmit',
      session_id,
      prompt: 'test prompt',
      transcript_path: '/tmp/test-transcript.jsonl',
    }),
    encoding: 'utf8',
  });
  return {
    stdout: r.stdout ?? '',
    status: r.status ?? -1,
  };
}

// sentinel tags from hook source lines 7 and 13
const OPENING_TAG = '[session-bootstrap digest — auto-injected at prompt submit]';
const CLOSING_TAG = '[/session-bootstrap digest]';

// key goal anchor phrase from hook source line 8
const GOAL_ANCHOR =
  "AI agents can't silently bypass undocumented conventions";

describe('inject-session-bootstrap.sh — UserPromptSubmit bootstrap injection', () => {
  it('PAIRED-NEGATIVE: output MUST NOT be empty (core injection contract, hook line 6-14)', () => {
    const { stdout } = runHook();
    // This is the load-bearing negative assertion:
    // if the hook stops emitting, this test fails — regression caught.
    expect(stdout.trim()).not.toBe('');
  });

  it('PAIRED-POSITIVE: stdout contains opening sentinel tag (hook line 7)', () => {
    const { stdout } = runHook();
    expect(stdout).toContain(OPENING_TAG);
  });

  it('PAIRED-POSITIVE: stdout contains closing sentinel tag (hook line 13)', () => {
    const { stdout } = runHook();
    expect(stdout).toContain(CLOSING_TAG);
  });

  it('PAIRED-POSITIVE: output is bounded — opening tag appears before closing tag', () => {
    const { stdout } = runHook();
    const openIdx = stdout.indexOf(OPENING_TAG);
    const closeIdx = stdout.indexOf(CLOSING_TAG);
    // Boundary assertion: both tags present and in correct order.
    expect(openIdx).toBeGreaterThanOrEqual(0);
    expect(closeIdx).toBeGreaterThan(openIdx);
  });

  it('PAIRED-POSITIVE: stdout contains goal anchor phrase (hook line 8)', () => {
    const { stdout } = runHook();
    expect(stdout).toContain(GOAL_ANCHOR);
  });

  it('PAIRED-POSITIVE: hook exits 0 (non-zero would prevent injection, hook line 6)', () => {
    const { status } = runHook();
    expect(status).toBe(0);
  });

  it('PAIRED-POSITIVE: repeat invocation with same session_id still emits (no false cache)', () => {
    // Hook has no session cache (no /tmp flag file, no stdin session_id check, lines 1-14).
    // Both calls must produce non-empty output.
    const first = runHook('repeat-session-test');
    const second = runHook('repeat-session-test');
    expect(first.stdout.trim()).not.toBe('');
    expect(second.stdout.trim()).not.toBe('');
  });

  it('PAIRED-POSITIVE: repeat invocation output is identical (static digest, hook lines 6-14)', () => {
    const first = runHook('idempotent-check-1');
    const second = runHook('idempotent-check-2');
    // Static heredoc — same content every time regardless of input.
    expect(first.stdout).toBe(second.stdout);
  });

  it('PAYLOAD SHAPE: output is plain text, NOT JSON (UserPromptSubmit ≠ PostToolUse contract)', () => {
    // UserPromptSubmit hooks inject via plain stdout (hook line 3), NOT via
    // JSON hookSpecificOutput (that is PostToolUse semantics).
    // Asserting the correct channel contract: the output must NOT be parseable
    // as a JSON object with hookSpecificOutput — otherwise the wrong protocol
    // is used and the injection would silently fail.
    const { stdout } = runHook();
    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      parsed = null;
    }
    // The output is plain text, not a JSON envelope.
    expect(parsed).toBeNull();
  });
});
