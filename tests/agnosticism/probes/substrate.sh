#!/usr/bin/env bash
# Surface 1 — substrate configs must be CC-independent. Standing evidence: these gates already run
# green in GitHub Actions CI, a CC-absent env (no CLAUDE_*, no `claude` binary). This probe adds:
# no CLAUDE_/ANTHROPIC coupling in the shipped substrate configs, and the portable pre-push fallback.
set -uo pipefail
# Resolve by path, not `git rev-parse` — GIT_DIR-immune for worktree-push hook env (see ../run-audit.sh).
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
source "$REPO_ROOT/tests/agnosticism/_cc-absent-lib.sh"

configs=$(git -C "$REPO_ROOT" ls-files | grep -E 'eslint\.config|vitest\.config|dependency-cruiser|stryker\.config|tsconfig|\.lintstagedrc' || true)
hits=0
for c in $configs; do grep -qE 'CLAUDE_|ANTHROPIC' "$REPO_ROOT/$c" 2>/dev/null && { hits=$((hits+1)); echo "  coupled: $c" >&2; }; done
record substrate config-cc-coupling "grep CLAUDE_/ANTHROPIC in substrate configs" "$hits" "$([ "$hits" -eq 0 ] && echo PORTABLE || echo CC-ONLY)"

fb="$REPO_ROOT/packages/core/hooks/pre-push.fallback.sh"
if [ -f "$fb" ] && head -1 "$fb" | grep -q 'bash'; then
  record substrate pre-push-fallback "pre-push.fallback.sh bash shebang" 0 PORTABLE
else
  record substrate pre-push-fallback "pre-push.fallback.sh present+bash" 1 DEGRADED
fi
