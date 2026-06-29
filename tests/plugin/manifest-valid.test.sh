#!/usr/bin/env bash
# S1 acceptance — plugin/marketplace manifests valid + version parity + run-hook present.
# spec: docs/superpowers/specs/2026-06-22-cc-plugin-packaging-design.md §9 (S1)
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "  ✓ $1"; }
bad(){ FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# plugin.json lives where CC resolves it for the marketplace `source: ./plugin`
# (plugin-loadability fix, 2026-06-28); marketplace.json stays at the marketplace root.
P="$REPO_ROOT/plugin/.claude-plugin/plugin.json"
M="$REPO_ROOT/.claude-plugin/marketplace.json"

python3 -c "import json; json.load(open('$P'))" 2>/dev/null && ok "plugin.json parses" || bad "plugin.json invalid"
python3 -c "import json; json.load(open('$M'))" 2>/dev/null && ok "marketplace.json parses" || bad "marketplace.json invalid"

PV=$(python3 -c "import json;print(json.load(open('$P'))['version'])" 2>/dev/null)
MV=$(python3 -c "import json;print(json.load(open('$M'))['plugins'][0]['version'])" 2>/dev/null)
[ -n "$PV" ] && [ "$PV" = "$MV" ] && ok "version parity ($PV)" || bad "version drift: plugin=$PV marketplace=$MV"

SRC=$(python3 -c "import json;print(json.load(open('$M'))['plugins'][0]['source'])" 2>/dev/null)
[ "$SRC" = "./plugin" ] && [ -d "$REPO_ROOT/plugin" ] && ok "source ./plugin resolves" || bad "source '$SRC' does not resolve to a dir"

[ -x "$REPO_ROOT/plugin/hooks/run-hook.cmd" ] && ok "run-hook.cmd present+exec" || bad "run-hook.cmd missing/not exec"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
