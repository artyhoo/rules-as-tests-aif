<!-- scope:generation-live-delivery -->
# Generation as live delivery (thesis-realization) — R-phase research-patch

> Scope: gap «should the meta-factory's rule SYNTHESIZER become the LIVE consumer-config delivery, or stay an SSOT with presets as the projection?». Folder-authority: [research-patches/](./) (scope-bound by gap). Kickoff source: [`.claude/orchestrator-prompts/generation-live-delivery/kickoff.md`](../../../.claude/orchestrator-prompts/generation-live-delivery/kickoff.md). NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
> Method: code read against the working tree (re-confirmed each kickoff `file:line` with grep/read — lines drift), prior-art via WebSearch ≥3 phrasings (DeepWiki MCP `ask_question` **unavailable in this environment** — see §Q5), `ai-laziness-traps` T2/T4/T11/T12/T15/T16/T20 + T-GLD-A honored.
> **This session decides nothing strategic.** Q1 is a genuine project-strategy fork → PARKED as a maintainer decision per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md). Q2–Q5 are researched; their verdicts are evidence-backed but several are *conditional on Q1*.
> Date: 2026-06-28.

---

## §0 Architectural ground truth (re-confirmed 2026-06-28, with `file:line`)

The repo ships **two disjoint config-delivery pipelines**. Every claim below was re-verified this session (not taken from the kickoff narrative).

### Pipeline A — the shipped consumer install path (preset carries delivery; synth is a no-op overlay)

- `setup.d/40-configs.sh` places recipe-synced **presets** + universal custom-rule files into the consumer (the §6a config subset; e.g. `eslint.config.react.mjs` for `STACK=react-next`).
- `packages/core/install/synth-and-wire.ts:5-8` — the synthesizer here is explicitly a **drift-correcting no-op**: *«Idempotent: if the preset template already contains all synthesized selectors (which principle 26 guarantees for in-sync templates), this is a fast no-op with no writes.»* The hand-authored preset carries the actual delivery; `synth-and-wire` only re-asserts/repairs.
- `packages/core/install/wire-eslint-r2.ts` — the R2 per-package wirer (`no-unsafe-zod-parse`) escalates a bare→self-contained probe and merges into the consumer's `eslint.config.mjs`. This is the only Pipeline-A component that *mutates* a live consumer config at install time.
- principle 26 (`packages/core/principles/26-template-selector-sync.test.ts`, header lines 1-20) keeps the preset's hand-inlined selectors **byte-synced** to the recipe SSOT: *«every selector the synthesizer generates under the wrapper for a preset MUST appear verbatim in that preset's shipped template»*. So the next preset is recipe-synced delivery, **not** stale-static config.

### Pipeline B — the full generation engine, NOT wired into consumer install

- `packages/core/installer/install.ts` — `install(plan, opts)` runs `validate` → `emit(plan, outputDir)` → `buildLock` → writes `rules-lock.json`, re-validates. Output goes to `OUTPUT_SUBPATH = ['.ai-factory', 'synthesizer-output']` (a **staging directory**, not the consumer's live `eslint.config.mjs`).
- `packages/core/synthesizer/emit.ts` (lines ~30-50) writes **five files**: `rules-manifest-additions.json`, `RULES-additions.md`, **`eslint-rules-snippet.json`** (the rules object as a JSON *snippet*), `provenance.json`, and (via `install.ts`) `rules-lock.json`. **It emits a config *snippet*, not a wired `eslint.config.mjs`.**
- Exposed **only as a bin**: `packages/core/package.json:8-13` → `"rules-as-tests-install": "./installer/cli.ts"`. `cli.ts` chains `detectStack → research → synthesize → validate → install`.
- **ZERO callers in the consumer install flow.** `grep -rn 'rules-as-tests-install|buildLock|\.emit(|installer/cli' install.sh setup.d/ package.json bin/` → empty. Pipeline B is never invoked by `install.sh`/`setup.d`.

### Coverage facts

- **All 10 synthesizer recipes target `next`** (`grep '"appliesTo"' packages/core/synthesizer/recipes/*.json` → every file `["next"]`).
- **Presets present:** `preset-next-15-canonical`, `preset-react-spa` (`eslint.config.react.mjs`), `preset-react-native` (`eslint.config.{bare-rn,expo,rn-common}.mjs`). **No `preset-ts-server`** (`ls -d packages/preset-*ts*` → empty).
- **Principle 26's `WRAPPER_TEMPLATES` covers only `preset-next-15-canonical`** (verified in the test source). ⇒ **react-spa / react-native presets are hand-authored and have NO recipe-sync drift guard at all**; ts-server has neither preset nor recipe and ships only the universal core customs.
- **Universal custom rules** (`packages/core/eslint-rules/index.ts`): R2 `no-unsafe-zod-parse`, R7 `no-direct-time-randomness`, R8 `require-otel-span` — delivered via core + preset, never via synth.
- **Scoping brick (#796 / SSOT #182):** `scope?: { files: string[] }` is now a parameter on BOTH emitters — `r2Element` (`wire-eslint-r2.ts:40,43`) and `buildRuleConfigElement` (`:231-235,436`). A generated rule can emit as an ESLint-native workspace-scoped block `{ files: ['<dir>/**'], rules: {...} }`. This umbrella builds on that brick.

⇒ **The generation thesis is realized for react-next only — and even there the synth is a no-op overlay over a hand-authored preset.** Live delivery is presets, not generation. The thinnest stacks (ts-server, and the non-next presets) have no generation and no drift guard. This umbrella researches whether to change that.

---

## §Q1 — Live delivery vs SSOT-projection **[PARKED — maintainer decision, NOT decided here]**

> **DECISION-NEEDED:** Should the synthesizer **emit the consumer's config directly** (generation becomes the live delivery, retiring preset-as-delivery), or **stay an SSOT** with presets as a **generated/validated projection** of the recipes?

This has **no determinate answer on technical merits alone** — it trades maintenance surface against thesis-realization, and the right call depends on maintainer priorities (single-maintainer budget per [build-first-reuse-default.md §2](../../../.claude/rules/build-first-reuse-default.md), how literally «generated, not static» must hold). Per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) I state both options' consequences and stop.

### Option A — **Live-emit delivery** (synthesizer emits the wired consumer config; presets retire or become bootstrap-only)

- **Downstream consequences (+):** the thesis is literally realized — the artifact the consumer runs *is* generated from the recipe SSOT, zero hand-copy. Eliminates the «third copy» (recipe → snippet → hand-inlined template) that principle 26 exists to police (§Q4). Per-stack coverage scales by authoring recipes, not by hand-authoring+syncing a preset per stack.
- **Downstream consequences (−):** install now has a **load-bearing codegen step on the consumer's critical path** — a synth/emit/wire failure breaks install unless it degrades to a fallback (and the fallback is… a preset, so presets cannot fully retire — they become the degraded path). Larger install-time surface, more failure channels (`degrade`/`unrecognised`/`already-wired` already exist in `synth-and-wire.ts:141-161`). Net maintenance may *rise*, not fall, contradicting BFR §2's «distribute maintenance upstream» logic — because the generator is **our** code.
- **What «generated, not stale» actually requires operationally:** (i) a deterministic, `$0`, CI-safe compile (Path A already is — `synthesize` is pure, principle 17 `no-paid-llm-in-ci`); (ii) a **wiring last-mile** that produces a consumer-loadable `eslint.config.mjs` (today only Pipeline A's `wireNRules` does this; Pipeline B stops at a snippet — see §Q2 T16); (iii) graceful degradation to a static fallback when emit/wire can't proceed ([dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md)); (iv) a drift guard that the *generated output* matches the recipes (§Q4).

### Option B — **SSOT-projection** (recipes stay the SSOT; presets are a *generated/validated projection*, checked-in)

- **Downstream consequences (+):** keeps the simple, robust install (static file placement — no codegen on the consumer critical path) while **closing the staleness hole**: presets are *generated from* recipes by the maintainer and a CI gate fails if a preset drifts from its recipe. This is the industry-standard **golden-file codegen pattern** (`make generate` + `git diff --exit-code`; see §Q5 — oapi-codegen/graphql-codegen/templ). Principle 26 already *is* a (partial) instance of this — it just guards a hand-inlined selector rather than a fully-generated file.
- **Downstream consequences (−):** the consumer-run artifact is still a static file (not generated *at the consumer*), so a purist reading of the thesis («the consumer runs generated rules») is only satisfied at the *maintainer's* generation boundary, not the consumer's. Per-stack coverage still needs a generated preset per stack (cheaper than hand-authoring, but not free).

### Why this is the primary fork (T-GLD-A honored)

Presets are recipe-synced (next) **and principle-26-protected** — a live argument *for* the status quo, not merely thesis-debt. The choice is **not** «generation good / presets bad»; it is **where the generation boundary sits** (consumer install-time vs maintainer build-time). Both satisfy «documents lie; tests don't» *if* a drift gate exists; they differ on install-time risk vs thesis-literalness. **Decided by the maintainer or a dedicated `/orchestrator` session — not this R-phase.**

---

## §Q2 — Wiring Pipeline B (conditional on Q1 trending live-emit)

**T16 problem-class check (kickoff §3, mandatory):**
- **Pipeline B problem class:** emit a *versioned, validated, provenance-tracked bundle* (`eslint-rules-snippet.json` + manifest + `RULES-additions.md` + `provenance.json` + `rules-lock.json`) into a **staging dir** `.ai-factory/synthesizer-output/` (`install.ts` `OUTPUT_SUBPATH`).
- **Our delivery problem class:** produce a **wired, consumer-loadable `eslint.config.mjs`** that ESLint actually resolves and runs.
- **Match? PARTIAL — evidence:** `emit.ts` writes a *snippet* (`eslint-rules-snippet.json`), and `install.ts` writes a *lock*; **neither merges into the consumer's live `eslint.config.mjs`**. The merge/wire last-mile is Pipeline A's `wireNRules`/`wire-eslint-r2.ts` (`grep wireNRules` → only `wire-eslint-r2.ts` + `synth-and-wire.ts`). **So Pipeline B is the generate+validate+lock *half*; it is NOT a drop-in live-delivery engine** — wiring is still Pipeline A's job. The kickoff's T16 caution is confirmed: Pipeline B «looks like a generator» but emits a lockfile+snippet to a staging dir, not a wired config.

**Migration / back-compat strategy (IF live-emit is chosen):** the two pipelines **compose, they do not compete** — mirroring the prior `generation-paths-comparison` verdict that the *engine* paths «layer, not compete» (PR #698, SSOT #173/#174). Sketch: `detectStack → research → synthesize → install()` (emit snippet+lock to `.ai-factory/synthesizer-output/`) → **feed `eslint-rules-snippet.json` into Pipeline A's `wireNRules`** to merge into `eslint.config.mjs`, threading the `scope` seam (#796/#182) for per-workspace blocks. Back-compat: keep `setup.d/40-configs.sh` preset placement as the **graceful-degradation fallback** (install never aborts — `synth-and-wire.ts` already `process.exit(0)` on every failure path). This is a **new I-phase**, gated on Q1; do not implement here.

---

## §Q3 — Per-stack generation coverage (ts-server / react-native / react-spa)

**Evidence of the gap:** ts-server has **no preset and no recipes** (`ls -d packages/preset-*ts*` → empty; no `appliesTo:["ts-server"]` recipe); react-spa/react-native have **hand-authored presets with no principle-26 drift guard** (`WRAPPER_TEMPLATES` = next only). So the «recipe-synced delivery» property the status quo relies on **holds only for react-next**.

**What each stack genuinely needs beyond universal R2/R7/R8 (real domain work, not thesis-vanity — T-GLD-A):**
- **ts-server (Hono/Fastify/Express):** the universal customs already fit well — R2 `no-unsafe-zod-parse` (request-body validation at the boundary) and R8 `require-otel-span` (server observability) are *most* load-bearing exactly here. Candidate stack-specific rules worth an I-phase scoping: «route handler must validate `req` with a schema before use», «no `process.env` read outside a config module». **Verdict: BUILD candidates exist but need their own domain R-phase** — do not author recipes speculatively here (T11: I have not searched the Hono/Fastify lint ecosystem this session; that search is the I-phase's job).
- **react-native (Expo/bare):** the preset already ships three configs (`eslint.config.{expo,bare-rn,rn-common}.mjs`). Domain candidates: «no web-only DOM APIs», «`Platform.select` over `Platform.OS` chains», async-storage misuse. These overlap heavily with upstream `eslint-plugin-react-native` / Expo's config — **BFR-default leans REUSE/REFERENCE upstream, not BUILD** (must be confirmed by the §Q5 mechanism in an I-phase).
- **react-spa:** ships `eslint.config.react.mjs`; mostly covered by upstream React plugins + the universal customs. Thin marginal domain surface.

**Coverage verdict:** the honest per-stack need is **uneven** — ts-server is the one stack where the universal customs are *most* apt and a small set of BUILD-worthy server rules plausibly exists; RN/SPA are largely upstream-REUSE territory. **Authoring recipes for all three is NOT warranted on thesis-purity grounds.** The actionable, stack-agnostic win is independent of Q1: **extend principle 26's drift guard (or a sibling) to the react-spa/react-native presets** so the non-next presets stop being unguarded hand-copies (§Q4).

---

## §Q4 — Principle 26 evolution

**Today:** principle 26 guards «hand-authored template selectors == generated recipe selectors» for the **next preset only** (`WRAPPER_TEMPLATES`, verified). It is already a *projection-drift* gate in miniature.

- **If Q1 → Option B (projection):** principle 26's role **sharpens and earns its keep more**, not less — it becomes «**generated output** matches recipes», i.e. the golden-file `git diff --exit-code` gate (§Q5) generalized. It should then **extend to every generated preset** (next + react-spa + react-native), closing the unguarded-hand-copy hole found in §0/§Q3.
- **If Q1 → Option A (live-emit):** the «third copy» (hand-inlined template selector) **disappears** — the consumer config is emitted from recipes directly, so there is no hand-authored template to drift. Principle 26 as written (template-vs-recipe) would lose its subject. But its *intent* (emitted-rule == recipe-SSOT) survives as a **post-emit assertion** in the install/wire path (analogous to `install.ts:postInstallChecks` ruleIds round-trip, `install.ts` lines ~55-90). So: **rename/retarget, don't retire** — the guard migrates from «template matches recipe» to «emitted+wired config matches recipe».
- **Does it still earn its keep?** **Yes under both branches** — verified by the test's own paired-negative design (header: «runs GREEN on the real tree AND RED on an inline paired-negative»). The drift it catches is real (a refined selector the copy didn't track «would silently UNDER-ENFORCE in every consumer»). Retiring it is not on the table; the open choice is *what it asserts against* (hand-template vs emitted output), which is downstream of Q1.

---

## §Q5 — Prior-art / BFR consult (the 6-layer mechanism)

**Tooling availability (stated explicitly per kickoff hard-constraint):** **DeepWiki MCP `ask_question` is NOT available in this environment** (ToolSearch for the tool returned no match). **WebSearch + WebFetch ARE available** and were used as the substitute for layers 3-4. SSOT consulted directly (`prior-art-evaluations.md`, max id #182). No search result was fabricated.

**Problem domain:** «generate lint config from a rule SSOT» / «config-as-generated-artifact». ≥3 phrasings run:

1. *«generate ESLint flat config from a single source of truth rule registry tool»* → **GenTools.io ESLint Flat Config Builder** ([gentools.io](https://gentools.io/eslint-config-generator)), ESLint's own [flat-config docs](https://eslint.org/docs/latest/use/configure/configuration-files). These are **interactive one-shot UI builders** — they generate a config *once* from menu selections, with **no SSOT-resync / no drift gate**. **Verdict: REJECT as a delivery model** (one-shot UI ≠ our recipe-SSOT-resynced delivery); REFERENCE only for the «emit a flat-config array element» shape we already do.
2. *«config as generated artifact lint config codegen from policy spec install time»* + *«generated code committed to repo drift check CI verify up to date golden file codegen pattern»* → **oapi-codegen / graphql-code-generator / templ**: the **golden-file codegen-verification pattern** — generated files are **committed**, and CI runs the generator + `git diff --exit-code`, **failing if the committed output drifts from the spec** ([oapi-codegen](https://github.com/oapi-codegen/oapi-codegen); graphql-codegen [«--check» issue #2872](https://github.com/dotansimha/graphql-code-generator/issues/2872) + [commit-generated discussion #4253](https://github.com/dotansimha/graphql-code-generator/discussions/4253); [templ #419](https://github.com/a-h/templ/discussions/419)). **This is the exact industrial analog to Q1 Option B** (presets = generated, committed, CI-drift-checked projection). **Verdict: REFERENCE** (mature, broadly-adopted pattern; our principle 26 is already a domain-specific instance — REFERENCE confirms the projection model is standard practice, not project self-indulgence). *Proposed SSOT #183 — REFERENCE — appended-on-resolution, see below.*
3. *«eslint shareable config factory function … antfu composable preset vs static»* → **antfu/eslint-config** factory pattern ([github](https://github.com/antfu/eslint-config); ESLint [shareable-configs](https://eslint.org/docs/latest/extend/shareable-configs)): in flat config a shared config can be a **factory function** `antfu(options)` returning a `FlatConfigComposer`, adapting to the project via semantic options instead of publishing N static variants. **This is a THIRD delivery model** distinct from both Q1 options: ship a *composable factory* the consumer calls, rather than a static preset (Option B) or an install-time-emitted file (Option A). **Verdict: REFERENCE / WATCHLIST** — directly relevant to Q1; a factory-function delivery could be the «generated, not stale, yet no install-time codegen» middle path (the factory computes the config at the consumer's `eslint.config.mjs` load time from our rule modules). Worth surfacing to the maintainer as a **third Q1 option**. *Not yet an SSOT entry — depends on Q1.*

**Prior SSOT already on point** (consulted, layer 5): **#173** «DSL-based LLM compilation of coding standards → linter config» (REFERENCE — spec→compile precedent) and **#174** «deterministic-first / LLM-fallback» (ADOPT VOCABULARY) from the [generation-paths-comparison §3](2026-06-23-generation-paths-comparison.md). These govern the *engine* (how a rule body is synthesized); they do **not** settle the *delivery boundary* (Q1). **#182** (ESLint-native `files:` scoping, REFERENCE) is the scoping brick this umbrella consumes.

**BFR net:** for the **delivery model**, the golden-file pattern (#183-proposed, REFERENCE) and the factory-function pattern are the live prior-art; both argue the project should **not BUILD a novel delivery engine** — the projection-with-drift-gate (B) and factory-function (third option) are off-the-shelf patterns to REFERENCE/ADAPT. A full BUILD (Option A live-emit) is only justified if the maintainer prefers consumer-boundary generation despite the install-time-risk cost — a Q1 call, not a BFR-forced one.

---

## §6 — Self-application, under-answered check, traps

**T15 (self-apply):** *if generation becomes the live delivery, does the engine generate ITS OWN enforcement?* **No — and that's the honest finding.** The principles/rules that police the framework (`packages/core/principles/*.test.ts`, `.claude/rules/*.md`) are **hand-authored**, not synthesizer output; the synthesizer emits only *consumer* rules (`emit.ts` writes consumer artifacts to `.ai-factory/synthesizer-output/`). So «make generation live» would realize the thesis for **consumers** while the framework's own enforcement stays hand-authored. This is a `#recursive-self-application-gap` ([phase-research-coverage.md §4](../../../.claude/rules/phase-research-coverage.md)) the umbrella should name explicitly: live consumer-delivery does **not** by itself make the framework self-generating. Recommend the I-phase scope this as an explicit non-goal (or a separate, later thesis layer), not silently assume it.

**Under-answered-question check (T4):** the weakest answer is **Q3** — I gave per-stack *candidate* rules but did **not** run the §Q5 6-layer search on the Hono/Fastify/Expo lint ecosystems (T11 forbids inventing those verdicts from memory). I marked that search as **explicitly deferred to a per-stack domain R-phase** rather than fabricating coverage verdicts. That is the honest gap; filling it is I-phase work, not closeable in this delivery-boundary R-phase.

**Traps honored:** T2/T4 — every §Q answer carries `file:line` or a search excerpt, not «would»; T11/T12 — Q5 ran live WebSearches at verdict time (DeepWiki unavailability stated, not faked); T16 — Pipeline B problem-class written out (PARTIAL match, snippet≠wired-config); T15 — self-application gap surfaced above; T20 — every verdict (REJECT GenTools, REFERENCE golden-file/#183, REFERENCE/WATCHLIST factory) is backed by an inline same-turn search excerpt; **T-GLD-A** — status quo (recipe-synced, principle-26-protected presets) argued *as a live option*, not dismissed on thesis-purity; **Q1 PARKED**, not decided.

**Proposed SSOT entry (append on Q1 resolution, not in this doc-only session — matches the generation-paths-comparison precedent of proposing-not-appending):**

```text
| 183 | Golden-file codegen-verification pattern (oapi-codegen / graphql-code-generator `--check` / templ — generated artifacts committed, CI runs generator + `git diff --exit-code`, fails on drift) | Delivery model for Q1 Option B — presets as generated/validated projection of recipes, drift-gated in CI (generalizes principle 26) | 2026-06-28 | 2026-06-28 | REFERENCE | Mature, broadly-adopted «generate, commit, CI-verify-not-stale» pattern; our principle 26 is already a domain-specific instance. REFERENCE (not ADOPT — no runtime dep; the gate is our own `git diff`/principle test). Surfaced by generation-live-delivery §Q5. | Q1 resolves to Option B (projection) → append + extend principle 26 to all presets; OR a production tool ships ESLint-config-specific golden-file verification matching our class → re-evaluate ADOPT. |
```

---

## §7 — See also

- [`.claude/orchestrator-prompts/generation-live-delivery/kickoff.md`](../../../.claude/orchestrator-prompts/generation-live-delivery/kickoff.md) — umbrella kickoff (this R-phase's source; §2 = the 5 questions).
- [2026-06-23-generation-paths-comparison.md](2026-06-23-generation-paths-comparison.md) — prior R-phase: the *engine* paths «layer, not compete» (SSOT #173/#174; PR #698). This umbrella is the *delivery-boundary* sibling.
- [build-first-reuse-default.md §2-§3](../../../.claude/rules/build-first-reuse-default.md) — the 6-layer mechanism + maintenance-budget logic behind the Q1 trade.
- [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) — surface-as-decision-needed (why Q1 is parked).
- [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — Class A principle 17; hard constraint on any wired-generation verdict.
- [docs/meta-factory/prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT register (max id #182; #183 proposed above).
