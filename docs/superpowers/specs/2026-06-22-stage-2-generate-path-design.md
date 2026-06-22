# Stage 2 — generate-path (rules-factory): design brainstorm

> **Authoritative for:** the feasibility framing and entry-point/scope recommendations for epic #646 **Stage 2** (the LLM generate-path — «a test-factory for rules under any stack»); the corrected ground-truth of which architecture layers already exist; the build-vs-reuse gate that must precede any live-LLM build.
> **NOT authoritative for:** project goal/methodology — see [README.md#why-this-exists](../../../README.md#why-this-exists). Stage-1 curated presets — see [2026-06-19-multi-stack-hybrid-design.md](2026-06-19-multi-stack-hybrid-design.md). The 6-layer architecture contract — see [docs/meta-factory/architecture.md](../../meta-factory/architecture.md) (owns layer responsibilities + Path A/B). Final Stage-2 PR decomposition — a `writing-plans` artifact produced after this brainstorm is ratified.

> **Origin:** 2026-06-22 brainstorm session with the operator, exploring «how can Stage 2 even be built» before the v2-trigger umbrella opens. Two strategic forks (entry-point, generation-scope) were surfaced; the operator returned both to a reasoned-recommendation («подумаем как лучше и почему»). This spec records the recommendations, their evidence base, and the residual operator-owned goal-priority calls. **Status: proposed — pending operator ratification.** Not an implementation plan.

---

## 1. What Stage 2 is

Per [#646 §3 / 2026-06-19-multi-stack-hybrid-design.md:44-48](2026-06-19-multi-stack-hybrid-design.md), Stage 2 is the **generate-path**: a consumer points the tool at *any* stack and the tool researches → synthesizes → self-validates → installs stack-appropriate enforcement rules, instead of shipping yet another hand-authored preset.

This is the path the README §Methodology actually names as the goal: «Generate enforcement rules from principles, not from copy-pasted presets. Presets become stale as stacks evolve» ([README.md:56](../../../README.md)). Stage 1 (curated react-spa + react-native presets) is the deliberate bridge; Stage 2 is the goal it bridges to. The curated presets double as Stage 2's **proving cases** — the regression oracle the generator must be able to reproduce.

## 2. Ground truth — what already exists (corrected)

The 6-layer architecture (`L0 Invariant Core → L5 Installer`, [architecture.md §2.1](../../meta-factory/architecture.md)) is **already built end-to-end in deterministic v1** — no LLM at runtime. Verified against `staging` (2026-06-22):

| Layer | Status in code | Evidence |
|---|---|---|
| L1 Stack Detector | ✅ ships | `packages/core/detector/` (`{stack, framework, missing, patterns}`) |
| L2 Research Agent | ✅ deterministic-curated | `packages/core/research/` — `store/*.json`, **zero live HTTP**; `allowlist.ts` already mirrors Anthropic's `allowed_domains` hostname API «for friction-free upgrade» ([phase-5.md row 5.3](../../meta-factory/retros/phase-5.md)) |
| L3 Rule Synthesizer | ✅ Path A, recipes-on-disk | `packages/core/synthesizer/recipes/*.json` — `synthesize(plan)` is a pure JSON→`SynthesisPlan` transform, no LLM ([architecture.md §2.5 v1 note](../../meta-factory/architecture.md)) |
| **L4 Self-Validator** | ✅ **ALREADY BUILT** (gates 1/2/4/6 REQUIRED) | `packages/core/validator/validate.ts` — pure `validate(plan: SynthesisPlan) → ValidationReport`; gates: schema, rule-tester, tautology, cross-rule conflict. Commits `f24cd44`→`b5f2830` (Phase 7). Gate 3 (mutation) SKIP, gate 5 (two-AI) DEFER. |
| L5 Installer | ✅ artifact-write | consumes `ValidationReport.ok === true` before disk write ([validator/index.ts](../../../packages/core/validator/index.ts) header) |

**Correction to the Stage-1 design doc.** [2026-06-19-multi-stack-hybrid-design.md §3 / §6 MAJOR-1](2026-06-19-multi-stack-hybrid-design.md) states the L4 gate «does not exist today — explicit Stage-2 build deliverable». **This is falsified by `packages/core/validator/` (Phase 7, shipped before that doc's 2026-06-19 date).** The L4 per-rule validator exists and runs the four deterministic gates. This is exactly the claim-without-source-verification failure the project's own discipline guards against ([ai-laziness-traps.md T3](../../../.claude/rules/ai-laziness-traps.md), [recommendation-laziness-discipline.md](../../../.claude/rules/recommendation-laziness-discipline.md)). Surfaced as an observation; correcting that doc is a separate scope (see §10).

**Therefore Stage 2 is NOT «build the pipeline».** The pipeline exists and runs. Stage 2 is narrower and sharper:

> **Swap the curated inputs at L2 and L3 for live-LLM inputs, while L4 and L5 stay byte-identical** — because `validate(plan)` is provenance-agnostic by design: it does not care whether the `SynthesisPlan` came from a recipe or an LLM.

## 3. The central paradox and its resolution

The project tenet is «documents lie; tests don't», and v1 was deterministic precisely because «LLM-generated research is non-deterministic and untestable via snapshots» ([phase-5-research §1](../../meta-factory/phase-5-research.md)). Stage 2 deliberately introduces non-determinism. The whole feasibility rests on one separation, which the architecture **already encodes in code**:

- **Generation may be non-deterministic** (L2 live search, L3 LLM menu-pick).
- **What reaches disk is deterministically validated and deterministically tested** — the artifact shipped is *a rule + its paired valid/invalid test* that passed L4, never the LLM transcript.

The provenance-agnostic `validate(plan)` is the architectural enabler that makes this safe: it is the same gate, with the same deterministic gates, regardless of how the plan was produced. This is «применение собственных принципов пакета к LLM-output» ([architecture.md §2.6](../../meta-factory/architecture.md)) — already realized, just not yet exercised on non-curated input.

## 4. Fork 1 — entry point (reasoned recommendation)

**Recommendation: L3-live-first, validated by the *existing* L4, against a proving-case stack — holding L2 fixed.**

Reasoning, with the ground-truth from §2:

- **L4-first is largely moot.** L4 is already built and already provenance-agnostic. There is nothing to «build first» here. What L4 needs is *exercising on non-curated input*, which only L3-live (or hand-authored adversarial plans) can supply. To harden L4 ahead of L3, you don't need live LLM at all — you hand-author deliberately-bad `SynthesisPlan`s (tautological rule, rule that never fires, rule that conflicts with an existing one) and confirm the gates reject them. That adversarial-fixture pass is cheap, deterministic, and worth doing as a *precondition*, but it is L4 hardening, not «building L4».
- **L2-first is the worst entry.** It is the most non-deterministic layer; standing up live `web_search` before L3/L4 are proven on live input only adds noise with nothing downstream to catch a bad research result.
- **L3-live-first isolates exactly one new variable.** For a proving-case stack (Next / react-spa / react-native) the curated `ResearchPlan` already exists in `store/`. Feed that *fixed* plan to an L3 that now uses an LLM to pick rules, and assert: (a) L4 accepts the output, and (b) the output matches the curated recipe's rules (the regression oracle). This proves the riskiest *new* capability — «LLM picks from menu» — with everything around it held constant.

Smallest provable slice: **one proving-case stack, fixed curated ResearchPlan in → LLM-synthesized SynthesisPlan out → existing L4 accepts → diff against curated recipe is empty (or explainably non-empty).**

Sequence after that slice proves out: L3-live → then L2-live (swap the fixed plan for a live-searched one) → then a genuinely-new stack (no curated oracle) as the true end-to-end test.

## 5. Fork 2 — generation scope (reasoned recommendation)

**Recommendation: Path A only for the Stage-2 v1 cut. Path B deferred to a separately-gated later trigger.**

Reasoning:

- **Path A is where the value is.** Path A = «LLM configures existing plugins / picks from a menu», no TypeScript authored ([architecture.md §3.1](../../meta-factory/architecture.md)). The Stage-1 R-phases found **most react rules are ADOPT, not BUILD** ([2026-06-19-multi-stack-hybrid-design.md §5, §8](2026-06-19-multi-stack-hybrid-design.md)) — i.e. the real need is «which existing plugin, in which config», which is precisely Path A. Path B (LLM writes the AST rule) is only needed for genuine gaps with no existing plugin — the minority case.
- **Path-A-only keeps all of Stage-2 v1 inside the already-built, $0, deterministic validator.** This is the decisive alignment: the four L4 gates that already ship (schema, rule-tester, tautology, conflict) are *sufficient* for Path A. Path B is what would additionally require **gate 3 (mutation/Stryker)** and **gate 5 (two-AI review)** — the two gates explicitly deferred as v2 triggers ([open-questions.md §13.10 entries #3/#4/#5](../../meta-factory/open-questions.md)). So «Path A only» ⟺ «no new validator gates needed»; «Path B» ⟺ «build gates 3 + 5 first». Scoping to Path A keeps Stage-2 v1 honest to [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) with the least new surface.
- **`research-only` falls out for free** as the degraded mode ([architecture.md §3.3](../../meta-factory/architecture.md) `synthesis-mode: research-only`): if the consumer opts out, or L4 rejects everything, the L2 `ResearchPlan` is still emitted as a findings report. It is a useful *mode*, not a sufficient *proof* of the generate-path, so it is not the v1 target — but it is the natural fallback.

The two recommendations reinforce each other: **L3-live-first + Path-A-only = exercise the existing deterministic L4 on LLM-sourced plans, adding zero new gates and zero CI cost.**

## 6. Mandatory build-vs-reuse gate (before any live-LLM build)

Per [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md), live L2/L3 LLM generation is a capability commit and must clear the reuse gate **before** any BUILD. There is a recorded, unclosed gap here that Stage 2 must discharge first:

[open-questions.md §13.10 entry #2 note](../../meta-factory/open-questions.md) records that the Phase-9 ROI re-evaluation of «LLM picks rules from menu» (DEFER) was done over 5 candidates **without checking two production-grade analogs**:

- **AIF `/aif-evolve`** — LLM-driven rule synthesis from accumulated fix-patches, structurally adjacent to «LLM picks rules from menu», and **already an integrated dependency**. The factory's L3 may be partly REUSE of this, not BUILD.
- **Oh My ClaudeCode family** — multi-agent autonomous workflows in our exact runtime.

Stage 2's R-phase **must** include both in the base before any verdict to BUILD live L2/L3 (DeepWiki/WebSearch ≥3 phrasings each, SSOT entries in `prior-art-evaluations.md`). This is a hard precondition, not a nicety.

## 7. Proposed staged sequence (smallest provable slices, in order)

1. **R-phase (reuse gate):** discharge §6 — `/aif-evolve` + OMC prior-art before any build verdict. Output: ADOPT/ADAPT/BUILD verdict + SSOT entries.
2. **L4 adversarial hardening (no LLM):** hand-author bad `SynthesisPlan` fixtures; confirm gates 1/2/4/6 reject each. Cheap, deterministic, snapshot-tested.
3. **L3-live, fixed plan, proving-case stack:** LLM menu-pick from a frozen curated `ResearchPlan`; assert L4-accept + regression-match against curated recipe.
4. **L2-live, proving-case stack:** swap the frozen plan for live `web_search` under `allowed_domains`; assert the produced plan still drives an L4-accepted synthesis.
5. **End-to-end, genuinely-new stack** (e.g. SvelteKit/Vite — low-BUILD): full L1→L5 on a stack with **no** curated oracle. This is the real proof the factory generalizes.
6. **Opt-in wiring:** `--generate` / `AIF_RESEARCH=llm`, install-time on the consumer's own subscription, never CI.

Path B (gates 3 + 5, LLM authors AST) is **out of scope** for this sequence — its own later trigger ([open-questions.md §13.10 entry #3](../../meta-factory/open-questions.md), Phase 9+ precedent).

## 8. Riskiest unknowns

- **L4→L3 regeneration loop:** how many rounds before fallback to human review? Needs an explicit budget + deterministic give-up path; an unbounded loop is both a cost and a hang risk.
- **Provenance / allowlist drift:** stack docs move, `allowed_domains` rot. L2 already has symbolic `drift.ts` v1 ([packages/core/research/drift.ts](../../../packages/core/research/drift.ts)) — needs a revisit cadence for live mode.
- **Non-determinism vs the snapshot test suite:** live L2/L3 cannot be snapshot-tested the way curated v1 is. The testable surface must be the **L4 verdict on the output**, not the output text — design tests around «does the plan pass the gates», not «does the LLM emit these exact bytes».
- **Path B edge cases (if ever in scope):** template strings, JSX spread, conditional rendering ([architecture.md §3.2](../../meta-factory/architecture.md)) — the matrix gate-3/gate-5 must cover, which is why Path B stays deferred.

## 9. Hard constraints (non-negotiable)

- **No paid LLM in CI** ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)): all generation is **install-time on the consumer's own subscription**; the framework never bills. Path-A-only keeps this trivially satisfied (no gate 3/5).
- **Provenance-agnostic L4 stays the trust boundary:** nothing reaches disk unvalidated; L5 re-runs `validate()` against the installed plan as a final meta-check ([architecture.md §2.7 item 5](../../meta-factory/architecture.md)).
- **Curated presets remain authoritative** for their stacks even after live-gen activates (v2 is a strict superset, [architecture.md §2.5 v1 note](../../meta-factory/architecture.md)).

## 10. Residual operator-owned (not settled by merits)

- **Goal-priority:** how aggressively to spend on Stage 2 vs. continuing to hand-curate presets. The merits favor L3-live-first/Path-A-only sequencing; *whether to start now* is a goal-priority call the operator owns (parallel to the Stage-1 residual in [2026-06-19-multi-stack-hybrid-design.md §2](2026-06-19-multi-stack-hybrid-design.md)).
- **Observation to action (separate scope, not done here per [CLAUDE.md «PR strategy»](../../../CLAUDE.md)):** the design-doc §3/§6 L4-already-exists drift (§2 above) should be corrected in `2026-06-19-multi-stack-hybrid-design.md`, and the §4 v2-trigger research-patch (due «on Stage 1 close») should reflect that Stage 2 is «swap inputs», not «build L4». Surfaced for the operator to greenlight as its own edit.

## 11. Acceptance of this brainstorm (process, not code)

- This spec is committed under `docs/superpowers/specs/`.
- The two fork recommendations (L3-live-first; Path-A-only) are either ratified or amended by the operator.
- On ratification, the Stage-2 R-phase opens with §6 as its first binding step, and `writing-plans` produces the PR decomposition from §7.

## See also

- [docs/superpowers/specs/2026-06-19-multi-stack-hybrid-design.md](2026-06-19-multi-stack-hybrid-design.md) — Stage-1/Stage-2 boundary + sequencing commitment (its L4 claim is corrected here in §2).
- [docs/meta-factory/architecture.md](../../meta-factory/architecture.md) — 6-layer contract, Path A/B, per-layer v1 deterministic stance.
- [docs/meta-factory/retros/phase-5.md](../../meta-factory/retros/phase-5.md) — deterministic-v1 pivot + v2-trigger precedent.
- [docs/meta-factory/open-questions.md §13.10](../../meta-factory/open-questions.md) — LLM v2 trigger conditions (entries #2–#5: Path A gen, Path B, gates 3/5) + the unchecked-prior-art note (§6).
- [.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) — reuse gate that §6 discharges.
- [.claude/rules/no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — install-time-on-consumer-subscription constraint.
- [README.md#why-this-exists](../../../README.md) — project goal/methodology (owns the §Methodology tension Stage 2 resolves).
