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
  # Called without arg — legitimate when skill is loaded but §2 hasn't selected
  # an umbrella yet. Quiet skip (exit 0) so CC doesn't flag the §3 !shell block
  # as failed. Direct CLI invocation can still discover usage via this echo.
  echo "(launch-table-generator: no umbrella — §3 launch-table runs after §2 selects winner)"
  exit 0
fi

KICKOFF="${REPO_ROOT}/.claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"

if [[ ! -f "${KICKOFF}" ]]; then
  echo "MISSING kickoff: .claude/orchestrator-prompts/${UMBRELLA}/kickoff.md"
  exit 0
fi

echo "=== launch-table-generator: umbrella=${UMBRELLA} ==="
echo "kickoff: ${KICKOFF} ($(wc -l < "${KICKOFF}") lines)"
echo ""

# Extract sub-wave rows from kickoff §2/§3 sub-wave tables.
# Recognised first-column shapes (with surrounding spaces):
#   | A |           plain letter A-D
#   | **A** |       bold-wrapped letter (Markdown emphasis)
#   | 1 |           plain digit
#   | **1** |       bold-wrapped digit
# Filters: the header row (first cell == 'Sub-wave' literal) and divider rows (cells of `-`/`:`).
detect_subwaves() {
  grep -E '^\| *(\*\*)?([A-D]|[0-9]+)(\*\*)? *\|' "${KICKOFF}" 2>/dev/null \
    | grep -vE '^\|[[:space:]:|-]*\|[[:space:]:|-]*$' \
    | while IFS='|' read -r _ sw_raw _; do
        sw="$(echo "${sw_raw}" | tr -d ' *')"
        [[ -n "${sw}" ]] && echo "${sw}"
      done
}

echo "--- sub-wave candidates (auto-detected) ---"
detect_subwaves | sed 's/^/  sub-wave: /'

echo ""
echo "--- kickoff type header ---"
grep -m3 '^\*\*Type:\*\*\|^> \*\*Type:\*\*\|^## §0\|^## §1 Spec' "${KICKOFF}" 2>/dev/null \
  || echo "(no type header found — check kickoff manually)"

echo ""
echo "--- table skeleton (fill judgment columns in SKILL.md body) ---"
echo "| Sub-wave | Type | Mode | SDD? | Stage | Parallel sibling | Volume |"
echo "|---|---|---|---|---|---|---|"

# Emit one skeleton row per detected sub-wave (SKILL.md body fills actual values).
detect_subwaves | while read -r sw; do
  echo "| ${sw} | ? | ? | ? | ? | ? | ? |"
done
