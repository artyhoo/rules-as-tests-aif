#!/usr/bin/env bash
# pre-push.fallback.sh — critical-only bash fallback (Wave 10.5).
# Runs when Node ≥20 is unavailable (see .husky/pre-push dispatcher).
# Critical checks (CHECK_REGISTRY criticalForFallback: true, registry.ts):
#   prior-art-presence: §7 "Prior-art:" trailer PRESENCE (no substance arm)
#   s17-presence:       §1.7 trailer PRESENCE (no file:line arm)
# Upstream pattern: Aider §4.8.X.2 check-registry ADAPT (SSOT #59).
# @dual-pair: pre-push-critical-checks
set -euo pipefail

UPSTREAM_REF="${PREPUSH_UPSTREAM_REF:-origin/main}"
HISTORICAL_CUTOFF="2026-05-12"
# §1.7 allow-list — parity with s17.ts:18 ALLOWLIST_RE (these subjects never require a §1.7 trailer).
S17_ALLOWLIST_RE='^(docs\(research-patches\)|chore\(snapshot-regen\)|chore\(prior-art-update\)):'
fail=0

if ! git rev-parse --verify "${UPSTREAM_REF}" >/dev/null 2>&1; then
  echo "⚠ fallback: upstream ref '${UPSTREAM_REF}' not found — skipping."; exit 0
fi

# Collect commits (bash 3.2-compatible; no mapfile)
COMMITS=$(git rev-list "${UPSTREAM_REF}..HEAD" 2>/dev/null || true)
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
