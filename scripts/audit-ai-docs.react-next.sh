#!/usr/bin/env bash
# scripts/audit-ai-docs.react-next.sh
#
# Code-vs-docs consistency audit for React 19 + Next.js 15 App Router projects.
# Each probe maps EXPLICITLY to a rule from .ai-factory/RULES.react-next.md.
#
# Rule mapping:
#   R12 Server vs Client          → probe_R12  (use client + server-only imports)
#   R13 Data fetching             → manual review (TanStack Query usage)
#   R14 Forms                     → probe_R14  (server actions + Zod safeParse)
#   R15 Accessibility             → delegated to ESLint (jsx-a11y/no-static-element-interactions)
#   R16 Performance               → delegated to ESLint (@next/next/no-img-element + no-html-link-for-pages)
#   R17 Component tests           → probe_R17  (each component has .stories.tsx)
#   R18 TanStack Query            → manual review
#   R19 Styles                    → delegated to dependency-cruiser (no styled-components)
#   R20 Server Actions            → probe_R20  ('use server' + Zod parse)
#
# Plus base server-side probes from audit-ai-docs.sh.
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

# Run baseline server-side probes first (R1-R9, D1-D2)
if [ -f scripts/audit-ai-docs.sh ] && [ -z "$ONLY" ]; then
  echo "▶ Running baseline server-side probes (R1-R9, D1-D2)..."
  echo ""
  bash scripts/audit-ai-docs.sh
  BASE_EXIT=$?
  echo ""
  if [ "$BASE_EXIT" -ne 0 ]; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo "▶ React/Next-specific probes (R12-R20)..."
  echo ""
fi

# ────────────────────────────────────────────────────────────────────────
# R12 — Server vs Client Components
# ────────────────────────────────────────────────────────────────────────
if skip_unless R12; then : ; else
  RULE="R12: Server vs Client boundary (no window/document in Server Components)"
  VIOL=""
  for f in $(find src/app app -name "*.tsx" 2>/dev/null \
    | grep -v "\\.unit\\.\\|\\.integration\\.\\|\\.test\\.\\|\\.spec\\." || true); do
    if head -3 "$f" | grep -q "'use client'\\|\"use client\""; then
      continue
    fi
    out=$(grep -nE "\\bwindow\\.|\\bdocument\\.|\\blocalStorage\\b|\\bsessionStorage\\b" "$f" 2>/dev/null \
      | grep -v "// audit:exempt" || true)
    [ -n "$out" ] && VIOL="$VIOL"$'\n'"$f: $out"
  done

  # Also: 'use client' files importing server-only modules
  for f in $(find src -name "*.tsx" 2>/dev/null); do
    if head -3 "$f" | grep -q "'use client'\\|\"use client\""; then
      out=$(grep -E "from ['\"](.*infrastructure|.*config/env|fs|node:fs|node:crypto)['\"]" "$f" 2>/dev/null \
        | grep -v "// audit:exempt" || true)
      [ -n "$out" ] && VIOL="$VIOL"$'\n'"$f (client): imports server-only — $out"
    fi
  done

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    fail "$RULE"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# R14 — Forms: Server Actions accept FormData and validate with Zod
# ────────────────────────────────────────────────────────────────────────
if skip_unless R14; then : ; else
  RULE="R14: Forms via Server Actions with Zod safeParse on formData"
  VIOL=""
  for f in $(find src/app/actions src/features/*/api -name "*.ts" 2>/dev/null \
    | grep -v "\\.unit\\.\\|\\.integration\\.\\|\\.audit\\." || true); do
    if grep -q "formData: FormData\\|formData: globalThis.FormData" "$f" 2>/dev/null; then
      grep -q "\\.safeParse(" "$f" || VIOL="$VIOL"$'\n'"$f: accepts FormData but no safeParse() call"
    fi
  done

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    fail "$RULE"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# R15: delegated to ESLint rule jsx-a11y/no-static-element-interactions
# R16a: delegated to ESLint rule @next/next/no-img-element
# R16b: delegated to ESLint rule @next/next/no-html-link-for-pages

# ────────────────────────────────────────────────────────────────────────
# R17 — Component tests: each component has .stories.tsx
# ────────────────────────────────────────────────────────────────────────
if skip_unless R17; then : ; else
  RULE="R17: Each component has matching .stories.tsx"
  VIOL=""
  for f in $(find src/shared/ui src/features/*/ui -name "*.tsx" 2>/dev/null \
    | grep -v "\\.unit\\.\\|\\.test\\.\\|\\.stories\\.\\|\\.types\\.\\|\\.module\\." \
    | grep -v "/index\\.tsx$" || true); do
    base=${f%.tsx}
    [ -f "${base}.stories.tsx" ] || VIOL="$VIOL"$'\n'"$f → missing ${base}.stories.tsx"
  done

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    warn "$RULE (treat as MAJOR if pre-merge, OK if WIP)"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# R20 — Server Actions: 'use server' directive + structure
# Plus: no screen.debug() in committed tests (subset of R20 hygiene)
# ────────────────────────────────────────────────────────────────────────
if skip_unless R20; then : ; else
  RULE="R20: Server Actions have 'use server' directive"
  VIOL=""
  for f in $(find src/app/actions src/features/*/api -name "*.ts" 2>/dev/null \
    | grep -v "\\.unit\\.\\|\\.test\\." || true); do
    if grep -qE "^export async function" "$f" 2>/dev/null; then
      grep -q "'use server'\\|\"use server\"" "$f" \
        || VIOL="$VIOL"$'\n'"$f: missing 'use server' directive"
    fi
  done

  # Also: no screen.debug() left in committed tests
  DEBUG_LEFTOVER=$(grep -rn "screen\\.debug(" src/ 2>/dev/null \
    | grep -v "// audit:exempt" || true)
  [ -n "$DEBUG_LEFTOVER" ] && VIOL="$VIOL"$'\n'"screen.debug() in tests:"$'\n'"$DEBUG_LEFTOVER"

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    fail "$RULE"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────"
echo "UI audit complete: $PASS_COUNT PASS, $FAIL_COUNT FAIL, $WARN_COUNT WARN"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
