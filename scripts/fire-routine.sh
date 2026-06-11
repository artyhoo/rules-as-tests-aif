#!/usr/bin/env bash
# fire-routine.sh — operator-manual curl helper for CC Routines /fire API.
#
# Usage:
#   RUNTIME_BRIDGE_FIRE_ROUTINE_ID=<id> RUNTIME_BRIDGE_FIRE_TOKEN=<token> \
#     bash scripts/fire-routine.sh --text "Do the thing"
#
#   Or pipe context via stdin:
#     echo "My kickoff content" | bash scripts/fire-routine.sh
#
# Required env vars:
#   RUNTIME_BRIDGE_FIRE_ROUTINE_ID  — CC Routines routine ID
#   RUNTIME_BRIDGE_FIRE_TOKEN       — Bearer token (sk-ant-oat01-…, write-only)
#
# Optional env vars:
#   RUNTIME_BRIDGE_FIRE_BASE_URL    — API base (default: https://api.anthropic.com/v1/claude_code/routines)
#   RUNTIME_BRIDGE_FIRE_BETA        — anthropic-beta header (default: experimental-cc-routine-2026-04-01)
#   RUNTIME_BRIDGE_FIRE_ANTHROPIC_VERSION — anthropic-version (default: 2023-06-01)
#
# On success:  prints claude_code_session_url to stdout (open in browser to monitor).
# On failure:  prints error to stderr and exits non-zero.
#
# IMPORTANT — operator-manual only:
#   - /fire is dispatch-only (write-only token, NO await/status parity).
#   - After dispatch, monitor progress via the printed session_url in a browser.
#   - DO NOT call this script from CI / .github/workflows (DN-2: DEFER-permanent
#     under .claude/rules/no-paid-llm-in-ci.md §3 / #paid-llm-creep).
#
# CC Routines setup: claude.ai/code/routines → Add API trigger → Generate token.

set -euo pipefail

# ── Resolve required config ──────────────────────────────────────────────────
ROUTINE_ID="${RUNTIME_BRIDGE_FIRE_ROUTINE_ID:-}"
TOKEN="${RUNTIME_BRIDGE_FIRE_TOKEN:-}"
BASE_URL="${RUNTIME_BRIDGE_FIRE_BASE_URL:-https://api.anthropic.com/v1/claude_code/routines}"
BETA="${RUNTIME_BRIDGE_FIRE_BETA:-experimental-cc-routine-2026-04-01}"
ANTHROPIC_VERSION="${RUNTIME_BRIDGE_FIRE_ANTHROPIC_VERSION:-2023-06-01}"

if [[ -z "$ROUTINE_ID" ]]; then
  echo "ERROR: RUNTIME_BRIDGE_FIRE_ROUTINE_ID is required." >&2
  echo "       Set it to your CC Routines routine ID from claude.ai/code/routines." >&2
  exit 1
fi

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: RUNTIME_BRIDGE_FIRE_TOKEN is required." >&2
  echo "       Generate a write-only API trigger token at claude.ai/code/routines." >&2
  exit 1
fi

# ── Parse --text arg or read stdin ──────────────────────────────────────────
TEXT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --text)
      shift
      TEXT="${1:-}"
      shift
      ;;
    --text=*)
      TEXT="${1#--text=}"
      shift
      ;;
    *)
      echo "ERROR: Unknown argument: $1" >&2
      echo "Usage: bash scripts/fire-routine.sh [--text \"<content>\"]" >&2
      exit 1
      ;;
  esac
done

# Fallback to stdin if no --text and stdin is piped
if [[ -z "$TEXT" ]] && ! [ -t 0 ]; then
  TEXT="$(cat)"
fi

if [[ -z "$TEXT" ]]; then
  echo "ERROR: No content provided. Use --text \"...\" or pipe content via stdin." >&2
  exit 1
fi

# ── POST to /fire ────────────────────────────────────────────────────────────
FIRE_URL="${BASE_URL}/${ROUTINE_ID}/fire"

RESPONSE="$(jq -n --arg text "$TEXT" '{text:$text}' | curl -sSL --fail-with-body \
  -X POST "$FIRE_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "anthropic-beta: $BETA" \
  -H "anthropic-version: $ANTHROPIC_VERSION" \
  -H "Content-Type: application/json" \
  --data-binary @- \
  2>&1)" || {
  echo "ERROR: /fire POST failed:" >&2
  echo "$RESPONSE" >&2
  exit 1
}

# ── Extract session_url and print ────────────────────────────────────────────
SESSION_URL="$(echo "$RESPONSE" | grep -o '"claude_code_session_url":"[^"]*"' | cut -d'"' -f4)"
SESSION_ID="$(echo "$RESPONSE" | grep -o '"claude_code_session_id":"[^"]*"' | cut -d'"' -f4)"

if [[ -z "$SESSION_URL" ]]; then
  echo "ERROR: /fire response missing claude_code_session_url:" >&2
  echo "$RESPONSE" >&2
  exit 1
fi

echo "$SESSION_URL"
echo "session_id=${SESSION_ID}" >&2
echo "[fire-routine] Dispatched. Open the URL above in a browser to monitor progress." >&2
echo "[fire-routine] Note: /fire is dispatch-only — no await parity. The routine runs in the cloud." >&2
