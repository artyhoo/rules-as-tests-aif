#!/usr/bin/env bash
# cih-s1 F1 — "ship the dispatcher's TS arm". The shipped dispatcher
# (packages/core/templates/shared/husky-pre-push.sh) execs
# `$REPO_ROOT/packages/core/hooks/pre-push.ts` when Node≥20 + that file is present,
# else falls to the bash fallback. Before this fix install.sh shipped only the
# fallback, so the TS arm was unreachable in every consumer install. This test runs
# the REAL install pipeline and asserts pre-push.ts + its COMPLETE import closure
# (static AND dynamic await-import() targets) land under packages/core/hooks/ with
# the relative layout the dispatcher resolves. PAIRED-NEGATIVE: the bash fallback
# must still land (we ADD the TS arm, we don't replace it). Per GH #735 the
# dynamically-import()ed guard-liveness.ts / cmd-script-liveness.ts die()/push-block
# when absent (NOT graceful) — so the COMPLETE graph must ship, including the
# eslint-rules barrel guard-liveness.ts transitively needs.
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

# GH #532 — the hooks-scoped {"type":"module"} marker must ship so the ESM-authored pre-push.ts
# loads as ESM in the consumer (whose root package.json — here "f1t", no "type" — defaults to CJS).
# Without it tsx's require(esm) bridge dies with ERR_REQUIRE_CYCLE_MODULE on Node ≥22, before any
# check runs. Structural assertion (catchable on CI's Node 20, where the runtime crash itself isn't).
[ -f "$H/package.json" ] && grep -q '"type"[[:space:]]*:[[:space:]]*"module"' "$H/package.json" \
  && ok "GH#532: hooks/package.json ships with type:module (ESM-loads the shipped .ts hook)" \
  || bad "GH#532: hooks/package.json missing or lacks type:module — shipped pre-push.ts will load as CJS and crash on Node ≥22"

# PAIRED-NEGATIVE arm 1 — fallback still lands (TS arm is additive, not a replacement)
[ -f "$H/pre-push.fallback.sh" ] && ok "neg: bash fallback still shipped (TS arm is additive)" || bad "neg: fallback lost"

# Static import added in GH #735 — its absence is the ERR_MODULE_NOT_FOUND headline (crashes at load).
[ -f "$H/checks/unpinned-tool-install.ts" ] && ok "checks/unpinned-tool-install.ts shipped (static import — #735 crash headline)" || bad "checks/unpinned-tool-install.ts missing — ERR_MODULE_NOT_FOUND at load"

# Dynamic await-import() targets — per GH #735 these die()/push-block when absent (NOT graceful),
# so the COMPLETE graph must ship. (Supersedes the old "bounded static-only closure" negative arm.)
[ -f "$H/checks/guard-liveness.ts" ]      && ok "checks/guard-liveness.ts shipped (dynamic import — die() when its gate fires)"      || bad "checks/guard-liveness.ts missing — pre-push die()s/push-blocks"
[ -f "$H/checks/cmd-script-liveness.ts" ] && ok "checks/cmd-script-liveness.ts shipped (dynamic import — die() when its gate fires)" || bad "checks/cmd-script-liveness.ts missing — pre-push die()s/push-blocks"

# Transitive dep of guard-liveness.ts (../../eslint-rules/index.ts) — barrel must ship or guard-liveness die()s on load.
[ -f "$H/../eslint-rules/index.ts" ] && ok "eslint-rules/index.ts barrel shipped (guard-liveness transitive dep)" || bad "eslint-rules/index.ts missing — guard-liveness die()s on load"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
