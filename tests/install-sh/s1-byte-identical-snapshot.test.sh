#!/usr/bin/env bash
# s1-byte-identical-snapshot.test.sh — S1 mif Task 1: byte-identical snapshot harness.
#
# Purpose: prove that the S1 modular-install-fullpack refactor (dispatcher + layers)
# produces an IDENTICAL installed filesystem state to the current monolithic install.sh.
#
# Key design invariant (O5 / T-MIF-B): "byte-identical" = installed TREE, NOT stdout.
# This harness diffs the tree (find + sha256sum per file), never captured stdout.
# Reordering independent copy_safe calls changes the log transcript but NOT the tree.
#
# Two fixture modes:
#   greenfield  — empty PROJECT_ROOT (no pre-existing files)
#   brownfield  — PROJECT_ROOT pre-seeded with a prior install (exercises copy_safe
#                 skip-if-exists and merge_prettierignore idempotency)
#
# Usage:
#   # Capture PRE-cut baseline (current install.sh):
#   bash tests/install-sh/s1-byte-identical-snapshot.test.sh [stack]
#
#   # Compare PRE vs POST (run after dispatcher+layers cut):
#   SNAPSHOT_MODE=compare bash tests/install-sh/s1-byte-identical-snapshot.test.sh [stack]
#
#   # Explicit baseline dir override:
#   BASELINE_DIR=/path/to/saved/baseline bash tests/install-sh/s1-byte-identical-snapshot.test.sh [stack]
#
# Arguments:
#   stack    — ts-server (default) | react-next
#
# Cite: O5 (snapshot = tree not stdout), T-MIF-B (greenfield + brownfield diff empty),
#       Acceptance §4 (greenfield AND brownfield diff empty before handoff).
set -uo pipefail

REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

STACK="${1:-ts-server}"
SNAPSHOT_MODE="${SNAPSHOT_MODE:-capture}"   # capture | compare
BASELINE_DIR="${BASELINE_DIR:-$REPO_ROOT/tests/install-sh/baselines}"   # tracked: committed golden baseline so CI compare-mode is a REAL gate (not gitignored .ai-factory)

if [ "$STACK" != "ts-server" ] && [ "$STACK" != "react-next" ]; then
  echo "❌ Unknown stack: $STACK (use ts-server or react-next)"; exit 1
fi

echo "▶ s1-byte-identical-snapshot — stack=$STACK mode=$SNAPSHOT_MODE"
echo "[DEBUG] REPO_ROOT=$REPO_ROOT"
echo "[DEBUG] BASELINE_DIR=$BASELINE_DIR"

# ─── sha256 helper (cross-platform: sha256sum on Linux, shasum -a 256 on macOS) ──
_sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

# ─── compute_fingerprint <dst_dir> <out_file> ────────────────────────────────
# Walks the installed tree, emits one line per file: "<sha256>  <relative-path>"
# sorted by path. Excludes nothing — we want every byte captured.
# Stores the file count in global _FINGERPRINT_COUNT (avoids printf-in-subshell mixing
# with debug echo output when the caller captures return via $(...)).
_FINGERPRINT_COUNT=0
compute_fingerprint() {
  local dst="$1"
  local out="$2"
  local count=0
  : > "$out"   # truncate/create
  while IFS= read -r f; do
    local rel="${f#$dst/}"
    local hash
    hash=$(_sha256 "$f")
    printf '%s  %s\n' "$hash" "$rel" >> "$out"
    count=$((count + 1))
  done < <(find "$dst" -type f -not -path '*/.git/*' -not -path '*/node_modules/*' | sort)
  _FINGERPRINT_COUNT=$count
  echo "[DEBUG] fingerprint: $count files → $out"
}

# ─── run_install <fixture_type> <out_dir> ────────────────────────────────────
# Creates a temp PROJECT_ROOT, optionally pre-seeds it (brownfield), runs install.sh,
# computes the fingerprint, saves it to <out_dir>/<fixture_type>.fingerprint.
# Sets global _RUN_INSTALL_COUNT with the file count.
_RUN_INSTALL_COUNT=0
run_install() {
  local fixture="$1"    # greenfield | brownfield
  local out_dir="$2"

  local T
  T=$(mktemp -d)
  echo "[DEBUG] fixture=$fixture PROJECT_ROOT=$T"

  # Minimal package.json so install.sh passes the package.json gate.
  printf '{ "name": "s1-snapshot-%s", "version": "0.0.0" }\n' "$fixture" > "$T/package.json"

  # git init so install.sh transform_internal_refs can resolve paths.
  ( cd "$T" && git init -q 2>/dev/null ) || true

  if [ "$fixture" = "brownfield" ]; then
    # Pre-seed: run a first greenfield install to establish the baseline consumer tree,
    # then run install again on top (exercises copy_safe skip-if-exists paths).
    echo "[DEBUG] brownfield: seeding with a prior install pass..."
    ( cd "$T" && bash "$REPO_ROOT/install.sh" "$STACK" --force ) >/dev/null 2>&1
    echo "[DEBUG] brownfield: seed complete, running re-install (copy_safe skip-if-exists paths)"
  fi

  # The install under measurement.
  ( cd "$T" && bash "$REPO_ROOT/install.sh" "$STACK" --force ) >/dev/null 2>&1

  local fp_path="$out_dir/${fixture}.fingerprint"
  compute_fingerprint "$T" "$fp_path"
  _RUN_INSTALL_COUNT=$_FINGERPRINT_COUNT

  # Cleanup temp tree (fingerprint already saved).
  rm -rf "$T"

  echo "[DEBUG] fixture=$fixture file-count=$_RUN_INSTALL_COUNT fingerprint=$fp_path"
}

# ─── CAPTURE MODE ────────────────────────────────────────────────────────────
if [ "$SNAPSHOT_MODE" = "capture" ]; then
  echo ""
  echo "▶ Capturing PRE-cut baseline snapshots (current install.sh)"
  mkdir -p "$BASELINE_DIR/$STACK"

  echo ""
  echo "  [greenfield] Running install into empty PROJECT_ROOT..."
  run_install "greenfield" "$BASELINE_DIR/$STACK"
  gf_count=$_RUN_INSTALL_COUNT
  ok "greenfield snapshot captured: $gf_count files → $BASELINE_DIR/$STACK/greenfield.fingerprint"

  echo ""
  echo "  [brownfield] Running re-install over existing tree..."
  run_install "brownfield" "$BASELINE_DIR/$STACK"
  bf_count=$_RUN_INSTALL_COUNT
  ok "brownfield snapshot captured: $bf_count files → $BASELINE_DIR/$STACK/brownfield.fingerprint"

  echo ""
  echo "PRE-cut baseline saved to: $BASELINE_DIR/$STACK/"
  echo "  greenfield.fingerprint  ($gf_count files)"
  echo "  brownfield.fingerprint  ($bf_count files)"
  echo ""
  echo "To compare after the S1 cut:"
  echo "  SNAPSHOT_MODE=compare bash tests/install-sh/s1-byte-identical-snapshot.test.sh $STACK"

# ─── COMPARE MODE ────────────────────────────────────────────────────────────
elif [ "$SNAPSHOT_MODE" = "compare" ]; then
  echo ""
  echo "▶ POST-cut comparison (current install.sh vs PRE baseline)"

  for fixture in greenfield brownfield; do
    baseline="$BASELINE_DIR/$STACK/${fixture}.fingerprint"
    if [ ! -f "$baseline" ]; then
      bad "$fixture: baseline not found at $baseline — run capture mode first"
      continue
    fi

    echo ""
    echo "  [$fixture] Running install and computing fingerprint..."

    POST_DIR=$(mktemp -d)
    run_install "$fixture" "$POST_DIR"
    post_count=$_RUN_INSTALL_COUNT
    post_fp="$POST_DIR/${fixture}.fingerprint"

    diff_out=$(diff "$baseline" "$post_fp" || true)
    if [ -z "$diff_out" ]; then
      ok "$fixture: byte-identical (T-MIF-B satisfied) — $post_count files"
    else
      bad "$fixture: DIFF DETECTED — tree changed! (T-MIF-B violated)"
      echo "--- PRE (baseline)"
      echo "+++ POST (current)"
      echo "$diff_out" | head -40
    fi
    rm -rf "$POST_DIR"
  done

else
  echo "❌ Unknown SNAPSHOT_MODE=$SNAPSHOT_MODE (use capture or compare)"; exit 1
fi

echo ""
echo "PASS=$PASS FAIL=$FAIL"
echo "[DEBUG] s1-byte-identical-snapshot.test.sh complete: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
