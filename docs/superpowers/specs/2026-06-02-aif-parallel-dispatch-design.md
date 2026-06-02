<!-- scope:aif-parallel-dispatch -->
# aif parallel autonomous dispatch — design notes + verified model

> **Status:** OPEN QUESTION RESOLVED (live test 2026-06-02, task `a37ee2f5`). §5 answer = **YES** —
> aif self-parallelizes one umbrella via `use_subagents=true`. Design direction = the tiny change
> (bridge sets `use_subagents=true` at dispatch). Captures the verified model + the live proof.
> **Authoritative for:** the verified aif parallelism model + the dispatch-redesign direction.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

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
7. **Observable signal — CORRECTED 2026-06-02 (the §3.7 signal is SDK-transport-only; do NOT use it on CLI).**
   `subagentQuery.ts:793` logs `onSubagentStart` → `Subagent: <name> started <id>`, BUT `onSubagentStart`
   is wired **only** through the Claude **SDK** `SubagentStart` hook (`adapters/claude/hooks.ts:62-84`).
   The **CLI transport** (`adapters/claude/cli.ts`) emits only `onToolUse` — it **never** fires
   `onSubagentStart`. aif runs the implementer on `transport=cli` (live-confirmed: `model=sonnet,
   transport=cli`), so **`Subagent:` lines stay 0 even during full 5-way parallelism**. The baseline's
   "zero `Subagent:`" (task `bcb2c6`) was therefore *guaranteed by transport*, NOT evidence of
   single-agent execution — a false-negative trap. **Valid CLI-transport observables (used in the
   §5 test, both transport-independent):**
   - **(a) git worktree growth** — each `implement-worker` runs worktree-isolated; `git worktree list`
     grows from baseline 1 (main) by one `locked` `.claude/worktrees/agent-<id>` per concurrent worker.
   - **(b) `Tool: Agent {…, "subagent_type":"implement-worker", "isolation"…}` entries** in
     `agent_activity_log` — the `onToolUse` callback logs the coordinator's Agent-tool spawn of each worker.
   Concurrency ⇒ multiple worker worktrees **`locked` simultaneously** + overlapping spawn→still-active windows.

## §4 Decision tree (which mechanism per umbrella — meta-orchestrator decides)

- **Depth-2 sufficient** (one coordinator + its workers covers the parallel pieces) →
  dispatch ONE umbrella kickoff with `use_subagents=true` → aif self-parallelizes via
  `implement-coordinator` → `implement-worker`s. No N-emit, no cross-task machinery needed.
- **Depth-3 needed** (each parallel piece needs its own sub-team) → meta-orchestrator emits
  **N separate `*-meta-launch/kickoff.md`** → N top-level aif tasks → aif runs them in
  parallel (L1 cross-task, needs the worktree path working).

## §5 RESOLVED — YES, aif self-parallelizes one umbrella via `use_subagents=true` (live 2026-06-02)

**Answer: YES.** The load-bearing unknown — does aif launch the agent-definition top-level enough
for the coordinator to spawn workers? — is **confirmed**. Source path + live proof both hold:

**Source mechanism.** `use_subagents=true` → `implementer.ts:199-200` sets
`executionName="implement-coordinator"` + `agentDefinitionName="implement-coordinator"` →
`adapters/claude/cli.ts:188` pushes `--agent implement-coordinator` (a **top-level** `claude`
process, prompt via stdin) → the coordinator's execution algorithm (`implement-coordinator.md`):
`len(ready) > 1 → launch implement-worker for EACH ready task in parallel`.
> Caveat observed: with `transport=cli`, `promptPolicy` logs `WARN … native subagent execution …
> not supported` and `usedNativeSubagentWorkflow=false`. This is a Codex-oriented prompt-prepend
> path, NOT the `--agent` flag — `canUseAgentDefinition` stayed `true`, so `--agent
> implement-coordinator` was still passed and the coordinator launched top-level. The WARN is benign here.

**Live proof — task `a37ee2f5` (faithful bridge replay + `use_subagents=true`).** Dispatched a real
5-task plan (mutation-discipline Stage 4 D.1-D.5, 5 dep-free `Task N:` items → `computePlanLayers`
= `[[1,2,3,4,5]]`, one layer of 5) exactly as the bridge does (POST paused → PUT plan →
`accept_existing_plan` → unpause) but with `useSubagents:true`. Result:
- **5× `Tool: Agent {"subagent_type":"implement-worker","isolation"…}` spawns** in `agent_activity_log`
  (Task1 priority-score.sh 12:59:05 · Task2 plan-currency 12:59:28 · Task3 launch-table 12:59:51 ·
  Task4 check-skill-drift 13:00:23 · Task5 pre-push.fallback 13:00:57).
- **`git worktree list` grew 1 → 6** = main + **5 concurrent `locked` `.claude/worktrees/agent-<id>`**
  worktrees coexisting. Worker-1 (spawned 12:59:05) still `locked`/active when Worker-5 spawned
  (13:00:57) ⇒ ~2-minute all-5-overlap window = **true concurrency, not sequential**.
- `Subagent:` lines stayed 0 throughout — confirming the §3.7 transport caveat above, NOT absence of parallelism.

**Design consequence (the tiny change).** Depth-2 self-parallelism works. For depth-2-sufficient
umbrellas the bridge need only set `use_subagents=true` at dispatch (one flag in
`AifHandoffBackend.dispatch` POST body) **and** the meta-orchestrator must emit kickoffs whose plan
body carries independent `- [ ] Task N:` items (no `## Phase` headings — a Phase heading serializes
later tasks via `buildResolvedDependencies`). Depth-3 work still needs N separate top-level tasks (§4 L1).

**Reproduction artifact:** `.claude/orchestrator-prompts/mutation-discipline-stage-d-meta-launch/kickoff.md`
(carries `<!-- bridge: skip -->` so the PostToolUse hook does not auto-dispatch it with `use_subagents=0`).

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

1. ✅ (done) Stage-3 C dispatched autonomously with `use_subagents=false` — BASIC aif autonomy.
2. ✅ (done 2026-06-02, task `a37ee2f5`) Live parallelism test on D (D.1-D.5) → **§5 resolved = YES.**
3. **Finalize design = the tiny change:** `AifHandoffBackend.dispatch` adds `useSubagents:true` to the
   POST body for depth-2-sufficient umbrellas; meta-orchestrator emits plan-structured kickoffs
   (independent `- [ ] Task N:` items, no `## Phase` headings). Depth-3 → N separate tasks (§4 L1, needs
   the worktree path / #372). Open sub-decisions for the I-phase plan: (a) does the bridge set
   `use_subagents` per-kickoff (a marker) or always? (b) plan-structure authoring contract for the
   meta-orchestrator. → these are taste/strategy forks for `writing-plans`.
4. Then: writing-plans → I-phase. Merge #372.

## §10 D-byproduct disposition (this test run)

The §5 test ran on **real** Stage-4-D work (not throwaway). It produced 5 worker worktrees writing
the D.1-D.5 `.sh` mutation tests on isolated branch `feature/…-d-meta-launch-a37ee2`. It was dispatched
with `skipReview:true` (cost-trim for the parallelism probe) and **harvest is manual** (no hook/cron),
so **nothing auto-ships**. The D output is therefore unreviewed byproduct — to be either (a) properly
re-run/reviewed through `/meta-orchestrator mutation-discipline-umbrella` Stage 4 D and shipped, or
(b) discarded. Maintainer decision — not auto-merged.
