#!/usr/bin/env bash
# harvest-via-api.sh — harvest a single-file task via GitHub API (api.github.com), bypassing the
# unroutable github.com git-host. PROVEN 2026-06-05 (PR #424): Clash fake-ip made git push/fetch to
# github.com impossible ("Can't assign requested address") but api.github.com=200.
#
# Reads the file content straight from the container worktree (uncommitted is fine — the Contents API
# makes the commit github-side, so NO local git commit/push needed at all). Single-file only.
#
# git-safety bans compound `gh pr merge`, so this script does NOT merge — it prints the PR URL on the
# last line; the caller runs `gh pr merge <url> --auto --squash` separately (inside a script the
# PreToolUse hook does not inspect the internal call).
#
# Usage: harvest-via-api.sh <taskId> [base] [path]
# Exit: 0 = PR ready (PR url on last line) ; 2 = nothing to harvest ; 1 = error
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

TID="${1:?usage: harvest-via-api.sh <taskId> [base] [path]}"
BASE="${2:-staging}"
FILE="${3:-docs/meta-factory/soak-exercise-log.md}"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "Yhooi2/rules-as-tests-aif")
API="http://${AIF_HOST:-localhost}:${AIF_PORT:-3009}"
C=$(docker ps --filter name=agent --format '{{.Names}}' 2>/dev/null | grep -i aif | head -1)

read -r BRANCH WTP < <(curl -s -m5 "$API/tasks/$TID" | python3 -c "import sys,json;t=json.load(sys.stdin);print(t.get('branchName') or '', t.get('worktreePath') or '')")
[ -z "$BRANCH" ] && { echo "API-HARVEST-ERR: no branchName for $TID"; exit 1; }

# 1. read file content from the container worktree (working-tree; uncommitted OK)
CONTENT=""
if [ -n "$C" ] && [ -n "$WTP" ] && docker exec "$C" test -f "$WTP/$FILE" 2>/dev/null; then
  CONTENT=$(docker exec "$C" cat "$WTP/$FILE" 2>/dev/null || true)
fi
# fallback: committed on the branch (via aif-local bind-mount)
if [ -z "$CONTENT" ]; then
  git fetch aif-local "$BRANCH" >/dev/null 2>&1 || true
  CONTENT=$(git show "aif-local/$BRANCH:$FILE" 2>/dev/null || true)
fi
[ -z "$CONTENT" ] && { echo "API-HARVEST: $TID has no $FILE (worktree or branch) — nothing to harvest"; exit 2; }

# 2. base SHA + branch ref (idempotent)
BASESHA=$(gh api "repos/$REPO/git/ref/heads/$BASE" -q '.object.sha' 2>/dev/null) || { echo "API-HARVEST-ERR: cannot read $BASE sha (api.github down?)"; exit 1; }
gh api -X POST "repos/$REPO/git/refs" -f ref="refs/heads/$BRANCH" -f sha="$BASESHA" >/dev/null 2>&1 || true

# 2b. APPEND-MERGE (S3 stale-overwrite fix): if the file already exists in staging, do NOT replace it
# with the worker's stale full copy — that silently clobbers prior rounds (mergeable but wrong, PR #426).
# Instead take staging's content and append only the worker's round-lines ("- <ts> | ...") not present.
STAGING_CONTENT=$(gh api "repos/$REPO/contents/$FILE?ref=$BASE" -q '.content' 2>/dev/null | base64 -d 2>/dev/null || true)
if [ -n "$STAGING_CONTENT" ]; then
  MERGED="$STAGING_CONTENT"; added=0
  while IFS= read -r line; do
    case "$line" in
      "- 20"*) printf '%s' "$STAGING_CONTENT" | grep -qF -- "$line" || { MERGED="$MERGED"$'\n'"$line"; added=$((added+1)); } ;;
    esac
  done <<< "$CONTENT"
  if [ "$added" -eq 0 ]; then
    echo "API-HARVEST: $TID adds no new round-line vs staging $FILE — nothing to harvest"; exit 2
  fi
  CONTENT="$MERGED"
  echo "APPEND-MERGE: +$added round-line(s) onto staging $FILE (no clobber)"
fi
B64=$(printf '%s' "$CONTENT" | base64)

# 3. PUT file (update if exists on branch)
existing=$(gh api "repos/$REPO/contents/$FILE?ref=$BRANCH" -q '.sha' 2>/dev/null || true)
putargs=(-X PUT "repos/$REPO/contents/$FILE" -f message="docs(soak): harvest $FILE (task $TID, via GitHub API)" -f content="$B64" -f branch="$BRANCH")
[ -n "$existing" ] && putargs+=(-f sha="$existing")
gh api "${putargs[@]}" >/dev/null 2>&1 || { echo "API-HARVEST-ERR: Contents PUT failed for $FILE on $BRANCH"; exit 1; }

# 4. PR (idempotent)
PRURL=$(gh pr create --repo "$REPO" --base "$BASE" --head "$BRANCH" \
  --title "docs(soak): harvest $TID" \
  --body "Soak harvest via GitHub API (github.com git-host unroutable; api.github.com reachable). Single-file; not a capability commit." 2>&1 | grep -oE 'https://github.com/[^ ]+/pull/[0-9]+' | head -1 || true)
[ -z "$PRURL" ] && PRURL=$(gh pr list --repo "$REPO" --head "$BRANCH" --state open --json url -q '.[0].url' 2>/dev/null || true)
[ -z "$PRURL" ] && { echo "API-HARVEST-ERR: PR create failed and none open for $BRANCH"; exit 1; }
echo "API-HARVEST-OK: $TID -> $PRURL"
echo "$PRURL"
