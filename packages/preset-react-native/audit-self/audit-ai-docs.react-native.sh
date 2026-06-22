#!/usr/bin/env bash
# packages/preset-react-native/audit-self/audit-ai-docs.react-native.sh
#
# Code-vs-docs consistency audit for React Native projects (Expo + bare RN).
# Each probe maps EXPLICITLY to a rule from RULES.react-native.md.
#
# Rule mapping:
#   R12-RN Forbid web globals     → delegated to ESLint no-restricted-globals (both baselines)
#   R14-RN Styles                 → delegated to ESLint react-native/no-inline-styles
#   R15-RN Accessibility          → delegated to ESLint react-native-a11y/* rules
#   R16-RN Images                 → probe_R16_RN (Image usage check)
#   R17-RN Navigation             → manual review (probe_R17_RN warns if Router mix detected)
#   R18-RN Performance            → probe_R18_RN (FlatList keyExtractor check)
#
# Exit codes: 0 PASS / WARN, 1 FAIL.

set -uo pipefail

FAIL_COUNT=0
PASS_COUNT=0
WARN_COUNT=0

if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; NC=''
fi

pass() { echo -e "${GREEN}PASS${NC}: $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo -e "${RED}FAIL${NC}: $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
warn() { echo -e "${YELLOW}WARN${NC}: $1"; WARN_COUNT=$((WARN_COUNT + 1)); }

ONLY=""
for arg in "$@"; do
  case "$arg" in --only=*) ONLY="${arg#--only=}" ;; esac
done

skip_unless() {
  [ -z "$ONLY" ] && return 1
  [ "$ONLY" = "$1" ] && return 1
  return 0
}

# ────────────────────────────────────────────────────────────────────────
# R12-RN: no-restricted-globals denylist fires for web globals in RN
# Delegated to ESLint in eslint.config.rn-common.mjs — no probe needed here.
# ────────────────────────────────────────────────────────────────────────

# ────────────────────────────────────────────────────────────────────────
# R14-RN/R15-RN: delegated to ESLint
# react-native/no-inline-styles, react-native-a11y/* — no probe needed here.
# ────────────────────────────────────────────────────────────────────────

# ────────────────────────────────────────────────────────────────────────
# R16-RN — Image: native <Image> not web <img>
# ────────────────────────────────────────────────────────────────────────
if skip_unless R16_RN; then : ; else
  RULE="R16-RN: No HTML <img> elements in RN source"
  # Detect <img ... /> or <img> in TSX/JSX files (web HTML img tag in RN code)
  SRC_DIRS=()
  [ -d src ] && SRC_DIRS+=(src)
  [ -d app ] && SRC_DIRS+=(app)
  [ -d screens ] && SRC_DIRS+=(screens)
  [ -d components ] && SRC_DIRS+=(components)

  if [ ${#SRC_DIRS[@]} -eq 0 ]; then
    warn "$RULE (skipped: no src/ app/ screens/ components/ directory found)"
  else
    VIOL=$(grep -rn --include="*.tsx" --include="*.jsx" "<img" "${SRC_DIRS[@]}" 2>/dev/null || true)
    if [ -z "$VIOL" ]; then
      pass "$RULE"
    else
      fail "$RULE — use <Image> from react-native, not HTML <img>"
      echo "$VIOL" | sed 's/^/    /'
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# R17-RN — Navigation: no DOM-based routers
# ────────────────────────────────────────────────────────────────────────
if skip_unless R17_RN; then : ; else
  RULE="R17-RN: No DOM-based router imports (react-router-dom)"
  VIOL=$(grep -rn --include="*.ts" --include="*.tsx" \
    "from ['\"]react-router-dom['\"]" . 2>/dev/null | grep -v node_modules || true)
  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    warn "$RULE — found react-router-dom imports (use react-navigation or Expo Router)"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# R18-RN — FlatList/SectionList must have keyExtractor
# ────────────────────────────────────────────────────────────────────────
if skip_unless R18_RN; then : ; else
  RULE="R18-RN: FlatList/SectionList elements have keyExtractor"
  SRC_DIRS=()
  [ -d src ] && SRC_DIRS+=(src)
  [ -d app ] && SRC_DIRS+=(app)
  [ -d screens ] && SRC_DIRS+=(screens)
  [ -d components ] && SRC_DIRS+=(components)

  if [ ${#SRC_DIRS[@]} -eq 0 ]; then
    warn "$RULE (skipped: no source directories found)"
  else
    # Find FlatList/SectionList usage without adjacent keyExtractor
    VIOL=$(grep -rn --include="*.tsx" --include="*.jsx" \
      -E "<(FlatList|SectionList)[^>]*$" "${SRC_DIRS[@]}" 2>/dev/null | \
      grep -v "keyExtractor" || true)
    if [ -z "$VIOL" ]; then
      pass "$RULE"
    else
      warn "$RULE — FlatList/SectionList usage without keyExtractor on same line (manual check needed)"
      echo "$VIOL" | sed 's/^/    /'
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# Presence check: both baseline configs exist
# ────────────────────────────────────────────────────────────────────────
if skip_unless BASELINES; then : ; else
  RULE="Baseline configs: both eslint.config.expo.mjs + eslint.config.bare-rn.mjs present"
  PRESET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  EXPO_CONF="$PRESET_DIR/templates/eslint.config.expo.mjs"
  BARE_CONF="$PRESET_DIR/templates/eslint.config.bare-rn.mjs"
  COMMON_CONF="$PRESET_DIR/templates/eslint.config.rn-common.mjs"

  MISSING=""
  [ -f "$EXPO_CONF" ] || MISSING="$MISSING $EXPO_CONF"
  [ -f "$BARE_CONF" ] || MISSING="$MISSING $BARE_CONF"
  [ -f "$COMMON_CONF" ] || MISSING="$MISSING $COMMON_CONF"

  if [ -z "$MISSING" ]; then
    pass "$RULE"
  else
    fail "$RULE — missing:$MISSING"
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# Presence check: RULES docs carry Authoritative-for headers (principle 09)
# ────────────────────────────────────────────────────────────────────────
if skip_unless DOCS_HEADERS; then : ; else
  RULE="Docs: RULES.md + RULES.react-native.md + ARCHITECTURE.react-native.md carry Authoritative-for headers"
  PRESET_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  DOCS=(
    "$PRESET_DIR/RULES.md"
    "$PRESET_DIR/RULES.react-native.md"
    "$PRESET_DIR/templates/ARCHITECTURE.react-native.md"
  )
  MISSING_HEADER=""
  for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
      grep -q "Authoritative for:" "$doc" || MISSING_HEADER="$MISSING_HEADER $doc"
    else
      MISSING_HEADER="$MISSING_HEADER $doc (file missing)"
    fi
  done

  if [ -z "$MISSING_HEADER" ]; then
    pass "$RULE"
  else
    fail "$RULE — missing header in:$MISSING_HEADER"
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────"
echo "RN audit complete: $PASS_COUNT PASS, $FAIL_COUNT FAIL, $WARN_COUNT WARN"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
