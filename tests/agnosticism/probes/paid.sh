#!/usr/bin/env bash
# Surface 6 — no metered route as a silent default; transport opt-in surfaced; no real API-key
# USAGE in CI. NOTE (false-positive guards, learned during the audit run 2026-06-16):
#  - the transport opt-in line escapes its quotes in the shell source (`\"cli\"`) → match loosely.
#  - a workflow COMMENT documenting the *absence* of ANTHROPIC_API_KEY must NOT count as usage →
#    strip whole-line comments and require a real `secrets.`/`KEY:`/`KEY=` usage shape.
set -uo pipefail
# Resolve by path, not `git rev-parse` — GIT_DIR-immune for worktree-push hook env (see ../run-audit.sh).
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
source "$REPO_ROOT/tests/agnosticism/_cc-absent-lib.sh"

rb="$REPO_ROOT/packages/runtime-bridge/scripts/setup-runtime-bridge.sh"
if grep -Eqs 'transport.*cli' "$rb" 2>/dev/null; then
  record paid transport-optin-surfaced "grep 'transport.*cli' setup-runtime-bridge.sh" 0 PORTABLE
else
  record paid transport-optin-surfaced "grep transport cli (file: $rb)" 1 PAID-RISK
fi

# Real API-key usage only: non-comment lines, in a secrets-ref or env-assignment shape.
if grep -hvE '^[[:space:]]*#' "$REPO_ROOT"/.github/workflows/*.yml 2>/dev/null \
     | grep -Eq 'secrets\.ANTHROPIC_API_KEY|ANTHROPIC_API_KEY[[:space:]]*[:=]'; then
  record paid no-api-key-in-ci "real ANTHROPIC_API_KEY usage in workflows (comments excluded)" 1 PAID-RISK
else
  record paid no-api-key-in-ci "no real ANTHROPIC_API_KEY usage in workflows (comments excluded)" 0 PORTABLE
fi
