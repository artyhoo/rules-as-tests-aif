#!/usr/bin/env bash
# refresh-aif-base.sh — PORTABLE refresh of an aif-handoff agent container's git base
# branch to the live GitHub tip, so dispatched tasks branch off CURRENT code rather than a
# stale hand-synced base (which produces off-scope / empty diffs the auto-review false-passes;
# aif-doctor SKILL §3.4 — the #1 cause of false-`done` garbage). Shipped to consumers under
# .claude/skills/aif-doctor/helpers/ — a consumer runs aif-handoff too, so their container
# base can also go stale and they need this heal.
#
# PORTABLE primary path: a plain in-container `git fetch` — works for any consumer whose
# agent container can reach GitHub. Tunnel/airgap FALLBACK (the maintainer's case, where
# github.com:443 is proxy-blocked inside the container) reconstructs the objects on the host
# via api.github.com, bundles them, and docker-cp's them in. The fallback's host-reconstruction
# helper (sync-branch-from-api.sh) is OPTIONAL + operator-local — its absence degrades with a
# clear message, never a hard dependency. The primary fetch path stands alone (T-HEAL-A).
#
# Idempotent + reversible: fast no-op (2 calls) when already current; prints the OLD SHA for a
# one-command revert. Non-destructive to task records / worktrees. Composes existing tools only
# (git / docker / gh api / git bundle) — no new dependency, no API-billed call.
#
# Usage: bash refresh-aif-base.sh [branch]            (branch defaults to staging)
#        run from inside the framework/consumer git repo (any worktree).
# Env:   AIF_AGENT_CONTAINER  (default: auto-resolve the aif agent container)
#        AIF_CONTAINER_REPO   (default: /home/www/rules-as-tests-aif — consumers override to their path)
#        AIF_SYNC_HELPER      (default: ~/.claude/sync-branch-from-api.sh — OPTIONAL fallback only)
set -uo pipefail            # deliberately NOT -e: a failed heal must warn, never abort the caller
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

BRANCH="${1:-staging}"
REPO_PATH="${AIF_CONTAINER_REPO:-/home/www/rules-as-tests-aif}"
C="${AIF_AGENT_CONTAINER:-$(docker ps --filter name=agent --format '{{.Names}}' 2>/dev/null | grep -i aif | head -1)}"

# Graceful no-op when no aif agent container is running (e.g. a consumer who doesn't run aif).
if [ -z "$C" ]; then
  echo "[refresh-aif-base] no aif agent container running — nothing to refresh (set AIF_AGENT_CONTAINER to override)."
  exit 0
fi

cd "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || { echo "[refresh-aif-base] not inside a git repo — skip."; exit 0; }
REPO="$(git remote get-url origin 2>/dev/null | sed -E 's#^.*github\.com[:/]##; s#\.git$##')"
[ -n "$REPO" ] || { echo "[refresh-aif-base] no github origin remote — skip."; exit 0; }

# Live tip via api.github.com (reachable even when github.com:443 is tunnel-blocked).
REAL="$(gh api "repos/$REPO/git/refs/heads/$BRANCH" --jq '.object.sha' 2>/dev/null || true)"
[ -n "$REAL" ] || { echo "[refresh-aif-base] gh api unreachable for repos/$REPO ($BRANCH) — cannot resolve live tip; skip."; exit 1; }
echo "repo=$REPO branch=$BRANCH  real_tip=${REAL:0:7}  container=$C  repo_path=$REPO_PATH"

# Fast no-op when the container base is already the live tip.
CUR="$(docker exec "$C" git -C "$REPO_PATH" rev-parse "$BRANCH" 2>/dev/null || echo none)"
if [ "$CUR" = "$REAL" ]; then echo "✅ container $BRANCH already current (${REAL:0:7}) — no-op."; exit 0; fi
echo "container $BRANCH = ${CUR:0:7}  ->  ${REAL:0:7}  (refresh needed)"
OLD="$CUR"

# Force-set the container base + tracking ref to $1, then confirm it landed.
apply_and_verify() {
  docker exec "$C" git -C "$REPO_PATH" branch -f "$BRANCH" "$1" 2>/dev/null || return 1
  docker exec "$C" git -C "$REPO_PATH" update-ref "refs/remotes/origin/$BRANCH" "$1" 2>/dev/null || true
  local now; now="$(docker exec "$C" git -C "$REPO_PATH" rev-parse "$BRANCH" 2>/dev/null || echo none)"
  [ "$now" = "$1" ]
}

# ── PRIMARY (portable): the container fetches GitHub directly ────────────────────────
if docker exec "$C" git -C "$REPO_PATH" fetch origin "$BRANCH" >/dev/null 2>&1; then
  FETCHED="$(docker exec "$C" git -C "$REPO_PATH" rev-parse "origin/$BRANCH" 2>/dev/null || echo none)"
  # Accept the primary path only if the fetch actually advanced the base off the stale OLD
  # (a container whose origin points elsewhere / is itself stale falls through to the fallback,
  #  which forces the exact gh-api tip). A benign race where origin moved past REAL is fine.
  if [ "$FETCHED" != "none" ] && [ "$FETCHED" != "$OLD" ]; then
    if apply_and_verify "$FETCHED"; then
      [ "$FETCHED" = "$REAL" ] || echo "[refresh-aif-base] note: container origin tip ${FETCHED:0:7} != gh-api snapshot ${REAL:0:7} (benign race / origin ahead)."
      echo "✅ container $BRANCH ${OLD:0:7} -> ${FETCHED:0:7}  (primary: in-container git fetch)"
      echo "   revert: docker exec $C git -C $REPO_PATH branch -f $BRANCH $OLD"
      exit 0
    fi
    echo "[refresh-aif-base] primary fetch landed but branch-set failed — trying host-bundle fallback."
  else
    echo "[refresh-aif-base] in-container fetch did not advance the base (origin stale/elsewhere) — host-bundle fallback."
  fi
else
  echo "[refresh-aif-base] in-container 'git fetch' failed (tunnel/airgap?) — host-bundle fallback."
fi

# ── FALLBACK (tunnel/airgap): host gets objects -> bundle -> docker cp -> import ─────
# OPTIONAL operator-local dep: reconstruct host objects via gh API only when the host is stale
# AND a sync helper is present; otherwise degrade with a clear message (never hard-depend).
HOST="$(git rev-parse "$BRANCH" 2>/dev/null || echo none)"
if [ "$HOST" != "$REAL" ]; then
  SYNC="${AIF_SYNC_HELPER:-$HOME/.claude/sync-branch-from-api.sh}"
  if [ -f "$SYNC" ]; then
    echo "host $BRANCH stale (${HOST:0:7}) — reconstructing via gh API (FF-only) using $SYNC ..."
    bash "$SYNC" "$BRANCH" || { echo "[refresh-aif-base] host sync failed (diverged? resolve manually) — skip."; exit 1; }
    HOST="$(git rev-parse "$BRANCH" 2>/dev/null || echo none)"
  else
    echo "[refresh-aif-base] host $BRANCH stale (${HOST:0:7}) and no sync helper ($SYNC) to reconstruct it."
    echo "   → on a normal network the PRIMARY in-container fetch handles this; the fallback is the tunnel/airgap case."
    echo "   → provide the objects on the host (git fetch / git bundle) or set AIF_SYNC_HELPER, then re-run. Skipping."
    exit 1
  fi
fi
[ "$HOST" = "$REAL" ] || { echo "[refresh-aif-base] host $BRANCH (${HOST:0:7}) != real (${REAL:0:7}) after sync — skip."; exit 1; }

BUNDLE="$(mktemp -t aif-base.XXXXXX.bundle)"; trap 'rm -f "$BUNDLE"' EXIT
git bundle create "$BUNDLE" "$BRANCH" >/dev/null 2>&1 && git bundle verify "$BUNDLE" >/dev/null 2>&1 \
  || { echo "[refresh-aif-base] bad bundle — skip."; exit 1; }
echo "bundle $(du -h "$BUNDLE" | cut -f1) -> $C"
docker cp "$BUNDLE" "$C:/tmp/aif-base.bundle"
# '+' forces past the non-FF (old base is a divergent synthetic commit); the fetch imports the
# objects, then apply_and_verify sets the local base to the exact live tip.
docker exec "$C" git -C "$REPO_PATH" fetch /tmp/aif-base.bundle "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" >/dev/null 2>&1 || true
docker exec "$C" rm -f /tmp/aif-base.bundle 2>/dev/null || true
if apply_and_verify "$REAL"; then
  echo "✅ container $BRANCH ${OLD:0:7} -> ${REAL:0:7}  (fallback: host bundle import)"
  echo "   revert: docker exec $C git -C $REPO_PATH branch -f $BRANCH $OLD"
  docker exec "$C" git -C "$REPO_PATH" log --oneline -1 "$BRANCH" 2>/dev/null || true
  exit 0
fi
echo "[refresh-aif-base] verify failed after fallback (container $BRANCH != ${REAL:0:7}) — skip."
exit 1
