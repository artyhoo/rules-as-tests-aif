#!/usr/bin/env bash
# ci-success-gate.sh — aggregate pass/fail gate for the `ci-success` job.
#
# Purpose: GitHub branch protection can only require named status-check
# *contexts*, and `needs:` aggregation works only WITHIN one workflow file. This
# script is the body of the `ci-success` job in audit-self.yml, which `needs:`
# every audit-self PR job; the job passes its `${{ join(needs.*.result, ' ') }}`
# here. It exits 0 iff every job result is `success` or `skipped`, else 1 — so a
# single required context (`ci-success`) gates all of audit-self.yml at once.
# (actionlint + zizmor were moved into audit-self.yml so they too are `needs:`-ed
# here — a path-filtered required check in another file deadlocks non-workflow
# PRs; see docs/meta-factory/automerge-staging-plan.md §5.)
#
# `skipped` counts as OK: an `if:`-gated job (e.g. pr-commit-trailers on a push
# event) is legitimately skipped, not failed. `failure` and `cancelled` fail the
# gate. Zero args is a misconfiguration (no needs wired) → fail loudly.
#
# Args: one job-result token per needed job (success | failure | cancelled | skipped).
# Tested by scripts/ci-success-gate.test.sh (paired-negative).
set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "::error::ci-success-gate: no job results passed — needs: wiring is empty or join() expanded to nothing"
  exit 1
fi

fail=0
for result in "$@"; do
  case "$result" in
    success | skipped) ;;
    *)
      echo "::error::ci-success-gate: a required job concluded '$result' (need success or skipped)"
      fail=1
      ;;
  esac
done

if [ "$fail" -eq 0 ]; then
  echo "✅ ci-success: all $# required jobs passed (or were legitimately skipped)"
fi
exit "$fail"
