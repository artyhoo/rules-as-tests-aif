#!/usr/bin/env bash
# setup.d/30-templates.sh — §3a (770-781) + §3b (782-788) + §3d (806-814) + §5b AGENTS.md line 891
# Source: install.sh §3 lines 770-814, §5b line 891
# Globals consumed: FORCE, DRY_RUN, SKIPPED, PKG_ROOT, PROJECT_ROOT, STACK
# shellcheck source=./lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

# Lib-only guard: sourced for tests, expose helpers without running layer actions.
if [ "${INSTALL_SH_LIB_ONLY:-}" = "1" ]; then
  return 0 2>/dev/null || true
fi

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

if [ "$STACK" = "react-next" ]; then
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/templates/ARCHITECTURE.react-next.md" "$PROJECT_ROOT/.ai-factory/ARCHITECTURE.react-next.md"
  copy_safe "$PKG_ROOT/packages/preset-next-15-canonical/RULES.react-next.md" "$PROJECT_ROOT/.ai-factory/RULES.react-next.md"
fi

# ── aif-handoff integration note ─────────────────────────
# Per Stage 2 v3 §4.6 — single informational note, no prompt needed;
# our Phase 3 skill-context files ARE the client-side aif-handoff integration.
echo "  ✓ aif-handoff integration: skill-context files installed at .ai-factory/skill-context/ (auto)"

# §5b AGENTS.md
copy_safe "$PKG_ROOT/packages/core/templates/shared/AGENTS.md.template" "$PROJECT_ROOT/AGENTS.md"
