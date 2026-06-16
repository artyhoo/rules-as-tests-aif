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
WIRE_CI=""
for arg in "$@"; do
  case "$arg" in
    --dry-run)              DRY_RUN="--dry-run" ;;
    --force)                FORCE="--force" ;;
    --full)                 FULL="--full" ;;
    --wire-ci)              WIRE_CI="--wire-ci" ;;
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

# GH #531 (reopen): non-destructive .prettierignore merge. copy_safe skips-if-exists, so a
# BROWNFIELD consumer with a pre-existing .prettierignore never received the AIF exclusions →
# generated .ai-factory/RULES.md (+ RULES.react-next.md, .claude/settings.json, the eslint-rules-
# local barrel) stayed un-ignored → `prettier --check .` re-broke on the non-format-stable table.
# Behaviour:
#   - no consumer file        → copy the shipped file byte-identical (greenfield path unchanged).
#   - consumer file exists     → append a marker-delimited block of AIF entries the consumer does
#                                NOT already have (dedup), wrapped in begin/end markers.
#   - block already present     → no-op (idempotent on re-install; begin-marker count stays 1).
#   - --force                   → overwrite wholesale (same as copy_safe under --force).
# Plain bash — NO yq, NO new dependency, NOT the yq-based _aif_yq_wire workflow-merge routine.
PRETTIERIGNORE_BEGIN='# >>> rules-as-tests-aif (managed) >>>'
PRETTIERIGNORE_END='# <<< rules-as-tests-aif (managed) <<<'
merge_prettierignore() {
  local src="$1"
  local dst="$2"

  # --force: behave like copy_safe (overwrite wholesale).
  if [ "$FORCE" = "--force" ]; then
    copy_safe "$src" "$dst"
    return 0
  fi

  # No consumer file → greenfield: copy byte-identical (defer entirely to copy_safe).
  if [ ! -e "$dst" ]; then
    copy_safe "$src" "$dst"
    return 0
  fi

  # Consumer file EXISTS → non-destructive merge.
  # Idempotent: if the managed block is already present, do nothing.
  if grep -qxF "$PRETTIERIGNORE_BEGIN" "$dst"; then
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "  [dry-run] would skip merge: $dst (AIF block already present)"
    else
      echo "  ⊝ $dst (AIF .prettierignore block already present — skipping merge)"
    fi
    return 0
  fi

  # Collect shipped entries not already present verbatim in the consumer file. Ignore blank lines
  # and comments from the shipped source (only real ignore patterns get merged).
  local missing=()
  local line
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      '' | '#'*) continue ;;
    esac
    grep -qxF "$line" "$dst" || missing+=("$line")
  done < "$src"

  # Nothing to add (consumer already has every AIF pattern) → no-op.
  if [ "${#missing[@]}" -eq 0 ]; then
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "  [dry-run] would skip merge: $dst (already has every AIF pattern)"
    else
      echo "  ⊝ $dst (already has every AIF .prettierignore pattern — nothing to merge)"
    fi
    return 0
  fi

  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would merge ${#missing[@]} AIF pattern(s) into: $dst"
    return 0
  fi

  # Append the marker-delimited block. Ensure a trailing newline before the block.
  [ -n "$(tail -c1 "$dst")" ] && printf '\n' >> "$dst"
  {
    printf '%s\n' "$PRETTIERIGNORE_BEGIN"
    printf '%s\n' "${missing[@]}"
    printf '%s\n' "$PRETTIERIGNORE_END"
  } >> "$dst"
  echo "  ✓ $dst (merged ${#missing[@]} AIF .prettierignore pattern(s))"
}

# GH #531 (reopen, config-mismatch): conditionally ignore the framework CONFIG files install
# actually SHIPPED. Unlike the SOURCE patterns in the static .prettierignore template (framework-
# namespace files a consumer never owns: eslint-rules-local/, packages/core/hooks/, scripts/audit-
# r4.ts), these configs ship at a consumer-ownable path and MIGHT be consumer-authored — copy_safe
# keeps the consumer's version when one already exists (and records it in SKIPPED). So we ignore a
# config ONLY when it is NOT in SKIPPED (we shipped it fresh, formatted to OUR Prettier config —
# printWidth 80 / singleQuote / no plugins — which a consumer's own .prettierrc would reject). A
# consumer-authored config (copy_safe-skipped) stays format-checked: never silently hidden.
PRETTIERIGNORE_CFG_BEGIN='# >>> rules-as-tests-aif shipped-configs (managed) >>>'
PRETTIERIGNORE_CFG_END='# <<< rules-as-tests-aif shipped-configs (managed) <<<'

_prettierignore_in_skipped() {
  local needle="$1" s
  # Guard the empty-array expansion: under `set -u` on bash 3.2 (macOS), "${SKIPPED[@]}" with an
  # empty SKIPPED throws "unbound variable" and aborts install. ${#SKIPPED[@]} (length) is safe.
  [ "${#SKIPPED[@]}" -gt 0 ] || return 1
  for s in "${SKIPPED[@]}"; do [ "$s" = "$needle" ] && return 0; done
  return 1
}

ignore_shipped_configs() {
  local ign="$PROJECT_ROOT/.prettierignore"
  [ -e "$ign" ] || return 0   # no consumer .prettierignore at all → nothing to extend
  # Framework configs that ship at a consumer-ownable path. Each is ignored ONLY if shipped fresh.
  local candidates=(
    "eslint.config.mjs" "vitest.config.ts" "tsconfig.json" "playwright.config.ts"
    ".dependency-cruiser.cjs" "stryker.config.json" ".lintstagedrc.json"
    ".github/workflows/ci.yml" ".github/workflows/workflow-integrity.yml"
  )
  local fresh=() rel
  for rel in "${candidates[@]}"; do
    [ -e "$PROJECT_ROOT/$rel" ] || continue                       # not shipped for this stack/preset
    _prettierignore_in_skipped "$PROJECT_ROOT/$rel" && continue   # consumer owned it → keep checking
    grep -qxF "$rel" "$ign" && continue                           # already ignored (idempotent re-install)
    fresh+=("$rel")
  done
  [ "${#fresh[@]}" -eq 0 ] && return 0
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would ignore ${#fresh[@]} freshly-shipped framework config(s) in $ign"
    return 0
  fi
  [ -n "$(tail -c1 "$ign")" ] && printf '\n' >> "$ign"
  {
    printf '%s\n' "$PRETTIERIGNORE_CFG_BEGIN"
    printf '%s\n' "${fresh[@]}"
    printf '%s\n' "$PRETTIERIGNORE_CFG_END"
  } >> "$ign"
  echo "  ✓ $ign (ignored ${#fresh[@]} freshly-shipped framework config(s); consumer-authored configs kept format-checked)"
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
  # GH #531: rewrite ONLY the packageManager VALUE in place (string-substitution), NOT a full
  # JSON.stringify re-serialize. The template ships prettier-clean (short arrays collapsed to one
  # line); JSON.stringify(,,2) would re-expand those arrays and break `prettier --check` on the
  # consumer. A targeted value swap preserves the template's prettier formatting byte-for-byte.
  AIF_STRYKER_CFG="$_cfg" AIF_STRYKER_PM="$_pm" node -e '
    const fs = require("fs");
    const p = process.env.AIF_STRYKER_CFG;
    const pm = process.env.AIF_STRYKER_PM;
    const src = fs.readFileSync(p, "utf8");
    const out = src.replace(/("packageManager"\s*:\s*")[^"]*(")/, `$1${pm}$2`);
    if (out !== src) fs.writeFileSync(p, out);
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

# aif-doctor ships portable base-refresh ("heal") helpers under helpers/ — a consumer runs
# aif-handoff too, so their container base can go stale and false-`done` off-scope diffs
# (aif-doctor SKILL §3.4). The recursive `cp -r` in copy_skill_with_transform already lands
# helpers/*.sh; here we just keep them executable and surface the OPT-IN auto-heal seam. Keep
# it opt-in + degrading — making a companion mandatory is a goal change (build-first-reuse-default.md §1.1).
_AIF_HELPERS="$PROJECT_ROOT/.claude/skills/aif-doctor/helpers"
if [ "$DRY_RUN" != "--dry-run" ] && [ -d "$_AIF_HELPERS" ]; then
  chmod_safe +x "$_AIF_HELPERS/heal.sh" "$_AIF_HELPERS/refresh-aif-base.sh" 2>/dev/null || true
  echo "  ✓ aif-doctor heal helpers → .claude/skills/aif-doctor/helpers/ (executable)"
  echo "    ↳ opt-in: export RUNTIME_BRIDGE_PREFLIGHT='bash .claude/skills/aif-doctor/helpers/heal.sh' to auto-heal the aif base before each dispatch"
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
# Consumer backlog home for /pipeline (kickoffs + plan + scratch). Agnostic namespace so the
# backlog is portable across harnesses (.claude/ is Claude-Code-specific). Empty until the
# consumer writes their first kickoff; /pipeline treats empty as "nothing queued", not an error.
mkdir_safe "$PROJECT_ROOT/.ai-factory/orchestrator-prompts"
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
# GH #535 "+E": deep R2-binding gate. check:globs only proves a rule's globs MATCH files; on a
# monorepo with per-package eslint configs that re-export a base NOT wiring R2, the rule stays
# silently inert while validate/lint pass. This gate resolves the actually-applied config per
# boundary file via `eslint --print-config` and FAILS when R2 is absent — catching that false-green
# without false-failing a correct re-export-of-root. Skips cleanly when eslint isn't installed yet.
copy_safe "$PKG_ROOT/packages/core/audit-self/check-rule-enforced.sh" "$PROJECT_ROOT/scripts/check-rule-enforced.sh"
chmod_safe +x "$PROJECT_ROOT/scripts/check-rule-enforced.sh" 2>/dev/null || true
# GH #547 Point 2: R2 boundary probe (C1) + the shared N/A-marker reader (C4). detect-r2-boundary.sh
# classifies the repo (boundary-present | no-boundary-confident | ambiguous) by READING it; the
# installer (§6b-bis below) and BOTH inertness gates consume it. r2-na-marker.sh is sourced by
# check-rule-globs.sh + check-rule-enforced.sh so they never diverge on honoring a recorded R2 N/A.
copy_safe "$PKG_ROOT/packages/core/audit-self/detect-r2-boundary.sh" "$PROJECT_ROOT/scripts/detect-r2-boundary.sh"
chmod_safe +x "$PROJECT_ROOT/scripts/detect-r2-boundary.sh" 2>/dev/null || true
copy_safe "$PKG_ROOT/packages/core/audit-self/r2-na-marker.sh" "$PROJECT_ROOT/scripts/r2-na-marker.sh"
chmod_safe +x "$PROJECT_ROOT/scripts/r2-na-marker.sh" 2>/dev/null || true
# GH #534: R3 (arch) inertness alarm — the dependency-cruiser analog of check:globs. The shipped
# arch config carries layout-agnostic monorepo boundary rules (packages↛apps / apps↔apps), but
# dependency-cruiser has no built-in "rule matched nothing" report, so on a monorepo whose arch
# config lacks those rules, arch:check passes green while the boundary is unguarded — silently.
# This gate FAILS on an apps/+packages/ monorepo when no packages↛apps rule is present.
copy_safe "$PKG_ROOT/packages/core/audit-self/check-arch-boundaries.sh" "$PROJECT_ROOT/scripts/check-arch-boundaries.sh"
chmod_safe +x "$PROJECT_ROOT/scripts/check-arch-boundaries.sh" 2>/dev/null || true
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
# GH #531 (reopen): merge (not skip-if-exists) so a BROWNFIELD consumer with its own
# .prettierignore still gets the AIF exclusions — otherwise the generated RULES.md re-breaks
# `prettier --check .`. Greenfield path stays byte-identical (delegates to copy_safe).
merge_prettierignore "$PKG_ROOT/packages/core/templates/shared/.prettierignore" "$PROJECT_ROOT/.prettierignore"
# GH #531: ship the Prettier config so the consumer's `format:check` (prettier --check .) uses the
# same style the shipped artefacts are formatted in (singleQuote — the framework's existing TS/JS
# style). Without it, prettier defaults (double-quote) would flag every shipped .ts/.mjs/.cjs.
# copy_safe (skip-if-exists) never clobbers a consumer's own prettier config.
copy_safe "$PKG_ROOT/.prettierrc.json" "$PROJECT_ROOT/.prettierrc.json"
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
# GH #532: the shipped pre-push.ts is authored as an ES module, but its module-type is decided by
# the NEAREST package.json. In THIS repo packages/core/package.json declares "type":"module" (so the
# hook loads as ESM and runs); in a consumer the nearest package.json is usually the project root with
# no "type" → CJS default → tsx's `require(esm)` bridge hits Node ≥22 cycle detection and the hook dies
# with ERR_REQUIRE_CYCLE_MODULE *at module load*, before any §7/§1.7 check runs (every git push aborts
# with a stack trace). Ship a hooks-scoped {"type":"module"} marker so the shipped .ts loads as ESM —
# exactly as it does in this framework repo. Scoped to packages/core/hooks/ (AIF-owned) so it can't
# collide with a consumer's own packages/core package or be picked up as a workspace member.
copy_safe "$PKG_ROOT/packages/core/templates/shared/hooks-package.json" "$PROJECT_ROOT/packages/core/hooks/package.json"
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

# ─── 6b. #509: .nvmrc ↔ pre-existing CI Node-version drift WARN ──────────
# Install ships .nvmrc but copy_safe does NOT overwrite an existing CI workflow. A consumer
# whose own CI hardcodes a different `node-version: NN` then gets local `nvm use` (.nvmrc) ≠ CI.
# It is the consumer's own CI — nothing is broken — so this is a non-destructive WARN only, never
# a failure. (A workflow using `node-version-file: '.nvmrc'` reads .nvmrc directly → can't drift.)
if [ "$DRY_RUN" != "--dry-run" ] && [ -f "$PROJECT_ROOT/.nvmrc" ] && [ -d "$PROJECT_ROOT/.github/workflows" ]; then
  # `|| true`: parity with the _ci_ver line below — under set -euo pipefail a SIGPIPE from
  # head closing a multi-line read (rc=141) would otherwise abort the whole install.
  _nvmrc_major=$(tr -dc '0-9.\n' < "$PROJECT_ROOT/.nvmrc" 2>/dev/null | head -1 | cut -d. -f1 || true)
  if [ -n "$_nvmrc_major" ]; then
    for _wf in "$PROJECT_ROOT/.github/workflows/"*.yml "$PROJECT_ROOT/.github/workflows/"*.yaml; do
      [ -f "$_wf" ] || continue
      # hardcoded `node-version: NN` only — `node-version-file:` has "-file" before its colon so it
      # never matches; a `${{ matrix.* }}` value yields no digit → skipped (can't compare).
      # `|| true`: under the script's `set -euo pipefail`, a no-match grep returns 1 and pipefail
      # would abort the whole install — the common case (shipped CI uses node-version-file).
      _ci_ver=$(grep -oE "node-version:[[:space:]]*['\"]?[0-9]+" "$_wf" 2>/dev/null | grep -oE "[0-9]+" | head -1 || true)
      [ -n "$_ci_ver" ] || continue
      if [ "$_ci_ver" != "$_nvmrc_major" ]; then
        echo "⚠ .nvmrc pins Node ${_nvmrc_major}.x but ${_wf#"$PROJECT_ROOT"/} hardcodes node-version: ${_ci_ver} — local 'nvm use' will differ from this CI. Align them, or switch the workflow to: node-version-file: '.nvmrc'."
      fi
    done
  fi
fi

# ─── 6b-bis. GH #547 Point 2: auto-wire R2 by reading the repo ───────────────
# Classify the consumer's layout (C1) and configure R2 enforcement so the shipped check:globs gate
# is green-because-understood, never red-because-unconfigured — WITHOUT mutating consumer-authored
# per-package eslint configs (deferred Layer 2 / --wire-rules). We only ever patch the ROOT
# eslint.config.mjs (OUR shipped file, whose own comment invites editing RULE_GLOBS), additively +
# idempotently. rc=0 on every branch (a crash here must never abort install — lesson GH #531/#544).
if [ "$DRY_RUN" = "--dry-run" ]; then
  echo "▶ R2 auto-wire → [dry-run] would classify the repo and patch RULE_GLOBS / record R2 N/A as warranted"
elif [ -f "$PROJECT_ROOT/eslint.config.mjs" ]; then
  echo "▶ R2 auto-wire (reading the repo)"
  _r2_out="$( cd "$PROJECT_ROOT" && bash "$PKG_ROOT/packages/core/audit-self/detect-r2-boundary.sh" 2>/dev/null )"
  _r2_verdict="$(printf '%s\n' "$_r2_out" | head -1)"
  case "$_r2_verdict" in
    boundary-present)
      _patched=0
      while IFS= read -r _line; do
        case "$_line" in glob:*) ;; *) continue ;; esac
        _g="${_line#glob:}"
        grep -qF "$_g" "$PROJECT_ROOT/eslint.config.mjs" && continue   # already covered → idempotent
        awk -v ins="    '$_g'," '
          done2!=1 && /^[[:space:]]*boundary:[[:space:]]*\[/ { print; print ins; done2=1; next }
          { print }
        ' "$PROJECT_ROOT/eslint.config.mjs" > "$PROJECT_ROOT/eslint.config.mjs.tmp" \
          && mv "$PROJECT_ROOT/eslint.config.mjs.tmp" "$PROJECT_ROOT/eslint.config.mjs"
        _patched=$((_patched + 1))
      done <<EOF
$_r2_out
EOF
      if [ "$_patched" -gt 0 ]; then
        echo "  ✓ HTTP boundary detected → added $_patched glob(s) to RULE_GLOBS.boundary in eslint.config.mjs so R2 covers it"
      else
        echo "  ✓ HTTP boundary detected → already covered by the default RULE_GLOBS.boundary (no change)"
      fi ;;
    no-boundary-confident)
      _dec="$PROJECT_ROOT/.ai-factory/tool-decisions.md"
      if [ -f "$_dec" ]; then
        if grep -qF '<!-- aif:r2-na:begin -->' "$_dec"; then   # replace existing block (idempotent re-install)
          awk '/<!-- aif:r2-na:begin -->/{skip=1} skip&&/<!-- aif:r2-na:end -->/{skip=0;next} !skip' "$_dec" > "$_dec.tmp" && mv "$_dec.tmp" "$_dec"
        fi
        {
          echo ""
          echo "<!-- aif:r2-na:begin -->"
          echo "### R2 (no-unsafe-zod-parse) — N/A for this layout (auto-recorded by install.sh)"
          echo "**Verdict:** N/A — validation is declarative (allowlisted framework); no manual \`.parse()\` HTTP boundary detected."
          echo "**Precondition (re-checked by check:globs / check:enforced via scripts/detect-r2-boundary.sh):**"
          echo "- no file matches RULE_GLOBS.boundary tokens, AND"
          echo "- no \`.safeParse(\` and no non-stdlib \`.parse(\` in non-test source."
          echo "**If this precondition breaks** (you add a hand-rolled parse boundary) the gate goes RED again — wire R2 (widen RULE_GLOBS.boundary) or update this decision."
          echo "<!-- aif:r2-na:end -->"
        } >> "$_dec"
        echo "  ✓ declarative validation, no manual-parse boundary → recorded a re-checkable R2 N/A in .ai-factory/tool-decisions.md"
      else
        echo "  · declarative validation detected, but .ai-factory/ absent → skipped R2 N/A record (gate behaviour unchanged)"
      fi ;;
    *)
      # NB: say "scripts/check-rule-globs.sh" (hyphen), NOT the colon-form "check:globs" — the colon
      # form is reserved for the CI-orphan WARN's missing-gate list (r2-glob-reach asserts per-gate accuracy).
      echo "  · R2 boundary layout ambiguous → leaving scripts/check-rule-globs.sh as the alarm. If R2 applies, widen RULE_GLOBS.boundary in eslint.config.mjs to cover your layout." ;;
  esac
fi

# ─── 6c. #507 (reopen) + #521: CI-orphan WARN — completeness across ALL enforcement gates ───
# A brownfield consumer's pre-existing ci.yml is KEPT (copy_safe skips it), so the shipped CI's
# enforcement gates run in NO CI job — only on a local `npm run validate`, which a dev must
# remember. #507 warned about the glob gate only; #521 broadens it: for EACH gate whose artifact
# is installed, if no kept workflow references it, name it (with what it enforces) and print a
# ready-to-paste step. Non-destructive (consumer owns their CI) — exit stays 0. Greenfield (install
# wrote ci.yml wiring all gates) → nothing missing → no warn. "check:globs" etc. colon forms are
# WARN-exclusive; the grep patterns also match the hyphenated script names used inside workflows.
if [ "$DRY_RUN" != "--dry-run" ] && [ -d "$PROJECT_ROOT/.github/workflows" ]; then
  _aif_missing=()
  _aif_steps=()
  _aif_cmds=()
  _aif_gate_check() { # $1 "gate — what it enforces"  $2 wired-grep  $3 installed-artifact  $4 paste-step
    [ -e "$PROJECT_ROOT/$3" ] || return 0          # gate not installed for this stack → nothing to warn
    local _wf
    for _wf in "$PROJECT_ROOT/.github/workflows/"*.yml "$PROJECT_ROOT/.github/workflows/"*.yaml; do
      [ -f "$_wf" ] || continue
      # grep inside `if` is set-e-safe (non-zero no-match is consumed by the if-test, not seen by set -e)
      if grep -qE "$2" "$_wf" 2>/dev/null; then return 0; fi   # referenced by some workflow → wired
    done
    _aif_missing+=("$1"); _aif_steps+=("$4"); _aif_cmds+=("${4#- run: }")
  }
  _aif_detect_gates() {   # (re)build the missing-set from scratch — idempotent, callable again post-wire
    _aif_missing=(); _aif_steps=(); _aif_cmds=()
    _aif_gate_check "check:globs — R2/R7/R8 ESLint-rule liveness"        'check-rule-globs\.sh|check:globs'               "scripts/check-rule-globs.sh"          "- run: bash scripts/check-rule-globs.sh"
    _aif_gate_check "check:enforced — R2 actually applied (per-pkg cfg)"  'check-rule-enforced\.sh|check:enforced'         "scripts/check-rule-enforced.sh"       "- run: bash scripts/check-rule-enforced.sh"
    _aif_gate_check "arch:check — R3 architecture boundaries"            'arch:check|depcruise'                           ".dependency-cruiser.cjs"              "- run: npm run arch:check"
    _aif_gate_check "check:arch-boundaries — R3 monorepo-boundary liveness" 'check-arch-boundaries\.sh|check:arch-boundaries' "scripts/check-arch-boundaries.sh"     "- run: bash scripts/check-arch-boundaries.sh"
    _aif_gate_check "audit:docs — AI-documentation drift"               'audit:docs|audit-ai-docs\.sh'                   "scripts/audit-ai-docs.sh"             "- run: bash scripts/audit-ai-docs.sh"
    _aif_gate_check "check:lintstaged — lint-staged binaries resolve"   'check:lintstaged|check-lintstaged-resolves\.sh' "scripts/check-lintstaged-resolves.sh" "- run: bash scripts/check-lintstaged-resolves.sh"
  }
  _aif_detect_gates

  # ─── #521 Stage P: opt-in auto-wire (REFERENCE mikefarah/yq, detect-first) ───
  # The WARN below is the non-destructive default (writes nothing). This OPT-IN path mutates the
  # consumer's kept workflow in place, so it fires ONLY on explicit consent: --wire-ci, or an
  # interactive [y/N] (default No), mirroring the §8 dep-install prompt. yq is USED-IF-PRESENT,
  # never installed/pinned by us (companion-install-principle.md §1; BFR §1.1 shipped-axis —
  # integrate, never hard-depend). yq's comment preservation is best-effort, which is exactly why
  # it is DISQUALIFIED as the *silent* default (research-patch 2026-06-14-s3-workflow-merge §4/§6,
  # SSOT #117) — confining it behind a visible flag makes that risk the consumer's informed choice.
  # yq absent → OFFER its official installer (detect-first, unpinned, [y/N]/TTY-gated per
  # companion-install-principle.md §1/§3); declined / unavailable / install-failed → fall through to
  # the broadened WARN + paste-block unchanged.
  #
  # _aif_yq_wire — the wire-into-job logic, extracted so it is called identically whether yq was
  # present from the start or just installed via the offer below (no duplication). Requires yq on PATH.
  _aif_yq_wire() {
    # Locate the first workflow + job that owns a `steps:` sequence (the lint/test job) to append into.
    _wire_wf=""; _wire_job=""
    for _wf in "$PROJECT_ROOT/.github/workflows/"*.yml "$PROJECT_ROOT/.github/workflows/"*.yaml; do
      [ -f "$_wf" ] || continue
      _job=$(yq -r '.jobs | to_entries | map(select(.value.steps != null)) | (.[0].key // "")' "$_wf" 2>/dev/null || echo "")
      if [ -n "$_job" ] && [ "$_job" != "null" ]; then _wire_wf="$_wf"; _wire_job="$_job"; break; fi
    done
    if [ -n "$_wire_job" ]; then
      _wired=0
      # `${arr[@]+"${arr[@]}"}` = bash-3.2-safe empty-array expansion under set -u (macOS ships 3.2).
      # _cmd is one of the 4 hard-coded gate commands (no quotes/special chars) — keep it that way:
      # it is interpolated raw into the yq double-quoted YAML string below.
      for _cmd in ${_aif_cmds[@]+"${_aif_cmds[@]}"}; do
        # idempotent append-if-absent: add then de-dup. Key on `.run // .uses // .name // .` — NOT
        # `.run` alone. Every `uses:` action step (checkout, pnpm/action-setup, setup-node …) has no
        # `.run` key, so `unique_by(.run)` groups them ALL under the same `null` key and keeps only the
        # first — silently deleting every other `uses:` step and breaking the workflow it was asked to
        # wire (GH #528). The fallback chain gives each `uses:`/`name:` step a distinct dedup key, while
        # repeated gate `run`s still collapse — so re-running install remains a no-op.
        if yq -i ".jobs.${_wire_job}.steps += [{\"run\": \"${_cmd}\"}] | .jobs.${_wire_job}.steps |= unique_by(.run // .uses // .name // .)" "$_wire_wf" 2>/dev/null; then
          _wired=$((_wired+1))
        fi
      done
      echo "  ✓ auto-wired ${_wired} gate(s) into ${_wire_wf#"$PROJECT_ROOT"/} job '${_wire_job}' via yq (idempotent — re-running install adds nothing)."
      _aif_detect_gates   # re-check: wired gates are now referenced → drop them from the WARN below
    else
      echo "  ⚠ --wire-ci: found no job with a 'steps:' list to wire into — see the paste-block below."
    fi
  }
  if [ "${#_aif_missing[@]}" -gt 0 ]; then
    _aif_wire="no"
    if [ -n "$WIRE_CI" ]; then _aif_wire="yes"
    elif [ -t 0 ]; then
      printf "▶ Auto-wire %s missing CI gate(s) into your workflow via yq (edits the file in place)? [y/N] " "${#_aif_missing[@]}"
      read -r _ans || _ans=""
      case "$_ans" in [yY]|[yY][eE][sS]) _aif_wire="yes" ;; esac
    fi
    if [ "$_aif_wire" = "yes" ]; then
      if command -v yq >/dev/null 2>&1; then
        _aif_yq_wire
      else
        # Option B: yq absent but consumer consented → OFFER its official installer (detect-first,
        # unpinned, official top-level command only — companion-install-principle.md §1/§3). Never
        # install a binary silently: gate on an interactive TTY (or a manual command otherwise).
        _aif_yq_inst=""
        if command -v brew >/dev/null 2>&1; then _aif_yq_inst="brew install yq"
        elif command -v snap >/dev/null 2>&1; then _aif_yq_inst="sudo snap install yq"
        fi
        if [ -n "$_aif_yq_inst" ]; then
          if [ -t 0 ]; then
            printf "▶ 'yq' is not installed. Install it now via '%s'? [y/N] " "$_aif_yq_inst"
            read -r _yqans || _yqans=""
            case "$_yqans" in
              [yY]|[yY][eE][sS])
                echo "▶ Installing yq via: $_aif_yq_inst"
                $_aif_yq_inst || true
                if command -v yq >/dev/null 2>&1; then
                  _aif_yq_wire
                else
                  echo "  ⚠ yq install did not succeed — see the paste-block below."
                fi ;;
            esac
          else
            # --wire-ci with no TTY: do NOT silently install a binary on a non-interactive run.
            echo "  ⚠ --wire-ci: 'yq' not installed; non-interactive — run '$_aif_yq_inst' then re-run, or see the paste-block below."
          fi
        else
          echo "  ⚠ 'yq' is not installed and no supported auto-installer (brew/snap) was found — install it manually (https://github.com/mikefarah/yq#install), or see the paste-block below."
        fi
      fi
    fi
  fi

  if [ "${#_aif_missing[@]}" -gt 0 ]; then
    echo ""
    echo "⚠ CI-orphan: some rule-enforcement gates run in 'npm run validate' but are NOT in any kept workflow under .github/workflows/."
    echo "   A pre-existing CI workflow was kept (install never overwrites it), so these gates fire only on a local"
    echo "   'npm run validate' — CI can stay green while a rule is violated. Gates missing from your CI:"
    for _m in "${_aif_missing[@]}"; do echo "     • $_m"; done
    echo "   Add the missing step(s) to your lint/test job's \`steps:\` (only these):"
    for _s in "${_aif_steps[@]}"; do echo "       $_s"; done
    # check:globs is the ONLY shield for R2/R7/R8 on shadowed packages — a present `lint` step does
    # not cover it (per-package eslint configs win under nearest-config resolution). Surface that.
    for _m in "${_aif_missing[@]}"; do
      case "$_m" in
        check:globs*)
          echo "   Note: a 'npm run lint' step does NOT enforce R2/R7/R8 on packages with their own eslint config —"
          echo "   nearest-config resolution shadows the root AIF rules, so they go silently inert there; check:globs"
          echo "   is the only gate that catches it (e.g. \`eslint --print-config <shadowed-file> | grep -c rules-as-tests\` = 0)."
          break ;;
      esac
    done
    echo "   (or re-run install with --wire-ci to auto-wire them via yq — edits your workflow in place, opt-in;"
    echo "    or with --force to adopt the shipped ci.yml that wires them — but --force overwrites ALL kept files,"
    echo "    e.g. vitest.config.ts / .prettierignore, not just the workflow)."
  fi
  unset -f _aif_gate_check _aif_detect_gates _aif_yq_wire
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
    # #508: arch:check target. A pnpm monorepo has no root src/ (only apps/*/src, packages/*/src),
    # so a hardcoded `depcruise … src` hard-fails (exit 1, "Can't open 'src'") and breaks the
    # shipped CI's architecture job. Resolve to source roots that EXIST so arch:check cruises
    # something on flat, layered, AND monorepo shapes instead of crashing on a missing dir. The
    # layer rules in .dependency-cruiser.cjs match nested package src via (?:^|/)src/<layer>.
    # The target must NEVER be a non-existent dir (that is the crash). Resolution order:
    #   1. workspace + a known package root present → that root (apps/packages/services/libs/modules)
    #   2. else a root src/ present → src
    #   3. else → "." (cwd always exists; never "Can't open"). Exotic-named workspace roots fall to
    #      (2)/(3); a one-line arch:check edit lets the consumer point at their exact roots.
    AIF_ARCH_TARGET=""
    if [ -f "$PROJECT_ROOT/pnpm-workspace.yaml" ] || grep -q '"workspaces"' "$PROJECT_ROOT/package.json" 2>/dev/null; then
      for _d in apps packages services libs modules; do
        [ -d "$PROJECT_ROOT/$_d" ] && AIF_ARCH_TARGET="$AIF_ARCH_TARGET $_d"
      done
      AIF_ARCH_TARGET="${AIF_ARCH_TARGET# }"
    fi
    if [ -z "$AIF_ARCH_TARGET" ]; then
      if [ -d "$PROJECT_ROOT/src" ]; then AIF_ARCH_TARGET="src"; else AIF_ARCH_TARGET="."; fi
    fi
    AIF_PKG="$PROJECT_ROOT/package.json" AIF_ARCH_TARGET="$AIF_ARCH_TARGET" node -e '
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
        "arch:check": "depcruise --config .dependency-cruiser.cjs " + (process.env.AIF_ARCH_TARGET || "src"),
        "audit:docs": "./scripts/audit-ai-docs.sh",
        "check:globs": "bash scripts/check-rule-globs.sh",
        "check:enforced": "bash scripts/check-rule-enforced.sh",
        "check:arch-boundaries": "bash scripts/check-arch-boundaries.sh",
        "check:lintstaged": "bash scripts/check-lintstaged-resolves.sh",
        "validate": "npm-run-all2 --parallel typecheck lint format:check arch:check audit:docs check:globs check:enforced check:arch-boundaries check:lintstaged test",
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
  eslint@^9 typescript-eslint@^8.59 @eslint/js@^9 @typescript-eslint/utils globals
  prettier@3.8.3 eslint-config-prettier @vitest/eslint-plugin
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
          # GH #533: `pnpm add -D -w` adds the dev-deps to the workspace ROOT, but on a COLD clone
          # (zero node_modules) it can leave sibling workspace packages unlinked — no node_modules,
          # missing `workspace:` symlinks — so typecheck/lint/test falsely fail while Next-steps
          # claims "nothing to do". Follow with a full `pnpm install` to materialise the whole
          # workspace link graph; idempotent + cheap when the tree is already warm. The `&&` keeps
          # honesty: if linking fails, _ok stays empty → the "install failed, run manually" path.
          if ( cd "$PROJECT_ROOT" && pnpm add -D -w "${DEVDEPS[@]}" && pnpm install ); then _ok="yes"; fi
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
