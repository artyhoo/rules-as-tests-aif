# Design — aif question-loop: agent-side PARK primitive (A+B by moment)

> **Authoritative for:** design of the agent-issuable PARK primitive for the aif autonomous question-loop — park/resume channels, `cli/park.ts` contract, the guard-test, build-vs-reuse verdict.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The park primitive is **operator-axis infrastructure** (autonomy substrate per [build-first-reuse-default.md §1.1](../../../.claude/rules/build-first-reuse-default.md)), **NOT** the product goal — do not elevate it to «project goal» anywhere downstream.
> **Status:** approved in brainstorm 2026-06-01. Next step: `writing-plans`.
> **Origin:** live smoke `701a52e3` (2026-06-01). Question-loop proven e2e except the agent had no way to PARK itself on a product fork. Predecessor brief: `.claude/orchestrator-prompts/aif-qloop-park-primitive/kickoff.md`. Predecessor design: [2026-05-31-aif-question-loop-design.md](2026-05-31-aif-question-loop-design.md).

## §1 Problem

On a genuine product fork mid-task («tagline tone: playful or serious?») the agent must **stop, ask the operator, and resume later with the answer**. In the smoke it could not: it invented a non-existent `cli/park.ts`, tried direct sqlite, tried REST, never parked, and finished `done` with a placeholder. aif has **no agent-issuable deliberate-park primitive** for the autonomous task pipeline.

## §2 Verified facts (live + source — do NOT re-investigate)

All verified 2026-06-01 against the running containers (`aif-handoff-api-1`, `aif-handoff-agent-1`) — both source (`/app/packages/**/src`) and compiled (`dist`), plus one live API probe.

| # | Fact | Evidence |
|---|---|---|
| F1 | The agent is **not** a continuous loop — a poll-driven coordinator (`pollAndProcess`) re-selects candidate tasks per stage each tick. | `agent/src/coordinator.ts:774`, PIPELINE `:78` |
| F2 | Implementer stage selects `status ∈ {implementing, plan_ready+autoMode}`; **`blockedReason` is NOT in the filter** → blockedReason-only does NOT stop the agent. | `data/src/index.ts:1306-1334` |
| F3 | **`paused: true` IS the stop**: every candidate query shares `eq(tasks.paused, false)`. | `data/dist/index.js:901` (compiled, running): `.where(and(stageFilter, eq(tasks.paused, false), …))` |
| F4 | Watchdog also skips paused: `listStaleInProgressTasks` filters `paused=false` → a paused task is **not** dragged to `blocked_external`, so `blockedReason` is **not** clobbered. | `data/src/index.ts:1676`; release path `:1566`; scheduled `:1576` |
| F5 | `PUT /tasks/:id` accepts `paused` + `blockedReason` (both via `updateTaskSchema`) but **NOT** `status` and **NOT** `manualReviewRequired`. | `api/src/schemas.ts` updateTaskSchema (incl. `paused: z.boolean().optional()`) |
| F6 | Loud feedback to the implementer (`reviewComments` in a REWORK banner) is gated on `task.reworkRequested` — only `request_changes` sets it, **only from `done`**. | `agent/src/subagents/implementer.ts:258-269`; `shared/src/stateMachine.ts:78-84` |
| F7 | **From `implementing` there are zero events** (`HUMAN_ACTIONS_BY_STATUS.implementing = []`); every event's `CLEAN_STATE_RESET` wipes `blockedReason`/`reworkRequested`. | `shared/src/stateMachine.ts:104-112, :20-24` |
| F8 | No `parked`/`awaiting` status exists. Full set: `backlog, planning, plan_ready, implementing, review, blocked_external, done, verified`. | `shared/src/types.ts:1` |
| F9 | aif **does** have an interactive question primitive — but it is **chat-conversation-scoped & synchronous** (AskUserQuestion rendered in chat UI, next message resumes). Not applicable to the autonomous task pipeline. | `api/src/routes/chat.ts:78` |
| F10 | **Live probe**: created task → `PUT {paused:true, blockedReason}` persisted (GET confirmed) → not advanced after 15s → unpause restored eligibility → DELETE 200/GET 404. | live run 2026-06-01, probe deleted |

**Consequence (the design pivot):** honest stop (stay `implementing`) and loud answer (rework banner) are **mutually exclusive on one park** (F6+F7). Therefore park splits by **moment**.

## §3 Design — A+B by moment

The agent picks the park channel by **where the fork happens**:

### A · mid-flight park (the real gap → BUILD)
Fork blocks *continuing* implementation. New thin consumer CLI `packages/runtime-bridge/src/cli/park.ts` (dual of shipped `answer.ts`):

```text
PUT /tasks/:id { paused: true, blockedReason: "<fork question + options>" }
```
…and append a structured marker to the task `plan` (the one field the non-rework implementer reliably reads — F6):
```text
## ⏸ OPEN QUESTION (awaiting operator)
<question>
- A: <option A>
- B: <option B>
```
- Honest: task stays in its real stage, never claims `done`.
- `$0`: no auto-review triggered (Finding C untouched).
- Detected as parked: `questions.ts.isParked` already returns true on non-empty `blockedReason`.

### B · finish-line park (already shipped → REUSE as-is)
Fork is about direction/acceptance and the work is essentially complete. Agent drives to `done`; operator resolves via `request_changes` carrying the answer (loud REWORK banner). **Already shipped (#323), unchanged.**

### Agent selection rule (kickoff-prompt instruction)
- Fork blocks continuing the build → **A** (`park.ts`).
- Work is essentially done, question is about direction/approval → **B** (`done` + await `request_changes`).

### Resume — symmetric in `answer.ts`
- Park was **A** → append `→ ANSWER: <text>` under the same `## ⏸ OPEN QUESTION` section, then `PUT {paused:false, blockedReason:null}`. Implementer re-reads the plan next tick.
- Park was **B** → existing `request_changes` path, unchanged.

### Explicitly rejected / deferred
- **`blocked_external` for a fork — REJECTED.** It is the error/gate path (stage errors, runtime-gate, watchdog max-retry — `coordinator.ts:304`, `taskWatchdog.ts`). A product fork is a normal pause-with-question; conflating it with error-recovery is semantically wrong and risks the release-backoff machinery (F4). `paused + blockedReason` is cleaner.
- **C · upstream aif PR (first-class `parked` status + answer-carrying resume event) — DEFERRED**, optional follow-up. Not MVP. Gap is real (F8) but the consumer-side composition works today.

## §4 Guard-test (executable — keeps us on project-goal)

Variant A depends on an **undocumented aif internal**: that *every* candidate query filters `paused=false` (F3/F4). That is exactly the «silent undocumented convention» this project exists to eliminate. Make the dependence **executable**, not silent:

- **Assertion:** a task with `paused=true` is excluded from coordinator candidacy (and from the stale-watchdog), at the earliest reachable channel.
- **Form:** deterministic test in `packages/runtime-bridge` (own code) — preferred: a live/contract check that a paused task is not picked up (mirrors F10), OR a pinned assertion over the aif behavior our park relies on. No paid LLM ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)).
- **Why:** if upstream aif drops the `paused=false` filter, our park silently breaks. The guard fails loudly instead — turning a silent dependency into an executable one (recursive self-application of the project thesis).
- **Wrong if:** aif published a documented public park contract — then the guard is redundant. Verified it has not (F8).

## §5 Build-vs-reuse verdict (BFR)

- `park.ts` — **BUILD** (thin consumer CLI, ~dual of `answer.ts`). No upstream park primitive exists for the autonomous pipeline (F8/F9 — chat AskUserQuestion is a different problem class, T16). Capability-commit at implementation → `Prior-art:` trailer required (CLAUDE.md gate).
- B path — **REUSE** (shipped `request_changes`, #323).
- C (upstream `parked`) — **DEFER** with trigger: revisit if paused-fragility actually bites (guard-test fires) or if multiple consumers need a documented contract.

## §6 Out of scope
- Finding C (auto-review cost / `skipReview` economy mode) — deferred by maintainer.
- Superset auto-open chat + consolidated idle-ping — separate fast-follow.
- The human-side `questions.ts` / `answer.ts` (#318/#323) must not break — park composes WITH them.

## §7 Reference paths
- Ours: `packages/runtime-bridge/src/cli/{questions,answer}.ts` (+ new `park.ts`).
- aif (in container): `/app/packages/{shared,api,agent,data}/src/**` per §2 citations.
- Session findings: memory `project_aif_question_loop_live_integration_handoff`.
