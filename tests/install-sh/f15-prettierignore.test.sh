#!/usr/bin/env bash
# cih-s3 F15 — install ships a .prettierignore that keeps prettier off the generated RULES.md.
# THE BUG: the shipped `.lintstagedrc.json` runs `*.md → prettier --write`; the generated
# `<!-- begin/end: rules-table-generated -->` region of .ai-factory/RULES.md is the rendered
# SSOT and is NOT prettier-format-stable → it gets reflowed (cosmetic churn on a static
# consumer; a recurring fight on a consumer that regenerates RULES.md via AIF recipes).
# THE FIX: ship a .prettierignore listing .ai-factory/RULES.md (+ RULES.react-next.md).
#
# PAIRED-NEGATIVE: the neg arm strips the entry from a copy and re-greps → MUST miss.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

T=$(mktemp -d)
printf '{ "name":"t","version":"0.0.0" }\n' > "$T/package.json"
( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
PI="$T/.prettierignore"

[ -f "$PI" ] \
  && ok "F15 pos: .prettierignore shipped" \
  || bad "F15 pos: .prettierignore not installed"

grep -qx '.ai-factory/RULES.md' "$PI" \
  && ok "F15 pos: .prettierignore lists the generated .ai-factory/RULES.md" \
  || bad "F15 pos: .prettierignore does not ignore .ai-factory/RULES.md (generated table would reflow)"

# neg (LOAD-BEARING): remove the entry from a copy → grep MUST miss
grep -v '^\.ai-factory/RULES\.md$' "$PI" > "$PI.neg"
if grep -qx '.ai-factory/RULES.md' "$PI.neg"; then
  bad "F15 neg: stripped the entry but grep still matched → VACUOUS"
else
  ok "F15 neg: removing the entry flips the grep to miss (non-vacuous)"
fi
rm -f "$PI.neg"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
