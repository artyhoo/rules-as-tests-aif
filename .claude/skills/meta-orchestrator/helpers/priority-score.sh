#!/usr/bin/env bash
# priority-score.sh — §7.3 deterministic data feed for SKILL.md §2 Priority scoring.
#
# Usage: priority-score.sh
#
# Outputs per-candidate data lines for SKILL.md body to score and rank.
# Format: <name> type=<type> kickoff=<exists|missing> stage=<1|2|?> volume=<S|M|L|?>
#
# The SKILL.md body applies the multi-criteria scoring and ranking (judgment).
# This helper supplies deterministic facts only.
#
# @cc-only-rationale: meta-orchestrator skill helper — runs in-session via !shell injection;
#   no portable equivalent fires at the same moment (PostToolUse timing is CC-specific).
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROMPTS_DIR="${REPO_ROOT}/.claude/orchestrator-prompts"

echo "=== priority-score: candidate umbrellas ==="

if [[ ! -d "${PROMPTS_DIR}" ]]; then
  echo "(no .claude/orchestrator-prompts directory)"
  exit 0
fi

for dir in "${PROMPTS_DIR}"/*/; do
  name="$(basename "${dir}")"
  kickoff="${dir}kickoff.md"

  # Skip internal-only dirs (state-only, no kickoff)
  if [[ ! -f "${kickoff}" ]]; then
    echo "${name} kickoff=missing"
    continue
  fi

  # Extract Type from kickoff header (line 2-5 typically)
  type_line="$(grep -m1 '^\*\*Type:\*\*\|^> \*\*Type:\*\*' "${kickoff}" 2>/dev/null || echo '')"
  if echo "${type_line}" | grep -qi 'R-phase\|research'; then
    wave_type="R-phase"
  elif echo "${type_line}" | grep -qi 'I-phase\|execution\|build'; then
    wave_type="I-phase"
  elif echo "${type_line}" | grep -qi 'wiring\|config\|ci'; then
    wave_type="wiring"
  else
    wave_type="unknown"
  fi

  # Estimate volume from kickoff LOC as a proxy
  loc="$(wc -l < "${kickoff}" 2>/dev/null || echo 0)"
  if [[ "${loc}" -lt 100 ]]; then
    volume="S"
  elif [[ "${loc}" -lt 250 ]]; then
    volume="M"
  else
    volume="L"
  fi

  # Check for open PRs matching this umbrella prefix
  open_prs="$(gh pr list --search "is:open head:${name}" --json number --limit 5 2>/dev/null \
    | grep -c '"number"' || echo 0)"

  echo "${name} type=${wave_type} kickoff=exists volume=${volume} open_prs=${open_prs} loc=${loc}"
done
