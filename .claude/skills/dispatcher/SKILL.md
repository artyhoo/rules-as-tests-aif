---
name: dispatcher
description: Use when you need to EXECUTE a chosen umbrella's stages through the aif-control loop — dispatch kickoff to aif, monitor status, resolve parked Q&A (technical forks autonomously, strategic forks to operator), harvest done tasks (push + PR + auto-merge), run Phase-1 cold-review, check stage gate, advance to next stage. Does NOT plan (priority/launch-table = /pipeline). Invoked explicitly via /dispatcher slash command only (disable-model-invocation:true). Triggers: dispatcher, execute umbrella, run stages, aif loop, harvest PR, stage gate advance.
arguments: [umbrella]
argument-hint: "[umbrella-name]"
disable-model-invocation: true
model: opus
allowed-tools:
  - Bash(git *)
  - Bash(gh *)
  - Bash(tsx *)
  - Bash(npx *)
  - Bash(ls *)
  - Bash(cat *)
  - Read
  - Agent
---

<!-- @dual-pair: dispatcher-skill -->
<!-- Note: CC-native and portable channels are co-resident in this single SKILL.md; the dual-implementation §5 two-file drift-check finds no counterpart file by design — drift is prevented by co-location, not grep. -->

> **Class:** C — prose-only wiring skill; mechanical enforcement = CC slash-command primitive (exists or does not). Promotion criterion: ≥2 harvest-forgotten incidents within 6 months → consider a PostToolUse hook checking done-task dedup against harvested PRs.
> **Authoritative for:** /dispatcher slash-command behaviour — §0 invocation through §6 advance; dispatch→monitor→Q&A→harvest→Phase-1→stage-gate→advance loop; Q&A park-type taxonomy; dual-channel degradation for CC-absent harnesses.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Planning, priority scoring, launch-table generation — see [.claude/skills/pipeline/SKILL.md](../pipeline/SKILL.md). Global `~/.claude/skills/orchestrator/` (agent-uncommittable, owner=maintainer).

# /dispatcher — aif-control execution loop

**Origin:** BUILD verdict 2026-06-03. R-phase patch: [docs/meta-factory/dispatcher-skill-rphase.md](../../../docs/meta-factory/dispatcher-skill-rphase.md). Complements `/pipeline` (plan) with the execution half. SSOT #111.

**Substrate:** CC slash-command + 4 existing CLI primitives (zero new npm deps, zero new code). All dispatch is session-bound (`no-paid-llm-in-ci.md §1`).

---

## §0 Invocation

**Slash command:** `/dispatcher [<umbrella-name>]`

`disable-model-invocation: true` — fires ONLY on explicit `/dispatcher` invocation.

**What this skill does:** EXECUTES a chosen umbrella's stages through the aif-control loop. It does NOT plan or score priority — that is `/pipeline`'s job. If no umbrella is named, list pending stages from `.claude/orchestrator-prompts/` and prompt the operator to choose one.

---

## §1 Primitives table

All 4 CLI primitives are pre-built. `/dispatcher` wires them — it does NOT build new ones.

| Primitive | Path | Role in loop |
|---|---|---|
| `dispatch.ts` | `packages/runtime-bridge/src/cli/dispatch.ts` | Send kickoff to aif via REST; exit 0 always (injection hook, never a gate); ManualBackend fallback not deduped so retry is always possible |
| `harvest.ts` | `packages/runtime-bridge/src/cli/harvest.ts` | Push aif branch from container, open PR, optionally enable auto-merge; ZERO LLM; throws on wrong-branch container (operator-ATTN case — see §4) |
| `questions.ts` | `packages/runtime-bridge/src/cli/questions.ts` | Read-only GET /tasks, filter to parked tasks, display park reasons; appends brainstorm nudge to output |
| `answer.ts` | `packages/runtime-bridge/src/cli/answer.ts` | Resolve a parked task via REST state-machine events; invalid `--decision` is an error (never silently defaults) |
| `superpowers:brainstorming` | CC companion skill | Autonomous technical-fork resolution on CC-present path |
| `superpowers:requesting-code-review` | CC companion skill | Phase-1 cold-review between stages |

---

## §2 The execution loop

Steps run in order for each stage kickoff. After §2.7, loop back to §2.1 with the next stage kickoff, or emit "umbrella complete".

**§2.0 — Pre-dispatch dedup guard (run before §2.1)**
```bash
slug="<umbrella>"
git branch -a --list "*${slug}*"                              # Signal 1: branch match
gh pr list --state all --search "${slug}" --json number,state # Signal 2: broad PR search (not in:title)
test -f ".claude/orchestrator-prompts/${slug}/done.md"        # Signal 3: done.md (Layer-C3)
```
Verdict — **≥2 of 3 signals required** to mark ALREADY-DONE (T-DUX-A: lone slug-substring PR hit is insufficient):
- **ALREADY-DONE**: skip dispatch → write `done.md` per CLAUDE.md umbrella-closure schema + CANON sync
- **IN-FLIGHT**: open PR or live branch, no done.md → surface + let operator decide
- **FRESH** (0–1 signals): proceed to §2.1

**§2.1 — Dispatch**
```bash
tsx packages/runtime-bridge/src/cli/dispatch.ts \
  .claude/orchestrator-prompts/<umbrella>/kickoff.md
```
`AifHandoffBackend.dispatch()` → `POST /tasks (paused:true)` → `PUT /tasks/:id (unpause)` → aif coordinator picks up: `backlog → planning` (per-task worktree created) → `implementing`. The `exit 0` contract holds at every call-site — a ManualBackend fallback (written to `/tmp/runtime-bridge-<taskId>.md`) means aif was unreachable; retry once the blocker clears.

**§2.2 — Monitor (single-poll-per-turn)**
Classify one poll using `monitor-classify.sh` (proven by `packages/core/skills/dispatcher/monitor.test.ts`):
```bash
TASK_JSON=$(curl -s "http://${AIF_HOST:-localhost}:${AIF_PORT:-3009}/tasks/<taskId>")
classification=$(TASK_JSON="$TASK_JSON" bash .claude/skills/dispatcher/helpers/monitor-classify.sh)
```
Branch on output prefix: `RUNNING:*` → re-invoke `/dispatcher <umbrella>` next turn. `DONE:*` → §2.4. `PARKED:*` → §2.3. `ERROR:*` → ATTN operator.
**DO NOT** use foreground `sleep <N>` — harness-blocked. **DO NOT** chain commands with `;` compound sequences — harness-blocked.
Timeout: track invocation count; after operator-configured ceiling → surface **ATTN: task stalled**.

**§2.3 — Q&A (three types — see §3)**

**§2.4 — Harvest (after done/verified)**
```bash
tsx packages/runtime-bridge/src/cli/harvest.ts <taskId> --base staging
```
`harvest.ts` → `GET /tasks/:id` → `docker exec aif-handoff-agent-1 git push origin <branch>` → `gh pr create --base staging --head <branch>` → `gh pr merge <prUrl> --auto --squash`. Emits `{ prUrl, branch, autoMerge, committed }`.

If `/dispatcher` has prepared a §1.7-compliant PR body, pass it via `--body-file <path>`. Otherwise a minimal pointer body is used (harvest warns about missing §1.7 sections in that case).

**§2.5 — Phase-1 cold-review**
```text
Invoke superpowers:requesting-code-review on the harvested PR diff.
```
Reviewer emits `GO` / `REVISE` / `STOP`. `REVISE` → operator fixes, re-dispatch. `STOP` → escalate. `GO` → proceed to §2.6.

**§2.6 — Stage gate**
```bash
gh pr list --search "is:merged head:<branch> base:staging" --json number,mergedAt
```
Empty → HALT (PR not yet merged; wait for CI). Non-empty → CLEAR, proceed to §2.7.

**§2.7 — Advance**
Dispatch next stage kickoff → back to §2.1. If no remaining stages → emit "umbrella complete".

---

## §3 Q&A — three park types

When §2.2 detects a parked signal, identify the park type from the taxonomy table, then apply the resolution path.

### Park-type taxonomy

| Park mechanism | Detected via | Resolved via | `answer.ts --decision` |
|---|---|---|---|
| `blockedReason` non-empty | `questions.ts` `isParked()` | see fork-type below | `request_changes` or `retry` |
| `status=blocked_external` | `questions.ts` `isParked()` | `answer.ts` | `retry` |
| `manualReviewRequired:true` | `questions.ts` `isParked()` | `answer.ts` | `approve` or `request_changes` |
| A-park: `paused:true + OPEN_QUESTION_ANCHOR` in plan | `questions.ts` conjunction check | `answer.ts --decision resume` (PUT, bypasses events API) | `resume` |

Sources: `questions.ts:85-93` (detection), `answer.ts:207-212` (A-park resume).

### Type 1 — Technical fork (HOW to implement; no taste involved)

**Detected:** parked reason describes an implementation choice where either path is technically valid and does not affect project scope or direction (e.g. "which API variant", "which data structure", "retry or fail-fast on 429").

**Resolution (CC-present path):**
1. Read the parked question via `tsx packages/runtime-bridge/src/cli/questions.ts`
2. Invoke `superpowers:brainstorming` autonomously with the question as input → generates a reasoned recommendation with evidence
3. Apply via `answer.ts --task <id> --answer "<recommendation>" --decision request_changes` (B-park) OR `--decision resume` (A-park)
4. Report what was decided and why — operator sees the outcome, not a question

**Discrimination discipline (baked into this skill prose because `ask-question-reminder.sh` is operator-internal, not in the `install.sh` payload — per `ask-question-reminder.sh:2`):** a fork is TECHNICAL when the parked reason is about mechanics, implementation detail, or tradeoff within a single subsystem. A fork is STRATEGIC when it involves scope, architecture decisions, project direction, or "whether" to do something at all. When in doubt, surface to operator (Type 2 path).

### Type 2 — Strategic fork (WHAT/WHETHER; maintainer decides)

**Detected:** parked reason involves scope, architecture, project-wide policy, or project direction — the operator must decide.

**Resolution:**
1. `tsx packages/runtime-bridge/src/cli/questions.ts` → surface parked task to operator
2. Operator reviews, optionally invokes `superpowers:brainstorming` for deliberation
3. Operator provides answer; `/dispatcher` applies: `tsx packages/runtime-bridge/src/cli/answer.ts --task <id> --answer "<decision>" --decision request_changes` (B-park) OR `--decision resume` (A-park)
4. Loop resumes

### Type 3 — Terminal (no Q&A needed)

**Detected:** `status=done` or `status=verified` without a parked signal. Proceed directly to §2.4 harvest.

### CC-absent degradation (portable fallback)

**Capability-check (not brand-name detection per `dual-implementation-discipline.md §4`):** probe whether the `superpowers:brainstorming` Skill-tool is reachable in the current harness (attempt invocation with a sentinel probe, or check `CLAUDE_SKILL_DIR` environment + skill discovery). Do NOT branch on harness name strings like `"claude"` or `"cc"`.

If the brainstorming companion is unreachable (Cursor / Aider / Codex / no Superpowers installed): **technical forks degrade to Type 2 behaviour** — surface to operator rather than resolving autonomously. The portable markdown of this skill provides the same discrimination discipline; the autonomous resolution step is skipped. This is the CC-absent path by necessity, not a stub.

---

## §4 Harvest details and ATTN conditions

**Rework-commit gap:** if aif's container has a dirty working tree at harvest time (`request_changes→implementing→done` path), `harvest.ts` auto-commits all changes with a templated message (ZERO LLM). This is expected and logged in the harvest JSON output (`committed: true`).

**ATTN: container on wrong branch.** `harvest.ts` throws (does NOT self-heal) when the aif container's git state is on a different branch than the task's `branchName`. When this occurs, `/dispatcher` surfaces `ATTN: harvest threw — container may be on wrong branch. Manual check required: docker exec aif-handoff-agent-1 git branch` and does NOT silently retry. The operator must resolve the container state before re-running harvest.

**Harvest idempotency:** `gh pr create` fails if the PR already exists; re-run with `--no-auto-merge` to skip the merge step and recover gracefully.

---

## §5 Anti-scope

- **Does NOT plan** — priority scoring, launch-table generation, plan-currency check = `/pipeline`'s job. `/dispatcher` only executes a named umbrella.
- **Does NOT build new CLI primitives** — wires the 4 existing ones in `packages/runtime-bridge/src/cli/`. A genuinely-needed new primitive = surface as a finding to maintainer, do not add it here.
- **Does NOT edit `~/.claude/skills/orchestrator/`** — global skill, agent-uncommittable; maintainer-owned.
- **Does NOT add npm deps** — zero new dependencies; `tsx` runs existing TypeScript.

---

## Without this skill

The operator manually tracked task IDs, polled `GET /tasks/:id` in a shell loop, forgot to run `harvest.ts` after `done` status (the most-skipped step), copy-pasted `gh pr create` commands with wrong `--base` args, ran `superpowers:requesting-code-review` only sometimes, and manually checked whether the PR merged before dispatching the next stage. Each stage required 6–10 manual steps with no enforcement that all happened in the right order.

## With this skill

`/dispatcher <umbrella>` drives the full dispatch→monitor→Q&A→harvest→cold-review→gate→advance loop. Technical forks are resolved autonomously via `superpowers:brainstorming` (on CC) and reported; strategic forks surface a single question to the operator. The harvest step (push + PR + auto-merge) fires automatically on `done` status — the forgotten step is no longer forgettable. The operator's attention is needed only for genuine strategic decisions.

---

## §6 §1.7 self-reflexive note

**Stage 1 (dispatcher-ux):** `monitor-classify.sh` REUSES `priority-score.sh` Layer-C3 completion-detection pattern (BFR verdict REUSE, `build-first-reuse-default.md:3`; same problem class confirmed — task-status classification vs umbrella-completion classification). Tests at `packages/core/skills/dispatcher/monitor.test.ts:1`. Original BUILD-verdict forward/backward checks at `docs/meta-factory/dispatcher-skill-rphase.md`.
