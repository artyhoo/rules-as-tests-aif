#!/usr/bin/env bash
# tests/install-sh/snapshot.sh — byte-identical fingerprint harness for install.sh refactor.
#
# SNAPSHOT_MODE=capture  — install into a temp fixture and save the fingerprint as the baseline.
# SNAPSHOT_MODE=compare  — install into a temp fixture and compare against the saved baseline.
#
# Usage (capture, before any refactoring):
#   SNAPSHOT_MODE=capture bash tests/install-sh/snapshot.sh
#
# Usage (compare, after each code change):
#   SNAPSHOT_MODE=compare bash tests/install-sh/snapshot.sh
#
# Environment:
#   SNAPSHOT_MODE   capture | compare   (required)
#   BASELINE_DIR    path to baselines   (default: tests/install-sh/baselines)
#
# The fingerprint covers the INSTALLED TREE (file paths + sha256 hashes), NOT stdout.
# Per O5: section/SKIPPED order may legitimately differ across platforms; the tree diff is
# the byte-identical falsifier.
#
# Never installs into the worktree root (§4d-6). All installs go into mktemp -d fixtures.

set -euo pipefail

REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
BASELINE_DIR="${BASELINE_DIR:-$REPO_ROOT/tests/install-sh/baselines}"
MODE="${SNAPSHOT_MODE:-}"

if [ -z "$MODE" ]; then
  echo "ERROR: SNAPSHOT_MODE must be set to 'capture' or 'compare'" >&2
  exit 1
fi

# compute_fingerprint <dir>
# Produces a sorted list of "hash  relative-path" lines for all files under <dir>,
# excluding .git and node_modules. Uses sha256sum or md5/md5sum for portability.
compute_fingerprint() {
  local dir="$1"
  find "$dir" -type f \
    -not -path '*/.git/*' \
    -not -path '*/node_modules/*' -not -name '*.tmp' \
    | sort \
    | while IFS= read -r f; do
        local h
        if command -v sha256sum >/dev/null 2>&1; then
          h=$(sha256sum "$f" | awk '{print $1}')
        elif command -v shasum >/dev/null 2>&1; then
          h=$(shasum -a 256 "$f" | awk '{print $1}')
        elif command -v md5sum >/dev/null 2>&1; then
          h=$(md5sum "$f" | awk '{print $1}')
        else
          h=$(md5 -q "$f" 2>/dev/null || echo "NOHASH")
        fi
        printf '%s  %s\n' "$h" "${f#"$dir/"}"
      done
}

# install_into_fixture <fixture_dir> <stack> [--brownfield]
# Installs from the current install.sh into <fixture_dir>.
# If --brownfield: pre-seeds the fixture with a package.json + some existing files.
install_into_fixture() {
  local fixture="$1"
  local stack="$2"
  local brownfield="${3:-}"

  # Always start with a minimal package.json
  if [ "$brownfield" = "--brownfield" ]; then
    # Pre-seed with realistic brownfield state: existing package.json + some files
    cat > "$fixture/package.json" <<'EOF'
{
  "name": "brownfield-consumer",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  }
}
EOF
    mkdir -p "$fixture/.claude"
    echo "# Existing settings" > "$fixture/.claude/settings.json"
    echo "*.log" > "$fixture/.prettierignore"
    echo "console.log('existing')" > "$fixture/index.ts"
  else
    printf '{"name":"snapshot-test","version":"0.0.0"}\n' > "$fixture/package.json"
  fi

  # Initialize as a git repo (required by install.sh for core.hooksPath)
  ( cd "$fixture" && git init -q && git config user.email "test@test.com" && git config user.name "Test" ) >/dev/null 2>&1

  # Run install into the fixture (NEVER into REPO_ROOT)
  ( cd "$fixture" && bash "$REPO_ROOT/install.sh" "$stack" --force < /dev/null ) >/dev/null 2>&1 || true
}

# run_one_capture <stack> <mode_label>  (mode_label = greenfield | brownfield)
run_one_capture() {
  local stack="$1"
  local mode_label="$2"
  local fixture
  fixture=$(mktemp -d)
  trap 'rm -rf "$fixture"' RETURN

  local brownfield_flag=""
  [ "$mode_label" = "brownfield" ] && brownfield_flag="--brownfield"

  echo "  Capturing $stack/$mode_label ..."
  install_into_fixture "$fixture" "$stack" "$brownfield_flag"

  local baseline="$BASELINE_DIR/$stack/${mode_label}.fingerprint"
  mkdir -p "$(dirname "$baseline")"
  compute_fingerprint "$fixture" > "$baseline"
  echo "  ✓ $stack/$mode_label → $baseline ($(wc -l < "$baseline") files)"
}

# run_one_compare <stack> <mode_label>
run_one_compare() {
  local stack="$1"
  local mode_label="$2"
  local baseline="$BASELINE_DIR/$stack/${mode_label}.fingerprint"

  if [ ! -f "$baseline" ]; then
    echo "  ✗ MISSING BASELINE: $baseline (run SNAPSHOT_MODE=capture first)" >&2
    return 1
  fi

  local fixture
  fixture=$(mktemp -d)
  trap 'rm -rf "$fixture"' RETURN

  local brownfield_flag=""
  [ "$mode_label" = "brownfield" ] && brownfield_flag="--brownfield"

  install_into_fixture "$fixture" "$stack" "$brownfield_flag"

  local current
  current=$(mktemp)
  compute_fingerprint "$fixture" > "$current"

  local diff_out
  diff_out=$(diff "$baseline" "$current" || true)

  rm -f "$current"

  if [ -z "$diff_out" ]; then
    echo "  ✓ PASS: $stack/$mode_label — byte-identical"
    return 0
  else
    echo "  ✗ FAIL: $stack/$mode_label — diff:" >&2
    echo "$diff_out" >&2
    return 1
  fi
}

STACKS=(ts-server react-next react-spa react-native)
MODES=(greenfield brownfield)

OVERALL_PASS=0
OVERALL_FAIL=0

echo "▶ Snapshot harness: SNAPSHOT_MODE=$MODE"
echo ""

for stack in "${STACKS[@]}"; do
  for mode_label in "${MODES[@]}"; do
    if [ "$MODE" = "capture" ]; then
      run_one_capture "$stack" "$mode_label"
    else
      if run_one_compare "$stack" "$mode_label"; then
        OVERALL_PASS=$((OVERALL_PASS + 1))
      else
        OVERALL_FAIL=$((OVERALL_FAIL + 1))
      fi
    fi
  done
done

echo ""
if [ "$MODE" = "capture" ]; then
  echo "✅ Baselines captured for all 4 stacks × {greenfield,brownfield}"
  echo "   Location: $BASELINE_DIR/"
else
  echo "Result: $OVERALL_PASS pass / $OVERALL_FAIL fail"
  [ "$OVERALL_FAIL" -eq 0 ]
fi
