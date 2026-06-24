#!/usr/bin/env bash
# lib-helpers.test.sh — S1 mif Task 3: proof that O1 was fixed.
#
# Sources setup.d/lib.sh with INSTALL_SH_LIB_ONLY=1 and asserts every helper
# is defined and callable via `declare -F`.
#
# Pre-S1 (current install.sh), the lib-only guard fires at line 64 BEFORE
# copy_safe/mkdir_safe/chmod_safe etc. are defined, so only transform_internal_refs
# survives. Post-S1 (lib.sh guard at END), all helpers must be present.
#
# Cite: O1 (guard must be at END after all defs), Acceptance §4 ("each layer
# unit-testable in isolation via lib-only guard").
set -uo pipefail
REPO_ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); echo "  ✓ $1"; }
bad() { FAIL=$((FAIL+1)); echo "  ✗ $1"; }

# DEBUG-level trace: emit fingerprint info.
echo "[DEBUG] lib-helpers.test.sh: sourcing setup.d/lib.sh with INSTALL_SH_LIB_ONLY=1"

# Provide stub globals that lib helpers reference (they read but do not assign these).
# Without them, `set -u` would abort on first reference inside a helper body that is
# called (we only call declare -F here so they are not actually invoked, but be safe).
export FORCE=""
export DRY_RUN=""
export PROJECT_ROOT="${TMPDIR:-/tmp}/lib-helpers-test-$$"
export PKG_ROOT="$REPO_ROOT"
SKIPPED=()
export SKIPPED

# Source lib.sh in lib-only mode.
INSTALL_SH_LIB_ONLY=1 source "$REPO_ROOT/setup.d/lib.sh"

echo "[DEBUG] lib.sh sourced successfully"

# ─── Assert every helper is defined ──────────────────────────────────────────
HELPERS=(
  copy_safe
  refresh_safe
  mkdir_safe
  chmod_safe
  detect_pm
  transform_internal_refs
  merge_prettierignore
  copy_skill_with_transform
  refresh_skill_with_transform
  patch_stryker_package_manager
  _prettierignore_in_skipped
  ignore_shipped_configs
)

echo ""
echo "Checking helper definitions (declare -F):"
for fn in "${HELPERS[@]}"; do
  if declare -F "$fn" >/dev/null 2>&1; then
    ok "$fn — defined"
  else
    bad "$fn — NOT defined (O1 guard placement bug?)"
  fi
done

# ─── O1 regression proof ─────────────────────────────────────────────────────
# Pre-S1 install.sh guard fires before copy_safe is defined.
# If copy_safe is defined here, the guard-at-END fix is confirmed.
echo ""
echo "O1 regression proof:"
if declare -F copy_safe >/dev/null 2>&1 && \
   declare -F mkdir_safe >/dev/null 2>&1 && \
   declare -F chmod_safe >/dev/null 2>&1; then
  ok "O1 fixed: copy_safe + mkdir_safe + chmod_safe all survive lib-only guard"
else
  bad "O1 NOT fixed: guard still fires before all helpers are defined"
fi

echo ""
echo "PASS=$PASS FAIL=$FAIL"
echo "[DEBUG] lib-helpers.test.sh complete: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]
