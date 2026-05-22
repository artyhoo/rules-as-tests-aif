<!-- scope:dn4-round2-codification -->
# DN-4 round 2 — recommendation + preserve + own-QA codification self-review

> **Scope:** §1.7 self-review patch for the discipline-bearing change codifying DN-4 gaps #20/#23/#25/#26/#27 — adds [`phase-research-coverage.md` §1.12](../../../.claude/rules/phase-research-coverage.md) (recommendation-presentation pair) and [`ai-laziness-traps.md` T17/T18/T19](../../../.claude/rules/ai-laziness-traps.md) (preserve-before-destructive, preserve-residue, own-QA-before-handoff). Inherits folder authority from [research-patches/README.md](README.md); NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
>
> **Origin:** DN-4 autonomous codification round 2, 2026-05-22 (`/orchestrator`, continuation of [round 1 §1.11](2026-05-22-dn4-verify-before-claim-codification.md)). Five `feedback_*` memory entries were stage-0 per the [memory-coverage audit §4](2026-05-22-memory-coverage-audit.md).

## §1 What changed

- **§1.12** in `phase-research-coverage.md` — recommendation-presentation pair: lead with a reasoned pick (#27 `reasoned_recommendation_default`); act when the best path is clear, reserve questions for genuine forks (#20 `dont_ask_when_best_path_clear`).
- **T17/T18/T19** in `ai-laziness-traps.md` — preserve-before-destructive-delegation (#25), preserve-unique-residue (#26), own-cold-QA-before-handoff (#23).
- Tracker rows #20/#23/#25/#26/#27 → CODIFIED (#27 prose-only; mechanization deferred per #97/#98).

## §2 Channel-selection rationale

Per [rule-enforcement-channel-selection.md §1-§3](../../../.claude/rules/rule-enforcement-channel-selection.md): all five are **judgment** rules → **injection**, not gate; relevant at recommendation / delegation / handoff moments (not path-scoped). Reused two **already-always-on** rules (`phase-research-coverage.md`, `ai-laziness-traps.md`) rather than new files — avoids `#always-on-bloat`. #27's mechanical enforcement stays blocked on the recommendation-detector recall (#97/#98), so it is prose-only meanwhile (honest Class status in the tracker).

## §3 §1.7 self-review (T7 walk)

### §1.7 Forward-check applied

- **no-paid-LLM-in-CI**: zero LLM calls added — prose discipline. ✔ ([rule](../../../.claude/rules/no-paid-llm-in-ci.md))
- **doc-authority**: both edited rules already carry Class + Authoritative-for headers; this patch inherits folder authority. ✔
- **channel-selection / build-first-reuse**: §2 records the fold-not-new-file verdict against `#always-on-bloat`. ✔
- **memory-codification §3**: this IS the codify step for 5 stage-0 entries; repo homes now exist (`phase-research-coverage.md:86` §1.12, `ai-laziness-traps.md` T17-T19); tracker reflects CODIFIED; memory pointer-reduction delegated to the [auditor agent](../../../agents/memory-codification-auditor.md). ✔
- **capability-commit gate**: no dependency, no ≥80-LOC file → not a capability commit; escape-hatch trailer. ✔

### §1.7 Backward-check applied

- §1.12 **complements** §1.7 (back a verdict) and [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) (surface true forks) without contradiction — it explicitly draws the boundary («surface only maintainer project-strategy forks; otherwise pick»). Evidence: `phase-research-coverage.md` §1.12 point-1.
- T17/T18/T19 extend the §2 catalogue; verified unique trap numbers (`grep '^### T1[789]'` = 3 new, no collision with T1-T16). T17 records the incident counter 1/3 → principle-test promotion at 3 (consistent with the catalogue's existing promotion convention).
- The 5 conventions were verified stage-0 (not enforced elsewhere) per the memory-coverage audit §4.

### Would it have caught the motivating gap?

Yes. §1.12 fires on the 2026-05-21 incidents (option-dumping instead of a reasoned pick; over-asking when the best path was clear). T17 fires on the destructive-delegation incident (counter 1/3). T18 fires on the ours-vs-upstream delete-instead-of-preserve directive. T19 fires on the 2026-05-21 «merge is yours, QA is mine» incident — and was *practised* this very session (the §1.11/§1.12 cold-reviews caught MAJOR findings green CI missed). The rules fire on exactly the corpus that motivated them. ✔

## §4 Residuals

Remaining DN-4 gaps after round 2: #18 (`ci_runner_allocation_diagnostic` — reference-fact, troubleshooting doc, not a rule-to-enforce); #19 (`claude_code_guide_worker_inaccessible` — CC-harness fact, partly covered by queue-mode.md §10); #21 (`no_human_verification_ai_self_verifies` — thesis-level, needs a dedicated research-patch + §13.34 widening, not a quick rule); #24 (`phase_minus_1_no_memory_inheritance` — home is the global orchestrator skill, out of repo); #29 (`worktree_node_modules_symlink` — dev-env, mechanizable; CONTRIBUTING / setup-script home); #30 (`ai_doc_research_priority_pool` — fold into phase-research-coverage research-priority). Dispositioned in the [tracker](../../meta-factory/memory-codification-gap-tracker.md) for incremental on-touch codification per its own design.
