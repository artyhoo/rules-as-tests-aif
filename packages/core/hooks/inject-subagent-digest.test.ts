/**
 * Functional meta-tests for the SubagentStart digest-injection hook
 * (.claude/hooks/inject-subagent-digest.sh) — the #108 orchestrator gate that
 * gives every dispatched junior the project anchor at spawn ($0, no boilerplate).
 *
 * Asserts the verified SubagentStart injection contract (dual-channel 2026-06-01,
 * WebFetch code.claude.com/docs/en/hooks + DeepWiki anthropics/claude-code):
 *   - SubagentStart is NON-blocking; context is delivered ONLY via JSON
 *     {hookSpecificOutput:{hookEventName:"SubagentStart",additionalContext}}.
 *     Plain stdout is a silent no-op here (T-108-A) — so the hook MUST emit JSON.
 *   - the injected additionalContext carries the session-bootstrap digest verbatim
 *     (single source of truth: reuses inject-session-bootstrap.sh — no #two-prompts-drift).
 *   - exit 0 (non-blocking — execFileSync throws on non-zero).
 *
 * Skips gracefully when `jq` is unavailable (the hook itself no-ops without jq).
 */
import { describe, it, expect } from 'vitest';
import { execSync, execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const HOOK = resolve(REPO_ROOT, '.claude/hooks/inject-subagent-digest.sh');
const SOURCE_DIGEST = resolve(REPO_ROOT, '.claude/hooks/inject-session-bootstrap.sh');

function hasJq(): boolean {
  try {
    execSync('command -v jq', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const JQ = hasJq();

/** Run the hook with a SubagentStart stdin payload; return trimmed stdout. */
function runHook(input: Record<string, unknown>): string {
  return execFileSync('bash', [HOOK], {
    input: JSON.stringify(input),
    encoding: 'utf8',
  }).trim();
}

const subagentStartPayload = (agentType: string) => ({
  session_id: `test-${agentType}`,
  hook_event_name: 'SubagentStart',
  agent_type: agentType,
});

describe.skipIf(!JQ)('inject-subagent-digest.sh — SubagentStart digest injection', () => {
  it('emits valid JSON with hookEventName "SubagentStart" (NOT plain stdout — T-108-A)', () => {
    const out = runHook(subagentStartPayload('general-purpose'));
    const json = JSON.parse(out); // throws if it emitted plain stdout instead of JSON
    expect(json.hookSpecificOutput.hookEventName).toBe('SubagentStart');
    expect(typeof json.hookSpecificOutput.additionalContext).toBe('string');
    expect(json.hookSpecificOutput.additionalContext.length).toBeGreaterThan(0);
  });

  it('additionalContext carries the session-bootstrap digest (project anchor)', () => {
    const out = runHook(subagentStartPayload('Explore'));
    const ctx = JSON.parse(out).hookSpecificOutput.additionalContext as string;
    // Anchor content the digest is supposed to deliver to juniors.
    expect(ctx).toContain('session-bootstrap digest');
    expect(ctx).toContain('earliest reachable channel');
    expect(ctx).toContain('Recommendation discipline (H1)');
  });

  it('single source of truth: digest === inject-session-bootstrap.sh output verbatim (no drift)', () => {
    const injected = JSON.parse(runHook(subagentStartPayload('claude')))
      .hookSpecificOutput.additionalContext as string;
    const source = execFileSync('bash', [SOURCE_DIGEST], { encoding: 'utf8' }).trim();
    expect(injected.trim()).toBe(source);
  });

  it('output is non-blocking (exit 0) — execFileSync would throw on non-zero', () => {
    expect(() => runHook(subagentStartPayload('general-purpose'))).not.toThrow();
  });
});
