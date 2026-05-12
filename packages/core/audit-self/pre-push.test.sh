#!/usr/bin/env bash
# packages/core/audit-self/pre-push.test.sh
# Paired-negative tests for .husky/pre-push §9 s17_check_trailer() substance arm.
# Mirrors audit-ai-docs.test.sh pattern.
# Usage: bash packages/core/audit-self/pre-push.test.sh
# Exit: 0 = all pass, 1 = at least one failure.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../../../.husky/pre-push"
if [ -t 1 ]; then RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
else RED=''; GREEN=''; NC=''; fi
PASS=0; FAIL=0
pass() { echo -e "${GREEN}PASS${NC}: $1"; PASS=$((PASS+1)); }
fail() { echo -e "${RED}FAIL${NC}: $1"; FAIL=$((FAIL+1)); }
TMPD=$(mktemp -d); trap 'rm -rf "$TMPD"' EXIT
# Mock git: returns $MOCK_BODY for `git show` calls; delegates everything else.
cat > "$TMPD/git" << 'EOF'
#!/usr/bin/env bash
if [ "$1" = "show" ]; then printf '%s' "$MOCK_BODY"; else command git "$@"; fi
EOF
chmod +x "$TMPD/git"; export PATH="$TMPD:$PATH"
# Source §9 functions from the hook (eval extracts the two function definitions).
eval "$(sed -n '/^  s17_is_discipline_introducing()/,/^  }/p; /^  s17_check_trailer()/,/^  }/p' "$HOOK")"
GENERIC="§1.7: forward-check applied — Checked all rules, compliant. Backward-check — complete sweep performed."
CITATION="§1.7: forward-check: packages/core/principles/02-paired-negative-test.test.ts:82 mutation arm verified; backward: 0 new .md files"
BOOTSTRAP="§1.7 Bootstrap: introduces substance arm for §1.7 trailer with 2026-06-10 calibration window"
# 1. Negative: generic stub without file:line → exit 2 (substance failure).
test_s17_substance_negative() {
  export MOCK_BODY="feat(test): dummy

$GENERIC"
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 2 ] && pass "substance_negative (rc=2 on generic stub)" \
    || fail "substance_negative: expected rc=2, got $rc"
}
# 2. Positive: trailer with file:line citation → exit 0.
test_s17_substance_positive() {
  export MOCK_BODY="feat(test): dummy

$CITATION"
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 0 ] && pass "substance_positive (rc=0 on cited trailer)" \
    || fail "substance_positive: expected rc=0, got $rc"
}
# 3. Bootstrap path unaffected by substance check.
test_s17_substance_bootstrap_unaffected() {
  export MOCK_BODY="feat(test): dummy

$BOOTSTRAP"
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 0 ] && pass "substance_bootstrap_unaffected (rc=0 on Bootstrap:)" \
    || fail "substance_bootstrap_unaffected: expected rc=0, got $rc"
}
# 4. Warn-only default (S17_SUBSTANCE_WARN_ONLY unset): function still signals rc=2
# so the outer router can emit a warning without blocking push.
test_s17_substance_warn_only_default() {
  export MOCK_BODY="feat(test): dummy

$GENERIC"
  unset S17_SUBSTANCE_WARN_ONLY 2>/dev/null || true
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  [ "$rc" -eq 2 ] && pass "substance_warn_only_default (rc=2; outer router warns only)" \
    || fail "substance_warn_only_default: expected rc=2, got $rc"
}
echo "── Running §9 s17_check_trailer substance tests ──"
test_s17_substance_negative
test_s17_substance_positive
test_s17_substance_bootstrap_unaffected
test_s17_substance_warn_only_default
echo ""; echo "$PASS pass / $FAIL fail"
[ "$FAIL" -eq 0 ] || exit 1; exit 0
