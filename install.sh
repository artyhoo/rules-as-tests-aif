#!/usr/bin/env bash
# install.sh — Deploy rules-as-tests-aif into the current project.
#
# Usage:
#   ./install.sh ts-server                      # default safe install
#   ./install.sh react-next --force             # overwrite existing files
#   ./install.sh react-next --dry-run           # preview without writing
#   ./install.sh react-next --dry-run --force   # preview overwrite plan
#   ./install.sh ts-server --full               # also auto-install dev-deps (no prompts)
#
# What it does:
#   1. Copies skills/ + .claude/skills/{pipeline,dispatcher,aif-doctor,template-audit}/ → .claude/skills/
#      (the meta-orchestrator pipeline + its orchestration companions are shipped from
#       .claude/skills/ as single source of truth; self-reflection + ai-doc are intentionally
#       NOT shipped — repo-internal per build-first-reuse-default.md §1.1 shipped-axis;
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
# Use --full to also run the consumer's package manager to install the dev-deps the shipped
# hooks/scripts need (default is to ask [y/N], default No — a mutating step is opt-in).

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
FULL=""
for arg in "$@"; do
  case "$arg" in
    --dry-run)              DRY_RUN="--dry-run" ;;
    --force)                FORCE="--force" ;;
    --full)                 FULL="--full" ;;
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

# ─── Pre-install: verify shipped artefacts carry Authoritative-for headers ──
# Author-side fail-loud check (Wave 3 of §13.21 closure, see
# docs/meta-factory/research-patches/2026-05-09-§13.21-l3-revision.md).
# Mirrors the canonical list at
# packages/core/principles/09-doc-authority-hierarchy.test.ts
# (REQUIRED_HEADER_DOCS Wave 2 + Wave 5.1 + memory-codification-auditor + manual-rule-liveness-prober — 18 shipped surfaces).
# Runs in --dry-run too, so preview also catches drift between PR-side
# (principle 09 CI) and release-time copy. Positioned before package.json
# check + stack picker so framework-author drift fails fastest, before any
# interactive prompt.
# SHIPPED_DOCS is the SINGLE SOURCE OF TRUTH for both the header-verify loop (below) AND the
# §3 skill-context copy step (which derives its skill-context entries from this very array —
# see the `*/skill-context/*/SKILL.md` case there). Adding a skill-context doc here wires it
# into verify AND deploy in one edit → the two lists cannot drift (FQA S1-A P2: aif-orchestrator-
# discipline was header-verified but absent from the hand-maintained copy step, so consumers
# landed 2/3). Keep all three skill-context entries listed explicitly (static-parseable by
# principle 09's SHIPPED_DOCS↔REQUIRED_HEADER_DOCS check).
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
  "packages/core/templates/shared/skill-context/aif-orchestrator-discipline/SKILL.md"
  "agents/review-sidecar.md"
  "agents/living-docs-auditor.md"
  "agents/compliance-verifier.md"
  "agents/memory-codification-auditor.md"
  "agents/manual-rule-liveness-prober.md"
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

# Detect the consumer's package manager from corepack / workspace / lockfile signals present
# AT INSTALL TIME. The explicit package.json "packageManager" field (corepack source of truth)
# wins; else workspace/lock markers (pnpm-workspace.yaml exists pre-install in a monorepo even
# before the lockfile lands — R-S4-3 note below); else npm. Echoes one of: npm | pnpm | yarn.
# node-optional: the field check is skipped when node is absent (markers still resolve). SSOT —
# shared by patch_stryker_package_manager() and the §8 dev-dep install so the two never drift.
detect_pm() {
  local _pm _field
  if [ -f "$PROJECT_ROOT/pnpm-lock.yaml" ] || [ -f "$PROJECT_ROOT/pnpm-workspace.yaml" ]; then
    _pm="pnpm"
  elif [ -f "$PROJECT_ROOT/yarn.lock" ] || [ -f "$PROJECT_ROOT/.yarnrc.yml" ]; then
    _pm="yarn"
  else
    _pm="npm"
  fi
  if command -v node >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/package.json" ]; then
    _field=$(AIF_PJ="$PROJECT_ROOT/package.json" node -e 'try{const m=(JSON.parse(require("fs").readFileSync(process.env.AIF_PJ,"utf8")).packageManager||"").split("@")[0];if(["npm","pnpm","yarn"].includes(m))process.stdout.write(m)}catch{}' 2>/dev/null || true)
    [ -n "$_field" ] && _pm="$_field"
  fi
  printf '%s' "$_pm"
}

# The shipped stryker.config.json hardcodes "packageManager": "npm" (the template can't
# self-detect). Patch the COPIED config in place to match the consumer's lockfile so a
# pnpm/yarn consumer doesn't get an npm-locked mutation run. Non-destructive: rewrites only
# the packageManager key. Guarded on --dry-run and on node availability (no node → leave npm).
patch_stryker_package_manager() {
  _cfg="$PROJECT_ROOT/stryker.config.json"
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would set stryker packageManager from consumer lockfile"
    return 0
  fi
  command -v node >/dev/null 2>&1 || return 0
  [ -f "$_cfg" ] || return 0
  # R-S4-3: install.sh runs BEFORE the consumer's `npm/pnpm install` in the canonical flow,
  # so a lockfile may not exist yet (a pnpm monorepo would silently stay "npm"). Detect from
  # signals present AT INSTALL TIME: the explicit package.json "packageManager" field (corepack
  # source of truth) wins; else workspace/lock markers (pnpm-workspace.yaml exists pre-install
  # in a monorepo); else npm. A flat pnpm consumer with neither marker nor field still defaults
  # npm — re-run install after the lockfile lands, or set package.json "packageManager".
  _pm=$(detect_pm)   # SSOT detector (lockfile/workspace/corepack signals; see detect_pm above)
  AIF_STRYKER_CFG="$_cfg" AIF_STRYKER_PM="$_pm" node -e '
    const fs = require("fs");
    const p = process.env.AIF_STRYKER_CFG;
    const cfg = JSON.parse(fs.readFileSync(p, "utf8"));
    cfg.packageManager = process.env.AIF_STRYKER_PM;
    fs.writeFileSync(p, JSON.stringify(cfg, null, 2) + "\n");
  '
  echo "  ✓ stryker packageManager → $_pm"
}

# copy_skill_with_transform <skill-slug>
# Copies .claude/skills/<slug>/ to the consumer and rewrites repo-internal markdown
# cross-refs to GitHub blob URLs (transform_internal_refs). Used for pipeline + its
# orchestration companion skills (dispatcher / aif-doctor / template-audit) — every one
# carries ](../../../{docs,packages,README}) refs that would dangle on a consumer tree.
# Honors --force (skip-if-exists default) and --dry-run, matching copy_safe semantics.
copy_skill_with_transform() {
  local slug="$1"
  local src="$PKG_ROOT/.claude/skills/$slug"
  local dst="$PROJECT_ROOT/.claude/skills/$slug"
  if [ -e "$dst" ] && [ "$FORCE" != "--force" ]; then
    SKIPPED+=("$dst")
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "  [dry-run] would skip: .claude/skills/$slug (exists)"
    else
      echo "  ⊝ .claude/skills/$slug (exists — skipping)"
    fi
    return 0
  fi
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would copy: $src → $dst (+ transform internal refs)"
    return 0
  fi
  rm -rf "$dst"
  cp -r "$src" "$dst"
  # Rewrite repo-internal cross-refs in all .md files to GitHub blob URLs.
  while IFS= read -r -d '' mdfile; do
    transform_internal_refs "$mdfile"
  done < <(find "$dst" -name '*.md' -print0)
  echo "  ✓ .claude/skills/$slug/ (cross-refs rewritten to ${UPSTREAM_BLOB_URL})"
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
# meta-orchestrator + its orchestration companions: shipped from authoring location
# .claude/skills/ as single source of truth (no separate mirror under skills/). Repo-internal
# cross-refs in .md files get rewritten to GitHub blob URLs via transform_internal_refs().
#   - pipeline      — the planner (/pipeline): umbrella triage, priority ranking, plan/state.md.
#   - dispatcher    — pipeline's execution companion: dispatches a chosen umbrella's stages
#                     through the aif-control loop the ./setup runtime-bridge step installs.
#   - aif-doctor    — diagnoses that same aif-handoff runtime when a task stalls / runtime breaks.
#   - template-audit — local advisory audit of the rendered templates this installer ships.
# self-reflection + ai-doc are intentionally NOT shipped: they are repo-internal (reference
# THIS repo's rules / docs paths a consumer does not have) — see the build-vs-reuse shipped-axis
# default in .claude/rules/build-first-reuse-default.md §1.1 + dual-implementation-discipline.md §3.
for _skill in pipeline dispatcher aif-doctor template-audit; do
  copy_skill_with_transform "$_skill"
done

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

# Seed tool-decisions.md so the deps-change re-evaluation hook actually fires (FQA S1-B P1:
# deps-hash-check.sh short-circuits to silent exit 0 when this file is absent — on the ./setup
# path nothing ever created it, so the whole automation was dead). The template carries the
# `deps-hash: <pending>` sentinel (DN-1 = Option B): the hook WARNs every session until the
# consumer runs /tool-bootstrapping once, which stamps the real hash. file-deploy only (kind
# identical to the seeds above) — no npm/package.json dependency at install time.
copy_safe "$PKG_ROOT/skills/tool-bootstrapping/templates/tool-decisions.md.template" "$PROJECT_ROOT/.ai-factory/tool-decisions.md"

# skill-context overrides — AIF-native "extend a vendored sub-agent" mechanism (C-1, SSOT #50).
# AIF's own background sidecars MANDATORY-read .ai-factory/skill-context/<skill>/SKILL.md
# (verified live: a background maxTurns:6 sidecar reads + applies these). We ride that wiring
# instead of shipping colliding agents: aif-review gets our anti-tautology test-review content;
# aif-rules-check gets the R10-naming + test-existence residue of the removed best-practices-sidecar.
# Derive the skill-context copy set from SHIPPED_DOCS (single source — FQA P2 fix). Every
# skill-context entry that is header-verified above is copied here; the two lists cannot drift.
for _doc in "${SHIPPED_DOCS[@]}"; do
  case "$_doc" in
    packages/core/templates/shared/skill-context/*/SKILL.md)
      _sc="${_doc#packages/core/templates/shared/skill-context/}"; _sc="${_sc%/SKILL.md}"
      mkdir_safe "$PROJECT_ROOT/.ai-factory/skill-context/$_sc"
      copy_safe "$PKG_ROOT/$_doc" "$PROJECT_ROOT/.ai-factory/skill-context/$_sc/SKILL.md" ;;
  esac
done

if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/ARCHITECTURE.react-next.md" "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-next.md"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/RULES.react-next.md" "$PROJECT_ROOT/.ai-factory/RULES.react-next.md"
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
# R4 probe (ts-morph) invoked by audit-ai-docs.sh via `npx tsx scripts/audit-r4.ts`.
copy_safe "$PKG_ROOT/packages/core/probes/audit-r4.ts" "$PROJECT_ROOT/scripts/audit-r4.ts"
# cih-s3 F3 "+V": glob-liveness gate — fails if a custom rule matches zero source files
# (silent-inertness alarm). Dependency-free bash; run pre-PR once the layout settles.
copy_safe "$PKG_ROOT/packages/core/audit-self/check-rule-globs.sh" "$PROJECT_ROOT/scripts/check-rule-globs.sh"
chmod_safe +x "$PROJECT_ROOT/scripts/check-rule-globs.sh" 2>/dev/null || true
# cih-s3 F14: lint-staged binary-resolution gate — fails if a .lintstagedrc command's binary
# can't resolve from the cwd lint-staged would use (the ENOENT-before-commit alarm on monorepos).
copy_safe "$PKG_ROOT/packages/core/audit-self/check-lintstaged-resolves.sh" "$PROJECT_ROOT/scripts/check-lintstaged-resolves.sh"
chmod_safe +x "$PROJECT_ROOT/scripts/check-lintstaged-resolves.sh" 2>/dev/null || true
if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh" "$PROJECT_ROOT/scripts/audit-ai-docs.react-next.sh"
  chmod_safe +x "$PROJECT_ROOT/scripts/audit-ai-docs.react-next.sh" 2>/dev/null || true
fi

# ─── 5. Shared templates ────────────────────────────────
echo "▶ Shared templates → project root"
copy_safe "$PKG_ROOT/packages/core/templates/shared/.nvmrc" "$PROJECT_ROOT/.nvmrc"
copy_safe "$PKG_ROOT/packages/core/templates/shared/.lintstagedrc.json" "$PROJECT_ROOT/.lintstagedrc.json"
# cih-s3 F14 (M3): in a workspace, a single root .lintstagedrc runs `eslint` from git-root; in
# a pnpm/isolated-node_modules monorepo the per-package eslint binary isn't at root → ENOENT
# blocks the commit. Drop a per-package .lintstagedrc.json stub in each EXISTING package dir so
# lint-staged runs with cwd=that package and resolves the local binary. PM-agnostic (no
# `pnpm exec`). Best-effort — packages added later need the same stub; scripts/check-lintstaged-
# resolves.sh is the alarm that catches an unstubbed package before its first blocked commit.
if [ "$DRY_RUN" != "--dry-run" ] && { [ -f "$PROJECT_ROOT/pnpm-workspace.yaml" ] || grep -q '"workspaces"' "$PROJECT_ROOT/package.json" 2>/dev/null; }; then
  _ndrop=0
  while IFS= read -r _pkgjson; do
    _pkgdir=$(dirname "$_pkgjson")
    [ "$_pkgdir" = "$PROJECT_ROOT" ] && continue
    if [ ! -f "$_pkgdir/.lintstagedrc.json" ]; then
      cp "$PROJECT_ROOT/.lintstagedrc.json" "$_pkgdir/.lintstagedrc.json" && _ndrop=$((_ndrop + 1))
    fi
  done < <(find "$PROJECT_ROOT" -name node_modules -prune -o -name .git -prune -o -name package.json -print 2>/dev/null)
  echo "  ✓ workspace detected → dropped $_ndrop per-package .lintstagedrc.json stub(s) (F14 lint-staged cwd fix)"
fi
# cih-s3 F15: keep prettier off the generated RULES.md table region (rendered SSOT, not
# format-stable) so a `*.md → prettier --write` lint-staged step can't reflow it.
copy_safe "$PKG_ROOT/packages/core/templates/shared/.prettierignore" "$PROJECT_ROOT/.prettierignore"
copy_safe "$PKG_ROOT/packages/core/templates/shared/tsconfig.json" "$PROJECT_ROOT/tsconfig.json"
copy_safe "$PKG_ROOT/packages/core/templates/shared/AGENTS.md.template" "$PROJECT_ROOT/AGENTS.md"
mkdir_safe "$PROJECT_ROOT/.husky"
copy_safe "$PKG_ROOT/packages/core/templates/shared/husky-pre-commit.sh" "$PROJECT_ROOT/.husky/pre-commit"
copy_safe "$PKG_ROOT/packages/core/templates/shared/husky-pre-push.sh" "$PROJECT_ROOT/.husky/pre-push"
# Wave 10.5: also install the bash critical-only fallback so the dispatcher can find it.
# The runtime dispatcher (husky-pre-push.sh) selects between TS-core and fallback at each push.
copy_safe "$PKG_ROOT/packages/core/hooks/pre-push.fallback.sh" "$PROJECT_ROOT/packages/core/hooks/pre-push.fallback.sh"
# cih-s1 F1: also ship the TS-core hook + its bounded static import closure so the
# dispatcher's Node≥20 arm is reachable (without these, husky-pre-push.sh always
# falls to the presence-only bash fallback). The relative layout under
# packages/core/hooks/ is preserved so the dispatcher resolves $REPO_ROOT/packages/
# core/hooks/pre-push.ts. Closure (static, re-derived to fixpoint): pre-push.ts →
# {utils/run-check.ts, utils/git.ts, checks/prior-art.ts, checks/s17.ts}. NOT shipped:
# checks/guard-liveness.ts is dynamically import()ed and degrades gracefully when absent.
for ts_hook in \
  pre-push.ts \
  utils/run-check.ts \
  utils/git.ts \
  checks/prior-art.ts \
  checks/s17.ts; do
  copy_safe "$PKG_ROOT/packages/core/hooks/$ts_hook" "$PROJECT_ROOT/packages/core/hooks/$ts_hook"
done
chmod_safe +x "$PROJECT_ROOT/.husky/pre-commit" "$PROJECT_ROOT/.husky/pre-push" \
  "$PROJECT_ROOT/packages/core/hooks/pre-push.fallback.sh" 2>/dev/null || true

# cih-s1 F2: activate the shipped hooks deterministically. Copying the files alone leaves them
# inert — git never calls .husky/* until core.hooksPath points there. We set it directly instead
# of `npx husky init` (which would CLOBBER the .husky/pre-commit + pre-push we just shipped).
# Guarded on DRY_RUN and on PROJECT_ROOT being a git repo (no-op in non-git dirs, e.g. some tests).
if [ -n "$DRY_RUN" ]; then
  echo "▶ git hooks → [dry-run] would set core.hooksPath=.husky"
elif git -C "$PROJECT_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  git -C "$PROJECT_ROOT" config core.hooksPath .husky
  echo "▶ Activated git hooks → core.hooksPath=.husky"
else
  echo "  ⚠  not a git repo — skipped core.hooksPath activation (run: git config core.hooksPath .husky)"
fi

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

# Generate the barrel that eslint.config.mjs imports (`./eslint-rules-local/index.ts`).
# FQA S1-A W1: install copied the rule FILES but the copy loop skips `*/index.ts`, so the
# barrel never landed → eslint hit a missing-module error on config load → ALL custom rules
# (and all linting) died. Generated from whatever rule files landed above, so it always matches
# the shipped set (ts-server: 3 core; react-next: 3 core + 3 preset) with zero template-drift.
# Convention (holds for all 6 rules): file `foo-bar.ts` exports `fooBar`; rule key = `foo-bar`.
if [ -n "$DRY_RUN" ]; then
  echo "  [dry-run] would generate: eslint-rules-local/index.ts (barrel over copied rule files)"
else
  _barrel="$PROJECT_ROOT/eslint-rules-local/index.ts"
  {
    echo "// AUTO-GENERATED by install.sh — re-exports the sibling rule files as one ESLint"
    echo "// plugin. Regenerated each install to match the shipped rule set; do not hand-edit."
    for _rf in "$PROJECT_ROOT"/eslint-rules-local/*.ts; do
      _b=$(basename "$_rf" .ts); [ "$_b" = "index" ] && continue
      _camel=$(echo "$_b" | awk -F- '{o=$1; for(i=2;i<=NF;i++) o=o toupper(substr($i,1,1)) substr($i,2); print o}')
      echo "import { $_camel } from './$_b.ts';"
    done
    echo "const plugin = {"
    echo "  meta: { name: '@rules-as-tests/local-eslint-rules', version: '0.1.0' },"
    echo "  rules: {"
    for _rf in "$PROJECT_ROOT"/eslint-rules-local/*.ts; do
      _b=$(basename "$_rf" .ts); [ "$_b" = "index" ] && continue
      _camel=$(echo "$_b" | awk -F- '{o=$1; for(i=2;i<=NF;i++) o=o toupper(substr($i,1,1)) substr($i,2); print o}')
      echo "    '$_b': $_camel,"
    done
    echo "  },"
    echo "};"
    echo "export default plugin;"
    echo "export const rules = plugin.rules;"
  } > "$_barrel"
  echo "  ✓ generated eslint-rules-local/index.ts ($(grep -c '^import ' "$_barrel") rules)"
fi

# ─── 6. Stack-specific templates ────────────────────────
echo "▶ Stack-specific templates ($STACK) → project root"
mkdir_safe "$PROJECT_ROOT/.github/workflows"

if [ "$STACK" = "ts-server" ]; then
  copy_safe "$PKG_ROOT/templates/ts-server/eslint.config.mjs" "$PROJECT_ROOT/eslint.config.mjs"
  copy_safe "$PKG_ROOT/templates/ts-server/vitest.config.ts" "$PROJECT_ROOT/vitest.config.ts"
  # Ship the arch config directly (FQA S1-A W2: deferring to legacy setup.sh left arch:check
  # with no config on the ./setup path — the template exists, just copy it).
  copy_safe "$PKG_ROOT/templates/ts-server/dependency-cruiser.cjs" "$PROJECT_ROOT/.dependency-cruiser.cjs"
  copy_safe "$PKG_ROOT/templates/ts-server/stryker.config.json" "$PROJECT_ROOT/stryker.config.json"
  patch_stryker_package_manager
  copy_safe "$PKG_ROOT/templates/ts-server/github-actions-ci.yml" "$PROJECT_ROOT/.github/workflows/ci.yml"
  # R11 branch-protection self-assertion (the executable arm RULES.md#r11 names alongside ci-success).
  copy_safe "$PKG_ROOT/templates/ts-server/github-actions-workflow-integrity.yml" "$PROJECT_ROOT/.github/workflows/workflow-integrity.yml"
elif [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/eslint.config.react.mjs" "$PROJECT_ROOT/eslint.config.mjs"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/vitest.config.ts" "$PROJECT_ROOT/vitest.config.ts"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/playwright.config.ts" "$PROJECT_ROOT/playwright.config.ts"
  # Ship the arch config (FQA S1-A W2). The ts-server base (no-circular/no-orphans) is
  # stack-agnostic; a react-tailored layering config is a follow-up (residual R-1).
  copy_safe "$PKG_ROOT/templates/ts-server/dependency-cruiser.cjs" "$PROJECT_ROOT/.dependency-cruiser.cjs"
  copy_safe "$PKG_ROOT/templates/ts-server/stryker.config.json" "$PROJECT_ROOT/stryker.config.json"
  patch_stryker_package_manager
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/github-actions-ci-ui.yml" "$PROJECT_ROOT/.github/workflows/ci.yml"
  # R11 branch-protection self-assertion (stack-agnostic — asserts ci-success stays required).
  copy_safe "$PKG_ROOT/templates/ts-server/github-actions-workflow-integrity.yml" "$PROJECT_ROOT/.github/workflows/workflow-integrity.yml"
fi

# ─── 7. package.json scripts (FQA S1-A W4) ──────────────
# install.sh historically left scripts as a manual INSTALL.md §3 step, so consumers landed
# `scripts: {}` while AGENTS.md + the shipped ci.yml call `npm run lint/typecheck/arch:check/
# test:*` → every gate failed "Missing script". Inject the canonical block (non-destructive:
# only adds keys the consumer lacks). The referenced devDependencies (eslint, dependency-cruiser,
# stryker, npm-run-all2, vitest, prettier, husky) are NOT installed here — that is the consumer's
# `npm install` + residual R-2 (devDeps manifest). Scripts present ≠ runnable until deps land,
# but "Missing script" → "tool not installed" is the intended, INSTALL.md-documented path.
if [ -f "$PROJECT_ROOT/package.json" ]; then
  if [ -n "$DRY_RUN" ]; then
    echo "▶ package.json scripts → [dry-run] would merge canonical block (non-destructive)"
  elif command -v node >/dev/null 2>&1; then
    echo "▶ Merging canonical scripts → package.json (non-destructive)"
    AIF_PKG="$PROJECT_ROOT/package.json" node -e '
      const fs = require("fs");
      const p = process.env.AIF_PKG;
      const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
      pkg.scripts = pkg.scripts || {};
      const want = {
        "lint": "eslint . --max-warnings=0",
        "lint:fix": "eslint . --fix",
        "format": "prettier --write .",
        "format:check": "prettier --check .",
        "typecheck": "tsc --noEmit",
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage",
        "test:integration": "vitest run -- --include 'src/**/*.integration.{ts,tsx}'",
        "test:mutation": "stryker run",
        "test:mutation:incremental": "stryker run --incremental",
        "arch:check": "depcruise --config .dependency-cruiser.cjs src",
        "audit:docs": "./scripts/audit-ai-docs.sh",
        "validate": "npm-run-all2 --parallel typecheck lint format:check arch:check audit:docs test",
        "prepare": "husky"
      };
      let added = 0;
      for (const [k, v] of Object.entries(want)) if (!(k in pkg.scripts)) { pkg.scripts[k] = v; added++; }
      // cih-s1 F2: also merge the devDeps the SHIPPED HOOKS need so they run, not just exist.
      // .husky/pre-commit calls `npx lint-staged`; the canonical scripts call `husky` (prepare)
      // and sort-package-json. Without these the hooks are dead even after `npm install`. Same
      // non-destructive guard as scripts: only keys the consumer lacks; caret ranges (not in the
      // framework root package.json — no range to mirror, per orchestrator note) so consumers get
      // patches. devDependencies object created if absent.
      pkg.devDependencies = pkg.devDependencies || {};
      const wantDev = {
        "husky": "^9.1.7",
        "lint-staged": "^15.2.10",
        "sort-package-json": "^2.10.1"
      };
      let addedDev = 0;
      for (const [k, v] of Object.entries(wantDev)) if (!(k in pkg.devDependencies)) { pkg.devDependencies[k] = v; addedDev++; }
      fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
      process.stderr.write("  ✓ added " + added + " script(s); " + (Object.keys(want).length - added) + " already present (kept)\n");
      process.stderr.write("  ✓ added " + addedDev + " hook devDep(s); " + (Object.keys(wantDev).length - addedDev) + " already present (kept)\n");
    '
  else
    echo "  ⚠  node not found — skipped scripts merge; add them manually per INSTALL.md §3"
  fi
fi

# ─── 8. dev-dependency install — one-button completeness (#483, DN-B=A) ──────
# The scripts-merge above only DECLARES the toolchain; the Next-steps block historically handed
# back a manual `npm install`. So the wired hooks (core.hooksPath=.husky → .husky/pre-commit runs
# `npx lint-staged`) fired with their tools ABSENT → ENOENT on the consumer's first commit (#478
# root, #483). Close it: detect the consumer's PM (detect_pm SSOT) and actually RUN the dev-dep
# install so the declared tools land before that first commit. Mutating + opinionated → OPT-IN:
# interactive [y/N] default-No, or --full to skip the prompt (non-interactive without --full → No).
# Shells out to the consumer's own PM — adds NO dependency to the framework (per §3 scope fence /
# BFR). DEVDEPS is the single source for both the install command and the Next-steps fallback echo
# (so "what we install" and "what we tell you to install" can't drift — #two-prompts-drift).
CORE_DEVDEPS=(
  eslint@^9 typescript-eslint@^8.59 @eslint/js@^9 @typescript-eslint/utils
  prettier eslint-config-prettier @vitest/eslint-plugin
  vitest@^4.1.5 @vitest/coverage-v8@^4.1.5
  @stryker-mutator/core @stryker-mutator/vitest-runner @stryker-mutator/typescript-checker
  dependency-cruiser fast-check glob tsx
  husky lint-staged sort-package-json
  npm-run-all2
)
REACT_DEVDEPS=(
  @vitejs/plugin-react jsdom @testing-library/react
  @testing-library/jest-dom @next/eslint-plugin-next
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
  eslint-plugin-testing-library @playwright/test
)
DEVDEPS=( "${CORE_DEVDEPS[@]}" )
[ "$STACK" = "react-next" ] && DEVDEPS+=( "${REACT_DEVDEPS[@]}" )

DEPS_INSTALLED=""
_do_dep_install=""
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "▶ dev-deps → [dry-run] would offer to install ${#DEVDEPS[@]} dev-deps with $(detect_pm)"
elif [ ! -f "$PROJECT_ROOT/package.json" ]; then
  :   # no package.json to install into — nothing to do
elif [ -n "$FULL" ]; then
  _do_dep_install="yes"
elif [ -t 0 ]; then
  printf "▶ Install %s dev-dependencies now with %s? [y/N] " "${#DEVDEPS[@]}" "$(detect_pm)"
  read -r _ans || _ans=""
  case "$_ans" in [yY]|[yY][eE][sS]) _do_dep_install="yes" ;; esac
else
  :   # non-interactive (no tty) without --full → default No; the manual command prints in Next steps
fi

if [ "$_do_dep_install" = "yes" ]; then
  _pm=$(detect_pm)
  if ! command -v "$_pm" >/dev/null 2>&1; then
    echo "  ⚠  $_pm not found on PATH — skipped dev-dep install (install manually, see Next steps)."
  else
    echo "▶ Installing ${#DEVDEPS[@]} dev-dependencies with $_pm (this may take a minute) …"
    _ok=""
    case "$_pm" in
      pnpm)
        # pnpm refuses to add to a workspace root without -w; pass it only when a workspace exists.
        # Explicit branch (not an empty-array expansion) for bash 3.2 + `set -u` safety.
        if [ -f "$PROJECT_ROOT/pnpm-workspace.yaml" ]; then
          if ( cd "$PROJECT_ROOT" && pnpm add -D -w "${DEVDEPS[@]}" ); then _ok="yes"; fi
        else
          if ( cd "$PROJECT_ROOT" && pnpm add -D "${DEVDEPS[@]}" ); then _ok="yes"; fi
        fi ;;
      yarn)
        if ( cd "$PROJECT_ROOT" && yarn add -D "${DEVDEPS[@]}" ); then _ok="yes"; fi ;;
      *)
        if ( cd "$PROJECT_ROOT" && npm install --save-dev "${DEVDEPS[@]}" ); then _ok="yes"; fi ;;
    esac
    if [ -n "$_ok" ]; then
      DEPS_INSTALLED="1"
      echo "  ✓ dev-dependencies installed → node_modules/ (wired hooks now have their tools)"
    else
      echo "  ⚠  dev-dep install failed — run it manually (see Next steps)."
    fi
  fi
fi

# ─── cih-s3 V2: runtime-discipline arming WARN (consumer-side, deps-free) ───
# R7/R8 (no-direct-time-randomness / require-otel-span) ship DEFERRED behind AIF_STRICT_RUNTIME=1
# in the eslint config templates. If the consumer already depends on @opentelemetry/* yet has not
# armed the runtime rules, R8 silently never fires — surface that. Greps the package.json TEXT
# (deps may be uninstalled at install time → no module/require check). Non-fatal: WARN only,
# exit stays 0 (a fresh skeleton legitimately defers). --dry-run-aware.
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "  [dry-run] would check @opentelemetry/* vs AIF_STRICT_RUNTIME for the R7/R8 arming WARN"
elif [ -f "$PROJECT_ROOT/package.json" ] && \
     grep -q '@opentelemetry/' "$PROJECT_ROOT/package.json" && \
     [ "${AIF_STRICT_RUNTIME:-}" != "1" ]; then
  echo ""
  echo "⚠  Detected @opentelemetry/* but AIF_STRICT_RUNTIME is unset — R8 (require-otel-span) will not fire."
  echo "   Set AIF_STRICT_RUNTIME=1 to arm runtime-discipline rules (R7/R8)."
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
if [ "${DEPS_INSTALLED:-}" = "1" ]; then
  echo "  4. ✓ Dev-dependencies installed into node_modules/ — nothing to do."
else
  # step 4 fallback: the manual dep-install (run only when --full/[y/N] consent was not given).
  # Built from the same DEVDEPS array the installer uses → list cannot drift from what we install.
  case "$(detect_pm)" in
    pnpm) _add="pnpm add -D" ;;
    yarn) _add="yarn add -D" ;;
    *)    _add="npm install --save-dev" ;;
  esac
  echo "  4. Install dev-dependencies (or re-run: ./install.sh ${STACK:-ts-server} --full):"
  echo ""
  echo "     $_add \\"
  printf '       %s\n' "${DEVDEPS[*]}"
fi
echo "  5. Verify git hooks: 'git config core.hooksPath' should print .husky (install activated it; do NOT run 'npx husky init' — it would clobber the shipped .husky/pre-commit + pre-push)"
echo "  6. Run: ./scripts/audit-ai-docs.sh — should PASS"
echo "  7. Run: npm run validate"
echo ""
echo "For full guide: see INSTALL.md"
