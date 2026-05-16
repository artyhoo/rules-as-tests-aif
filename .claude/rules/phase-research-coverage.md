---
description: Search-coverage discipline + self-reflection methodology for Phase entry research and prior-art lookups
paths:
  - "docs/meta-factory/phase-*-research.md"
  - "docs/meta-factory/phase-*-entry-research.md"
  - "docs/meta-factory/prior-art-evaluations.md"
  - "docs/meta-factory/research-patches/**/*.md"
---

# Phase research coverage — searching discipline

> **Authoritative for:** searching-layer discipline rule — §1 6-item coverage methodology checklist, §2 self-reflection prompts for retros, §3 research-patches/ accumulator format (mirrors AIF /aif-evolve), §4 named anti-patterns for fast pattern-match.
> **NOT authoritative for:** project goal — see [../../README.md#why-this-exists](../../README.md#why-this-exists). Recording-layer discipline (Prior-art trailer + SSOT + principle 08) — see [CLAUDE.md `Build-vs-reuse invariant`](../../CLAUDE.md). Discipline-layer SSOT (re-evaluation triggers for this rule) — see [open-questions.md §13.16](../../docs/meta-factory/open-questions.md).

Phase 8.8 mechanism (SSOT + principle 08 + `Prior-art:` trailer + pre-push hook) formalises **recording**: every claim cites prior art, every capability commit carries provenance. Phase 8.8.1 adds the **searching** layer on top: a rule + patch loop that catches false-negative coverage gaps before they ship as load-bearing claims.

The rule is invoked at the surfaces declared in `paths:` above — entry research files, the SSOT, and the `research-patches/` accumulator. It is consumed by phase research sessions before closing any [EXECUTION-PLAN.md §5.5](../../docs/meta-factory/EXECUTION-PLAN.md) Step 1.5 lookup, and by retros writing the Self-reflection block.

## §1 Coverage methodology checklist (10 items)

Apply before closing any «N candidates checked → no production analog» claim. Failing any single item → the negative-existence verdict is **provisional**, not load-bearing.

1. **Own-stack sweep.** Enumerate the explicit dependencies, integrated tools, and hard-coded references the project already uses (`package.json`, `aif-comparison.md`, `.claude/`, `docs/meta-factory/architecture.md`). For each, ask: *does this dependency itself ship a surface in the capability area under research?* Treating an own-stack dependency as «only a dep, not a competitor» is the dominant blind-spot pattern. *(Distilled from [AIF + Oh-My patch](../../docs/meta-factory/research-patches/2026-05-08-aif-omg-coverage-gap.md).)*
2. **Category sweep.** Beyond keyword neighbours of the capability label, enumerate the *categories* of tools that could host an analog: agent harnesses, AI orchestration platforms, IDE-integrated assistants, CLI authoring frameworks, codemod toolkits. **Format-category sub-case** — when the artifact under design is a SSOT / register / log / contract / template (a *format*, not a *capability*), enumerate format-precedent categories instead: decision records (ADR / MADR / Y-statements), CHANGELOG variants, CODEOWNERS-shape registers, fitness-function tables. Hit at least one candidate per category before closing. *(Distilled from [AIF + Oh-My patch](../../docs/meta-factory/research-patches/2026-05-08-aif-omg-coverage-gap.md) and [Phase 8.8 SSOT-vs-ADR patch](../../docs/meta-factory/research-patches/2026-05-08-phase-8.8-ssot-format-vs-adr.md).)*
3. **Semantic-distance check.** If all candidates share the same surface vocabulary (e.g. all are «ESLint plugins» or all are «.mdc rule files»), the search is too narrow. Probe the *function* (what does the capability *do*?), then re-search at one paradigm step removed (e.g. «rule synthesis» → «skill self-improvement», «patch distillation», «accumulated lessons learned»). *(Distilled from [AIF + Oh-My patch](../../docs/meta-factory/research-patches/2026-05-08-aif-omg-coverage-gap.md).)*
4. **Adversarial check on negative-existence claims.** A claim of the form «no production tool implements X» is a strong assertion. Before accepting it, generate at least one *counter-prompt* that assumes the tool exists and tries to find it («if X existed, where would it live? what would its docs page look like?»). If the counter-prompt surfaces a candidate, mark the original lookup incomplete. *(Distilled from [AIF + Oh-My patch](../../docs/meta-factory/research-patches/2026-05-08-aif-omg-coverage-gap.md).)*
5. **Prompt-list ≠ complete.** Hard Constraint #5 / #10 in the entry-research prompt typically lists ≥3 candidates per area. That is a **floor, not a ceiling.** Closing at the floor is permitted only if items 1-4 above also hold. If they don't, the lookup must continue past the listed minimum. *(Distilled from [AIF + Oh-My patch](../../docs/meta-factory/research-patches/2026-05-08-aif-omg-coverage-gap.md).)*
6. **Trigger sweep at phase entry research.** Before closing Step 1.5, run `grep -nE "^### 13\." docs/meta-factory/open-questions.md` and inspect every non-cascade §13.x entry. For each: decompose the trigger condition into observable signals (consumer evidence / repo state / file-existence / config bumps); run a verification probe; classify FIRED / STILL ARMED / CASCADE-DEPENDENT. Surface FIRED entries as `research-patches/2026-MM-DD-trigger-fire-§<N>.md` patches; record STILL ARMED in retro Trigger-health table. The push-based sweep complements pull-based recording — armed-but-not-fired triggers can sit indefinitely without it. *(Distilled from [trigger sweep report](../../docs/meta-factory/research-patches/2026-05-08-trigger-sweep-report.md); seeded as foundational case from §13.16 itself.)*
7. **Recommendation self-discipline check.** Apply before closing any recommendation that introduces or extends a rule, principle, pattern, or discipline. Failing either direction → recommendation is **provisional**, not load-bearing.
    - **Forward-check (recommendation complies with existing disciplines).** Does the proposed change comply with all currently-active layers — code-level (R1-R20 lint), principle-level (`packages/core/principles/*.test.ts`), commit-level (capability-commit gate + `Prior-art:` trailer per [CLAUDE.md `Build-vs-reuse invariant`](../../CLAUDE.md)), build-vs-reuse SSOT (load-bearing patterns registered in `prior-art-evaluations.md`), trigger sweep (§1.6 — every armed §13.x in `open-questions.md`), doc-authority (artefacts produced by the recommendation themselves carry compliant headers per [`doc-authority-hierarchy.md`](doc-authority-hierarchy.md))?
    - **Backward-check (new rule applied to all existing artefacts).** Complete sweep of artefacts under the new rule's scope — not the §1.5 floor of «3-5 examples» but the *complete* set. Exemption mechanism (glob or sentinel) explicit. Exemption itself has a meta-test (positive: exemption preserves intent; mutation: removing exemption breaks intent).
    - **Self-reflexive trigger.** §1.7 applies to itself — every new discipline-bearing artefact ships with a *self-review patch* under [research-patches/](../../docs/meta-factory/research-patches/) following the T7 template ([2026-05-09-self-review-audit.md](../../docs/meta-factory/research-patches/2026-05-09-self-review-audit.md)) — walks the proposed rule through §1.1-§1.7 and through §2.1-§2.5, verifying it would have caught the very gap that motivated its creation.
   *(Distilled from [recommendation-skips-own-discipline patch](../../docs/meta-factory/research-patches/2026-05-09-recommendation-skips-own-discipline.md) — 2026-05-09 incident: research session on L3 generated-docs discipline produced a recommendation that itself failed forward+backward checks across 6 distinct existing disciplines; gap surfaced only via reviewer pushback, not via existing §1.1-§1.6.)*

### §1.8 Hook surface smoke-test (introduced 2026-05-11, Wave 7 review M1)

For every commit touching `.claude/hooks/*.sh` or any pre-push hook section, run a smoke-test with a path that the hook is intended to skip:

```bash
echo '{"tool_input":{"file_path":"'"$(pwd)"'/package.json"}}' \
  | bash .claude/hooks/<hook-name>.sh; echo "exit=$?"
```

Expected: `exit=0`, no stderr. If the hook produces `exit=1` or stderr on a path outside its intended scope, the hook is leaking beyond its filter — fail the review, file as M-grade finding. Discovered when [Wave 7 Round 1 audit](../../docs/meta-factory/research-patches/2026-05-11-wave-7-round1-review.md) Domain 4 declared «hooks all correct» without running this probe, missing a CLI shim regression that surfaced FAIL noise on every Edit/Write of non-doc files (closed by M1 fix 2026-05-11).

### §1.9 SSOT citation existence-check (introduced 2026-05-11, Wave 7 review M2)

For every commit body containing a positive `Prior-art: prior-art-evaluations.md#N` trailer (NOT the `Prior-art: skipped — …` escape hatch), verify that entry #N exists in the SSOT at audit time:

```bash
grep -nE "^\| *${N} *\|" docs/meta-factory/prior-art-evaluations.md \
  || echo "ID #${N} missing from SSOT — capability cites non-existent entry"
```

Expected: matching row present. Verifying *trailer presence* is NOT the same as verifying the *SSOT entry exists*. [CLAUDE.md](../../CLAUDE.md) «add a new SSOT entry … in the same commit as the capability artifact» means the cited ID must be landed by-or-before the citing commit. Discovered when [Wave 7 Round 1 audit](../../docs/meta-factory/research-patches/2026-05-11-wave-7-round1-review.md) Domain 8 reported «#17 ✓; #22 ✓» by trailer presence alone, missing two non-existent entries (closed by M2 fix 2026-05-11).

### §1.10 Type-system over prose for SDK-shaped claims (introduced 2026-05-16, three-channel verification finding)

For claims about SDK-shaped surfaces — hook payload fields, MCP tool contracts, settings.json schema, harness event interfaces, language-server APIs — when type-system evidence diverges from prose documentation, **type-system wins**. Types must compile against actual implementation; prose can be stale, imprecise, or omit fields the runtime nonetheless requires.

**How to apply:**

1. SDK-shaped claim? → check type-system evidence first (e.g., `agent-sdk/typescript.md` for Claude Code, `.d.ts` for npm packages).
2. Types + prose agree → AFFIRM, cite both.
3. Types + prose diverge → types win; mark prose as stale or imprecise, surface as research-patch candidate.
4. Only prose available (no SDK types for this surface) → continue dual-channel prose verification per §1.1-§1.9.

Discovered when three-channel verification of research-patch `2026-05-16-§17-think-time-gate.md` Stop-hook claims found Worker WebFetch + Reviewer WebFetch converged on the same prose misreading («Stop fires only at session end»). The third channel via `claude-code-guide` subagent with TypeScript SDK access resolved unambiguously — `StopHookInput` and `SessionEndHookInput` are distinct interfaces; `Stop` fires per assistant turn, `SessionEnd` fires once at session termination. Prose lifecycle table was contestable; type-system evidence was not.

Single-incident promotion (not the §1 closing «3-patch threshold») is acceptable here because the lesson is mechanically grounded — «types vs prose» is a structural distinction, not a heuristic. Future SDK-shaped patches will accumulate the evidence base. *(Distilled from [research-patches/2026-05-16-claude-code-guide-cross-verification.md §12.6](../../docs/meta-factory/research-patches/2026-05-16-claude-code-guide-cross-verification.md) and [research-patches/2026-05-16-think-time-s17-gate-correction.md §4](../../docs/meta-factory/research-patches/2026-05-16-think-time-s17-gate-correction.md).)*

## §2 Self-reflection prompts (retro Self-reflection block)

When writing the Self-reflection section of a phase retro that involved prior-art research, answer all five:

1. **Когда ошибся — почему?** Identify the specific moment a coverage gap was introduced (which lookup, which closure decision). Reconstruct the cognitive shortcut that closed analysis prematurely (cognitive anchor, semantic narrowness, prompt-list anchoring, treating own-stack as inert).
2. **Мог ли пропускать раньше?** Walk back through prior phases. Was the same shortcut available earlier? If yes — was it taken and missed, or taken and caught? This calibrates whether the gap is one-off or systemic.
3. **Как не пропускать?** Map the gap to one of §1's 6 checklist items. If it doesn't map, propose a 7th item (and surface it as a `research-patches/` entry per §3 below). The methodology is incomplete if real gaps fall outside it.
4. **Какой урок?** State the one-line takeaway in a form that becomes a search heuristic — not «be more careful», but «before closing X, also check Y». The lesson is operationalisable or it is not a lesson.
5. **Did the principle established in this phase apply to its own design choices?** If the phase introduced a new mechanism, format, or convention, audit whether that mechanism's discipline was applied to the phase's own work. Catches recursive-self-application gaps where the discipline operates bottom-up (corrective on later phases) but not top-down (preventive on its own design moment). *(Distilled from [Phase 8.8 SSOT-vs-ADR patch](../../docs/meta-factory/research-patches/2026-05-08-phase-8.8-ssot-format-vs-adr.md) Prevention rule 3.)*

## §3 research-patches/ directory + AIF `/aif-evolve` precedent

Discovered coverage gaps land as standalone patches under [docs/meta-factory/research-patches/](../../docs/meta-factory/research-patches/), one file per gap. Format mirrors AIF `/aif-evolve` skill-context patches:

- **Problem** — what was missed and where (file + section + claim).
- **Root Cause** — which §1 checklist item failed (or 6th-item candidate per §2.3).
- **Solution** — what was changed to record the gap (commit reference, doc edit).
- **Prevention** — concrete PRIORITY CHECK rule that, if applied earlier, would have caught the gap. This is the load-bearing field; «be more careful» is rejected.
- **Tags** — ≥1 tag per failure mode (e.g. `#own-stack-blind-spot`, `#semantic-anchor`, `#prompt-list-anchoring`, `#negative-existence-claim`, `#category-sweep-missed`, `#recursive-self-application-gap`, `#scope-not-formal-trigger`, `#trigger-sweep`, `#recommendation-skips-own-discipline`).

Tags accumulate across patches. When a tag appears on ≥3 patches, distill its Prevention rules into [§1](#1-coverage-methodology-checklist-6-items) — the threshold is the same as AIF's «6/10 patches → priority-check rule» heuristic, scaled to our smaller corpus.

The AIF `/aif-evolve` precedent is what we mirror: per-incident patch + periodic distillation step + tag-keyed aggregation. Reflexion (Shinn et al.) is the theoretical backdrop — verbal-reinforcement memory across iterations — but `/aif-evolve` is the production-grade implementation we have direct access to and dogfood via the AIF dependency.

## §4 Anti-patterns

Pre-named for fast pattern-matching during retros. When a Self-reflection finding fits one of these, cite the anti-pattern by name in the patch's Root Cause field.

**Focus-tunnel family** — `#recursive-self-application-gap`, `#discipline-application-scope-blindness`, and candidate H7 «skill consumption blindness» share a common shape: AI agent applies discipline to the in-frame primary surface, blind to adjacent surfaces. They are siblings (not parent/child), differing in dimension — temporal (RSAG — phase forgets own rule), spatial (H8 — scope stops at primary object), mechanical (H7 candidate — auto-trigger keywords don't load the skill).

- **`#own-stack-blind-spot`** — treating an integrated dependency as inert infra, not a candidate analog. Particularly likely when the dependency was adopted in an earlier phase for an adjacent purpose.
- **`#semantic-anchor`** — anchoring on the surface vocabulary of the capability («ESLint rule», «recipe») rather than the function it performs («pick from menu given a codebase»). Search terms inherit the anchor and surface only same-vocabulary candidates.
- **`#prompt-list-anchoring`** — closing analysis at the prompt-listed candidate floor (typically 3-5) without applying §1.1-§1.5. The floor becomes the ceiling.
- **`#negative-existence-claim`** — accepting «no production tool implements X» without an adversarial counter-prompt. False negatives in production-tool surveys are common because tooling exists in adjacent paradigms (skill-context vs lint, agent vs IDE).
- **`#category-sweep-missed`** — closing without enumerating named-precedent categories the artifact could belong to. Especially common when the artifact is a *format* (SSOT, register, template) rather than a *capability* — bottom-up design slips past well-known precedents (ADR, MADR, fitness-functions table).
- **`#discipline-application-scope-blindness`** — discipline applied to the explicit object-under-review (a plan, recommendation, self-review patch), but **not** extended to: **(a) self-commentary lag** — annotations and inline comments in the same artefact describing primary content, left unchanged when primary content updates; **(b) meta-commentary lag** — meta-level documentation about deliverables (EXECUTION-PLAN summaries, PR retrospectives, tracker entries) that uses literal hard-coded counts/enumerations which self-deprecate as primary content extends; **(c) unverified collaborator claims** — factual assertions (file:line citations, counts, SHA references) received from collaborators, agent reports, or reviewer findings, accepted into edits without independent verification. Root cause: cognitive scope capture — discipline loads for whatever is «in frame» at the moment of analysis; commentary, meta-docs, and hand-off notes are structurally out of frame. Sibling of `#recursive-self-application-gap` and candidate H7 «skill consumption blindness» in the focus-tunnel family (different dimensions, not parent/child — see preface to §4). Countermeasures by sub-case: **(a)** treat inline annotations as first-order artefacts — apply same discipline pass as primary content; **(b)** use declarative forward-pointers («see §X for current count») rather than hard-coded literal counts/enumerations that self-deprecate on primary-content updates; **(c)** verify before accepting — for every file:line citation or factual assertion from a collaborator or agent report, confirm the cited line content against the actual file before applying the claim (T3 analogue for collaborator-sourced claims, per [ai-laziness-traps.md §2](ai-laziness-traps.md)). Occurrence corpus: Wave 0.5 (3 named occurrences + 2 sub-case (b) instances within one self-review cycle) — see [research-patches/2026-05-09-§13.21-l3-self-review.md §2.5](../../docs/meta-factory/research-patches/2026-05-09-§13.21-l3-self-review.md) + promotion record [research-patches/2026-05-12-§13.24-h8-promotion.md](../../docs/meta-factory/research-patches/2026-05-12-§13.24-h8-promotion.md).
- **`#recursive-self-application-gap`** — the discipline being established in a phase is not applied to that phase's own design choices. Catches shape «we forced future phases to do X but did not do X for our own X-introducing phase». Sibling of `#discipline-application-scope-blindness` in the focus-tunnel family (temporal dimension — see preface to §4). Surfaced via §2.5 self-reflection prompt.
- **`#scope-not-formal-trigger`** — a process gate (e.g. [§5.5 Step 1.5](../../docs/meta-factory/EXECUTION-PLAN.md)) is scoped to a specific phase shape (entry research) and does not fire on adjacent shapes (implementation phase format-decision moments). Coverage is procedurally compliant but methodologically incomplete.
- **`#trigger-sweep`** — push-based health-check anti-pattern: armed §13.x triggers sit indefinitely if no session does the sweep. The complement to pull-based discipline. Mitigation: §1.6.
- **`#adopted-pattern-drift`** — own-convention drift anti-pattern. Adopted external pattern (Arc42, AGENTS.md spec, AIF Step 0, Cline, matklad — see SSOT entries #6-#10) shifts at the source; project's adoption stays static; AI agents pattern-match on stale framing. Mitigation: SSOT velocity tags + 180-day staleness (slow patterns) / 90-day check (fast patterns) per [`prior-art-evaluations.md` entries #6-#10 «Trigger to revisit» lines](../../docs/meta-factory/prior-art-evaluations.md). Surfaces via `research-patches/YYYY-MM-DD-adopted-pattern-drift-<source>.md` on incidental observation; fold into systematic when L2 Research Agent ships per [open-questions.md §13.22](../../docs/meta-factory/open-questions.md).
- **`#recommendation-skips-own-discipline`** — recommendation introducing or extending a rule, principle, pattern, or discipline does not pass forward-check (compliance with existing R/principles/SSOT/triggers/doc-authority) and/or backward-check (complete sweep of existing artefacts under the new rule's scope). Same shape as `#recursive-self-application-gap` but scoped not to the project's code, but to the *act of forming the recommendation itself* — meta-cognitive blindspot where the agent of analysis is not also the object of analysis. Surfaced repeatedly across distinct sessions (PR #16 EXECUTION-PLAN drift; the «defer until consumer pain» reasoning anti-pattern across 4 turns of one session; L3 generated-docs research recommendation 2026-05-09). Mitigation: §1.7.
- **`#discipline-theatre`** — AI agent satisfies the *form* of a CI/discipline check (text length, file existence, regex match) without performing its *substance* (actual sweep, real verification, citation of evidence). Surfaces when a check is purely syntactic; mitigation requires paired-negative tests at the check's level (does the check FAIL when the discipline action is merely simulated?). Closed across Waves 8.1/8.2/8.3/8.4 for §1.7 sections, D-N enrollment completeness, §1.7 trailers, and Prior-art escape-hatches respectively. Bootstrap exemplar: research-patch [`2026-05-11-§13.29-substantive-compliance-research.md`](../../docs/meta-factory/research-patches/2026-05-11-§13.29-substantive-compliance-research.md). Retroactive evidence corpus: [`2026-05-12-wave-8-retroactive-audit.md`](../../docs/meta-factory/research-patches/2026-05-12-wave-8-retroactive-audit.md). Wave 9 will add a `§13.x` umbrella entry for prose-substance extension (trailer truthfulness, header accuracy, R1-R20 false-negative rate) — entry ID assigned at kickoff.

## See also

- [docs/meta-factory/research-patches/](../../docs/meta-factory/research-patches/) — accumulator for gap patches.
- [docs/meta-factory/open-questions.md §13.16](../../docs/meta-factory/open-questions.md) — discipline-layer SSOT trigger condition for re-evaluating this rule's scope.
- [docs/meta-factory/EXECUTION-PLAN.md §5.5 Step 1.5](../../docs/meta-factory/EXECUTION-PLAN.md) — process gate that consumes this rule before closing prior-art consult.
- [CLAUDE.md](../../CLAUDE.md) — Phase 8.8 recording-layer summary; this rule is the searching-layer companion.
