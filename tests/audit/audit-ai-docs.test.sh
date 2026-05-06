#!/usr/bin/env bash
# tests/audit/audit-ai-docs.test.sh
#
# Negative tests for every probe in scripts/audit-ai-docs.sh and
# scripts/audit-ai-docs.react-next.sh.
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
#   bash tests/audit/audit-ai-docs.test.sh
#   bash tests/audit/audit-ai-docs.test.sh R1     # run a single test
#
# Exit codes: 0 — all pass, 1 — at least one assertion failed.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AUDIT_SH="$PKG_ROOT/scripts/audit-ai-docs.sh"
AUDIT_UI_SH="$PKG_ROOT/scripts/audit-ai-docs.react-next.sh"

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

# ─── R1: TypeScript hygiene ──────────────────────────────────────
test_R1() {
  should_skip R1 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/domain
  printf 'export const x = (v: any) => v as any;\n' > src/domain/bad.ts
  assert_fails R1 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── R2: Validation at HTTP boundaries (parse, not safeParse) ────
test_R2() {
  should_skip R2 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/web/handlers
  cat > src/web/handlers/order.ts <<'EOF'
import { OrderSchema } from "../schemas";
export const handler = (req: any) => {
  const body = OrderSchema.parse(req.body);
  return body;
};
EOF
  assert_fails R2 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── R4: Every domain export needs .unit.ts ──────────────────────
test_R4() {
  should_skip R4 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/domain
  printf 'export function greet(name: string) { return "hi " + name; }\n' \
    > src/domain/greet.ts
  assert_fails R4 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── R6: No string throws / empty catch ──────────────────────────
test_R6() {
  should_skip R6 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/lib
  cat > src/lib/bad.ts <<'EOF'
export function f() { throw "string thrown"; }
EOF
  assert_fails R6 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── R7: Date.now() / Math.random() outside infrastructure ───────
test_R7() {
  should_skip R7 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/domain
  printf 'export const ts = Date.now();\n' > src/domain/clock.ts
  assert_fails R7 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── R8: Application function without OTel span ──────────────────
test_R8() {
  should_skip R8 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/application
  cat > src/application/order.ts <<'EOF'
export async function placeOrder(input: unknown) {
  return { ok: true };
}
EOF
  assert_fails R8 "$AUDIT_SH"
  rm -rf "$d"
}

# ─── R9: Forbidden imports (lodash/moment/axios/...) ─────────────
test_R9() {
  should_skip R9 && return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/lib
  printf 'import _ from "lodash";\nexport const x = _;\n' > src/lib/bad.ts
  assert_fails R9 "$AUDIT_SH"
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

# ─── React-Next probes ───────────────────────────────────────────

# ─── R12: 'use client' file imports server-only module ───────────
# Probe matches imports from infrastructure/, config/env, fs, node:fs, node:crypto.
test_R12() {
  should_skip R12 && return 0
  [ -f "$AUDIT_UI_SH" ] || return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/app
  cat > src/app/page.tsx <<'EOF'
'use client'
import { readFileSync } from 'fs';
export default function Page() { return null; }
EOF
  assert_fails R12 "$AUDIT_UI_SH"
  rm -rf "$d"
}

# ─── R14: Server Action without Zod safeParse on FormData ────────
test_R14() {
  should_skip R14 && return 0
  [ -f "$AUDIT_UI_SH" ] || return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/app/actions
  cat > src/app/actions/contact.ts <<'EOF'
'use server'
export async function contact(formData: FormData) {
  return { ok: true };
}
EOF
  assert_fails R14 "$AUDIT_UI_SH"
  rm -rf "$d"
}

# ─── R15: <div onClick> ──────────────────────────────────────────
test_R15() {
  should_skip R15 && return 0
  [ -f "$AUDIT_UI_SH" ] || return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/components
  cat > src/components/Bad.tsx <<'EOF'
export const Bad = () => <div onClick={() => {}}>click</div>;
EOF
  assert_fails R15 "$AUDIT_UI_SH"
  rm -rf "$d"
}

# ─── R16a: <img> instead of <Image> ──────────────────────────────
test_R16a() {
  should_skip R16a && return 0
  [ -f "$AUDIT_UI_SH" ] || return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/components
  cat > src/components/Pic.tsx <<'EOF'
export const Pic = () => <img src="/x.png" />;
EOF
  assert_fails R16a "$AUDIT_UI_SH"
  rm -rf "$d"
}

# ─── R16b: <a href="/internal"> instead of <Link> ────────────────
test_R16b() {
  should_skip R16b && return 0
  [ -f "$AUDIT_UI_SH" ] || return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/components
  cat > src/components/Nav.tsx <<'EOF'
export const Nav = () => <a href="/about">About</a>;
EOF
  assert_fails R16b "$AUDIT_UI_SH"
  rm -rf "$d"
}

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

# ─── R20: Server Action without 'use server' directive ───────────
# R20 probe checks for missing 'use server', NOT Zod (that's R14).
test_R20() {
  should_skip R20 && return 0
  [ -f "$AUDIT_UI_SH" ] || return 0
  local d; d=$(new_workdir); enter "$d"
  mkdir -p src/app/actions
  cat > src/app/actions/save.ts <<'EOF'
export async function save(formData: FormData) {
  return { ok: true };
}
EOF
  assert_fails R20 "$AUDIT_UI_SH"
  rm -rf "$d"
}

# ─── Run all ─────────────────────────────────────────────────────
echo "── Running negative tests for audit probes ──"

test_R1
test_R2
test_R4
test_R6
test_R7
test_R8
test_R9
test_D1
test_D2
test_R12
test_R14
test_R15
test_R16a
test_R16b
test_R17
test_R20

echo ""
echo "── Summary ──"
echo "$PASS pass / $FAIL fail"

[ "$FAIL" -eq 0 ] || exit 1
exit 0
