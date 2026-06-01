#!/usr/bin/env bash
# link-coordination.sh — cross-worktree symlink-to-canonical coordination sync.
#
# Symlinks gitignored orchestrator-prompt files to a single canonical store
# outside every worktree, so an edit in any worktree is visible in all others.
#
# Decision origin: research-patch 2026-05-17-cross-worktree-coord-doc-sync.md §5
# SSOT #110 — verdict ADAPT (upstream: worktree-env-sync symlink mode + Archon worktree.linkFiles).
#
# @dual-pair: cross-worktree-coordination-doc-sync
# spec: docs/meta-factory/research-patches/2026-05-17-cross-worktree-coord-doc-sync.md §5
#
# GRANULARITY — option (i): per-file symlinks only.
#   Umbrella dirs (.claude/orchestrator-prompts/<umbrella>/) remain REAL dirs.
#   Only gitignored content files are symlinked; tracked files (README.md,
#   done.md) are NEVER touched — they stay as real per-worktree files.
#
#   Per-file limitation: a NEW gitignored file born in a worktree is only
#   shared after re-running this helper (adopt-then-link). Author new umbrella
#   kickoffs in the primary checkout, or re-run the helper to link them back.
#
# Usage: bash scripts/link-coordination.sh [<worktree-dir>] [<seed-source-dir>]
#
#   <worktree-dir>    the worktree to link (default: git toplevel of cwd)
#   <seed-source-dir> optional primary checkout to bootstrap $CANON from
#                     (only seeds when $CANON is empty)
#
# Contract:
#   stdout  : NOTHING — reserved by CC WorktreeCreate hook for the worktree path.
#             All diagnostic/progress output goes to STDERR.
#   exit 0  : success (symlinks created or already correct)
#   exit 1  : conflict detected (real file in worktree AND in CANON — never clobbers)
#
# Tracked files skipped: README.md (root), */done.md (per umbrella).
# These match .gitignore tracked-exception lines:
#   !.claude/orchestrator-prompts/README.md
#   !.claude/orchestrator-prompts/*/done.md

set -euo pipefail

# ── ARGS ──────────────────────────────────────────────────────────────────────

ON_CONFLICT="skip"
POSITIONAL=()
for arg in "$@"; do
  case "$arg" in
    --on-conflict=*) ON_CONFLICT="${arg#*=}" ;;
    *)               POSITIONAL+=("$arg") ;;
  esac
done
WT_DIR="${POSITIONAL[0]:-}"
SEED_SRC="${POSITIONAL[1]:-}"
case "$ON_CONFLICT" in
  canon|worktree|skip) ;;
  *) echo "link-coordination: invalid --on-conflict='$ON_CONFLICT' (canon|worktree|skip)" >&2; exit 2 ;;
esac

if [[ -z "$WT_DIR" ]]; then
  WT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "link-coordination: cannot resolve worktree-dir (pass arg or run inside a repo)" >&2
    exit 1
  }
fi

CANON="${CLAUDE_COORDINATION_DIR:-$HOME/.claude-coordination/rules-as-tests-aif}"
WT_PROMPTS="$WT_DIR/.claude/orchestrator-prompts"

# ── INIT ──────────────────────────────────────────────────────────────────────

mkdir -p "$CANON"
mkdir -p "$WT_PROMPTS"

# ── SEED ──────────────────────────────────────────────────────────────────────
# Only when a seed-source is given AND $CANON currently has zero umbrella dirs.
# Seeds gitignored content from the primary checkout into $CANON so fresh
# worktrees are not blind (preserves J5 goal with live-share semantics).
# Excludes tracked files (done.md, README.md) — $CANON holds only gitignored content.

if [[ -n "$SEED_SRC" ]]; then
  SRC_PROMPTS="$SEED_SRC/.claude/orchestrator-prompts"
  # Count existing umbrella dirs in $CANON
  CANON_DIRS=0
  if [[ -d "$CANON" ]]; then
    CANON_DIRS=$(find "$CANON" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
  fi

  if [[ "$CANON_DIRS" -eq 0 ]] && [[ -d "$SRC_PROMPTS" ]] && command -v rsync >/dev/null 2>&1; then
    echo "link-coordination: seeding \$CANON from $SRC_PROMPTS ..." >&2
    rsync -a --ignore-existing \
      --exclude='done.md' \
      --exclude='README.md' \
      "$SRC_PROMPTS/" "$CANON/" 2>/dev/null || true
    echo "link-coordination: seed complete." >&2
  fi
fi

# ── ADOPT-THEN-LINK ───────────────────────────────────────────────────────────
# For each umbrella under $WT_PROMPTS, for each REAL (non-symlink) gitignored
# file that is not done.md or README.md:
#   - If ABSENT in $CANON → adopt: mv it to $CANON, then symlink back.
#   - If PRESENT in BOTH (real local + canonical) → CONFLICT: exit 1 (never clobber).

CONFLICT=0

if [[ -d "$WT_PROMPTS" ]]; then
  for umbrella_dir in "$WT_PROMPTS"/*/; do
    [[ -d "$umbrella_dir" ]] || continue
    umbrella="$(basename "$umbrella_dir")"

    for file_path in "$umbrella_dir"*; do
      [[ -f "$file_path" ]] || continue        # regular files only (not dirs)
      [[ -L "$file_path" ]] && continue        # skip existing symlinks

      filename="$(basename "$file_path")"
      # Skip tracked files
      [[ "$filename" == "done.md" ]] && continue
      [[ "$filename" == "README.md" ]] && continue

      canon_target="$CANON/$umbrella/$filename"

      if [[ ! -e "$canon_target" ]]; then
        # Absent in CANON → adopt: mv to CANON, symlink back
        mkdir -p "$CANON/$umbrella"
        mv "$file_path" "$canon_target"
        ln -s "$canon_target" "$file_path"
        echo "link-coordination: adopted $umbrella/$filename → \$CANON" >&2
      else
        case "$ON_CONFLICT" in
          skip)
            echo "CONFLICT: $file_path exists as real file AND $canon_target exists in \$CANON — resolve manually then re-run" >&2
            CONFLICT=1 ;;
          canon)
            rm -f "$file_path"; ln -s "$canon_target" "$file_path"
            echo "link-coordination: on-conflict=canon → canonical wins, relinked $umbrella/$filename" >&2 ;;
          worktree)
            mv -f "$file_path" "$canon_target"; ln -s "$canon_target" "$file_path"
            echo "link-coordination: on-conflict=worktree → worktree wins, adopted $umbrella/$filename" >&2 ;;
        esac
      fi
    done
  done
fi

# ── ROOT-FILE ADOPT-THEN-LINK ───────────────────────────────────────────────
ROOT_FILES="_plan-cache.md _master-backlog-delta.json"
if [[ -d "$WT_PROMPTS" ]]; then
  for filename in $ROOT_FILES; do
    file_path="$WT_PROMPTS/$filename"
    [[ -f "$file_path" ]] || continue
    [[ -L "$file_path" ]] && continue
    canon_target="$CANON/$filename"
    if [[ ! -e "$canon_target" ]]; then
      mv "$file_path" "$canon_target"; ln -s "$canon_target" "$file_path"
      echo "link-coordination: adopted root $filename → \$CANON" >&2
    else
      case "$ON_CONFLICT" in
        skip)     echo "CONFLICT: $file_path exists as real file AND $canon_target exists in \$CANON — resolve manually then re-run" >&2; CONFLICT=1 ;;
        canon)    rm -f "$file_path"; ln -s "$canon_target" "$file_path"; echo "link-coordination: on-conflict=canon → relinked root $filename" >&2 ;;
        worktree) mv -f "$file_path" "$canon_target"; ln -s "$canon_target" "$file_path"; echo "link-coordination: on-conflict=worktree → adopted root $filename" >&2 ;;
      esac
    fi
  done
fi

# ── LINK ──────────────────────────────────────────────────────────────────────
# For each umbrella in $CANON, for each gitignored file:
#   - If target in WT already a correct symlink → skip.
#   - If target exists as REAL file → skip (handled in ADOPT-THEN-LINK above;
#     could be a conflict we already flagged, or a just-adopted file now symlinked).
#   - If target absent → create symlink.

if [[ -d "$CANON" ]]; then
  for canon_umbrella_dir in "$CANON"/*/; do
    [[ -d "$canon_umbrella_dir" ]] || continue
    umbrella="$(basename "$canon_umbrella_dir")"

    # Ensure the umbrella dir exists as a real dir in the worktree
    wt_umbrella_dir="$WT_PROMPTS/$umbrella"
    mkdir -p "$wt_umbrella_dir"

    for canon_file in "$canon_umbrella_dir"*; do
      [[ -f "$canon_file" ]] || continue
      filename="$(basename "$canon_file")"
      # Skip tracked files
      [[ "$filename" == "done.md" ]] && continue
      [[ "$filename" == "README.md" ]] && continue

      wt_target="$wt_umbrella_dir/$filename"

      if [[ -L "$wt_target" ]]; then
        # Already a symlink → skip (correct by assumption)
        continue
      fi

      if [[ -e "$wt_target" ]]; then
        # Real file exists — was either adopted above or is a conflict already flagged.
        # In either case do NOT ln -s over it (would crash under set -e with "File exists").
        continue
      fi

      # Absent → create symlink
      ln -s "$canon_file" "$wt_target"
      echo "link-coordination: linked $umbrella/$filename → \$CANON" >&2
    done
  done
fi

# ── ROOT-FILE LINK ──────────────────────────────────────────────────────────
if [[ -d "$CANON" ]]; then
  for filename in $ROOT_FILES; do
    canon_file="$CANON/$filename"
    [[ -f "$canon_file" ]] || continue
    wt_target="$WT_PROMPTS/$filename"
    [[ -L "$wt_target" ]] && continue
    [[ -e "$wt_target" ]] && continue
    ln -s "$canon_file" "$wt_target"
    echo "link-coordination: linked root $filename → \$CANON" >&2
  done
fi

# ── EXIT ──────────────────────────────────────────────────────────────────────

if [[ "$CONFLICT" -eq 1 ]]; then
  echo "link-coordination: exiting with conflict(s) — see CONFLICT lines above." >&2
  exit 1
fi

exit 0
