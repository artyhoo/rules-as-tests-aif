#!/usr/bin/env bash
# packages/core/audit-self/audit-ai-docs.test.sh
#
# Negative tests for every probe in packages/core/audit-self/audit-ai-docs.sh and
# packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh.
#
# Each test:
#   1. Spins up a fresh project skeleton in $WORK
#   2. Injects an artificial violation
#   3. Runs `bash <script> --only=R<N>` (uses the script under test directly)
#   4. Asserts exit code == 1 (probe correctly catches)
#   5. Cleans up
#
# Without these, a regex bug in any probe silently makes it always-PASS and
# nobody notices for months. This is the negative-test discipline mandated by
# references/self-testing-docs.md applied to the package itself.
#
# Usage:
#   bash packages/core/audit-self/audit-ai-docs.test.sh
#   bash packages/core/audit-self/audit-ai-docs.test.sh R1     # run a single test
#
# Exit codes: 0 — all pass, 1 — at least one assertion failed.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
AUDIT_SH="$SCRIPT_DIR/audit-ai-docs.sh"
AUDIT_UI_SH="$REPO_ROOT/packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh"

if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
else
  RED=''; GREEN=''; NC=''
fi

PASS=0
FAIL=0

ONLY="${1:-}"

# ─── Helpers ─────────────────────────────────────────────────────
# Returns a fresh temp dir path on stdout. Caller MUST `cd` into it.
# Earlier version did `cd` here, but since this is invoked as `d=$(new_workdir)`
# the cd happened in a subshell and silently no-op'd — every `mkdir -p src/...`
# below leaked into the package root, triggering self-audit FAILs.
new_workdir() {
  mktemp -d
}

# Helper. Each test calls: `local d; d=$(new_workdir); enter "$d"`.
enter() {
  cd "$1" || { echo "FATAL: cannot cd to $1" >&2; exit 1; }
}

assert_fails() {
  # Runs the audit script with --only=$1; injected violation must produce exit 1.
  # Skips noiselessly if probe filter ($only-id) doesn't match.
  local probe="$1"
  local script="$2"
  bash "$script" --only="$probe" >/dev/null 2>&1
  local rc=$?
  if [ "$rc" -ne 1 ]; then
    echo -e "${RED}FAIL${NC}: $probe — expected exit 1, got $rc"
    FAIL=$((FAIL + 1))
    return 1
  fi
  echo -e "${GREEN}PASS${NC}: $probe — violation correctly caught"
  PASS=$((PASS + 1))
}

# Skip a test based on --only=<probe> CLI filter.
should_skip() {
  [ -z "$ONLY" ] && return 1
  [ "$ONLY" = "$1" ] && return 1
  return 0
}

# ─── R4: Every domain export needs .unit.ts ──────────────────────
# Acceptable outcomes:
#   - exit 1 + "fail" in output  → ts-morph installed, violation caught
#   - exit 0 + "warn.*skip"      → ts-morph absent in sandbox, probe correctly skipped
test_R4() {
  should_skip R4 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/domain
  printf 'export function greet(name: string) { return "hi " + name; }\n' \
    > src/domain/greet.ts

  local out
  out=$(bash "$AUDIT_SH" --only=R4 2>&1)
  local rc=$?

  if [ "$rc" -eq 1 ] && echo "$out" | grep -qi "fail.*R4"; then
    echo -e "${GREEN}PASS${NC}: R4 — ts-morph caught missing .unit.ts"
    PASS=$((PASS + 1))
  elif [ "$rc" -eq 0 ] && echo "$out" | grep -qi "warn.*R4.*skip"; then
    echo -e "${GREEN}PASS${NC}: R4 — probe correctly skipped (ts-morph not installed in sandbox)"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC}: R4 — expected exit 1 with FAIL, or exit 0 with WARN(skipped). Got rc=$rc, output:"
    echo "$out" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
  rm -rf "$d"
}

# ─── R4 partial: .unit.ts exists but does NOT reference the export ───
# This is a NEW capability of the ts-morph variant. Falls back to PASS
# in environments without ts-morph installed (warn).
test_R4_partial() {
  should_skip R4_partial && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/domain
  printf 'export function unrelated() { return 1; }\n' > src/domain/foo.ts
  printf 'import { describe } from "vitest"; describe("nothing", () => {});\n' \
    > src/domain/foo.unit.ts

  local out
  out=$(bash "$AUDIT_SH" --only=R4 2>&1)
  local rc=$?

  if [ "$rc" -eq 1 ] && echo "$out" | grep -qi "unrelated"; then
    echo -e "${GREEN}PASS${NC}: R4_partial — ts-morph caught missing reference in .unit.ts"
    PASS=$((PASS + 1))
  elif [ "$rc" -eq 0 ] && echo "$out" | grep -qi "warn.*skip"; then
    echo -e "${GREEN}PASS${NC}: R4_partial — probe skipped (ts-morph not installed in sandbox)"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC}: R4_partial — expected ts-morph FAIL on missing reference, or skip-WARN. Got rc=$rc:"
    echo "$out" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
  rm -rf "$d"
}

# ─── D1: Skill declared in AGENTS.md but missing on disk ─────────
test_D1() {
  should_skip D1 && return 0
  local d; d=$(new_workdir); enter "$d"
  cat > AGENTS.md <<'EOF'
# Agents

Use skill `phantom-skill` for X.
EOF
  # No .claude/skills/phantom-skill/ → drift
  assert_fails D1 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── D2: TODO / _comment in JSON configs (warns, not fails) ──────
# D2 emits WARN, not FAIL — exit code stays 0. We assert that "WARN" appears
# on a line that mentions the violating key.
test_D2() {
  should_skip D2 && return 0
  local d; d=$(new_workdir); enter "$d"
  cat > .mcp.json <<'EOF'
{ "_comment_TODO": "remove me", "mcpServers": {} }
EOF
  local out
  out=$(bash "$AUDIT_SH" --only=D2 2>&1)
  if echo "$out" | grep -q "^WARN" && echo "$out" | grep -q "_comment_TODO"; then
    echo -e "${GREEN}PASS${NC}: D2 — WARN correctly emitted on TODO in JSON"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC}: D2 — expected WARN with violating key. Got:"
    echo "$out" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
  rm -rf "$d"
}

# ─── D3: Canonical goal phrase absent from downstream doc (fails, not warns) ───
# D3 emits FAIL (exit 1) when either downstream doc lacks the canonical phrase.
# Fixture: session-bootstrap.md carries the phrase; CLAUDE.md does not → violation.
test_D3() {
  should_skip D3 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p .claude
  # Satisfies the session-bootstrap.md check — canonical phrase present
  printf "# Session bootstrap\n\nAI agents can't silently bypass undocumented conventions\n" \
    > .claude/session-bootstrap.md
  # CLAUDE.md stripped of canonical phrase or synonym → triggers D3 FAIL
  printf '# Claude Guide\n\nSome content without the goal phrase.\n' > CLAUDE.md
  assert_fails D3 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── D4: tool-decisions.md staleness (warns, not fails) ──────────────
# D4 emits WARN when .ai-factory/tool-decisions.md is absent despite package.json.
# Checks exit 0 (WARN does not fail) + "WARN" in output.
test_D4() {
  should_skip D4 && return 0
  local d; d=$(new_workdir); enter "$d"
  # Create package.json without tool-decisions.md → should WARN
  printf '{"name":"test","dependencies":{},"devDependencies":{}}\n' > package.json
  local out
  out=$(bash "$AUDIT_SH" --only=D4 2>&1)
  local rc=$?
  if [ $rc -eq 0 ] && echo "$out" | grep -q "^WARN"; then
    echo -e "${GREEN}PASS${NC}: D4 — WARN correctly emitted on missing tool-decisions.md"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC}: D4 — expected WARN (exit 0). Got rc=$rc:"
    echo "$out" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
  rm -rf "$d"
}

# ─── React-Next probes ───────────────────────────────────────────
# R12, R14, R20 are now enforced by ESLint (rules-as-tests plugin):
#   R12 → no-restricted-globals + no-server-imports-in-client
#   R14 → require-form-safe-parse
#   R20 → require-use-server-directive
# Negative tests for those rules live in packages/{core,preset-next-15-canonical}/eslint-rules/*.test.ts.

# ─── R17: Component without .stories.tsx (emits WARN, not FAIL) ──
test_R17() {
  should_skip R17 && return 0
  [ -f "$AUDIT_UI_SH" ] || return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/shared/ui
  printf 'export const Btn = () => null;\n' > src/shared/ui/Btn.tsx
  local out
  out=$(bash "$AUDIT_UI_SH" --only=R17 2>&1)
  if echo "$out" | grep -q "^WARN" && echo "$out" | grep -q "Btn.tsx"; then
    echo -e "${GREEN}PASS${NC}: R17 — WARN correctly emitted on missing .stories.tsx"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC}: R17 — expected WARN mentioning Btn.tsx. Got:"
    echo "$out" | sed 's/^/      /'
    FAIL=$((FAIL + 1))
  fi
  rm -rf "$d"
}

# ─── Run all ─────────────────────────────────────────────────────
echo "── Running negative tests for audit probes ──"

test_R4
test_R4_partial
test_D1
test_D2
test_D3
test_D4
test_R17

echo ""
echo "── Summary ──"
echo "$PASS pass / $FAIL fail"

[ "$FAIL" -eq 0 ] || exit 1
exit 0
