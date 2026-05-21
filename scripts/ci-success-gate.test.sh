#!/usr/bin/env bash
# Paired-negative for scripts/ci-success-gate.sh — the aggregate gate behind the
# `ci-success` required status check (audit-self.yml). The job itself can't be
# unit-tested (GitHub Actions), so the pass/fail logic lives in the script and is
# proven here: it must FAIL when any needed job failed/cancelled and PASS only
# when all succeeded or were legitimately skipped.
#
# CI: invoked from .github/workflows/audit-self.yml#principles-meta-tests.
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
GATE="$HERE/ci-success-gate.sh"
PASS=0
FAIL=0

# expect EXPECTED_RC "desc" <args...>
expect() {
  local want="$1" desc="$2"; shift 2
  bash "$GATE" "$@" >/dev/null 2>&1
  local got=$?
  if [ "$got" -eq "$want" ]; then PASS=$((PASS+1)); printf 'PASS: %s (rc=%s)\n' "$desc" "$got"
  else FAIL=$((FAIL+1)); printf 'FAIL: %s — wanted rc=%s got rc=%s\n' "$desc" "$want" "$got"; fi
}

# Positives → exit 0
expect 0 "all success"                       success success success
expect 0 "success + legitimately skipped"    success skipped success
expect 0 "single success"                    success
expect 0 "all skipped"                       skipped skipped

# Negatives → exit 1 (the load-bearing cases)
expect 1 "one failure among successes"       success failure success
expect 1 "one cancelled among successes"     success cancelled success
expect 1 "all failed"                        failure failure
expect 1 "no args (empty needs wiring)"      # deliberately no args

printf '\n── ci-success-gate: %d pass / %d fail ──\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
