#!/usr/bin/env bash
# install.sh — Deploy rules-as-tests-aif into the current project.
#
# Usage:
#   ./install.sh ts-server                      # default safe install
#   ./install.sh react-next --force             # overwrite existing files
#   ./install.sh react-next --dry-run           # preview without writing
#   ./install.sh react-next --dry-run --force   # preview overwrite plan
#
# What it does:
#   1. Copies skills/  → .claude/skills/rules-as-tests/
#   2. Copies agents/  → .claude/agents/
#   3. Copies factory templates → .ai-factory/  (templates: as-is, you fill in placeholders)
#   4. Copies packages/core/audit-self/ + packages/preset-*/audit-self/ → scripts/
#   5. Copies packages/core/templates/shared/ + packages/preset-*/templates/ → project root
#
# Safety: by default never overwrites existing files. Use --force to overwrite.
# Use --dry-run to preview the plan without touching disk.

set -euo pipefail

PKG_ROOT="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(pwd)"

STACK=""
FORCE=""
DRY_RUN=""
for arg in "$@"; do
  case "$arg" in
    --dry-run)              DRY_RUN="--dry-run" ;;
    --force)                FORCE="--force" ;;
    ts-server|react-next)   STACK="$arg" ;;
    *)                      ;;
  esac
done
SKIPPED=()

# Refuse to install into the package itself
if [ "$PKG_ROOT" = "$PROJECT_ROOT" ]; then
  echo "❌ Refusing to install into the package directory itself."
  echo "   cd to your target project and run: ${PKG_ROOT}/install.sh"
  exit 1
fi

# Must be a project (has package.json) — but in dry-run we just warn so the user can preview.
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "⚠  No package.json found in $PROJECT_ROOT — proceeding with dry-run preview anyway."
  else
    echo "❌ No package.json found in $PROJECT_ROOT"
    echo "   Run this from your project root."
    exit 1
  fi
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

# ─── Helpers ─────────────────────────────────────────────
copy_safe() {
  local src="$1"
  local dst="$2"

  if [ -e "$dst" ] && [ "$FORCE" != "--force" ]; then
    SKIPPED+=("$dst")
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "  [dry-run] would skip: $dst (exists)"
    else
      echo "  ⊝ $dst (exists — skipping; use --force to overwrite)"
    fi
    return 0
  fi

  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would copy: $src → $dst"
    return 0
  fi

  mkdir -p "$(dirname "$dst")"
  cp -r "$src" "$dst"
  echo "  ✓ $dst"
}

# Idempotent mkdir -p that respects --dry-run.
mkdir_safe() {
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would mkdir: $1"
    return 0
  fi
  mkdir -p "$1"
}

# chmod that respects --dry-run.
chmod_safe() {
  if [ "$DRY_RUN" = "--dry-run" ]; then
    return 0
  fi
  chmod "$@"
}

# ─── 1. Skills ──────────────────────────────────────────
echo "▶ Skills → .claude/skills/"
mkdir_safe "$PROJECT_ROOT/.claude/skills"
if [ -e "$PROJECT_ROOT/.claude/skills/rules-as-tests" ] && [ "$FORCE" != "--force" ]; then
  SKIPPED+=("$PROJECT_ROOT/.claude/skills/rules-as-tests")
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would skip: .claude/skills/rules-as-tests (exists)"
  else
    echo "  ⊝ .claude/skills/rules-as-tests (exists — skipping)"
  fi
elif [ "$DRY_RUN" = "--dry-run" ]; then
  echo "  [dry-run] would copy: $PKG_ROOT/skills/rules-as-tests → $PROJECT_ROOT/.claude/skills/rules-as-tests"
else
  rm -rf "$PROJECT_ROOT/.claude/skills/rules-as-tests"
  cp -r "$PKG_ROOT/skills/rules-as-tests" "$PROJECT_ROOT/.claude/skills/rules-as-tests"
  echo "  ✓ .claude/skills/rules-as-tests/"
fi

# ─── 2. Sub-agents ──────────────────────────────────────
echo "▶ Sub-agents → .claude/agents/"
mkdir_safe "$PROJECT_ROOT/.claude/agents"
for f in "$PKG_ROOT"/agents/*.md; do
  copy_safe "$f" "$PROJECT_ROOT/.claude/agents/$(basename "$f")"
done

# ─── 3. AI Factory templates ────────────────────────────
echo "▶ AI Factory templates → .ai-factory/"
mkdir_safe "$PROJECT_ROOT/.ai-factory/rules"
copy_safe "$PKG_ROOT/packages/core/templates/shared/DESCRIPTION.template.md" "$PROJECT_ROOT/.ai-factory/DESCRIPTION.template.md"
copy_safe "$PKG_ROOT/packages/core/templates/shared/ARCHITECTURE.ts-server.md" "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.ts-server.md"
copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/RULES.md" "$PROJECT_ROOT/.ai-factory/RULES.md"
copy_safe "$PKG_ROOT/packages/core/templates/shared/integration-rules.md" "$PROJECT_ROOT/.ai-factory/rules/integration-rules.md"
if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/ARCHITECTURE.react-next.md" "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-next.md"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/RULES.react-next.md" "$PROJECT_ROOT/.ai-factory/RULES.react-next.md"
fi

# ─── 4. Scripts ─────────────────────────────────────────
echo "▶ Scripts → scripts/"
mkdir_safe "$PROJECT_ROOT/scripts"
copy_safe "$PKG_ROOT/packages/core/audit-self/audit-ai-docs.sh" "$PROJECT_ROOT/scripts/audit-ai-docs.sh"
chmod_safe +x "$PROJECT_ROOT/scripts/audit-ai-docs.sh" 2>/dev/null || true
if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh" "$PROJECT_ROOT/scripts/audit-ai-docs.react-next.sh"
  chmod_safe +x "$PROJECT_ROOT/scripts/audit-ai-docs.react-next.sh" 2>/dev/null || true
fi

# ─── 5. Shared templates ────────────────────────────────
echo "▶ Shared templates → project root"
copy_safe "$PKG_ROOT/packages/core/templates/shared/.nvmrc" "$PROJECT_ROOT/.nvmrc"
copy_safe "$PKG_ROOT/packages/core/templates/shared/.lintstagedrc.json" "$PROJECT_ROOT/.lintstagedrc.json"
copy_safe "$PKG_ROOT/packages/core/templates/shared/tsconfig.json" "$PROJECT_ROOT/tsconfig.json"
copy_safe "$PKG_ROOT/packages/core/templates/shared/AGENTS.md.template" "$PROJECT_ROOT/AGENTS.md"
mkdir_safe "$PROJECT_ROOT/.husky"
copy_safe "$PKG_ROOT/packages/core/templates/shared/husky-pre-commit.sh" "$PROJECT_ROOT/.husky/pre-commit"
copy_safe "$PKG_ROOT/packages/core/templates/shared/husky-pre-push.sh" "$PROJECT_ROOT/.husky/pre-push"
chmod_safe +x "$PROJECT_ROOT/.husky/pre-commit" "$PROJECT_ROOT/.husky/pre-push" 2>/dev/null || true

# ─── 5b. Custom ESLint rules plugin (used by eslint.config.mjs) ───
echo "▶ Custom ESLint rules → eslint-rules-local/"
mkdir_safe "$PROJECT_ROOT/eslint-rules-local"
# Generic rules (core): no-direct-time-randomness, no-unsafe-zod-parse, require-otel-span
for f in "$PKG_ROOT"/packages/core/eslint-rules/*.ts; do
  case "$f" in
    *.test.ts) continue ;;
    */index.ts) continue ;;
  esac
  copy_safe "$f" "$PROJECT_ROOT/eslint-rules-local/$(basename "$f")"
done
if [ "$STACK" = "react-next" ]; then
  # Stack-specific rules (preset): no-server-imports-in-client, require-form-safe-parse, require-use-server-directive
  for f in "$PKG_ROOT"/packages/preset-next-15-canonical/eslint-rules/*.ts; do
    case "$f" in
      *.test.ts) continue ;;
      */index.ts) continue ;;
    esac
    copy_safe "$f" "$PROJECT_ROOT/eslint-rules-local/$(basename "$f")"
  done
fi

# ─── 6. Stack-specific templates ────────────────────────
echo "▶ Stack-specific templates ($STACK) → project root"
mkdir_safe "$PROJECT_ROOT/.github/workflows"

if [ "$STACK" = "ts-server" ]; then
  copy_safe "$PKG_ROOT/templates/ts-server/eslint.config.mjs" "$PROJECT_ROOT/eslint.config.mjs"
  copy_safe "$PKG_ROOT/templates/ts-server/vitest.config.ts" "$PROJECT_ROOT/vitest.config.ts"
  # .dependency-cruiser.cjs is generated by setup.sh via 'depcruise --init' (Phase 3)
  copy_safe "$PKG_ROOT/templates/ts-server/stryker.config.json" "$PROJECT_ROOT/stryker.config.json"
  copy_safe "$PKG_ROOT/templates/ts-server/github-actions-ci.yml" "$PROJECT_ROOT/.github/workflows/ci.yml"
elif [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/eslint.config.react.mjs" "$PROJECT_ROOT/eslint.config.mjs"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/vitest.config.ts" "$PROJECT_ROOT/vitest.config.ts"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/playwright.config.ts" "$PROJECT_ROOT/playwright.config.ts"
  # .dependency-cruiser.cjs is generated by setup.sh via 'depcruise --init' (Phase 3)
  copy_safe "$PKG_ROOT/templates/ts-server/stryker.config.json" "$PROJECT_ROOT/stryker.config.json"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml" "$PROJECT_ROOT/.github/workflows/ci.yml"
fi

# ─── Done ───────────────────────────────────────────────
if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo ""
  echo "⚠  ${#SKIPPED[@]} files were skipped because they already exist."
  echo "    Your project may now have a configuration that diverges from the framework's expectations."
  echo "    To overwrite them: re-run with --force"
  echo "    To preview what would change: re-run with --dry-run --force"
  echo "    Skipped paths:"
  printf '      - %s\n' "${SKIPPED[@]}"
  echo ""
fi

echo ""
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "✅ Dry-run complete. Nothing was written."
else
  echo "✅ Installation complete."
fi
echo ""
echo "Next steps:"
echo "  1. Edit .ai-factory/DESCRIPTION.template.md → save as .ai-factory/DESCRIPTION.md"
echo "  2. Edit .ai-factory/ARCHITECTURE.ts-server.md (or ARCHITECTURE.react-next.md) → save as .ai-factory/ARCHITECTURE.md"
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
