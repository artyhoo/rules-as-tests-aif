#!/usr/bin/env bash
# setup.d/lib.sh — Shared helper library for install.sh modular layers.
#
# Extracted verbatim from install.sh (S1 mif modular-install-fullpack).
# Contains all reusable helpers that the numbered layer files source.
#
# Usage (from a layer file):
#   source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
#
# Usage (from tests — lib-only, no pipeline):
#   INSTALL_SH_LIB_ONLY=1 source "setup.d/lib.sh"
#
# Globals consumed (defined in dispatcher scope, NOT here):
#   PKG_ROOT        — absolute path to the package/framework root
#   PROJECT_ROOT    — absolute path to the consumer project (install target)
#   FORCE           — "--force" or ""
#   DRY_RUN         — "--dry-run" or ""
#   SKIPPED         — array of skipped destination paths (bash array)

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

# refresh_safe <src> <dst>
# Inverted copy_safe: OVERWRITES unless the consumer has signalled Layer-3 ownership
# via a sibling <base>.override.md (INSTALL-FOR-AI.md §Three-layer + §override).
# Naming: for foo.md the override is foo.override.md; for foo.sh it is foo.sh.override.md
# (the %.md strip is a no-op on non-.md files, so the pattern is uniform — ${dst%.md}.override.md).
# T-Upgrade-A: default-to-SKIP on any ownership signal — a wrong overwrite is irreversible.
refresh_safe() {
  local src="$1"
  local dst="$2"
  local override="${dst%.md}.override.md"
  [ -e "$src" ] || return 0  # source gone — leave consumer copy alone
  if [ -e "$override" ]; then
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "  [dry-run] would skip: $dst (.override.md present — consumer-owned Layer 3)"
    else
      echo "  ⊝ $dst (.override.md — consumer-owned, keeping)"
    fi
    return 0
  fi
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would refresh: $src → $dst"
    return 0
  fi
  mkdir -p "$(dirname "$dst")"
  cp -r "$src" "$dst"
  echo "  ✓ $dst (refreshed)"
}

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

# refresh_skill_with_transform <slug>
# Like copy_skill_with_transform but with refresh_safe semantics for directories.
# The override signal for a skill directory is <dst_dir>.override.md (e.g.
# .claude/skills/pipeline.override.md signals consumer-owned pipeline skill).
refresh_skill_with_transform() {
  local slug="$1"
  local src="$PKG_ROOT/.claude/skills/$slug"
  local dst="$PROJECT_ROOT/.claude/skills/$slug"
  local override="${dst}.override.md"
  [ -d "$src" ] || return 0
  if [ -e "$override" ]; then
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "  [dry-run] would skip: .claude/skills/$slug (.override.md — consumer-owned)"
    else
      echo "  ⊝ .claude/skills/$slug (.override.md — consumer-owned, keeping)"
    fi
    return 0
  fi
  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "  [dry-run] would refresh: $src → $dst (+ transform internal refs)"
    return 0
  fi
  rm -rf "$dst"
  cp -r "$src" "$dst"
  while IFS= read -r -d '' mdfile; do
    transform_internal_refs "$mdfile"
  done < <(find "$dst" -name '*.md' -print0)
  echo "  ✓ .claude/skills/$slug/ (refreshed, cross-refs rewritten to ${UPSTREAM_BLOB_URL})"
}

# Lib-only guard: when sourced for tests, expose helpers without running the pipeline.
# CRITICAL (O1): this guard MUST be at the END, after all function definitions.
# Pre-S1, the guard in install.sh was at line 64 (BEFORE copy_safe/mkdir_safe/etc),
# making those helpers unreachable in lib-only mode. Fixed here per engine.sh model (guard at end).
if [ "${INSTALL_SH_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi
