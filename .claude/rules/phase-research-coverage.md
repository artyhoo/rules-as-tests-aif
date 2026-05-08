---
description: Search-coverage discipline + self-reflection methodology for Phase entry research and prior-art lookups
paths:
  - "docs/meta-factory/phase-*-research.md"
  - "docs/meta-factory/phase-*-entry-research.md"
  - "docs/meta-factory/prior-art-evaluations.md"
  - "docs/meta-factory/research-patches/**/*.md"
---

# Phase research coverage — searching discipline

Phase 8.8 mechanism (SSOT + principle 08 + `Prior-art:` trailer + pre-push hook) formalises **recording**: every claim cites prior art, every capability commit carries provenance. Phase 8.8.1 adds the **searching** layer on top: a rule + patch loop that catches false-negative coverage gaps before they ship as load-bearing claims.

The rule is invoked at the surfaces declared in `paths:` above — entry research files, the SSOT, and the `research-patches/` accumulator. It is consumed by phase research sessions before closing any [EXECUTION-PLAN.md §5.5](../../docs/meta-factory/EXECUTION-PLAN.md) Step 1.5 lookup, and by retros writing the Self-reflection block.

## §1 Coverage methodology checklist (5 items)

Apply before closing any «N candidates checked → no production analog» claim. Failing any single item → the negative-existence verdict is **provisional**, not load-bearing.

1. **Own-stack sweep.** Enumerate the explicit dependencies, integrated tools, and hard-coded references the project already uses (`package.json`, `aif-comparison.md`, `.claude/`, `docs/meta-factory/architecture.md`). For each, ask: *does this dependency itself ship a surface in the capability area under research?* Treating an own-stack dependency as «only a dep, not a competitor» is the dominant blind-spot pattern.
2. **Category sweep.** Beyond keyword neighbours of the capability label, enumerate the *categories* of tools that could host an analog: agent harnesses, AI orchestration platforms, IDE-integrated assistants, CLI authoring frameworks, codemod toolkits. Hit at least one candidate per category before closing.
3. **Semantic-distance check.** If all candidates share the same surface vocabulary (e.g. all are «ESLint plugins» or all are «.mdc rule files»), the search is too narrow. Probe the *function* (what does the capability *do*?), then re-search at one paradigm step removed (e.g. «rule synthesis» → «skill self-improvement», «patch distillation», «accumulated lessons learned»).
4. **Adversarial check on negative-existence claims.** A claim of the form «no production tool implements X» is a strong assertion. Before accepting it, generate at least one *counter-prompt* that assumes the tool exists and tries to find it («if X existed, where would it live? what would its docs page look like?»). If the counter-prompt surfaces a candidate, mark the original lookup incomplete.
5. **Prompt-list ≠ complete.** Hard Constraint #5 / #10 in the entry-research prompt typically lists ≥3 candidates per area. That is a **floor, not a ceiling.** Closing at the floor is permitted only if items 1-4 above also hold. If they don't, the lookup must continue past the listed minimum.

## §2 Self-reflection prompts (retro Self-reflection block)

When writing the Self-reflection section of a phase retro that involved prior-art research, answer all four:

1. **Когда ошибся — почему?** Identify the specific moment a coverage gap was introduced (which lookup, which closure decision). Reconstruct the cognitive shortcut that closed analysis prematurely (cognitive anchor, semantic narrowness, prompt-list anchoring, treating own-stack as inert).
2. **Мог ли пропускать раньше?** Walk back through prior phases. Was the same shortcut available earlier? If yes — was it taken and missed, or taken and caught? This calibrates whether the gap is one-off or systemic.
3. **Как не пропускать?** Map the gap to one of §1's 5 checklist items. If it doesn't map, propose a 6th item (and surface it as a `research-patches/` entry per §3 below). The methodology is incomplete if real gaps fall outside it.
4. **Какой урок?** State the one-line takeaway in a form that becomes a search heuristic — not «be more careful», but «before closing X, also check Y». The lesson is operationalisable or it is not a lesson.

## §3 research-patches/ directory + AIF `/aif-evolve` precedent

Discovered coverage gaps land as standalone patches under [docs/meta-factory/research-patches/](../../docs/meta-factory/research-patches/), one file per gap. Format mirrors AIF `/aif-evolve` skill-context patches:

- **Problem** — what was missed and where (file + section + claim).
- **Root Cause** — which §1 checklist item failed (or 6th-item candidate per §2.3).
- **Solution** — what was changed to record the gap (commit reference, doc edit).
- **Prevention** — concrete PRIORITY CHECK rule that, if applied earlier, would have caught the gap. This is the load-bearing field; «be more careful» is rejected.
- **Tags** — ≥1 tag per failure mode (e.g. `#own-stack-blind-spot`, `#semantic-anchor`, `#prompt-list-anchoring`, `#negative-existence-claim`).

Tags accumulate across patches. When a tag appears on ≥3 patches, distill its Prevention rules into [§1](#1-coverage-methodology-checklist-5-items) — the threshold is the same as AIF's «6/10 patches → priority-check rule» heuristic, scaled to our smaller corpus.

The AIF `/aif-evolve` precedent is what we mirror: per-incident patch + periodic distillation step + tag-keyed aggregation. Reflexion (Shinn et al.) is the theoretical backdrop — verbal-reinforcement memory across iterations — but `/aif-evolve` is the production-grade implementation we have direct access to and dogfood via the AIF dependency.

## §4 Anti-patterns

Pre-named for fast pattern-matching during retros. When a Self-reflection finding fits one of these, cite the anti-pattern by name in the patch's Root Cause field.

- **`#own-stack-blind-spot`** — treating an integrated dependency as inert infra, not a candidate analog. Particularly likely when the dependency was adopted in an earlier phase for an adjacent purpose.
- **`#semantic-anchor`** — anchoring on the surface vocabulary of the capability («ESLint rule», «recipe») rather than the function it performs («pick from menu given a codebase»). Search terms inherit the anchor and surface only same-vocabulary candidates.
- **`#prompt-list-anchoring`** — closing analysis at the prompt-listed candidate floor (typically 3-5) without applying §1.1-§1.4. The floor becomes the ceiling.
- **`#negative-existence-claim`** — accepting «no production tool implements X» without an adversarial counter-prompt. False negatives in production-tool surveys are common because tooling exists in adjacent paradigms (skill-context vs lint, agent vs IDE).

## See also

- [docs/meta-factory/research-patches/](../../docs/meta-factory/research-patches/) — accumulator for gap patches.
- [docs/meta-factory/open-questions.md §13.16](../../docs/meta-factory/open-questions.md) — discipline-layer SSOT trigger condition for re-evaluating this rule's scope.
- [docs/meta-factory/EXECUTION-PLAN.md §5.5 Step 1.5](../../docs/meta-factory/EXECUTION-PLAN.md) — process gate that consumes this rule before closing prior-art consult.
- [CLAUDE.md](../../CLAUDE.md) — Phase 8.8 recording-layer summary; this rule is the searching-layer companion.
