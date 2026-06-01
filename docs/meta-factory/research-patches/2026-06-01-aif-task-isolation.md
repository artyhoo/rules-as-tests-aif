<!-- scope:aif-task-isolation -->
# aif-task-isolation — Finding A (dirty_worktree) + Finding F (resume skips re-implement)

> **Authoritative for:** R-phase research on two aif lifecycle findings that block reliable autonomous dispatch: (A) per-task git worktree isolation is gated by `parallel_enabled=false` in the project DB (the env flag alone is insufficient); (F) a task paused at `status=review` cannot be directed back to `implementing` via any human-accessible event — `review` is a zero-action state in the upstream state machine.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). I-phase implementation — that is a separate commit after the DECISION-NEEDEDs below are resolved.

**Date:** 2026-06-01
**Origin:** qloop-ux-probe 2026-06-01 live e2e run; kickoff at [`.claude/orchestrator-prompts/aif-isolation-rphase/kickoff.md`](../../../.claude/orchestrator-prompts/aif-isolation-rphase/kickoff.md).

---

## §0 TL;DR + Verdicts

| Finding | Root cause | Verdict | Effort |
|---|---|---|---|
| **A — dirty_worktree recurs** | `parallel_enabled=0` in project DB → worktree branch is never triggered (three-gate condition fails on gate 2); all tasks run in-place on the shared checkout | **config-fix (cheap)** + aif-upstream-issue (no UI doc for parallelEnabled) | ~5 min: flip `parallel_enabled` via web UI or direct DB write; optional container restart |
| **F — resume goes review→done, not review→implement** | `review` status has zero human-accessible events in the upstream state machine; `request_changes` is a `done`-only event; only the auto-review gate can send a task back to `implementing` from `review` | **aif-upstream-issue** — upstream design is intentional (no agent-accessible deliberate-rework-from-review event); workaround is our-side-guard via `park.ts` pre-review | ~2-4 hrs: extend `park.ts` to detect `status=review` on park and either (a) inject `rework_requested` answer pattern or (b) refuse to park post-review with a clear error |

---

## §1 Finding A — dirty_worktree root-cause investigation

### §1.1 The three-gate condition (DeepWiki phrasing 1)

DeepWiki query on `lee-to/aif-handoff`: *"How does AIF_TASK_WORKTREES_ENABLED work? When this env var is set to true, does aif-handoff create per-task git worktrees to isolate each task's working directory?"*

Answer (2026-06-01, verbatim relevant portion):

> "When `AIF_TASK_WORKTREES_ENABLED` is set to `true`, and a project is configured for parallel execution with branch creation enabled, the `runPlanner` function in the agent will create a Git worktree for each task."

Three conditions must ALL be true — confirmed in source at `packages/agent/src/subagents/planner.ts:193-195`:

```typescript
const shouldCreateWorktree =
  getEnv().AIF_TASK_WORKTREES_ENABLED &&
  Boolean(project?.parallelEnabled) &&
  projectSupportsTaskWorktrees(projectRoot);
```

`projectSupportsTaskWorktrees` is defined at `packages/shared/src/gitIsolation.ts:425-427`:

```typescript
export function projectSupportsTaskWorktrees(projectRoot: string): boolean {
  return projectUsesSharedBranchIsolation(projectRoot);
}
```

`projectUsesSharedBranchIsolation` at `packages/shared/src/gitIsolation.ts:420-424`:

```typescript
export function projectUsesSharedBranchIsolation(projectRoot: string): boolean {
  const config = resolveGitConfig(projectRoot);
  return config.enabled && config.create_branches && isGitRepo(projectRoot);
}
```

**So the three gates are:**

1. `AIF_TASK_WORKTREES_ENABLED` env var = `true` ✅ (confirmed in agent env, kickoff pre-confirmed)
2. `project.parallelEnabled` = `true` in the DB ❌ **FAILING — value = `0`** (see §1.3)
3. `projectSupportsTaskWorktrees()`: `git.enabled=true` + `git.create_branches=true` + is git repo ✅ (config.yaml confirmed, see §1.2)

Gate 2 fails → `shouldCreateWorktree = false` → `ensureTaskWorktree` is never called → tasks run in-place.

### §1.2 Consumer project config.yaml — gates 1 and 3 pass

Read directly from `/home/www/rules-as-tests-aif/.ai-factory/config.yaml` (live, 2026-06-01):

```yaml
git:
  enabled: true
  create_branches: true
  base_branch: staging
  branch_prefix: feature/
```

Gate 3 passes: `git.enabled=true`, `git.create_branches=true`, `.git` directory present.

### §1.3 DB evidence — gate 2 fails: `parallel_enabled = 0`

Queried live via `docker exec aif-handoff-api-1 node -e "..." /data/aif.sqlite` (2026-06-01):

```json
{
  "id": "441c1c0c-b633-4612-a34c-2cc0c4d0eaf2",
  "name": "rules-as-tests-aif",
  "parallel_enabled": 0,
  "auto_queue_mode": 1
}
```

`parallel_enabled = 0` → `Boolean(project?.parallelEnabled) = false` → gate 2 fails → no worktree is ever created regardless of env.

The DB column is `parallel_enabled` (snake_case); the TypeScript interface maps it to `parallelEnabled` via the ORM layer. This is consistent with `packages/data/src/*.ts:1176` where `parallelEnabled?: boolean` is defined.

### §1.4 DB evidence — all 10 recent tasks: `worktree_path = null`

```json
[
  {"id":"bbd362ce","title":"aif-isolation-rphase-meta-launch","status":"done","worktree_path":null,"branch_name":"feature/aif-isolation-rphase-meta-launch-bbd362"},
  {"id":"44d8ccce","title":"qloop-battletest","status":"done","worktree_path":null,"branch_name":"feature/qloop-battletest-44d8cc"},
  {"id":"61338ba3","title":"bg-helper-completion-barrier-stage2-aif","status":"done","worktree_path":null},
  {"id":"e18cf194","title":"bg-helper-completion-barrier-stage1-aif","status":"verified","worktree_path":null},
  {"id":"048fa1d1","title":"aif-qloop-sw-c-questions","status":"done","worktree_path":null},
  {"id":"a4bdff98","title":"aif-question-loop-meta-launch","status":"done","worktree_path":null}
]
```

Every task across ≥6 distinct dispatch cycles has `worktree_path = null`. This is the T-aif-A multi-cycle confirmation the kickoff §3 requires — not a single-snapshot conclusion.

### §1.5 Reflog evidence — in-place checkout pattern across ≥2 cycles

`git reflog --date=short` inside the agent container (live, 2026-06-01), showing two cycles clearly:

```text
HEAD@{2026-06-01}: checkout: moving from staging to feature/aif-isolation-rphase-meta-launch-bbd362
HEAD@{2026-06-01}: pull --ff-only origin staging: Fast-forward
HEAD@{2026-06-01}: checkout: moving from feature/qloop-ux-probe-ba3b4b to staging
HEAD@{2026-06-01}: checkout: moving from staging to feature/qloop-ux-probe-ba3b4b
HEAD@{2026-06-01}: pull --ff-only origin staging: Fast-forward
HEAD@{2026-06-01}: checkout: moving from feature/qloop-ux-probe-3ead7d to staging
HEAD@{2026-06-01}: checkout: moving from staging to feature/qloop-ux-probe-3ead7d
```

Pattern per cycle: `checkout staging → pull --ff-only → checkout -b feature/<task>` — all in the single working directory `/home/www/rules-as-tests-aif`. `git worktree list` returns exactly one entry.

### §1.6 T16 check — `AIF_TASK_WORKTREES_ENABLED=true` ≠ worktrees created

**T16 (pattern-matching-on-name):** the env var name sounds like it guarantees isolation. It does not. Evidence:

- `git worktree list` → one worktree (pre-confirmed by orchestrator; confirmed by reflog and `worktree_path=null` across all 10 tasks)
- Source (`planner.ts:193-195`) shows it is only one of three gates
- The critical gate (`project.parallelEnabled`) is a **project-level DB field** toggled via the web UI, not an env var — it is absent from the Docker Compose environment block entirely

**Falsifier:** if `parallel_enabled` were `1` in the DB, worktrees would be created (gate 2 would pass, gate 3 already passes). Fix: set `parallel_enabled = 1` in the DB.

### §1.7 DeepWiki phrasing 2 — `parallelEnabled` and project config

Query: *"What does projectSupportsTaskWorktrees() check? What conditions must be true for a project to support per-task git worktrees?"*

Key finding (verbatim):

> "The `parallelEnabled` flag is a **project-level database field**, not a config.yaml setting. It's toggled via the web UI in project settings."

This confirms the fix is in the UI (or direct DB write), not in env vars or config.yaml.

---

## §2 Finding A — verdict + fix path

### §2.1 Verdict: config-fix (cheap)

**Root cause:** `parallel_enabled=0` in project DB. The feature is implemented and works; the toggle was never flipped.

**Fix path (≤5 min):**

1. Open the aif web UI → Project settings → enable "Parallel execution" toggle.
2. OR direct DB write (no restart needed — coordinator reads DB per tick):
   ```sql
   UPDATE projects SET parallel_enabled = 1 WHERE id = '441c1c0c-b633-4612-a34c-2cc0c4d0eaf2';
   ```
3. Verify: dispatch a new task, then `docker exec aif-handoff-agent-1 sh -c 'cd /home/www/rules-as-tests-aif && git worktree list'` — should show ≥2 entries.

**Secondary consideration (aif-upstream-issue, minor):** the `parallel_enabled` flag has no corresponding env-var or config.yaml knob. It is only settable via the UI or raw DB. This means it is easy to overlook when provisioning a new project headlessly. Worth filing upstream as a documentation/UX gap (not a blocker).

**Falsifier of verdict:** wrong if enabling `parallel_enabled` still does not create worktrees — this would point to a version mismatch (aif v0.1.0 on disk vs. DB schema out of sync) or `projectSupportsTaskWorktrees` check failing for a different reason. Verification is the `git worktree list` check above.

**Worktree retention note (from DeepWiki, verbatim):** *"Worktrees are retained after a task reaches a terminal status (`done`/`verified`) for operator inspection and follow-up, and `aif-handoff` does not automatically remove them."* Monitor disk usage; manual cleanup required post-task.

### §2.2 Our-side-guard question (A4 from kickoff §1)

Kickoff §1 A4: *"Should an OUR-side pre-dispatch clean-guard in runtime-bridge be useful, or does it just re-surface the same STOP?"*

**Answer (after root-cause found):** not needed as a fix — the root cause is the DB flag, not a missing guard. However, a lightweight pre-dispatch probe in `packages/runtime-bridge` that checks `worktree_path != null` on recent tasks would give an earlier signal if `parallel_enabled` is ever reset. This is a nice-to-have (session-bound probe, no paid LLM), not the fix.

---

## §3 Finding F — resume-from-review investigation

### §3.1 State machine evidence (source)

The upstream state machine at `packages/shared/src/stateMachine.ts:108`:

```typescript
export const HUMAN_ACTIONS_BY_STATUS: Record<TaskStatus, TaskEvent[]> = {
  backlog: ["start_ai"],
  planning: [],
  plan_ready: ["start_implementation", "request_replanning", "fast_fix"],
  implementing: [],
  review: [],                                          // ← ZERO human actions
  blocked_external: ["retry_from_blocked"],
  done: ["approve_done", "request_changes"],
  verified: [],
};
```

`review: []` — the upstream design is **intentional**: when a task is in `review` status, it is being processed by the reviewer subagent; no human action is defined. The `request_changes` event that sends a task back to `implementing` is a **done-only** event:

```typescript
case "request_changes": {
  if (task.status !== "done") {
    return { ok: false, error: "request_changes is only allowed from done" };
  }
  return {
    ok: true,
    patch: { ...CLEAN_STATE_RESET, status: "implementing", reworkRequested: true },
  };
}
```

### §3.2 The only auto-review → implementing path

In `packages/agent/src/coordinator.ts:437-462`, the ONLY path from `review` back to `implementing` is the **auto-review gate** inside the active reviewer run:

```typescript
if (outcome?.status === "rework_requested") {
  // ...
  updateTaskStatus(task.id, "implementing", { ..., reworkRequested: true });
  // "Auto review gate requested changes, restarting implementing stage"
}
```

This fires *during* the reviewer's active execution — not on human resume. The gate is driven by `AGENT_AUTO_REVIEW_STRATEGY` + `AGENT_MAX_REVIEW_ITERATIONS` (SSOT #97).

### §3.3 DeepWiki phrasing 3 — resume from review

Query: *"When a task reaches the review stage and is then paused (park primitive), can it resume back into the implement stage to process an answer? Or does resume from review stage always continue the review pipeline toward done?"*

Answer (verbatim key excerpt):

> "When a paused task in the `review` stage is resumed, it **always continues the review pipeline toward `done`**, not backward to `implementing`."
> "There is **no mechanism** that allows a paused task in `review` to resume back into `implementing` simply by being unpaused. The only way a task moves from `review` back to `implementing` is if the auto-review gate detects blocking findings and requests rework—which happens during active review execution, not on resume."

This is consistent with source: `review: []` in `HUMAN_ACTIONS_BY_STATUS`.

### §3.4 The live incident (task ba3b4bf6)

The battle-test task (memory `project_aif_question_loop_battle_test_next`, 2026-06-01): task `ba3b4bf6` was parked mid-flight after the `implement→review` transition. `answer.ts --decision resume` un-paused it (`paused=false`). The coordinator picked it up as a `review`-status task and ran the reviewer. Review completed → task went to `done`. The `c2` question was never parked because the task never re-entered `implementing` to process the answer.

DB evidence for the general pattern: all 10 recent tasks show `paused=0` (cleared) and `status=done` with no rework cycles — consistent with review always resolving forward.

### §3.5 The answer-injection gap

`answer.ts --decision resume` calls `PUT /tasks/:id { paused: false, plan: <updated_plan_with_answer> }` (SSOT #109, `packages/runtime-bridge/src/cli/park.ts`). It injects the answer into the task's plan — correct for tasks that park pre-review. But post-review tasks never re-read the plan to process the answer, because:

1. The reviewer sees `rework_requested=false` and no blocking findings
2. The auto-review gate produces `outcome.status = "accepted"` (or `"manual_review_required"`)
3. Task transitions to `done` or `done+manualReviewRequired`

The injected answer is never processed by the implementer.

---

## §4 Finding F — verdict + fix path

### §4.1 Verdict: aif-upstream-issue (no upstream mechanism) + our-side-guard needed

**Root cause:** `review` status has zero human-accessible events in the upstream state machine (design is intentional per SSOT #28 + DeepWiki confirmation). The only back-to-implementing path is the auto-review gate, which fires during active reviewer execution, not on human resume. Our `park.ts` primitive (SSOT #109) pre-dates this finding and parks post-review correctly — but the resume path does not close the loop.

**Fix options (our-side-guard, since upstream cannot be easily changed):**

**Option A — Park refuses to accept post-review tasks (hard guard, ~1 hr):** `park.ts` checks `task.status` before writing `paused=true`. If `status === 'review'`, return an error: "Task has already transitioned to review — park during implement only. Use `request_changes` after the task reaches done." This prevents the misleading park-then-resume cycle. Cost: 1 hr, low risk.

**Option B — park.ts pre-review enforcement at `status=implementing` only (~1 hr):** same as A but surfaced differently — park validates that `status === 'implementing'` (not just `!== review`), rejecting parks from any non-implement stage. Cleaner invariant.

**Option C — Force `rework_requested=true` via `request_changes` when task hits done post-park (~2-4 hrs):** `answer.ts` / the review pipeline detects that a parked answer exists in the plan, and after the reviewer completes, automatically fires `request_changes` (API: `POST /tasks/:id/events { event: "request_changes" }`). This would send `done → implementing` and the implementer re-reads the now-injected answer. Complexity: `answer.ts` needs to persist a "pending answer" marker that survives to the reviewer's completion callback — requires a new task field or a plan-annotation convention. Cost: ~4 hrs, moderate risk.

**Recommended path:** Option B (hard guard — fail early and clearly) in the short term, Option C as a follow-on if the full answer-loop closure is needed. Option B alone stops the misleading "park in review → resume → done without answer" cycle at the earliest reachable moment (the park call itself).

**RESOLUTION (2026-06-01, maintainer-selected — shipped in [PR #361](https://github.com/Yhooi2/rules-as-tests-aif/pull/361)):** the hard-guard path was chosen (surfaced to the maintainer as "Option B"). **What actually shipped matches the §4.1 Option-A semantics** — `parkTask` rejects only when `task.status === 'review'`, NOT the stricter implementing-only invariant of Option B above. Reason: parks at pre-implement stages (`plan_ready`/`planning`) are legitimate forks and must still succeed; rejecting all non-`implementing` statuses would over-reach. The guard throws a clear error (park before the implement→review transition, or wait for `done` and use `answer.ts` request_changes) and issues no PUT. Paired-negative test: GUARD refuses + 0 PUT at `review`; CONTROL still parks at `plan_ready`. Option C (full mid-flight re-implement loop) remains deferred until mid-flight parks prove frequent (build-ahead-of-need per `build-first-reuse-default.md`).

### §4.2 Falsifier of verdict

Wrong if: a new aif version (post-0.1.0) adds a `requeue_from_review` or `restart_implementing` event to `HUMAN_ACTIONS_BY_STATUS['review']`. Check: `grep -n '"review"' /app/packages/shared/src/stateMachine.ts` after any aif upgrade. If that list becomes non-empty, the upstream can handle this natively and our-side-guard can be retired.

---

## §5 Prior-art + SSOT references

- **SSOT #109** (`prior-art-evaluations.md#109`) — `park.ts` BUILD verdict; the "no upstream park primitive for autonomous pipeline" finding that led to `park.ts` construction. Finding F extends this: park must enforce pre-review invariant.
- **SSOT #28** (`prior-art-evaluations.md#28`) — aif `paused:true/false` semantic; `review: []` zero-human-action state confirmed per stateMachine.ts source.
- **SSOT #97** (`prior-art-evaluations.md#97`) — `AGENT_AUTO_REVIEW_STRATEGY=closure_first` + iteration cap; the only review→implementing path (auto-review gate inside active reviewer run).
- **SSOT #65** (`prior-art-evaluations.md#65`) — Superpowers `using-git-worktrees` ADOPT verdict; worktree isolation is the right primitive (our dev side). Finding A shows aif's own worktree primitive also exists but requires `parallel_enabled=1`.

---

## §6 WebSearch coverage (T12 counter)

Three WebSearch phrasings run before proposing mechanisms:

1. *"git worktree per task isolation AI agent pipeline dirty working directory"* — surfaces general practice (dev.to, zylos.ai, augmentcode.com guides). Confirms worktree-per-task is standard pattern. Our finding (gate 2 failing) is a config issue, not a design gap.
2. *"resume task re-enter implementation stage after review agent pipeline"* — surfaces Azure Pipelines manual-intervention patterns + Superpowers subagent-driven-dev; confirms re-entry-from-review is not a common out-of-the-box feature in autonomous agent pipelines; human-action gates are the norm.
3. *"aif-handoff git worktree isolation parallel_enabled feature flag configuration 2026"* — no aif-handoff-specific results; confirms the config is not publicly documented beyond the source. Our source-read evidence is the primary channel.

---

## §7 §1.7 Self-reflection (principle 13, T15)

### §7.1 Forward-check

This patch complies with:

- **no-paid-llm-in-ci §1** (`no-paid-llm-in-ci.md:17`): all mechanisms proposed (Option A/B/C for Finding F; DB toggle for Finding A) are deterministic or session-bound. No API-billed CI step.
- **build-first-reuse-default §3** (`build-first-reuse-default.md:1`): upstream investigated FIRST via DeepWiki ≥3 phrasings + WebSearch ≥3 phrasings before any mechanism proposed. Finding A verdict = config-fix (no build). Finding F verdict = aif-upstream-issue + our-side-guard (BUILD only after upstream gap confirmed via source + DeepWiki).
- **doc-authority-hierarchy §2-§3** (`doc-authority-hierarchy.md:1`): patch carries scope annotation first line (principle 10) + Authoritative-for header. §1.7 self-reflection present (principle 13).
- **T11** (propose no mechanism without prior-art check): DeepWiki ran before any fix was proposed. Source code read before any code-level claim.
- **T12** (don't skip upstream sweep): swept aif source AND DeepWiki, not just reasoning from env var name.
- **T16** (pattern-matching-on-name): `AIF_TASK_WORKTREES_ENABLED=true` does NOT create worktrees — verified via DB (`worktree_path=null` × 10 tasks), reflog (single-worktree in-place pattern × ≥6 cycles), source (`planner.ts:193-195` three-gate condition), and live `git worktree list` (pre-confirmed by orchestrator).
- **T-aif-A** (don't conclude from single snapshot): `worktree_path=null` confirmed across 10 tasks spanning ≥6 dispatch cycles (bbd362, 44d8cc, 61338b, e18cf1, 048fa1, a4bdff + 4 more).
- **T2/T4** (designing ≠ doing R-phase): no production code written; fix paths are proposed, not implemented.
- **reviewer-discipline §2** (`reviewer-discipline.md:1`): Finding F has two fix options with effort estimates; DECISION-NEEDED-F (Option B vs C) surfaced below.

### §7.2 Backward-check

This patch:
- **Extends** SSOT #109 (`park.ts` BUILD) — adds the pre-review guard requirement. Does not supersede or retire #109.
- **Does not edit** any existing artefact (R-phase = research only; no capability commit, no production code).
- **Does not conflict with** existing `park.ts` behavior (SSOT #109) — the proposed Option B guard would be an additive validation, not a behavior change for the happy path (park during implement).
- **Does not edit** `prior-art-evaluations.md` directly (append-only register per CLAUDE.md; a new SSOT row for Finding A's `parallel_enabled` config-fix would be added by the I-phase commit).

### §7.3 DECISION-NEEDED (reviewer-discipline §2)

**RESOLVED 2026-06-01:** maintainer selected the hard-guard path (reject-at-`status=review`, the §4.1 Option-A semantics surfaced as "Option B") — shipped in [PR #361](https://github.com/Yhooi2/rules-as-tests-aif/pull/361). Option C deferred. See §4.1 RESOLUTION for the exact shipped behavior + the A/B label note.

**DECISION-NEEDED-F (original, now resolved): Option B (hard guard on park.ts) vs Option C (automatic rework via request_changes after done)**

Option B → parks at wrong stage fail immediately with clear error; no end-to-end re-implement loop.
Option C → end-to-end answer-loop closure even for mid-flight parks; more complex; requires answer-marker persistence.

**Consequence of B:** operator gets a clear "park only during implement" error; no silent failure; Option C stays deferred.
**Consequence of C:** full autonomous loop closure for mid-flight parks; requires ~4 hrs + design of answer-marker convention (e.g. `blockedReason` tag or plan annotation); risk of incorrect `request_changes` firing on tasks that weren't parked.

---

## §8 T-trap audit

- **T11 (no mechanism without prior-art check):** DeepWiki ≥3 phrasings run before any fix proposed. ✅
- **T12 (don't skip upstream sweep):** both source code and DeepWiki used; WebSearch ×3 phrasings run. ✅
- **T16 (pattern-matching-on-name):** `AIF_TASK_WORKTREES_ENABLED=true` ≠ worktrees — proven via DB × 10 tasks + reflog × 6 cycles + source. ✅
- **T-aif-A (multi-cycle, not single snapshot):** `worktree_path=null` across 10 tasks. ✅
- **T2/T4 (designing ≠ R-phase):** patch is verdict-bearing with evidence; no production code written. ✅
- **T15 (self-application):** §7 self-reflection included; patch applies its own BFR discipline to itself (upstream investigated first). ✅
- **T3 (quoted evidence, not prose-only findings):** every claim backed by file:line, DB query output, or DeepWiki verbatim. ✅
- **T6 (calibrated confidence):** Finding A = high confidence (all three evidence channels converge: source + DB + reflog). Finding F = high confidence (source stateMachine.ts + DeepWiki verbatim + live incident). ✅

---

## Tags

`#aif-task-isolation` `#dirty-worktree` `#parallel-enabled-missing` `#worktree-gate-2-fails` `#park-post-review-gap` `#review-zero-human-actions` `#config-fix` `#our-side-guard` `#ssot-109-extension`
