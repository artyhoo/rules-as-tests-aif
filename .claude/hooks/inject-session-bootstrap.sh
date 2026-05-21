#!/usr/bin/env bash
# Wave 7 sub-wave 7.2.a — UserPromptSubmit hook: inject session-bootstrap digest.
# stdout is injected into Claude Code's prompt context by the harness automatically.
# Full bootstrap: .claude/session-bootstrap.md (Step 0 read-first file).

cat <<'DIGEST'
[session-bootstrap digest — auto-injected at prompt submit]
Goal: AI agents can't silently bypass undocumented conventions. Every rule is an executable artifact that fails at the earliest reachable channel — edit-time → pre-commit → pre-push → CI → production audit. CI = last-resort gate. (README.md#why-this-exists)
Invariants: (1) build-vs-reuse SSOT consult before capability commit + build-first-reuse-default discipline (.claude/rules/build-first-reuse-default.md); (2) recursive self-application green (make self-audit); (3) search-coverage 6-item checklist on negative-existence claims; (4) multi-channel enforcement — every rule fails at earliest reachable channel (CI = last resort).
Step-0 reading order: README.md → .claude/session-bootstrap.md → CLAUDE.md → task-specific docs.
Recommendation discipline (H1): before issuing a verdict/recommendation (ADOPT/BUILD/REJECT/DEFER, «we should X», «use Y», «pick A over B») — (1) cite SSOT/prior-art by ID, (2) give file:line or command-output evidence, (3) state what would falsify it («wrong if …»), (4) for «nothing exists» claims run the 6-item search check. An unbacked verdict is provisional, not load-bearing. This is a reminder, not a gate. (.claude/rules/phase-research-coverage.md §1.7)
Full bootstrap + reviewer drift-prevention flowchart: .claude/session-bootstrap.md
[/session-bootstrap digest]
DIGEST
