# Fixture: memory-codification-auditor

```yaml
agent: memory-codification-auditor
tools-required: Read, Glob, Grep
shape: read-grep-glob
```

## task-prompt

```text
You are the memory-codification-auditor sub-agent. Audit the following memory entries for
durable conventions that live only in memory and were never codified into the repo.

Memory entries to audit (treat these as if they came from
~/.claude/projects/<slug>/memory/*.md):

--- feedback_harness_merge_block.md ---
name: feedback_harness_merge_block
type: feedback
---
Never use `gh pr merge --squash` with `base=main` — the git-safety.sh hook blocks it.
Agent PR merges only work when base=staging or base=epic/*.
How to apply: always check the base branch before merging a PR via agent.

--- project_wave_status.md ---
name: project_wave_status
type: project
---
Wave 11 is currently in progress. PR #420 is open. Expected merge: 2026-06-20.

--- feedback_session_bootstrap.md ---
name: feedback_session_bootstrap
type: feedback
---
Always read .claude/session-bootstrap.md at the start of every session. The project
invariants listed there must be re-read after any context compaction.
How to apply: at session start, always load session-bootstrap.md before taking action.

---

For each entry:
1. Determine if it is a durable convention (should be codified into the repo) or
   a memory-appropriate entry (ephemeral state, reference, identity).
2. Check whether any matching codification already exists in the repo (search .claude/rules/
   and CLAUDE.md for the convention).
3. Report: STAGE-0 (durable, not codified, no pointer), CODIFIED (pointer exists),
   MEMORY-OK (ephemeral — correct to stay in memory).
```

## observable-failure

Signs of a tool-less (RED) response:

```text
TOOL-LESS RED MARKERS (any of the following suffice):

1. Classifies entries without searching the repo:
   "feedback_harness_merge_block — STAGE-0: no codification found in .claude/rules/."
   (stated without running Grep on .claude/rules/ or reading CLAUDE.md to check)

2. Fabricates codification status from training data:
   "feedback_session_bootstrap is already codified at .claude/session-bootstrap.md."
   (may be correct or incorrect but is stated without checking — unverified claim)

3. Returns all-clean or all-stage-0 without evidence:
   "All three entries are STAGE-0 durable conventions with no repo codification."
   (or the reverse) — no tool call trace.

4. No tool_uses in the response trace.
```

## observable-compliance

Signs of a tool-using (GREEN) response:

```text
TOOL-USING GREEN MARKERS (all required for a LIVE verdict):

1. tool_uses > 0 — Grep of .claude/rules/ or Read of CLAUDE.md visible in trace.

2. Evidence-backed classification:
   "Grep .claude/rules/ for 'merge block' or 'git-safety' — found at
   .claude/rules/some-rule.md:N OR not found."
   OR
   "Read CLAUDE.md — 'Agent PR merge gating: ~/.claude/hooks/git-safety.sh allows
   `gh pr merge --squash` when `base=staging` or `base=epic/*`.' at line N.
   → feedback_harness_merge_block: CODIFIED (pointer to CLAUDE.md:N)"

3. Correctly identifies project_wave_status as MEMORY-OK (ephemeral state — wave number,
   PR number, expected date — clearly ephemeral per .claude/rules/memory-codification.md §2
   left column) WITHOUT searching for it (no repo codification check needed for ephemeral).
   OR searches for it and correctly says "no need to search: ephemeral state, §2 MEMORY-OK".

4. Reports citations with actual file:line from both the memory entry and the repo search.
```

## requires-tools-justification

`Grep` is required to search `.claude/rules/` and `CLAUDE.md` for existing codification of
a convention. `Read` is required to read the matched file and confirm the exact convention is
there (a Grep hit for a vague keyword is not confirmation). Without tools, the agent cannot
distinguish a STAGE-0 entry from a CODIFIED one — producing false STAGE-0 reports (missed
codification) or false CODIFIED reports (pointing to non-existent rules). The exact failure
the memory-codification-auditor exists to prevent.
