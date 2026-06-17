#!/usr/bin/env bash
# Probe: doc-claims — detect unqualified skill auto-activation claims in AGENTS.md.template.
# PORTABLE when every auto-activate/auto-trigger mention is CC-qualified AND the non-CC
# fallback note is present. CC-ONLY otherwise.
# Per .claude/rules/no-paid-llm-in-ci.md: pure bash, zero API calls.
set -uo pipefail
# Resolve by path, not `git rev-parse` — GIT_DIR-immune for worktree-push hook env (see ../run-audit.sh).
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
source "$REPO_ROOT/tests/agnosticism/_cc-absent-lib.sh"

TARGET="${DOC_CLAIMS_TARGET:-$REPO_ROOT/packages/core/templates/shared/AGENTS.md.template}"

# Count lines with auto-activate/auto-trigger that are:
#   - NOT CC-qualified (no "Claude Code" on the same line), AND
#   - NOT the fallback note itself ("do **not** auto-activate")
unqualified=$(grep -iE 'auto-activate|auto-trigger' "$TARGET" \
  | grep -v 'Claude Code' \
  | grep -cvE 'do \*\*not\*\* auto-activate' || true)

# Check that the non-CC fallback note is present in the ## Skills available block
has_fallback=$(grep -cE 'do \*\*not\*\* auto-activate' "$TARGET" || true)

if [ "${unqualified}" -gt 0 ] || [ "${has_fallback}" -lt 1 ]; then
  record doc-claims skill-autoactivation-qualified \
    "grep-unqualified-claims:${unqualified} fallback:${has_fallback}" 1 CC-ONLY
else
  record doc-claims skill-autoactivation-qualified \
    "grep-unqualified-claims:${unqualified} fallback:${has_fallback}" 0 PORTABLE
fi
