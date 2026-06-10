#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
SETUP="$REPO_ROOT/setup"
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

[ -x "$SETUP" ] && ok "setup is executable" || bad "setup not executable"
bash -n "$SETUP" && ok "setup parses" || bad "setup has syntax error"

# --dry-run in a throwaway project writes nothing and prints preflight + summary
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
( cd "$TMP" && echo '{}' > package.json && bash "$SETUP" ts-server --dry-run >out.txt 2>&1 )
grep -qi 'preflight' "$TMP/out.txt" && ok "preflight ran" || bad "no preflight"
grep -qi 'dry-run' "$TMP/out.txt" && ok "dry-run acknowledged" || bad "dry-run not acknowledged"
[ ! -f "$TMP/AGENTS.md" ] && ok "dry-run wrote nothing" || bad "dry-run wrote files"

# Parse-proof assertions (plan Task 5 Manifest-parse note: verify the field-splitter
# against the REAL companions.manifest rows — tab-delimited, inner pipes in detect_cmd).
grep -qi 'superpowers' "$TMP/out.txt" && ok "manifest row parsed through engine (superpowers in output)" || bad "superpowers absent from output — manifest row did not reach engine"
! grep -qi 'command not found' "$TMP/out.txt" && ok "parser produced no garbage commands" || bad "parser produced garbage commands (command not found in output)"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
