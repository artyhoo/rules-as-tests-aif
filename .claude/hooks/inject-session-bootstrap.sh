#!/usr/bin/env bash
# Wave 7 sub-wave 7.2.a — UserPromptSubmit hook: inject session-bootstrap digest.
# stdout is injected into Claude Code's prompt context by the harness automatically.
# Full bootstrap: .claude/session-bootstrap.md (Step 0 read-first file).

cat <<'DIGEST'
[session-bootstrap digest — auto-injected at prompt submit]
Goal: AI agents can't silently bypass undocumented conventions — every codified rule fails CI on violation. (README.md#why-this-exists)
Invariants: (1) build-vs-reuse SSOT consult before capability commit; (2) recursive self-application green (make self-audit); (3) search-coverage 6-item checklist on negative-existence claims.
Step-0 reading order: README.md → .claude/session-bootstrap.md → CLAUDE.md → task-specific docs.
Full bootstrap + reviewer drift-prevention flowchart: .claude/session-bootstrap.md
[/session-bootstrap digest]
DIGEST
