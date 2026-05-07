#!/usr/bin/env bash
# setup.sh — one-command installation of rules-as-tests on top of AI Factory.
#
# Wraps:
#   1. ai-factory init (creates .ai-factory/, .claude/agents/, etc.)
#   2. install.sh (overlays our skills/agents/templates/scripts)
#   3. npm install of dev dependencies
#   4. husky init
#   5. Stack detection (ts-server vs react-next) and template selection
#
# Usage:
#   bash setup.sh                          # interactive, autodetects stack
#   bash setup.sh --stack=ts-server        # force TS-server stack
#   bash setup.sh --stack=react-next       # force React/Next stack
#   bash setup.sh --skip-deps              # skip npm install
#   bash setup.sh --skip-aif-init          # if ai-factory init already ran
#
# Exit codes: 0 on success, 1 on any error.

set -euo pipefail

# ───── Defaults ─────
STACK=""
SKIP_DEPS=false
SKIP_AIF=false
FORCE=""
PKG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(pwd)"

# ───── Color output ─────
if [ -t 1 ]; then
  C_RESET='\033[0m'; C_RED='\033[0;31m'; C_GREEN='\033[0;32m'
  C_YELLOW='\033[1;33m'; C_BLUE='\033[0;34m'; C_BOLD='\033[1m'
else
  C_RESET=''; C_RED=''; C_GREEN=''; C_YELLOW=''; C_BLUE=''; C_BOLD=''
fi

log()   { echo -e "${C_BLUE}▶${C_RESET} $1"; }
ok()    { echo -e "${C_GREEN}✓${C_RESET} $1"; }
warn()  { echo -e "${C_YELLOW}!${C_RESET} $1"; }
fail()  { echo -e "${C_RED}✗${C_RESET} $1" >&2; exit 1; }
header(){ echo -e "\n${C_BOLD}── $1 ──${C_RESET}"; }

# ───── Parse args ─────
for arg in "$@"; do
  case "$arg" in
    --stack=*)        STACK="${arg#--stack=}" ;;
    --skip-deps)      SKIP_DEPS=true ;;
    --skip-aif-init)  SKIP_AIF=true ;;
    --force)          FORCE="--force" ;;
    -h|--help)
      head -22 "$0" | sed 's/^# *//'
      exit 0
      ;;
    *)
      fail "Unknown argument: $arg (use --help for usage)"
      ;;
  esac
done

# ───── 1. Sanity checks ─────
header "Pre-flight checks"

[ -d "$PROJECT_DIR" ] || fail "Project dir not found: $PROJECT_DIR"
[ -f "$PKG_DIR/install.sh" ] || fail "install.sh not found at $PKG_DIR — are you running setup.sh from inside the package?"

command -v node >/dev/null 2>&1 || fail "node not found. Install Node.js 20.19+ first."
command -v npm  >/dev/null 2>&1 || fail "npm not found."
command -v git  >/dev/null 2>&1 || fail "git not found."

NODE_VER=$(node --version | sed 's/^v//' | cut -d. -f1)
[ "$NODE_VER" -ge 20 ] || warn "Node.js $NODE_VER detected. We recommend 20.19+. Proceeding anyway."

command -v ai-factory >/dev/null 2>&1 || {
  warn "ai-factory not installed. Installing globally..."
  npm install -g ai-factory || fail "Failed to install ai-factory globally"
}
ok "Prerequisites OK"

# ───── 2. Stack detection ─────
header "Stack detection"

if [ -z "$STACK" ]; then
  if [ -f "$PROJECT_DIR/next.config.ts" ] || [ -f "$PROJECT_DIR/next.config.js" ] || [ -f "$PROJECT_DIR/next.config.mjs" ]; then
    STACK="react-next"
    log "Auto-detected: React/Next.js (next.config.* found)"
  elif [ -f "$PROJECT_DIR/package.json" ] && grep -q '"next"' "$PROJECT_DIR/package.json" 2>/dev/null; then
    STACK="react-next"
    log "Auto-detected: React/Next.js (next in package.json)"
  elif [ -f "$PROJECT_DIR/package.json" ] && grep -qE '"(react|@types/react)"' "$PROJECT_DIR/package.json" 2>/dev/null; then
    STACK="react-next"
    log "Auto-detected: React (react in package.json — assuming Next.js stack)"
  else
    STACK="ts-server"
    log "Auto-detected: server-side TypeScript (no React/Next markers found)"
  fi
fi

case "$STACK" in
  ts-server|react-next) ok "Stack: $STACK" ;;
  *) fail "Invalid stack: $STACK. Use ts-server or react-next." ;;
esac

# ───── 3. ai-factory init ─────
if [ "$SKIP_AIF" = false ]; then
  header "Step 1/5 — ai-factory init"

  if [ -d "$PROJECT_DIR/.ai-factory" ] || [ -f "$PROJECT_DIR/.ai-factory.json" ]; then
    warn "AI Factory already initialized in this project. Skipping init step."
    warn "If you want to re-init, run: ai-factory init --force"
  else
    log "Running: ai-factory init --agents claude"
    (cd "$PROJECT_DIR" && ai-factory init --agents claude) \
      || fail "ai-factory init failed"
    ok "AI Factory initialized"
  fi
else
  log "Skipping ai-factory init (--skip-aif-init)"
fi

# ───── 4. Apply rules-as-tests overlay ─────
header "Step 2/5 — Applying rules-as-tests overlay"

log "Running install.sh..."
# install.sh expects positional STACK as $1 and runs from cwd.
# Call it from the project dir so $(pwd) resolves correctly.
if [ -n "$FORCE" ]; then
  (cd "$PROJECT_DIR" && bash "$PKG_DIR/install.sh" "$STACK" "$FORCE") \
    || fail "install.sh failed"
else
  (cd "$PROJECT_DIR" && bash "$PKG_DIR/install.sh" "$STACK") \
    || fail "install.sh failed"
fi
ok "Overlay applied"

# ───── 4b. dep-cruiser: delegate cold-start to `depcruise --init`, layer R3 rules ─────
header "Step 2b/5 — dependency-cruiser config"

cd "$PROJECT_DIR"

# Phase 3: if the consumer doesn't yet have a .dependency-cruiser.cjs, hand off to
# `depcruise --init` for tailored TS/preset detection, then layer rules-as-tests
# architecture rules on top. If install.sh already copied our template (typical
# case), this branch is a no-op and the template is used as-is.
#
# NOTE: re-running setup.sh on a project with hand-edited .dependency-cruiser.cjs
# is safe — the `grep -q "rules-as-tests:layered"` guard prevents double-append.
# It does NOT prevent name collisions with hand-edited rules of the same name.
if [ ! -f .dependency-cruiser.cjs ]; then
  log "No .dependency-cruiser.cjs found. Running 'npx depcruise --init' for project-specific scaffolding..."
  warn "  (You can choose 'yes' or 'no' to TypeScript/preset prompts as fits your project.)"
  npx -y depcruise --init || {
    warn "  depcruise --init failed or was cancelled — falling back to template config"
    cp "$PKG_DIR/templates/ts-server/dependency-cruiser.cjs" .dependency-cruiser.cjs
  }
  if [ -f .dependency-cruiser.cjs ]; then
    log "Layering rules-as-tests architecture rules on top of depcruise config..."
    if ! grep -q "rules-as-tests:layered" .dependency-cruiser.cjs; then
      cat >> .dependency-cruiser.cjs <<'EOF'

// rules-as-tests:layered — appended by setup.sh
// These rules supplement (not replace) the rules generated by `depcruise --init`.
// See factory/ARCHITECTURE.ts-server.md for the layer model.
module.exports.forbidden = [
  ...(module.exports.forbidden || []),
  {
    name: 'rules-as-tests:no-domain-to-infra',
    severity: 'error',
    from: { path: '^src/domain' },
    to:   { path: '^src/infrastructure' },
    comment: 'Domain MUST NOT depend on infrastructure (R3).',
  },
  {
    name: 'rules-as-tests:application-to-infra-only-via-ports',
    severity: 'error',
    from: { path: '^src/application' },
    to:   { path: '^src/infrastructure', pathNot: '^src/application/ports' },
    comment: 'Application talks to infra through ports (R3).',
  },
];
EOF
      ok "Layered rules appended"
    else
      log ".dependency-cruiser.cjs already contains rules-as-tests:layered marker — skipping"
    fi
  fi
else
  log ".dependency-cruiser.cjs already exists — leaving as-is"
fi

# ───── 5. npm dev dependencies ─────
if [ "$SKIP_DEPS" = false ]; then
  header "Step 3/5 — Installing dev dependencies"

  cd "$PROJECT_DIR"

  # Common deps for both stacks
  COMMON_DEPS=(
    "@eslint/js@^10.0.0"
    "@stryker-mutator/core@^8.7.0"
    "@stryker-mutator/vitest-runner@^8.7.0"
    "@types/node@^22.10.0"
    "@vitest/coverage-v8@^4.1.5"
    "dependency-cruiser@^16.8.0"
    "eslint@^10.0.0"
    "eslint-config-prettier@^9.1.0"
    "eslint-plugin-vitest@^0.5.4"
    "fast-check@^3.23.0"
    "glob@^11.0.0"
    "globals@^15.14.0"
    "husky@^9.1.7"
    "lint-staged@^15.2.10"
    "npm-run-all2@^7.0.0"
    "prettier@^3.4.0"
    "sort-package-json@^2.12.0"
    "ts-morph@^24.0.0"
    "tsx@^4.19.0"
    "typescript@^5.7.0"
    "typescript-eslint@^8.59.0"
    "vitest@^4.1.5"
  )

  REACT_DEPS=(
    "@next/eslint-plugin-next@^15.0.0"
    "@playwright/test@^1.49.0"
    "@testing-library/jest-dom@^6.6.0"
    "@testing-library/react@^16.1.0"
    "@testing-library/user-event@^14.5.0"
    "@vitejs/plugin-react@^4.3.0"
    "eslint-plugin-jsx-a11y@^6.10.0"
    "eslint-plugin-react@^7.37.0"
    "eslint-plugin-react-hooks@^5.0.0"
    "eslint-plugin-testing-library@^7.1.0"
    "jsdom@^25.0.0"
  )

  ALL_DEPS=("${COMMON_DEPS[@]}")
  if [ "$STACK" = "react-next" ]; then
    ALL_DEPS+=("${REACT_DEPS[@]}")
  fi

  log "Installing ${#ALL_DEPS[@]} dev dependencies (this takes a minute)..."
  npm install -D --prefer-offline --no-audit "${ALL_DEPS[@]}" \
    || warn "Some dev dependencies failed to install. Check npm output. You may need to run npm install manually."
  ok "Dev dependencies installed"

  # Production deps
  log "Installing zod (production dependency)..."
  npm install zod@^3.24.0 || warn "Failed to install zod"
  ok "Production dependencies installed"
else
  log "Skipping npm install (--skip-deps)"
fi

# ───── 6. Husky init ─────
header "Step 4/5 — Husky setup"

cd "$PROJECT_DIR"

# Order matters: `husky init` overwrites .husky/pre-commit with a default stub,
# so it must run BEFORE we copy our own hooks. Otherwise the hooks installed by
# install.sh get clobbered by husky's defaults.
if [ ! -d ".husky" ]; then
  log "Initializing Husky..."
  npx husky init || warn "husky init failed — install husky manually"
else
  warn ".husky already exists, skipping init"
fi

# Re-install our hooks from the package (absolute paths — cwd is project root).
if [ -f "$PKG_DIR/templates/shared/husky-pre-commit.sh" ]; then
  log "Installing pre-commit hook..."
  cp "$PKG_DIR/templates/shared/husky-pre-commit.sh" "$PROJECT_DIR/.husky/pre-commit"
  chmod +x "$PROJECT_DIR/.husky/pre-commit"
fi

if [ -f "$PKG_DIR/templates/shared/husky-pre-push.sh" ]; then
  log "Installing pre-push hook..."
  cp "$PKG_DIR/templates/shared/husky-pre-push.sh" "$PROJECT_DIR/.husky/pre-push"
  chmod +x "$PROJECT_DIR/.husky/pre-push"
fi
ok "Husky configured"

# ───── 7. package.json scripts ─────
header "Step 5/5 — package.json scripts"

if command -v jq >/dev/null 2>&1 && [ -f package.json ]; then
  log "Adding scripts to package.json (via jq)..."

  AUDIT_SCRIPT="bash scripts/audit-ai-docs.sh"
  if [ "$STACK" = "react-next" ]; then
    AUDIT_SCRIPT="bash scripts/audit-ai-docs.react-next.sh"
  fi

  jq --arg audit "$AUDIT_SCRIPT" \
     '.scripts.lint                = "eslint . --max-warnings=0" |
      .scripts["lint:fix"]         = "eslint . --fix" |
      .scripts.format              = "prettier --write ." |
      .scripts["format:check"]     = "prettier --check ." |
      .scripts.typecheck           = "tsc --noEmit" |
      .scripts.test                = "vitest run" |
      .scripts["test:watch"]       = "vitest" |
      .scripts["test:coverage"]    = "vitest run --coverage" |
      .scripts["test:mutation"]    = "stryker run" |
      .scripts["arch:check"]       = "depcruise --config .dependency-cruiser.cjs src" |
      .scripts["audit:docs"]       = $audit |
      .scripts.validate            = "npm-run-all --parallel typecheck lint format:check arch:check test" |
      .scripts.prepare             = "husky"
     ' package.json > package.json.tmp && mv package.json.tmp package.json
  ok "package.json scripts added"
else
  warn "jq not installed or no package.json. Add scripts manually:"
  cat <<'EOF'

  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:mutation": "stryker run",
    "arch:check": "depcruise --config .dependency-cruiser.cjs src",
    "audit:docs": "bash scripts/audit-ai-docs.sh",
    "validate": "npm-run-all --parallel typecheck lint format:check arch:check test",
    "prepare": "husky"
  }
EOF
fi

# ───── Final ─────
header "Setup complete"

echo ""
ok "rules-as-tests-aif installed for $STACK stack"
echo ""
echo "Next steps (manual):"
echo ""
echo "  1. Edit .ai-factory/DESCRIPTION.md — replace placeholders"
echo "     (project name, stack details, non-goals)"
echo ""
echo "  2. Review .ai-factory/RULES.md — adjust R1-R20 to your project"
echo "     (remove rules you don't need, add project-specific rules R21+)"
echo ""
echo "  3. Customize scripts/audit-ai-docs.sh"
echo "     (the default probes are generic; add project-specific rule probes)"
echo ""
echo "  4. Run validation:"
echo "     ${C_BOLD}npm run validate${C_RESET}"
echo "     ${C_BOLD}npm run audit:docs${C_RESET}"
echo ""
echo "  5. Open Claude Code and try:"
echo "     ${C_BOLD}/aif-plan add hello world endpoint${C_RESET}"
echo "     ${C_BOLD}/aif-implement${C_RESET}"
echo "     ${C_BOLD}/aif-verify${C_RESET}  ← runs best-practices-sidecar + review-sidecar + docs-auditor"
echo ""
echo "Documentation: see INSTALL.md and README.md in this package."
echo ""
