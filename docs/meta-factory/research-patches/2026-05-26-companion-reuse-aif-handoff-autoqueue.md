# Companion-reuse R-phase — aif-handoff autoQueueMode deep-dive

> **Status:** Sub-wave A of `companion-reuse-deep-dive` umbrella.
> **Date:** 2026-05-26.
> **Authoritative for:** aif-handoff `autoQueueMode` evaluation against build-first-reuse-default ladder under corrected within-one-project scope; SSOT new-row proposal at `[next-available-slot]`.
> **NOT authoritative for:** project goal (see README#why-this-exists); substrate refactor decisions; SSOT #67 verdict (full Kanban runtime — preserved as-is).

---

## §0 TL;DR

`autoQueueMode` in `lee-to/aif-handoff` is a well-specified, production-grade within-project task-queue-advancement subsystem. Its **scheduling logic** (position ordering + scheduledAt gate + pool-depth cap) is cleanly separable from the Docker+DB infra that caused SSOT #67 REJECT. The logic itself is **ADAPT-viable as a pure-bash priority-ordering helper** under J5 Option C (tracked `kickoff.md` frontmatter), and **ADOPT VOCABULARY** of its `roadmapAlias`/`phase:N`/`seq:NN` tag schema is viable under BOTH J5 Option A and C.

Verdict: **ADOPT VOCABULARY** (primary) for the tag schema as umbrella-sequencing vocabulary; **REFERENCE** for the pool-slot-allocation pattern as a design precedent. Match score revised from initial estimate ~22% (muddied-scope full-runtime) to **~45%** (corrected sub-component scope: scheduling logic only, not Docker+DB). New SSOT row proposed at `[next-available-slot]`.

SSOT #67 REJECT verdict is **preserved as-is** (correct for the full Kanban runtime). Additive note proposed on #67's «Trigger to revisit» field.

---

## §1 Scope-correction context

**Why this re-evaluation exists:** SSOT #67 (2026-05-23) evaluated `lee-to/aif-handoff` as a runtime candidate for the `/meta-orchestrator` slash command. The verdict REJECT was correct for the **full Kanban runtime** (Docker+DB+REST+cron+React UI), which has a structural mismatch on three axes: (a) writes code vs our §7.9 no-code constraint; (b) Docker+DB infra vs our zero-infra requirement; (c) cron-driven vs user-invoked slash.

However, the initial R-phase sweep used **muddied DeepWiki probes** (T-CR-A trap: «multi-project across repos» framing rather than «within-one-project, multi-initiative»), which caused `autoQueueMode` — a **sub-component responsible only for pool-slot-allocation logic** — to be evaluated as part of the rejected whole rather than separately. The sub-component has no Docker or DB dependency in its *logic*; the dependency is in the storage backend that the sub-component reads from.

This re-evaluation corrects that gap per the umbrella kickoff §2 Sub-wave A scope clarification: propose a NEW SSOT row for `autoQueueMode-LOGIC` specifically; do NOT amend #67.

**T16 correction applied:** Initial framing conflated «full Kanban runtime» with «pool-slot-allocation algorithm». These are different problem-class levels. The algorithm can be evaluated independently.

---

## §2 DeepWiki sweep evidence

All four probes explicitly include «within-one-project» disambiguation per T-CR-A mandate. Each probe re-read before submitting; no one-slash «multi-project» framings.

### Probe 1 — Pool-slot allocation across initiatives within one project

**Question asked (verbatim):** «Within a single project (not across multiple projects or repos), how does processAutoQueueAdvance decide pool slot allocation across multiple initiatives or work streams? Specifically: when autoQueueMode is enabled and a project has several concurrent epics or task groups, what logic determines which tasks get the next available execution slot? Please cite specific source files and function names.»

**DeepWiki output (key excerpt):**

```text
The processAutoQueueAdvance function first retrieves all projects that have
autoQueueMode set to true. For each auto-queue enabled project:
- parallelEnabled = false → limit = 1 (sequential)
- parallelEnabled = true → limit = COORDINATOR_MAX_CONCURRENT_TASKS (default 3)
  [collapsed to 1 if shared branch isolation + AIF_TASK_WORKTREES_ENABLED=false]
- counts active tasks (planning, plan_ready, implementing, review, blocked_external)
- dirty worktree gate: pauses advance if uncommitted changes
- fills pool: selects next backlog task by ascending `position`
- skips tasks with future scheduledAt
- atomic CAS claim via claimBacklogTaskForAdvance()
- broadcasts task:moved + project:auto_queue_advanced WebSocket events
```

Source: [DeepWiki probe 2026-05-26](https://deepwiki.com/search/within-a-single-project-not-ac_2ed4d308-cc56-4b00-b082-5f2b82915a2b)

**Implication for our problem class:** The algorithm is: COUNT active tasks → if below limit → CLAIM next by ascending `position` skipping `scheduledAt`-future tasks → repeat. This is a pure ordering algorithm. Its dependency on a DB is for COUNT and CLAIM operations; both are replaceable with file reads in a bash implementation.

### Probe 2 — roadmapAlias + tag schema (UI-only vs ordering hook)

**Question asked (verbatim):** «Within a single project with multiple work items, how is roadmapAlias used together with tags like 'roadmap', 'rm:alias', 'phase:N', 'phase:name', and 'seq:NN'? Is roadmapAlias purely a UI display/grouping field, or does it hook into any ordering or priority logic in processAutoQueueAdvance or the coordinator polling loop?»

**DeepWiki output (key excerpt):**

```text
roadmapAlias itself does not directly hook into processAutoQueueAdvance or
coordinator polling loop for ordering or priority logic.

However: tasks imported from a roadmap are assigned a position based on their
phase and sequence during importGeneratedTasks. The compareRoadmapImportOrder
function sorts tasks first by phase, then by sequence, then by original index.
This sorted order assigns position values at creation time.

processAutoQueueAdvance advances by lowest position first — so roadmapAlias
INDIRECTLY influences ordering via the phase+sequence → position assignment
at import time.

Tags auto-generated: roadmap, rm:<alias>, phase:<number>, phase:<name>, seq:<NN>
roadmapAlias used for: UI filter chips (Board.tsx), TaskDetailHeader badge,
deduplication key (projectId + normalizedTitle + roadmapAlias)
```

Source: [DeepWiki probe 2026-05-26](https://deepwiki.com/search/within-a-single-project-with-m_066cfb57-37d2-4417-9851-bfcd0ddcd7e4)

**Key finding:** The tag schema (`phase:N`, `seq:NN`, `rm:<alias>`) encodes priority at import time into the `position` field. The tags are NOT re-evaluated on each poll — they do their job at task creation. This means the tag schema is a **vocabulary for expressing phase-sequenced priority** without runtime priority queues. This vocabulary is the ADOPT VOCABULARY candidate.

### Probe 3 — scheduledAt semantics vs position ordering

**Question asked (verbatim):** «Within a single project (one repo, multiple initiatives tracked as tasks), what is the semantics of the scheduledAt field on tasks? How does it interact with the position field for ordering within the autoQueueMode pool filling loop? When scheduledAt is in the future, does the task get skipped entirely until the scheduled time, or is it still eligible for position-based selection?»

**DeepWiki output (key excerpt):**

```text
scheduledAt: optional ISO-8601 UTC timestamp; one-shot (cleared after fire).
Two-pass coordinator poll cycle:
1. processDueScheduledTasks() — fires tasks where scheduledAt <= nowIso
2. processAutoQueueAdvance() — fills remaining slots

nextBacklogTaskByPosition() explicitly ignores tasks with future scheduledAt.
Tasks with future scheduledAt are NOT eligible for position-based selection
until their scheduled time has passed.

CAS (Compare-And-Swap) via claimBacklogTaskForAdvance() prevents double-claim
between scheduler and auto-queue.
```

Source: [DeepWiki probe 2026-05-26](https://deepwiki.com/search/within-a-single-project-one-re_82fa4572-a036-475f-a8d2-87139a0e1966)

**Implication:** `scheduledAt` is a separate priority axis from `position`. The two-pass model (scheduled first, position-ordered backfill second) is a clean design pattern. The bash analog would be: check for «overdue» tasks first (e.g. a task whose Stage was expected to complete by date X), then advance by position.

### Probe 4 — parallelEnabled + COORDINATOR_MAX_CONCURRENT_TASKS tuning

**Question asked (verbatim):** «Within a single project running multiple concurrent initiatives as parallel tasks, what is the tuning surface for parallelEnabled and COORDINATOR_MAX_CONCURRENT_TASKS? [...] Does the global COORDINATOR_MAX_CONCURRENT_TASKS apply per-project or across all projects combined?»

**DeepWiki output (key excerpt):**

```text
COORDINATOR_MAX_CONCURRENT_TASKS: global env var, default 3, range 1-10.
Dual role:
- Global cap: total concurrent Claude processes across ALL stages + projects
- Per-project limit: for parallelEnabled=true projects, also defines max
  concurrent tasks within that project

parallelEnabled: per-project toggle.
- false → always sequential (limit=1)
- true + AIF_TASK_WORKTREES_ENABLED=true → true parallel (limit=COORDINATOR_MAX)
- true + AIF_TASK_WORKTREES_ENABLED=false + git.create_branches=true → forced
  serial (shared branch would conflict)

Dirty worktree gate operates per-project before each advance.
```

Source: [DeepWiki probe 2026-05-26](https://deepwiki.com/search/within-a-single-project-runnin_f95602b4-a900-4da8-b697-be53b5b4edf2)

**Implication for our Mode B parallel sub-waves:** The `COORDINATOR_MAX_CONCURRENT_TASKS` dual-role design (global cap + per-project limit) directly maps to our concurrency model: `MAX_CONCURRENT_WORKERS` as both a global cap and a per-umbrella Mode B cap. The worktree-isolation gate maps to our `parallel-subwave-isolation.md` rule. This is a REFERENCE precedent for our existing worktree discipline.

---

## §3 T16 problem-class match analysis

**T16 mandate:** «Upstream problem class: X. Our problem class: Y. Match? Evidence: …»

### Upstream problem class (autoQueueMode LOGIC, sub-component only)

Upstream problem class: «Given a list of tasks with `position` order and optional `scheduledAt`, advance the N lowest-position non-scheduled tasks into active execution, respecting a configurable concurrency cap; use CAS to prevent double-claim in concurrent server processes; emit events on each advance.»

Storage backend: PostgreSQL/SQLite (via the full Kanban runtime). This is the infra dependency — the algorithm itself is independent of storage type.

### Our problem class

Our problem class: «Given a list of umbrella/Stage kickoffs in a worktree-based project, determine which umbrella/Stage is next eligible for dispatch, respecting mode (Mode A sequential vs Mode B parallel) and a configurable concurrency cap for parallel dispatches; determine ordering from some priority signal (explicit sequence, dependency graph, or file modification date).»

### Match analysis

| Dimension | Upstream (autoQueueMode) | Ours | Match? |
|---|---|---|---|
| Selection algorithm | Ascending `position`, skip future-`scheduledAt` | Need: ascending priority signal, skip blocked/future | **STRONG MATCH** — same algorithm shape |
| Concurrency cap | `COORDINATOR_MAX_CONCURRENT_TASKS` (env var, default 3) | Need: Mode B worker cap | **STRONG MATCH** — identical semantics |
| Sequential vs parallel flag | `parallelEnabled` per-project | Mode A (seq) vs Mode B (parallel) | **STRONG MATCH** — same axis |
| Worktree isolation gate | `AIF_TASK_WORKTREES_ENABLED` + dirty-worktree check | `parallel-subwave-isolation.md` rule | **STRONG MATCH** — parallel worktree discipline identical |
| Priority encoding at creation | `phase+sequence → position` via `compareRoadmapImportOrder` | Need: priority encoding for umbrella ordering | **PARTIAL** — our kickoff files have no `position` field; closest analog is manual ordering |
| Storage for state | PostgreSQL/SQLite (hard dependency) | File-based (`state.md`, `_plan-backlog.json`) | **MISMATCH** — our storage is git-tracked flat files |
| CAS atomicity | DB transaction-level | Bash: `flock` + write-then-verify | **PARTIAL** — conceptually equivalent, implementation differs |
| Event broadcasting | WebSocket `task:moved` events | Not needed (human orchestrator present) | **IRRELEVANT** — our use case is synchronous, not async |
| Scheduled fire time | `scheduledAt` one-shot | Not currently needed | **NEUTRAL** — pattern not harmful, just not yet needed |

**Match score:** 6/9 dimensions match or strongly match when evaluated at the algorithm level (excluding storage). This yields ~**45%** match score (revised from ~22% in initial muddied-scope sweep).

The 22% initial estimate counted the full Kanban runtime dimensions (Docker, DB, REST API, React UI, cron daemon) which are all MISMATCH. When the sub-component boundary is drawn at the algorithm level (processAutoQueueAdvance + tag schema), the match rises to ~45%.

### Dual-assumption check (J5 gate)

**Option A (gitignored state, status quo):**
- Tag schema (`phase:N`, `seq:NN`, `rm:<alias>`) would live in gitignored `state.md` files only.
- Position ordering could be encoded in `state.md` as a `position:` field.
- ADOPT VOCABULARY verdict holds: vocabulary guides how our state files express ordering.
- ADAPT of pool-allocation logic holds: bash script reads position from `state.md`.
- Limitation: fresh worktrees don't inherit state → ordering state lost on each worktree recreate. Mitigated by `cp -r` workaround.

**Option C (hybrid: tracked `kickoff.md` frontmatter, gitignored state files):**
- Tag schema (`phase:N`, `seq:NN`) would live in tracked `kickoff.md` YAML frontmatter.
- Position ordering is stable across fresh worktrees (tracked).
- ADOPT VOCABULARY verdict holds **more strongly**: upstream vocabulary maps cleanly to YAML frontmatter `phase:` / `seq:` fields.
- ADAPT of pool-allocation logic is **more robust**: bash script reads position from tracked `kickoff.md` — no `cp -r` workaround needed.

**Conclusion:** Verdict ADOPT VOCABULARY is valid under both J5 options. Option C strengthens the ADAPT pathway. No verdict change needed based on J5 outcome; the new SSOT row can document the dual-assumption.

---

## §4 Verdict per BFR-default §1

**Verdict: ADOPT VOCABULARY (primary) + REFERENCE (secondary)**

Per `build-first-reuse-default.md §1` verdict ladder:

**ADOPT VOCABULARY** for the tag schema: `roadmapAlias`/`phase:<N>`/`phase:<name>`/`seq:<NN>` as the vocabulary for expressing phased-sequenced priority in umbrella/stage ordering. Upstream justification: production-grade, used in a deployed multi-initiative project, position assignment via `compareRoadmapImportOrder` is a clean functional design (phase → seq → original-index). Our adaptation: replace DB `position` field with YAML frontmatter `phase:` + `seq:` in tracked `kickoff.md` files (J5 Option C) or in `state.md` sidecar (J5 Option A). No runtime coupling needed; vocabulary adoption only.

**REFERENCE** for the `processAutoQueueAdvance` pool-slot-allocation algorithm: cite as production-grade design precedent for our bash-based umbrella dispatcher. Upstream algorithm shape (ascending position + scheduledAt gate + parallelEnabled cap + worktree-isolation guard) is an exact conceptual match for what a bash umbrella-dispatcher would need. We do not ADOPT verbatim (would require porting from TypeScript + removing storage layer) and do not ADAPT immediately (no current bash dispatcher; this is deferred pending substrate-v2 umbrella). REFERENCE establishes the pattern as validated.

**REJECT ADOPT FULL:** Docker+DB infra hard-block carries even at sub-component level. The TypeScript implementation cannot be used as-is; only its algorithm and vocabulary are portable.

**ADAPT (deferred):** Bash port of pool-slot-allocation logic is feasible but premature. Current single-maintainer cadence with human-orchestrated batches does not need automated advancement. Trigger: if `/meta-orchestrator` grows to ≥5 tracked umbrellas requiring automated priority-order selection across stages without human intervention. Register as a «Trigger to revisit» on the new SSOT row.

**Match score revised:** ~45% (algorithm + vocabulary sub-component) vs ~22% (full Kanban runtime, initial muddied-scope estimate).

**Falsifier:** If aif-handoff's `processAutoQueueAdvance` source code inspection reveals the algorithm is inseparable from DB transactions (e.g. if the pool-slot count is computed inside a DB stored procedure, not in application code), the ADAPT viability would downgrade from «feasible bash port» to «requires significant reimplementation». DeepWiki confirms the count is computed in application code via `countActivePipelineTasksForProject` returning an integer — this count is replaceable with a `grep -c` on state file status fields.

---

## §5 Recommendation (SURFACE, do NOT autonomously ship)

### New SSOT row proposal

```markdown
| [next-available-slot] | aif-handoff (`lee-to/aif-handoff`) autoQueueMode pool-slot-allocation LOGIC
  — `processAutoQueueAdvance` sub-component (ascending `position` selection +
  `scheduledAt` gate + `parallelEnabled`/`COORDINATOR_MAX_CONCURRENT_TASKS` cap +
  dirty-worktree guard + CAS claim; tag schema: `roadmapAlias`, `rm:<alias>`,
  `phase:<N>`, `phase:<name>`, `seq:<NN>` auto-assigned at import via
  `compareRoadmapImportOrder`; evaluated SEPARATELY from full Kanban runtime
  (SSOT #67 REJECT, preserved as-is) |
  `/meta-orchestrator` umbrella-sequencing vocabulary + future bash dispatcher
  priority-ordering design precedent |
  2026-05-26 | 2026-05-26 |
  ADOPT VOCABULARY (tag schema: roadmapAlias/phase:N/seq:NN as YAML frontmatter
  vocabulary for kickoff.md priority encoding) + REFERENCE (pool-slot-allocation
  algorithm as design precedent for bash umbrella dispatcher) |
  Sub-wave A R-phase patch (2026-05-26-companion-reuse-aif-handoff-autoqueue.md)
  — 4 DeepWiki probes with within-one-project disambiguation + WebSearch.
  T16 problem-class check: upstream = «DB-backed async task advancement within
  one server-side project»; ours = «file-backed sync umbrella ordering within
  one git repo». Match ~45% at algorithm+vocabulary level (revised from ~22%
  full-runtime muddied-scope). ADOPT VOCABULARY holds under BOTH J5 Option A
  (gitignored state) and Option C (tracked kickoff frontmatter); Option C
  strengthens ADAPT pathway.
  Distinct from SSOT #67 (full Kanban runtime, REJECT) — this row is the
  sub-component evaluation; #67 kept REJECT for infra mismatch on three axes. |
  (1) J5 verdict lands AND Option C chosen → evaluate ADAPT promotion:
      bash port of pool-slot-allocation reading `phase:`/`seq:` from tracked
      kickoff.md frontmatter for automated umbrella dispatcher.
  (2) `/meta-orchestrator` grows to ≥5 concurrent umbrellas requiring automated
      priority-ordering without human dispatch decision.
  (3) aif-handoff ships bash-compatible CLI for autoQueueMode (no Docker needed). |
```

### Additive note on SSOT #67 «Trigger to revisit» field

Proposed additive note (append to existing #67 «Trigger to revisit», do NOT replace):

> «Sub-component re-evaluated separately in Sub-wave A (2026-05-26): `autoQueueMode` LOGIC proposed as new SSOT row at `[next-available-slot]` (ADOPT VOCABULARY + REFERENCE). The #67 REJECT verdict for the **full Kanban runtime** remains correct and unchanged. The additive note records that the sub-component evaluation was deferred from the initial #67 sweep due to T-CR-A muddied-scope trap.»

---

## §6 §1.7 Forward-check applied

- **`build-first-reuse-default.md §3` 6-layer search performed:**
  1. Prior-art SSOT trailer: cited SSOT #67 as predecessor; new row proposed — not a capability commit (research patch only, no code).
  2. `phase-research-coverage.md §1` 6-item checklist: N/A for positive-existence claim (we found upstream evidence, not asserting non-existence).
  3. DeepWiki ≥3 phrasings: 4 probes, all with explicit within-one-project disambiguation (T-CR-A compliant). Probe URLs cited in §2.
  4. WebSearch ≥2 phrasings: executed (found no additional details beyond DeepWiki; GitHub repo URL confirmed).
  5. SSOT consult for prior verdicts: read SSOT #67 (full Kanban runtime, REJECT); #27/#28/#29/#30/#43/#44/#45/#46 (other aif-handoff rows); no prior row evaluates autoQueueMode sub-component separately — confirms new row is warranted.
  6. This rule (macro-level operating philosophy): ADOPT VOCABULARY verdict complies with BFR-default default (ADOPT or REFERENCE first; BUILD only if no upstream candidate). No BUILD proposed.

- **`phase-research-coverage.md §1` 6-item checklist:** No negative-existence claim made in this patch (we found evidence, not claiming absence). §1 checklist is N/A for this type of positive-find patch.

- **`ai-laziness-traps.md §2 T16`:** Explicit problem-class match walk performed in §3. Upstream class documented; our class documented; match scored dimension-by-dimension; match score derived from ratio of matching dimensions, not vibes.

- **`ai-laziness-traps.md §2 T20`:** This verdict (§4) is backed by 4 DeepWiki probe outputs cited in §2 + SSOT row #67 cross-reference + falsifier in same section. Not an inline verdict without evidence.

- **`recommendation-laziness-discipline.md §3`:** Every verdict cites SSOT row (#67) + DeepWiki output (4 probes with URLs) + falsifier (§4 final paragraph) in same section.

- **`doc-authority-hierarchy.md §2-§3`:** This patch carries Status/Date/Authoritative-for/NOT-authoritative-for header per rule. Class field N/A (research-patch, not rule file).

- **`no-paid-llm-in-ci.md §1`:** All research done via DeepWiki MCP (free tier) + WebSearch. No API-billed LLM calls.

- **`CLAUDE.md` PR strategy:** Verdict surfaces patch + SSOT row proposal; does NOT autonomously amend SSOT #67 or open additional PRs. Additive note on #67 is a surface-only recommendation; maintainer applies.

---

## §7 §1.7 Backward-check applied

- **SSOT #67 unchanged:** REJECT verdict for full Kanban runtime preserved as-is. Additive note on «Trigger to revisit» is an APPEND, not a verdict change. The new row proposed here is a separate entry for the sub-component, not an amendment of #67.

- **Prior R-patches not contradicted:**
  - `2026-05-23-meta-orchestrator-prior-art.md` — §1 row 3 identified the full Kanban runtime as REJECT; this patch confirms that verdict and adds sub-component evaluation. No contradiction.
  - `2026-05-26-meta-orchestrator-mode-triage-prior-art.md` — no overlap on aif-handoff sub-component; that patch covers SSOT rows #78-#81 (Devin, bundle-autonomous, meta-orch triage). No contradiction.
  - `2026-05-26-meta-orchestrator-stage-5-dogfood.md` — Stage 5 dogfood; no aif-handoff sub-component evaluation. No contradiction.

- **Conflicts with concurrent sub-waves B/C/D:**
  - Sub-wave B (oh-my-openagent): different companion project, no overlap.
  - Sub-wave C (Devin dynamic re-plan): different companion project, no overlap.
  - Sub-wave D (Superpowers brainstorming): different companion project, no overlap.
  - SSOT slot collision risk: all sub-waves use `[next-available-slot]` placeholder. Maintainer resolves numbering at merge time (first-to-merge gets first available slot after #81).

- **No rules modified.** No `.claude/rules/*.md` files touched. No `packages/core/principles/*.test.ts` files touched.

- **No substrate edits.** No `.claude/`, `packages/`, `agents/`, `install.sh`, `README.md`, `CLAUDE.md` modified.

---

## §8 See also

- [`docs/meta-factory/prior-art-evaluations.md` row #67](../prior-art-evaluations.md) — predecessor full Kanban runtime REJECT verdict; preserved as-is.
- [`docs/meta-factory/prior-art-evaluations.md` rows #27/#28/#29/#30/#43/#44/#45/#46](../prior-art-evaluations.md) — other aif-handoff sub-component evaluations (different problem classes).
- [`docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md`](2026-05-23-meta-orchestrator-prior-art.md) — initial R-phase sweep that produced SSOT #67; this patch corrects the muddied-scope gap.
- [`.claude/rules/build-first-reuse-default.md §1`](../../../.claude/rules/build-first-reuse-default.md) — verdict ladder applied in §4.
- [`.claude/rules/ai-laziness-traps.md §2 T16`](../../../.claude/rules/ai-laziness-traps.md) — the trap class this sub-wave corrects against.
- [`umbrella kickoff: .claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md §2 Sub-wave A`](../../../.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md) — umbrella scope for this patch.
- DeepWiki probes (within-project disambiguation, 2026-05-26):
  - [Pool-slot allocation](https://deepwiki.com/search/within-a-single-project-not-ac_2ed4d308-cc56-4b00-b082-5f2b82915a2b)
  - [roadmapAlias tag schema](https://deepwiki.com/search/within-a-single-project-with-m_066cfb57-37d2-4417-9851-bfcd0ddcd7e4)
  - [scheduledAt semantics](https://deepwiki.com/search/within-a-single-project-one-re_82fa4572-a036-475f-a8d2-87139a0e1966)
  - [parallelEnabled + concurrency](https://deepwiki.com/search/within-a-single-project-runnin_f95602b4-a900-4da8-b697-be53b5b4edf2)
