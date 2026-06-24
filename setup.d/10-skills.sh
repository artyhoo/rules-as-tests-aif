#!/usr/bin/env bash
# setup.d/10-skills.sh — §1 Skills (install.sh:657-713)
# Source: install.sh §1 lines 657-713
# Globals consumed: FORCE, DRY_RUN, SKIPPED, PKG_ROOT, PROJECT_ROOT
# shellcheck source=./lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

# Lib-only guard: sourced for tests, expose helpers without running layer actions.
if [ "${INSTALL_SH_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi

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
