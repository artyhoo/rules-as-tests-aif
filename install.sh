#!/usr/bin/env bash
# install.sh — Deploy rules-as-tests-aif into the current project.
#
# Usage:
#   ./install.sh                 # interactive (asks server-ts vs react-next)
#   ./install.sh ts-server       # non-interactive: server TypeScript stack
#   ./install.sh react-next      # non-interactive: React/Next.js stack
#   ./install.sh react-next --force   # overwrite existing files
#
# What it does:
#   1. Copies skills/  → .claude/skills/rules-as-tests/
#   2. Copies agents/  → .claude/agents/
#   3. Copies factory/ → .ai-factory/  (templates: as-is, you fill in placeholders)
#   4. Copies scripts/ → scripts/      (audit-ai-docs.sh)
#   5. Copies templates/shared/ + templates/<stack>/ → project root
#
# Safety: by default never overwrites existing files. Use --force to overwrite.

set -euo pipefail

PKG_ROOT="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(pwd)"
STACK="${1:-}"
FORCE="${2:-}"

if [ "$STACK" == "--force" ]; then
  FORCE="--force"
  STACK=""
fi

# Refuse to install into the package itself
if [ "$PKG_ROOT" = "$PROJECT_ROOT" ]; then
  echo "❌ Refusing to install into the package directory itself."
  echo "   cd to your target project and run: ${PKG_ROOT}/install.sh"
  exit 1
fi

# Must be a project (has package.json)
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  echo "❌ No package.json found in $PROJECT_ROOT"
  echo "   Run this from your project root."
  exit 1
fi

# Pick stack interactively if not provided
if [ -z "$STACK" ]; then
  echo "What stack does this project use?"
  echo "  1) ts-server    — Node.js + Fastify/Hono/Express (server only)"
  echo "  2) react-next   — React 19 + Next.js 15 App Router"
  read -rp "Choose [1/2]: " choice
  case "$choice" in
    1) STACK="ts-server" ;;
    2) STACK="react-next" ;;
    *) echo "❌ Invalid choice"; exit 1 ;;
  esac
fi

if [ "$STACK" != "ts-server" ] && [ "$STACK" != "react-next" ]; then
  echo "❌ Unknown stack: $STACK (use ts-server or react-next)"
  exit 1
fi

echo "▶ Installing rules-as-tests-aif into $PROJECT_ROOT (stack: $STACK)"

# ─── Helper ──────────────────────────────────────────────
copy_safe() {
  local src="$1"
  local dst="$2"

  if [ -e "$dst" ] && [ "$FORCE" != "--force" ]; then
    echo "  ⊝ $dst (exists — skipping; use --force to overwrite)"
    return 0
  fi

  mkdir -p "$(dirname "$dst")"
  cp -r "$src" "$dst"
  echo "  ✓ $dst"
}

# ─── 1. Skills ──────────────────────────────────────────
echo "▶ Skills → .claude/skills/"
mkdir -p "$PROJECT_ROOT/.claude/skills"
if [ -e "$PROJECT_ROOT/.claude/skills/rules-as-tests" ] && [ "$FORCE" != "--force" ]; then
  echo "  ⊝ .claude/skills/rules-as-tests (exists — skipping)"
else
  rm -rf "$PROJECT_ROOT/.claude/skills/rules-as-tests"
  cp -r "$PKG_ROOT/skills/rules-as-tests" "$PROJECT_ROOT/.claude/skills/rules-as-tests"
  echo "  ✓ .claude/skills/rules-as-tests/"
fi

# ─── 2. Sub-agents ──────────────────────────────────────
echo "▶ Sub-agents → .claude/agents/"
mkdir -p "$PROJECT_ROOT/.claude/agents"
for f in "$PKG_ROOT"/agents/*.md; do
  copy_safe "$f" "$PROJECT_ROOT/.claude/agents/$(basename "$f")"
done

# ─── 3. AI Factory templates ────────────────────────────
echo "▶ AI Factory templates → .ai-factory/"
mkdir -p "$PROJECT_ROOT/.ai-factory/rules"
copy_safe "$PKG_ROOT/factory/DESCRIPTION.template.md" "$PROJECT_ROOT/.ai-factory/DESCRIPTION.template.md"
copy_safe "$PKG_ROOT/factory/ARCHITECTURE.template.md" "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.template.md"
copy_safe "$PKG_ROOT/factory/RULES.md" "$PROJECT_ROOT/.ai-factory/RULES.md"
copy_safe "$PKG_ROOT/factory/rules/integration-rules.md" "$PROJECT_ROOT/.ai-factory/rules/integration-rules.md"
if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/factory/ARCHITECTURE.react-next.md" "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-next.md"
  copy_safe "$PKG_ROOT/factory/RULES.react-next.md" "$PROJECT_ROOT/.ai-factory/RULES.react-next.md"
fi

# ─── 4. Scripts ─────────────────────────────────────────
echo "▶ Scripts → scripts/"
mkdir -p "$PROJECT_ROOT/scripts"
copy_safe "$PKG_ROOT/scripts/audit-ai-docs.sh" "$PROJECT_ROOT/scripts/audit-ai-docs.sh"
chmod +x "$PROJECT_ROOT/scripts/audit-ai-docs.sh"
if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/scripts/audit-ai-docs.react-next.sh" "$PROJECT_ROOT/scripts/audit-ai-docs.react-next.sh"
  chmod +x "$PROJECT_ROOT/scripts/audit-ai-docs.react-next.sh"
fi

# ─── 5. Shared templates ────────────────────────────────
echo "▶ Shared templates → project root"
copy_safe "$PKG_ROOT/templates/shared/.nvmrc" "$PROJECT_ROOT/.nvmrc"
copy_safe "$PKG_ROOT/templates/shared/.lintstagedrc.json" "$PROJECT_ROOT/.lintstagedrc.json"
copy_safe "$PKG_ROOT/templates/shared/tsconfig.json" "$PROJECT_ROOT/tsconfig.json"
copy_safe "$PKG_ROOT/templates/shared/AGENTS.md.template" "$PROJECT_ROOT/AGENTS.md"
mkdir -p "$PROJECT_ROOT/.husky"
copy_safe "$PKG_ROOT/templates/shared/husky-pre-commit.sh" "$PROJECT_ROOT/.husky/pre-commit"
copy_safe "$PKG_ROOT/templates/shared/husky-pre-push.sh" "$PROJECT_ROOT/.husky/pre-push"
chmod +x "$PROJECT_ROOT/.husky/pre-commit" "$PROJECT_ROOT/.husky/pre-push" 2>/dev/null || true

# ─── 6. Stack-specific templates ────────────────────────
echo "▶ Stack-specific templates ($STACK) → project root"
mkdir -p "$PROJECT_ROOT/.github/workflows"

if [ "$STACK" = "ts-server" ]; then
  copy_safe "$PKG_ROOT/templates/ts-server/eslint.config.mjs" "$PROJECT_ROOT/eslint.config.mjs"
  copy_safe "$PKG_ROOT/templates/ts-server/vitest.config.ts" "$PROJECT_ROOT/vitest.config.ts"
  copy_safe "$PKG_ROOT/templates/ts-server/dependency-cruiser.cjs" "$PROJECT_ROOT/.dependency-cruiser.cjs"
  copy_safe "$PKG_ROOT/templates/ts-server/stryker.config.json" "$PROJECT_ROOT/stryker.config.json"
  copy_safe "$PKG_ROOT/templates/ts-server/github-actions-ci.yml" "$PROJECT_ROOT/.github/workflows/ci.yml"
elif [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/templates/react-next/eslint.config.react.mjs" "$PROJECT_ROOT/eslint.config.mjs"
  copy_safe "$PKG_ROOT/templates/react-next/vitest.config.ts" "$PROJECT_ROOT/vitest.config.ts"
  copy_safe "$PKG_ROOT/templates/react-next/playwright.config.ts" "$PROJECT_ROOT/playwright.config.ts"
  copy_safe "$PKG_ROOT/templates/ts-server/dependency-cruiser.cjs" "$PROJECT_ROOT/.dependency-cruiser.cjs"
  copy_safe "$PKG_ROOT/templates/ts-server/stryker.config.json" "$PROJECT_ROOT/stryker.config.json"
  copy_safe "$PKG_ROOT/templates/react-next/github-actions-ci-ui.yml" "$PROJECT_ROOT/.github/workflows/ci.yml"
fi

# ─── Done ───────────────────────────────────────────────
echo ""
echo "✅ Installation complete."
echo ""
echo "Next steps:"
echo "  1. Edit .ai-factory/DESCRIPTION.template.md → save as .ai-factory/DESCRIPTION.md"
echo "  2. Edit .ai-factory/ARCHITECTURE.template.md → save as .ai-factory/ARCHITECTURE.md"
echo "  3. Edit AGENTS.md placeholders to match your project"
echo "  4. Install required npm dev-deps:"
echo ""
echo "     npm install --save-dev \\"
echo "       eslint@^10 typescript-eslint@^8.59 @eslint/js \\"
echo "       prettier eslint-config-prettier eslint-plugin-vitest \\"
echo "       vitest@^4.1.5 @vitest/coverage-v8@^4.1.5 \\"
echo "       @stryker-mutator/core @stryker-mutator/vitest-runner \\"
echo "       dependency-cruiser fast-check glob \\"
echo "       husky lint-staged sort-package-json \\"
echo "       npm-run-all2 prettier"
if [ "$STACK" = "react-next" ]; then
echo "     # Plus React/Next deps:"
echo "     npm install --save-dev \\"
echo "       @vitejs/plugin-react jsdom @testing-library/react \\"
echo "       @testing-library/jest-dom @next/eslint-plugin-next \\"
echo "       eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y \\"
echo "       eslint-plugin-testing-library @playwright/test"
fi
echo ""
echo "  5. Add scripts to package.json (see INSTALL.md §3)"
echo "  6. npx husky init && verify hooks installed"
echo "  7. Run: ./scripts/audit-ai-docs.sh — should PASS"
echo "  8. Run: npm run validate"
echo ""
echo "For full guide: see INSTALL.md"
