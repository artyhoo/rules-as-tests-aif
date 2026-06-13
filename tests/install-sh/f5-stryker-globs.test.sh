#!/usr/bin/env bash
# cih-s3 F5 — stryker mutate globs are layout-agnostic.
# THE BUG: `mutate: ["src/**/*.{ts,tsx}", ...]` + Next-app-router exclusions. On a monorepo
# (no root src/) → ZERO mutants; the Next exclusions reference files a generic server lacks.
# S1/F13's patch only rewrote `packageManager`, never `mutate`.
# THE FIX: broaden mutate to cover flat (src/, lib/) AND monorepo (apps/*/src, packages/*/src),
# with path-agnostic exclusions (`!**/...`) so they apply under every root.
#
# PAIRED-NEGATIVE: the neg arm strips the monorepo root from a copy of the shipped config and
# re-runs the SAME grep — it MUST flip to a miss (proves the positive check is non-vacuous).
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

T=$(mktemp -d)
printf '{ "name":"t","version":"0.0.0" }\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
CFG="$T/stryker.config.json"
[ -f "$CFG" ] || bad "stryker.config.json not installed"

# pos-1: monorepo roots present in mutate
grep -q '"apps/\*/src/\*\*/\*.{ts,tsx}"' "$CFG" && grep -q '"packages/\*/src/\*\*/\*.{ts,tsx}"' "$CFG" \
  && ok "F5 pos: mutate covers monorepo roots (apps/*/src, packages/*/src)" \
  || bad "F5 pos: mutate missing monorepo roots — zero mutants on a monorepo"

# pos-2: exclusions are path-agnostic (apply under any root), not src/-anchored only
grep -q '"!\*\*/\*.unit.{ts,tsx}"' "$CFG" \
  && ok "F5 pos: exclusions are path-agnostic (!**/*.unit.{ts,tsx})" \
  || bad "F5 pos: exclusions still src/-anchored — won't apply under apps/*/packages/*"
grep -q '"!src/\*\*/\*.unit.{ts,tsx}"' "$CFG" \
  && bad "F5 pos: old src/-anchored exclusion still present" \
  || ok "F5 pos: src/-anchored-only exclusions removed"

# neg (LOAD-BEARING): strip the monorepo root from a copy → pos-1 grep MUST miss
cp "$CFG" "$CFG.neg"
grep -v 'apps/\*/src' "$CFG" > "$CFG.neg"
if grep -q '"apps/\*/src/\*\*/\*.{ts,tsx}"' "$CFG.neg"; then
  bad "F5 neg: stripped apps/*/src but grep still matched → VACUOUS"
else
  ok "F5 neg: removing apps/*/src flips pos-1 grep to miss (non-vacuous)"
fi
rm -f "$CFG.neg"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
