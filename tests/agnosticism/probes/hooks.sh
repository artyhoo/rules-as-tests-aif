#!/usr/bin/env bash
# Surface 4 — shipped git hooks must fire via git (core.hooksPath=.husky), not a CC event,
# and must carry no CLAUDE_*/claude coupling in their bodies.
set -uo pipefail
# Resolve by path, not `git rev-parse` — GIT_DIR-immune for worktree-push hook env (see ../run-audit.sh).
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
source "$REPO_ROOT/tests/agnosticism/_cc-absent-lib.sh"

for h in .husky/pre-commit .husky/pre-push; do
  if [ -f "$REPO_ROOT/$h" ]; then
    if grep -qE 'CLAUDE_|(^|[^a-z])claude ' "$REPO_ROOT/$h"; then
      record hooks "$h" "grep CC coupling in $h" 1 CC-ONLY
    else
      record hooks "$h" "grep CC coupling in $h" 0 PORTABLE
    fi
  else
    record hooks "$h" "$h exists" 1 DEGRADED
  fi
done
