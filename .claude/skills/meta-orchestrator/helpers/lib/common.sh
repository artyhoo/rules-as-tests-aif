#!/usr/bin/env bash
# common.sh — shared primitives for /meta-orchestrator helper scripts. SOURCED, not executed.
# Single source of truth for repo-root resolution, symlink-target resolution, and the slug/
# title tokeniser stopword base + filter tail. Extracted 2026-06-03 (Stage 4 dedup) from the
# 3× resolve_target / 11× REPO_ROOT / 2× tokeniser duplications across the helpers.
#
# Source via (BASH_SOURCE-relative so it works regardless of REPO_ROOT, which tests seam to a
# sandbox; the lib always ships beside the helpers):
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/common.sh"
# Sourcing also resolves REPO_ROOT (honouring a pre-set/env value) as a side effect, so the
# source line replaces each helper's `REPO_ROOT="${REPO_ROOT:-$(git ...)}"` line 1:1.
#
# @cc-only-rationale: meta-orchestrator skill helper library — sourced in-session by helpers
#   invoked via !shell injection; no portable equivalent fires at the same moment.

# Repo-root resolution (honour pre-set/env value; else git toplevel; else pwd). Idempotent.
REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

# Resolve a possibly-symlinked file to its real absolute target — so flock + writes land on
# the canonical file, not the symlink (used by the cache/delta writers).
resolve_target() {
  local f="$1" l
  if [ -L "$f" ]; then
    l="$(readlink "$f")"
    case "$l" in
      /*) printf '%s\n' "$l" ;;
      *)  printf '%s\n' "$(cd "$(dirname "$f")" && cd "$(dirname "$l")" && pwd)/$(basename "$l")" ;;
    esac
  else
    printf '%s\n' "$f"
  fi
}

# Shared stopword base for the slug/title tokenisers. Callers may EXTEND it (inflight-check
# appends `meta|orch`). The SPLIT step stays caller-side — dup-detect strips punctuation +
# lowercases title text, inflight splits an already-lowercased slug on `_- space` — the two
# tokenisers diverge there by design; only the stopword base + filter tail below are shared.
MO_STOP_BASE='with|from|that|this|into|over|then|kickoff|umbrella|phase|stage|worker|orchestrator|claude|code'

# Tokeniser filter tail: from stdin (one token per line, already lowercased + split by the
# caller), keep tokens >= 4 chars, strip stopwords ($1, default MO_STOP_BASE), sort unique.
mo_filter_tokens() { awk 'length>=4' | grep -vE "^(${1:-$MO_STOP_BASE})$" | sort -u || true; }
