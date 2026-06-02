<!-- scope:aif-parallel-dispatch -->
# aif parallel autonomous dispatch — design notes + verified model

> **Status:** DESIGN-IN-PROGRESS (brainstorm 2026-06-02). NOT yet a final spec — the core
> open question (§5) is gated on ONE live test. Captures everything concluded so the work
> survives a session boundary.
> **Authoritative for:** the verified aif parallelism model + the dispatch-redesign direction.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
> Final spec/plan come AFTER the §5 live test resolves the open question.

## §1 Goal (why)

Free the maintainer from **manually launching parallel Claude sessions** (copy prompt → new
window → copy report back). The meta-orchestrator decomposes an umbrella into parallel work;
today the maintainer runs those parallel sessions by hand. aif's job: run that parallel work
autonomously — dispatch, execute, push PR, and **park questions back to the operator** — with
zero manual copy-paste.

## §2 The depth-2 architecture insight (maintainer, load-bearing)

Subagents do NOT spawn subagents — session nesting is only **2 deep** (orchestrator → worker →
STOP). Quality parallel work, where each piece itself needs its own subagents, therefore needs
each piece to be its **own top-level session** (depth resets). That is exactly the parallelism
the meta-orchestrator distributes — and what the maintainer launches by hand today.

**The meta-orchestrator decides the depth strategy** at decomposition time:
- work that fits depth-2 (a coordinator + its workers) → one umbrella, parallelized internally;
- work where each parallel piece needs its own sub-team (depth-3) → N separate top-level
  sessions (= N separate aif tasks).

## §3 Verified aif model (source + live DB, 2026-06-02)

1. **Bridge dispatch = one kickoff per `*-meta-launch/kickoff.md` write.** `runtime-bridge-dispatch.sh`
   PostToolUse hook fires on writing `.claude/orchestrator-prompts/<name>-meta-launch/kickoff.md`
   → `cli/dispatch.ts <path>` → ONE aif task. No batch primitive.
2. **Each aif task = its own top-level runtime session** (per-task `sessionId`,
   `subagentQuery.ts` get/saveTaskSessionId). ⇒ N aif tasks = N parallel top-level sessions =
   the depth reset the orchestrator needs, automated.
3. **Flat task model** — no `parent_task`/`subtask`/`depends_on`/DAG columns. aif does NOT split
   one task into parallel sub-tasks at the orchestration level.
4. **Two parallelism layers:**
   - **L1 cross-task:** the coordinator runs up to `COORDINATOR_MAX_CONCURRENT_TASKS` tasks
     concurrently, **each in its own git worktree**. Requires worktrees → the worktree path.
   - **L2 within-task (`use_subagents=true`):** the task runs via agent-definitions
     `plan-coordinator` / `implement-coordinator` (`planner.ts:23`, `implementer.ts:24`).
     `implement-coordinator` reads the plan, builds a dependency graph, and **dispatches
     `implement-worker` sub-agents CONCURRENTLY**, each worktree-isolated
     (`.claude/agents/implement-coordinator.md` lines 3/24/141/182/187). This is depth-2:
     coordinator → workers; workers cannot spawn further (line 27: must run top-level).
5. **Why aif has NEVER parallelized for us:** `use_subagents = 0` on **every** task (live DB),
   and the bridge never sets it → tasks run via the plain `/aif-implement` single agent. The
   worktree path is also bypassed (see §3.6). So both layers are off by default.
6. **Worktree creation is bypassed by the bridge's planner-skip (documented).** The bridge
   dispatches via `accept_existing_plan`, which moves `backlog → plan_ready` **skipping the
   `planning` stage** (`stateMachine.ts`); `runPlanner` (the ONLY place worktrees are created,
   `planner.ts:191-213`) runs only at the planning stage (`coordinator.ts` PIPELINE
   `from:["planning"]`). So bridge tasks never create a worktree, regardless of
   `parallel_enabled`. This is **documented aif behaviour** (`docs/configuration.md`:
   "full-mode planning … creates a sibling git worktree"; `docs/architecture.md` on serial
   forcing) — NOT a bug. Full diagnosis: research-patch `2026-06-02-aif-worktree-gap.md` (PR #372).
7. **Observable signal that distinguishes single-agent vs parallel-workers** (for the §5 test):
   `subagentQuery.ts:793` logs every subagent start to the task's `agent_activity_log` as
   `Subagent: <name> started <id>`. Baseline (a `use_subagents=0` task) shows only `Agent:`
   stage entries (plan-checker, implementer) and **zero `Subagent:`** entries — verified live on
   task `bcb2c6`. Parallel workers ⇒ multiple `Subagent: implement-worker started` lines with
   **overlapping timestamps**.

## §4 Decision tree (which mechanism per umbrella — meta-orchestrator decides)

- **Depth-2 sufficient** (one coordinator + its workers covers the parallel pieces) →
  dispatch ONE umbrella kickoff with `use_subagents=true` → aif self-parallelizes via
  `implement-coordinator` → `implement-worker`s. No N-emit, no cross-task machinery needed.
- **Depth-3 needed** (each parallel piece needs its own sub-team) → meta-orchestrator emits
  **N separate `*-meta-launch/kickoff.md`** → N top-level aif tasks → aif runs them in
  parallel (L1 cross-task, needs the worktree path working).

## §5 OPEN QUESTION (gated on ONE live test — do NOT finalize design before this)

**Does enabling `use_subagents=true` actually make aif self-parallelize one umbrella?**
Unverified risk: `implement-coordinator.md:27` requires running as a **top-level** agent
("subagents cannot spawn other subagents"); it is NOT verified that aif's runtime launches the
agent-definition top-level enough for the coordinator to spawn workers.

**Test:** on a **genuinely parallel** real task (≥2 independent plan-tasks — e.g. mutation-
discipline **Stage 4 D / D.1-D.5**, NOT Stage-3 C which is single Mode-A), set
`use_subagents=true`, dispatch, then read `agent_activity_log`:
- self-parallelizes → multiple `Subagent: implement-worker started` with overlapping timestamps;
- does not → no `Subagent:` entries (as baseline) or strictly sequential.
Corroborate with `git worktree list` (worker worktrees) + `docker logs aif-handoff-agent-1`.

## §6 Honest corrections log (flip-flops this session — recorded so they aren't repeated)

- First framed worktree-gap (#372) as THE blocker for parallelism → built #360/#362/#365/#367
  around worktree isolation **before** verifying WHY aif was serial. The real reason all tasks
  ran single/serial was `use_subagents=0`, not (only) the worktree-gap.
- Then over-corrected: "`use_subagents` collapses the design, worktree-gap irrelevant." Wrong —
  `use_subagents` is L2 (within-task depth-2); the maintainer's depth-2-limit reasoning means
  depth-3 work genuinely needs L1 cross-task (separate sessions). Both layers are real.
- The #360 verdict ("flip `parallel_enabled` → worktrees") was avoidable by reading aif's own
  `docs/configuration.md` (worktree = full-mode planning) up front — a search-coverage miss.

## §7 Shipped this session (all merged to staging unless noted)

- #360 R-phase (Findings A dirty_worktree + F mid-flight park) · #361 park.ts F-guard
  (reject at status=review) · #362 ensure-parallel guard (keeps `parallel_enabled=1`) ·
  #365 bridge-cleanup §4 (prune MERGED container git junk) · #367 §4 skips while live tasks run.
- **#372 OPEN** — `2026-06-02-aif-worktree-gap.md` (corrects #360; documents §3.6).
- harvest verified NON-bug (it ran, pushed, opened PR #370 for task bcb2c6).

## §8 Decisions captured

- **Planner ownership = A:** kickoff is the planner's INPUT (it builds the internal plan); not
  used verbatim. Matches the maintainer's "planner builds the work plan."
- **Parallelism degree** = `COORDINATOR_MAX_CONCURRENT_TASKS` env knob (default generous ~4-6);
  not architectural.
- **Park/questions PRESERVED (hard acceptance criterion, verified orthogonal):** operates on
  `paused`/`blockedReason`/`plan` + the coordinator's unconditional `paused=false` filter
  (`coordinator.ts:590/594/721/727`) — independent of dispatch path / worktrees / use_subagents.

## §9 Next steps

1. (this session) Stage-3 C dispatched autonomously with `use_subagents=false` — clean validation
   of BASIC aif autonomy (dispatch→PR); NOT the parallelism test (C is single Mode-A).
2. Live parallelism test on D (D.1-D.5) per §5 → resolves the open question.
3. Per result: finalize design — `use_subagents=true` on dispatch (if L2 self-parallel works)
   and/or meta-orchestrator emits N + L1 cross-task worktree path (if depth-3 / for true
   separate-session parallelism).
4. Then: writing-plans → I-phase. Merge #372.
