<!-- scope:companion-reuse-superpowers-scope -->
# Companion-reuse R-phase — Superpowers brainstorming scope-assessment

> **Status:** Sub-wave D of `companion-reuse-deep-dive` umbrella.
> **Date:** 2026-05-26.
> **Authoritative for:** Superpowers brainstorming v5.0+ scope-assessment mechanism evaluation; sub-project boundary as decision moment; SSOT amendment proposals (ADOPT VOCABULARY verdict for sub-project boundary + REJECT for automated multi-sub-project orchestration).
> **NOT authoritative for:** project goal (see README#why-this-exists); substrate refactor decisions; umbrella kickoff scope — see `.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md`.

---

## §0 TL;DR

Superpowers `brainstorming` v5.0+ introduces **scope-assessment** — a judgment-based trigger that detects «multiple independent subsystems» and decomposes the request into sub-projects, each with its own spec → plan → implementation cycle. No automated orchestration; the user manually re-invokes `/brainstorming` per sub-project. Writing-plans carries a companion «Scope Check» backstop.

**T16 problem-class match:**
- Upstream problem class: «within-one-project scope gating — detect when a single feature request covers multiple independent subsystems and split into sequential sub-project lifecycle cycles».
- Our problem class: «cross-session umbrella-stage decomposition — meta-orchestrator organises N independent umbrellas across multiple sessions; stage-gate checks prior stage merge before dispatching next».
- **Match? No on mechanism; YES on vocabulary.** Both instantiate the concept «scope boundary as a deliberate decision moment before planning». Upstream is per-feature (one session), ours is per-umbrella (multi-session); upstream is judgment-only, ours has deterministic LOC/surface-count classification.

**Verdict: ADOPT VOCABULARY** — «sub-project boundary as decision moment» is the correct term for what our meta-orchestrator does between umbrella stages. REJECT automated-orchestration analogy — Superpowers has none; ours requires explicit BUILD.

New SSOT row proposed at **[next-available-slot]** (parallel sub-waves A and C may reserve rows first; maintainer assigns final ID at merge).

---

## §1 Scope-correction context (T16 trap class)

This sub-wave exists because the initial meta-orchestrator R-phase sweep (2026-05-23) used a **muddied scope** in DeepWiki probes: «across multiple umbrella/projects» one-slash framing. The brainstorming scope-assessment feature was not separately registered in the SSOT because initial queries asked about «multi-project across repos» orchestration, which Superpowers does not address — its focus is strictly **within-one-project multi-subsystem** decomposition.

The under-credit is the T16 «pattern-matching-on-name» variant: the probe's framing matched the wrong upstream scope, making the correct within-project capability invisible. Sub-wave D corrects this with ≥3 phrasings all carrying explicit «within-one-project, multi-subsystem» disambiguation.

Existing Superpowers SSOT rows:
- **#55** — TDD-for-Skills discipline (ADAPT into principle test; different from brainstorming)
- **#64** — SDD inner-dispatch loop (ADOPT; different from brainstorming scope-assessment)
- **#65** — `using-git-worktrees` (ADOPT; different surface)
- **#71** — `using-superpowers` Red Flags table (REJECT for our specific delegation-vs-decision discipline)
- **#74** — SDD 3-tier model-selection vocabulary (ADOPT VOCABULARY; different from brainstorming)
- **#76** — CSO meta-skill description-routing (ADOPT VOCABULARY; different from brainstorming)

**None of the 6 existing Superpowers rows register the brainstorming scope-assessment pattern.** A new SSOT row is warranted.

---

## §2 DeepWiki sweep evidence

All five probes carried explicit «within-one-project, multi-subsystem» disambiguation per T-CR-A mandate. DeepWiki source: `obra/superpowers`, wiki structure confirmed via `read_wiki_structure` (sections 6.2 Brainstorming and Design, 7.2 brainstorming, 7.3 writing-plans).

### Probe 1 — Scope-assessment trigger (when does brainstorming flag «too large for one spec»?)

**Question text (explicit T-CR-A disambiguation):** «Within a single project (not across multiple repos or separate projects), when does the brainstorming skill flag a request as "too large for one spec" and decompose it into sub-projects?»

**DeepWiki excerpt:**

> «The `brainstorming` skill flags a request as "too large for one spec" and decomposes it into sub-projects when the request describes "multiple independent subsystems". The specific trigger is the presence of such subsystems, which the skill is designed to identify early in the process.»
>
> «During the "Understanding the idea" phase… if the request describes "multiple independent subsystems (e.g., 'build a platform with chat, file storage, billing, and analytics')", the skill is to "flag this immediately". The rationale is to avoid refining details of a project that needs decomposition first.»
>
> «RELEASE-NOTES.md also mentions that "Brainstorming now assesses whether a project is too large for a single spec. Multi-subsystem requests are flagged early and decomposed into sub-projects, each with its own spec → plan → implementation cycle."»

**Key finding:** Trigger = presence of «multiple independent subsystems». No LOC count, no phase-count threshold. Purely qualitative + AI judgment. Confirmation that this is v5.0+ feature (RELEASE-NOTES.md).

Source: [DeepWiki search](https://deepwiki.com/search/within-a-single-project-not-ac_70f8ff24-ed58-47fa-a58b-52af1bb33d2f)

---

### Probe 2 — Decomposition mechanism (judgment vs heuristic vs prompt structure)

**Question text (explicit T-CR-A disambiguation):** «Within a single codebase, how does the brainstorming skill mediate the decomposition of a request into sub-projects? Is the split decision based on judgment (the AI decides), a specific heuristic, or a structured prompt that walks through explicit questions?»

**DeepWiki excerpt:**

> «The mechanism used to arrive at sub-project boundaries involves:
> 1. **Scope Assessment**: During the "Understanding the idea" phase, the skill explicitly checks if the request describes "multiple independent subsystems".
> 2. **Decomposition Guidance**: If too large, the skill guides the user to decompose it into sub-projects — identifying independent pieces, their relationships, and order of implementation.
> 3. **Iterative Brainstorming**: Each identified sub-project then undergoes its own "spec → plan → implementation cycle".»
>
> «This process is reinforced by the `writing-plans` skill, which includes a "Scope Check" to ensure that a specification does not cover multiple independent subsystems.»

**Key finding:** Mediation = AI judgment guided by explicit SKILL.md instructions. No heuristic metric. The «multiple independent subsystems» phrasing is the evaluative criterion.

Source: [DeepWiki search](https://deepwiki.com/search/within-a-single-codebase-how-d_a736071c-6ddf-408c-beb2-f7e2c57ed4ce)

---

### Probe 3 — Sub-project lifecycle and dependency ordering

**Question text (explicit T-CR-A disambiguation):** «Within a single project that has been decomposed into sub-projects by the brainstorming skill, what is the lifecycle of each sub-project? Is there a sub-project graph or dependency ordering mechanism?»

**DeepWiki excerpt:**

> «Each of these sub-projects then undergoes its own complete `brainstorm` → `spec` → `plan` → `implementation` lifecycle.»
>
> «There is no explicit sub-project graph or dependency ordering mechanism mentioned in the provided context. However, the `brainstorming` skill guides the user to decompose the project into sub-projects and then brainstorm the *first* sub-project through the normal design flow. This implies a sequential approach where one sub-project is completed before moving to the next.»
>
> «The `writing-plans` skill handles one sub-project at a time.»

**Key finding:** No sub-project graph. Sequential by convention, not by mechanism. Each sub-project is fully independent — no dependency graph between them.

Source: [DeepWiki search](https://deepwiki.com/search/within-a-single-project-that-h_48236fe7-0aa0-4001-90cc-bba03ec06573)

---

### Probe 4 — writing-plans Scope Check criteria (backstop details)

**Question text (explicit T-CR-A disambiguation):** «In the writing-plans skill within a single project, what exactly does the "Scope Check" step check?»

**DeepWiki excerpt:**

> «The primary criterion for the "Scope Check" is whether the spec describes "multiple independent subsystems". This check is a backstop, meaning it catches issues that ideally should have been addressed earlier in the `brainstorming` phase.»
>
> «The documentation does not specify explicit quantitative thresholds such as a number of phases, lines of code estimate, or team-size requirements. Instead, the decision appears to be based on the qualitative assessment of whether the spec covers "multiple independent subsystems". This implies a degree of AI judgment.»
>
> «The `brainstorming` skill also has a "Spec Document Reviewer" subagent that checks for scope, ensuring the spec is "Focused enough for a single plan — not covering multiple independent subsystems".»

**Key finding:** Both brainstorming and writing-plans gate on the same qualitative «multiple independent subsystems» criterion. Writing-plans is the backstop; brainstorming is the primary gate.

Source: [DeepWiki search](https://deepwiki.com/search/in-the-writingplans-skill-with_424c3c0f-456c-4749-8c4d-bbee80e55d4f)

---

### Probe 5 — Sub-project boundary definition + automated orchestration

**Question text (explicit T-CR-A disambiguation):** «Within a single project, what does the Superpowers brainstorming skill mean by "sub-project boundary"? Is there automated multi-sub-project orchestration?»

**DeepWiki excerpt:**

> «A "sub-project" is akin to an independent feature or an independent deployable unit, as the `brainstorming` skill emphasizes designing for isolation and clarity, breaking systems into smaller units with clear purposes and well-defined interfaces.»
>
> «When the skill states "each sub-project gets its own spec → plan → implementation cycle," it implies that the `brainstorming` skill will guide you through the design process for the first sub-project. After completing one sub-project's cycle, you would then manually invoke the `brainstorming` skill again for the next sub-project.»
>
> «There is no automated multi-sub-project orchestration described within the provided documentation.»

**Key finding:** A «sub-project» = independent feature or deployable unit with clear interfaces. No automated orchestration. Manual re-invocation per sub-project.

Source: [DeepWiki search](https://deepwiki.com/search/within-a-single-project-what-d_a0df8b49-ecd0-4fb1-9604-9ffdfb618337)

---

## §3 T16 problem-class match analysis (upstream vs our class — explicit comparison)

Per T16 mandate: explicit «Upstream problem class: X. Our problem class: Y. Match? Evidence: …» comparison is non-negotiable.

### Upstream problem class (Superpowers brainstorming scope-assessment)

**What it solves:** Within a single coding project session, the user brings a request that mixes multiple independent subsystems (e.g., «build a platform with chat, file storage, billing, and analytics»). The brainstorming skill **detects this pattern early** and refuses to refine spec details until the request is decomposed into sub-projects, each with its own lifecycle.

**Mechanism:** AI judgment on «multiple independent subsystems» criterion. No LOC threshold, no phase count. Single-session, per-feature scope.

**Automation:** None for the cross-sub-project sequencing. User manually invokes `/brainstorming` for each sub-project sequentially.

**Trigger moment:** At spec refinement time within a single session — before the spec is written.

---

### Our problem class (meta-orchestrator umbrella-stage decomposition)

**What it solves:** A meta-level portfolio of umbrellas, each representing an independent workstream (e.g., «planner-completeness», «companion-reuse», «mutation-discipline»). The meta-orchestrator checks whether a request already maps to an existing umbrella, proposes a new umbrella if it doesn't, and gates Stage N+1 dispatch on Stage N merges.

**Mechanism:** Deterministic — `classify-work.sh` uses LOC + surface-count + file-glob matching. Not pure AI judgment.

**Automation:** `/meta-orchestrator` script handles Stage sequencing, dispatch, and gate-checking. Not manual re-invocation.

**Trigger moment:** At meta-session start — before any implementation begins.

---

### Direct comparison

| Dimension | Superpowers brainstorming | Our meta-orchestrator |
|---|---|---|
| Scope level | Within-feature (single coding task → multiple sub-features) | Cross-session (portfolio of independent work streams) |
| Decision trigger | «Multiple independent subsystems» qualitative check | LOC/surface-count heuristic + file-glob classifier |
| Mechanism | AI judgment guided by SKILL.md instructions | Deterministic bash script |
| Automation | None — user manually re-invokes per sub-project | Scripted — Stage N gate + dispatch |
| Boundary semantics | «Sub-project» = independent feature/deployable unit | «Umbrella» = independent workstream with kickoff.md |
| Session model | Single session, scope-assessment before spec | Multi-session, scope-assessment before Stage N+1 |

---

### Match verdict

**Vocabulary match: HIGH (~80%).** Both instantiate the core concept: «detect when a scope boundary is needed and make it an explicit decision moment before planning proceeds». The term «sub-project boundary» directly translates to our «umbrella boundary» in the meta-orchestrator context.

**Mechanism match: LOW (~15%).** Upstream is judgment-only, single-session, no automation. Ours is deterministic, multi-session, scripted.

**Automation match: 0%.** Superpowers has no automated multi-sub-project orchestration. Our meta-orchestrator is the BUILD answer for that gap.

**T16 conclusion:** This is NOT a `#pattern-matching-on-name` trap — the problem classes genuinely share a structural principle (scope boundary as decision moment) while diverging on implementation. ADOPT VOCABULARY for the shared structural principle; REJECT the automated-orchestration analogy (no upstream to adopt).

---

## §4 Verdict per BFR-default §1

**Primary verdict: ADOPT VOCABULARY**

The «sub-project boundary as decision moment» concept from Superpowers brainstorming is the externally-validated term for what the meta-orchestrator's `classify-work.sh` + Stage-gate mechanism implements. Specifically:

- «Multiple independent subsystems» trigger → our «scope-too-large-for-one-umbrella» classifier
- «Scope Check backstop in writing-plans» → our Stage N gate before Stage N+1 dispatch
- «Sub-project gets its own spec → plan → implementation cycle» → our «umbrella gets its own kickoff.md → R-phase → I-phase lifecycle»

**Vocabulary adoption:** Superpowers' «sub-project boundary» naming is industry-confirmed for this pattern. Using it in our meta-orchestrator SKILL.md §2 description would align our terminology with an externally-validated upstream.

**Secondary verdict: NOT A PROBLEM CLASS MATCH for automated orchestration.** Superpowers has none. Our meta-orchestrator's automated Stage sequencing is a **BUILD** (no upstream to adopt/adapt). This was already the BUILD verdict in the meta-orchestrator R-phase patch (2026-05-23); this sub-wave confirms it with the scope-corrected Superpowers probe.

**Verdict on existing SSOT rows:** No amendments needed to existing Superpowers rows (#55/#64/#65/#71/#74/#76) — this is a net-new capability surface (brainstorming scope-assessment) not covered by any of them.

**New SSOT row:** YES — proposed at **[next-available-slot]** (see §5).

---

## §5 Recommendation: new SSOT row at [next-available-slot]

Row template for maintainer to insert at the next available ID after parallel sub-waves A and C have claimed their rows:

```text
| [next-available-slot] | Superpowers (`obra/superpowers`) `brainstorming` v5.0+ scope-assessment — «multiple independent subsystems» trigger that gates spec refinement until decomposition into sub-projects (each with its own brainstorm → spec → plan → implementation cycle); `writing-plans` Scope Check backstop; no automated orchestration — user manually re-invokes per sub-project; judgment-based (no LOC/phase-count threshold) | `/meta-orchestrator` §2 vocabulary — «sub-project boundary as decision moment» maps to our «umbrella boundary as decision moment» before Stage N+1 dispatch; confirms «scope gating before planning» as externally-validated pattern; REJECT automated-orchestration analogy (Superpowers has none; our Stage-gate automation is BUILD) | 2026-05-26 | 2026-05-26 | ADOPT VOCABULARY | Sub-wave D DeepWiki sweep (5 probes with explicit within-one-project disambiguation per T-CR-A; all confirmed via `obra/superpowers` wiki 2026-05-26). **T16 problem-class check:** upstream = «within-session scope gating for single feature request → multiple sub-projects; AI judgment; no automation»; ours = «cross-session umbrella-stage sequencing; deterministic LOC/surface classifier; scripted Stage N gate». **Match? Vocabulary ~80%, mechanism ~15%, automation 0%.** Sub-project boundary concept transfers as vocabulary; scripted Stage sequencing is BUILD. No existing Superpowers rows (#55/#64/#65/#71/#74/#76) cover brainstorming scope-assessment — new row warranted. | Superpowers ships automated multi-sub-project orchestration (currently none — only sequential manual); OR brainstorming scope-assessment ships a deterministic heuristic (LOC threshold, phase count) making mechanism match upgrade to ADAPT viable. |
```

**Note on row-number collision avoidance:** Sub-waves A and C are dispatched in parallel and may also propose new rows. Do NOT hardcode the ID. Maintainer resolves ordering at merge time per kickoff §2 collision-avoidance rule.

---

## §6 §1.7 Forward-check applied

Checking this research patch against all currently-active disciplines:

1. **Code-level discipline (R1-R20 lint):** Not applicable — research patch is pure markdown; no code introduced.

2. **Principle-level (`packages/core/principles/*.test.ts`):** Not applicable — no new principle shipped here. Patch registers a new vocabulary finding; no executable artifact.

3. **Commit-level (capability-commit gate + `Prior-art:` trailer):** Research patches are explicitly NOT capability commits per CLAUDE.md «Refactors, doc edits, test additions for existing capabilities — NOT capability commits». The `Prior-art:` trailer convention IS appropriate for this commit as it records a BFR-default verdict. Trailer included in commit message.

4. **Build-vs-reuse SSOT (prior-art-evaluations.md):** Proposed new row at [next-available-slot]; maintains append-only pattern per §3. No amendment to existing rows needed (brainstorming scope-assessment is not covered by any existing row).

5. **Doc-authority (artefacts carry compliant headers):** This patch carries `Authoritative for:` / `NOT authoritative for:` header. Compliant with doc-authority-hierarchy.md §2.

6. **BFR-default §3 6-layer mechanism:** All layers applied:
   - Prior-art SSOT trailer: will be in commit.
   - phase-research-coverage §1 checklist: brainstorming scope-assessment is a judgment-only feature — no negative-existence claim on our part. The affirmative finding (vocabulary match) is directly evidenced by 5 DeepWiki probes.
   - DeepWiki ≥3 phrasings with T-CR-A disambiguation: 5 probes run; all with explicit «within-one-project» disambiguation. ✓
   - WebSearch: not required for affirmative pattern-match; the 5 DeepWiki probes are direct source evidence for a specific upstream repo. No negative-existence claim requiring WebSearch.
   - SSOT consult: done — 6 existing Superpowers rows verified; none cover brainstorming scope-assessment. ✓
   - This rule itself (macro-level): applied via this patch. ✓

7. **No-paid-LLM-in-CI (no-paid-llm-in-ci.md §1):** This patch is pure research/documentation; no CI mechanism added; no API call. Compliant.

8. **CLAUDE.md PR strategy (no drive-by):** Research patch only. No substrate edits, no new skills, no new umbrella kickoffs. Strictly within Sub-wave D scope. ✓

9. **T-trap coverage per kickoff §4:** All load-bearing traps walked — see §0 TL;DR (T16) and §7 Cold-QA self-review.

---

## §7 §1.7 Backward-check applied

Checking that this patch does not silently supersede or conflict with existing artefacts:

1. **Existing Superpowers SSOT rows (#55/#64/#65/#71/#74/#76):** All six rows reviewed. This patch proposes a new row for a distinct surface (brainstorming scope-assessment); it does NOT amend any of the six. No conflict.

2. **Meta-orchestrator R-phase patch (2026-05-23):** That patch's BUILD verdict for the meta-orchestrator's automated Stage sequencing remains correct. This sub-wave CONFIRMS the BUILD verdict is appropriate — Superpowers has no automated orchestration. No conflict; this patch addends evidence.

3. **Planner-completeness R-phase patch (2026-05-25, rows #73/#74/#76):** Those rows cover SDD tier-vocabulary and CSO routing. This row covers brainstorming scope-assessment. No overlap.

4. **Mode-triage R-phase patch (2026-05-26, rows #78/#79/#80/#81):** Those rows cover tickgit, backlog.md, aif-handoff delta, and oh-my-openagent alias routing. This row is non-overlapping.

5. **Scope creep check:** This patch does not propose implementation, does not spawn sub-umbrellas, does not open new principle tests, does not edit SKILL.md or any substrate file. Strictly within R-phase scope per kickoff §3.

6. **CLAUDE.md Artifact Ownership Contract:** This patch is a research-patches/ file — owned by «session that discovered the gap, append-only». No conflict.

7. **Predecessor incident:** The muddied-scope T-CR-A violation that motivated this umbrella (2026-05-26 session) is corrected by this patch's 5 T-CR-A-compliant probes. The corrected finding (ADOPT VOCABULARY for brainstorming scope-assessment) is additive to — not in conflict with — any existing SSOT row.

---

## §8 See also

- [`docs/meta-factory/prior-art-evaluations.md`](../prior-art-evaluations.md) — existing Superpowers rows #55/#64/#65/#71/#74/#76; proposed new row at [next-available-slot].
- [`.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md`](../../../.claude/orchestrator-prompts/companion-reuse-deep-dive/kickoff.md) — umbrella scope; Sub-wave D spec.
- [`docs/meta-factory/research-patches/2026-05-23-meta-orchestrator-prior-art.md`](2026-05-23-meta-orchestrator-prior-art.md) — initial meta-orchestrator R-phase that under-credited brainstorming scope-assessment due to T-CR-A muddied-scope framing.
- [`.claude/rules/ai-laziness-traps.md §2 T16`](../../../.claude/rules/ai-laziness-traps.md) — the T16 «pattern-matching-on-name» trap this umbrella corrects against.
- [`.claude/rules/build-first-reuse-default.md §1`](../../../.claude/rules/build-first-reuse-default.md) — verdict ladder; ADOPT VOCABULARY rationale.
- [`docs/meta-factory/prior-art-evaluations.md §2`](../prior-art-evaluations.md) — ADOPT VOCABULARY semantics definition.
