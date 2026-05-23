#!/usr/bin/env bash
# launch-table-generator.sh — §7.4 deterministic data feed for SKILL.md §3 Launch-table.
#
# Usage: launch-table-generator.sh <umbrella-name>
#
# Outputs a markdown table skeleton with detected sub-wave rows (placeholders for
# judgment-requiring columns). SKILL.md body fills Mode, SDD?, Stage, Parallel-sibling.
#
# @cc-only-rationale: meta-orchestrator skill helper — runs in-session via !shell injection;
#   no portable equivalent fires at the same moment (PostToolUse timing is CC-specific).
set -euo pipefail

UMBRELLA="${1:-}"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [[ -z "${UMBRELLA}" ]]; then
  echo "Usage: launch-table-generator.sh <umbrella-name>" >&2
  exit 1
fi

KICKOFF="${REPO_ROOT}/.claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"

if [[ ! -f "${KICKOFF}" ]]; then
  echo "MISSING kickoff: .claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"
  exit 0
fi

echo "=== launch-table-generator: umbrella=${UMBRELLA} ==="
echo "kickoff: ${KICKOFF} ($(wc -l < "${KICKOFF}") lines)"
echo ""
echo "--- sub-wave candidates (auto-detected) ---"

# Extract sub-wave identifiers from kickoff §2 / §3 sub-wave table (heuristic)
# Look for lines with | Sub-wave | or | A | or | 1 | pattern in markdown tables
grep -E '^\| *(Sub-wave|[A-D]|[0-9]+) *\|' "${KICKOFF}" 2>/dev/null \
  | grep -v 'Sub-wave\|---|Mode\|Type\|Stage' \
  | while IFS='|' read -r _ sw_raw _; do
      sw="$(echo "${sw_raw}" | tr -d ' ')"
      [[ -n "${sw}" ]] && echo "  sub-wave: ${sw}"
    done

echo ""
echo "--- kickoff type header ---"
grep -m3 '^\*\*Type:\*\*\|^> \*\*Type:\*\*\|^## §0\|^## §1 Spec' "${KICKOFF}" 2>/dev/null \
  || echo "(no type header found — check kickoff manually)"

echo ""
echo "--- table skeleton (fill judgment columns in SKILL.md body) ---"
echo "| Sub-wave | Type | Mode | SDD? | Stage | Parallel sibling | Volume |"
echo "|---|---|---|---|---|---|---|"

# Emit one skeleton row per detected sub-wave (SKILL.md body fills actual values)
grep -E '^\| *(Sub-wave|[A-D]|[0-9]+) *\|' "${KICKOFF}" 2>/dev/null \
  | grep -v 'Sub-wave\|---|Mode\|Type\|Stage' \
  | while IFS='|' read -r _ sw_raw _; do
      sw="$(echo "${sw_raw}" | tr -d ' ')"
      [[ -n "${sw}" ]] && echo "| ${sw} | ? | ? | ? | ? | ? | ? |"
    done
