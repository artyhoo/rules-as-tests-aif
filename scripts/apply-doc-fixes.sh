#!/usr/bin/env bash
# apply-doc-fixes.sh — applies the mechanical doc-staleness fixes surfaced by the
# doc-audit-ship-boundary Stage 2 findings (DN-1, DN-2, DN-4).
#
# These edits touch maintainer-owned files (.claude/rules/*, README.md), so a
# session may not land them directly (Artifact Ownership Contract). Instead the
# fixes ship as this script: the MAINTAINER runs it from the terminal and the
# edits become maintainer-applied.
#
# Idempotent by construction: each fix matches only its stale text, so re-running
# after a fix is a no-op.
#
# Usage:
#   bash scripts/apply-doc-fixes.sh            # apply fixes in-place (from repo root)
#   bash scripts/apply-doc-fixes.sh --check    # report what WOULD change, no writes
#   bash scripts/apply-doc-fixes.sh --root DIR # operate under DIR (used by the test)
#
# Spec: docs/meta-factory/research-patches/2026-05-31-doc-audit-ship-boundary-findings.md
set -euo pipefail

ROOT="."
CHECK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK=1 ;;
    --root) ROOT="${2:?--root needs a dir}"; shift ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

RULE="$ROOT/.claude/rules/rule-enforcement-channel-selection.md"
README="$ROOT/README.md"
changed=0

# apply_fix <name> <file> <stale-detect-token> <perl-substitution>
#   stale-detect-token: fixed string; its presence ⇒ fix still needed (idempotency gate)
apply_fix() {
  local name="$1" file="$2" token="$3" sub="$4"
  if [ ! -f "$file" ]; then
    echo "skip       $name — $file absent"
    return 0
  fi
  if grep -qF -- "$token" "$file"; then
    if [ "$CHECK" = 1 ]; then
      echo "would-fix  $name ($file)"
    else
      perl -0pi -e "$sub" "$file"
      echo "fixed      $name ($file)"
    fi
    changed=1
  else
    echo "ok         $name — already current ($file)"
  fi
}

# ── DN-1a: rule Class header «Activation pending …» → «Activation confirmed …» ──
apply_fix "DN-1a rule Class header" "$RULE" \
  '**Activation pending**' \
  's/\*\*Activation pending\*\*.*?agent-self-protected\)\./**Activation confirmed** — PostToolUse `Edit|Write` entry wired at `.claude\/settings.json:114`./s'

# ── DN-1b: rule §4 «Activation: add a PostToolUse …» → «wired …» ──────────────
apply_fix "DN-1b rule §4 prose" "$RULE" \
  '**Activation:** add a PostToolUse' \
  's/\*\*Activation:\*\* add a PostToolUse.*?snippet\./**Activation:** wired — PostToolUse `Edit|Write` entry at `.claude\/settings.json:114`./s'

# ── DN-2: README CI badges branch=main → branch=staging (3×) ──────────────────
apply_fix "DN-2 README badges → staging" "$README" \
  'badge.svg?branch=main' \
  's/badge\.svg\?branch=main/badge.svg?branch=staging/g'

# ── DN-4: README enforcement chain — drop false «Stryker» from the CI channel ──
#   Stryker mutation runs are local/session-bound, not a CI gate (no workflow runs it).
apply_fix "DN-4 README CI channel (drop Stryker)" "$README" \
  'CI (Stryker + discipline-self-check)' \
  's/CI \(Stryker \+ discipline-self-check\)/CI (discipline-self-check)/g'

if [ "$CHECK" = 1 ] && [ "$changed" = 1 ]; then
  echo "--- run without --check to apply ---"
fi
exit 0
