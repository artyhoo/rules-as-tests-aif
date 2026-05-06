#!/usr/bin/env sh
# Pre-push hook: typecheck + tests on changed files + architecture + audit-ai-docs.
# Target: 15-90 seconds. Heavier than pre-commit, lighter than CI.
#
# Install: place at .husky/pre-push and run `chmod +x .husky/pre-push`
#
# Edge case handled: new branch without upstream (first push) — falls back to origin/<default-branch>.

set -e

CURRENT=$(git rev-parse --abbrev-ref HEAD)

# Determine the diff range
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null || echo "")

if [ -z "$UPSTREAM" ]; then
  # New branch without upstream: compare against default remote branch
  DEFAULT=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null \
    | sed 's@^refs/remotes/origin/@@' \
    || echo "main")
  RANGE="origin/$DEFAULT...HEAD"
  echo "▶ Branch has no upstream — comparing against origin/$DEFAULT"
else
  RANGE="@{push}...HEAD"
fi

# 1. TypeScript check (whole project — types are global)
echo "▶ TypeScript check…"
npm run typecheck

# 2. Vitest related — only tests touching changed files
echo "▶ Vitest related ($RANGE)…"
CHANGED=$(git diff --name-only "$RANGE" -- '*.ts' '*.tsx' 2>/dev/null | tr '\n' ' ')
if [ -n "$CHANGED" ]; then
  npx vitest related --run $CHANGED
else
  echo "  (no .ts/.tsx changes — skipping)"
fi

# 3. Architecture rules
echo "▶ Architecture check…"
npm run arch:check

# 4. AI documentation audit (code-vs-docs probes)
# Auto-detect React/Next vs server-side
if [ -f next.config.ts ] || [ -f next.config.js ] || [ -f next.config.mjs ]; then
  AUDIT_SCRIPT=scripts/audit-ai-docs.react-next.sh
else
  AUDIT_SCRIPT=scripts/audit-ai-docs.sh
fi

if [ -f "$AUDIT_SCRIPT" ]; then
  echo "▶ AI docs audit ($AUDIT_SCRIPT)…"
  bash "$AUDIT_SCRIPT" || {
    echo "  AI-docs audit failed. Run \`bash $AUDIT_SCRIPT\` to see details."
    exit 1
  }
else
  echo "  (audit-ai-docs.sh not present — skipping. Add it to enforce code-vs-docs consistency.)"
fi

echo "✓ pre-push OK"
