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
#   1. Copies skills/ + .claude/skills/meta-orchestrator/ → .claude/skills/
#      (meta-orchestrator is shipped from .claude/skills/ as single source of truth;
#       cross-refs to repo-internal paths get sed-transformed to GitHub blob URLs —
#       see UPSTREAM_BLOB_URL + transform_internal_refs() below;
#       per .claude/rules/dual-implementation-discipline.md §7 SSOT)
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

# Repo-internal cross-refs (paths to docs/, packages/, README.md) get rewritten to
# GitHub blob URLs at install time. One source of truth: .claude/skills/<skill>/SKILL.md
# Override via env var if forking to a different repo.
UPSTREAM_BLOB_URL="${UPSTREAM_BLOB_URL:-https://github.com/Yhooi2/rules-as-tests-aif/blob/main}"

# transform_internal_refs <markdown-file>
# Rewrites markdown links `](../../../{docs,packages}/...)` and `](../../../README.md...)`
# in-place to `](${UPSTREAM_BLOB_URL}/...)`. Leaves consumer-resolvable refs intact
# (e.g. `](../../rules/...)` resolves to consumer's .claude/rules/ post-install).
# Uses `-i.bak` for BSD-sed/GNU-sed portability, then removes the backup.
transform_internal_refs() {
  local f="$1"
  [ -f "$f" ] || return 0
  sed -E -i.bak \
    -e "s#\]\((\.\./)+docs/#](${UPSTREAM_BLOB_URL}/docs/#g" \
    -e "s#\]\((\.\./)+packages/#](${UPSTREAM_BLOB_URL}/packages/#g" \
    -e "s#\]\((\.\./)+README\.md#](${UPSTREAM_BLOB_URL}/README.md#g" \
    "$f"
  rm -f "${f}.bak"
}

# Library-only mode: when INSTALL_SH_LIB_ONLY=1, source this file to expose
# transform_internal_refs() (defined above) without running the install pipeline
# (which would `read -rp` interactively + write files). Used by
# tests/install-sh/*.test.sh. copy_safe/mkdir_safe/chmod_safe are NOT exposed —
# they sit further down and would require deeper guard placement.
if [ "${INSTALL_SH_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi

STACK=""
FORCE=""
DRY_RUN=""
# Per Stage 2 v3 §4.4 — COMPANIONS flag parse; CSV or none|all
COMPANIONS="${COMPANIONS:-}"
for arg in "$@"; do
  case "$arg" in
    --dry-run)              DRY_RUN="--dry-run" ;;
    --force)                FORCE="--force" ;;
    ts-server|react-next)   STACK="$arg" ;;
    --companions=*)         COMPANIONS="${arg#*=}" ;;
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

# ─── Pre-install: verify shipped artefacts carry Authoritative-for headers ──
# Author-side fail-loud check (Wave 3 of §13.21 closure, see
# docs/meta-factory/research-patches/2026-05-09-§13.21-l3-revision.md).
# Mirrors the canonical list at
# packages/core/principles/09-doc-authority-hierarchy.test.ts
# (REQUIRED_HEADER_DOCS Wave 2 + Wave 5.1 + memory-codification-auditor — 16 shipped surfaces).
# Runs in --dry-run too, so preview also catches drift between PR-side
# (principle 09 CI) and release-time copy. Positioned before package.json
# check + stack picker so framework-author drift fails fastest, before any
# interactive prompt.
SHIPPED_DOCS=(
  "packages/core/templates/shared/AGENTS.md.template"
  "packages/core/templates/shared/CLAUDE.md.template"
  "packages/core/templates/shared/DESCRIPTION.template.md"
  "packages/core/templates/shared/ARCHITECTURE.ts-server.md"
  "packages/core/templates/shared/integration-rules.md"
  "packages/preset-next-15-canonical/RULES.md"
  "packages/preset-next-15-canonical/RULES.react-next.md"
  "packages/preset-next-15-canonical/templates/ARCHITECTURE.react-next.md"
  "packages/core/templates/shared/skill-context/aif-review/SKILL.md"
  "packages/core/templates/shared/skill-context/aif-rules-check/SKILL.md"
  "agents/review-sidecar.md"
  "agents/living-docs-auditor.md"
  "agents/compliance-verifier.md"
  "agents/memory-codification-auditor.md"
  "skills/tool-bootstrapping/SKILL.md"
  "skills/tool-bootstrapping/references/decision-format.md"
)
echo "▶ Verifying shipped artefacts carry Authoritative-for headers"
verify_fail=0
for rel in "${SHIPPED_DOCS[@]}"; do
  abs="$PKG_ROOT/$rel"
  if [ ! -f "$abs" ]; then
    echo "  ❌ FAIL: $rel missing from package (expected at $abs)" >&2
    verify_fail=1
    continue
  fi
  if ! grep -qE '^> \*\*Authoritative for:\*\*' "$abs"; then
    echo "  ❌ FAIL: $rel missing Authoritative-for header (see .claude/rules/doc-authority-hierarchy.md §3)" >&2
    verify_fail=1
  fi
done
if [ "$verify_fail" -ne 0 ]; then
  echo "" >&2
  echo "Aborting install: shipped artefacts failed Authoritative-for header verification." >&2
  echo "This is a framework-author bug; principle 09 CI should also be red." >&2
  exit 1
fi
echo "  ✓ all ${#SHIPPED_DOCS[@]} shipped artefacts carry valid headers"

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
if [ -e "$PROJECT_ROOT/.claude/skills/tool-bootstrapping" ] && [ "$FORCE" != "--force" ]; then
  SKIPPED+=("$PROJECT_ROOT/.claude/skills/tool-bootstrapping")
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would skip: .claude/skills/tool-bootstrapping (exists)"
  else
    echo "  ⊝ .claude/skills/tool-bootstrapping (exists — skipping)"
  fi
elif [ "$DRY_RUN" = "--dry-run" ]; then
  echo "  [dry-run] would copy: $PKG_ROOT/skills/tool-bootstrapping → $PROJECT_ROOT/.claude/skills/tool-bootstrapping"
else
  rm -rf "$PROJECT_ROOT/.claude/skills/tool-bootstrapping"
  cp -r "$PKG_ROOT/skills/tool-bootstrapping" "$PROJECT_ROOT/.claude/skills/tool-bootstrapping"
  echo "  ✓ .claude/skills/tool-bootstrapping/"
fi
# meta-orchestrator: shipped from authoring location .claude/skills/meta-orchestrator/
# as single source of truth (no separate mirror under skills/). Repo-internal cross-refs
# in .md files get rewritten to GitHub blob URLs via transform_internal_refs().
if [ -e "$PROJECT_ROOT/.claude/skills/meta-orchestrator" ] && [ "$FORCE" != "--force" ]; then
  SKIPPED+=("$PROJECT_ROOT/.claude/skills/meta-orchestrator")
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would skip: .claude/skills/meta-orchestrator (exists)"
  else
    echo "  ⊝ .claude/skills/meta-orchestrator (exists — skipping)"
  fi
elif [ "$DRY_RUN" = "--dry-run" ]; then
  echo "  [dry-run] would copy: $PKG_ROOT/.claude/skills/meta-orchestrator → $PROJECT_ROOT/.claude/skills/meta-orchestrator (+ transform internal refs)"
else
  rm -rf "$PROJECT_ROOT/.claude/skills/meta-orchestrator"
  cp -r "$PKG_ROOT/.claude/skills/meta-orchestrator" "$PROJECT_ROOT/.claude/skills/meta-orchestrator"
  # Rewrite repo-internal cross-refs in all .md files to GitHub blob URLs.
  while IFS= read -r -d '' mdfile; do
    transform_internal_refs "$mdfile"
  done < <(find "$PROJECT_ROOT/.claude/skills/meta-orchestrator" -name '*.md' -print0)
  echo "  ✓ .claude/skills/meta-orchestrator/ (cross-refs rewritten to ${UPSTREAM_BLOB_URL})"
fi

# ─── 1b. Hooks ──────────────────────────────────────────
echo "▶ Claude hooks → .claude/hooks/"
mkdir_safe "$PROJECT_ROOT/.claude/hooks"
HOOK_SRC="$PKG_ROOT/packages/core/hooks/deps-hash-check.sh"
HOOK_DST="$PROJECT_ROOT/.claude/hooks/deps-hash-check.sh"
if [ -f "$HOOK_SRC" ]; then
  copy_safe "$HOOK_SRC" "$HOOK_DST"
  chmod_safe +x "$HOOK_DST" 2>/dev/null || true
fi

# Register hook in .claude/settings.json (create minimal file if absent)
SETTINGS="$PROJECT_ROOT/.claude/settings.json"
HOOK_CMD="bash .claude/hooks/deps-hash-check.sh"
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "  [dry-run] would: register deps-hash-check in .claude/settings.json"
elif [ ! -f "$SETTINGS" ]; then
  printf '{\n  "hooks": {\n    "UserPromptSubmit": [\n      {"hooks": [{"type": "command", "command": "%s"}]}\n    ]\n  }\n}\n' "$HOOK_CMD" > "$SETTINGS"
  echo "  ✓ .claude/settings.json created with UserPromptSubmit hook"
elif command -v jq >/dev/null 2>&1; then
  if ! grep -q "deps-hash-check" "$SETTINGS" 2>/dev/null; then
    jq --arg cmd "$HOOK_CMD" \
      '.hooks.UserPromptSubmit += [{"hooks":[{"type":"command","command":$cmd}]}]' \
      "$SETTINGS" > "$SETTINGS.tmp" && mv "$SETTINGS.tmp" "$SETTINGS"
    echo "  ✓ deps-hash-check registered in existing .claude/settings.json"
  else
    echo "  ⊝ .claude/hooks/deps-hash-check.sh already registered in settings.json"
  fi
else
  echo "  ⚠ jq not found — add manually to .claude/settings.json:"
  echo "    UserPromptSubmit: [{\"hooks\":[{\"type\":\"command\",\"command\":\"$HOOK_CMD\"}]}]"
fi

# ─── 2. Sub-agents ──────────────────────────────────────
echo "▶ Sub-agents → .claude/agents/"
# C-1 agent-collision resolution (2026-05-20, research-patches/2026-05-20-agent-collision-resolution.md):
#   - best-practices-sidecar — KEEP-AIF: removed from our payload; AIF's rules-sidecar
#     (reads .ai-factory/RULES.md) + edit-time ESLint + pre-push are the real enforcers.
#   - docs-auditor — RENAMED to living-docs-auditor (de-collides with AIF's same-named agent).
#   - review-sidecar — still collides with AIF's. copy_safe DEFAULT (no --force) intentionally
#     SKIPS it when AIF's is present (AIF keeps its slot). Do NOT --force-overwrite it: that
#     would strip AIF frontmatter the implement-coordinator + aif-handoff pipeline depend on.
#     Instead our anti-tautology content is delivered into AIF's pipeline via the native
#     .ai-factory/skill-context/aif-review/SKILL.md override (copied in §3 below). The live
#     CC-dispatch probe (former DECISION-NEEDED #2) is RESOLVED: a background maxTurns:6
#     sidecar reads + applies skill-context (3/3 read, 2/2 apply) — SSOT #50, ADOPT.
#     agents/review-sidecar.md remains the portable SSOT (@dual-pair anchor: review-sidecar).
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

# skill-context overrides — AIF-native "extend a vendored sub-agent" mechanism (C-1, SSOT #50).
# AIF's own background sidecars MANDATORY-read .ai-factory/skill-context/<skill>/SKILL.md
# (verified live: a background maxTurns:6 sidecar reads + applies these). We ride that wiring
# instead of shipping colliding agents: aif-review gets our anti-tautology test-review content;
# aif-rules-check gets the R10-naming + test-existence residue of the removed best-practices-sidecar.
mkdir_safe "$PROJECT_ROOT/.ai-factory/skill-context/aif-review"
copy_safe "$PKG_ROOT/packages/core/templates/shared/skill-context/aif-review/SKILL.md" "$PROJECT_ROOT/.ai-factory/skill-context/aif-review/SKILL.md"
mkdir_safe "$PROJECT_ROOT/.ai-factory/skill-context/aif-rules-check"
copy_safe "$PKG_ROOT/packages/core/templates/shared/skill-context/aif-rules-check/SKILL.md" "$PROJECT_ROOT/.ai-factory/skill-context/aif-rules-check/SKILL.md"

if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/ARCHITECTURE.react-next.md" "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-next.md"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/RULES.react-next.md" "$PROJECT_ROOT/.ai-factory/RULES.react-next.md"
fi

# ─── 3.5. Optional companion installs ───────────────────
# Per Stage 2 v3 §4.6 — K-1 companion-install prompts (Superpowers, TaskMaster, OhMyOpencode).
# Placement: after Phase 3 AIF templates (enforcement wiring complete), before Phase 4 Scripts.
# All prompts default [y/N] (capital N = default no). No companion is mandatory.
# Per Stage 2 v3 §4.4 — Non-interactive fallback: auto-default COMPANIONS=none when stdin is not a tty.
if [ -z "${COMPANIONS:-}" ] && [ ! -t 0 ]; then
  COMPANIONS="none"
fi

echo "▶ Optional companion installs"

# ── Superpowers ──────────────────────────────────────────
# Per Stage 2 v3 §4.2 + §4.4 — interactive prompt or COMPANIONS dispatch
should_install_superpowers=""
case "${COMPANIONS:-}" in
  all)            should_install_superpowers="y" ;;
  none)           should_install_superpowers="" ;;
  *superpowers*)  should_install_superpowers="y" ;;
  "")             # no env var set → interactive when stdin is a tty
    if [ -t 0 ]; then
      if [ "$DRY_RUN" = "--dry-run" ]; then
        # Per Stage 2 v3 §4.4 — dry-run skips the prompt and prints "would prompt:"
        echo "  [dry-run] would prompt: Install Superpowers? [y/N]"
      else
        read -rp "  Install Superpowers? (CC plugin — optional skills framework) [y/N]: " _sp_choice
        case "$_sp_choice" in [yY]|[yY][eE][sS]) should_install_superpowers="y" ;; esac
      fi
    fi
    ;;
esac

if [ "$should_install_superpowers" = "y" ]; then
  # Per Stage 2 v3 §4.5 — idempotency detect-and-skip
  if command -v claude >/dev/null 2>&1 && claude plugin list 2>/dev/null | grep -q superpowers; then
    echo "  ⊝ Superpowers already installed — skipping"
  elif [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would install: claude plugin install superpowers@claude-plugins-official --scope user"
  elif command -v claude >/dev/null 2>&1; then
    # Per Stage 2 v3 §4.7 — warn-and-continue on failure
    if ! claude plugin install superpowers@claude-plugins-official --scope user 2>&1; then
      echo "  ⚠ Superpowers install failed — retry manually:"
      echo "    claude plugin install superpowers@claude-plugins-official --scope user"
    else
      echo "  ✓ Superpowers installed"
    fi
  else
    # `claude` CLI absent — print manual command per Stage 2 v3 D6 Option A
    echo "  ⚠ claude CLI not on PATH — Superpowers not installed. Manual:"
    echo "    claude plugin install superpowers@claude-plugins-official --scope user"
  fi
fi

# ── TaskMaster ───────────────────────────────────────────
# Per Stage 2 v3 §4.2 + §4.4 — interactive prompt or COMPANIONS dispatch
should_install_taskmaster=""
case "${COMPANIONS:-}" in
  all)             should_install_taskmaster="y" ;;
  none)            should_install_taskmaster="" ;;
  *taskmaster*)    should_install_taskmaster="y" ;;
  "")              # no env var → interactive when stdin is a tty
    if [ -t 0 ]; then
      if [ "$DRY_RUN" = "--dry-run" ]; then
        echo "  [dry-run] would prompt: Install TaskMaster? [y/N]"
      else
        read -rp "  Install TaskMaster? (CC plugin — AI-driven task management) [y/N]: " _tm_choice
        case "$_tm_choice" in [yY]|[yY][eE][sS]) should_install_taskmaster="y" ;; esac
      fi
    fi
    ;;
esac

if [ "$should_install_taskmaster" = "y" ]; then
  # Per Stage 2 v3 §4.5 — idempotency detect-and-skip
  if command -v claude >/dev/null 2>&1 && claude plugin list 2>/dev/null | grep -q task-master; then
    echo "  ⊝ TaskMaster already installed — skipping"
  elif [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would install: claude plugin install claude-task-master@claude-plugins-official --scope user"
  elif command -v claude >/dev/null 2>&1; then
    # Per Stage 2 v3 §4.7 — warn-and-continue on failure
    if ! claude plugin install claude-task-master@claude-plugins-official --scope user 2>&1; then
      echo "  ⚠ TaskMaster install failed — retry manually:"
      echo "    claude plugin install claude-task-master@claude-plugins-official --scope user"
    else
      echo "  ✓ TaskMaster installed"
    fi
  else
    # `claude` CLI absent — print manual command per Stage 2 v3 D6 Option A
    echo "  ⚠ claude CLI not on PATH — TaskMaster not installed. Manual:"
    echo "    claude plugin install claude-task-master@claude-plugins-official --scope user"
  fi
fi

# ── OhMyOpencode ─────────────────────────────────────────
# Per Stage 2 v3 §4.2 + D5 (Option A — print + instruct, do NOT invoke automatically)
should_install_omo=""
case "${COMPANIONS:-}" in
  all)              should_install_omo="y" ;;
  none)             should_install_omo="" ;;
  *ohmyopencode*)   should_install_omo="y" ;;
  "")               # no env var → interactive when stdin is a tty
    if [ -t 0 ]; then
      if [ "$DRY_RUN" = "--dry-run" ]; then
        echo "  [dry-run] would prompt: Install OhMyOpencode? [y/N]"
      else
        read -rp "  Install OhMyOpencode? (OpenCode companion — requires bun) [y/N]: " _omo_choice
        case "$_omo_choice" in [yY]|[yY][eE][sS]) should_install_omo="y" ;; esac
      fi
    fi
    ;;
esac

if [ "$should_install_omo" = "y" ]; then
  # Per Stage 2 v3 D5 Option A — print command + instruct; do NOT invoke bunx automatically
  echo "  ▶ OhMyOpencode install (run AFTER install.sh completes):"
  if command -v bun >/dev/null 2>&1; then
    echo "    bunx oh-my-openagent install"
  else
    echo "    # First install bun (https://bun.sh); then:"
    echo "    bunx oh-my-openagent install"
  fi
  # Per Stage 3 §4.2 — escape hatch for skill dup-tool-names
  echo "    Note: if you see HTTP 400 'Duplicate tool names detected' in CC after install,"
  echo "    set \"claude_code.skills\": false in OhMyOpencode config."
fi

# ── aif-handoff integration note ─────────────────────────
# Per Stage 2 v3 §4.6 — single informational note, no prompt needed;
# our Phase 3 skill-context files ARE the client-side aif-handoff integration.
echo "  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)"

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
# Wave 10.5: also install the bash critical-only fallback so the dispatcher can find it.
# The runtime dispatcher (husky-pre-push.sh) selects between TS-core and fallback at each push.
copy_safe "$PKG_ROOT/packages/core/hooks/pre-push.fallback.sh" "$PROJECT_ROOT/packages/core/hooks/pre-push.fallback.sh"
chmod_safe +x "$PROJECT_ROOT/.husky/pre-commit" "$PROJECT_ROOT/.husky/pre-push" \
  "$PROJECT_ROOT/packages/core/hooks/pre-push.fallback.sh" 2>/dev/null || true

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
