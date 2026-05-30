#!/usr/bin/env bash
# setup-runtime-bridge.sh — interactive consumer setup for the runtime bridge.
#
# Phase 1 scope: aif-handoff-or-skip (2-way). amux is Phase 2 (SW-H), not here.
#
# What it does (DETECT + INSTRUCT — never auto-installs aif-handoff):
#   1. Probes whether an aif-handoff coordinator is reachable on RUNTIME_BRIDGE_AIF_URL.
#   2. Asks whether to enable the aif-handoff bridge.
#      - yes → writes the env the bridge needs (mode + project id + url) to the
#              consumer's shell rc, copies the PostToolUse hook into .claude/hooks/,
#              and PRINTS the exact settings.json entry to paste (NC-3: this script
#              never silently mutates the agent-self-protected settings.json).
#      - no  → prints the per-task `<!-- bridge: skip -->` opt-out; sets nothing.
#              ManualBackend (copy-paste) is always the default — no install needed.
#
# The bridge never degrades the manual-paste experience; it only adds automation
# when aif-handoff is present AND the consumer opts in.
#
# Cost note: after 2026-06-15, aif-handoff CLI transport (`claude -p`) draws from a
# separate monthly Agent SDK credit. See docs/runtime-bridge-setup.md.
set -euo pipefail

# ── Locate repo root + the shipped hook (this script lives in
#    packages/runtime-bridge/scripts/, so root is three levels up) ─────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
HOOK_SRC="$REPO_ROOT/.claude/hooks/runtime-bridge-dispatch.sh"

# Consumer-config defaults (override via env before running).
AIF_URL="${RUNTIME_BRIDGE_AIF_URL:-http://localhost:3009}"
SHELL_RC="${SHELL_RC:-$HOME/.zshrc}"
# Anchor to REPO_ROOT (the dir containing packages/runtime-bridge/), NOT the
# shell's cwd — so the hook lands in the right .claude/hooks/ regardless of where
# the script is invoked from. Override only if your .claude/ lives elsewhere.
CLAUDE_HOOKS_DIR="${CLAUDE_HOOKS_DIR:-$REPO_ROOT/.claude/hooks}"

say()  { printf '%s\n' "$*"; }
warn() { printf '[runtime-bridge] %s\n' "$*" >&2; }

# ── Step 1: probe aif-handoff reachability (mirror AifHandoffBackend.available) ─
say "Probing aif-handoff coordinator at ${AIF_URL} ..."
if curl --silent --show-error --connect-timeout 1 "${AIF_URL}/health" >/dev/null 2>&1; then
  say "  reachable ✓"
else
  say "  not reachable (that's fine — you can still set up and start it later)"
fi

# ── Step 2: ask ───────────────────────────────────────────────────────────────
printf 'Install aif-handoff bridge? [y/N — default N = manual paste mode] '
read -r ANSWER || ANSWER=""

case "${ANSWER}" in
  y|Y|yes|YES)
    say ""
    say "Enabling aif-handoff bridge. aif-handoff itself is NOT installed by this"
    say "script — bring it up yourself (DETECT + INSTRUCT only):"
    say "  • docker compose up -d        # in your aif-handoff checkout"
    say "  • confirm the coordinator answers on ${AIF_URL}/health"
    say ""
    say "REQUIRED aif-handoff-side config (ToS-safe subscription billing):"
    say "  • transport: \"cli\"   ← NOT the default (default is SDK / metered);"
    say "      verify with: aif-handoff config show   (look for the Claude profile)"
    say "  • AGENT_AUTO_REVIEW_STRATEGY=closure_first   ← layered-review design"
    say ""

    # Required bridge env — without these dispatch() throws and silently degrades.
    printf 'aif-handoff project UUID (RUNTIME_BRIDGE_AIF_PROJECT_ID): '
    read -r PROJECT_ID || PROJECT_ID=""
    if [[ -z "${PROJECT_ID}" ]]; then
      warn "no project id given — the bridge will throw dispatch_failed and fall back to ManualBackend until you set RUNTIME_BRIDGE_AIF_PROJECT_ID."
    fi
    printf 'aif-handoff base URL [%s]: ' "${AIF_URL}"
    read -r URL_IN || URL_IN=""
    URL_OUT="${URL_IN:-${AIF_URL}}"

    # Idempotency guard: don't append a second RUNTIME_BRIDGE_* block on re-run.
    if grep -q 'runtime-bridge (added by setup-runtime-bridge.sh)' "${SHELL_RC}" 2>/dev/null; then
      warn "RUNTIME_BRIDGE_* env already present in ${SHELL_RC} — leaving it; edit by hand to change values."
    else
      {
        printf '\n# runtime-bridge (added by setup-runtime-bridge.sh)\n'
        printf 'export RUNTIME_BRIDGE_MODE=auto\n'
        [[ -n "${PROJECT_ID}" ]] && printf 'export RUNTIME_BRIDGE_AIF_PROJECT_ID=%s\n' "${PROJECT_ID}"
        printf 'export RUNTIME_BRIDGE_AIF_URL=%s\n' "${URL_OUT}"
      } >> "${SHELL_RC}"
      say "Wrote RUNTIME_BRIDGE_* env to ${SHELL_RC} (re-source it or open a new shell)."
    fi

    # Hook delivery — install.sh does NOT ship this hook, so copy it in.
    if [[ -f "${HOOK_SRC}" ]]; then
      mkdir -p "${CLAUDE_HOOKS_DIR}"
      cp "${HOOK_SRC}" "${CLAUDE_HOOKS_DIR}/runtime-bridge-dispatch.sh"
      chmod +x "${CLAUDE_HOOKS_DIR}/runtime-bridge-dispatch.sh"
      say "Copied runtime-bridge-dispatch.sh → ${CLAUDE_HOOKS_DIR}/"
    else
      warn "hook source not found at ${HOOK_SRC} — copy runtime-bridge-dispatch.sh into ${CLAUDE_HOOKS_DIR}/ manually."
    fi

    say ""
    say "Final manual step (NC-3 — settings.json is agent-protected, you paste it):"
    say "APPEND this single matcher object to the EXISTING \"PostToolUse\" array under"
    say "\"hooks\" in your .claude/settings.json (create the array only if absent —"
    say "do NOT replace it, or you'll drop your other PostToolUse hooks):"
    cat <<'JSON'

  {
    "matcher": "Write|Edit|MultiEdit",
    "hooks": [
      { "type": "command", "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/runtime-bridge-dispatch.sh\"" }
    ]
  }
JSON
    say ""
    say "Done. New meta-launch kickoffs auto-dispatch to aif-handoff; anything else"
    say "(or quota_exceeded / unreachable) falls back to ManualBackend automatically."
    ;;
  *)
    say ""
    say "Skipping bridge install — ManualBackend (copy-paste) stays the default."
    say "To force manual mode per-task even when a bridge is active, make the FIRST"
    say "line of the kickoff.md:"
    say "  <!-- bridge: skip -->"
    say "To force manual mode session-wide: export RUNTIME_BRIDGE_MODE=manual"
    ;;
esac
