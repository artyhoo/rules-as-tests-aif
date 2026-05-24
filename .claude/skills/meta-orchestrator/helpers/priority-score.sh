#!/usr/bin/env bash
# priority-score.sh — §7.3 deterministic data feed for SKILL.md §2 Priority scoring.
#
# Usage: priority-score.sh
#
# Outputs per-candidate data lines for SKILL.md body to score and rank.
# Format: <name> type=<type> kickoff=<exists|missing|synthetic> stage=<1|2|?> volume=<S|M|L|?>
#
# SYNTHETIC ENTRIES (L1 extension — Stage 2 of meta-orchestrator-planner-completeness):
# Beyond real kickoff.md discovery, this helper emits "synthetic" candidate entries for
# 5 additional surface types. Synthetic namespace: <umbrella>-<reason> or <category>-<id>
# — chosen to never collide with a real kickoff.md-derived <name> entry (which is a plain
# directory basename without a dash-reason suffix or category prefix).
#
# Synthetic surface types:
#   (a) cold-review-fixes.md in any .claude/orchestrator-prompts/*/
#   (b) state.md matching PENDING|TODO|AWAITING|REVIEW-PENDING
#   (c) Memory files with TODO-codify: marker
#   (d) Stale open PRs (no update in >14 days)
#   (e) wave-sequencing-plan.md §0 rows marked 🟡 / 🔲 NOT blocked / DEFERRED
#
# Seams for testing:
#   MO_GH_BIN  — override the `gh` binary used for stale-PR detection (default: gh)
#   MO_MEM_DIR — override the memory directory (default: ~/.claude/projects/-Users-art-code-rules-as-tests-aif/memory)
#   MO_WAVE_PLAN — override the wave-sequencing-plan.md path (default: <REPO_ROOT>/docs/meta-factory/wave-sequencing-plan.md)
#   REPO_ROOT  — override repo root (default: git rev-parse --show-toplevel)
#
# The SKILL.md body applies the multi-criteria scoring and ranking (judgment).
# This helper supplies deterministic facts only.
#
# @cc-only-rationale: meta-orchestrator skill helper — runs in-session via !shell injection;
#   no portable equivalent fires at the same moment (PostToolUse timing is CC-specific).
set -euo pipefail

# Seam overrides (used by tests to inject fixtures; set BEFORE git-derived defaults)
# REPO_ROOT may be pre-set by caller (e.g. test harness); if not, derive from git.
REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
PROMPTS_DIR="${REPO_ROOT}/.claude/orchestrator-prompts"

MO_GH_BIN="${MO_GH_BIN:-gh}"
MO_MEM_DIR="${MO_MEM_DIR:-${HOME}/.claude/projects/-Users-art-code-rules-as-tests-aif/memory}"
MO_WAVE_PLAN="${MO_WAVE_PLAN:-${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md}"

echo "=== priority-score: candidate umbrellas ==="

if [[ ! -d "${PROMPTS_DIR}" ]]; then
  echo "(no .claude/orchestrator-prompts directory)"
  exit 0
fi

# ── REAL KICKOFF ENTRIES (existing behaviour — T17 preserve) ─────────────────

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

  # Check for open PRs matching this umbrella prefix.
  # `grep -c` always emits a count (0 if no match) but exits 1 on no match;
  # `|| true` keeps `set -e` happy without duplicating the "0" output that `|| echo 0` produced.
  open_prs="$(${MO_GH_BIN} pr list --search "is:open head:${name}" --json number --limit 5 2>/dev/null \
    | grep -c '"number"' || true)"

  echo "${name} type=${wave_type} kickoff=exists volume=${volume} open_prs=${open_prs} loc=${loc}"
done

# ── SYNTHETIC ENTRIES (L1 extension — non-kickoff discovery surfaces) ────────

echo "=== priority-score: synthetic candidates (L1 extension) ==="

# (a) cold-review-fixes.md — parked handoff docs that need a fresh session to apply
find "${PROMPTS_DIR}" -mindepth 2 -maxdepth 2 -name 'cold-review-fixes.md' 2>/dev/null \
  | while read -r f; do
    umbrella="$(basename "$(dirname "${f}")")"
    loc="$(wc -l < "${f}" 2>/dev/null || echo 0)"
    echo "${umbrella}-cold-review-fixes type=cleanup kickoff=synthetic source=cold-review-fixes loc=${loc}"
  done

# (b) state.md with PENDING/TODO/AWAITING/REVIEW-PENDING — umbrella with unresolved state
find "${PROMPTS_DIR}" -mindepth 2 -maxdepth 2 -name 'state.md' 2>/dev/null \
  | xargs grep -l -iE 'PENDING|TODO|AWAITING|REVIEW-PENDING' 2>/dev/null \
  | while read -r s; do
    umbrella="$(basename "$(dirname "${s}")")"
    echo "${umbrella}-state-pending type=state-followup kickoff=synthetic source=state.md"
  done

# (c) Memory files with TODO-codify: — durable conventions stranded in memory (memory-codification.md §5)
# Avoid pipefail issues: iterate via process substitution + explicit grep test per file.
if [[ -d "${MO_MEM_DIR}" ]]; then
  while IFS= read -r m; do
    # grep -q exits 1 on no match; skip file silently — not an error
    if grep -qE 'TODO-codify:' "${m}" 2>/dev/null; then
      stem="$(basename "${m}" .md)"
      echo "memory-codify-${stem} type=memory-followup kickoff=synthetic source=memory"
    fi
  done < <(find "${MO_MEM_DIR}" -maxdepth 1 -name '*.md' 2>/dev/null)
fi

# (d) Stale open PRs — no update in >14 days (1209600 seconds)
# Uses MO_GH_BIN seam; gracefully skips if gh unavailable or returns no output.
# `jq` required for timestamp arithmetic; if absent, this section is silently skipped.
if command -v jq &>/dev/null; then
  ${MO_GH_BIN} pr list --state open --json number,title,updatedAt --limit 30 2>/dev/null \
    | jq -r --argjson now "$(date +%s)" \
        '.[] | select($now - (.updatedAt | fromdateiso8601) > 1209600)
         | "stale-pr-\(.number) type=stalled kickoff=synthetic source=open-pr"' \
    2>/dev/null || true
fi

# (e) wave-sequencing-plan.md §0 rows marked 🟡 / 🔲 NOT blocked / DEFERRED
# Matches table rows (pipe-delimited) containing the emoji or keyword markers.
# All grep stages use `|| true` to avoid set -e killing the script when no rows match.
if [[ -f "${MO_WAVE_PLAN}" ]]; then
  { grep -E '^\|' "${MO_WAVE_PLAN}" 2>/dev/null || true; } \
    | { grep -E '🟡|🔲[^|]*NOT blocked|DEFERRED' || true; } \
    | sed -E 's/^\| *([^ |]+) *\|.*/\1/' \
    | { grep -E '^[A-Za-z0-9]' || true; } \
    | while read -r row_id; do
        echo "wave-plan-${row_id} type=plan-followup kickoff=synthetic source=wave-plan"
      done
fi
