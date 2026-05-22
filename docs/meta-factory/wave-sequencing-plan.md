# Wave sequencing plan — when to do/launch what

> **Authoritative for:** execution *ordering* of the open waves (N0–N8) + infra tracks — the «when / in what order / gated by what» layer. Sequencing rationale: single hard date, dependency edges, cost-first (free research before paid build).
> **NOT authoritative for:** project goal — see [../../README.md#why-this-exists](../../README.md#why-this-exists); each wave's *content* — see [research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md) (N0–N7) and [research-patches/2026-05-22-deterministic-offload-autonomy-economy.md](research-patches/2026-05-22-deterministic-offload-autonomy-economy.md) (N8); the storm/billing facts — see N0 in the niche roadmap; the automerge/staging infra — see [automerge-staging-plan.md](automerge-staging-plan.md).
>
> **Status:** PLANNING ONLY (2026-05-22). Nothing in this doc has been executed or committed by its authoring session. Wave *admission* + launch order = maintainer call per [reviewer-discipline.md §2](../../.claude/rules/reviewer-discipline.md). This doc records the proposed schedule so it is not lost; it does not start any work.

---

## §1 — The single hard anchor

**2026-06-15 = N0** (headless `claude -p` / Agent-SDK / GH-Actions move to a metered monthly credit). ~3.5 weeks out from 2026-05-22. **This is the only externally-fixed date.** Everything else has no deadline → ordered by «cheap + unblocks-most» and dependency edges. N0 is a *meter, not a ban* — substrate is already weatherproof (`no-paid-llm-in-ci`); the storm hits only the dispatch/process layer.

## §2 — Tracks + ordering

### Track 0 — now, cheap, clears the table (days, ~$0)
| # | Task | Why now | Note |
|---|---|---|---|
| 0.1 | Commit books (facts + chronicle v3) + N8 patch + this doc | «don't lose plans» (session theme); currently uncommitted | maintainer commits |
| 0.2 | ✅ **CLOSED — companion = C** (both, on separate layers) | unblocks N7 | maintainer-delegated decision 2026-05-22 («Твоё решение»); rationale below |
| 0.3 | ✅ **CLOSED — promote via pointer** (cross-ref, not duplication) | plans become «active» from canonical plan; SSOT stays single | maintainer-delegated 2026-05-22; see §5.2 |

### Track 1 — critical path to June 15 (maintainer's stated top priority: autonomy without extra spend)
| # | Task | When | Depends on |
|---|---|---|---|
| 1.1 | **N8 R-phase** (free: local-model dispatch / batch / caching / offload-sweep + «$ above subscription» estimate) | **launch first** | — |
| 1.2 | **N0 decision** — how to stay autonomous + cheap, informed by 1.1 | after 1.1, **before 2026-06-15** | 1.1 |
| 1.3 | **N8 A-phase** — apply cheap wins (migrate checks into hooks, autonomy hooks) | start high-ROI items before June 15 | 1.1 |

### Track 2 — cheap, no deadline, parallel-safe
| # | Task | Note |
|---|---|---|
| 2.1 | N1 — niche-validation research (DeepWiki/WebSearch, $0) | parallel to 1.1 |
| 2.2 | N4b — design recommendation-moment gate | detector (N4a) already shipped; frontier |

### Track 3 — after dependencies clear
| # | Task | Gate |
|---|---|---|
| 3.1 | N7 — dogfood companions | DECISION=C (0.2); overlaps N8 A3 |
| 3.2 | N5 — give the conscience back | after N7 |
| 3.3 | N6b — one-button install | last (after portable core + coexistence) |

### Track I — infra (independent of niche waves; maintainer-gated)
| # | Task | Note |
|---|---|---|
| I.1 | ✅ **CLOSED — already EXECUTED/LIVE** (default=`staging`, ci-success-only, strict removed; main=prod strict) | migration done; merge-queue deferred (GitHub won't expose); see §5.3 |
| I.2 | Channel-selection wave → promote staging→main + SSOT #60–#63 | maintainer click |
| I.3 | DN-4 (15 stage-0 memory-codification gaps) | incremental, low priority, any window |

## §3 — Dependency edges (why this order)

- **N4a → N4b:** detector fixed (#98) → gate design unblocked.
- **N3 (done) + N6a (done) → N6b:** portable core + coexistence both landed → one-button is last build.
- **N7 gated on DECISION C; N5 follows N7** (know what's unique before giving back).
- **N8 R-phase feeds N0** (the cost/autonomy answer N0 lacked); **N8 A3 overlaps N7** (process-layer dispatch) and **N0 options a/e**.
- **Cost-first invariant:** all R-phases use free channels (DeepWiki/WebSearch/local) per [no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md); paid build only after a free verdict.

## §4 — Recommended launch order (proposal)

1. **Track 0** (commit + 2 decisions) — clears dependencies, ~$0.
2. **1.1 N8 R-phase** ∥ **2.1 N1** — free research, feeds the only deadline.
3. **1.2 N0 decision** by June 15, then **1.3 N8 A-phase** high-ROI items.
4. **3.1 N7** (once DECISION=C) → **3.2 N5** → **3.3 N6b**.
5. **Track I** infra slotted whenever the maintainer chooses; non-blocking.

**Rationale:** N8 R-phase is free, feeds the single hard date (N0), and answers the maintainer's central concern (autonomous + minimal spend) → max value / min risk as the first launch. **Falsified if** the maintainer prioritises the N4b frontier or the staging-trunk infra migration over storm-economy — then Track 1 yields first place.

## §5 — Open maintainer decisions embedded above

1. ~~companion = A / B / C (gates N7) — 0.2~~ → **CLOSED 2026-05-22: C** (see §5.1)
2. ~~promote N0–N8 into `EXECUTION-PLAN.md` — 0.3~~ → **CLOSED 2026-05-22: pointer-promote** (see §5.2)
3. ~~staging-trunk migration: execute or hold — I.1~~ → **CLOSED 2026-05-22: already EXECUTED/LIVE** (see §5.3)
4. first launch: N8 R-phase (recommended) vs another track — §4 *(remains open)*

### §5.1 — Decision record: companion = **C** (closed 2026-05-22)

Maintainer-delegated («Твоё решение», /orchestrator session 2026-05-22). **C = both, on separate layers:** the enforcement substrate stays dependency-free / never coupled (=A posture — AI-agnosticism is the verified moat per N1+N0), while the dev/process layer dogfoods companions (=B posture). This is `build-first-reuse-default` applied per-layer.

- **B rejected for substrate:** coupling the substrate to a companion forfeits AI-agnosticism — the property N0 (June-15 metered storm) proved load-bearing.
- **Pure A rejected as sole posture:** maintaining homegrown orchestrator/reviewer/worktree skills when Superpowers `subagent-driven-development` + `using-git-worktrees` exist is `#parallel-evolution-creep` / `#adoption-shame` ([build-first-reuse-default.md §4](../../.claude/rules/build-first-reuse-default.md)).
- **C is what every artifact already presumes** (N7 shape; task 3.1 `DECISION=C`); it also folds N0 in — process-layer dogfooding ⊇ the storm-migration target.
- **Falsified if** the layers prove inseparable, or AI-agnosticism turns out not to be the moat — neither holds (substrate = `packages/core/principles/*` + `.husky/` + deterministic bash; process = swappable markdown skills; moat verified N1 PR #102 / N0).

**Unblocks:** N7 (task 3.1) and N2's already-completed vocab alignment. The prior memory claim of «decided #103 2026-05-21» was premature — surfaced-not-closed in [research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md §line 95](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md); this §5.1 is the formal closure.

### §5.2 — Decision record: 0.3 promote = **pointer, not duplication** (closed 2026-05-22)

Maintainer-delegated («Твоё решение», /orchestrator 2026-05-22). N0–N8 are promoted into [EXECUTION-PLAN.md](EXECUTION-PLAN.md) **by cross-reference** — a "Phase 9+ → niche/growth waves" pointer naming this `wave-sequencing-plan.md` as the ordering SSOT and the two research-patches as the content SSOT.

- **Why pointer, not full inline:** inlining N0–N8 as phases would create a *second* sequencing authority inside EXECUTION-PLAN, duplicating this doc → guaranteed drift (the `#two-prompts-drift` shape). Doc-authority hierarchy + build-first-reuse (DRY) favour single-source. The pointer makes the waves *active/discoverable from the canonical plan* without copying content.
- **Effect:** EXECUTION-PLAN now references the active growth waves; this doc + patches remain the live trackers (each keeps its `Authoritative-for` header).
- **Falsified if** the maintainer wants N0–N8 *inlined* as full phases and this doc retired into one tracker — that is a larger restructure not implied by 0.3; redirect and I'll inline instead.

### §5.3 — Decision record: I.1 staging-trunk = **already EXECUTED/LIVE** (closed 2026-05-22)

Not an "execute or hold" question anymore — verified live state (GitHub API, 2026-05-22): **default branch = `staging`**; staging protection = required `ci-success` only, `strict=false` (no BEHIND stalls on parallel auto-merge); `main` = required `ci-success`, `strict=true` (manual prod promote). This is the migrated model from [automerge-staging-plan.md](automerge-staging-plan.md) (PR #150 LIVE). The "research GO; awaits execute" wording was **stale**.

- **Remaining:** merge-queue stays **deferred** — GitHub won't expose the merge-queue UI for this repo (per [automerge-staging-plan.md](automerge-staging-plan.md)); not a pending decision.
- **Observation (not actioned here):** `docs/meta-factory/staging-trunk-migration/` holds the migration wave's uncommitted research/review deliverables (A-inventory, review-A..D, `automerge-staging-plan.NEW.md`, `migrate/`). Whether to commit those as the migration record is a separate maintainer call — surfaced, not done.

## §6 — Parallelism + dependency matrix (orchestrator-facing)

### Dependency edges (`X → Y` = Y cannot start until X done)
```text
N4a (done, #98) ──────────────→ N4b (recommendation gate)
N3 (done) + N6a (done) ───────→ N6b (one-button install)
DECISION=C (0.2) ─────────────→ N7 (dogfood) ──→ N5 (give-back)
N8 R-phase (1.1) ─────────────→ N0 decision (1.2)
                └─────────────→ N8 A-phase (1.3)
N8 A3 (hybrid dispatch) ⇄ N7   (overlap — coordinate, don't double-build)
```

### Parallel-SAFE (run concurrently — independent surfaces, separate output files)
| Group | Items | Condition |
|---|---|---|
| **G1 — research** | 1.1 N8 R-phase ∥ 2.1 N1 ∥ 2.2 N4b design | each writes its **own** research-patch file; all free (DeepWiki/WebSearch/local) |
| **G2 — maintainer decisions** | ~~0.2 companion A/B/C~~ (CLOSED=C), 0.3 promote→EXECUTION-PLAN, I.1 staging-trunk go/hold | not orchestrator work; happen async, parallel to anything |

**Hard precondition for ANY parallel AI sessions:** each runs in its **own `git worktree`** (per [parallel-subwave-isolation.md](../../.claude/rules/parallel-subwave-isolation.md) — shared dir caused branch contamination in Wave 8.1) + `node_modules` symlink in the worktree (tsx hooks fail otherwise). If worktree-add fails → **sequential fallback**, never concurrent shared-dir.

### NOT parallel — serialize or partition file scopes
| Conflict | Items | Why | Mitigation |
|---|---|---|---|
| **Shared SSOT** | N1 + N8 both may append `prior-art-evaluations.md` | append-only register; concurrent appends collide | serialize the SSOT-append step, or one session owns it |
| **Shared tracker** | 0.3 promote + any wave editing `EXECUTION-PLAN.md` | same file | do 0.3 first, alone |
| **A-phase code** | 1.3 N8 A + 3.1 N7 both touch `.claude/hooks/` + `packages/core/` | same surfaces | partition file scopes up front, or serial |
| **Infra (solo)** | I.1 staging-trunk migration | rewrites branch-protection / workflows / `git-safety.sh` | **must run solo** — never concurrent with auto-merge waves |

### Plain-language rule of thumb
- **Research/design = parallel-safe** (different docs) → fan-out in worktrees.
- **Anything writing the SAME canonical file** (SSOT, EXECUTION-PLAN, hooks) = serial or partitioned.
- **Infra that changes git/CI config = solo.**
- **Decisions block their dependents** — 0.2 (companion) CLOSED=C → N7 unblocked; finish 1.1 (N8 R) before 1.2/1.3.

## §7 — Orchestrator entry point (does it know the next action?)

**Knows the ORDER + DEPENDENCIES:** yes — §2/§4/§6 of this doc. An orchestrator session reading `wave-sequencing-plan.md` has the full map.

**Has a turnkey NEXT-ACTION queued:** **no — not yet.** None of N0–N8 has a written kickoff. Kickoffs live in `.claude/orchestrator-prompts/<wave>/kickoff.md` (gitignored, ephemeral — authored at launch, not stored durably).

**So the orchestrator's literal next step at launch:**
1. Maintainer picks the first wave (recommended: N8 R-phase, §4).
2. Orchestrator authors that wave's kickoff **from this plan + the wave's research-patch** (cite [ai-laziness-traps.md §2](../../.claude/rules/ai-laziness-traps.md) T-enumeration per kickoff obligation).
3. If fanning out G1 in parallel → worktree-per-session + file-scope partition (§6).
4. Dispatch; workers self-verify; orchestrator accepts on evidence.

**Bottleneck to flag:** the durable plan is this doc; the kickoff is written fresh at launch. Until a kickoff exists, the orchestrator cannot dispatch — it can only plan. That kickoff is the one missing turnkey artifact between «plan recorded» and «work running».

## §8 — See also

- [wave-orchestrator-kickoff.md](wave-orchestrator-kickoff.md) — orchestrator's operating instructions to execute this plan (per-wave loop, rails, decisions it must not make).
- [research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md](research-patches/2026-05-21-niche-strategy-and-growth-roadmap.md) — N0–N7 content + §5 sequencing (this doc extends it with N8 + dates + infra).
- [research-patches/2026-05-22-deterministic-offload-autonomy-economy.md](research-patches/2026-05-22-deterministic-offload-autonomy-economy.md) — N8 content.
- [automerge-staging-plan.md](automerge-staging-plan.md) — infra track I.1 detail.
- [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — cost-first invariant on every R-phase.
- [.claude/rules/reviewer-discipline.md](../../.claude/rules/reviewer-discipline.md) — admission/order = maintainer call; this doc proposes, does not decide.
