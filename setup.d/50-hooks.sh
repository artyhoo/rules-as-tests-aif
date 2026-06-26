#!/usr/bin/env bash
# setup.d/50-hooks.sh — §5c .husky/ hooks cluster + core.hooksPath activation.
#
# Sources: lib.sh (already in dispatcher scope)
# S0 rows: §5c (install.sh:950-994)
# Depends on: 40-configs (tsconfig.json etc. already written)
# @cc-only-rationale: sourced by install.sh dispatcher, not standalone

# ─── §5c: .husky/ hooks ─────────────────────────────────
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
