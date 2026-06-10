#!/usr/bin/env bash
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

ENGINE_LIB_ONLY=1 source "$REPO_ROOT/setup.d/engine.sh"

# detect succeeds → skip, never runs install
out=$(companion_step "fake" "true" "echo SHOULD_NOT_RUN" "cc-plugin" "yes")
echo "$out" | grep -q SHOULD_NOT_RUN && bad "ran install despite detect-present" || ok "detect-present → skip"
echo "$out" | grep -qi 'skip' && ok "skip message emitted" || bad "no skip message"

# detect fails + mode=yes → runs install
out=$(companion_step "fake" "false" "echo INSTALLED_OK" "cc-plugin" "yes")
echo "$out" | grep -q INSTALLED_OK && ok "detect-absent + yes → installs" || bad "did not install"

# mode=dry-run → never runs install even when detect fails
# (whole-line match: executed install emits a bare SHOULD_NOT_RUN line; the dry-run
#  message only embeds the command mid-line — deviation from plan, see PR notes)
out=$(companion_step "fake" "false" "echo SHOULD_NOT_RUN" "cc-plugin" "dry-run")
echo "$out" | grep -qx SHOULD_NOT_RUN && bad "dry-run ran install" || ok "dry-run → no install"

# external-service kind → does not run install_cmd (routed elsewhere)
out=$(companion_step "rb" "false" "echo SHOULD_NOT_RUN" "external-service" "yes")
echo "$out" | grep -q SHOULD_NOT_RUN && bad "external-service ran install_cmd" || ok "external-service → not a plain install"

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
