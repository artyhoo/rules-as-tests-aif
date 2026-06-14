#!/usr/bin/env bash
# universalization-fix-s3 Stage P — opt-in `--wire-ci` yq auto-wirer (GH #521).
#
# Context. The HYBRID verdict (research-patch 2026-06-14-s3-workflow-merge-adopt-vs-build.md, SSOT
# #117) has two halves: (BUILD) the broadened, non-destructive CI-orphan WARN + paste-block — already
# shipped and covered by r2-glob-reach.test.sh #1; and (REFERENCE) this opt-in `--wire-ci` path, which —
# only on explicit consent and only if `yq` is present — idempotently appends the missing
# rule-enforcement gates into the consumer's kept workflow. THIS test covers the REFERENCE half.
#
# Paired-negative discipline (principle 02-paired-negative-test):
#   • POS (yq arm): --wire-ci appends all 4 missing gates, suppresses the WARN, and is idempotent.
#   • NEG (load-bearing, runs everywhere): WITHOUT --wire-ci the consumer's workflow is left
#     BYTE-IDENTICAL — proving the auto-wire is genuinely opt-in and the default stays non-destructive.
#
# yq availability: GitHub-hosted runners ship `yq`, so CI exercises the POS arm. A local run without
# yq prints an explicit SKIP (never a silent pass). Comment preservation is OBSERVED, not asserted:
# yq's comment handling is best-effort (verdict §4 Q1 / §6 C-A — the exact reason it is DISQUALIFIED as
# the *silent* default); hard-gating a best-effort property would contradict the verdict and make CI
# flaky, so we report it as evidence toward the verdict's falsifier-(a) instead of failing on it.
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# Brownfield consumer: a kept ci.yml wiring NONE of the 4 gates, carrying a planted trailing comment.
BROWNFIELD_CI=$'name: CI\njobs:\n  build:\n    steps:\n      - run: pnpm turbo run lint typecheck test  # AIF-PLANTED-COMMENT'

seed() { # $1 dir → brownfield consumer (git repo, package.json, kept ci.yml)
  printf '{"name":"wirep","version":"0.0.0"}\n' > "$1/package.json"
  mkdir -p "$1/.github/workflows"
  printf '%s\n' "$BROWNFIELD_CI" > "$1/.github/workflows/ci.yml"
  ( cd "$1" && git init -q )
}

# ── NEG (load-bearing, no yq needed): default install must NEVER mutate the kept workflow ──
# </dev/null so the interactive [y/N] auto-wire prompt + the #483 dep-install prompt both read empty
# stdin → default No. This is the proof the wiring is opt-in: the byte-identical check fails the
# moment the default path starts editing the consumer's CI.
N=$(mktemp -d); seed "$N"
( cd "$N" && bash "$REPO_ROOT/install.sh" ts-server </dev/null ) > "$N/log" 2>&1
if diff -q <(printf '%s\n' "$BROWNFIELD_CI") "$N/.github/workflows/ci.yml" >/dev/null 2>&1; then
  ok "NEG: default install (no --wire-ci) leaves the consumer workflow byte-identical (wiring is opt-in)"
else
  bad "NEG: default install mutated the consumer workflow — opt-in violated"
fi
grep -q 'CI-orphan' "$N/log" \
  && ok "NEG: default install still emits the broadened CI-orphan WARN" \
  || bad "NEG: default install dropped the CI-orphan WARN"

# ── POS (yq arm): --wire-ci with yq present → append all 4, suppress WARN, idempotent ──
if command -v yq >/dev/null 2>&1; then
  P=$(mktemp -d); seed "$P"
  ( cd "$P" && bash "$REPO_ROOT/install.sh" ts-server --wire-ci </dev/null ) > "$P/log" 2>&1
  RC=$?
  [ "$RC" = 0 ] && ok "POS: --wire-ci install exited 0 (auto-wire never aborts)" || bad "POS: --wire-ci exited $RC"

  _wired_all=1
  for p in 'check-rule-globs\.sh' 'arch:check' 'audit-ai-docs\.sh' 'check-lintstaged-resolves\.sh'; do
    grep -qE "$p" "$P/.github/workflows/ci.yml" || { _wired_all=0; bad "POS: --wire-ci did not append $p"; }
  done
  [ "$_wired_all" = 1 ] && ok "POS: --wire-ci appended all 4 missing gates into the consumer workflow"

  grep -q 'CI-orphan' "$P/log" \
    && bad "POS: CI-orphan WARN still fired after a successful wire (suppression failed)" \
    || ok "POS: CI-orphan WARN suppressed after wire (merge-then-no-warn)"

  yq -e '.jobs.build.steps' "$P/.github/workflows/ci.yml" >/dev/null 2>&1 \
    && ok "POS: wired steps live under the real job path .jobs.build.steps (valid YAML)" \
    || bad "POS: result is not valid YAML or steps landed at the wrong job path"

  # Idempotence: a 2nd --wire-ci adds nothing — the re-detect sees the gates already wired (install
  # level) and yq's unique_by(.run) dedups (yq level). Step count must be unchanged.
  _before=$(yq '.jobs.build.steps | length' "$P/.github/workflows/ci.yml" 2>/dev/null || echo "x")
  ( cd "$P" && bash "$REPO_ROOT/install.sh" ts-server --wire-ci </dev/null ) > /dev/null 2>&1
  _after=$(yq '.jobs.build.steps | length' "$P/.github/workflows/ci.yml" 2>/dev/null || echo "y")
  [ "$_before" = "$_after" ] \
    && ok "POS: re-running --wire-ci is idempotent (steps stayed at $_before — no duplicates)" \
    || bad "POS: re-run duplicated steps ($_before → $_after — not idempotent)"

  # OBSERVATION only (not a gate) — yq comment preservation is best-effort (verdict falsifier-(a)).
  if grep -q 'AIF-PLANTED-COMMENT' "$P/.github/workflows/ci.yml"; then
    echo "  ⓘ OBS: planted comment survived the yq round-trip (evidence toward verdict falsifier-(a) — best-effort held here)"
  else
    echo "  ⓘ OBS: planted comment did NOT survive the yq round-trip — confirms yq best-effort preservation (verdict §6 C-A); exactly why --wire-ci is opt-in, not the silent default"
  fi
else
  echo "  ⊝ SKIP: 'yq' not on PATH — the --wire-ci POS arm runs on CI (GitHub runners ship yq), not in this local env"
fi

echo ""; echo "PASS=$PASS FAIL=$FAIL"; [ "$FAIL" -eq 0 ]
