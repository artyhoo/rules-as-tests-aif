#!/usr/bin/env bash
# dup-detect.sh — L3 semantic dup-detect: kickoff scope vs merged-PR titles (last 30d).
#
# Usage:   dup-detect.sh <umbrella-name>
#          dup-detect.sh --all
#
# Outputs one line per umbrella:
#   POTENTIAL_DUPE: <umbrella> may overlap with merged #<n> "<title>" (basis=xref|jaccard score=<int>%)
#   POTENTIAL_DUPE: <umbrella> deliverable already on staging: <path> (basis=deliverable-on-staging score=100%)
#   OK: <umbrella> no dup-detect signal vs merged-PRs-30d
#
# Three signals combined deterministically (no LLM):
#   (1) cross-reference: kickoff explicitly mentions "#N" of a merged-30d PR (basis=xref)
#   (2) token Jaccard >= MO_JACCARD_THRESHOLD% on significant tokens vs PR title (basis=jaccard)
#   (3) deliverable-on-staging: umbrella slug-tokens match (>=2) a research-patch
#       filename already committed on MO_DELIVERABLE_REF (basis=deliverable-on-staging).
#       Catches the case the xref/jaccard signals miss — the result file is already
#       merged but the (still-uncommitted) kickoff neither cites its PR# nor shares
#       title tokens (the 2026-05-25 mutation-audit miss that motivated this signal).
#
# Seams for testing:
#   REPO_ROOT, MO_GH_BIN, MO_PR_WINDOW_DAYS (default 30), MO_JACCARD_THRESHOLD (default 30)
#   MO_DELIVERABLE_REF (default origin/staging), MO_DELIVERABLE_DIRS (default
#     docs/meta-factory/research-patches) — Signal 3 git-ref + dirs, overridable like REPO_ROOT.
#   PROMPTS_DIR is derived from REPO_ROOT (mirrors priority-score.sh:38).
#   MO_UMBRELLA_SUBSET (Caller A opt-in, default unset) — when set non-empty on the
#     --all path, scan ONLY those whitespace/newline-delimited umbrella names instead
#     of globbing the whole dir. priority-score.sh's completion-detection (Caller A)
#     passes the open-survivor set so the expensive per-umbrella jaccard never runs
#     over an already-closed umbrella (skip-closed perf, 2026-06-17). Off by default;
#     the standalone dedup caller (Caller B, SKILL §2.5 Step 2) never sets it, so its
#     `--all` / single-name behaviour is unchanged. dup-detect stays closure-agnostic:
#     it scans the names it is given and does NOT itself decide what is "closed".
#
# @cc-only-rationale: meta-orchestrator skill helper — runs in-session via !shell injection;
#   no portable equivalent fires at the same moment (PostToolUse timing is CC-specific).
set -uo pipefail

# REPO_ROOT (+ shared resolve_target / tokeniser primitives) sourced from lib/common.sh
# (Stage 4 dedup, BASH_SOURCE-relative so it survives the REPO_ROOT test-seam).
source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
PROMPTS_DIR="$(resolve_orch_home)"
MO_GH_BIN="${MO_GH_BIN:-gh}"
MO_PR_WINDOW_DAYS="${MO_PR_WINDOW_DAYS:-30}"
MO_JACCARD_THRESHOLD="${MO_JACCARD_THRESHOLD:-30}"
MO_DELIVERABLE_REF="${MO_DELIVERABLE_REF:-origin/staging}"
MO_DELIVERABLE_DIRS="${MO_DELIVERABLE_DIRS:-docs/meta-factory/research-patches}"
STOP="$MO_STOP_BASE"

SINCE="$(date -v "-${MO_PR_WINDOW_DAYS}d" '+%Y-%m-%d' 2>/dev/null || date -d "-${MO_PR_WINDOW_DAYS} days" '+%Y-%m-%d' 2>/dev/null || echo '1970-01-01')"
PR_JSON="$("${MO_GH_BIN}" pr list --state merged --search "merged:>=${SINCE}" --json number,title --limit 50 2>/dev/null)" \
  || { echo "(gh unavailable — PR-based signals skipped; deliverable check still runs)" >&2; PR_JSON=""; }

# Tokenise stdin: lowercase, split, keep >=4 chars, strip stopwords. Outputs sorted unique tokens.
tok_stdin() { tr '[:upper:][:punct:]' '[:lower:] ' | tr -s ' ' '\n' | mo_filter_tokens "$STOP"; }

# Precompute the research-patch filename token index ONCE. The deliverable tree and its
# per-file token sets are umbrella-invariant, so scanning + tokenising them inside the
# per-umbrella check_umbrella (Signal 3) was O(umbrellas x patch-files) — the dominant
# cost of `--all` across 100+ umbrellas. Hoisted here: one git ls-tree + one tokenise pass.
# Populates globals DELIV_PATHS / DELIV_FTOKS (parallel arrays, git-ls-tree order preserved
# so the per-umbrella output order is unchanged). Skips empty-token filenames exactly as the
# inline scan did, so the compared set is identical.
precompute_deliverables() {
  DELIV_PATHS=(); DELIV_FTOKS=()
  local dir paths path fbase ftok
  for dir in ${MO_DELIVERABLE_DIRS}; do
    paths="$(git -C "${REPO_ROOT}" ls-tree -r --name-only "${MO_DELIVERABLE_REF}" -- "${dir}" 2>/dev/null || true)"
    [[ -z "${paths}" ]] && continue
    while IFS= read -r path; do
      [[ -z "${path}" ]] && continue
      fbase="$(basename "${path}")"
      ftok="$(printf '%s' "${fbase}" | tok_stdin)"
      [[ -z "${ftok}" ]] && continue
      DELIV_PATHS+=("${path}")
      DELIV_FTOKS+=("${ftok}")
    done < <(printf '%s\n' "${paths}")
  done
}

check_umbrella() {
  local name="$1" kickoff="${PROMPTS_DIR}/$1/kickoff.md" flagged=0
  if [[ ! -f "${kickoff}" ]]; then echo "MISSING: ${name} no kickoff.md found"; return; fi
  local xrefs; xrefs="$(grep -oE '#[0-9]+' "${kickoff}" 2>/dev/null | sed 's/#//' | sort -u || true)"
  local kt; kt="$(grep -E '^## |^### |^- ' "${kickoff}" 2>/dev/null | head -50 | tok_stdin)"
  while IFS= read -r entry; do
    local num; num="$(printf '%s' "${entry}" | grep -oE '"number":[0-9]+' | grep -oE '[0-9]+' || true)"
    local title; title="$(printf '%s' "${entry}" | sed 's/.*"title":"\([^"]*\)".*/\1/')"
    if [[ -z "${num}" ]]; then continue; fi
    # Signal 1: cross-reference fast path
    if printf '%s\n' "${xrefs}" | grep -qxF "${num}" 2>/dev/null; then
      echo "POTENTIAL_DUPE: ${name} may overlap with merged #${num} \"${title:0:60}\" (basis=xref score=100%)"
      flagged=1; continue
    fi
    # Signal 2: token Jaccard
    local pt; pt="$(printf '%s' "${title}" | tok_stdin)"
    if [[ -z "${kt}" || -z "${pt}" ]]; then continue; fi
    local inter; inter="$(comm -12 <(printf '%s\n' "${kt}") <(printf '%s\n' "${pt}") || true)"
    local ic uc score
    ic="$(printf '%s\n' "${inter}" | grep -c . 2>/dev/null || echo 0)"
    uc="$(printf '%s\n%s\n' "${kt}" "${pt}" | sort -u | grep -c . 2>/dev/null || echo 0)"
    ic="${ic//[[:space:]]/}"; uc="${uc//[[:space:]]/}"
    if [[ "${uc}" -eq 0 ]]; then continue; fi
    score=$(( (100 * ic) / uc ))
    if [[ "${score}" -ge "${MO_JACCARD_THRESHOLD}" ]]; then
      echo "POTENTIAL_DUPE: ${name} may overlap with merged #${num} \"${title:0:60}\" (basis=jaccard score=${score}%)"
      flagged=1
    fi
  done < <(printf '%s\n' "${PR_JSON}" | grep -oE '\{[^}]+\}' 2>/dev/null || true)
  # Signal 3: deliverable already committed on the staging ref. Derive significant
  # umbrella slug-tokens (strip -meta-launch/-iphase/-rphase suffixes), then compare
  # against the research-patch filename tokens precomputed ONCE in DELIV_PATHS/DELIV_FTOKS
  # (the tree + per-file tokens are umbrella-invariant — recomputing them inside this
  # per-umbrella function was O(umbrellas x patch-files); hoisted to precompute_deliverables).
  # The >=2 floor avoids false hits on a single shared word. Deterministic; no LLM, no gh.
  local base_name; base_name="$(printf '%s' "${name}" | sed -E 's/-(meta-launch|iphase|rphase)$//')"
  local utok; utok="$(printf '%s' "${base_name}" | tok_stdin)"
  if [[ -n "${utok}" ]]; then
    # Iterate the precomputed arrays by index count (git-ls-tree order preserved →
    # output order identical to the pre-hoist per-umbrella scan). ${#arr[@]} is
    # empty-array-safe under `set -u` on bash 3.2 (macOS default); ${!arr[@]} is not.
    local n="${#DELIV_PATHS[@]}" i=0 common ccount
    while [[ "${i}" -lt "${n}" ]]; do
      common="$(comm -12 <(printf '%s\n' "${utok}") <(printf '%s\n' "${DELIV_FTOKS[$i]}") || true)"
      ccount="$(printf '%s\n' "${common}" | grep -c . 2>/dev/null || echo 0)"
      ccount="${ccount//[[:space:]]/}"
      if [[ "${ccount}" -ge 2 ]]; then
        echo "POTENTIAL_DUPE: ${name} deliverable already on staging: ${DELIV_PATHS[$i]} (basis=deliverable-on-staging score=100%)"
        flagged=1
      fi
      i=$((i+1))
    done
  fi
  if [[ "${flagged}" -eq 0 ]]; then echo "OK: ${name} no dup-detect signal vs merged-PRs-30d"; fi
}

# Build the umbrella-invariant deliverable token index once; check_umbrella reads it per umbrella.
precompute_deliverables

ARG="${1:-}"
# Empty arg = --all (silent fall-through). Lets SKILL.md §2.5 Step 2 use a single
# allow-rule pattern instead of a compound `<arg> || --all` chain that no single
# rule matches. Stage 4 P4-b, meta-orch-no-arg-overview umbrella 2026-05-28.
if [[ -z "${ARG}" || "${ARG}" == "--all" ]]; then
  # Caller A opt-in (skip-closed perf): when MO_UMBRELLA_SUBSET is set non-empty,
  # scan ONLY those names. Umbrella names are kebab-case (alnum + hyphen, no spaces)
  # so unquoted word-splitting on whitespace/newlines is safe. Off by default →
  # Caller B (standalone dedup) and any plain --all are unchanged (full glob below).
  if [[ -n "${MO_UMBRELLA_SUBSET:-}" ]]; then
    for name in ${MO_UMBRELLA_SUBSET}; do check_umbrella "${name}"; done
  else
    if [[ ! -d "${PROMPTS_DIR}" ]]; then echo "(no orchestrator-prompts dir)"; exit 0; fi
    for d in "${PROMPTS_DIR}"/*/; do check_umbrella "$(basename "${d}")"; done
  fi
else
  check_umbrella "${ARG}"
fi
