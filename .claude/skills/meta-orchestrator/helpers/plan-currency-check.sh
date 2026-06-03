#!/usr/bin/env bash
# plan-currency-check.sh — §7.2 deterministic data feed for SKILL.md §1 Plan-currency check.
#
# Usage: plan-currency-check.sh [<umbrella-name>]
#
# Outputs deterministic data that SKILL.md body uses for drift detection (judgment).
# This helper surfaces facts; SKILL.md performs the comparison and emits verdict.
#
# L2 extension (Stage 3, meta-orchestrator-planner-completeness): adds reverse-currency
# checks — reality → plan mismatches emitted as UNTRACKED-<N> and UNTRACKED-KICKOFF lines.
#
# Seams for testing (reuse L1 vocabulary verbatim — T13):
#   REPO_ROOT    — override repo root (default: git rev-parse --show-toplevel)
#   MO_GH_BIN   — override the `gh` binary (default: gh)
#   MO_WAVE_PLAN — override the wave-sequencing-plan.md path
#                  (default: <REPO_ROOT>/docs/meta-factory/wave-sequencing-plan.md)
#
# @cc-only-rationale: meta-orchestrator skill helper — runs in-session via !shell injection;
#   no portable equivalent fires at the same moment (PostToolUse timing is CC-specific).
set -euo pipefail

UMBRELLA="${1:-}"

# Seam overrides (used by tests to inject fixtures; set BEFORE git-derived defaults)
# REPO_ROOT may be pre-set by caller (e.g. test harness); if not, derive from git.
# REPO_ROOT (+ shared resolve_target / tokeniser primitives) sourced from lib/common.sh
# (Stage 4 dedup, BASH_SOURCE-relative so it survives the REPO_ROOT test-seam).
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
MO_GH_BIN="${MO_GH_BIN:-gh}"
MO_WAVE_PLAN="${MO_WAVE_PLAN:-${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md}"

echo "=== plan-currency-check: umbrella='${UMBRELLA}' ==="
echo "--- git status (short) ---"
git -C "${REPO_ROOT}" status --short 2>/dev/null | head -10 || echo "(git unavailable)"

echo "--- branch + ahead/behind ---"
git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || echo "(no branch)"
git -C "${REPO_ROOT}" rev-list --count --left-right "origin/staging...HEAD" 2>/dev/null \
  || echo "(no upstream tracking)"

echo "--- fetch + cross-check vs origin/staging (fresh-PR detector — Gap-2 round-2 follow-up) ---"
# Without this fetch, the ahead/behind above + the open/merged PR lists below all rely
# on the local copy of origin/staging, which may be days stale → fresh merges since last
# sync are invisible. We fetch fail-soft (offline/auth-failure → echoed warning, not exit-1).
git -C "${REPO_ROOT}" fetch --quiet origin staging 2>/dev/null \
  || echo "(fetch failed — origin/staging may be stale, fresh-PR detection compromised)"
REMOTE_ONLY="$(git -C "${REPO_ROOT}" rev-list --count "HEAD..origin/staging" 2>/dev/null || echo '?')"
echo "commits on origin/staging not in HEAD: ${REMOTE_ONLY}"
if [[ "${REMOTE_ONLY}" != "0" && "${REMOTE_ONLY}" != "?" ]]; then
  echo "  recent remote-only commits (likely merged PRs since last local sync):"
  git -C "${REPO_ROOT}" log "HEAD..origin/staging" --oneline -10 2>/dev/null | sed 's/^/    /'
fi

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

# ── L2 REVERSE-CURRENCY (Stage 3 — reality → plan) ───────────────────────────
# Emits UNTRACKED-<N> and UNTRACKED-KICKOFF lines for items that exist in git
# reality but are absent from wave-sequencing-plan.md §0.
# Both checks additive — existing plan-claims-vs-reality DRIFT detection above
# is preserved intact (T17).
echo "--- reverse-currency (L2 extension — reality → plan): UNTRACKED entries ---"

if [[ ! -f "${MO_WAVE_PLAN}" ]]; then
  echo "(WARN: ${MO_WAVE_PLAN} not found — skipping reverse-currency checks)"
else
  # (a) Merged PRs (last 30 days) not referenced in wave-sequencing-plan.md
  # Uses MO_GH_BIN seam; gracefully skips if gh unavailable or jq absent.
  if command -v jq &>/dev/null; then
    ${MO_GH_BIN} pr list \
      --state merged \
      --limit 100 \
      --json number,title,mergedAt \
      2>/dev/null \
      | jq -r --argjson cutoff "$(date -v-30d +%s 2>/dev/null || date -d '30 days ago' +%s 2>/dev/null || echo 0)" \
          '.[] | select((.mergedAt | fromdateiso8601) >= $cutoff)
           | "\(.number)\t\(.title)"' \
      2>/dev/null \
      | while IFS='	' read -r pr_num pr_title; do
          if ! grep -qF "#${pr_num}" "${MO_WAVE_PLAN}" 2>/dev/null; then
            # Truncate title to 60 chars
            short_title="${pr_title:0:60}"
            echo "UNTRACKED-${pr_num}: merged PR #${pr_num} \"${short_title}\" not referenced in wave-sequencing-plan.md"
          fi
        done || true
  fi

  # (b) Kickoff.md files whose umbrella name is absent from wave-sequencing-plan.md
  PROMPTS_DIR="${REPO_ROOT}/.claude/orchestrator-prompts"
  if [[ -d "${PROMPTS_DIR}" ]]; then
    find "${PROMPTS_DIR}" -mindepth 2 -maxdepth 2 -name 'kickoff.md' 2>/dev/null \
      | while read -r kickoff_path; do
          umbrella_name="$(basename "$(dirname "${kickoff_path}")")"
          if ! grep -qF "${umbrella_name}" "${MO_WAVE_PLAN}" 2>/dev/null; then
            echo "UNTRACKED-KICKOFF: ${umbrella_name} has kickoff.md but not in §0"
          fi
        done || true
  fi
fi
