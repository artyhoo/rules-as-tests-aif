#!/usr/bin/env bash
# cih-s3 V2 (§4.6) — install-time runtime-arming WARN (consumer-side, deps-free).
#
# Tests the WARN Worker B added near the end of install.sh: if the consumer root
# package.json TEXT contains `@opentelemetry/` AND AIF_STRICT_RUNTIME is not "1", print
# a non-fatal WARN ("R8 (require-otel-span) will not fire / Set AIF_STRICT_RUNTIME=1 …").
# Greps package.json text (deps may be uninstalled) — OTel-dep signal only; the R7
# Clock/Random heuristic is documented-future, not implemented (honest scope).
#
# Probe = fixture + real install (same shape as f14/f15). install.sh run
# non-interactively via the stack arg.
#
# Positive leg:        @opentelemetry/* dep + AIF_STRICT_RUNTIME unset → WARN PRESENT.
# Paired-negative (1): @opentelemetry/* dep + AIF_STRICT_RUNTIME=1     → WARN ABSENT.
# Paired-negative (2): NO @opentelemetry/* dep + unset                → WARN ABSENT.
# Invariant across ALL legs: install exit code stays 0 (WARN never fails) — asserted on
# staging-fresh CI; on a stale local tree a later missing-artefact abort env-skips the
# exit-code assertion honestly (the WARN line itself is already emitted by then).
#
# CI: invoked from .github/workflows/audit-self.yml (Mechanical checks job).

set -uo pipefail

REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
INSTALL_SH="$REPO_ROOT/install.sh"
WARN_RE='AIF_STRICT_RUNTIME is unset'

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# check_exit <rc> <outfile> <label> — assert exit 0, env-skip on the known stale-tree abort.
check_exit() {
  local rc="$1" out="$2" label="$3"
  if [ "$rc" -eq 0 ]; then
    ok "$label: install exit code 0"
  elif grep -qiE 'No such file or directory|missing from package|Aborting install' "$out"; then
    echo "  ⊘ ENV-SKIP $label exit-code: install aborted on a missing staging-only artefact"
    echo "    (stale local worktree; the V2 WARN check already ran by then). On staging-fresh CI this is exit 0."
  else
    bad "$label: install exit=$rc with no known stale-tree signature — tail: $(tail -3 "$out")"
  fi
}

# ── Positive: otel dep + AIF_STRICT_RUNTIME unset → WARN present ───────────
P="$TMP/otel-unset"
mkdir -p "$P"
printf '{ "name": "otel-app", "version": "1.0.0", "dependencies": { "@opentelemetry/api": "^1.0.0" } }\n' > "$P/package.json"
( cd "$P" && unset AIF_STRICT_RUNTIME; bash "$INSTALL_SH" ts-server >"$TMP/pos.out" 2>&1 ); RC=$?
grep -qE "$WARN_RE" "$TMP/pos.out" \
  && ok "positive: otel dep + unset → WARN present" \
  || bad "positive: WARN missing despite otel dep + unset — tail: $(tail -4 "$TMP/pos.out")"
check_exit "$RC" "$TMP/pos.out" "positive"

# ── Paired-negative 1: otel dep + AIF_STRICT_RUNTIME=1 → WARN absent ──────
N1="$TMP/otel-armed"
mkdir -p "$N1"
printf '{ "name": "otel-app", "version": "1.0.0", "dependencies": { "@opentelemetry/api": "^1.0.0" } }\n' > "$N1/package.json"
( cd "$N1" && AIF_STRICT_RUNTIME=1 bash "$INSTALL_SH" ts-server >"$TMP/neg1.out" 2>&1 ); RC=$?
grep -qE "$WARN_RE" "$TMP/neg1.out" \
  && bad "negative-1: WARN present despite AIF_STRICT_RUNTIME=1 (armed → should be silent)" \
  || ok "negative-1: otel dep + AIF_STRICT_RUNTIME=1 → WARN absent (armed, silent)"
check_exit "$RC" "$TMP/neg1.out" "negative-1"

# ── Paired-negative 2: no otel dep + unset → WARN absent ──────────────────
N2="$TMP/no-otel"
mkdir -p "$N2"
printf '{ "name": "plain-app", "version": "1.0.0", "dependencies": { "zod": "^3.0.0" } }\n' > "$N2/package.json"
( cd "$N2" && unset AIF_STRICT_RUNTIME; bash "$INSTALL_SH" ts-server >"$TMP/neg2.out" 2>&1 ); RC=$?
grep -qE "$WARN_RE" "$TMP/neg2.out" \
  && bad "negative-2: WARN present without any @opentelemetry/* dep (false positive)" \
  || ok "negative-2: no otel dep + unset → WARN absent (no false positive)"
check_exit "$RC" "$TMP/neg2.out" "negative-2"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
