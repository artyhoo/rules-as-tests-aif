#!/usr/bin/env bash
# scripts/audit-ai-docs.sh
#
# Code-vs-docs consistency audit for server-side TypeScript projects.
# Each probe maps EXPLICITLY to a rule number from .ai-factory/RULES.md.
#
# Rule mapping:
#   R1  TypeScript hygiene       → delegated to ESLint (no-explicit-any, no-non-null-assertion)
#   R2  Validation at boundaries → probe_R2   (HTTP handlers without nearby Zod parse)
#   R3  Architectural boundaries → delegated to dependency-cruiser (run separately)
#   R4  Tests for new code       → probe_R4   (every domain export has matching .unit.ts)
#   R5  Async correctness        → delegated to ESLint no-floating-promises
#   R6  Errors                   → delegated to ESLint (no-throw-literal, no-useless-catch)
#   R7  Time/randomness/IO       → probe_R7   (Date.now / Math.random outside infrastructure)
#   R8  Observability            → probe_R8   (application functions have OTel span)
#   R9  Imports/dependencies     → delegated to ESLint (no-restricted-imports)
#   R10 Naming                   → manual review only (not formalisable)
#   R11 CI integrity             → manual review only
#
# Drift checks (separate from R-rules):
#   D1 Skills declared exist     → probe_D1
#   D2 No TODO in JSON configs   → probe_D2
#
# Exit codes:
#   0 — all probes PASS (WARN allowed)
#   1 — at least one FAIL
#
# Run time: target 5-10 seconds on typical codebase.
#
# IMPORTANT: every probe should have a matching negative test.
# See references/self-testing-docs.md for the pattern.

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

# Allow --only=R<N> or --only=D<N> to run a single probe (useful for negative testing)
ONLY=""
for arg in "$@"; do
  case "$arg" in --only=*) ONLY="${arg#--only=}" ;; esac
done

skip_unless() {
  [ -z "$ONLY" ] && return 1
  [ "$ONLY" = "$1" ] && return 1
  return 0
}

# R1: delegated to ESLint rules @typescript-eslint/no-explicit-any + no-non-null-assertion

# ────────────────────────────────────────────────────────────────────────
# R2 — Validation at boundaries: HTTP handlers parse via Zod safeParse
# Mapped to .ai-factory/RULES.md R2
# ────────────────────────────────────────────────────────────────────────
if skip_unless R2; then : ; else
  RULE="R2: Validation at HTTP boundaries (Zod safeParse, not parse)"
  VIOL=$(grep -rEn "Schema\\.parse\\(|schema\\.parse\\(" \
    src/web/handlers/ src/app/actions/ src/app/api/ 2>/dev/null \
    | grep -v "safeParse" \
    | grep -v "// audit:exempt" || true)

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    fail "$RULE"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# R4 — Tests for new public code: every domain export has .unit.ts
# Mapped to .ai-factory/RULES.md R4
# Note: ARCHITECTURE.md says tests are co-located with .unit.ts suffix.
# ────────────────────────────────────────────────────────────────────────
if skip_unless R4; then : ; else
  RULE="R4: Every public export in src/domain has matching .unit.ts"
  VIOL=""
  for f in $(find src/domain -name "*.ts" 2>/dev/null \
    | grep -v "\\.unit\\.\\|\\.integration\\.\\|\\.audit\\.\\|\\.test\\.\\|index\\.ts" || true); do
    base=${f%.ts}
    if grep -qE "^export (function|class|const|async)" "$f" 2>/dev/null; then
      [ -f "${base}.unit.ts" ] || VIOL="$VIOL"$'\n'"$f → missing ${base}.unit.ts"
    fi
  done

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    fail "$RULE"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# R6: delegated to ESLint rules no-throw-literal + @typescript-eslint/no-useless-catch

# ────────────────────────────────────────────────────────────────────────
# R7 — Time/randomness/IO: no Date.now() / Math.random() outside infrastructure
# Mapped to .ai-factory/RULES.md R7
# ────────────────────────────────────────────────────────────────────────
if skip_unless R7; then : ; else
  RULE="R7: Time/randomness injected via Clock/Random (no direct Date.now/Math.random)"
  VIOL=$(grep -rnE "Date\\.now\\(\\)|new Date\\(\\)|Math\\.random\\(\\)" src/ 2>/dev/null \
    | grep -v "src/infrastructure/clock/\\|src/infrastructure/random/" \
    | grep -v "\\.unit\\.\\|\\.integration\\.\\|\\.audit\\.\\|\\.test\\.\\|\\.spec\\." \
    | grep -v "// audit:exempt" || true)

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    fail "$RULE"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# R8 — Observability: application functions open OTel span
# Mapped to .ai-factory/RULES.md R8
# ────────────────────────────────────────────────────────────────────────
if skip_unless R8; then : ; else
  RULE="R8: Application commands/queries open OTel span"
  VIOL=""
  if [ -d src/application ]; then
    for f in $(find src/application -name "*.ts" 2>/dev/null \
      | grep -v "\\.unit\\.\\|\\.integration\\.\\|\\.audit\\.\\|/ports/" || true); do
      out=$(awk '
        /^export async function / {
          fn=$4; sub(/\(.*/,"",fn); start=NR; has_span=0;
        }
        /tracer\.startActiveSpan|withSpan\(|@span/ { has_span=1 }
        /^}$/ {
          if(start && !has_span) print FILENAME":"start": "fn" missing OTel span"
          start=0; has_span=0;
        }
      ' FILENAME="$f" "$f")
      [ -n "$out" ] && VIOL="$VIOL"$'\n'"$out"
    done
  fi

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    fail "$RULE"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# R9: delegated to ESLint rule no-restricted-imports (lodash/moment/axios/request/node-fetch)

# ════════════════════════════════════════════════════════════════════════
# Drift detection probes (separate from R-rules — these check infrastructure)
# ════════════════════════════════════════════════════════════════════════

# ────────────────────────────────────────────────────────────────────────
# D1 — Skills declared in AGENTS.md exist in .claude/skills/
# ────────────────────────────────────────────────────────────────────────
if skip_unless D1; then : ; else
  RULE="D1 (drift): skills declared in AGENTS.md exist on disk"
  if [ ! -f AGENTS.md ]; then
    warn "$RULE: AGENTS.md not found, skipping"
  else
    VIOL=""
    # Portable extraction: works on BSD grep (macOS) and GNU grep alike.
    # Pattern: ` skill `<name>` ` — capture <name> between backticks.
    while read -r s; do
      [ -z "$s" ] && continue
      [ -d ".claude/skills/$s" ] || VIOL="$VIOL"$'\n'"skill '$s' declared in AGENTS.md but missing from .claude/skills/"
    done < <(awk 'match($0, /skill `[^`]+`/) { print substr($0, RSTART+7, RLENGTH-8) }' AGENTS.md 2>/dev/null | grep -v '^<' | sort -u)

    if [ -z "$VIOL" ]; then
      pass "$RULE"
    else
      fail "$RULE"
      echo "$VIOL" | sed 's/^/    /'
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# D2 — No TODO / _comment in JSON configs
# ────────────────────────────────────────────────────────────────────────
if skip_unless D2; then : ; else
  RULE="D2 (drift): no TODO/_comment in JSON configs"
  VIOL=$(grep -E "_comment|TODO|FIXME" \
    .mcp.json .claude/settings.json .ai-factory/*.json 2>/dev/null || true)

  if [ -z "$VIOL" ]; then
    pass "$RULE"
  else
    warn "$RULE — JSON configs accumulate stale comments"
    echo "$VIOL" | sed 's/^/    /'
  fi
fi

# ────────────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────"
echo "Audit complete: $PASS_COUNT PASS, $FAIL_COUNT FAIL, $WARN_COUNT WARN"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
