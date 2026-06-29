# egress-host-push-default — DONE
- Final PR: #760
- Closed: 2026-06-27
- Summary: Host-push is the default egress channel (runs the real `.husky/pre-push` gate); Git-Data-API land demoted to break-glass. S1 = new rule `.claude/rules/egress-no-api-bypass.md` (Class B, registered in principle 09 + AGENTS.md); S2 = `/harvest` SKILL.md §1 step 4 reorder. S3 dogfood PROVEN — PR #760 was landed via host `git push`, so `.husky/pre-push` ran for real and caught 3 pre-merge gaps (principle 21 AGENTS.md gap, missing `§1.7:` commit trailer, missing file:line) that an API-land would have skipped; 241 principle tests green, 29/29 CI checks pass. Built inline (Mode A) after the aif autonomous dispatch hit an unrelated planner EEXIST crash-loop (flagged for aif-doctor §3.5).
