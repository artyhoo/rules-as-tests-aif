#!/usr/bin/env bash
# setup-cc-adoptions.sh — wire the operator-side CC-native adoptions from the
# 2026-06-01 capability census (companion-adoption-iphase umbrella) into your
# local Claude Code config. SAFE + IDEMPOTENT: backs up settings.json, only adds
# what is missing, re-runnable. Run from anywhere inside the repo checkout.
#
# What it wires:
#   1. SubagentStart digest-injection hook (#108 / SSOT #108, PR #330) — currently INERT.
#   2. (verifies) inject-matching-rule.sh PostToolUse hook (rule-enforcement §4 / F1 #331 dual-pair) — already wired; reports, never duplicates.
#   3. (optional) Channels/Telegram setup guidance (census adopt-now #3).
#   4. (info) Routines /schedule + Remote Control + agent-view — in-session habits, nothing to install.
#
# What it does NOT touch:
#   - F2 /fire dispatch — BLOCKED on DECISION-NEEDED-1 (no status-poll endpoint). Not wired here.
#   - It edits .claude/settings.json — that file is agent-self-protected; YOU run this script, so it's your action (the sanctioned path).
set -euo pipefail

# --- locate repo root ---
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[ -z "$ROOT" ] && { echo "✗ not inside a git checkout — cd into the rules-as-tests-aif repo first"; exit 1; }
cd "$ROOT"
SETTINGS=".claude/settings.json"

echo "== repo: $ROOT =="

# --- prereqs ---
command -v jq >/dev/null || { echo "✗ jq required (brew install jq)"; exit 1; }
echo "✓ jq"
if command -v bun >/dev/null; then echo "✓ bun $(bun --version)"; else echo "⚠ bun absent — needed only for Channels/Telegram (step 3, optional)"; fi
CCV="$(claude --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || true)"
echo "ℹ claude ${CCV:-unknown} (need ≥2.1.81 for /schedule routines)"

# --- guard: hooks must exist (must be on a branch that has #330/#331, i.e. staging) ---
for h in inject-subagent-digest.sh inject-matching-rule.sh; do
  [ -f ".claude/hooks/$h" ] || { echo "✗ .claude/hooks/$h missing — pull origin/staging first (git fetch && git checkout staging && git pull)"; exit 1; }
done
[ -f "$SETTINGS" ] || { echo "✗ $SETTINGS missing"; exit 1; }
jq empty "$SETTINGS" 2>/dev/null || { echo "✗ $SETTINGS is not valid JSON — aborting before any edit"; exit 1; }

# --- backup before any edit ---
BAK="${SETTINGS}.bak.$(date +%Y%m%d-%H%M%S)"
cp "$SETTINGS" "$BAK"; echo "↳ backup: $BAK"

# --- 1. SubagentStart digest-injection (the one genuinely-missing item) ---
SUB_CMD='bash "$CLAUDE_PROJECT_DIR/.claude/hooks/inject-subagent-digest.sh"'
if jq -e '(.hooks.SubagentStart // []) | map(.hooks[]?.command) | any(test("inject-subagent-digest"))' "$SETTINGS" >/dev/null; then
  echo "✓ SubagentStart digest hook — already wired (skip)"
else
  TMP="$(mktemp)"
  jq --arg cmd "$SUB_CMD" \
    '.hooks.SubagentStart = ((.hooks.SubagentStart // []) + [{hooks:[{type:"command",command:$cmd}]}])' \
    "$SETTINGS" > "$TMP"
  jq empty "$TMP" 2>/dev/null || { echo "✗ produced invalid JSON — restoring backup"; cp "$BAK" "$SETTINGS"; rm -f "$TMP"; exit 1; }
  mv "$TMP" "$SETTINGS"
  echo "✓ SubagentStart digest hook — WIRED (juniors now get the session-bootstrap digest at spawn)"
fi

# --- 2. inject-matching-rule (already-wired check — never duplicate) ---
if jq -e '(.hooks.PostToolUse // []) | map(.hooks[]?.command) | any(test("inject-matching-rule"))' "$SETTINGS" >/dev/null; then
  echo "✓ inject-matching-rule PostToolUse hook — already wired (F1 paths:↔globs: dual-pair active on edit)"
else
  echo "⚠ inject-matching-rule NOT wired — unexpected (census said it was). Add a PostToolUse Edit|Write entry for .claude/hooks/inject-matching-rule.sh manually, or report."
fi

# --- final validation ---
jq empty "$SETTINGS" && echo "✓ $SETTINGS valid JSON after edit"

# --- 3. SubagentStart smoke-test (prove it fires, not silent-no-op — T-108-A) ---
echo "== smoke-test SubagentStart hook =="
OUT="$(printf '{"hook_event_name":"SubagentStart","session_id":"probe"}' | bash .claude/hooks/inject-subagent-digest.sh 2>/dev/null || true)"
if echo "$OUT" | jq -e '.hookSpecificOutput.additionalContext // .systemMessage // empty' >/dev/null 2>&1; then
  echo "✓ hook emits valid JSON additionalContext (not a silent no-op)"
else
  echo "⚠ smoke-test inconclusive — inspect: printf '{...}' | bash .claude/hooks/inject-subagent-digest.sh"
fi

# --- 4. Channels / Telegram (OPTIONAL — census adopt-now #3) ---
cat <<'CHAN'

== OPTIONAL: Channels (Telegram) — ping+answer on phone during long LOCAL sessions ==
  Needs Bun (present above). These run in/with Claude Code, NOT auto-run by this script
  (plugin install is interactive) — do them by hand if you want it:
    1. In a claude session:  /plugin install telegram@claude-plugins-official
    2.                       /telegram:configure <BotFather-token>
    3. Launch with channels:  claude --channels plugin:telegram@claude-plugins-official
    4. Pair + allowlist your chat.
  (Session-open-only — does NOT replace the unattended questions.ts park/resume path.)
CHAN

# --- 5. info: habits / cloud (nothing to install) ---
cat <<INFO

== Already available, just use (nothing to install) ==
  • Remote Control — /remote-control  (oversee long autonomous runs from phone/claude.ai)
  • Background agent-view — /bg          (watch parallel workers one screen)
  • Routines (cloud, survives laptop-closed) — /schedule   (CC ${CCV:-?} ≥2.1.81 ✓ — recurring discipline-sweeps)

== NOT wired (blocked) ==
  • F2 /fire cloud dispatch — DECISION-NEEDED-1 open (no status-poll endpoint vs our cli/await.ts). REST stays the dispatch default. Revisit after DN-1.

== Reminder: maintainer-only follow-up ==
  • Decide #108 SubagentStop gate: block(exit2) vs warn — a follow-up implements your pick.

Done. Re-run anytime — it only adds what's missing. Backup at: $BAK
INFO
