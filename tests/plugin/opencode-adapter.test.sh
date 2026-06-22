#!/usr/bin/env bash
# S7 acceptance — the OpenCode (off-CC) adapter.
# spec: docs/superpowers/specs/2026-06-22-cc-plugin-packaging-design.md §8
#
# Asserts the .opencode/INSTALL.md adapter:
#   (1) exists and points at the shared plugin/skills/ body
#   (2) documents the accepted SessionStart-auto-injection degradation (not silently broken)
#   (3) gives the tool mapping (CC Skill tool → OpenCode skill tool)
#   (4) routes the hard layer through the portable fetch-and-wire seam
# Plus extension.json stays valid + records the plugin-packaging relationship.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
DOC="$REPO_ROOT/.opencode/INSTALL.md"
PASS=0; FAIL=0
ok(){ PASS=$((PASS+1)); echo "  ✓ $1"; }
bad(){ FAIL=$((FAIL+1)); echo "  ✗ $1"; }

[ -f "$DOC" ] && ok ".opencode/INSTALL.md exists" || bad ".opencode/INSTALL.md missing"

grep -q 'plugin/skills' "$DOC" && ok "points at the shared plugin/skills/ body" || bad "does not point at plugin/skills/"

# Degradation must be documented (SessionStart auto-injection + read-on-demand workaround).
grep -qiE 'SessionStart|auto-?inject|auto-?trigger' "$DOC" && grep -qiE 'on demand|degradation' "$DOC" \
  && ok "documents the accepted SessionStart degradation" || bad "degradation not documented"

# Tool mapping present.
grep -qiE 'skill tool|tool mapping' "$DOC" && ok "gives the tool mapping" || bad "no tool mapping"

# Hard layer routes through the portable seam.
grep -q 'fetch-and-wire' "$DOC" && ok "routes hard layer through fetch-and-wire seam" || bad "no hard-layer seam reference"

# extension.json valid + records the plugin-packaging relationship.
EXT="$REPO_ROOT/extension.json"
if python3 -c "import json;json.load(open('$EXT'))" 2>/dev/null; then
  ok "extension.json still valid JSON"
  python3 -c "import json,sys; d=json.load(open('$EXT')); sys.exit(0 if any('plugin' in k.lower() for k in d) else 1)" 2>/dev/null \
    && ok "extension.json records the plugin-packaging relationship" || bad "extension.json missing plugin-packaging note"
else
  bad "extension.json invalid JSON"
fi

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
