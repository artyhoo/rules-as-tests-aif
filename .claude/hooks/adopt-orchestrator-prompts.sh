#!/usr/bin/env bash
# adopt-orchestrator-prompts.sh — PostToolUse: adopt a new orchestrator-prompt
# file into the canonical coordination store at write-time.
#
# Closes a structural file-loss gap: a NEW gitignored file born mid-session under
# .claude/orchestrator-prompts/*/ inside a worktree is sole-copy and dies if the
# worktree is deleted before the next session-start adoption sweep runs. Firing
# adoption at write-time (PostToolUse) catches it at the earliest reachable channel.
#
# Input: hook JSON via stdin (.tool_input.file_path — same field for Write and Edit).
# Path-filters in-script to .claude/orchestrator-prompts/ (the settings matcher can
# only match the tool name, not a path). Triggers — does NOT reimplement — the
# existing scripts/link-coordination.sh adopt-then-link arm (SSOT #110): idempotent,
# never clobbers, skips tracked done.md / README.md.
#
# Non-blocking: this is injection, never a gate — ALWAYS exits 0.
#
# @cc-only-rationale: internal orchestrator coordination tooling, not a consumer-shipping path → CC-native only
# spec: scripts/link-coordination.sh (SSOT #110)
set -uo pipefail

# CC hooks run with a stripped PATH; jq may live under Homebrew on the operator's mac.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HELPER="$REPO_ROOT/scripts/link-coordination.sh"

if ! command -v jq >/dev/null 2>&1; then
  printf '⚠ adopt-orchestrator-prompts: jq unavailable — skipping\n' >&2; exit 0
fi

ABS_PATH="$(cat | jq -r '.tool_input.file_path // ""' 2>/dev/null || true)"
[[ -z "$ABS_PATH" ]] && exit 0

# In-script path filter (mirror check-doc-authority.sh:15-20): only fire for writes
# under .claude/orchestrator-prompts/. The settings matcher cannot glob a path.
case "$ABS_PATH" in
  */.claude/orchestrator-prompts/*) ;;
  *) exit 0 ;;
esac

# Flush-race guard: PostToolUse may fire before the write flushes on some CC versions.
[[ -f "$ABS_PATH" ]] || exit 0

# Worktree root = the path prefix before /.claude/orchestrator-prompts/ . Deriving it
# from the written path (not git / not $0) keeps the trigger correct for any worktree
# and lets the unit test isolate to a temp worktree without touching the real $CANON.
WT_DIR="${ABS_PATH%%/.claude/orchestrator-prompts/*}"

# Runtime dependency: the existing adopt-then-link helper; graceful no-op if absent.
[[ -f "$HELPER" ]] || exit 0

# Trigger the EXISTING adopt-then-link arm. Default --on-conflict=skip never clobbers;
# any non-zero (e.g. conflict) is swallowed — this hook is injection, never a gate.
bash "$HELPER" "$WT_DIR" >/dev/null 2>&1 || true

exit 0
