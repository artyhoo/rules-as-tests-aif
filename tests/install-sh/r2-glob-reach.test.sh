#!/usr/bin/env bash
# GH #507 (reopen) — R2 actually REACHES a brownfield / monorepo consumer.
#
# #511 wired the check-rule-globs.sh gate, but a live re-verify (timeliner, flat pnpm-monorepo)
# showed the gate fires loudly yet does not protect the consumer. Three gaps, each a silent-
# inertness failure on a real layout:
#   #1 CI-orphan — the gate is wired only into the SHIPPED ci.yml; copy_safe skips a pre-existing
#      ci.yml (brownfield) → the gate runs in NO CI job. FIX: post-install WARN when no workflow
#      under .github/workflows references the gate (non-destructive; consumer owns their CI).
#   #2 false-green vs per-package eslint configs — the gate found the WHOLE tree, ignoring ESLint
#      nearest-config resolution, so planting a boundary file under a shadowing package faked a
#      PASS while R2 stayed dead there. FIX: prune shadowed package subtrees from the root probe +
#      classify each shadowed package's own config (wired→silent / uncertain→WARN / dead→FAIL).
#   #3 globals — the shipped root eslint.config.mjs imports `globals`, absent from the installed
#      dev-deps → ERR_MODULE_NOT_FOUND on a strict (pnpm) install. FIX: add to CORE_DEVDEPS.
#
# PAIRED-NEGATIVE: every behavioral arm has a neg that flips the verdict (so a pass is non-vacuous).
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

install_into() { # $1 dir, $2 stack — clean --force install
  printf '{"name":"t507","version":"0.0.0"}\n' > "$1/package.json"
  ( cd "$1" && git init -q && bash "$REPO_ROOT/install.sh" "$2" --force ) >/dev/null 2>&1
}
# Run the SHIPPED gate (the installed copy, so we test what consumers get). Echoes output; rc via $?.
gate() { ( cd "$1" && ESLINT_CONFIG="$1/eslint.config.mjs" bash "$1/scripts/check-rule-globs.sh" ) 2>&1; }

# ══════════════════════════════════════════════════════════════════════════════
# #2 — false-green vs per-package eslint configs (the SHIPPED gate behaviour)
# ══════════════════════════════════════════════════════════════════════════════
# POS: a shadowing package (own config, no R2) with a PLANTED boundary file no longer fakes green.
T=$(mktemp -d); install_into "$T" ts-server
mkdir -p "$T/apps/api/src/routes"; echo 'export const x=1;' > "$T/apps/api/src/routes/u.ts"
printf 'export default [];\n' > "$T/apps/api/eslint.config.mjs"
OUT=$(gate "$T"); RC=$?
[ "$RC" = "1" ] \
  && ok "#2 POS: planted boundary file under a dead-config package → gate FAILS (false-green removed)" \
  || bad "#2 POS: gate exited $RC (should be 1 — planted file under a shadowing package still fakes a pass)"
printf '%s' "$OUT" | grep -q "apps/api: has boundary files but its own ESLint config does NOT wire R2" \
  && ok "#2 POS: names the dead-config package as silently inert" \
  || bad "#2 POS: no per-package inertness message (saw: $(printf '%s' "$OUT" | tail -2 | tr '\n' '|'))"
printf '%s' "$OUT" | grep -q "R2 no-unsafe-zod-parse (RULE_GLOBS.boundary): matches ≥1 source file" \
  && bad "#2 POS: still prints the false ✓ for R2 (the green-checkmark lie that the planted file caused)" \
  || ok "#2 POS: no false ✓ for R2 (a shadowed file no longer counts toward root coverage)"

# NEG-a (load-bearing): a package that RE-EXPORTS the root config → uncertain → WARN, never FAIL.
T2=$(mktemp -d); install_into "$T2" ts-server
mkdir -p "$T2/apps/api/src/routes"; echo 'export const x=1;' > "$T2/apps/api/src/routes/u.ts"
printf "import root from '../../eslint.config.mjs';\nexport default root;\n" > "$T2/apps/api/eslint.config.mjs"
OUT2=$(gate "$T2"); RC2=$?
[ "$RC2" = "0" ] \
  && ok "#2 NEG-a: re-export-of-root package does NOT fail the gate (no false-FAIL on a correct monorepo)" \
  || bad "#2 NEG-a: gate exited $RC2 on a re-export package (false-FAIL would break a correctly-wired monorepo)"
printf '%s' "$OUT2" | grep -q "⚠ apps/api" \
  && ok "#2 NEG-a: re-export package gets a WARN (unverifiable coverage surfaced, not failed)" \
  || bad "#2 NEG-a: no WARN for the re-export package"

# NEG-b (load-bearing): a package whose own config WIRES R2 → silent (no warn, no fail).
T3=$(mktemp -d); install_into "$T3" ts-server
mkdir -p "$T3/apps/api/src/routes"; echo 'export const x=1;' > "$T3/apps/api/src/routes/u.ts"
printf "import r from './r.ts';\nexport default [{plugins:{'rules-as-tests':r},rules:{'rules-as-tests/no-unsafe-zod-parse':'error'}}];\n" > "$T3/apps/api/eslint.config.mjs"
OUT3=$(gate "$T3"); RC3=$?
if [ "$RC3" = "0" ] && ! printf '%s' "$OUT3" | grep -q "apps/api"; then
  ok "#2 NEG-b: a package that wires R2 is silent (no spurious warn/fail)"
else
  bad "#2 NEG-b: rc=$RC3 / unexpected apps/api mention for a package that wires R2"
fi

# NEG-c (load-bearing): a monorepo with NO per-package config → prune must NOT fire (file still counts).
T4=$(mktemp -d); install_into "$T4" ts-server
mkdir -p "$T4/apps/api/src/routes"; echo 'export const x=1;' > "$T4/apps/api/src/routes/u.ts"
OUT4=$(gate "$T4"); RC4=$?
[ "$RC4" = "0" ] \
  && ok "#2 NEG-c: monorepo with NO per-package config → root R2 reaches apps/api (prune only fires on real shadows)" \
  || bad "#2 NEG-c: gate exited $RC4 — prune over-fired on a repo with no per-package configs"

# ══════════════════════════════════════════════════════════════════════════════
# #1 — CI-orphan WARN (brownfield ci.yml kept → gate unwired in CI)
# ══════════════════════════════════════════════════════════════════════════════
# NO --force: the brownfield scenario is the default skip-if-exists path that LEAVES the consumer's
# own ci.yml in place (--force would overwrite it → gate would be wired → nothing to warn about).
# </dev/null so the #483 dev-dep [y/N] gate reads empty stdin and defaults to "no" (non-interactive).
seed_install() { # $1 dir, $2 ci.yml body ("" = greenfield), $3 logfile; returns install rc
  printf '{"name":"t507","version":"0.0.0"}\n' > "$1/package.json"
  if [ -n "$2" ]; then mkdir -p "$1/.github/workflows"; printf '%s\n' "$2" > "$1/.github/workflows/ci.yml"; fi
  ( cd "$1" && git init -q && bash "$REPO_ROOT/install.sh" ts-server </dev/null ) > "$3" 2>&1
}
BROWNFIELD_CI=$'name: CI\njobs:\n  build:\n    steps:\n      - run: pnpm turbo run lint typecheck test'

# POS: pre-existing ci.yml that does NOT wire the gate → WARN + install rc=0 + ci.yml left intact
P=$(mktemp -d); LOG=$(mktemp); seed_install "$P" "$BROWNFIELD_CI" "$LOG"; RCP=$?
[ "$RCP" = "0" ] && ok "#1 POS: install exited 0 (CI-orphan warn never aborts)" || bad "#1 POS: install exited $RCP (warn block aborted install)"
grep -q "NOT into any workflow under .github/workflows" "$LOG" \
  && ok "#1 POS: brownfield ci.yml kept → gate-unwired-in-CI WARN printed" \
  || bad "#1 POS: no CI-orphan warn (saw: $(grep -i 'check-rule-globs\|workflow' "$LOG" | head -1))"
grep -q "turbo run lint" "$P/.github/workflows/ci.yml" \
  && ok "#1 POS: pre-existing ci.yml left intact (warn is non-destructive)" \
  || bad "#1 POS: install mutated the consumer's ci.yml (must be advisory only)"

# NEG (load-bearing): greenfield (no pre-existing ci.yml) → shipped ci.yml wires the gate → no warn
N=$(mktemp -d); LOGN=$(mktemp); seed_install "$N" "" "$LOGN"; RCN=$?
[ "$RCN" = "0" ] && ok "#1 NEG: greenfield install exited 0" || bad "#1 NEG: greenfield install exited $RCN"
grep -q "check-rule-globs.sh" "$N/.github/workflows/ci.yml" \
  && ok "#1 NEG: greenfield shipped ci.yml wires the gate" \
  || bad "#1 NEG: greenfield ci.yml missing the gate step"
grep -q "NOT into any workflow under .github/workflows" "$LOGN" \
  && bad "#1 NEG: CI-orphan warn fired on greenfield (false positive — the gate IS wired)" \
  || ok "#1 NEG: no CI-orphan warn on greenfield (gate wired by the shipped ci.yml)"

# ══════════════════════════════════════════════════════════════════════════════
# #3 — globals dev-dep (root eslint imports `globals`)
# ══════════════════════════════════════════════════════════════════════════════
# A non-interactive install defaults the dep-install to No and prints the manual DEVDEPS block;
# DEVDEPS is the single source for both the install command and that echo → globals must appear.
G=$(mktemp -d); LOGG=$(mktemp)
printf '{"name":"t507g","version":"0.0.0"}\n' > "$G/package.json"
( cd "$G" && git init -q && bash "$REPO_ROOT/install.sh" ts-server </dev/null ) > "$LOGG" 2>&1
grep -qw "globals" "$LOGG" \
  && ok "#3: installed dev-dep set includes 'globals' (the eslint.config.mjs import is satisfied)" \
  || bad "#3: 'globals' missing from the installed dev-dep set → ERR_MODULE_NOT_FOUND on strict installs"
# NEG (load-bearing): the predicate is word-bounded — it does not match a list lacking globals.
if grep -qw "globals" <<<"eslint typescript-eslint prettier vitest"; then
  bad "#3 NEG: predicate matched a dep list WITHOUT globals → vacuous"
else
  ok "#3 NEG: predicate rejects a dep list lacking globals (non-vacuous)"
fi

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
