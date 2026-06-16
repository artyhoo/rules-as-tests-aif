#!/usr/bin/env bash
# detect-r2-boundary.test.sh — GH #547 Point 2 C1. Unit-tests the boundary classifier's verdict
# logic against crafted temp repos. PAIRED-NEGATIVE: every positive arm has a neg that flips it.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PROBE="$REPO_ROOT/packages/core/audit-self/detect-r2-boundary.sh"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# Run the classifier with cwd=$1; echo verdict (first stdout line).
verdict() { ( cd "$1" && bash "$PROBE" 2>/dev/null | head -1 ); }
# Full output (verdict + glob: lines).
full()    { ( cd "$1" && bash "$PROBE" 2>/dev/null ); }
mkrepo()  { local d; d=$(mktemp -d); printf '{"name":"x","version":"0.0.0"}\n' > "$d/package.json"; printf '%s' "$d"; }

# ── boundary-present: a routes/ token folder ──────────────────────────────────
T=$(mkrepo); mkdir -p "$T/src/routes"; echo 'export const r=1;' > "$T/src/routes/users.ts"
[ "$(verdict "$T")" = "boundary-present" ] \
  && ok "token folder (routes/) → boundary-present" \
  || bad "token folder (routes/) → got '$(verdict "$T")'"

# ── boundary-present: a non-stdlib .parse( in a non-token folder ──────────────
T=$(mkrepo); mkdir -p "$T/src/api"; echo 'export const h=(b)=>schema.parse(b);' > "$T/src/api/x.ts"
[ "$(verdict "$T")" = "boundary-present" ] \
  && ok "schema.parse( in src/api → boundary-present" \
  || bad "schema.parse( → got '$(verdict "$T")'"
full "$T" | grep -qF "glob:**/api/**/*.{ts,tsx}" \
  && ok "parse-site outside a token folder → emits a covering parent-dir glob (**/api/**)" \
  || bad "parse-site → no covering glob emitted (got: $(full "$T" | tr '\n' '|'))"

# ── boundary-present: .safeParse( present ─────────────────────────────────────
T=$(mkrepo); mkdir -p "$T/src"; echo 'export const h=(b)=>schema.safeParse(b);' > "$T/src/h.ts"
[ "$(verdict "$T")" = "boundary-present" ] \
  && ok ".safeParse( → boundary-present (R2 must still guard it)" \
  || bad ".safeParse( → got '$(verdict "$T")'"

# ── no-boundary-confident: allowlisted framework, zero boundary signals ───────
T=$(mktemp -d)
printf '{"name":"x","version":"0.0.0","dependencies":{"@hono/zod-openapi":"^0.9.0"}}\n' > "$T/package.json"
mkdir -p "$T/src"; echo 'export const app = 1;' > "$T/src/app.ts"
[ "$(verdict "$T")" = "no-boundary-confident" ] \
  && ok "allowlisted @hono/zod-openapi + no boundary signal → no-boundary-confident" \
  || bad "declarative → got '$(verdict "$T")'"

# NEG (load-bearing): SAME repo + add a real parse boundary → must FLIP off no-boundary-confident.
echo 'export const h=(b)=>schema.parse(b);' > "$T/src/route-handler.ts"
[ "$(verdict "$T")" = "boundary-present" ] \
  && ok "NEG: allowlisted framework but a parse boundary appears → flips to boundary-present (no false N/A)" \
  || bad "NEG: parse boundary did not flip declarative repo (got '$(verdict "$T")')"

# ── ambiguous: JSON.parse only, framework unknown ─────────────────────────────
T=$(mkrepo); mkdir -p "$T/src"; echo 'export const c = JSON.parse(raw);' > "$T/src/cfg.ts"
[ "$(verdict "$T")" = "ambiguous" ] \
  && ok "JSON.parse only + unknown framework → ambiguous (stdlib parse is not a boundary)" \
  || bad "JSON.parse only → got '$(verdict "$T")'"

# NEG (load-bearing): unknown framework + NO parse at all → still ambiguous, NOT no-boundary-confident
# (confidence requires a POSITIVE allowlist match — absence of signals is not confidence).
T=$(mkrepo); mkdir -p "$T/src"; echo 'export const x = 1;' > "$T/src/x.ts"
[ "$(verdict "$T")" = "ambiguous" ] \
  && ok "NEG: unknown framework + zero signals → ambiguous, never a confident N/A" \
  || bad "NEG: bare repo → got '$(verdict "$T")' (must be ambiguous, not no-boundary-confident)"

# ── test files do not count as boundary ───────────────────────────────────────
T=$(mkrepo); mkdir -p "$T/src/routes"; echo 'it("x",()=>schema.parse(1));' > "$T/src/routes/u.test.ts"
[ "$(verdict "$T")" = "ambiguous" ] \
  && ok "a parse inside a *.test.ts under routes/ does NOT count as a boundary" \
  || bad "test-file parse counted as boundary (got '$(verdict "$T")')"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
