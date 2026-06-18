#!/usr/bin/env bash
# meta-all-wired.test.sh — EVERY tests/install-sh/*.test.sh must be wired into audit-self.yml.
#
# Closes the recurring "armed-but-not-fired" class: a test file that exists but is never invoked by
# CI is a false-green — by the project's thesis a rule must fail at the earliest reachable channel,
# and a test wired at NO channel fails at none. Found repeatedly: #540 shipped gh-531's test without
# wiring it (fixed in #543); the #531 audit then found gh-534 / gh-535 / c1-wiring / ship-orchestration
# -skills all present-but-unwired. This gate makes the omission impossible to reland silently.
#
# Deterministic, no network: pure grep over the workflow + ls of the test dir.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
WF="$REPO_ROOT/.github/workflows/audit-self.yml"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

[ -f "$WF" ] || { echo "FATAL: $WF not found"; exit 1; }

# Every install-sh test file MUST appear as a `run: bash tests/install-sh/<name>` step.
missing=""
for f in "$REPO_ROOT"/tests/install-sh/*.test.sh; do
  base=$(basename "$f")
  grep -qF "tests/install-sh/$base" "$WF" || missing="$missing $base"
done
[ -z "$missing" ] \
  && ok "every tests/install-sh/*.test.sh is wired in audit-self.yml (no armed-but-not-fired)" \
  || bad "install-sh test(s) NOT wired in audit-self.yml →$missing"

# NEG (LOAD-BEARING, non-vacuity): remove one test's wiring from a workflow COPY → the gate MUST
# flip to detect it missing. Proves the check actually catches an unwired test, not vacuously green.
probe=$(basename "$(ls "$REPO_ROOT"/tests/install-sh/*.test.sh | head -1)")
tmpwf=$(mktemp)
grep -vF "tests/install-sh/$probe" "$WF" > "$tmpwf"
neg_missing=""
for f in "$REPO_ROOT"/tests/install-sh/*.test.sh; do
  base=$(basename "$f")
  grep -qF "tests/install-sh/$base" "$tmpwf" || neg_missing="$neg_missing $base"
done
case "$neg_missing" in
  *" $probe"*|"$probe"*|*" $probe") ok "neg: removing $probe's wiring flips the gate to detect it missing (non-vacuous)" ;;
  *) bad "neg: gate stayed green with $probe unwired → VACUOUS" ;;
esac
rm -f "$tmpwf"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
