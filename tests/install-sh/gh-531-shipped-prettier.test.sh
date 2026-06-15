#!/usr/bin/env bash
# gh-531-shipped-prettier.test.sh — the shipped surface must be Prettier-clean out-of-box.
#
# Deterministic core (no network): (1) the shipped .prettierignore excludes the GENERATED install
# artifacts (settings.json, the eslint-rules-local barrel) — authored sources are formatted, only
# generated ones are ignored; (2) the stryker packageManager patch is an in-place VALUE replace, not
# a JSON.stringify re-serialize (which would re-expand prettier-collapsed arrays and re-break the
# consumer). Optional end-to-end arm (only when `npx prettier` is reachable): install into a tmp
# consumer and assert `prettier --check .` is green.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

IGN="$REPO_ROOT/packages/core/templates/shared/.prettierignore"

# ── Arm 1: generated install artifacts are ignored (so a consumer's prettier --check . skips them) ──
grep -qx '.claude/settings.json' "$IGN" \
  && ok "shipped .prettierignore excludes generated .claude/settings.json" \
  || bad "shipped .prettierignore missing .claude/settings.json (consumer prettier --check would fail on it)"
grep -qx 'eslint-rules-local/index.ts' "$IGN" \
  && ok "shipped .prettierignore excludes the generated eslint-rules-local/index.ts barrel" \
  || bad "shipped .prettierignore missing eslint-rules-local/index.ts (generated barrel would fail prettier)"
# NEG (load-bearing): authored skill docs must NOT be blanket-ignored (that would be hiding, not fixing)
grep -qE '^\.claude/skills/?\*?\*?$|^\.claude/\*\*?$' "$IGN" \
  && bad "neg: .prettierignore blanket-ignores .claude/skills — authored docs hidden, not formatted" \
  || ok "neg: authored skill docs are NOT blanket-ignored (they are formatted, not hidden)"

# ── Arm 2: stryker packageManager patch preserves formatting (in-place value replace) ──
grep -q 'replace(/("packageManager"' "$REPO_ROOT/install.sh" \
  && ok "stryker patch swaps the packageManager VALUE in place (preserves prettier formatting)" \
  || bad "stryker patch is not an in-place value replace (#531 regression risk)"
if grep -A6 'patch_stryker_package_manager' "$REPO_ROOT/install.sh" | grep -q 'JSON.stringify(cfg'; then
  bad "neg: stryker patch still uses JSON.stringify (re-expands prettier-collapsed arrays → re-breaks consumer)"
else
  ok "neg: stryker patch no longer JSON.stringify-re-serializes the whole config"
fi

# ── Arm 3 (optional, network): a real install must be prettier-clean end-to-end ──
if npx --yes prettier --version >/dev/null 2>&1; then
  T=$(mktemp -d); printf '{"name":"g531","version":"0.0.0"}\n' > "$T/package.json"
  ( cd "$T" && git init -q && bash "$REPO_ROOT/install.sh" ts-server --force ) >/dev/null 2>&1
  n=$( ( cd "$T" && npx --yes prettier --check . 2>&1 ) | grep -cE '^\[warn\]|^\[error\]' )
  [ "$n" -eq 0 ] \
    && ok "end-to-end: fresh ts-server consumer is Prettier-clean (prettier --check . → 0 issues)" \
    || bad "end-to-end: consumer has $n prettier failures after install (#531 not fully closed)"
else
  echo "  · end-to-end arm skipped (npx prettier unreachable) — deterministic arms above still hold"
fi

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
