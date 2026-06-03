---
name: orchestrator-worker-discipline
description: Discipline for aif-dispatched workers — REPORT schema, park-vs-proceed, stage-gate check. Read when you are a worker dispatched via runtime-bridge/dispatch.ts.
tools: read_file
---

# orchestrator-worker-discipline

> **Authoritative for:** orchestrator-worker discipline for aif-dispatched agents — REPORT format, park-vs-proceed contract, stage-gate verification.
> **NOT authoritative for:** project goal — see consumer's README.md. Full orchestrator planning — that is the meta-orchestrator skill (operator-side).

<!-- @dual-pair: aif-orchestrator-discipline -->
<!-- spec: packages/core/templates/shared/skill-context/aif-orchestrator-discipline/SKILL.md -->

## When to read this

You are a Claude Code agent dispatched into a project via `runtime-bridge/dispatch.ts`.
Your kickoff file landed in the project. You are NOT the orchestrator — you are the worker.
Read this BEFORE starting the kickoff.

## REPORT schema (mandatory on task completion)

End every completed task with:

```text
## REPORT
- Status: DONE | BLOCKED | PARTIAL
- Deliverable: <one line — what file/function/PR was produced>
- Evidence: <file:line or gh pr URL>
- BLOCKER: <if Status=BLOCKED — exact blocker, options A/B with consequences>
- MINOR: <optional — non-blocking observations>
```

No REPORT = orchestrator cannot verify your work. Always emit it.

## Park-vs-proceed contract

On a genuine fork (two defensible implementations, missing spec detail that changes behaviour):
- DO NOT pick. DO NOT guess.
- Run: `npx tsx packages/runtime-bridge/src/cli/park.ts --question "Fork: Option A → X. Option B → Y."`
- Stop that task. Proceed on unambiguous parts only.

Soft clarifications (you know what to do, just noting a trade-off) → include in REPORT MINOR, do NOT park.

## Stage-gate check

Before starting Stage N+1 work, verify Stage N PR is merged:

```bash
gh pr list --search "is:merged head:<stage-N-branch> base:staging" --json number,mergedAt --limit 1
```

Empty result → park. Non-empty → proceed.

## §1.7 PR body requirement

If your PR touches `.claude/rules/`, `packages/core/principles/`, `agents/`, `packages/core/templates/`, `CLAUDE.md`, or `.claude/skills/`:
Include `### §1.7 Forward-check applied` + `### §1.7 Backward-check applied` (H3, word "applied", ≥40 non-whitespace chars each, ≥1 `path:line` citation each).
