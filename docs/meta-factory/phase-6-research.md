# Phase 6 — Step 0 entry research (Layer 3 Synthesizer Path A)

> **Trigger:** [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) — Phase 6 entry gate.
> **Reordering note:** EXECUTION-PLAN §6 originally had Phase 7 = L3 + L5 combined. Phase 5/6/7 boundaries reassigned 2026-05-08 — Phase 5 = L2, Phase 6 = L3 only (without L5 Installer), Phase 7+ = L4 Validator + L5 Installer. Reasoning: L5 Installer needs L3 output to install; L3 v1 produces SynthesisPlan as a structured artefact that L5 will later emit. EXECUTION-PLAN §6 update consolidated in Phase 6 retro.
> **Method:** context7 MCP queries — AIF `/lee-to/ai-factory` (`aif-implement`/`aif-plan`/`aif-loop` patterns), ESLint `/eslint/eslint`, typescript-eslint `/typescript-eslint/typescript-eslint`. Anthropic SDK + LangGraph results from Phase 5 carried forward (still in scope for v2 LLM extension).
> **Status:** transient artifact per §5.5 — ≤200 lines; archived after Phase 6 closes.
> **Question answered:** which Phase 6 capabilities reuse existing solutions vs build, and what is the deterministic v1 deliverable shape for Layer 3 Path A?

---

## §1. Capabilities Phase 6 will cover

Per [architecture.md §2.5 + §3.1](architecture.md):
1. **SynthesisPlan schema** — structured artifact derived from ResearchPlan, contains: per-pattern manifest entries + ESLint config snippets + RULES.md fragments + paired negative test scaffolds.
2. **Curated synthesis recipes** — deterministic mapping `<patternId>.json → ManifestRule + ESLintConfig + Markdown + NegativeFixture`. Mirrors Phase 5 store layout.
3. **Pure synthesize function** — `synthesize(plan: ResearchPlan): SynthesisPlan`, no side effects.
4. **Emitter function** — `emit(plan: SynthesisPlan, outputDir: string): void` separate side-effecting layer (Executor role).
5. **CLI surface** — `synth [<root>] [--from-research <plan.json>] [--output <dir>] [--pattern <id>]`.
6. **Self-application** — round-trip detect → research → synth on own repo + on next-16 fixture; snapshot stable.

**Deterministic v1 pivot (consistent with Phase 5).** No LLM calls in v1. Curated recipes hand-authored, committed to repo. LLM-driven Path A++ deferred to v2 trigger (first real consumer or Phase 8 acceptance test).

**Path A constraint** ([architecture.md §3.1](architecture.md)): no AST plugin generation. Recipes only configure existing ESLint plugins (e.g. `react-hooks`, `import`, `@next/eslint-plugin-next`) or reference rules already in `packages/preset-next-15-canonical/eslint-rules/`. Path B (AST generation) explicitly Phase 9+.

**Module surface contract (consistent with Phase 5 Planner-Executor):**
- `packages/core/synthesizer/index.ts` exports `synthesize` (pure) + types.
- Side-effect `emit()` lives in a separate sub-module imported only by CLI; not part of the public Layer 3 contract.
- Layer 4 Validator (Phase 7+) consumes `SynthesisPlan` (validated structure), not file outputs.

---

## §2. Tools resolved (context7)

| Tool | Library ID | Benchmark | Notes |
|---|---|---|---|
| AI Factory `aif-implement` / `aif-plan` / `aif-loop` | `/lee-to/ai-factory` | 83.7 | LLM-driven plan→execute pipeline; **convergent design** with our research→synth (different execution mode: LLM vs deterministic) |
| ESLint | `/eslint/eslint` | 80.04 | Flat config composition; canonical pattern reference for recipe outputs |
| typescript-eslint | `/typescript-eslint/typescript-eslint` | 82.74 | Already transitive via `@typescript-eslint/rule-tester` (Phase 4 verified). Used for typed lint rule configuration |

LangGraph + Anthropic SDK results from [phase-5-research.md §2](phase-5-research.md) remain valid for v2 LLM extension; not re-queried.

---

## §3. Per-capability matrix

### 3.1 SynthesisPlan schema

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF plan-file format | Markdown with `## Tasks` checklist + Settings/Commit-Plan sections | Human-readable; LLM-driven; not JSON-validatable for typed consumers |
| `factory/rules-manifest.json` schema | Existing JSON Schema for rule entries | **Direct reuse target** — synthesized rules slot into the same shape |
| Phase 6 plan | `SynthesisPlan = { synthesizedRules: SynthesizedRule[], frameworkScope, ... }` JSON | Versioned; per-pattern keyed; consumes ResearchPlan; emits manifest-compatible entries |

**Verdict:** **Build domain-specific top-level schema; reuse rules-manifest.schema.json semantics for the rule-entry sub-shape.** Each `SynthesizedRule` has the same fields as a manually authored rule (title, stack, applies-to, check, examples) — synthesizer just generates them deterministically.

### 3.2 Curated synthesis recipes

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF skill-context format | `.ai-factory/skill-context/<skill>/SKILL.md` | Already shipped Phase 4 read+write; not synthesis recipe format |
| AIF aif-evolve auto-generated rules | Markdown rules in skill-context | LLM-driven; post-hoc patch mining |
| Phase 6 plan | `synthesizer/recipes/<patternId>.json` — declarative mapping pattern → output artifacts | Deterministic; testable via fixtures; mirrors Phase 5 store layout |

**Verdict:** **Build domain-specific recipes.** Same posture as Phase 5 curated store — hand-authored, committed, snapshot-stable. ≤3 recipes for v1 (one per Next 16 pattern); shared/ recipes for cross-version (Tailwind).

### 3.3 Pure synthesize function

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF aif-implement | LLM executes tasks from plan file | Non-deterministic; plan-file format |
| Phase 6 plan | `synthesize(plan: ResearchPlan): SynthesisPlan` — pure function, recipe lookup | Deterministic; testable; Phase 5-Phase 6 contract bridge |

**Verdict:** **Build.** Same playbook as Phase 5 `research()`. Module-surface enforcement of Planner-Executor (no file writes in pure function).

### 3.4 Emitter function

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF aif-implement plan execution | LLM writes files based on plan tasks | LLM-driven |
| Phase 5 emitter pattern (deferred) | N/A — Phase 5 only writes via cli.ts to `expected-self-research.json` | Phase 5 has no public emit; just snapshot freeze |
| Phase 6 plan | `emit(plan: SynthesisPlan, outputDir: string): void` in separate sub-module | Side-effect deliberately segregated; CLI imports both `synthesize` + `emit`; public API exports only `synthesize` |

**Verdict:** **Build with explicit Planner-Executor segregation.** Pure synthesize for L4 Validator consumption; emit for actual file generation. CLI is the only consumer of both.

### 3.5 CLI surface

| Solution | Mechanism | Differentiator |
|---|---|---|
| AIF `/aif-implement` | Slash-command in AI session | Different audience |
| Phase 4 detector / Phase 5 research CLI | `npx tsx packages/core/<layer>/cli.ts` standalone | Established repo pattern |
| Phase 6 plan | `npx tsx packages/core/synthesizer/cli.ts [<root>] [--from-research <plan.json>] [--output <dir>] [--pattern <id>]` | Same pattern; adds emitter mode |

**Verdict:** **Build (mirror Phase 4/5 pattern).** ≤60 LOC; no yargs/commander.

### 3.6 Self-application

| Solution | Mechanism | Differentiator |
|---|---|---|
| Phase 4 detector snapshot | Frozen JSON, CI diff | Pattern reused Phase 5 |
| Phase 5 research snapshot + drift detection | Frozen JSON + L2 invariants (a)+(b) | Reused for L3 |
| Canonical regen (per [EXECUTION-PLAN §6 Phase 7](EXECUTION-PLAN.md)) | Synth on Next 15 → diff vs `packages/preset-next-15-canonical/` ≤5% | **Heavy v2 deliverable** — defer to Phase 6 v2 or Phase 7 |
| Phase 6 v1 plan | Round-trip snapshot on (a) own repo, (b) one fixture next-16 stack | Snapshot stability is a meaningful invariant; canonical-regen-with-diff deferred |

**Verdict:** **Build round-trip snapshot for v1; defer canonical regen to Phase 6 v2 / Phase 7.** Self-application invariant L3 (a) closed via snapshot stability; (b) canonical-regen ≤5% deferred with documented split-point.

---

## §4. Reuse-vs-build decisions

| # | Capability | Decision | Rationale |
|---|---|---|---|
| 6.1 | SynthesisPlan top-level schema | **Build domain-specific** + reuse rules-manifest.schema.json sub-shape for SynthesizedRule | Synthesized rule entries = same shape as manual entries; only top-level wrapper is new. |
| 6.2 | Curated recipes | **Build (mirror Phase 5 store)** | Deterministic v1 keeps recipes hand-authored. ≤3 recipes for v1. |
| 6.3 | Pure synthesize function | **Build** | Mirror Phase 5 `research()` Planner contract. |
| 6.4 | Emitter function | **Build with Planner-Executor segregation** | Side-effect explicit; not in public API. |
| 6.5 | CLI | **Build (mirror Phase 4/5)** | ≤60 LOC, no library. |
| 6.6 | Self-application | **Build round-trip snapshot v1; defer canonical regen** | Snapshot stability is sufficient invariant for v1; canonical regen ≤5% target needs richer recipes than 3-pattern v1 set. |
| 6.7 | rules-manifest.schema.json reuse for entry shape | **REUSE** | First-class schema reuse — synthesized entries are valid manual entries. Simplifies Phase 7+ Installer (no separate "synthesized-rules" parser). |
| 6.8 | typescript-eslint as transitive dep | **REUSE** | Already in lockfile; recipes can reference `@typescript-eslint/*` rule names without explicit install. |

**Acceptance per §5.5:** matrix complete + per-capability verdict + ≥1 reuse decision. Achieved via:
- **Reuse 6.7 (manifest schema):** SynthesizedRule shape = manual rule shape (Ajv validates against existing `rules-manifest.schema.json`).
- **Reuse 6.8 (transitive):** typescript-eslint, semver, Ajv all transitive — no new explicit deps.

**Net Phase 6 scope = 5 build (domain-specific) + 1 strong reuse (manifest schema) + 1 transitive reuse + 1 deferral (canonical regen v2).**

---

## §5. Verdict — proceed with PHASE-6-PROMPT.md draft

**GO.** Phase 6 prompt drafted with these design decisions:

1. **Curated v1 (no LLM):** synthesis recipes at `packages/core/synthesizer/recipes/<patternId>.json`, hand-authored; mirror of Phase 5 store layout.
2. **Planner-Executor module surface:** `synthesizer/index.ts` exports `synthesize` (pure) + types only. Emitter lives in `synthesizer/emit.ts`, imported only by CLI.
3. **Manifest schema reuse:** SynthesizedRule shape inherits `rules-manifest.schema.json#/definitions/RuleEntry` (where applicable) — generated entries indistinguishable from manual ones at the schema level.
4. **3-recipe initial v1:** one per Next 16 pattern that has a Phase 5 ResearchEntry. Tailwind recipes deferred (no canonical preset for Tailwind to anchor against).
5. **Round-trip snapshot v1:** detect → research → synth on (a) own repo (empty plan baseline) and (b) `packages/core/synthesizer/fixtures/next-16-fixture/` (3-rule plan). CI gate `framework-self-synth` mirrors Phase 5 pattern.
6. **Canonical regen ≤5% target deferred** to Phase 6 v2 or Phase 7. Documented split-point per phase-5 retro precedent.

**Risks:**
- **Recipe rigidity** — Phase 6 v1 recipes may not generalize when Phase 8 acceptance test (Next 15→16) demands richer rule synthesis. Mitigation: extend recipes additively; canonical regen verifies coverage.
- **SynthesizedRule ↔ ManifestRule drift** — if rules-manifest.schema.json evolves (Phase 7+), synthesizer must track. Mitigation: synthesizer test suite validates emitted entries against current schema on every CI run.
- **Cross-rule conflict** — synthesized rules may contradict existing `packages/preset-next-15-canonical/eslint-rules/`. Mitigation: deterministic recipes are reviewed at authoring; full conflict detection is L4 Validator's job (Phase 7+).

**Stop-rule:** if recipe count grows >10 before Phase 6 closes → too eager scope. Cap at 3 for v1; defer additions to Phase 6 v2.

---

## §6. Forward implications (watch-list)

| Item | Trigger | Owner |
|---|---|---|
| Canonical regen with ≤5% diff vs `packages/preset-next-15-canonical/` | Phase 8 acceptance test entry OR explicit Phase 6 v2 trigger | Phase 6 v2 / Phase 7 prompt author |
| LLM-driven recipe generation (Path A++) | First real consumer OR Phase 8 acceptance test | Phase 6 v2 |
| Path B (AST plugin generation) | Niche pattern not covered by Path A configuration alone | Phase 9+ |
| L4 Validator gates: tautology check, mutation, cross-rule conflict | Phase 7 entry | Phase 7 prompt author |
| L5 Installer: actual file writes to consumer projects | Phase 7 (combined with L4 per original §6, or split if Phase 7 scope is too large) | TBD at Phase 7 entry |
| Recipe ↔ AIF skill-context reconciliation | If aif-evolve mining produces overlapping rules | Phase 11 |

These are watch-list items, not Phase 6 commitments. Re-validate via context7 at each Phase entry per §5.5.
