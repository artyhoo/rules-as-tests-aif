#!/usr/bin/env bash
# gh-535-rule-enforced.test.sh — the +E deep gate (check-rule-enforced.sh) must catch the false-green
# where a per-package eslint config shadows the root R2 (so `turbo run lint` leaves R2 inert while
# validate/check:globs stay green), and must NOT false-fail a package that correctly re-exports root.
#
# GH #535 REOPEN: the first version of this gate (and this test's first version) ran `eslint
# --print-config` from the REPO ROOT and tested with a fake keyed on the file PATH. But ESLint v9
# resolves flat config by CWD — from root it loads the ROOT config (which wires R2), so a shadowed
# package whose own config does NOT wire R2 still reported "applied". `turbo run lint` runs `eslint .`
# from each PACKAGE dir, so the gate must resolve from the package's cwd too. The path-keyed fake
# could not model cwd-resolution and hid the bug. This rewrite tests CWD faithfully:
#   - Arm 1 (deterministic, no network): a CWD-AWARE fake that emits the rule iff the nearest
#     eslint.config at/above its $PWD wires it — exactly v9's behaviour. A gate that runs from root
#     sees the root config (rule present → false-green); the FIXED gate cd's into the package and
#     sees the package config (rule absent → FAIL). Also asserts the fake was invoked FROM the
#     package dir (direct proof of the cwd fix).
#   - Arm 2 (real eslint v9, skipped offline): the ground truth — only real eslint follows a
#     re-export-of-root import, so it is the only way to prove the no-false-fail (CASE B) arm.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
GATE="$REPO_ROOT/packages/core/audit-self/check-rule-enforced.sh"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# Root eslint.config.mjs with a RULE_GLOBS.boundary block (the gate parses it) wiring $1 on boundary.
write_root_cfg() { # $1=dir $2=rule
  cat > "$1/eslint.config.mjs" <<CFG
const RULE_GLOBS = {
  boundary: ['**/routes/**/*.{ts,tsx}'],
};
export default [{ files: RULE_GLOBS.boundary, rules: { '$2': 'error' } }];
CFG
}

# ── Arm 1: CWD-AWARE fake — proves the gate resolves from the package cwd (not root) ──
FAKE=$(mktemp)
cat > "$FAKE" <<'ES'
#!/bin/sh
echo "$PWD" >> "$AIF_FAKE_CWD_LOG"
[ "$1" = "--print-config" ] || exit 0
d=$PWD
while [ -n "$d" ] && [ "$d" != "/" ]; do
  for c in eslint.config.mjs eslint.config.js eslint.config.cjs eslint.config.ts; do
    if [ -f "$d/$c" ]; then
      if grep -q "$AIF_FAKE_RULE" "$d/$c"; then printf '{ "rules": { "%s": [2] } }\n' "$AIF_FAKE_RULE"; else printf '{ "rules": {} }\n'; fi
      exit 0
    fi
  done
  d=$(dirname "$d")
done
printf '{ "rules": {} }\n'
ES
chmod +x "$FAKE"

A=$(mktemp -d); mkdir -p "$A/apps/api/src/routes"
write_root_cfg "$A" no-console
printf "export default [{ files: ['**/*.{ts,tsx}'], rules: {} }];\n" > "$A/apps/api/eslint.config.mjs"
printf 'export const x = 1;\n' > "$A/apps/api/src/routes/probe.ts"
CWDLOG="$A.cwdlog"; : > "$CWDLOG"
( cd "$A" && AIF_ESLINT_CMD="$FAKE" AIF_ENFORCED_RULE=no-console AIF_FAKE_RULE=no-console AIF_FAKE_CWD_LOG="$CWDLOG" bash "$GATE" ) >/tmp/g535a.$$ 2>&1
rc=$?
[ "$rc" -ne 0 ] && ok "Arm1: shadowed pkg config lacks the rule → gate FAILS (false-green caught)" || bad "Arm1: gate PASSED a shadowed pkg with the rule inert (cwd bug — #535 reopen)"
grep -qE '/apps/api$' "$CWDLOG" && ok "Arm1: gate invoked print-config FROM the package dir (apps/api) — cwd fix present" || bad "Arm1: gate never ran from apps/api (still resolving from root → the #535 bug)"

# ── Arm 1b (paired-negative): shadowed pkg DOES wire the rule → gate PASSES (no false-fail) ──
B=$(mktemp -d); mkdir -p "$B/apps/api/src/routes"
write_root_cfg "$B" no-console
printf "export default [{ files: ['**/routes/**/*.{ts,tsx}'], rules: { 'no-console': 'error' } }];\n" > "$B/apps/api/eslint.config.mjs"
printf 'export const x = 1;\n' > "$B/apps/api/src/routes/probe.ts"
: > "$B.cwdlog"
if ( cd "$B" && AIF_ESLINT_CMD="$FAKE" AIF_ENFORCED_RULE=no-console AIF_FAKE_RULE=no-console AIF_FAKE_CWD_LOG="$B.cwdlog" bash "$GATE" ) >/tmp/g535b.$$ 2>&1; then
  ok "Arm1b neg: shadowed pkg wires the rule → gate PASSES (no false-fail on a correct package config)"
else
  bad "Arm1b neg: gate FAILED a package that DOES wire the rule"
fi

# ── Arm 2 (real eslint v9 — the ground truth; skipped when offline): CASE A FAIL + CASE B (re-export) PASS ──
ESV9=$(mktemp -d)
if ( cd "$ESV9" && printf '{"name":"e","private":true}\n' > package.json && npm i eslint@9 --no-save --silent >/dev/null 2>&1 ); then
  mkdir -p "$ESV9/apps/api/src/routes"; write_root_cfg "$ESV9" no-console
  printf 'export const x = 1;\n' > "$ESV9/apps/api/src/routes/probe.ts"
  # CASE A — self-contained pkg config without the rule → FAIL
  printf "export default [{ files: ['**/*.{ts,tsx}'], rules: {} }];\n" > "$ESV9/apps/api/eslint.config.mjs"
  ( cd "$ESV9" && AIF_ENFORCED_RULE=no-console bash "$GATE" ) >/tmp/g535r.$$ 2>&1
  [ $? -ne 0 ] && ok "Arm2 (real eslint v9): shadowed pkg without rule → gate FAILS" || bad "Arm2 (real eslint v9): gate PASSED an inert shadowed pkg (cwd bug survives on real eslint)"
  # CASE B — pkg RE-EXPORTS root (real eslint follows the import) → PASS (no false-fail)
  printf "export { default } from '../../eslint.config.mjs';\n" > "$ESV9/apps/api/eslint.config.mjs"
  if ( cd "$ESV9" && AIF_ENFORCED_RULE=no-console bash "$GATE" ) >/tmp/g535r2.$$ 2>&1; then
    ok "Arm2 (real eslint v9): pkg re-exports root → gate PASSES (only real eslint follows the import)"
  else
    bad "Arm2 (real eslint v9): gate false-failed a re-export-of-root package"
  fi
else
  echo "  · Arm2 skipped — could not install eslint@9 (offline); Arm1 (cwd-aware fake) still proves the fix."
fi

# ── Arm 3: no boundary files → graceful skip ──
C=$(mktemp -d); write_root_cfg "$C" no-console; mkdir -p "$C/src/lib"; printf 'export const y = 2;\n' > "$C/src/lib/u.ts"
if ( cd "$C" && AIF_ESLINT_CMD="$FAKE" AIF_FAKE_CWD_LOG=/dev/null bash "$GATE" ) >/tmp/g535c.$$ 2>&1 && grep -qi 'nothing for R2 to govern\|nothing to verify' /tmp/g535c.$$; then
  ok "Arm3: no boundary files → gate skips (exit 0)"
else
  bad "Arm3: gate did not skip with no boundary files ($(tr '\n' ';' </tmp/g535c.$$))"
fi

# ── Arm 4: eslint absent → graceful skip ──
D=$(mktemp -d); write_root_cfg "$D" no-console; mkdir -p "$D/apps/api/src/routes"; printf "export default [];\n" > "$D/apps/api/eslint.config.mjs"; printf 'export const x=1;\n' > "$D/apps/api/src/routes/p.ts"
if ( cd "$D" && env -u AIF_ESLINT_CMD PATH="/nonexistent" /bin/bash "$GATE" ) >/tmp/g535d.$$ 2>&1; then
  ok "Arm4: eslint absent → gate skips (exit 0)"
else
  bad "Arm4: gate hard-failed when eslint absent ($(tr '\n' ';' </tmp/g535d.$$))"
fi

rm -f "$FAKE" /tmp/g535a.$$ /tmp/g535b.$$ /tmp/g535r.$$ /tmp/g535r2.$$ /tmp/g535c.$$ /tmp/g535d.$$ 2>/dev/null
echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
