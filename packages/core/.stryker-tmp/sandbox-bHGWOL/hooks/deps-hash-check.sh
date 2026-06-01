#!/usr/bin/env bash
# Consumer-facing UserPromptSubmit hook — D7=a (Wave 5.3).
# Compares sha256 of current package.json deps against deps-hash stored in
# .ai-factory/tool-decisions.md. On mismatch → prints one-line WARN to stdout
# (Claude Code harness injects stdout into session context automatically).
# Always exits 0 — non-blocking, context injection only.
#
# Register in consumer's .claude/settings.json:
#   "UserPromptSubmit": [{"hooks":[{"type":"command","command":"bash .claude/hooks/deps-hash-check.sh"}]}]

set -uo pipefail

DECISIONS=".ai-factory/tool-decisions.md"

# If no tool-decisions.md exists yet, nothing to compare against.
[ -f "$DECISIONS" ] || exit 0

# Extract stored deps-hash from YAML frontmatter (first line matching "deps-hash:").
STORED_HASH=$(grep -m1 "^deps-hash:" "$DECISIONS" 2>/dev/null | sed 's/^deps-hash:[[:space:]]*//' || true)
[ -z "$STORED_HASH" ] && exit 0

# Recompute current hash. Requires node (same dep as the rest of the framework).
[ -f package.json ] || exit 0
if ! command -v node >/dev/null 2>&1; then exit 0; fi

DEPS_JSON=$(node -e \
  "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); \
   console.log(JSON.stringify({...p.dependencies,...p.devDependencies}))" \
  2>/dev/null || true)
[ -z "$DEPS_JSON" ] && exit 0

if command -v sha256sum >/dev/null 2>&1; then
  CURRENT_HASH="sha256-$(printf '%s' "$DEPS_JSON" | sha256sum | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  CURRENT_HASH="sha256-$(printf '%s' "$DEPS_JSON" | shasum -a 256 | awk '{print $1}')"
else
  exit 0
fi

if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  printf '⚠ package.json deps changed since last tool-bootstrap — run /tool-bootstrapping to re-evaluate\n'
fi

exit 0
