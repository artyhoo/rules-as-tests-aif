#!/usr/bin/env bash
# packages/core/audit-self/pre-push.test.sh
# Paired-negative tests for .husky/pre-push §9 s17_check_trailer() substance arms.
# Covers Wave 8.3 (§9 substance), Wave 8.5 (historical-cutoff bypass).
# Mirrors audit-ai-docs.test.sh pattern.
#
# Wave 10.2 migration note: §7 pa_check_trailer() moved to TS
# (packages/core/hooks/checks/prior-art.ts). The pa_* substance tests (5-8, 16)
# moved to packages/core/hooks/checks/prior-art.test.ts (vitest). This file
# now covers §1.7 (s17_*) only; it will retire when Wave 10.3 ports s17.ts.
#
# Usage: bash packages/core/audit-self/pre-push.test.sh
# Exit: 0 = all pass, 1 = at least one failure.
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/../hooks/legacy-trailer-checks.sh"
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
# Source §1.7 functions from the shim (§7 pa_* are now in TS — vitest covers them).
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
# NOTE: §7 pa_check_trailer tests (5-8, 16) moved to vitest in Wave 10.2.
# See packages/core/hooks/checks/prior-art.test.ts — covers all pa_* substance
# and historical-cutoff cases with Stryker ≥80% mutation coverage.
# Wave 8.5 historical cutoff tests.
# 5 (was 9). §9 s17_check_trailer: commit with author-date before S17_HISTORICAL_CUTOFF
# must return 0 regardless of trailer content (pre-Wave-8 history replay protection).
# MOCK_BODY starts with the date string so cut -d' ' -f1 extracts the ISO date.
test_s17_historical_cutoff() {
  export MOCK_BODY="2026-05-01 00:00:00 +0000"
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  unset MOCK_BODY
  [ "$rc" -eq 0 ] && pass "s17_historical_cutoff (rc=0 on pre-cutoff author-date)" \
    || fail "s17_historical_cutoff: expected rc=0, got $rc"
}
# Wave 9.4 body-prose §1.7 detection tests.
# 10. Negative (Case A): body has §1.7 in prose, no trailer line → exit 2 (substance failure).
test_s17_body_prose_negative() {
  export MOCK_BODY="feat(test): dummy

I performed §1.7 forward and backward checks per the rule."
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 2 ] && pass "body_prose_negative (rc=2 on prose §1.7 without trailer)" \
    || fail "body_prose_negative: expected rc=2, got $rc"
}
# 11. Positive (Case B): body has prose §1.7 mention AND valid §1.7: trailer → exit 0.
test_s17_body_prose_positive() {
  export MOCK_BODY="feat(test): dummy

I performed §1.7 forward and backward checks per the rule.
§1.7: forward-check: packages/core/principles/02-paired-negative-test.test.ts:82 verified; backward: 0 new .md files"
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 0 ] && pass "body_prose_positive (rc=0 on prose + valid trailer)" \
    || fail "body_prose_positive: expected rc=0, got $rc"
}
# 12. Bootstrap unaffected (Case C): body has prose §1.7 mention AND Bootstrap: line → exit 0.
test_s17_body_prose_bootstrap_unaffected() {
  export MOCK_BODY="feat(test): dummy

I performed §1.7 forward and backward checks per the rule.
§1.7 Bootstrap: introduces body-prose substance arm; B1 exemption — this is the discipline-bearing artifact"
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 0 ] && pass "body_prose_bootstrap_unaffected (rc=0 on prose + Bootstrap:)" \
    || fail "body_prose_bootstrap_unaffected: expected rc=0, got $rc"
}
# 13. No §1.7 mention (Case D): body without §1.7 anywhere → exit 1 (current behavior preserved).
test_s17_body_prose_no_mention() {
  export MOCK_BODY="feat(test): dummy

This commit has no reference to the discipline check whatsoever."
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 1 ] && pass "body_prose_no_mention (rc=1 on body without §1.7)" \
    || fail "body_prose_no_mention: expected rc=1, got $rc"
}
# Wave 9.4 refinement: §1.7 regex tightened with (^|[^/])§1\.7 to exclude URL/path
# embeddings. The discourse case stays caught; URL-only mentions no longer fire.
# 14. URL false-positive excluded: body with §1.7 only inside a URL path → exit 1
# (current behavior preserved — equivalent to "no §1.7 mention" since URL is not
# discourse).
test_s17_body_prose_url_excluded() {
  export MOCK_BODY="feat(test): dummy

See https://example.com/rules/§1.7-spec for the canonical definition."
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 1 ] && pass "body_prose_url_excluded (rc=1 on §1.7 inside URL only)" \
    || fail "body_prose_url_excluded: expected rc=1, got $rc"
}
# 15. Punctuation-preceded §1.7 still caught: body with §1.7 after non-slash punctuation
# (e.g. period, parenthesis) still fires as theatre-shaped prose → exit 2.
test_s17_body_prose_punctuation_caught() {
  export MOCK_BODY="feat(test): dummy

Discipline applied.§1.7 forward and backward checks done."
  export S17_SUBSTANCE_WARN_ONLY=false
  local rc=0; s17_check_trailer "deadbeef00" >/dev/null 2>&1 || rc=$?
  unset S17_SUBSTANCE_WARN_ONLY
  [ "$rc" -eq 2 ] && pass "body_prose_punctuation_caught (rc=2 on §1.7 after non-slash punctuation)" \
    || fail "body_prose_punctuation_caught: expected rc=2, got $rc"
}
echo "── Running §1.7 substance + Wave 8.5 historical-cutoff tests ──"
echo "   (§7 pa_* tests moved to prior-art.test.ts vitest — Wave 10.2)"
test_s17_substance_negative
test_s17_substance_positive
test_s17_substance_bootstrap_unaffected
test_s17_substance_warn_only_default
test_s17_historical_cutoff
test_s17_body_prose_negative
test_s17_body_prose_positive
test_s17_body_prose_bootstrap_unaffected
test_s17_body_prose_no_mention
test_s17_body_prose_url_excluded
test_s17_body_prose_punctuation_caught
echo ""; echo "$PASS pass / $FAIL fail"
[ "$FAIL" -eq 0 ] || exit 1; exit 0
