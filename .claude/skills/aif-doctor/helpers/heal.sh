#!/usr/bin/env bash
# heal.sh — aif-doctor non-interactive heal preflight (PORTABLE, shipped to consumers).
#
# "The dispatcher calls the doctor; the doctor heals." The runtime-bridge dispatcher runs THIS
# via RUNTIME_BRIDGE_PREFLIGHT before a dispatch (env-gated, ship-safe NO-OP when unset, runs
# after dedup / before backend-resolve — packages/runtime-bridge/src/cli/dispatch.ts runPreflight).
# The dispatcher only knows "call the doctor"; the doctor owns WHAT healing means. Today that is
# the Tier-1 reversible base-refresh (aif-doctor SKILL §3.4), applied only when no task is
# in-flight. Grow this entrypoint as new Tier-1 auto-heals are codified.
#
# NON-BLOCKING by contract: always exits 0 — a failed heal warns; the dispatcher proceeds.
#
# Opt-in wiring (consumer, never mandatory — making a companion mandatory is a goal change):
#   export RUNTIME_BRIDGE_PREFLIGHT='bash .claude/skills/aif-doctor/helpers/heal.sh'
#
# Usage: bash heal.sh [branch]                         (branch defaults to staging)
# Env:   RUNTIME_BRIDGE_AIF_URL (default http://localhost:3009)
#        AIF_REFRESH_HELPER     (default: sibling refresh-aif-base.sh)
set -uo pipefail            # deliberately NOT -e: never abort the dispatcher
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
BRANCH="${1:-staging}"
AIF_URL="${RUNTIME_BRIDGE_AIF_URL:-http://localhost:3009}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo .)"

# In-flight guard: never yank the base out from under a running task. Read activeTaskCount via
# jq when present, else a jq-free grep fallback (stay portable on consumers without jq).
STATUS_JSON="$(curl -s -m5 "$AIF_URL/agent/status" 2>/dev/null || echo '')"
if command -v jq >/dev/null 2>&1; then
  ACTIVE="$(printf '%s' "$STATUS_JSON" | jq -r '.activeTaskCount // 0' 2>/dev/null || echo 0)"
else
  ACTIVE="$(printf '%s' "$STATUS_JSON" | grep -oE '"activeTaskCount"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+$' | head -1)"
fi
ACTIVE="${ACTIVE:-0}"
if [ "$ACTIVE" != "0" ]; then
  echo "[aif-doctor heal] activeTaskCount=$ACTIVE — skip base-refresh (task in-flight)"; exit 0
fi

REFRESH="${AIF_REFRESH_HELPER:-$SCRIPT_DIR/refresh-aif-base.sh}"
if [ -f "$REFRESH" ]; then
  bash "$REFRESH" "$BRANCH" || echo "[aif-doctor heal] base-refresh non-fatal failure — dispatch proceeds"
else
  echo "[aif-doctor heal] refresh helper missing ($REFRESH) — skip"
fi
exit 0
