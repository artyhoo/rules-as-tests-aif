#!/usr/bin/env bash
# PostToolUse hook — runtime-bridge dispatch for meta-launch kickoffs.
#
# @cc-only-rationale: edit-time PostToolUse enforcement — no portable hook fires
#   at the same moment (deterministic trigger only available in CC harness).
#   Portable equivalent: `tsx packages/runtime-bridge/src/cli/dispatch.ts <path>`
#   run manually after kickoff authoring.
# spec: packages/runtime-bridge/src/cli/dispatch.ts
#
# Fires on Write|Edit tool events. Reads stdin JSON (CC PostToolUse shape):
#   { tool_name, tool_input: { file_path } }
#
# Path filter: matches .claude/orchestrator-prompts/<anything>-meta-launch/kickoff.md
#   (the *-meta-launch/kickoff.md glob). Other file writes are silently ignored.
#
# Per-task opt-out: if first line of file_path is `<!-- bridge: skip -->` the
#   dispatch entrypoint exits 0 silently (ManualBackend copy-paste UX preserved).
#
# Fallback: on quota_exceeded / unavailable → dispatch.ts auto-falls-back to
#   ManualBackend and emits copy-paste instructions to stderr.
#
# Output contract (verified 2026-05-22, code.claude.com/docs/en/hooks.md):
#   plain stdout IGNORED for PostToolUse — context must be JSON additionalContext.
#   This hook exits 0 always (injection, never a gate per
#   .claude/rules/rule-enforcement-channel-selection.md §4).
#
# NC-3 (round-6, scoped 2026-05-31): The AI *agent* must NOT write settings.json —
#   the deny-list ("Edit(.claude/settings.json)", "Write(.claude/settings.json)") in
#   .claude/settings.json blocks the agent's Write/Edit tool calls.
#   The *human-run consumer setup script* (packages/runtime-bridge/scripts/
#   setup-runtime-bridge.sh) MAY write settings.json with backup + JSON-validation +
#   consent — it is not bound by the agent tool-permission deny-list.
set -uo pipefail

# ── Dependency guard ─────────────────────────────────────────────────────────
command -v jq  >/dev/null 2>&1 || exit 0
command -v node >/dev/null 2>&1 || exit 0

# ── Parse stdin ──────────────────────────────────────────────────────────────
INPUT="$(cat)"
TOOL="$(printf '%s' "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || true)"
FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null || true)"

# Only fire on Write or Edit events
case "$TOOL" in
  Write|Edit|MultiEdit) ;;
  *) exit 0 ;;
esac

[[ -z "$FILE_PATH" ]] && exit 0

# ── Path filter: *-meta-launch/kickoff.md ────────────────────────────────────
# Matches: .claude/orchestrator-prompts/<umbrella>-meta-launch/kickoff.md
# Does NOT match: arbitrary source files, other kickoff.md files.
# Bash glob note: the [[ == ]] pattern uses bash extglob (not regex); we use
# a case statement for broader compatibility.
case "$FILE_PATH" in
  *-meta-launch/kickoff.md) ;;
  *) exit 0 ;;
esac

# ── File must exist (Write may fire before flush on some CC versions) ────────
[[ -f "$FILE_PATH" ]] || exit 0

# ── Locate repo root + entrypoint ────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DISPATCH_TS="$REPO_ROOT/packages/runtime-bridge/src/cli/dispatch.ts"

if [[ ! -f "$DISPATCH_TS" ]]; then
  # Graceful no-op if package not installed (consumer opted out of runtime-bridge)
  exit 0
fi

# ── Invoke dispatch entrypoint ────────────────────────────────────────────────
# Use tsx (TypeScript executor) if available; fall back to node with --loader.
# dispatch.ts exits 0 always and outputs JSON hookSpecificOutput.additionalContext.
if command -v tsx >/dev/null 2>&1; then
  RESULT="$(tsx "$DISPATCH_TS" "$FILE_PATH" 2>/tmp/runtime-bridge-dispatch-stderr.txt)"
elif command -v npx >/dev/null 2>&1; then
  RESULT="$(npx --yes tsx "$DISPATCH_TS" "$FILE_PATH" 2>/tmp/runtime-bridge-dispatch-stderr.txt)"
else
  # Neither tsx nor npx — fall back to manual instructions via stderr
  printf '[runtime-bridge] tsx not found — paste kickoff manually: %s\n' "$FILE_PATH" >&2
  exit 0
fi

# ── Forward JSON output (additionalContext) ───────────────────────────────────
if [[ -n "$RESULT" ]]; then
  printf '%s\n' "$RESULT"
fi

exit 0
