<!-- scope:guard-liveness-gate -->
# Guard-liveness gate — design + prior-art (research-patch)

> Scope: design record + build-vs-reuse verdict for a change-scoped gate that proves each rule's `bad`-example corpus actually trips its real guard. Folder-level authority per [research-patches README](README.md); scope-bound by this gap. NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

> **Origin:** 2026-05-23 maintainer dialogue (session «investigate superpowers plugin usage» → branched into "can we mutation-test our own guards?"). The maintainer asked whether the Stryker idea could be adapted to verify that the project's own *documentation-as-tests* (guards) actually catch violations — «все ли сторожа поймают, или сторож декоративный». This patch records the design we converged on + the prior-art check that gates it.

> **Status:** DESIGN — not implemented. Executable brief lives at `.claude/orchestrator-prompts/guard-liveness-gate/kickoff.md` (gitignored). Wave admission + launch order = maintainer call per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md).

---

## §1 The gap this closes

[principle 02](../../../packages/core/principles/02-paired-negative-test.test.ts) (paired-negative meta-test) reads `rules-manifest.json` and checks **structural presence only**: `examples.bad` exists, ≥ min length, `bad ≠ good`. It never runs ESLint. Its own header admits the limit (lines 14–16): *«running examples.bad through the ESLint rule … requires Phase 5 runtime. Phase 2 covers structural presence only.»* (The «Phase 5» name is stale — the validator runtime that was Phase 5 became Phase 7, closed; see [EXECUTION-PLAN.md:256-257](../EXECUTION-PLAN.md).)

The real roundtrip **already exists** but is not wired as a manifest-wide gate: [`validator/gate-rule-tester.ts`](../../../packages/core/validator/gate-rule-tester.ts) (L4 Gate 2) runs a synthesized rule against `negative-test.input` (expects violation) + `examples.good` (expects clean) — but only inside the *synthesis* pipeline, only for `check.type === 'eslint'`, and it **skips `check.type ∈ {manual, command, script}`**.

**Gap, precisely (three parts — matching the maintainer's three instincts):**

1. **No gate sweeps every rule's `bad` example through its REAL guard.** The capability exists (`gate-rule-tester`) but is bound to synthesis, not to a "every shipped rule — prove it catches" check.
2. **Non-ESLint guards (manual/command/script) have zero catch-verification** — only structural presence.
3. **One negative input per rule.** `NegativeTest.input: string` is singular ([synthesizer/types.ts:14-17](../../../packages/core/synthesizer/types.ts)) — not a corpus of "all bypass attempts".

## §2 Build-vs-reuse verdict (§3 mechanism — [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md))

| Layer | Upstream | Verdict | Evidence |
|---|---|---|---|
| Roundtrip engine «run invalid code → expect violation» | ESLint `RuleTester` / `@typescript-eslint/rule-tester` | **ADOPT** (already in `gate-rule-tester.ts`) | [typescript-eslint.io/packages/rule-tester](https://typescript-eslint.io/packages/rule-tester/); WebSearch 2026-05-23 |
| «watch it fail first» idea (TDD-for-docs) | Superpowers `writing-skills` / `test-driven-development` | **REFERENCE** | DeepWiki `obra/superpowers` 2026-05-23 + [`writing-skills/SKILL.md:59`](https://github.com/obra/superpowers) verbatim: *«Mechanical constraints (if it's enforceable with regex/validation, automate it—save documentation for judgment calls)»* — SP explicitly delegates mechanical verification OUT |
| Mutation of rule *source* (impl-test sharpness) | StrykerJS | **ADOPT (different layer)** | [SSOT #39](../prior-art-evaluations.md) — verifies impl-test substance, not bad-example liveness |
| Change-scoped gate + manifest sweep + bypass-array | none found | **BUILD (provisional)** | sibling principle tests 08–12 are own-build by same reasoning ([SSOT #48](../prior-art-evaluations.md)) |

**Key finding:** Superpowers is *complementary, not overlapping* (verbatim, [niche-roadmap §N1 line 21](2026-05-21-niche-strategy-and-growth-roadmap.md)). It covers the LLM/judgment layer (skills via pressure-scenarios); the deterministic mechanical-constraint layer is the project's niche, which SP *deliberately delegates away*. This gate is squarely in that niche — and a strong **N5 give-back candidate** (a contributed *process skill*, not the TS engine — SP is zero-dep and rejects dependency PRs, [niche-roadmap §N1 line 19](2026-05-21-niche-strategy-and-growth-roadmap.md)).

> **⚠ Provisional BUILD — search-coverage incomplete.** Only 1 WebSearch phrasing was run this session; [phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md) + the 6-item checklist require ≥3 phrasings on a negative-existence claim. The kickoff §3 mandates completing the sweep (≥2 more WebSearch phrasings + DeepWiki re-probe) **before** the implementer writes the BUILD SSOT row. Wrong if a declarative "negative-liveness sweep at pre-push" tool surfaces → flip BUILD→ADOPT.

## §3 Design — umbrella program (4 sub-waves)

**Name:** guard-liveness — "a guard must prove it catches its own `bad` corpus, every bypass variant, at the earliest fitting channel, when the rule is added/changed — across all four `check.type` kinds, by the right mechanism for each kind."

**Restructure rationale (2026-05-23 maintainer correction):** earlier framing folded non-ESLint into a single "out of scope, complex research, defer" bucket. Two errors: (a) **the real distribution is non-ESLint-MAJORITY** — `grep -oE '"type":\s*"[a-z]+"' rules-manifest.json | sort | uniq -c` = 11 eslint / 7 command / 5 manual / 3 script → ESLint v1 closes only 11/26 = **42%**; (b) **`manual` is not out-of-scope for us — it's the moment to DOGFOOD Superpowers**, since SP's `writing-skills` pressure-scenario pattern is the right tool for that type (process-layer dogfood per [niche-roadmap line 90](2026-05-21-niche-strategy-and-growth-roadmap.md), substrate stays dependency-free, no-paid-LLM-in-CI honored because the LLM runs in active sessions, not CI). So the right shape is an **umbrella with 4 sub-waves**, parallelized where independent.

**Shared substrate (used by every sub-wave):**
- Engine reuse: [`gate-rule-tester.ts`](../../../packages/core/validator/gate-rule-tester.ts) for ESLint roundtrip.
- Schema change: `NegativeTest.input: string` → `string[]` ([synthesizer/types.ts:14-17](../../../packages/core/synthesizer/types.ts)). ≥1 required; multiple = "all bypass attempts". Backward-compat via string→[string] shim.
- Channel basis: [rule-enforcement-channel-selection.md §3](../../../.claude/rules/rule-enforcement-channel-selection.md) — detectable+fast → gate at earliest reachable channel; change-scoped via `git diff`.
- principle 02 extension: array non-empty + variants distinct (anti-tautology).

| Sub-wave | Scope | Mechanism | Channels (v1 of each) | Depends on |
|---|---|---|---|---|
| **v0 — value-weighted distribution audit** | classify each of the 26 manifest rules by *criticality* (load-bearing vs auto-gen vs deprecated); confirm or correct the 42%-coverage framing per type | R-phase only — no code; deliverable = a table + sub-wave scope recommendations | n/a (research) | **none — starts now** |
| **v1 — ESLint liveness gate** | `check.type === 'eslint'` (11 rules) | reuse `gate-rule-tester` roundtrip; change-scoped via `git diff`; bypass-array schema | **pre-commit** (structural: non-empty `bad` corpus) + **pre-push** (liveness: every `input` → violation, `good` clean) | **none — starts now** (parallel with v0) |
| **v1.5 — command / script liveness** | `check.type ∈ {command, script}` (10 rules) | per-rule **pre-condition fixture** field in schema («filesystem/env state that SHOULD trip this command»); runner executes the rule's command/script on the fixture, asserts non-zero exit | pre-commit (fixture presence) + pre-push (change-scoped fixture-runs) | **v0** (uses v0's per-rule criticality table for scope); can ship in parallel with v3 |
| **v3 — manual liveness via Superpowers companion** | `check.type === 'manual'` (5 rules) | dogfood SP's `writing-skills` pattern — each manual rule ships a **pressure-scenario template** + an **AI-agnostic sub-agent prompt** under `agents/manual-rule-liveness-prober.md`; an active session (operator's CC subscription, NOT CI) runs the sub-agent which dispatches a fresh subagent into the pressure scenario WITHOUT the rule, then WITH the rule, and reports compliance delta (RED→GREEN) — same RED-GREEN-REFACTOR shape as SP's `writing-skills` ([SKILL.md:14-43](/Users/art/.claude/plugins/marketplaces/superpowers-dev/skills/writing-skills/SKILL.md)) | session-bound (operator-triggered probe, like `/aif-verify`), NOT CI — honors [no-paid-llm-in-ci.md §2](../../../.claude/rules/no-paid-llm-in-ci.md) (session-bundled subscription is out of scope) | **v0** (uses v0's table); can ship in parallel with v1.5 |
| **v2 — full-sweep guard-rot regression** | ALL rules of ALL types, not just changed | re-invoke v1 + v1.5 + v3 mechanisms in **full-sweep mode** (no `git diff` scoping); CI/pre-merge gate; v2 is a thin orchestrator over the three change-scoped mechanisms | **CI / pre-merge** (last-resort gate per [README invariant](../../../README.md)) — single full-sweep job aggregated under existing `ci-success` per [automerge plan](../automerge-staging-plan.md) | **v1 + v1.5 + v3 all merged** — v2 has no own mechanism, only orchestrates the three; runtime constraint inherited from [open-questions.md:120](../open-questions.md) (≤5 min per CI run) |

**Why this satisfies all four maintainer corrections:**
1. *«нужно три проектных решения — запланируем три»* → v1 / v1.5 / v3 as named sub-waves with their own kickoffs.
2. *«параллельно или поочерёди»* → table's "Parallel with" column declares the dependency graph; v0+v1 start immediately, v1.5/v3 after v0.
3. *«дружим с Superpowers — используем его для manual»* → v3 explicitly dogfoods SP's pressure-scenario pattern (process-layer, substrate-pure) and becomes a strong N5 give-back precursor (the template itself is contributable).
4. *«distribution проверить — внести в план»* → v0 is exactly that audit, made a first-class sub-wave (not an unstated assumption).

## §4 Sequencing recommendation (the "when")

**Dependency graph (textual — `→` = «must finish before», `‖` = «runs in parallel»):**

```text
            ┌─── v1 (ESLint) ──────────┐
v0 (audit) ─┤                          ├─── v2 (full-sweep regression)
            ├─── v1.5 (cmd/script) ────┤
            └─── v3 (manual via SP) ───┘
```

**Ship order (5 sub-waves, 3 parallel stages):**

1. **Stage 1 (start now, parallel):** v0 (R-phase, hours) ‖ v1 (build, days). v0 publishes the criticality table, v1 ships the ESLint gate; they have **no shared state** (audit doc vs hook+schema code). If v0 surfaces a re-scope finding mid-flight, v1 can absorb in design-confirm without restart.
2. **Stage 2 (after v0 lands, parallel):** v1.5 (build, days) ‖ v3 (build+design, days-week). Both inherit v0's per-rule list verbatim. Different mechanisms (fixture-runner vs SP-pressure-scenario), different files (validator/runner vs `agents/*.md`) → genuinely independent.
3. **Stage 3 (after v1 + v1.5 + v3 all merged):** v2 (build, days). v2 is a thin CI orchestrator over the three change-scoped mechanisms, run in full-sweep mode. **No own substrate** — purely a wiring volume. Cannot start until all three siblings are live.

**Calendar estimate (single maintainer, no concurrency cap):** v0 ≈ ½ day · v1 ≈ 3–5 days · v1.5 ≈ 3–5 days · v3 ≈ 5–7 days (companion-contract design + dogfood loop) · v2 ≈ 2–3 days. **Total wall-clock ≈ 10–15 days** if Stage 2 runs both sub-waves in parallel sessions; ≈ 15–20 days strictly sequential.

**Cross-wave couplings:**
- **N5 give-back:** v1 + v3 are both prime N5 contribution material (v1 = the deterministic gate skill; v3 = the manual-rule-probe pattern as a skill or AI-agnostic agent). Sequence the umbrella BEFORE N5 unblocks (N5 is gated on N7 live-dogfood anyway, per [wave-sequencing-plan.md §0](../wave-sequencing-plan.md)).
- **N6b one-button install:** the umbrella's schema change (`negative-test.input: string[]`) must propagate to the install scaffold's templates — if N6b ships first, it needs a follow-up schema bump; if umbrella ships first, N6b inherits clean.
- **N8 A-phase (offload):** independent surface (offload candidates vs guard verification) — no coupling.

**Admission:** proposed as candidate **N9 umbrella** with 5 sub-waves (v0/v1/v1.5/v3/v2). Number = maintainer call. Recorded in [wave-sequencing-plan.md §0](../wave-sequencing-plan.md) as a candidate row, NOT an admitted committed wave.

## §5 §1.7 self-reflexive note

- **Forward-check:** complies with [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) (engine ADOPTed, only the gate-wiring is BUILD, verdict provisional pending the full search), [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (the roundtrip is deterministic ESLint `Linter` — zero API-billed calls; this is the determinism axis that distinguishes us from Superpowers' LLM pressure-scenarios), [rule-enforcement-channel-selection.md §3](../../../.claude/rules/rule-enforcement-channel-selection.md) (detectable→gate, earliest reachable channel, change-scoped = narrowest reliable trigger). The schema change touches `examples.bad`/`negative-test` — a capability commit → the implementing PR carries a `Prior-art:` trailer citing this patch + the (completed) §2 verdict.
- **Backward-check:** scope-additive — extends principle 02 from structural to liveness; supersedes nothing. The «Phase 5» limitation note in principle 02's header should be updated (not deleted) to point here once shipped. No other guard is silently changed.

## §6 See also
- [packages/core/principles/02-paired-negative-test.test.ts](../../../packages/core/principles/02-paired-negative-test.test.ts) — the structural-only guard this gate upgrades.
- [packages/core/validator/gate-rule-tester.ts](../../../packages/core/validator/gate-rule-tester.ts) — the reused roundtrip engine.
- [.claude/rules/rule-enforcement-channel-selection.md](../../../.claude/rules/rule-enforcement-channel-selection.md) — channel-map basis.
- [2026-05-21-niche-strategy-and-growth-roadmap.md](2026-05-21-niche-strategy-and-growth-roadmap.md) — N1 complementarity finding + N5 give-back (this gate is a candidate).
- [.claude/orchestrator-prompts/guard-liveness-gate/kickoff.md](../../../.claude/orchestrator-prompts/guard-liveness-gate/kickoff.md) — executable brief (gitignored).
