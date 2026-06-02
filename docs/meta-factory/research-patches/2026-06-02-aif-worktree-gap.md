<!-- scope:aif-worktree-gap -->
# aif-worktree-gap — Why 0 tasks ever receive a worktree despite `parallel_enabled=1`

> **Authoritative for:** R-phase research on why per-task worktree creation remains unreachable in the
> bridge dispatch flow even after the `parallel_enabled` fix from 2026-06-01 Finding A.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
> I-phase implementation — that is a separate commit after the decisions below are resolved.

**Date:** 2026-06-02
**Origin:** Orchestrator observation that `worktree_path` is null for all tasks including full-mode
non-fix tasks run after `parallel_enabled` was flipped to 1 (PR #362 + `ensure-parallel` guard).
Corrects the "necessary-but-insufficient" gap in [2026-06-01-aif-task-isolation.md §1–§2](2026-06-01-aif-task-isolation.md).

---

## §0 Correction of prior patch Finding A

The 2026-06-01 patch (Finding A) concluded:

> «Root cause: `parallel_enabled=0` in project DB. Fix: flip the toggle. Falsifier: wrong if enabling
> `parallel_enabled` still does not create worktrees.»

**That falsifier has now fired.** Live DB evidence (2026-06-02):

- `parallel_enabled = 1` ✅ (flipped by PR #362 + `ensure-parallel` guard — live confirmed)
- Three most-recent tasks have `planner_mode = 'full'` and `branch_name` SET, yet `worktree_path = null`
  (live DB query below)
- Coordinator logs (live, 2026-06-02): `"Auto-queue parallel pool disabled while legacy branch-bound
  tasks without worktrees are active"` — emitted every 30-second poll cycle

Gate 2 (`project.parallelEnabled`) is now passing. The problem is that `parallel_enabled=1` was
**never the only gate** — the bridge dispatch flow bypasses the worktree code through a different
mechanism entirely, described in §1 below.

Live DB confirmation (2026-06-02, three most-recent full-mode tasks all post-flip):

```text
id: bcb2c6c2  title: doc-audit-ship-boundary-meta-launch  planner_mode: full  branch_name: SET  worktree_path: null
id: f99ef209  title: coordination-persistence-fix          planner_mode: full  branch_name: SET  worktree_path: null
id: 70c5eca6  title: coordination-persistence-fix          planner_mode: full  branch_name: SET  worktree_path: null
```

### §0.1 This is DOCUMENTED, intended aif behaviour — not a bug or undocumented trap

Verified via DeepWiki on `lee-to/aif-handoff` (3 phrasings, converged) before drafting any upstream report:

- **`docs/configuration.md` («Parallel Execution (Experimental)»):** *"With `AIF_TASK_WORKTREES_ENABLED=true`,
  full-mode planning for parallel branch-isolated projects creates a sibling git worktree for each task…
  and runs all downstream stages from that path."* → worktree creation is **by design tied to the
  full-mode `planning` stage**.
- **`docs/architecture.md`:** *"Legacy branch-bound tasks without `worktreePath` still force serial
  execution until they leave the pipeline."* → the serial-forcing is documented too.

So a planner-skip dispatch (`accept_existing_plan`) forgoing the worktree is a **direct, documented
consequence** of aif's design, not a defect. **No upstream issue is warranted.** The only un-spelled-out
nuance is the *specific* `accept_existing_plan → no worktree` interaction (the general rule «worktree =
full-mode planning» IS documented) — too marginal to file.

**Honest search-coverage lesson (this patch's §9 self-reflection):** the 2026-06-01 Finding A verdict
(«flip `parallel_enabled` → worktrees created») was avoidable — `docs/configuration.md` already stated
worktree creation requires full-mode planning. The miss was not consulting the upstream's own
configuration docs before closing the verdict (`phase-research-coverage.md §1` own-stack/source-of-truth
sweep). The corrected fix path (§5) — run the planner via the normal `start_ai` flow — is precisely the
**documented** way to obtain worktree isolation + parallelism.

---

## §1 WG1 (the crux) — `accept_existing_plan` bypasses `runPlanner` entirely

### §1.1 State machine transition: `backlog → plan_ready` skips `planning`

`packages/shared/src/stateMachine.ts:42–46` (read from container `aif-handoff-api-1`):

```typescript
case "accept_existing_plan": {
  if (task.status !== "backlog") {
    return { ok: false, error: "accept_existing_plan is only allowed from backlog" };
  }
  return { ok: true, patch: { ...CLEAN_STATE_RESET, status: "plan_ready" } };
```

The `accept_existing_plan` event transitions a task from `backlog` directly to `plan_ready`. It
**skips the `planning` status entirely**.

### §1.2 `runPlanner` is only invoked for `status=planning`

`packages/agent/src/coordinator.ts:78–84` (read from container `aif-handoff-agent-1`):

```typescript
const PIPELINE: StatusTransition[] = [
  {
    from: ["planning"],
    inProgress: "planning",
    onSuccess: "plan_ready",
    runner: runPlanner,          // ← only entry point for runPlanner
    label: "planner",
  },
```

The coordinator only calls `runPlanner` when it picks up a task with `status=planning`. A task that
arrives at `plan_ready` via `accept_existing_plan` never enters the `planning` status → `runPlanner`
is never called → the worktree creation code at `planner.ts:191–213` (branch 3, `shouldCreateWorktree`
gate) **never executes**. `worktree_path` remains null regardless of `parallel_enabled`.

### §1.3 The bridge's 4-step dispatch uses `accept_existing_plan`

`packages/runtime-bridge/src/AifHandoffBackend.ts:163–198` (local source):

```text
Step 1: POST /tasks  { plannerMode:'fast', paused:true }   → 201 + taskId
Step 2: PUT  /tasks/:id  { plan: <kickoff content> }        → plan written to disk + DB
Step 3: POST /tasks/:id/events { event: 'accept_existing_plan' } → backlog → plan_ready (skips planning)
Step 4: PUT  /tasks/:id  { paused: false }                  → coordinator picks up at plan_ready
```

Step 3 is the mechanism. Every bridge-dispatched task goes `backlog → plan_ready` without entering
`planning` → `runPlanner` is never called → no worktree, regardless of `parallel_enabled` or
`plannerMode`.

### §1.4 Secondary effect: `accept_existing_plan` also sets `branchName` for unbound tasks

`packages/api/src/services/taskEvents.ts:265–282` (read from container `aif-handoff-api-1`):

```typescript
} else if (!task.isFix && !boundBranchName) {
  try {
    const branchResult = ensureFeatureBranch({
      projectRoot: project.rootPath,
      taskId: task.id,
      title: task.title,
    });
    if (branchResult.action !== "skipped" && branchResult.branchName) {
      boundBranchName = branchResult.branchName;    // in-place branch created
    }
  }
}
// ...
setTaskFields(input.taskId, {
  status: "plan_ready",
  branchName: boundBranchName,    // persisted to DB (taskEvents.ts:321)
```

This is a **secondary effect** — even if `runPlanner` were somehow invoked after the planner skip,
`task.branchName` would already be set (written at `accept_existing_plan` time), so planner.ts
branch 3 (`} else if (!task.isFix && plannerMode === "full")`) requires `task.branchName` to be null
(line 172: `let preparedBranch: string | null = task.branchName ?? null`; branch 2 at line 183 fires
first). But this is secondary — the primary bypass is §1.1/§1.2 (planner never called at all).

**Verification note on container location:** `taskEvents.ts` exists at
`/app/packages/api/src/services/taskEvents.ts` in container `aif-handoff-api-1` — not in
`aif-handoff-agent-1`. The `find /app/packages -name taskEvents.ts` search must target the API
container.

---

## §2 WG2 — Fresh full-mode task via auto-queue: does worktree creation work?

**Hypothetical path:** a task created via `POST /tasks` with `autoMode:true` and no
`accept_existing_plan` call. The coordinator's auto-queue logic (`processAutoQueueAdvance`,
coordinator.ts:644) transitions the task `backlog → planning` (coordinator.ts:733, `toStatus:
"planning"`). The coordinator then picks it up at `status=planning` → `runPlanner` IS called →
branch 3 is reachable.

At planner.ts:191–213 with `task.branchName = null` and `plannerMode='full'`:

```typescript
} else if (!task.isFix && plannerMode === "full") {
  const shouldCreateWorktree =
    getEnv().AIF_TASK_WORKTREES_ENABLED &&        // true (printenv confirmed)
    Boolean(project?.parallelEnabled) &&           // true (parallel_enabled=1)
    projectSupportsTaskWorktrees(projectRoot);     // true (see §3 WG4)
  if (shouldCreateWorktree) {
    const worktreeResult = ensureTaskWorktree({ ... });
    setTaskFields(taskId, { branchName: ..., worktreePath: ... });
```

**Answer:** for auto-queued tasks that go through the normal `planning` stage (without
`accept_existing_plan`), `runPlanner` IS called and a worktree WOULD be created if all three gates
pass. The worktree code is not dead — it is bypassed specifically by the bridge's
`accept_existing_plan` step 3.

**However**, there is a compounding barrier: `hasActiveBranchBoundTasksForProject` (data/index.ts:1473)
returns true whenever any non-terminal task has `branchName` SET + `worktreePath` NULL. Every
bridge-dispatched task creates exactly this state. The coordinator then forces `limit=1`
(coordinator.ts:664–665), which blocks the parallel pool even when `parallelEnabled=1`. So even
for auto-queued tasks, as long as bridge-dispatched branch-bound tasks exist in the DB, the pool
is serialised.

---

## §3 WG3 — Bridge dispatches `plannerMode:'fast'` — is switching to `'full'` the fix?

The API enforces full-mode when `parallelEnabled=1`. `packages/api/src/routes/tasks.ts:139–141`
(read from container `aif-handoff-api-1`):

```typescript
if (project?.parallelEnabled) {
  body.plannerMode = "full";   // overrides whatever the bridge sent
}
```

The bridge currently sends `plannerMode:'fast'` (AifHandoffBackend.ts:167). With `parallel_enabled=1`
live, the server **already forces `plannerMode='full'`** in the DB. The three live full-mode tasks
confirm this. Changing the bridge to send `'full'` explicitly would have no additional effect.

**Does full-mode conflict with planner-skip?** No. `plannerMode='full'` controls which branch inside
`runPlanner` is active. `accept_existing_plan` transitions the task to `plan_ready` WITHOUT invoking
`runPlanner` at all — so `plannerMode` is irrelevant to the bypass. The planner-skip and
plannerMode are orthogonal mechanisms.

**Verdict:** changing `plannerMode` is not the fix and does not affect worktree creation for
bridge-dispatched tasks.

---

## §4 WG4 — Does `projectSupportsTaskWorktrees` return true live?

`packages/shared/src/gitIsolation.ts` (read from container, prior patch §1.2 + re-confirmed):

```typescript
export function projectSupportsTaskWorktrees(projectRoot: string): boolean {
  return projectUsesSharedBranchIsolation(projectRoot);
}
export function projectUsesSharedBranchIsolation(projectRoot: string): boolean {
  const config = resolveGitConfig(projectRoot);
  return config.enabled && config.create_branches && isGitRepo(projectRoot);
}
```

Gate 3 conditions for `/home/www/rules-as-tests-aif`:
- `git.enabled = true` ✅ (config.yaml, prior patch §1.2)
- `git.create_branches = true` ✅ (prior patch §1.2)
- `isGitRepo()` ✅ (`.git` directory present — prior patch §1.5)
- `AIF_TASK_WORKTREES_ENABLED = true` ✅ (`printenv` in agent container confirmed)

**Gate 3 passes.** `projectSupportsTaskWorktrees` returns `true`. Gate 3 is not the problem.

---

## §5 WG5 — Verdict: what is the real fix?

### §5.1 Root cause summary

| # | Barrier | State | Causes null worktree? |
|---|---|---|---|
| G1 | `AIF_TASK_WORKTREES_ENABLED` env | ✅ true | No (was already passing) |
| G2 | `project.parallelEnabled = 1` | ✅ true (post-PR #362) | Necessary but not sufficient |
| G3 | `projectSupportsTaskWorktrees()` | ✅ true | No (passing) |
| **P** | **`accept_existing_plan` skips `planning` → `runPlanner` never called** | **Active** | **Yes — PRIMARY** |
| **S** | **`hasActiveBranchBoundTasksForProject` → serial lock** | **Active** | **Yes — compounding** |

**Primary root cause:** `accept_existing_plan` (bridge step 3) transitions tasks `backlog → plan_ready`
bypassing `planning` status. The coordinator only calls `runPlanner` for tasks at `planning` status.
Worktree creation lives exclusively in `runPlanner` branch 3. When the planner stage is skipped,
the worktree is never created — regardless of any env var, DB flag, or plannerMode setting.

**Compounding serial lock:** every bridge-dispatched task ends up with `branchName` SET +
`worktreePath` NULL (set by `handleAcceptExistingPlan` at taskEvents.ts:321). This makes
`hasActiveBranchBoundTasksForProject()` return true, which forces the coordinator to `limit=1`
(serial) even when `parallelEnabled=1`. Live evidence: coordinator log
`"Auto-queue parallel pool disabled while legacy branch-bound tasks without worktrees are active"`
emitted every 30-second cycle.

### §5.2 Fix options

**Option A — Keep planner-skip; skip branch creation in `accept_existing_plan` (aif-upstream issue, ~2 hrs)**

The `accept_existing_plan` handler (taskEvents.ts:265–282) calls `ensureFeatureBranch` for unbound
tasks. If this call were conditional on `!project.parallelEnabled` (or on a new `skipBranchCreation`
flag), the task would reach `plan_ready` with no `branchName`. The task would still bypass
`runPlanner` (planner-skip in place) and the implementer at taskEvents.ts:183 would create the
in-place branch. Worktrees still not created — this only removes the serial-lock side-effect.
**Does not solve the worktree problem.** Only removes the compounding serial lock.

**Option B — Dispatch without `accept_existing_plan`; let coordinator advance through `planning` (our-side-change, ~2 hrs)**

Replace bridge steps 3+4 with: `PUT /tasks/:id { paused: false }` only. Task starts at `backlog`
with `paused=false`. The auto-queue picks it up → `backlog → planning` → `runPlanner` called →
branch 3 reached → worktree created. No `accept_existing_plan` call → no branchName pre-emption →
`hasActiveBranchBoundTasksForProject` stays false.

**Risk:** `runPlanner` with `plannerMode='full'` runs the planning subagent (real LLM call). The
pre-pushed plan (bridge step 2) is written to disk by `persistTaskPlan` which calls
`syncPlanTextToCanonicalFile` (taskPlan.ts:53). If `runPlanner`'s subagent reads the plan file
first and uses it as the existing plan, it may preserve it. But if it overwrites the plan file
(the subagent calls `/aif-plan full` which writes to `@${planPath}`), the pre-pushed kickoff plan
is destroyed. **Needs live test before adoption** — see ATTN-2.

**Option C — Accept planner-skip as design; accept in-place + serial; mitigate dirty_worktree (Option D from prior attempt — our-side-guard)**

Accept that bridge-dispatched tasks will always be branch-bound in-place and serial (limit=1). This
is safe — serial prevents concurrent dirty-state. The dirty_worktree 409 occurs when a prior task
leaves uncommitted changes; the bridge's rollback path (AifHandoffBackend.ts:199–203) already handles
this per-dispatch. See §6 for dirty_worktree persistence analysis.

**Recommended short-term path:** Option C (zero changes, already deployed via PR #362 guard).
**Recommended medium-term path:** Option B with live-test verification of plan preservation.
Option A does not achieve worktree isolation and is not worth the upstream effort alone.

---

## §6 WG6 — Is `dirty_worktree` still reproducible with serial in-place execution?

**Serial enforcement confirmed.** With `parallelEnabled=1` and existing branch-bound tasks (no
worktreePath), coordinator.ts:664–665 forces `limit=1`. Live coordinator log confirms this runs
every 30-second tick. No concurrent task can dirty the shared working tree.

**Dirty-tree gate for auto-queue advance.** Coordinator.ts:692–704:

```typescript
if (
  isGitRepo(project.rootPath) &&
  (!env.AIF_TASK_WORKTREES_ENABLED || !projectSupportsTaskWorktrees(project.rootPath))
) {
  const dirty = describeDirtyWorkingTree(project.rootPath);
  if (dirty) { ... continue; }  // block advance
}
```

The gate fires only when `!AIF_TASK_WORKTREES_ENABLED || !projectSupportsTaskWorktrees()`. Currently
both are false (worktrees enabled + project supports them), so the dirty-tree gate is **skipped**.
The coordinator assumes worktrees handle isolation — but worktrees are not being created. This is a
secondary gap: the protection that would have blocked auto-queue advance on a dirty tree is
bypassed precisely because `AIF_TASK_WORKTREES_ENABLED=true` tells the coordinator «worktrees handle
it».

**Bridge-dispatched tasks.** The `accept_existing_plan` event calls `restoreTaskBranchForMutation`
(taskEvents.ts:34–60) which calls `restorePersistedBranch`. If the working tree is dirty when this
fires, the checkout fails with `BranchIsolationError → dirty_worktree → 409 → bridge rollback`
(AifHandoffBackend.ts:199–203). The rollback is already wired.

**Summary:** dirty_worktree 409s remain possible when a prior task leaves uncommitted changes AND
the next dispatch is bridge-dispatched. Serial execution (limit=1) reduces frequency but does not
eliminate the source. The original intended protection (worktrees isolate each task's changes) is not
in place for bridge-dispatched tasks.

---

## §7 SSOT references

- **SSOT #109** — `park.ts` BUILD verdict; prior research-patch base (Finding A + F).
- **SSOT #65** — Superpowers `using-git-worktrees` REFERENCE; worktree isolation pattern confirmed
  correct at design level. This patch finds the mechanism by which aif's own worktree code is
  bypassed — not a design gap, but a dispatch-flow bypass.
- **SSOT #28** — aif `paused:true/false` + state machine semantics; `accept_existing_plan` is a
  human-accessible event per `HUMAN_ACTIONS_BY_STATUS.backlog`.

No new SSOT entry required for this patch (research only). The I-phase capability commit implementing
Option B will carry the `Prior-art:` trailer.

---

## §8 Prior-art + build-vs-reuse check (T11/T12)

**DeepWiki phrasings used** (`lee-to/aif-handoff`, 2026-06-02):

1. «When is a task's feature branch name (branchName) first persisted in the database? Is it set
   during task creation, during accept_existing_plan, or during the first planning run?» — confirmed:
   not at creation; set during `accept_existing_plan` (in taskEvents.ts) or during `runPlanner` for
   tasks that go through the planning stage.

2. «Under what exact conditions does the planner (runPlanner) create a per-task git worktree vs
   restore a branch in place? Does plannerMode fast ever create a worktree?» — confirmed: fast never
   creates worktrees; full + `!branchName` + `shouldCreateWorktree` required; branchName must be null
   to reach branch 3.

3. «When a task is created with plannerMode fast via POST /tasks, and then accept_existing_plan is
   sent, does the accept_existing_plan handler set branchName? Does this make worktree creation in
   runPlanner unreachable?» — confirmed: «worktree creation in `runPlanner` would be unreachable for
   such a task.»

All three phrasings converged. The primary bypass (§1.1/§1.2 — planner stage skipped) is additionally
confirmed by reading coordinator.ts:78–84 and stateMachine.ts:42–46 directly.

**WebSearch phrasings** (T12):

1. «git worktree per-task dispatch pre-planned task skip planning stage agent pipeline» — no
   relevant results; confirms this is aif-handoff-specific interaction, not a generic pattern.
2. «AI agent pipeline bypass planning stage with existing plan worktree isolation problem 2026» — no
   hits; problem class is specific.
3. «aif-handoff accept_existing_plan planning stage skip worktree isolation» — no public docs; source
   code is the authoritative channel.

No upstream tool or library exists that solves the «planner-skip kills worktree creation» problem
class — it is intrinsic to aif-handoff's design (planner is the only place worktrees are created).

---

## §9 §1.7 Self-reflection (principle 13, T15)

### §9.1 Forward-check

- **no-paid-llm-in-ci §1:** all proposed mechanisms are deterministic or session-bound (Option C =
  existing guard, zero changes; Option B = bridge dispatch change, no API-billed step). ✅
- **build-first-reuse-default §3:** DeepWiki queried ≥3 phrasings; WebSearch ×3 phrasings; upstream
  source read before any fix proposed; no BUILD proposed without confirmed upstream gap. ✅
- **doc-authority-hierarchy §2–§3:** scope annotation first line (principle 10), Authoritative-for
  header present, §1.7 self-reflection present (principle 13). ✅
- **T3 (verified citations):** every file:line citation verified by reading the actual file from the
  correct container (`aif-handoff-api-1` for taskEvents.ts/tasks.ts; `aif-handoff-agent-1` for
  coordinator.ts/planner.ts). Container specification included per-citation. ✅
- **T16 (pattern-matching-on-name):** `parallel_enabled=1` does not create worktrees — proven by
  live DB (3 full-mode tasks post-flip all have `worktree_path=null`), source code (planner never
  called for `accept_existing_plan`-dispatched tasks), and coordinator logs. ✅
- **T2/T4:** no production code written; fix paths proposed with evidence, not implemented. ✅
- **recommendation-laziness-discipline §3:** verdicts backed by file:line evidence. ✅

### §9.2 Backward-check

- **Extends** 2026-06-01 Finding A — fires the stated falsifier («wrong if enabling
  `parallel_enabled` still does not create worktrees»); does not edit the prior patch.
- **Does not supersede** Finding F (park guard, PR #361 shipped) — orthogonal.
- **Does not conflict** with existing bridge rollback path (AifHandoffBackend.ts:199–203).
- **No capability commit** — research only; no `Prior-art:` trailer required.

### §9.3 Container-sourcing note (retrospective on prior draft)

The first draft of this patch searched for `taskEvents.ts` in `aif-handoff-agent-1` (the agent
container), got no result, and in the WG1 narrative treated the file as absent — while simultaneously
quoting its content (copied from the session's earlier reads of `aif-handoff-api-1`). This is the
`#discipline-application-scope-blindness` sub-case (c): unverified citation where the file:line
evidence was real but the container reference in the prose was wrong. Correction applied: all
citations now specify the container explicitly. The mechanism described (WG1 — planner-skip as
primary bypass, branchName preemption as secondary) is verified correct against the actual source.

### §9.4 T-trap audit

- **T3 (no prose-only findings):** every claim has file:line + container spec. ✅
- **T6 (calibrated confidence):** WG1 = high (stateMachine.ts:42–46 + coordinator.ts:78–84 +
  taskEvents.ts:265–282 + live DB all converge); WG4 = high (prior patch §1.2 + env confirm); WG5
  fix options = medium (Option C safe; Option B needs live test per ATTN-2). ✅
- **T16 (name ≠ effect):** `parallel_enabled=1` ≠ worktrees created — full causal chain traced. ✅
- **T15 (self-application, §9.3):** container-sourcing error surfaced and corrected. ✅

---

## §10 ATTN (open items, not implemented)

**ATTN-1 (secondary dirty-tree gate bypass):** `AIF_TASK_WORKTREES_ENABLED=true` tells the
coordinator to skip the dirty-tree gate before auto-queue advance — but worktrees are not being
created. Ask maintainer: should `AIF_TASK_WORKTREES_ENABLED` remain true given worktrees are not
actually provisioned by bridge dispatch? Setting it to false would re-enable the dirty-tree gate
but remove the three-gate worktree condition (gates 1+2+3 would all still need to pass for auto-queue
worktrees). Needs a DECISION before the next aif upgrade.

**ATTN-2 (Option B plan-overwrite risk):** before implementing Option B (dispatch without
`accept_existing_plan`), verify live whether `runPlanner` with `plannerMode='full'` and a
pre-pushed plan on disk preserves or overwrites the plan content. The planner subagent (`/aif-plan
full @<planPath>`) may read the existing file and produce «plan looks complete» without overwriting —
or it may overwrite. Do not implement without this test.

**ATTN-3 (worktree accumulation):** from prior patch §2.1 — if Option B is adopted and worktrees
are created, aif does not automatically remove them after `done`/`verified`. Monitor disk usage;
add a periodic cleanup step (`git worktree prune`) to the maintenance runbook.

---

## Tags

`#aif-worktree-gap` `#accept-existing-plan-planner-skip` `#runplanner-never-called` `#worktree-code-unreachable`
`#parallel-enabled-necessary-not-sufficient` `#dirty-worktree-persists` `#serial-lock-compounding`
`#finding-a-correction` `#container-sourcing-error-corrected`
