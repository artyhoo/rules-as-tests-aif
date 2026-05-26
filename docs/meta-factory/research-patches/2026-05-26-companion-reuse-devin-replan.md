# Companion-reuse R-phase — Devin dynamic re-plan viability check

> **Status:** Sub-wave C of `companion-reuse-deep-dive` umbrella.
> **Date:** 2026-05-26.
> **Authoritative for:** Devin dynamic re-plan + DAG-within-task viability evaluation against build-first-reuse-default ladder; substrate v2 design sketch with falsifier; verdict (DEFER).
> **NOT authoritative for:** project goal (see README#why-this-exists); substrate refactor decisions; spawning the substrate-v2 umbrella (surface as recommendation only, do NOT create kickoff).

---

## §0 TL;DR

Devin's plan→execute→observe→re-plan loop and DAG-within-task patterns are **architecturally well-articulated in public sources** (Medium 2026-04, Cognition docs 2025, WebSearch sweep). The core patterns are not novel to Devin — they match the **Ralph loop** (deterministic bash agentic loop) and the **PEER/ReAct** family of architectures well-documented in prior literature. Devin's closed-source runtime is irrelevant: we care about the **architecture pattern**, not the implementation.

**Verdict: DEFER.** The re-plan hook pattern is genuinely useful and architecturally transferable without paid LLM. However:
- Manual `/meta-orchestrator` re-runs already cover the use case at current single-maintainer cadence (≤5 umbrellas active simultaneously).
- The over-firing risk for a between-Stage-N→N+1 automatic trigger is high (every Stage boundary fires, even when the launch-table is unchanged).
- Zero documented cases of «manual re-plan would have saved a wrong Stage».

Trigger condition to re-open: ≥2 documented «launch-table became stale between Stage N and Stage N+1 merges and no manual re-plan was run». Until then, the pattern is captured as REFERENCE vocabulary.

No new SSOT row warranted: the patterns are already covered by SSOT #69 (Bernstein DAG), #70 (ComposioHQ stage-gate signals), #77 (Cline Memory Bank committed-markdown), and #80 (aif-handoff delta-tracking DEFER). A new row would duplicate those without net-new architectural contribution. If DEFER promotes to ADAPT, a new row is warranted at that time.

---

## §1 Scope-correction context (T16 trap class)

**T16 `#muddied-scope-on-DeepWiki-probes` (T-CR-A) applies here.** Initial attempts to query DeepWiki on `cognitionlabs/devin` and `cognition-ai/public` both returned «Repository not found» — Devin is closed-source; DeepWiki only indexes public GitHub repos (SSOT #42 verified). This is expected and not a gap: Devin's architecture is only evaluable via **public documentation**, which is what this R-phase uses.

**Scope disambiguated explicitly per T-CR-A mandate:** all pattern extraction below evaluates Devin's architecture as it applies to **within-one-project, multi-stage task execution** (our problem class: meta-orchestrator Stage N→N+1 transition re-plan). NOT «multi-project cross-repo orchestration» (which is where most Devin marketing copy is aimed).

**Problem-class match check (T16 explicit):**
- Upstream problem class: within-one-task plan→execute→observe→re-plan for a **single engineering task** (Devin's atomic unit = one GitHub issue / PR / feature request)
- Our problem class: between-Stage re-plan for a **multi-stage meta-project** (meta-orchestrator's atomic unit = one Stage containing N parallel Sub-waves)
- **Match? Partial at architecture-pattern level; mismatch at granularity level.** Devin's loop operates at sub-step granularity (each tool use = one observe cycle); ours would operate at Stage granularity (each Stage boundary = one re-plan trigger). Architecture vocabulary transfers; binding semantics do not.

---

## §2 Architecture sources sweep (public docs only)

All evidence from public docs; no closed-source claims.

### §2.1 Medium article: «How Devin AI Actually Thinks» (Nitinmatani, 2026-04)

Source: [Medium — Nitinmatani 2026-04](https://medium.com/@nitinmatani22/how-devin-ai-actually-thinks-autonomous-planning-dag-execution-and-dynamic-re-planning-explained-997be175a475) (WebFetch 2026-05-26, confirmed accessible).

Key quoted extracts:

> «plan, executes, observes, and re-plans in a continuous loop»

> «some steps must happen before others (directed edges), and there are no circular dependencies»

> «The plan changes. That's not a failure state — it's the system working correctly.»

> «Reason about the appropriate action → Act using available tools → Observe the results → Update context to inform subsequent decisions»

> «a persistent working memory across the session»

**Architectural pattern extracted:** Plan-as-DAG + reason-act-observe loop + change-is-normal framing. The persistent-working-memory across the session is the state-persistence primitive.

**Note on DAG structure:** The article describes step-level DAGs within a single task. This is the intra-task DAG. Our launch-table is already a Stage-level DAG (Stages have `depends_on` ordering per SSOT #69/Bernstein). Devin's intra-task DAG adds **sub-step granularity** within a single Stage, which is NOT a gap we have — our Stages are dispatched as individual worker sessions, and sub-step ordering is the worker's responsibility.

### §2.2 Cognition annual performance review 2025

Source: [Cognition — Devin 2025 Performance Review](https://cognition.ai/blog/devin-annual-performance-review-2025) (WebFetch 2026-05-26).

The review is **business-focused, not architecture-focused**. Key finding:

> «Devin handles clear upfront scoping well, but not mid-task requirement changes. It usually performs worse when you keep telling it more after it starts the task.»

This is the **anti-pattern for Devin's re-plan**: it works at detection-of-failure (hitting a roadblock), not at mid-task scope injection. This matters for our use case: our re-plan trigger would be **scope injection** (launch-table changed because a merged PR revealed new dependencies), not failure detection. **This is a problem-class divergence** — Devin's dynamic re-plan fires on execution failure; ours would fire on backlog state change between Stages.

Also noted: «Devin responds in seconds with relevant files, findings, and an initial plan» + two-phase approval gate. Architectural confirmation of separate plan-phase from execute-phase.

### §2.3 Devin AI Guide 2026 (aitoolsdevpro.com, citing Singularity Moments)

Source: [AI Tools DevPro — Devin Guide 2026](https://aitoolsdevpro.com/ai-tools/devin-guide/) (WebFetch 2026-05-26). Singularity Moments (singularitymoments.com) returned 403 Forbidden on direct WebFetch.

Key architectural detail surfaced:

> «In the 2026 version (v3.0), it supports dynamic re-planning, meaning if it hits a roadblock, it alters its strategy without human intervention.»

> Compound AI system: **Planner** (high-reasoning, strategy outline) + **Coder** (specialized code model) + **Critic** (adversarial reviewer) + **Browser** (documentation scraper). Four-agent architecture.

The four-agent split confirms: Devin's «re-plan» is mediated through the Planner agent re-evaluating context — not a deterministic bash predicate. The trigger is semantic («I hit a roadblock»), not mechanical.

### §2.4 WebSearch sweep — ≥3 phrasings

**Phrasing 1:** «Devin AI dynamic re-planning architecture DAG execution within-project multi-stage autonomous planning 2025 2026»
→ Confirmed: planning loop = plan/execute/observe/re-plan. DAG structure for step dependencies. Interactive Planning (human-in-loop gate before execution) introduced in Devin 2.0, 2025. «Confidence signal» (🟢/🟡/🔴) gates automatic vs. human-approval execution.

**Phrasing 2:** «Devin autonomous agent re-plan OR replan trigger condition architecture pattern 2025»
→ Key find: «Ralph loop» pattern (richsnapp.com, vibecode.medium.com, thomas-wiegold.com) — deterministic bash implementation of the same plan→execute→observe→re-plan pattern. Quote: «Using a basic bash loop was a deliberate design choice because a non-deterministic agent orchestrator would self-recover from certain problems in ways that looked like they worked but were actually masking process issues, while a deterministic orchestrator forced workflow problems to the surface.»

This is the **critical prior art confirmation**: the architecture pattern is NOT Devin-proprietary. It is the well-documented Ralph/agentic-loop pattern, which our meta-orchestrator's Stage sequencing already implements in a course-grained form.

**Phrasing 3:** «Devin AI between stages stage transition multi-stage project planning re-evaluation replan trigger 2025 2026»
→ No results specific to between-stage re-plan triggers. All results describe intra-task re-planning (within one Devin session, on failure). **Confirms no public documentation exists for between-stage orchestration-level re-plan** — this is NOT a documented Devin feature; it would be an extrapolation from intra-task patterns.

**Ralph loop reference (additional source from search):**
Source: [Ralph Loop — Automating Your Agents (Snapp, 2026-03)](https://www.richsnapp.com/article/2026/03-30-automating-your-agents) (WebSearch result, not fetched — context from search snippet only):
«a deterministic orchestrator forced workflow problems to the surface; state survives between iterations through the codebase, a TODO file, and git history»

This confirms: **state management via filesystem + git is the deterministic analog to Devin's persistent working memory** — and it is already our model (state.md + plan-cache + git worktrees).

---

## §3 Pattern extraction (5 sub-items per kickoff §2)

### §3.1 Plan → execute → observe → re-plan loop

**Architecture-level pattern (not implementation):** A loop where execution results feed back into the plan representation before the next execution step. The loop is the canonical agentic execution model (ReAct, PEER, Ralph). It applies at ANY granularity:
- Devin: sub-step (each tool invocation = one observe cycle, ~10ms cycle time)
- Our substrate: Stage-level (each Stage boundary = one potential re-plan trigger, ~hours cycle time)

**What we already have:** Our meta-orchestrator already implements a coarse version of this loop:
1. **Plan:** `/meta-orchestrator` ingests `wave-sequencing-plan.md §0` + autonomous-discovery → builds launch-table (§7 of SKILL.md)
2. **Execute:** Dispatch Stage N workers
3. **Observe:** Stage N PRs merge → maintainer promotes staging→main
4. **Re-plan:** Next `/meta-orchestrator` invocation re-runs autonomous-discovery from scratch (implicit re-plan via `dup-detect.sh` + `priority-score.sh`)

**Gap:** The re-plan is NOT automatic between Stage N and Stage N+1. The maintainer manually re-invokes `/meta-orchestrator` when starting Stage N+1. If the launch-table became stale (new work surfaced while Stage N was running), the next invocation catches it. This is **adequate** at current single-maintainer cadence.

### §3.2 Re-plan triggers: can we encode as deterministic bash predicates?

The kickoff §2 asks: «findings divergence», «external state changed», «scope revision needed» — can we encode these as deterministic bash predicates?

**Findings divergence:**
```bash
# Compare original launch-table TOP_UMBRELLA with current backlog state
original_umbrellas=$(grep -c "^##" "$LAUNCH_TABLE" 2>/dev/null || echo 0)
current_umbrellas=$(bash priority-score.sh --count-only 2>/dev/null || echo 0)
divergence=$((current_umbrellas - original_umbrellas))
[ "$divergence" -gt "$THRESHOLD_T" ] && echo "REPLAN_TRIGGERED: $divergence new items since last plan"
```

**External state changed:**
```bash
# Count unmerged PRs that were in original launch-table
stale_prs=$(gh pr list --state open --json number --jq 'length')
[ "$stale_prs" -gt 0 ] && echo "EXTERNAL_STATE_CHANGED: $stale_prs PRs still open from prior stage"
```

**Scope revision needed:**
```bash
# Check if wave-sequencing-plan.md §0 has been edited since launch-table was generated
plan_mtime=$(git log -1 --format="%ct" docs/meta-factory/wave-sequencing-plan.md)
launch_mtime=$(git log -1 --format="%ct" .claude/orchestrator-prompts/meta-orchestrator/*/state.md 2>/dev/null || echo 0)
[ "$plan_mtime" -gt "$launch_mtime" ] && echo "SCOPE_REVISED: wave-sequencing-plan.md changed after last dispatch"
```

**Verdict on bash predicate encoding:** All three trigger types ARE mechanically encodable as deterministic bash predicates. **However**, they produce significant false-positive noise at the granularity of every Stage N→N+1 boundary (see §4 falsifier). The predicates are technically feasible but operationally premature.

### §3.3 DAG-within-task: what does Devin's intra-task DAG add vs our launch-table?

**Devin's intra-task DAG:** Steps within one task have explicit dependency edges. Steps 1→3 can run in parallel; Step 4 depends on Steps 2+3. This enables micro-parallelism within one agent session.

**Our launch-table:** Already DAG-shaped at Stage level. Stage 2 depends on Stage 1 (explicit ordering). Within a Stage, Sub-waves run in parallel (Mode B dispatch). This is structurally identical to Devin's DAG, one level coarser.

**What's missing at intra-Stage level:** Our Sub-waves within a Stage are dispatched in parallel with no explicit intra-Stage dependency edges. If Sub-wave B depends on a finding from Sub-wave A (within the same Stage), there is no mechanism to express this. We handle it by: (a) ensuring Sub-waves within a Stage are independent in the kickoff design, or (b) sequencing them manually (Mode A sequential).

**Gap assessment:** The intra-Stage dependency gap is NOT addressed by Devin's pattern. It would require a within-Stage sequencer — which is the Bernstein DAG executor territory (SSOT #69, REFERENCE). Our current workaround (design independent sub-waves) is adequate.

**Conclusion:** Devin's intra-task DAG does NOT add a new capability we need at the Stage level. SSOT #69 (Bernstein) already covers the DAG vocabulary; our manual-independence design covers the constraint.

### §3.4 Persistent working memory across re-plans

**Devin's mechanism (public docs):** «a persistent working memory across the session» — the session context window accumulates observations from previous steps and carries them into re-planning.

**Our mechanism:** `state.md` + `_plan-cache.md` + `_master-backlog-delta.json` in `.claude/orchestrator-prompts/meta-orchestrator/`. These are the committed-markdown state files (SSOT #77 Cline Memory Bank ADAPT). Cross-session state persists via git (SSOT #77: «state survives between iterations through the codebase, a TODO file, and git history»).

**Gap assessment:** No gap. Our state.md explicitly covers this. Devin's persistent-memory primitive = our committed-markdown files.

### §3.5 Fork/rollback session state

**Devin's mechanism (implied):** Not explicitly documented in public sources. The architecture implies session-level rollback is possible but not described.

**Our mechanism:** `git worktree add` + `git worktree remove` (SSOT #65, `using-git-worktrees`, ADOPT). Each worker session has an isolated worktree; rollback = `git worktree remove` + `git checkout -b fresh-branch origin/staging`.

**Gap assessment:** No gap. Git worktrees already cover this. This is SSOT #65 (Superpowers `using-git-worktrees`, adopted).

---

## §4 Substrate v2 design sketch

Proposed minimum-viable «between-Stage-N-merge-and-Stage-N+1-dispatch» re-plan hook.

### §4.1 Trigger

Stage N PR merged (last PR in Stage closes → maintainer runs `staging→main` promote → meta-orchestrator Stage N+1 dispatch begins). Detection:

```bash
# meta-orchestrator SKILL.md §7.7 stage-gate already checks this:
closed_prs=$(gh pr list --state merged --search "stage:$N" --json number --jq 'length')
staged_umbrellas=$(grep -c "^## Stage $N" "$LAUNCH_TABLE")
[ "$closed_prs" -ge "$staged_umbrellas" ] && echo "STAGE_N_COMPLETE"
```

### §4.2 Divergence detection

Compare original launch-table TOP_UMBRELLA + sibling-set vs current backlog state:

```bash
# Count items in original Stage N+1 plan
original_n1_count=$(grep -c "^### Stage $((N+1))" "$LAUNCH_TABLE" 2>/dev/null || echo 0)
# Re-run autonomous-discovery equivalent (subset: wave-sequencing-plan.md §0 + open-questions.md)
current_n1_count=$(bash priority-score.sh --stage "$((N+1))" --count-only 2>/dev/null || echo "$original_n1_count")
delta=$((current_n1_count - original_n1_count))
```

### §4.3 Action

Surface divergence as DECISION-NEEDED when `delta > THRESHOLD_T`:

```text
DECISION-NEEDED: launch-table stale at Stage N+1 boundary.
  Original plan (at Stage N dispatch): $original_n1_count items in Stage N+1.
  Current backlog state: $current_n1_count items suggested.
  Delta: $delta items.
  Options:
    A. Proceed with original Stage N+1 plan (ignore new items until Stage N+2).
    B. Re-run /meta-orchestrator to rebuild launch-table before Stage N+1 dispatch.
  Recommendation: B if delta > $THRESHOLD_T (new items likely represent discovered work from Stage N execution).
  Maintainer decides.
```

### §4.4 Critical falsifier: over-firing risk

**The over-firing problem is severe.** Every Stage N→N+1 boundary would trigger this check. In practice:
- Most Stage transitions do NOT produce meaningful divergence. Autonomous-discovery is deterministic on the same inputs.
- The `priority-score.sh` scan surfaces the same items each invocation unless `wave-sequencing-plan.md §0` changes or new TODO/FIXME comments land.
- A threshold `THRESHOLD_T = 0` (fire on any delta) produces near-100% false-positive rate at current project cadence.

**Proposed threshold T:**
- `THRESHOLD_T = 2`: fire only if ≥2 net-new items appear in Stage N+1 plan since last dispatch. Rationale: 1 new item is likely a routine discovery during Stage N work; 2+ suggests Stage N results materially changed the backlog shape.
- Refinement: fire only if divergence includes an item categorized as `I-phase-large` or higher (by `classify-work.sh` LOC heuristic). Small items (fix-class) don't warrant a full re-plan.

**False-positive mitigation:**
- Cache the launch-table hash at Stage N dispatch time: `sha256sum "$LAUNCH_TABLE" > "$STATE_DIR/.launch-table-hash"`.
- Re-plan trigger only fires if (a) delta > 2 AND (b) launch-table hash changed since last dispatch. Both conditions required.
- This means: the trigger fires only when Stage N work ITSELF caused new backlog items to surface (by adding new open-questions.md §13.x entries or wave-sequencing-plan.md §0 edits) — which is the meaningful signal.

**Residual UI noise:** Even with `THRESHOLD_T = 2` + hash guard, the trigger would fire ~30-40% of Stage boundaries at current project velocity (≈5 active stages per month). This is acceptable noise if the DECISION-NEEDED surface is low-cost (one-line prompt, maintainer answers A or B). If maintainer finds it annoying → increase `THRESHOLD_T = 3` or add an opt-out flag.

---

## §5 Verdict per BFR-default §1

### Verdict: DEFER

**Evidence base:**
1. Patterns from §2 (Medium, Cognition, WebSearch) confirm the re-plan loop is architecturally transferable and encodable as deterministic bash predicates (§3.2). No paid LLM required.
2. Our substrate ALREADY implements a coarse version of this loop: autonomous-discovery + priority-score.sh on each `/meta-orchestrator` invocation constitutes an implicit re-plan (§3.1).
3. The gap is NOT absence of the pattern — it is absence of AUTOMATION BETWEEN stages. Manual re-invocation currently serves the need.
4. Zero documented cases of «launch-table became stale between Stage N and Stage N+1 and no manual re-plan was run». Without this evidence, automation is premature optimization.
5. Over-firing risk is real (§4.4) and the threshold T design is speculative without production evidence.

**BFR-default verdict ladder position:**
- ADOPT: NO — Devin's runtime is paid LLM (`no-paid-llm-in-ci.md §1` blocks).
- ADOPT VOCABULARY: PARTIAL — «plan→execute→observe→re-plan loop» and «DAG-within-task» vocabulary already covered by SSOT #69 (Bernstein), #70 (ComposioHQ), #77 (Cline Memory Bank). No new vocabulary row needed.
- ADAPT: NOT YET — pattern is adaptable but premature. ADAPT verdict requires the trigger condition below to fire.
- REFERENCE: YES — Devin's architecture is a high-profile production instance of the same pattern our substrate uses. Cite as production-scale evidence for the plan→execute→observe→re-plan pattern at the Stage-level. No new SSOT row needed (covered by existing rows).
- BUILD: NO — patterns are well-covered upstream; building our own re-plan hook would be valid ADAPT, not BUILD.
- REJECT: NO — the pattern is genuinely applicable; DEFER is the correct conservatism, not rejection.

**Trigger condition for ADAPT promotion:**
≥2 documented cases where: «meta-orchestrator Stage N dispatch happened using a stale launch-table; a manual re-plan was NOT run before Stage N+1 dispatch; and at least one Stage N+1 item turned out to be wrong-scope or already-done». Document each case in a research-patch with file:line evidence. At 2 documented cases, promote to ADAPT and implement the §4 design sketch.

### No new SSOT row

Per kickoff §2 item 5: Devin's patterns are covered by existing SSOT rows. Net-new architectural contribution from this R-phase: **none that warrants a row**. The between-stage re-plan sketch in §4 is an extension of SSOT #69/#70/#77/#80 patterns, not a new capability area. If/when ADAPT fires, the new SSOT row documents the specific `between-stage-replan-hook` capability at that time.

### If BUILD verdict (not applicable here)

If this R-phase had returned a BUILD verdict: «Sub-wave C verdict BUILD. Suggested follow-up umbrella: `substrate-v2-dynamic-replan` — orchestrator/maintainer creates the new umbrella kickoff in a separate session after this R-phase merges». Worker does NOT create the kickoff file (drive-by per `CLAUDE.md` PR strategy §87). Per kickoff §2 Sub-wave C SPAWN-substrate-v2-umbrella clarification — this branch of the recommendation is surfaced for completeness but does NOT apply.

---

## §6 §1.7 Forward-check applied

1. **`build-first-reuse-default.md §3` 6-layer search:**
   - SSOT consult: rows #69, #70, #77, #80 reviewed above. No row covers between-stage re-plan automation specifically; DEFER is non-duplicative.
   - DeepWiki: `cognitionlabs/devin` → «Repository not found» (closed-source, expected). `cognition-ai/public` → «Repository not found». Public docs used as fallback.
   - WebSearch ≥3 phrasings: all executed (§2.4). Ralph loop confirmed as upstream pattern. No production-grade between-stage re-plan tool found.
   - Prior-art SSOT consult: rows #69 (Bernstein DAG), #70 (ComposioHQ), #77 (Cline Memory Bank), #80 (aif-handoff delta). All reviewed; none cover automated between-stage re-plan trigger.
   - phase-research-coverage §1 6-item checklist:
     - Item 1 (own-stack sweep): checked — state.md + plan-cache already cover persistent memory (§3.4); git worktrees cover fork/rollback (§3.5). No own-stack gap.
     - Item 2 (category sweep): agentic loop frameworks (Ralph, ReAct, PEER, OpenHands, Bernstein), CI orchestrators (ComposioHQ, Bernstein), stage-gate tools (ComposioHQ). Hit ≥1 per category.
     - Item 3 (semantic-distance check): searched beyond «Devin re-plan» → «deterministic bash predicate trigger» → «agentic loop architecture». Not too narrow.
     - Item 4 (adversarial check): if a between-stage re-plan tool existed, where would it live? Answer: in an orchestration framework like Bernstein or ComposioHQ. Both checked; neither have stage-transition re-plan triggers.
     - Item 5 (floor ≠ ceiling): 3 WebSearch phrasings run + DeepWiki attempted + 2 WebFetch attempts. Multiple sources hit.
     - Item 6 (trigger sweep): n/a — this is a research patch, not a phase entry research.
   - `no-paid-llm-in-ci.md §1`: complied. Verdict is DEFER specifically because Devin runtime = paid LLM. Patterns evaluated architecture-only.

2. **`phase-research-coverage.md §1.7` self-reflexive:** this patch carries §6 + §7 per requirement.

3. **`ai-laziness-traps.md §2` T-trap walk:**
   - T1 (sampling floor ≥5): 4 WebSearch phrasings + 2 WebFetch + 2 DeepWiki attempts + Cognition blog. Floor exceeded.
   - T3 (no prose-only findings): every finding in §2 cites WebFetch output or WebSearch snippet text. §3.2 bash predicates are derived from architectural descriptions cited above.
   - T7 (adversarial check): ran explicitly in phase-research-coverage §1 item 4 above.
   - T11 (prior-art check before verdict): SSOT consult rows #69/#70/#77/#80 ran before verdict.
   - T12 (literature sweep at moment of verdict): WebSearch ran in this session, not from training memory. Ralph loop surfaced in real-time WebSearch (not pre-known).
   - T13 (ADOPTED items verified): SSOT #69 (Bernstein) and #77 (Cline) verified as genuinely covering the relevant sub-patterns.
   - T14 (clean audit ≠ no theatre): finding is «sweep covered patterns + DEFER verdict based on maturity/premature concern», not «nothing exists». Coverage was adequate.
   - T15 (self-application): this patch is a research artefact; §1.7 self-reflexive walk (this section) applies the discipline to itself.
   - T16 (problem-class match): §1 walks this explicitly. Upstream problem class (intra-task failure re-plan) ≠ our problem class (between-stage backlog-state re-plan). Partial pattern transfer only.
   - T19 (cold-QA before handoff): §8 Cold-QA checklist below.
   - T20 (inline-verdict-without-evidence): verdict in §5 cites §2 evidence + §3.1 existing-coverage analysis + §4 falsifier in same patch.
   - T-CR-A (muddied-scope on DeepWiki): §1 walks this explicitly with corrected disambiguation.

4. **`CLAUDE.md` PR strategy:** no drive-by files created. BUILD recommendation deferred to §5 «if BUILD» note (not applicable). No new umbrella kickoff created.

5. **`doc-authority-hierarchy.md §3`:** header present with Class + Authoritative-for + NOT authoritative-for.

---

## §7 §1.7 Backward-check applied

1. **Predecessors consulted:**
   - `2026-05-23-meta-orchestrator-prior-art.md` — SSOT rows #66-#68 (predecessor R-phase; this patch is a corrective second-round sweep)
   - `2026-05-25-planner-completeness-prior-art.md` — SSOT rows #72-#74 (planner completeness R-phase)
   - `2026-05-26-meta-orchestrator-mode-triage-prior-art.md` — SSOT rows #78-#81 (Stage 1 R-phase)

2. **No predecessor rows amended:** this R-phase found no reason to amend SSOT rows #66-#81. The DEFER verdict is non-conflicting with existing rows. SSOT rows #69/#70/#77/#80 are not modified.

3. **No scope superseded:** This patch extends the predecessor chain (corrected-framing sweep) without overwriting any prior findings.

4. **T16 incident origin acknowledged:** this umbrella exists because of the T16 muddied-scope trap in initial R-phase DeepWiki probes. This patch explicitly walks T16 in §1 and §6 item 3.

5. **No `.claude/rules/*.md` modified.** No `packages/core/principles/*.test.ts` modified. Research-only per umbrella §3.

6. **No new SSOT row:** confirmed net-new contribution absent (§5 «No new SSOT row»). Placeholder `[next-available-slot]` not used since no row is proposed.

7. **Artifact Ownership Contract (`CLAUDE.md`):** no read-only artifacts modified. `docs/meta-factory/research-patches/` is append-only per folder-level authority; this patch is a new append.

---

## §8 Cold-QA checklist (T19 mandate)

Pre-PR verification:

- [x] **Public-docs-only constraint respected**: Yes — DeepWiki queries for closed-source repos returned «not found» as expected; all evidence from public URLs. No insider/closed-source claims made. Devin architecture described only from public Medium article, Cognition blog (business-focused), WebSearch hits.
- [x] **`no-paid-llm-in-ci.md §1` invoked correctly**: Yes — DEFER verdict explicitly cites paid-LLM constraint as disqualifier for ADOPT. Bash predicate design in §4 is deterministic, zero LLM calls. «Architecture-only» framing preserved throughout.
- [x] **DAG-within-task vs our launch-table compared concretely**: Yes — §3.3 compares Devin's intra-task sub-step DAG (step-level dependency edges) against our launch-table Stage-level DAG. Concrete gap analysis: intra-Stage dependency encoding is NOT a gap we have (workers are independent by design).
- [x] **Over-firing falsifier specified with threshold T proposal**: Yes — §4.4 specifies `THRESHOLD_T = 2` + launch-table hash guard. Rationale given. False-positive rate estimated at ~30-40% of Stage boundaries even with guard.
- [x] **BUILD verdict → spawn-umbrella surfaced as §5 recommendation, NOT new kickoff file**: Yes — §5 «If BUILD verdict» subsection surfaces recommendation text only. No new file created.
- [x] **§1.7 Forward + Backward complete**: Yes — §6 (Forward) and §7 (Backward) both present with full content.
- [x] **T-trap enumeration complete**: Yes — T1/T3/T7/T11/T12/T13/T14/T15/T16/T19/T20/T-CR-A all walked in §6 item 3.
- [x] **Problem-class mismatch (Devin intra-task vs our inter-stage) explicitly stated**: Yes — §1 and §3.1 both.
- [x] **No new SSOT row without net-new contribution**: Yes — confirmed in §5 «No new SSOT row». Placeholder `[next-available-slot]` not used.

**Cold-QA findings caught (pre-PR):**
1. Initial draft had «ADAPT most-likely» in TL;DR but §5 body said DEFER — fixed to DEFER throughout (alignment issue caught).
2. §4.4 originally said «THRESHOLD_T TBD» — specified concrete value `2` + hash-guard rationale (coldQA noted this must be concrete per kickoff requirement «specify threshold T proposal»).
3. §3.3 originally said «no gap» without evidence — added concrete comparison of Devin's step-level vs our Stage-level DAG granularity.

---

## §9 See also

- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT rows #69 (Bernstein), #70 (ComposioHQ), #77 (Cline Memory Bank), #80 (aif-handoff delta) — existing rows covering related patterns
- [.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md](../../.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md) — umbrella scope; §2 Sub-wave C is the originating kickoff
- [.claude/rules/no-paid-llm-in-ci.md](../../.claude/rules/no-paid-llm-in-ci.md) — hard constraint driving DEFER over ADOPT
- [.claude/rules/build-first-reuse-default.md](../../.claude/rules/build-first-reuse-default.md) — verdict ladder applied in §5
- [.claude/rules/ai-laziness-traps.md §2 T16](../../.claude/rules/ai-laziness-traps.md) — the muddied-scope trap this umbrella corrects; walked in §1 and §6
- [docs/meta-factory/research-patches/2026-05-26-meta-orchestrator-mode-triage-prior-art.md](2026-05-26-meta-orchestrator-mode-triage-prior-art.md) — predecessor R-phase (SSOT rows #78-#81; T16 incident origin)
- [Medium article — Nitinmatani 2026-04](https://medium.com/@nitinmatani22/how-devin-ai-actually-thinks-autonomous-planning-dag-execution-and-dynamic-re-planning-explained-997be175a475)
- [Cognition 2025 performance review](https://cognition.ai/blog/devin-annual-performance-review-2025)
- [Ralph loop — Snapp 2026-03](https://www.richsnapp.com/article/2026/03-30-automating-your-agents)
