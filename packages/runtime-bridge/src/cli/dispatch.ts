/**
 * CLI dispatch entrypoint — invoked by the PostToolUse hook.
 *
 * Usage: tsx packages/runtime-bridge/src/cli/dispatch.ts <kickoff-path>
 *
 * Behaviour:
 *   1. Build KickoffSpec from kickoff path (null → bridge: skip marker → exit 0)
 *   2. Check idempotency (dedup by content hash, TTL 24h) → if hit, exit 0
 *   3. Resolve backend (RUNTIME_BRIDGE_MODE env, probe available())
 *   4. Dispatch kickoff → record dedup entry
 *   5. Output JSON hookSpecificOutput.additionalContext for CC PostToolUse contract
 *   6. On quota_exceeded / unavailable → fall back to ManualBackend + stderr warn
 *
 * Exit codes: 0 always (non-blocking injection per rule-enforcement-channel-selection
 * §4 "injection, never gate" contract).
 *
 * @cc-only-rationale: PostToolUse hook entrypoint — but the logic is pure TS
 *   so also callable from portable test harness.
 */
import { buildKickoffSpec } from '../kickoff.js';
import { checkDedup, recordDispatch } from '../idempotency.js';
import { resolveBackend } from '../resolver.js';
import { ManualBackend } from '../ManualBackend.js';
import { BackendError } from '../backend.js';

async function main(): Promise<void> {
  const kickoffPath = process.argv[2];
  if (!kickoffPath) {
    process.stderr.write('[runtime-bridge] dispatch.ts: no kickoff path provided\n');
    process.exit(0);
  }

  // ── Step 1: Build KickoffSpec ─────────────────────────────────────────────
  let kickoff;
  try {
    kickoff = buildKickoffSpec(kickoffPath);
  } catch (err) {
    process.stderr.write(`[runtime-bridge] Failed to read kickoff ${kickoffPath}: ${err}\n`);
    process.exit(0);
  }

  if (!kickoff) {
    // bridge: skip marker — silent exit
    process.exit(0);
  }

  // ── Step 2: Idempotency check ─────────────────────────────────────────────
  const priorHandle = checkDedup(kickoff.contentHash);
  if (priorHandle) {
    outputContext(
      `[runtime-bridge] Kickoff already dispatched (taskId=${priorHandle.taskId}, backend=${priorHandle.backend}) — skipping duplicate dispatch`,
    );
    process.exit(0);
  }

  // ── Step 3 + 4: Resolve backend + dispatch ────────────────────────────────
  let backend = await resolveBackend();
  let handle;

  try {
    handle = await backend.dispatch(kickoff);
  } catch (err) {
    // Auto-fallback to ManualBackend on ANY BackendError — unavailable,
    // quota_exceeded, timeout, AND dispatch_failed (e.g. the dirty-worktree
    // guard). The bridge's contract is "never leave the operator stuck": any
    // backend failure degrades to copy-paste rather than a silent dead end.
    // (AifHandoffBackend.dispatch best-effort deletes any half-created task
    // before throwing, so no orphan is left on the project.)
    if (err instanceof BackendError) {
      process.stderr.write(
        `[runtime-bridge] ${backend.name} dispatch failed (${err.code}): ${err.message} — falling back to ManualBackend\n`,
      );
      backend = new ManualBackend();
      try {
        handle = await backend.dispatch(kickoff);
      } catch (manualErr) {
        process.stderr.write(`[runtime-bridge] ManualBackend dispatch failed: ${manualErr}\n`);
        process.exit(0);
      }
    } else {
      // Non-BackendError (programming bug) — log and exit without dispatching.
      process.stderr.write(`[runtime-bridge] Dispatch error: ${err}\n`);
      process.exit(0);
    }
  }

  // ── Step 5: Record dedup + output additionalContext ───────────────────────
  recordDispatch(kickoff.contentHash, handle);

  // Human-facing UI (the board), NOT the :3009 REST API (which returns raw JSON).
  const webBase = process.env['RUNTIME_BRIDGE_AIF_WEB_URL'] ?? 'http://localhost:5180';
  const projectId = process.env['RUNTIME_BRIDGE_AIF_PROJECT_ID'];
  const uiUrl = projectId ? `${webBase}/projects/${projectId}` : webBase;
  const msg =
    backend.name === 'manual'
      ? `[runtime-bridge] ManualBackend: kickoff written to /tmp/runtime-bridge-${handle.taskId}.md — paste into a new Claude Code session`
      : `[runtime-bridge] Dispatched to ${backend.name} (taskId=${handle.taskId}) — open the board: ${uiUrl}`;

  // Form guard (non-blocking; exit-0 contract preserved): an orchestration
  // meta-kickoff is NOT a single buildable task — aif investigates and halts
  // with ZERO code (live-confirmed 2026-05-31, task a4bdff98: $5.66, no code).
  // Warn so the operator re-dispatches a per-sub-wave implementation kickoff.
  if (backend.name !== 'manual' && isOrchestrationKickoff(kickoff)) {
    process.stderr.write(
      `[runtime-bridge] ⚠ ${kickoff.umbrellaName}/kickoff.md looks like an orchestration meta-kickoff ` +
        `(launch-table / stage-gates / multiple sub-waves), not a single buildable task. ` +
        `aif will likely produce ZERO code and halt. Dispatch a per-sub-wave implementation kickoff instead.\n`,
    );
  }

  outputContext(msg);
  process.exit(0);
}

/**
 * Heuristic: does this kickoff describe an orchestration plan (many sub-waves,
 * stage gates, dispatch instructions) rather than ONE buildable task? aif treats
 * the kickoff as an implementation spec — a meta-plan yields no code. Deterministic,
 * conservative (path marker OR ≥2 orchestration section markers).
 */
function isOrchestrationKickoff(kickoff: { umbrellaName: string; content: string }): boolean {
  if (kickoff.umbrellaName.endsWith('-meta-launch')) return true;
  const markers = [
    /^#+\s*§?\d*\.?\s*Launch-table/im,
    /^#+\s*§?\d*\.?\s*Stage gates/im,
    /\|\s*Sub-wave\s*\|/im,
    /Sub-wave dispatch instructions/im,
  ];
  return markers.filter((re) => re.test(kickoff.content)).length >= 2;
}

function outputContext(message: string): void {
  // CC PostToolUse contract: plain stdout is IGNORED; context must be JSON.
  // Source: code.claude.com/docs/en/hooks.md (verified 2026-05-22).
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: message,
    },
  };
  process.stdout.write(JSON.stringify(output) + '\n');
}

main().catch((err) => {
  process.stderr.write(`[runtime-bridge] Unhandled dispatch error: ${err}\n`);
  process.exit(0);
});
