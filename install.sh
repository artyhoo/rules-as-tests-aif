#!/usr/bin/env bash
# install.sh — Deploy rules-as-tests-aif into the current project.
#
# Usage:
#   ./install.sh ts-server                      # default safe install
#   ./install.sh react-next --force             # overwrite existing files
#   ./install.sh react-next --dry-run           # preview without writing
#   ./install.sh react-next --dry-run --force   # preview overwrite plan
#   ./install.sh ts-server --full               # also auto-install dev-deps (no prompts)
#   ./install.sh ts-server --wire-ci            # also auto-wire missing CI gates via yq (opt-in, detect-first)
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
# Use --wire-ci to also auto-wire any CI-orphan rule-enforcement gate (§6c) into your existing
# workflow via yq (used-if-present, never installed by us; default is the non-destructive WARN +
# paste-block — wiring edits your kept workflow in place, so it is opt-in). No effect in --dry-run.

set -euo pipefail

PKG_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # BASH_SOURCE (not $0): correct when install.sh is *sourced* (lib-only unit tests), identical to $0 when executed
PROJECT_ROOT="$(pwd)"

# ─── Source the shared helper library ────────────────────────────────────────
# All helpers (copy_safe, refresh_safe, mkdir_safe, chmod_safe, detect_pm,
# merge_prettierignore, ignore_shipped_configs, patch_stryker_package_manager,
# copy_skill_with_transform, refresh_skill_with_transform, transform_internal_refs,
# UPSTREAM_BLOB_URL, PRETTIERIGNORE_BEGIN/END, PRETTIERIGNORE_CFG_BEGIN/END)
# are defined in setup.d/lib.sh. Source it BEFORE flag parse so do_refresh()
# and all preflight code can call helpers.
# shellcheck source=setup.d/lib.sh
source "$PKG_ROOT/setup.d/lib.sh"

# Library-only mode: the helpers are now defined (sourced from lib.sh above). A unit test that
# does `INSTALL_SH_LIB_ONLY=1; source install.sh` wants the helper functions, NOT the installer
# body — return before flag parsing / the install run. Restores the pre-S1 monolith's lib-only
# contract (tests/install-sh/transform-internal-refs.test.sh). No effect on a normal
# `bash install.sh <stack>` run, where INSTALL_SH_LIB_ONLY is unset → byte-identical output.
if [ "${INSTALL_SH_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi

STACK=""
FORCE=""
DRY_RUN=""
FULL=""
WIRE_CI=""
REFRESH=""
for arg in "$@"; do
  case "$arg" in
    --dry-run)              DRY_RUN="--dry-run" ;;
    --force)                FORCE="--force" ;;
    --full)                 FULL="--full" ;;
    --wire-ci)              WIRE_CI="--wire-ci" ;;
    --refresh)              REFRESH="--refresh" ;;
    ts-server|react-next|react-spa|react-native)   STACK="$arg" ;;
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
# (REQUIRED_HEADER_DOCS Wave 2 + Wave 5.1 + memory-codification-auditor + orchestrator-worker-discipline — 18 shipped surfaces).
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
  "packages/preset-react-spa/RULES.md"
  "packages/preset-react-spa/RULES.react-spa.md"
  "packages/preset-react-spa/templates/ARCHITECTURE.react-spa.md"
  "packages/preset-react-native/RULES.md"
  "packages/preset-react-native/RULES.react-native.md"
  "packages/preset-react-native/templates/ARCHITECTURE.react-native.md"
  "packages/core/templates/shared/skill-context/aif-review/SKILL.md"
  "packages/core/templates/shared/skill-context/aif-rules-check/SKILL.md"
  "packages/core/templates/shared/skill-context/aif-orchestrator-discipline/SKILL.md"
  "agents/review-sidecar.md"
  "agents/living-docs-auditor.md"
  "agents/compliance-verifier.md"
  "agents/memory-codification-auditor.md"
  "agents/orchestrator-worker-discipline.md"
  "agents/aif-init.md"
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

# For --refresh: auto-detect the stack from the consumer's existing files so the
# interactive prompt is skipped (refresh is non-interactive by design — opt-in flag).
if [ -n "$REFRESH" ] && [ -z "$STACK" ]; then
  if [ -f "$PROJECT_ROOT/.ai-factory/RULES.react-next.md" ] || \
     [ -f "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-next.md" ]; then
    STACK="react-next"
  elif [ -f "$PROJECT_ROOT/.ai-factory/RULES.react-native.md" ] || \
       [ -f "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-native.md" ]; then
    STACK="react-native"
  elif [ -f "$PROJECT_ROOT/.ai-factory/RULES.react-spa.md" ] || \
       [ -f "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-spa.md" ]; then
    STACK="react-spa"
  else
    STACK="ts-server"
  fi
fi

# Pick stack interactively if not provided
if [ -z "$STACK" ]; then
  echo "What stack does this project use?"
  echo "  1) ts-server    — Node.js + Fastify/Hono/Express (server only)"
  echo "  2) react-next   — React 19 + Next.js 15 App Router"
  echo "  3) react-spa    — React 19 + Vite SPA (Feature-Sliced Design)"
  echo "  4) react-native — React Native / Expo (Expo or bare-RN baseline)"
  read -rp "Choose [1/2/3/4]: " choice
  case "$choice" in
    1) STACK="ts-server" ;;
    2) STACK="react-next" ;;
    3) STACK="react-spa" ;;
    4) STACK="react-native" ;;
    *) echo "❌ Invalid choice"; exit 1 ;;
  esac
fi

if [ "$STACK" != "ts-server" ] && [ "$STACK" != "react-next" ] && [ "$STACK" != "react-spa" ] && [ "$STACK" != "react-native" ]; then
  echo "❌ Unknown stack: $STACK (use ts-server, react-next, react-spa, or react-native)"
  exit 1
fi

if [ -n "$REFRESH" ]; then
  echo "▶ Refreshing rules-as-tests-aif framework artefacts in $PROJECT_ROOT (stack: $STACK)"
else
  echo "▶ Installing rules-as-tests-aif into $PROJECT_ROOT (stack: $STACK)"
fi

# do_refresh — re-copy all framework-owned artefacts (agents, skills, hooks, scripts,
# skill-context overrides) to the consumer. Called only when --refresh is passed.
# Framework-owned = artefacts the framework authors, header-verifies, and ships with no
# consumer-specific data. Consumer-authored files (AGENTS.md, RULES.md, ci.yml,
# eslint.config.mjs, tsconfig.json, .prettierrc, etc.) are NEVER in this set.
# Boundary derivation: SHIPPED_DOCS ∪ copy_safe'd framework artefacts; override signal =
# sibling .override.md (Layer 3 per INSTALL-FOR-AI.md §Three-layer).
do_refresh() {
  echo "▶ Mode: --refresh (framework-owned artefacts; consumer files preserved)"
  echo "  Skips any file with a sibling .override.md (Layer-3 consumer ownership)"

  # ── Sub-agents ──────────────────────────────────────────
  echo "▶ Sub-agents → .claude/agents/"
  for f in "$PKG_ROOT"/agents/*.md; do
    case "$(basename "$f")" in
      manual-rule-liveness-prober.md) continue ;;
      shipped-agent-liveness-prober.md) continue ;;
    esac
    refresh_safe "$f" "$PROJECT_ROOT/.claude/agents/$(basename "$f")"
  done

  # ── Skills (plain copy, no internal-ref transform) ──────
  echo "▶ Skills (rules-as-tests, tool-bootstrapping) → .claude/skills/"
  for _slug in rules-as-tests tool-bootstrapping; do
    _src="$PKG_ROOT/skills/$_slug"
    _dst="$PROJECT_ROOT/.claude/skills/$_slug"
    _override="${_dst}.override.md"
    [ -d "$_src" ] || continue
    if [ -e "$_override" ]; then
      if [ "$DRY_RUN" = "--dry-run" ]; then
        echo "  [dry-run] would skip: .claude/skills/$_slug (.override.md — consumer-owned)"
      else
        echo "  ⊝ .claude/skills/$_slug (.override.md — consumer-owned, keeping)"
      fi
      continue
    fi
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "  [dry-run] would refresh: $_src → $_dst"
      continue
    fi
    rm -rf "$_dst"
    cp -r "$_src" "$_dst"
    echo "  ✓ .claude/skills/$_slug/ (refreshed)"
  done

  # ── Orchestration skills (with internal-ref transform) ──
  echo "▶ Orchestration skills → .claude/skills/"
  for _skill in pipeline dispatcher aif-doctor template-audit; do
    refresh_skill_with_transform "$_skill"
  done
  _AIF_HELPERS="$PROJECT_ROOT/.claude/skills/aif-doctor/helpers"
  if [ "$DRY_RUN" != "--dry-run" ] && [ -d "$_AIF_HELPERS" ]; then
    chmod_safe +x "$_AIF_HELPERS/heal.sh" "$_AIF_HELPERS/refresh-aif-base.sh" 2>/dev/null || true
  fi

  # ── Claude hooks ────────────────────────────────────────
  echo "▶ Claude hooks → .claude/hooks/"
  _HOOK_SRC="$PKG_ROOT/packages/core/hooks/deps-hash-check.sh"
  _HOOK_DST="$PROJECT_ROOT/.claude/hooks/deps-hash-check.sh"
  if [ -f "$_HOOK_SRC" ]; then
    refresh_safe "$_HOOK_SRC" "$_HOOK_DST"
    if [ "$DRY_RUN" != "--dry-run" ] && [ -f "$_HOOK_DST" ]; then
      chmod_safe +x "$_HOOK_DST" 2>/dev/null || true
    fi
  fi

  # ── Scripts ─────────────────────────────────────────────
  echo "▶ Scripts → scripts/"
  for _pair in \
    "packages/core/audit-self/audit-ai-docs.sh:scripts/audit-ai-docs.sh" \
    "packages/core/probes/audit-r4.ts:scripts/audit-r4.ts" \
    "packages/core/audit-self/check-rule-globs.sh:scripts/check-rule-globs.sh" \
    "packages/core/audit-self/check-rule-enforced.sh:scripts/check-rule-enforced.sh" \
    "packages/core/audit-self/detect-r2-boundary.sh:scripts/detect-r2-boundary.sh" \
    "packages/core/audit-self/r2-na-marker.sh:scripts/r2-na-marker.sh" \
    "packages/core/audit-self/check-arch-boundaries.sh:scripts/check-arch-boundaries.sh" \
    "packages/core/audit-self/check-lintstaged-resolves.sh:scripts/check-lintstaged-resolves.sh"; do
    _s="${_pair%%:*}"; _d="${_pair##*:}"
    refresh_safe "$PKG_ROOT/$_s" "$PROJECT_ROOT/$_d"
    case "$_d" in
      *.sh) if [ "$DRY_RUN" != "--dry-run" ] && [ -f "$PROJECT_ROOT/$_d" ]; then
              chmod_safe +x "$PROJECT_ROOT/$_d" 2>/dev/null || true; fi ;;
    esac
  done
  if [ "$STACK" = "react-next" ]; then
    _rn_src="$PKG_ROOT/packages/preset-next-15-canonical/audit-self/audit-ai-docs.react-next.sh"
    _rn_dst="$PROJECT_ROOT/scripts/audit-ai-docs.react-next.sh"
    refresh_safe "$_rn_src" "$_rn_dst"
    if [ "$DRY_RUN" != "--dry-run" ] && [ -f "$_rn_dst" ]; then
      chmod_safe +x "$_rn_dst" 2>/dev/null || true
    fi
  fi
  if [ "$STACK" = "react-spa" ]; then
    _rs_src="$PKG_ROOT/packages/preset-react-spa/audit-self/audit-ai-docs.react-spa.sh"
    _rs_dst="$PROJECT_ROOT/scripts/audit-ai-docs.react-spa.sh"
    refresh_safe "$_rs_src" "$_rs_dst"
    if [ "$DRY_RUN" != "--dry-run" ] && [ -f "$_rs_dst" ]; then
      chmod_safe +x "$_rs_dst" 2>/dev/null || true
    fi
  fi
  if [ "$STACK" = "react-native" ]; then
    _rnat_src="$PKG_ROOT/packages/preset-react-native/audit-self/audit-ai-docs.react-native.sh"
    _rnat_dst="$PROJECT_ROOT/scripts/audit-ai-docs.react-native.sh"
    refresh_safe "$_rnat_src" "$_rnat_dst"
    if [ "$DRY_RUN" != "--dry-run" ] && [ -f "$_rnat_dst" ]; then
      chmod_safe +x "$_rnat_dst" 2>/dev/null || true
    fi
  fi

  # ── Core hooks (TS pre-push pipeline) ───────────────────
  echo "▶ Core hooks (TS) → packages/core/hooks/"
  for _ts in \
    pre-push.ts \
    utils/run-check.ts \
    utils/git.ts \
    checks/prior-art.ts \
    checks/s17.ts; do
    refresh_safe "$PKG_ROOT/packages/core/hooks/$_ts" "$PROJECT_ROOT/packages/core/hooks/$_ts"
  done
  _fb_src="$PKG_ROOT/packages/core/hooks/pre-push.fallback.sh"
  _fb_dst="$PROJECT_ROOT/packages/core/hooks/pre-push.fallback.sh"
  refresh_safe "$_fb_src" "$_fb_dst"
  if [ "$DRY_RUN" != "--dry-run" ] && [ -f "$_fb_dst" ]; then
    chmod_safe +x "$_fb_dst" 2>/dev/null || true
  fi
  # #635: also refresh the hooks-scoped {"type":"module"} marker (mirrors the full-install copy_safe
  # at install.sh:915). Without this, a consumer upgraded via --refresh gets the new multi-file
  # pre-push.ts WITHOUT type:module → Node ≥22 dies with ERR_REQUIRE_CYCLE_MODULE on the require(esm)
  # bridge. Same AIF-owned, hooks-scoped marker — cannot collide with a consumer's own package.
  refresh_safe "$PKG_ROOT/packages/core/templates/shared/hooks-package.json" \
               "$PROJECT_ROOT/packages/core/hooks/package.json"

  # ── Skill-context overrides (derived from SHIPPED_DOCS — cannot drift) ──
  echo "▶ Skill-context → .ai-factory/skill-context/"
  for _doc in "${SHIPPED_DOCS[@]}"; do
    case "$_doc" in
      packages/core/templates/shared/skill-context/*/SKILL.md)
        _sc="${_doc#packages/core/templates/shared/skill-context/}"; _sc="${_sc%/SKILL.md}"
        refresh_safe "$PKG_ROOT/$_doc" "$PROJECT_ROOT/.ai-factory/skill-context/$_sc/SKILL.md" ;;
    esac
  done

  echo ""
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "✅ Dry-run complete (--refresh preview). Nothing was written."
    echo "   Re-run without --dry-run to apply, or add --force to also overwrite consumer files."
  else
    echo "✅ Framework artefacts refreshed."
    echo "   Consumer-owned files (AGENTS.md, RULES.md, ci.yml, eslint.config.mjs, etc.) were not touched."
    echo "   Files with a sibling .override.md were also preserved."
  fi
}

# ─── --refresh early-exit: run refresh then stop (skip the full install flow) ──
if [ -n "$REFRESH" ]; then
  do_refresh
  exit 0
fi

# ─── Source numbered layers in lexicographic order ───────────────────────────
# Each layer file is responsible for one section of the install pipeline.
# Layers are sourced (not executed as subprocesses) so mutations to SKIPPED,
# DEVDEPS, _r2_verdict, DEPS_INSTALLED, etc. persist across layers.
# Layer registry: setup.d/LAYERS.md
for _layer in "$PKG_ROOT/setup.d/"[0-9]*.sh; do
  # shellcheck source=/dev/null
  source "$_layer"
done

# ─── 6b-bis-L2. GH #547 Layer 2: AST-wire R2 into consumer per-package configs ─
# Runs AFTER §8 dep-install (70-deps layer) so ts-morph is resolvable when --full is set.
# Option A (migration-ast Stage 4): gated on --full; ensure-then-use; degrade
# when engine absent. rc=0 on every branch (lesson GH #531/#544).
# Layer 1 (§6b-bis in 60-ci.sh) patches OUR eslint.config.mjs; this Layer 2 patches
# CONSUMER per-package eslint.config.mjs files that re-export a base lacking R2.
if [ "${_r2_verdict:-}" = "boundary-present" ] && [ "$DRY_RUN" != "--dry-run" ] \
   && [ -f "$PROJECT_ROOT/eslint.config.mjs" ]; then
  _l2_degrade() {
    echo "  · R2 not auto-wired: AST editor unavailable (Node or ts-morph not present)."
    echo "    Add to <pkg>/eslint.config.mjs:"
    echo "      export default [...base, { rules: { 'rules-as-tests/no-unsafe-zod-parse': 'error' } }];"
    echo "    (or run ./install.sh ts-server --full to install dev-deps and auto-wire)"
  }
  if ! command -v node >/dev/null 2>&1; then
    _l2_degrade
  elif [ ! -f "$PROJECT_ROOT/node_modules/ts-morph/package.json" ]; then
    _l2_degrade
  else
    _wirer="$PKG_ROOT/packages/core/install/wire-eslint-r2.ts"
    if [ ! -f "$_wirer" ]; then
      echo "  · R2 Layer-2 wirer not found at $_wirer — skipped"
    else
      # Find per-package eslint.config.mjs files (not the root one, not node_modules)
      _l2_configs=()
      while IFS= read -r -d '' _cfg; do
        _l2_configs+=("$_cfg")
      done < <(find "$PROJECT_ROOT" \
        -name 'eslint.config.mjs' \
        ! -path "$PROJECT_ROOT/eslint.config.mjs" \
        ! -path '*/node_modules/*' \
        -print0 2>/dev/null)
      if [ "${#_l2_configs[@]}" -eq 0 ]; then
        : # no per-package configs — nothing to wire
      else
        echo "▶ R2 Layer-2: wiring ${#_l2_configs[@]} per-package eslint config(s)"
        for _cfg in "${_l2_configs[@]}"; do
          # rc=0 forced by || true — never abort install on wirer failure
          ( cd "$PROJECT_ROOT" && npx --no-install tsx "$_wirer" \
              --path "$_cfg" ${FULL:+--yes} 2>&1 ) || true
        done
      fi
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

# GH #531 (reopen): ignore the framework configs we shipped FRESH (consumer-owned ones stay checked).
# Runs after ALL copy_safe calls so SKIPPED is complete, and after the static .prettierignore merge.
ignore_shipped_configs

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
