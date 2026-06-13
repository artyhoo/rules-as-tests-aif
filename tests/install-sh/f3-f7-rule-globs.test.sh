#!/usr/bin/env bash
# cih-s3 F3 + F7 + V — custom-rule glob liveness across project layouts.
#
# THE BUG (F3): the shipped eslint configs scoped R2/R7/R8 to `src/`+DDD globs
# (`src/web/handlers`, `src/application`, …). On a flat Hono server or a pnpm monorepo
# those match ZERO files → the rule is SILENTLY INERT ("armed, checks nothing").
# THE FIX (F3): layout-agnostic globs (`**/handlers/**`, `**/routes/**`, `**/app/api/**`,
#   monorepo `apps/*`/`packages/*` reached via `**/`) so the shields fire on flat, layered,
#   AND monorepo shapes.
# THE FIX (F7): R7/R8 demand infra (Clock/Random, OTel) a fresh skeleton lacks → deferred
#   unless AIF_STRICT_RUNTIME=1. R2 stays unconditional.
# THE BACKSTOP (V, maintainer DN-1 "A+V"): scripts/check-rule-globs.sh FAILS if an ACTIVE
#   rule matches zero source files — the alarm for a layout the broad globs still miss.
#
# SCOPE NOTE (T3, avoid the "0 matches" trap): that a rule FIRES on a `.parse()` is covered
# by the rule's own RuleTester unit test (packages/core/eslint-rules/no-unsafe-zod-parse.test.ts
# `invalid:`). THIS probe proves the orthogonal F3 concern — the globs REACH the right files on
# each layout — via the shipped V-gate (positive: reaches a flat/monorepo handler; negative:
# alarms when a layout is uncovered). A full `eslint .` run needs the consumer toolchain and is
# out of this light harness; the glob-reach + the unit test together cover "the rule is live".
#
# PAIRED-NEGATIVE: every behavioral arm has a neg that flips the V-gate verdict.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

install_into() { # $1 = dir, $2 = stack
  printf '{ "name":"t","version":"0.0.0" }\n' > "$1/package.json"
  ( cd "$1" && git init -q && bash "$REPO_ROOT/install.sh" "$2" --force ) >/dev/null 2>&1
}

# ── ts-server: shipped config is layout-agnostic + R7/R8 opt-in (F3 + F7 structure) ──
T=$(mktemp -d); install_into "$T" ts-server
CFG="$T/eslint.config.mjs"
[ -f "$CFG" ] || bad "ts-server: eslint.config.mjs not installed"

grep -q "RULE_GLOBS" "$CFG" \
  && ok "F3 ts-server: RULE_GLOBS constant shipped" \
  || bad "F3 ts-server: no RULE_GLOBS constant"
grep -qE "'\*\*/handlers/\*\*|'\*\*/routes/\*\*" "$CFG" \
  && ok "F3 ts-server: boundary globs are layout-agnostic (**/handlers, **/routes)" \
  || bad "F3 ts-server: boundary globs are not layout-agnostic"
# the old inert glob (src-anchored web/handlers as the ONLY boundary) must be gone
grep -q "'src/web/handlers/\*\*/\*.{ts,tsx}'" "$CFG" \
  && bad "F3 ts-server: old src/-anchored boundary glob still present (inert on flat/monorepo)" \
  || ok "F3 ts-server: src/-anchored-only boundary glob removed"
grep -q "STRICT_RUNTIME" "$CFG" && grep -q "AIF_STRICT_RUNTIME" "$CFG" \
  && ok "F7 ts-server: R7/R8 gated behind AIF_STRICT_RUNTIME" \
  || bad "F7 ts-server: no AIF_STRICT_RUNTIME gating"

CHK="$T/scripts/check-rule-globs.sh"
[ -x "$CHK" ] || bad "V: scripts/check-rule-globs.sh not shipped/executable"

# ── F3 behavioral: globs REACH a flat-Hono handler (was zero before the fix) ──
mkdir -p "$T/src/routes"; echo 'export const x = 1;' > "$T/src/routes/users.ts"
( cd "$T" && ESLINT_CONFIG="$CFG" bash "$CHK" ) >/dev/null 2>&1 \
  && ok "F3 behavioral (flat): R2 globs reach src/routes/ handler (V-gate green)" \
  || bad "F3 behavioral (flat): R2 globs do NOT reach a flat handler — still inert"

# ── F3 behavioral: monorepo shape (apps/*/src/handlers) ──
T2=$(mktemp -d); install_into "$T2" ts-server
mkdir -p "$T2/apps/api/src/handlers"; echo 'export const x = 1;' > "$T2/apps/api/src/handlers/h.ts"
( cd "$T2" && ESLINT_CONFIG="$T2/eslint.config.mjs" bash "$T2/scripts/check-rule-globs.sh" ) >/dev/null 2>&1 \
  && ok "F3 behavioral (monorepo): R2 globs reach apps/api/src/handlers (V-gate green)" \
  || bad "F3 behavioral (monorepo): R2 globs do NOT reach a monorepo handler"

# ── F3 NEG (load-bearing): source present but no boundary dir → V-gate alarms ──
T3=$(mktemp -d); install_into "$T3" ts-server
mkdir -p "$T3/src"; echo 'export const x = 1;' > "$T3/src/index.ts"
if ( cd "$T3" && ESLINT_CONFIG="$T3/eslint.config.mjs" bash "$T3/scripts/check-rule-globs.sh" ) >/dev/null 2>&1; then
  bad "F3 NEG: code present but no boundary dir, yet V-gate stayed green → VACUOUS"
else
  ok "F3 NEG: code present, no boundary dir → V-gate alarms (non-vacuous)"
fi

# ── F7: default install does NOT require R7/R8 (deferred); strict mode DOES ──
# Fixture has boundary (src/routes) but no application/ layer → R8 inert.
T4=$(mktemp -d); install_into "$T4" ts-server
mkdir -p "$T4/src/routes"; echo 'export const x = 1;' > "$T4/src/routes/u.ts"
( cd "$T4" && ESLINT_CONFIG="$T4/eslint.config.mjs" bash "$T4/scripts/check-rule-globs.sh" ) >/dev/null 2>&1 \
  && ok "F7 default: R7/R8 not required (deferred) — V-gate green with only boundary code" \
  || bad "F7 default: V-gate failed without AIF_STRICT_RUNTIME → R7/R8 not actually deferred"
# F7 NEG (load-bearing): turning strict ON must newly require R8 (application layer absent → fail)
if ( cd "$T4" && AIF_STRICT_RUNTIME=1 ESLINT_CONFIG="$T4/eslint.config.mjs" bash "$T4/scripts/check-rule-globs.sh" ) >/dev/null 2>&1; then
  bad "F7 NEG: AIF_STRICT_RUNTIME=1 but V-gate stayed green with no application/ layer → toggle inert"
else
  ok "F7 NEG: AIF_STRICT_RUNTIME=1 newly requires R8 (application absent → alarms) — toggle is real"
fi

# ── react-next: same fix on its OWN globs (T-S3-C: not cloned from ts-server) ──
TR=$(mktemp -d); install_into "$TR" react-next
RCFG="$TR/eslint.config.mjs"
grep -q "RULE_GLOBS" "$RCFG" && grep -q "AIF_STRICT_RUNTIME" "$RCFG" \
  && ok "F3/F7 react-next: RULE_GLOBS + AIF_STRICT_RUNTIME present" \
  || bad "F3/F7 react-next: glob/strict fix missing from react config"
grep -qE "'\*\*/app/api/\*\*|'\*\*/actions/\*\*" "$RCFG" \
  && ok "F3 react-next: Next boundary globs are layout-agnostic (**/app/api, **/actions)" \
  || bad "F3 react-next: react boundary globs not layout-agnostic"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
