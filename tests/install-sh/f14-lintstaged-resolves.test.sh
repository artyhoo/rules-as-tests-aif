#!/usr/bin/env bash
# cih-s3 F14 — lint-staged binary resolution on monorepos.
# THE BUG: the shipped single root .lintstagedrc.json runs `eslint --fix` from the git-root.
# In a pnpm/isolated-node_modules monorepo the per-package `eslint` binary is NOT in the root
# `.bin` → lint-staged emits `✖ eslint ENOENT` and BLOCKS the commit. (S1/F2 made the hook
# live, which unmasked this — distinct from F2's "hook dead" and F3's "rule inert", §3.4.)
# THE FIX (M3): install drops a per-package .lintstagedrc.json stub in each detected package so
#   lint-staged runs with cwd=that package and resolves the local binary; PM-agnostic.
# THE GATE: scripts/check-lintstaged-resolves.sh fails BEFORE the first blocked commit if any
#   GOVERNING config's command binary can't resolve from its cwd.
#
# node_modules/.bin binaries are simulated with fake executables (no real install needed).
# PAIRED-NEGATIVE: the monorepo arm flips green→red→green (no stub → alarm; stub → resolves;
# remove the binary entirely → alarm again).
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }
mkbin() { local d="$1"; shift; mkdir -p "$d"; for b in "$@"; do printf '#!/bin/sh\n' > "$d/$b"; chmod +x "$d/$b"; done; }

# ── install ts-server; the gate must ship ──
T=$(mktemp -d)
printf '{ "name":"t","version":"0.0.0" }\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
GATE="$T/scripts/check-lintstaged-resolves.sh"
[ -x "$GATE" ] \
  && ok "shipped: scripts/check-lintstaged-resolves.sh installed + executable" \
  || bad "shipped: check-lintstaged-resolves.sh missing"
[ -f "$T/.lintstagedrc.json" ] || bad "shipped: .lintstagedrc.json missing"

# ── flat pos: root .ts + all bins at root .bin → gate green ──
mkdir -p "$T/src"; echo 'export const x = 1;' > "$T/src/a.ts"
mkbin "$T/node_modules/.bin" prettier eslint sort-package-json
( cd "$T" && bash "$GATE" ) >/dev/null 2>&1 \
  && ok "flat pos: all lint-staged binaries resolve at root → gate green" \
  || bad "flat pos: gate failed on a flat layout with bins at root"

# ── monorepo NEG (load-bearing): root config governs apps/api/*.ts but eslint lives only in
#    apps/api/.bin → root-cwd eslint can't resolve → gate alarms ──
M=$(mktemp -d)
printf '{ "name":"m","version":"0.0.0" }\n' > "$M/package.json"
( cd "$M" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
mkdir -p "$M/apps/api/src"; echo 'export const x = 1;' > "$M/apps/api/src/a.ts"
mkbin "$M/node_modules/.bin" prettier sort-package-json
mkbin "$M/apps/api/node_modules/.bin" eslint prettier sort-package-json
if ( cd "$M" && bash "$GATE" ) >/dev/null 2>&1; then
  bad "monorepo NEG: root config can't resolve eslint but gate stayed green → VACUOUS"
else
  ok "monorepo NEG: root config governs apps/api/*.ts, eslint not at root → gate alarms (non-vacuous)"
fi

# ── monorepo POS (full setup): per-package stub (lets apps/api use its local eslint via
#    cwd=apps/api) PLUS eslint at the workspace root (resolves root-level config files like the
#    shipped vitest.config.ts). Both governing configs now resolve → gate green. ──
cp "$M/.lintstagedrc.json" "$M/apps/api/.lintstagedrc.json"     # M3 per-package stub
mkbin "$M/node_modules/.bin" eslint                            # eslint at workspace root too
( cd "$M" && bash "$GATE" ) >/dev/null 2>&1 \
  && ok "monorepo POS: per-package stub + root eslint → every governing config resolves → gate green" \
  || bad "monorepo POS: stub + root eslint present but gate still failed"

# ── gate NEG (load-bearing): remove eslint from BOTH root and apps/api → unresolvable → alarm ──
rm -f "$M/node_modules/.bin/eslint" "$M/apps/api/node_modules/.bin/eslint"
if ( cd "$M" && bash "$GATE" ) >/dev/null 2>&1; then
  bad "gate NEG: eslint removed everywhere but gate stayed green → VACUOUS"
else
  ok "gate NEG: eslint unresolvable anywhere → gate alarms (non-vacuous)"
fi

# ── install auto-drops the stub when a workspace pre-exists at install time (M3) ──
W=$(mktemp -d)
printf '{ "name":"w","version":"0.0.0" }\n' > "$W/package.json"
printf 'packages:\n  - "apps/*"\n' > "$W/pnpm-workspace.yaml"
mkdir -p "$W/apps/api"; printf '{ "name":"@w/api","version":"0.0.0" }\n' > "$W/apps/api/package.json"
( cd "$W" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
[ -f "$W/apps/api/.lintstagedrc.json" ] \
  && ok "install M3: workspace detected → per-package .lintstagedrc.json stub dropped in apps/api" \
  || bad "install M3: workspace present but no per-package stub dropped in apps/api"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
