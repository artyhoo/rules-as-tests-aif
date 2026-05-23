#!/usr/bin/env bash
# plan-currency-check.sh — §7.2 deterministic data feed for SKILL.md §1 Plan-currency check.
#
# Usage: plan-currency-check.sh [<umbrella-name>]
#
# Outputs deterministic data that SKILL.md body uses for drift detection (judgment).
# This helper surfaces facts; SKILL.md performs the comparison and emits verdict.
#
# @cc-only-rationale: meta-orchestrator skill helper — runs in-session via !shell injection;
#   no portable equivalent fires at the same moment (PostToolUse timing is CC-specific).
set -euo pipefail

UMBRELLA="${1:-}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "=== plan-currency-check: umbrella='${UMBRELLA}' ==="
echo "--- git status (short) ---"
git -C "${REPO_ROOT}" status --short 2>/dev/null | head -10 || echo "(git unavailable)"

echo "--- branch + ahead/behind ---"
git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || echo "(no branch)"
git -C "${REPO_ROOT}" rev-list --count --left-right "origin/staging...HEAD" 2>/dev/null \
  || echo "(no upstream tracking)"

echo "--- open PRs (json) ---"
gh pr list \
  --search "is:open" \
  --json number,title,state,headRefName,baseRefName \
  --limit 25 \
  2>/dev/null || echo "(gh unavailable)"

echo "--- merged PRs last 30 days (json) ---"
gh pr list \
  --state merged \
  --search "merged:>=$(date -v-30d +%Y-%m-%d 2>/dev/null || date -d '30 days ago' +%Y-%m-%d 2>/dev/null || echo '2026-04-23')" \
  --json number,title,headRefName,baseRefName,mergedAt \
  --limit 30 \
  2>/dev/null || echo "(gh unavailable)"

echo "--- kickoff existence check ---"
if [[ -n "${UMBRELLA}" ]]; then
  KICKOFF_PATH="${REPO_ROOT}/.claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"
  if [[ -f "${KICKOFF_PATH}" ]]; then
    echo "kickoff: EXISTS at .claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"
  else
    echo "kickoff: MISSING — .claude/orchestrator-prompts/${UMBRELLA}/kickoff.md not found"
  fi
else
  echo "--- all umbrella kickoffs ---"
  find "${REPO_ROOT}/.claude/orchestrator-prompts" -mindepth 1 -maxdepth 1 -type d \
      2>/dev/null | sort \
    | while read -r dir_path; do
        dir="$(basename "${dir_path}")"
        kickoff="${dir_path}/kickoff.md"
        if [[ -f "${kickoff}" ]]; then
          echo "  EXISTS: ${dir}/kickoff.md"
        else
          echo "  MISSING: ${dir}/ (no kickoff.md)"
        fi
      done
fi

echo "--- research patches (last 10) ---"
find "${REPO_ROOT}/docs/meta-factory/research-patches" -maxdepth 1 -name "*.md" \
    -newer "${REPO_ROOT}/docs/meta-factory/research-patches/." \
    2>/dev/null | sort -r | head -10 \
  || find "${REPO_ROOT}/docs/meta-factory/research-patches" -maxdepth 1 -name "*.md" \
    2>/dev/null | sort -r | head -10 \
  || echo "(no research-patches dir)"
