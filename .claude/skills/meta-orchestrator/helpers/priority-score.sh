#!/usr/bin/env bash
# priority-score.sh — §7.3 deterministic data feed for SKILL.md §2 Priority scoring.
#
# Usage: priority-score.sh
#
# Outputs per-candidate data lines for SKILL.md body to score and rank.
# Format: <name> type=<type> kickoff=<exists|missing|synthetic> stage=<1|2|?> volume=<S|M|L|?>
#
# COMPLETION-DETECTION LAYERS (meta-orch-no-arg-overview Stage 2):
# For each real kickoff entry, a tri-layer classifier determines if the umbrella is DONE.
# Layer evaluation order: C1 (branch) → C2 (jaccard) → C3 (done.md). First-match-wins.
#
#   completion Layer C1 (branch-prefix match, ~13% empirical coverage per §1.5c):
#     Strip conventional branch prefix from merged-PR headRefNames; exact-match against
#     umbrella name. Covers single-stage umbrellas with clean `feat/<name>` branches.
#
#   completion Layer C2 (jaccard PR-title overlap, ~4% additional per §4 estimate):
#     REUSE dup-detect.sh jaccard logic (sub-shell call + output parsing). Any
#     POTENTIAL_DUPE: line from dup-detect.sh --all implies completion candidate for
#     the named umbrella. Uses MO_JACCARD_THRESHOLD (default 30%) from dup-detect.sh.
#     SSOT: helpers/dup-detect.sh:62 — zero new LOC for the jaccard algorithm itself.
#
#   completion Layer C3 (done.md file, load-bearing fallback — ADAPT Cline SSOT #77):
#     Check ${PROMPTS_DIR}/<umbrella>/done.md existence. If present, parse
#     "Final PR: #<num>" line and tag status=DONE done_pr=<num> basis=done-md.
#     ADAPT Cline Memory Bank committed-markdown sub-pattern (~85% problem-class match
#     on storage format; diverges on update trigger: Cline = on-demand AI-signalled,
#     ours = explicit convention at last-stage umbrella merge).
#
# NOTE on "L1 extension" terminology below: the "L1 extension" label in the SYNTHETIC
# ENTRIES section refers to Stage 2 of the meta-orchestrator-planner-completeness umbrella
# (8 synthetic surface types). It is UNRELATED to the completion-detection layers C1/C2/C3
# above. Do not conflate.
#
# SYNTHETIC ENTRIES (synthetic-candidate extension — Stage 2 of meta-orchestrator-planner-completeness):
# Beyond real kickoff.md discovery, this helper emits "synthetic" candidate entries for
# 8 additional surface types. Synthetic namespace: <umbrella>-<reason> or <category>-<id>
# — chosen to never collide with a real kickoff.md-derived <name> entry (which is a plain
# directory basename without a dash-reason suffix or category prefix).
#
# Synthetic surface types:
#   (a) cold-review-fixes.md in any .claude/orchestrator-prompts/*/
#   (b) state.md matching PENDING|TODO|AWAITING|REVIEW-PENDING
#   (c) Memory files with TODO-codify: marker
#   (d) Stale open PRs (no update in >14 days)
#   (e) wave-sequencing-plan.md §0 rows marked 🟡 / 🔲 NOT blocked / DEFERRED
#   (f) open-questions.md §13.x entries
#   (g) // TODO:|FIXME:|XXX: in packages/**/*.ts (DN-1 scope)
#   (h) research-patches with §future / Known residuals / Residuals / MINOR observations
#
# Seams for testing:
#   MO_GH_BIN        — override the `gh` binary used for stale-PR detection (default: gh)
#   MO_DUP_DETECT_BIN — override the dup-detect.sh binary used for C2 jaccard (default: auto-resolve from helpers/)
#   MO_MEM_DIR       — override the memory directory (default: ~/.claude/projects/-Users-art-code-rules-as-tests-aif/memory)
#   MO_WAVE_PLAN     — override the wave-sequencing-plan.md path (default: <REPO_ROOT>/docs/meta-factory/wave-sequencing-plan.md)
#   MO_OPEN_QUESTIONS — override the open-questions.md path (default: <REPO_ROOT>/docs/meta-factory/open-questions.md)
#   MO_PACKAGES_DIR  — override the packages directory (default: <REPO_ROOT>/packages)
#   MO_PATCHES_DIR   — override the research-patches directory (default: <REPO_ROOT>/docs/meta-factory/research-patches)
#   REPO_ROOT        — override repo root (default: git rev-parse --show-toplevel)
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
# C2 jaccard seam: override dup-detect.sh path for testing (completion-detection Layer C2).
_DEFAULT_DUP_DETECT="${REPO_ROOT}/.claude/skills/meta-orchestrator/helpers/dup-detect.sh"
MO_DUP_DETECT_BIN="${MO_DUP_DETECT_BIN:-${_DEFAULT_DUP_DETECT}}"
MO_MEM_DIR="${MO_MEM_DIR:-${HOME}/.claude/projects/-Users-art-code-rules-as-tests-aif/memory}"
MO_WAVE_PLAN="${MO_WAVE_PLAN:-${REPO_ROOT}/docs/meta-factory/wave-sequencing-plan.md}"
MO_OPEN_QUESTIONS="${MO_OPEN_QUESTIONS:-${REPO_ROOT}/docs/meta-factory/open-questions.md}"
MO_PACKAGES_DIR="${MO_PACKAGES_DIR:-${REPO_ROOT}/packages}"
MO_PATCHES_DIR="${MO_PATCHES_DIR:-${REPO_ROOT}/docs/meta-factory/research-patches}"

echo "=== priority-score: candidate umbrellas ==="

if [[ ! -d "${PROMPTS_DIR}" ]]; then
  echo "(no .claude/orchestrator-prompts directory)"
  exit 0
fi

# ── completion Layer C1: fetch merged-PR headRefNames once (BRANCH-MATCHER) ──────────────────
# completion-detection Layer C1 (branch-prefix match, meta-orch-no-arg-overview Stage 2-extend).
# Counters T-NoArg-A `#open-prs-zero-equals-no-work`: open_prs=0 alone is not a
# completion signal. A merged PR with headRefName `feat/<umbrella>` (or fix/chore/
# docs/research prefix) signals umbrella DONE via exact-match after prefix strip.
# Multi-stage umbrellas use `feat/<umbrella>-s<N>` branches — these stay candidates
# by convention (no false DONE on partial-progress, matching kickoff §3 self-app test).
# Counters T-NoArg-B: does NOT grep '#<num>' from kickoff (kickoff written before PRs).
# Counters T-NoArg-C: does NOT rely on PR-title word overlap (that is Layer C2's job).
merged_prs_json="$(${MO_GH_BIN} pr list --state merged --json number,headRefName --limit 100 2>/dev/null || echo '[]')"

# ── completion Layer C2: dup-detect.sh jaccard pre-fetch (REUSE, sub-shell) ─────────────────
# completion-detection Layer C2 (jaccard title overlap, meta-orch-no-arg-overview Stage 2-extend).
# REUSE: calls dup-detect.sh --all (sub-shell approach — option (a); preserves dup-detect.sh
# callers unchanged, avoids modifying a Stage-4-owned file per §6 Option B).
# Parse output: "POTENTIAL_DUPE: <umbrella> may overlap with merged #<num> ..." lines only.
# Populated once; per-umbrella lookup is a grep against this variable.
# If dup-detect.sh unavailable or gh fails, falls back to empty string (C2 skipped; C3 still runs).
_dup_detect_all_output=""
if [[ -x "${MO_DUP_DETECT_BIN}" ]]; then
  _dup_detect_all_output="$(REPO_ROOT="${REPO_ROOT}" MO_GH_BIN="${MO_GH_BIN}" \
    "${MO_DUP_DETECT_BIN}" --all 2>/dev/null || true)"
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

  # ── Completion-detection tri-layer classifier (C1 → C2 → C3, first-match-wins) ──
  done_pr=""
  done_basis=""

  # completion Layer C1 — branch-prefix match (consumes merged_prs_json from above).
  # Exact-match umbrella name against merged-PR headRefName after stripping conventional
  # branch prefix. Skipped silently if jq absent or merged_prs_json is empty.
  if [[ -z "${done_pr}" ]] && command -v jq &>/dev/null \
      && [[ -n "${merged_prs_json}" && "${merged_prs_json}" != "[]" ]]; then
    done_pr="$(echo "${merged_prs_json}" \
      | jq -r --arg name "${name}" \
          '.[] | select((.headRefName | sub("^(feat|fix|chore|docs|research)/"; "")) == $name) | .number' \
      2>/dev/null | head -n1 || true)"
    [[ -n "${done_pr}" ]] && done_basis="branch"
  fi

  # completion Layer C2 — jaccard PR-title overlap (REUSE dup-detect.sh sub-shell output).
  # Consumes _dup_detect_all_output pre-fetched above. Parses "POTENTIAL_DUPE: <umbrella> ..."
  # lines; extracts PR number from "merged #<num>" pattern. First match wins per umbrella.
  if [[ -z "${done_pr}" && -n "${_dup_detect_all_output}" ]]; then
    _c2_line="$(printf '%s\n' "${_dup_detect_all_output}" \
      | grep "^POTENTIAL_DUPE: ${name} " | head -n1 || true)"
    if [[ -n "${_c2_line}" ]]; then
      done_pr="$(printf '%s' "${_c2_line}" | grep -oE 'merged #[0-9]+' | grep -oE '[0-9]+' | head -n1 || true)"
      # Extract score for output annotation (e.g. "score=42%")
      _c2_score="$(printf '%s' "${_c2_line}" | grep -oE 'score=[0-9]+%' | head -n1 || true)"
      [[ -n "${done_pr}" ]] && done_basis="jaccard${_c2_score:+ ${_c2_score}}"
    fi
  fi

  # completion Layer C3 — committed done.md (ADAPT Cline SSOT #77 committed-markdown sub-pattern).
  # Check <umbrella>/done.md existence; parse "Final PR: #<num>" line.
  # Load-bearing fallback: deterministic (file-presence), zero gh rate-limit cost.
  if [[ -z "${done_pr}" && -f "${dir}done.md" ]]; then
    done_pr="$(grep -m1 '^- Final PR: #' "${dir}done.md" 2>/dev/null \
      | grep -oE '[0-9]+' | head -n1 || true)"
    [[ -n "${done_pr}" ]] && done_basis="done-md"
  fi

  # Emit candidate line with optional DONE tag (basis indicates which layer matched).
  if [[ -n "${done_pr}" ]]; then
    echo "${name} type=${wave_type} kickoff=exists volume=${volume} open_prs=${open_prs} loc=${loc} status=DONE done_pr=${done_pr} basis=${done_basis}"
  else
    echo "${name} type=${wave_type} kickoff=exists volume=${volume} open_prs=${open_prs} loc=${loc}"
  fi
done

# ── SYNTHETIC ENTRIES (synthetic-candidate extension — non-kickoff discovery surfaces) ──────
# NOTE: "synthetic-candidate extension" label replaces the earlier "L1 extension" comment to
# avoid confusion with completion-detection layers C1/C2/C3 introduced above. The underlying
# logic is unchanged — this is the same 8-surface synthetic discovery from Stage 2 of the
# meta-orchestrator-planner-completeness umbrella.

echo "=== priority-score: synthetic candidates (synthetic-candidate extension) ==="

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

# (f) open-questions.md §13.x entries — emit one synthetic entry per §13.<id> heading
if [[ -f "${MO_OPEN_QUESTIONS}" ]]; then
  { grep -nE '^### 13\.[0-9]+' "${MO_OPEN_QUESTIONS}" 2>/dev/null || true; } \
    | sed -E 's/^[0-9]+:### 13\.([0-9]+).*/\1/' \
    | while read -r id; do
        echo "openq-§13-${id} type=open-question kickoff=synthetic source=open-questions"
      done
fi

# (g) // TODO:|FIXME:|XXX: in packages/**/*.ts (DN-1 scope: packages/ only, exclude node_modules + test files)
if [[ -d "${MO_PACKAGES_DIR}" ]]; then
  { grep -rnE '//[[:space:]]*(TODO|FIXME|XXX):' "${MO_PACKAGES_DIR}" \
      --include='*.ts' --exclude-dir=node_modules \
      --exclude='*.test.ts' --exclude='*.unit.ts' --exclude='*.spec.ts' 2>/dev/null \
    || true; } \
    | while IFS=: read -r match_file lineno _rest; do
        rel="${match_file#${REPO_ROOT}/}"
        echo "todo-${rel}-${lineno} type=code-todo kickoff=synthetic source=code-todo"
      done
fi

# (h) research-patches with §future / Known residuals / Residuals / MINOR observations sections
if [[ -d "${MO_PATCHES_DIR}" ]]; then
  { grep -rlE '^## (§future|Known residuals|Residuals|MINOR observations)' "${MO_PATCHES_DIR}" 2>/dev/null || true; } \
    | while read -r pf; do pb="$(basename "${pf}" .md)"
        { grep -oE '^## (§future|Known residuals|Residuals|MINOR observations)' "${pf}" 2>/dev/null || true; } \
          | sed -E 's/^## //;s/§//g;s/ /-/g' | tr '[:upper:]' '[:lower:]' \
          | while read -r a; do echo "residual-${pb}-${a} type=residual kickoff=synthetic source=research-patch-residual"; done
      done
fi
