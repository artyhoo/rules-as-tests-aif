#!/usr/bin/env bash
# cih-s1 F1 — "ship the dispatcher's TS arm". The shipped dispatcher
# (packages/core/templates/shared/husky-pre-push.sh) execs
# `$REPO_ROOT/packages/core/hooks/pre-push.ts` when Node≥20 + that file is present,
# else falls to the bash fallback. Before this fix install.sh shipped only the
# fallback, so the TS arm was unreachable in every consumer install. This test runs
# the REAL install pipeline and asserts pre-push.ts + its bounded static import
# closure land under packages/core/hooks/ with the relative layout the dispatcher
# resolves. PAIRED-NEGATIVE: the fallback must still land (we ADD the TS arm, we
# don't replace it) AND the dynamically-import()ed guard-liveness.ts must NOT ship
# (it degrades gracefully when absent) — that negative arm proves the closure is
# bounded, not "ship everything".
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

T=$(mktemp -d)
printf '{ "name": "f1t", "version": "0.0.0" }\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1

H="$T/packages/core/hooks"

# TS-core entrypoint the dispatcher execs
[ -f "$H/pre-push.ts" ] && ok "pre-push.ts shipped (dispatcher TS arm reachable)" || bad "pre-push.ts missing"

# Bounded static import closure (re-derived to fixpoint)
[ -f "$H/utils/run-check.ts" ]  && ok "utils/run-check.ts shipped"  || bad "utils/run-check.ts missing"
[ -f "$H/utils/git.ts" ]        && ok "utils/git.ts shipped"        || bad "utils/git.ts missing"
[ -f "$H/checks/prior-art.ts" ] && ok "checks/prior-art.ts shipped" || bad "checks/prior-art.ts missing"
[ -f "$H/checks/s17.ts" ]       && ok "checks/s17.ts shipped"       || bad "checks/s17.ts missing"

# PAIRED-NEGATIVE arm 1 — fallback still lands (TS arm is additive, not a replacement)
[ -f "$H/pre-push.fallback.sh" ] && ok "neg: bash fallback still shipped (TS arm is additive)" || bad "neg: fallback lost"

# PAIRED-NEGATIVE arm 2 — guard-liveness.ts must NOT ship (dynamically imported, degrades gracefully)
[ ! -f "$H/checks/guard-liveness.ts" ] && ok "neg: guard-liveness.ts NOT shipped (closure bounded)" || bad "neg: guard-liveness.ts leaked — closure not bounded"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
