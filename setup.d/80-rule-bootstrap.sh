#!/usr/bin/env bash
# setup.d/80-rule-bootstrap.sh — rule-bootstrapping SPIKE install-time step (skeleton).
#
# Runs the deterministic rule-bootstrapping pipeline on the consumer:
#   stub-research → generate.ts factory (rule + paired-negative test) → install() → rules-lock.json
# Payload: packages/core/install/rule-bootstrap-cli.ts (the shared entry). This step is the
# Option-1 gate placement — a standalone setup.d step, mirroring 05-mcp.sh's FULL gate (the
# placement fork the spike parked per kickoff §6; resolved to Option 1 at harvest time).
#
# Gated on FULL ("--full" carrier, install.sh:57+64) so the non-full / snapshot path no-ops
# → byte-identical guarantee preserved. Deterministic: no network, no LLM (principle 17,
# $0-in-CI — the CI self-install path never sets FULL). Degrades on absence (no node / missing
# CLI) and never aborts install (rc=0).
#
# SPIKE SCOPE: research is STUBBED here (fixed react-next finding) — this proves the SKELETON
# only. The live MCP-research adapter is the NEXT slice (see prior-art-evaluations.md #183).
#
# @cc-only-rationale: sourced by install.sh dispatcher, not standalone; install-time
#   orchestration in consumer context after --full dep-install.

# Gate: rule-bootstrapping only runs on the --full / yes pass.
if [ -z "${FULL:-}" ]; then
  return 0 2>/dev/null || true
fi

_rb_cli="$PKG_ROOT/packages/core/install/rule-bootstrap-cli.ts"

if [ ! -f "$_rb_cli" ]; then
  return 0 2>/dev/null || true   # payload absent — degrade silently
fi

if ! command -v node >/dev/null 2>&1; then
  printf '  [80-rule-bootstrap] node not found — skipping (degrade-on-absent)\n'
  return 0 2>/dev/null || true
fi

if [ -n "${DRY_RUN:-}" ]; then
  printf '  [dry-run] would: run rule-bootstrap pipeline (stub-research → generate → buildLock) on %s\n' "$PROJECT_ROOT"
  return 0 2>/dev/null || true
fi

printf '  [80-rule-bootstrap] stub-research → generate → buildLock (--full, react-next)\n'
# Run tsx from PKG_ROOT (the framework — tsx is present there) while targeting the consumer
# via --consumer-root, so this works even when the consumer has no tsx of its own.
( cd "$PKG_ROOT" && npx --no-install tsx "$_rb_cli" --consumer-root "$PROJECT_ROOT" 2>&1 ) || true  # rc=0: never abort install
