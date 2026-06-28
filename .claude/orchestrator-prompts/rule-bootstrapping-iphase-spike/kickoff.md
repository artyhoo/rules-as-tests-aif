# Rule-bootstrapping I-phase SPIKE — wire the install-time pipeline skeleton

> Scope: I-phase implementation kickoff (a SPIKE) — wire the rule-bootstrapping pipeline SKELETON end-to-end on ONE stack. NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

> **Staging-placement reminder** ([kickoff-staging-placement.md §1](../../rules/kickoff-staging-placement.md)): tracked dispatch-input read from `staging`. This kickoff is REVIEWED + REFINED in a session, then dispatched to aif from the refined local copy. Keep it on `staging` so a fresh review session finds it.

> **Process (operator decision 2026-06-28):** do NOT dispatch this to aif directly. A review session iterates verify→fix on THIS kickoff until reviewers return GO, and ONLY THEN dispatches to aif. See the companion review-session prompt.

## §0 Goal of the spike

Wire the rule-bootstrapping pipeline SKELETON end-to-end at install time on ONE stack (`react-next`): a `RuleResearchClient` port (STUBBED in this spike) → the existing `generate.ts` factory (rule + paired-negative test) → the existing-but-DEAD `buildLock` → `rules-lock.json`, behind a `--full`-gated, session-bound install-time entry ($0 in CI). This de-risks the seam and REVIVES the dead lock. The LIVE MCP-research adapter (context7/deepwiki + tool-bootstrapping-discovered MCPs) is the NEXT slice — OUT of this spike (it is agent-session work, not container-buildable). This is an I-PHASE (code + tests).

## §1 Why this spike (architecture, decided)

Vision: one-button `./setup` live-researches a stack's best-practices/anti-patterns and generates ESLint rules + guarding tests, on a stable universal core. Operator decisions (ratified 2026-06-28):

- **Research is AGENT-driven** (a session uses MCP channels) — NOT code-driven. context7/deepwiki are the **SEED**; the flow then discovers+installs stack-specific MCPs/skills (the existing `tool-bootstrapping` mechanism, Rules 1-2) and researches with the ENRICHED toolset. **rule-bootstrapping COMPOSES with tool-bootstrapping** (stage 1 = acquire research tools; stage 2 = use them → rules).
- Because the live research is agent/session work (and MCP availability inside an autonomous container is uncertain), **this spike does NOT do live research.** It builds the deterministic SKELETON behind a `RuleResearchClient` **port + stub**, so the live adapter plugs in next without re-plumbing.

## §2 Verified grounding (re-confirm each; recon 2026-06-28 + R-phase #798 `docs/meta-factory/research-patches/2026-06-28-rule-bootstrapping.md`)

- **Factory exists, unwired:** `packages/core/synthesizer/generate.ts:84-90` `synthesizeGenerate(plan, client)` → ESLint rule + paired-negative test; L4 degrades to research-only if rejected. Port: `packages/core/synthesizer/generate-port.ts` (`GenerateClient`); stubs: `packages/core/synthesizer/generate-stubs.ts` (`stubGenerateRN`/`stubGenerateBad`).
- **Research port pattern to MIRROR:** `packages/core/research/research-port.ts` (`ResearchClient` + `stubFrozenResearch`) — copy this shape for the new `RuleResearchClient`.
- **Lock exists, DEAD:** `packages/core/installer/install.ts:41` `buildLock(plan, emittedAt)` → `rules-lock.json` (ruleIds+emittedAt+sourceFingerprint); `install.ts:108-122` collision/drift guard; `install()` = emit + buildLock + validate. ZERO install-flow callers today (only the unused `rules-as-tests-install` bin).
- **Install seam:** `setup.d/99-finalize.sh` already shells out to `packages/core/install/synth-and-wire.bundle.mjs` (deterministic, "no LLM; no network", principle 17). `--full` gate pattern: `install.sh` sets a FULL carrier; `setup.d/05-mcp.sh` is gated on it (no-ops on non-full/snapshot → byte-identical preserved).
- **$0-in-CI invariant:** `tests/agnosticism/probes/paid.sh` asserts no `ANTHROPIC_API_KEY`; principle 17 (`packages/core/principles/17-no-paid-llm-in-ci.test.ts`). The CI self-install path MUST stay on the deterministic/stub route.

## §3 Build steps (the spike)

1. **`RuleResearchClient` port + deterministic stub.** New `packages/core/synthesizer/rule-research-port.ts` mirroring `research-port.ts`: interface `research(detection) → RulePracticeFindings` + `stubRuleResearch` returning a FIXED react-next finding (one real, well-known react-next practice/anti-pattern — e.g. "no raw `<img>`; use `next/image`"). The live MCP adapter is OUT (document the port as its plug-in seam).
2. **Seam: findings → factory.** Wire `stubRuleResearch` output → a `SynthesisPlan` / `GenerateClient` input → existing `synthesizeGenerate` → emit. Reuse the §4 seam design from the #798 R-phase doc (read it; it designed this boundary).
3. **Revive the lock.** After emit, call `installer/install.ts` `install()`/`buildLock` so the spike actually PRODUCES a `rules-lock.json` for the generated rule (first time the dead lock runs in a real flow).
4. **Install-time `--full` gate.** A new `setup.d/` step (or a guarded branch in `99-finalize.sh`) that runs steps 1-3 ONLY on the `--full` carrier + session-bound — NEVER in the CI self-install path. Opted-out / non-full path = byte-identical (L4/L5 snapshots unchanged).
5. **Tests (paired-negative, $0):** a good stub finding → a rule+test that FIRES (non-vacuous: real `Linter.verify` violation + clean case); a bad/empty stub finding → L4 reject / no rule emitted. Mirror `generate.test.ts`.

## §4 Hard constraints

- **Capability commit:** the new port/wiring is likely ≥50-80 LOC → the commit MUST carry a `Prior-art: …#183` trailer AND land the **#183 SSOT row in the SAME commit** (`docs/meta-factory/prior-art-evaluations.md`, append-only; #183 = the rule-research bridge, BUILD — drafted in the #798 R-phase doc §11). A missing trailer / separate-commit SSOT row trips `.husky/pre-push`.
- **$0-in-CI:** no live LLM / no network in the spike. The stub is the only research source here. CI self-install path unchanged.
- **L4/L5 byte-identical for the opted-out path** (don't regress existing snapshots). The new pipeline runs only behind the `--full` install-time gate.
- Do NOT build the live MCP-research adapter, per-stack beyond react-next, the rules-ledger, or the recursive tool-discovery — those are the NEXT slices (name them in a closing "Next slices" section of the PR/commit body).
- Do NOT touch the universal core rules (`packages/core/eslint-rules/`).

## §5 AI-laziness traps (per [ai-laziness-traps.md §3](../../rules/ai-laziness-traps.md))

See `.claude/rules/ai-laziness-traps.md §2` for the full catalogue. Active traps for this I-phase: **T3, T15, T16**.

- **T15** — the spike's generated rule MUST come WITH its guarding test (paired-negative); a rule without a firing test is `#discipline-theatre`.
- **T16** — reuse the `ResearchClient`/`GenerateClient` PORT pattern because the problem-class matches (injectable live/stub seam), not just because the names rhyme; state the match explicitly.
- **T3** — re-read every `file:line` in §2; do not trust recalled line numbers.

**Domain-specific trap (NOT in the canonical catalogue):**

- **T-RBI-A** — do NOT let the stub-research spike silently become "the feature": it proves the SKELETON only. The PR/commit body MUST state plainly "research is STUBBED here; live MCP adapter is the next slice" — never imply live research works.

## §6 Fork discipline (park-don't-guess — for the aif executor)

On ANY genuine fork (e.g. exact install-time hook location: new `setup.d/NN-*.sh` step vs a guarded branch in `99-finalize.sh`; exact `rules-lock.json` placement in the consumer tree; whether the stub finding is a real react-next practice or synthetic) where two designs are defensible — do NOT pick. **Park it as a question** (set the task to `manualReviewRequired` / `blocked_external`, state «Option A → consequence X / Option B → consequence Y») and stop that part; proceed on the unambiguous parts. Guessing a fork to "keep moving" is the failure this exists to prevent.

## §7 Done

`./setup --full` on a react-next fixture runs stub-research → `generate.ts` → emits a rule+guarding test → `buildLock` writes a real `rules-lock.json`; the opted-out path is byte-identical; paired-negative tests green; capability commit carries the `Prior-art:#183` trailer + the #183 SSOT row in the same commit. Commit on a feature branch off `staging`; do NOT push — the host harvests.

## §8 See also

- `docs/meta-factory/research-patches/2026-06-28-rule-bootstrapping.md` — the R-phase design this spike implements (§4 seam, §11 SSOT #183 draft).
- `docs/meta-factory/research-patches/2026-06-28-generation-live-delivery.md` — sibling R-phase (delivery axis; Q1=B decided).
- [.claude/rules/ai-laziness-traps.md](../../rules/ai-laziness-traps.md), [build-first-reuse-default.md](../../rules/build-first-reuse-default.md), [kickoff-staging-placement.md](../../rules/kickoff-staging-placement.md).
