#!/usr/bin/env bash
# legacy-trailer-checks.sh — TEMPORARY shim (Wave 10.2 trimmed)
#
# Wave 10.1 extracted §7 (Prior-art, pa_*) + §1.7 (s17_*) from .husky/pre-push
# into this file for incremental TS migration. Wave 10.2 ports pa_* to TS
# (packages/core/hooks/checks/prior-art.ts); the pa_* block is removed here.
# This file now contains §1.7-only (s17_* functions).
#
#   - §1.7 s17_check_trailer → Wave 10.3  (packages/core/hooks/checks/s17.ts)
#
# Do NOT add new logic here — this is a migration shim, not a home for new checks.
# Invoked by packages/core/hooks/pre-push.ts via runCheck('bash', [this]) for §1.7.
set -euo pipefail

UPSTREAM_REF="origin/main"
if git rev-parse --verify "$UPSTREAM_REF" &>/dev/null; then
  COMMITS=$(git rev-list "${UPSTREAM_REF}..HEAD" 2>/dev/null || true)

  # ── §1.7 discipline trailer check ─────────────────────────────────────────
  # Enforces §1.7 forward+backward check trailer on commits introducing or
  # extending rules / principles / disciplines (per .claude/rules/phase-research-
  # coverage.md §1.7). Push-time gate; commit-time would force trailer onto every
  # WIP commit. Default mode: warn-only for 30 days post-ship (D1 calibration).
  #
  # §1.7 allow-list (D3): commit subjects starting with one of the prefixes below
  # bypass the §1.7 check (they are doc-only or already-disciplined surfaces):
  #   docs(research-patches):  chore(snapshot-regen):  chore(prior-art-update):
  # Maintenance: when a new safe prefix emerges, update this list AND the regex below.
  #
  # Substance arm (Wave 8.3): s17_check_trailer() additionally verifies that a
  # valid §1.7: trailer contains ≥1 file:line citation ([^[:space:]]+\.[a-z]+:[0-9]+).
  # Generic stubs («Checked all rules — compliant») pass the length+placeholder
  # check but lack structural evidence; the substance arm returns exit 2 to
  # distinguish substance failures from missing-trailer failures (exit 1).
  # S17_SUBSTANCE_WARN_ONLY matures independently from S17_WARN_ONLY so the
  # substance arm can be calibrated without flipping the presence gate.
  # TODO 2026-06-10: flip default to S17_WARN_ONLY=false; promote enforcement.
  # TODO 2026-06-10: flip default to S17_SUBSTANCE_WARN_ONLY=false; promote substance enforcement.
  # Wave 8.5 historical cutoff. Commits authored before this date predate
  # the substance arms; replayed (e.g. rebased) historical commits MUST NOT
  # be retroactively blocked by gates that didn't exist when they were authored.
  S17_HISTORICAL_CUTOFF="2026-05-12"

  S17_WARN_ONLY="${S17_WARN_ONLY:-true}"
  S17_SUBSTANCE_WARN_ONLY="${S17_SUBSTANCE_WARN_ONLY:-true}"
  S17_ALLOWLIST_RE='^(docs\(research-patches\)|chore\(snapshot-regen\)|chore\(prior-art-update\)):'

  s17_is_discipline_introducing() {
    local sha="$1" subject changed_files rule_paths
    subject=$(git show -s --format=%s "$sha")
    # D3 allow-list bypass
    if printf '%s' "$subject" | grep -qE "$S17_ALLOWLIST_RE"; then
      return 1
    fi
    # File-glob predicate
    changed_files=$(git diff-tree --no-commit-id --name-only -r "$sha" 2>/dev/null || true)
    printf '%s\n' "$changed_files" \
      | grep -qE '^(\.claude/rules/[^/]+\.md|packages/core/principles/[^/]+\.test\.ts|\.claude/skills/[^/]+/SKILL\.md)$' \
      || return 1
    # Section-marker content predicate (new ## § heading OR new top-level export const)
    rule_paths=$(printf '%s\n' "$changed_files" \
      | grep -E '^(\.claude/rules/|packages/core/principles/|\.claude/skills/)' || true)
    [ -n "$rule_paths" ] || return 1
    # shellcheck disable=SC2086
    LC_ALL=en_US.UTF-8 git show "$sha" -- $rule_paths 2>/dev/null \
      | LC_ALL=en_US.UTF-8 grep -qE '^\+(## §|export const [A-Z_]+: )' \
      || return 1
    return 0
  }

  s17_check_trailer() {
    local sha="$1" body line payload bs_payload word word_lc all_placeholder
    # Wave 8.5 historical cutoff — pre-cutoff commits bypass the §1.7 substance
    # check to avoid retroactive blocking of pre-Wave-8 history replayed via rebase.
    local author_date
    author_date=$(git show -s --format=%ai "$sha" | cut -d' ' -f1)
    if [ "$author_date" \< "${S17_HISTORICAL_CUTOFF:-2026-05-12}" ]; then
      return 0
    fi
    body=$(git show -s --format=%B "$sha")
    # Bootstrap exemption B1
    if LC_ALL=en_US.UTF-8 printf '%s\n' "$body" \
        | LC_ALL=en_US.UTF-8 grep -qE '^§1\.7 Bootstrap:'; then
      bs_payload=$(LC_ALL=en_US.UTF-8 printf '%s\n' "$body" \
        | LC_ALL=en_US.UTF-8 grep -E '^§1\.7 Bootstrap:' | head -1 \
        | sed 's/^§1\.7 Bootstrap:[[:space:]]*//')
      if [ "${#bs_payload}" -ge 20 ]; then
        all_placeholder=1
        for word in $bs_payload; do
          word_lc=$(printf '%s' "$word" | tr '[:upper:]' '[:lower:]' | tr -d '[:punct:]')
          case "$word_lc" in
            todo|later|na|tbd|fixme|placeholder|"") ;;
            *) all_placeholder=0; break ;;
          esac
        done
        [ "$all_placeholder" = "0" ] && return 0
      fi
    fi
    # Standard §1.7 trailer
    while IFS= read -r line; do
      case "$line" in
        "§1.7:"*)
          payload="${line#§1.7:}"
          payload="${payload# }"
          [ "${#payload}" -ge 40 ] || continue
          all_placeholder=1
          for word in $payload; do
            word_lc=$(printf '%s' "$word" | tr '[:upper:]' '[:lower:]' | tr -d '[:punct:]')
            case "$word_lc" in
              todo|later|na|tbd|fixme|placeholder|"") ;;
              *) all_placeholder=0; break ;;
            esac
          done
          if [ "$all_placeholder" = "0" ]; then
            # Substance arm (Wave 8.3): require ≥1 file:line citation.
            # Pattern: non-whitespace chars, a dot, lowercase extension, colon, digits.
            # Examples: packages/core/principles/02.test.ts:82  .claude/rules/foo.md:10
            if printf '%s' "$payload" | grep -qE '[^[:space:]]+\.[a-z]+:[0-9]+'; then
              return 0
            fi
            printf '%s' "§1.7: trailer present but lacks file:line citation (substance check — Wave 8.3)"
            return 2
          fi
          ;;
      esac
    done <<< "$body"
    # Wave 9.4 — body-prose §1.7 without formal trailer.
    # Body had no valid trailer line (else returned 0 above). Check if §1.7 appears
    # in discourse (not within a URL/path) — that's substance failure
    # (theatre-shaped prose, C1 form). Pattern (^|[^/])§1\.7 excludes URL embeddings
    # like `/§1.7-spec` while still catching discourse mentions like ` §1.7 done`.
    # Reuses S17_SUBSTANCE_WARN_ONLY flag for unified calibration with Wave 8.3 arm.
    if printf '%s' "$body" | LC_ALL=en_US.UTF-8 grep -qE '(^|[^/])§1\.7'; then
      printf '%s' "§1.7 mentioned in commit body prose but no formal trailer line (substance check — Wave 9.4)"
      return 2
    fi
    printf '%s' "no valid §1.7: trailer (or bootstrap)"
    return 1
  }

  S17_FAILURES=""
  S17_SUBSTANCE_FAILURES=""
  for sha in $COMMITS; do
    if s17_is_discipline_introducing "$sha"; then
      err=""; rc=0
      err=$(s17_check_trailer "$sha" 2>&1) || rc=$?
      if [ "$rc" -eq 1 ]; then
        S17_FAILURES="${S17_FAILURES}  ${sha:0:10}  ${err}\n"
      elif [ "$rc" -eq 2 ]; then
        S17_SUBSTANCE_FAILURES="${S17_SUBSTANCE_FAILURES}  ${sha:0:10}  ${err}\n"
      fi
    fi
  done

  if [ -n "$S17_FAILURES" ]; then
    if [ "$S17_WARN_ONLY" = "true" ]; then
      printf '\n⚠ §1.7 trailer missing or invalid on rule-introducing commit(s):\n'
      printf '%b' "$S17_FAILURES"
      printf '\nCalibration window: warn-only through 2026-06-10 (30 days from ship). Set S17_WARN_ONLY=false to enforce locally.\n'
      printf 'Fix: add `§1.7: forward-check applied — …; backward-check sweep — …` to commit body.\n\n'
    else
      printf '\n❌ §1.7 trailer missing or invalid on rule-introducing commit(s):\n'
      printf '%b' "$S17_FAILURES"
      printf '\nFix: add `§1.7: forward-check applied — …; backward-check sweep — …` to commit body.\n'
      printf 'Bootstrap exemption: `§1.7 Bootstrap: <reason>` (≥20 chars rationale).\n\n'
      exit 1
    fi
  fi

  if [ -n "$S17_SUBSTANCE_FAILURES" ]; then
    if [ "$S17_SUBSTANCE_WARN_ONLY" = "true" ]; then
      printf '\n⚠ §1.7 trailer lacks file:line citation on rule-introducing commit(s) (substance arm — Wave 8.3):\n'
      printf '%b' "$S17_SUBSTANCE_FAILURES"
      printf '\nCalibration window: warn-only through 2026-06-10. Set S17_SUBSTANCE_WARN_ONLY=false to enforce locally.\n'
      printf 'Fix: include ≥1 file:line citation, e.g. `packages/core/principles/02.test.ts:82`.\n\n'
    else
      printf '\n❌ §1.7 trailer lacks file:line citation on rule-introducing commit(s) (substance arm — Wave 8.3):\n'
      printf '%b' "$S17_SUBSTANCE_FAILURES"
      printf '\nFix: include ≥1 file:line citation, e.g. `packages/core/principles/02.test.ts:82`.\n'
      printf 'Bootstrap exemption: `§1.7 Bootstrap: <reason>` (≥20 chars rationale).\n\n'
      exit 1
    fi
  fi
fi
