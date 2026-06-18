#!/usr/bin/env bash
set -uo pipefail
# Resolve REPO_ROOT by path, NOT `git rev-parse`: during a `git push` from a
# worktree, git exports GIT_DIR/GIT_COMMON_DIR into the pre-push hook env, which
# makes `git rev-parse --show-toplevel` misresolve and write the record to the
# wrong checkout. This harness lives at <root>/tests/agnosticism/run-audit.sh,
# so two levels up from its own dir is the repo root — matching how the vitest
# companion (packages/core/principles/21-agnosticism-conformance.test.ts) resolves
# its path purely from file location. Keep it git-free so the hook env can't pollute it.
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export RECORD_FILE="$REPO_ROOT/tests/agnosticism/conformance-record.tsv"
: > "$RECORD_FILE"
printf 'surface\tprobe\tcmd\texit\tverdict\n' >> "$RECORD_FILE"
for p in "$REPO_ROOT"/tests/agnosticism/probes/*.sh; do bash "$p"; done
echo "── conformance record ──"; column -t -s$'\t' "$RECORD_FILE"
echo ""; echo "── non-PORTABLE findings (deterministic half) ──"
grep -vE '\tPORTABLE$' "$RECORD_FILE" | grep -v '^surface' || echo "(none)"
