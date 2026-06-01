#!/usr/bin/env bash
# pre-push.fallback.sh — critical-only bash fallback (Wave 10.5).
# Runs when Node ≥20 is unavailable (see .husky/pre-push dispatcher).
# Critical checks (CHECK_REGISTRY criticalForFallback: true, registry.ts):
#   prior-art-presence: §7 "Prior-art:" trailer PRESENCE (no substance arm)
#   s17-presence:       §1.7 trailer PRESENCE (no file:line arm)
# Upstream pattern: Aider §4.8.X.2 check-registry ADAPT (SSOT #59).
#
# Base-ref detection mirrors pre-push.ts's resolver (dual-implementation-discipline
# §5; hook-base-ref-detection I-phase): env override > git pre-push stdin remote_sha
# > default origin/staging — never a silent skip. The former hard-coded
# origin/staging default silently no-op'd on any consumer repo lacking a `staging`
# branch (the channel install.sh actually ships).
# @dual-pair: pre-push-critical-checks
set -euo pipefail

Z40="0000000000000000000000000000000000000000"
HISTORICAL_CUTOFF="2026-05-12"
# §1.7 allow-list — parity with s17.ts:18 ALLOWLIST_RE (these subjects never require a §1.7 trailer).
S17_ALLOWLIST_RE='^(docs\(research-patches\)|chore\(snapshot-regen\)|chore\(prior-art-update\)):'
fail=0

# Resolve the commits being pushed into COMMITS (newline-separated). Precedence
# matches pre-push.ts resolveBase(): env > stdin remote_sha (Z40 → not-on-remotes)
# > origin/staging default. Returns non-zero when nothing resolves (caller skips
# with a visible message — not a silent pass).
COMMITS=""
resolve_commits() {
  if [ -n "${PREPUSH_UPSTREAM_REF:-}" ]; then
    if git rev-parse --verify "${PREPUSH_UPSTREAM_REF}" >/dev/null 2>&1; then
      COMMITS=$(git rev-list "${PREPUSH_UPSTREAM_REF}..HEAD" 2>/dev/null || true); return 0
    fi
    echo "⚠ fallback: PREPUSH_UPSTREAM_REF='${PREPUSH_UPSTREAM_REF}' not found — skipping (not a silent pass)."; return 1
  fi
  # git pre-push stdin: <local_ref> <local_sha> <remote_ref> <remote_sha> (first line).
  if [ ! -t 0 ]; then
    local l_ref l_sha r_ref r_sha
    if read -r l_ref l_sha r_ref r_sha && [ -n "${r_sha:-}" ]; then
      if [ "${r_sha}" != "${Z40}" ] && git rev-parse --verify "${r_sha}^{commit}" >/dev/null 2>&1; then
        COMMITS=$(git rev-list "${r_sha}..HEAD" 2>/dev/null || true)
      else
        # new branch (Z40) or unknown remote sha → commits not on any remote.
        COMMITS=$(git rev-list "${l_sha:-HEAD}" --not --remotes 2>/dev/null || true)
      fi
      return 0
    fi
  fi
  if git rev-parse --verify "origin/staging" >/dev/null 2>&1; then
    COMMITS=$(git rev-list "origin/staging..HEAD" 2>/dev/null || true); return 0
  fi
  echo "⚠ fallback: could not determine a base ref (no PREPUSH_UPSTREAM_REF, no git stdin, no origin/staging) — skipping (not a silent pass)."; return 1
}

resolve_commits || exit 0
[ -z "${COMMITS}" ] && echo "✅ fallback: no new commits." && exit 0

while IFS= read -r sha; do
  [ -z "${sha}" ] && continue
  body="$(git show -s --format='%B' "${sha}")"
  author_date="$(git show -s --format='%ai' "${sha}" | cut -d' ' -f1)"
  subject="$(git show -s --format='%s' "${sha}")"

  # Historical cutoff bypass (rebase replay).
  if [[ "${author_date}" < "${HISTORICAL_CUTOFF}" ]]; then
    continue
  fi

  # prior-art-presence: §7 Prior-art trailer PRESENCE
  if ! echo "${body}" | grep -q "^Prior-art:"; then
    echo "❌ ${sha}  §7 Prior-art: trailer MISSING — ${subject}"
    echo "   Fix: add 'Prior-art: ...' to commit body (≥20 chars). See CONTRIBUTING.md."
    fail=1
  else
    echo "✅ ${sha}  §7 Prior-art: present"
  fi

  # s17-presence: §1.7 discipline trailer PRESENCE (only on discipline-touching commits)
  if [[ "${subject}" =~ $S17_ALLOWLIST_RE ]]; then
    : # allow-listed subject — §1.7 not required (parity with s17.ts:18 isDisciplineIntroducing)
  elif echo "${body}" | grep -qE "^§1\.7(:| Bootstrap:)"; then
    echo "✅ ${sha}  §1.7: present"
  else
    discipline="$(git diff-tree --no-commit-id --name-only -r "${sha}" 2>/dev/null \
      | grep -E '^(\.claude/rules/[^/]+\.md|packages/core/principles/[^/]+\.test\.ts|\.claude/skills/[^/]+/SKILL\.md)$' \
      || true)"
    if [ -n "${discipline}" ]; then
      echo "❌ ${sha}  §1.7 trailer MISSING — ${subject}"
      echo "   Discipline files: ${discipline}"
      echo "   Fix: add '§1.7: ...' or '§1.7 Bootstrap: ...' to commit body."
      fail=1
    fi
  fi
done <<< "${COMMITS}"

if [ "${fail}" -eq 1 ]; then
  echo ""; echo "❌ fallback: critical checks FAILED."
  echo "   Install Node ≥20 for the full TS-core hook (substance arms)."; exit 1
fi
echo "✅ fallback: critical checks passed."; exit 0
