<!-- scope:stage-2-generate-path -->
# Stage 2 generate-path — build-vs-reuse prior-art survey (R-phase, Stage 0)

> **Scope:** Phase research-patch for umbrella `stage-2-generate-path` Stage 0 (the BLOCKING reuse gate). Authoritative for the per-candidate ADOPT/ADAPT/REFERENCE/KEEP-NARROW/BUILD/REJECT verdicts that set the scope of Stages 2-4. Individual files in this folder are scope-bound by their gap/umbrella ID per [research-patches README](README.md).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Layer contracts — see [architecture.md §2.4-2.7](../architecture.md). The SSOT register itself — see [prior-art-evaluations.md](../prior-art-evaluations.md) (new entries proposed in §A.3 below must be appended there to take effect).

**Date:** 2026-06-22 · **Author:** Stage-0 R-phase session · **Gate discharged:** [spec/kickoff §6 reuse gate](../../../.claude/orchestrator-prompts/stage-2-generate-path/kickoff.md) per [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md).

---

## §0 What "our problem class" is (the bar every candidate is matched against)

L3-live, Path A only ([architecture.md §2.5, §3.1](../architecture.md)): given a **frozen research plan** about a consumer's stack plus a **menu of existing ESLint plugins**, an LLM **selects and configures concrete rules** (it does *not* author TypeScript AST code) and emits a `SynthesisPlan` = rules + **paired valid/invalid test cases**. That output is then accepted/rejected by the **already-shipped deterministic L4 validator** (`packages/core/validator/`, gates 1/2/4/6: JSON-schema, rule-tester paired valid/invalid, tautology/no-fire-on-empty, cross-rule conflict). Only gate-passing rules are written to disk. Generation runs **install-time on the consumer's own LLM subscription, never in CI** ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)). Thesis: *documents lie; tests don't* — only the deterministically-verified artifact (rule + its paired test) ships, never a raw LLM transcript.

Two axes decide every verdict: **(i)** does the candidate *generate/synthesize* rules (vs. ship a curated pack)? **(ii)** does it have a *deterministic verify-the-generated-artifact* gate (the load-bearing half of our thesis)?

**Method note (T11/T12/T20 compliance):** every verdict below is backed by a live WebSearch/web_fetch evidence pass on primary sources (official docs, repos, papers) run 2026-06-22; no verdict is asserted from training-data confidence. Adversarial problem-class statements ("their class X vs our class Y, match? evidence") are given to guard `#pattern-matching-on-name` (T16).

---

## §A Candidate table + verdicts

### A.1 The gate-critical candidates (kickoff-mandated)

| # | Candidate | Problem-class (theirs) | Match to ours (evidence) | Verdict | One-line rationale |
|---|---|---|---|---|---|
| 1 | **AIF `/aif-evolve`** (`lee-to/ai-factory` 2.x) | LLM mines a *history of fix-patches* (`.ai-factory/patches/*.md`) + codebase scan → proposes **prose** project-convention edits to its own skill-instruction Markdown (`.ai-factory/skill-context/<skill>/SKILL.md`), gated by **human `AskUserQuestion`**. Institutional memory. | **NO match.** Input = patch-history (not research-plan + plugin-menu); output = prose skill directives `**Rule**: [instruction in English]` (not ESLint config + paired tests); gate = human approval (not deterministic validator). SKILL.md verbatim: *"NEVER modify built-in aif-* skill directories… write project-specific rules to skill-context"*; *"Do NOT apply any changes until the user answers."* AIF's own "rules" are prose in `RULES.md`, loaded by the LLM — AIF has **no** ESLint-rule-synthesis path anywhere. | **REFERENCE** | Right *pattern* (incremental cursor over accumulated artifacts → gap analysis → gated proposal), wrong *layer/problem-class*. Cannot be the L3 live step. ADOPTing by name = the exact T16 error. |
| 2 | **Oh My ClaudeCode** (`Yeachan-Heo/oh-my-claudecode`) | Teams-first **multi-agent orchestration + plugin/preset/config manager** for Claude Code (29 agents, 35 skills, HUD statusline, magic keywords, autopilot/swarm modes). | **NO match.** It bundles/presets/routes models; it does **not** generate or validate lint rules. REFERENCE.md TOC = orchestration/agents/skills/hooks/HUD; `OMC Setup` skill = install wizard + CLAUDE.md manager. (Negative-existence: 35 skill bodies not exhaustively read, but no rule-generation surface in TOC/install/config/repo/npm descriptions.) | **REJECT** (for this surface; REFERENCE at most) | Harness/orchestration manager — belongs in the satellite/operator-companion conversation, not as an L3 build-vs-reuse candidate. |

**Gate consequence (load-bearing):** the kickoff said *"if `/aif-evolve` is ADOPT/ADAPT, the L3-live build may collapse to integration."* The evidence is decisive **REFERENCE**, so **the L3-live synthesizer is a BUILD**, not an integration. What is *not* BUILD-from-scratch is the **validation/gate machinery** — that is ADAPT-from-strong-precedent (§A.2). Net Stage-2-4 scope: BUILD the menu-picker prompt + plan contract; REUSE the existing L4; ADAPT the test-shape conventions below.

### A.2 Rule/config-generation prior art (the validation nucleus)

| # | Candidate | Problem-class (theirs) | Match to ours (evidence) | Verdict | One-line rationale |
|---|---|---|---|---|---|
| 3 | **ESLint `RuleTester`** (typescript-eslint rule-tester) | Native ESLint harness asserting a rule errors on `invalid` cases and is silent on `valid` cases; v10 adds `requireMessage`/`requireLocation`/`requireData` strictness. | **Direct in-ecosystem match for gate 2.** It *is* the paired valid/invalid mechanism, in our exact linter ecosystem. | **ADOPT** | Use the real `RuleTester` for gate 2; do not reimplement. (Verify current `packages/core/validator/` already does — likely yes.) |
| 4 | **Semgrep `--test` + `--validate` + NL rule-writer** | SAST: AST/dataflow security rules in YAML; `--test` runs `ruleid:`/`ok:` paired annotations; `--validate` schema-lints against `p/semgrep-rule-lints`; a 2024 NL rule-writer takes *description + bad example + good example* → YAML. | **Deep structural match on the half that matters; wrong engine.** Detection target differs (security YAML vs ESLint config) but the *generate→deterministically-verify-with-paired-cases* architecture is the closest production analog to our thesis. NL-input contract (desc + must-match + must-not-match) maps onto our paired-test + tautology gates. *Flag: NL rule-writer is blog-era/prototype, not in current canonical docs — availability unverified; `--test`/`--validate` fully verified.* | **ADAPT** (test/gate model) / **REJECT** (engine) | ADAPT the `ruleid:`/`ok:` + `--validate` model as design precedent for gates 1/2/4; Semgrep YAML ≠ ESLint config (T16 guard). Supersedes nothing — refines SSOT #1 (Autogrep, DEFER). |
| 5 | **OpenRewrite `RewriteTest`** | Java-centric code-refactoring recipes (imperative OR **declarative-compose-from-catalog** YAML); `RewriteTest` asserts before/after `SourceSpec`; **before-only spec = assert no change**; multi-cycle "no unnecessary changes". | **Strong architectural match for gates 3+4; wrong artifact/ecosystem.** Declarative-compose-from-menu recipes get the *identical* deterministic test gate as bespoke ones — the canonical precedent that our "Path A pick-from-menu still passes the full gate" is sound. `before-only = no-op` is exactly our tautology gate. | **ADAPT** (test-shape) / **REFERENCE** | ADAPT before-only=no-op (tautology) + multi-cycle idempotency (conflict/over-fire). Codemods ≠ ESLint rules (T16 guard). |
| 6 | **Codemod.com + GritQL `grit patterns test`** | Cross-language structural transforms (GritQL over tree-sitter); patterns-as-markdown with **embedded test cases**; **negative test = two identical code blocks** (assert no change); `validate_codemod_package` structural check. | **Match on test-convention; wrong pattern language.** "Two identical blocks = no-op" is the cleanest copyable expression of our tautology gate; "rule + its paired test as one self-validating markdown unit" mirrors our exact thesis. | **ADAPT** (test-convention) / **REFERENCE** | ADAPT the no-op-as-data convention; engine is wrong ecosystem (T16 guard). |
| 7 | **ESLint `@eslint/config-inspector`** | Generates an SPA snapshot of the **resolved** flat-config (which rules apply to which globs) for human debugging. | **Partial — supplies gate-4 input, not a verifier.** The resolved-config snapshot is exactly the merged rule-set you need to detect two configs setting the same rule to conflicting severities. *Flag: not verified whether resolution is invocable headlessly (vs UI-only); inspector explicitly "not authoritative" re ESLint itself — [eslint#19534](https://github.com/eslint/eslint/issues/19534).* | **REFERENCE** (ADOPT-candidate for gate 4 pending headless probe) | Reference its resolution engine as the conflict-gate model; probe headless invocation before treating as a dependency. |
| 8 | **ESLint `npm init @eslint/config`** | Q&A wizard that writes a *starter* `eslint.config.js`; no test gate on output. | Same artifact + ecosystem, but **stops exactly where our thesis begins** (no generated-artifact verification). | **KEEP-NARROW** | Confirms "Q&A → write config" is the normal flow; our factory is narrower-input-but-deeper-verify. |
| 9 | **@antfu/eslint-config + Sheriff** | One-line opinionated **curated** config that **auto-detects the stack** (dependency probe) and enables matching rule sets; zero per-rule verification. | **Clearest prior art for our detection/menu *input* stage; not the output stage.** antfu auto-detects Vue via package probe (`src/factory.ts:52-57`), others opt-in; `ensurePackages()` prompts for missing peers. *Flag: Sheriff detection internals unverified ("infers project details").* | **ADAPT** (detection/menu layer) / **REFERENCE** | ADAPT dependency-probe → enable-rule-set for narrowing the menu; their curated presets ≠ our gated output (T16 guard). |
| 10 | **Biome / oxlint migrate** | Translate an existing ESLint config to the new tool; **conservative default** (`preset:none`, don't silently change behavior); `@oxlint/migrate` **reports what could not be converted**. | Migration ≠ synthesis-with-verification (transform a known input vs generate-and-prove). | **REFERENCE** | Borrow two UX principles: "emit only what's justified, never silently inflate" + "report rejected/un-convertible items with reason". |
| 11 | **OPA/Rego + Conftest · Checkov · tfsec/Trivy** | IaC security scanning with **curated** rule packs + hand-authored custom policies; Checkov custom policies unit-tested with **`expected.yaml`** good/bad fixtures. | **No on the generation axis** (curated/hand-authored, not generators); different domain. Only transferable residue: the `expected.yaml` pass/fail fixture-manifest shape. | **REJECT** (as generator) / **REFERENCE** (fixture model) | The `expected.yaml` "list of must-pass + must-fail fixtures per rule" is a clean declarative model for our paired-gate output. |
| 12 | **SonarQube quality profiles** | Fully curated "Sonar way" built-in profiles; user copies/extends; no synthesis, no per-rule gate. | Adjacent ("rules applied to a stack") but **no generation, no deterministic gate** — pure curation. The "profiles for your stack" naming is a direct T16 trap. | **REJECT** (as generator) | Only the "built-in baseline + user-extends" layering is a weak UX precedent. |

### A.3 Structural / UX precedents (not linting tools, but load-bearing for the loop + UX)

| # | Candidate | Problem-class (theirs) | Match to ours (evidence) | Verdict | One-line rationale |
|---|---|---|---|---|---|
| 13 | **CEGIS** (Solar-Lezama, *Sketch*, 2008/2009) | Counterexample-guided inductive synthesis: inductive synthesizer (satisfies finite observed inputs) + **deterministic validator/model-checker** (certifies for all inputs or returns a novel counterexample) → constrain next round. | **Textbook structural match.** Our L4 *is* the validator role; the LLM *is* the inductive synthesizer. Key transfer: each rejection is a *counterexample the synthesizer is guaranteed to use*; validator domain is **bounded** (Sketch certifies only the bounded case). | **REFERENCE** (foundational) | Cite as the 20-year precedent for "validator is source of truth, generator is disposable, rejection = structured counterexample, acceptance = passes the bounded corpus (not provably-correct-for-all-code)." |
| 14 | **Reflexion · Self-Debug · Self-Refine** (LLM verify loops) | Reflexion = Actor/Evaluator/Self-Reflection, **external executor/unit-tests as Evaluator**, memory bounded to **1-3 trials**. Self-Debug = generate→**execute**→feedback. Self-Refine = LLM is its own critic (**no external oracle**). | **Match (Reflexion/Self-Debug); anti-pattern (Self-Refine).** Our Evaluator (L4) is *more* trustworthy than Reflexion's because purely deterministic. Self-Refine's LLM-self-grading is the failure mode our determinism avoids. | **ADAPT** (Reflexion/Self-Debug) / **REJECT** (Self-Refine config) | ADAPT: Actor/Evaluator vocabulary + **hard small trial cap (≤3) then escalate-to-human** + "feedback = the specific failing case, not 'try again'". REJECT LLM-as-its-own-acceptance-oracle. |
| 15 | **Compiler self-hosting** (rustc stage0/1/2/3, GCC bootstrap) | A tool validates itself by re-applying its own logic: stage-3 **"same-result test"** asserts the self-built artifact is identical. Seed (stage 0) is *downloaded and trusted*, not re-derived. | **Match as quality signal only.** Our analog: run the framework's own gates on the framework itself; a "framework violates a rule it ships" divergence = the self-consistency failure stage-3 catches. Trusted seed = our L4 gates (humans review them, the loop doesn't certify them). | **REFERENCE** | Per [CLAUDE.md](../../../CLAUDE.md): self-application is a *quality signal*, **not** the north star. Dogfood the curated presets as a regression oracle (Stage 2). Don't elevate. |
| 16 | **Renovate / Dependabot** | detect → propose → **gated** change → PR; Dependency Dashboard (accepted/pending/**rejected-with-reason**, re-triggerable); **scoped** approval (`dependencyDashboardApproval`: all/type/package); risk-tiered (security PRs bypass); shareable **presets**; **grouping**; auto-merge on green + `minimumReleaseAge`; **abandonment detection**. | UX exemplar for the install/propose side of our loop. | **ADAPT** (UX) / **REFERENCE** | ADAPT: a "rule dashboard" surfacing rejected-with-reason; scoped/risk-tiered gating (decisive pass auto-ships, marginal gates to human); ship presets; group per-plugin; staleness/abandonment check on the plugin menu. |
| 17 | **Nx generators / Yeoman / Hygen / Plop** | detect → **show plan → confirm → apply**; Nx `--dry-run` emits file-level `CREATE/UPDATE` plan; live dry-run-on-change preview. | UX exemplar for the apply side. | **ADAPT** (UX) / **REFERENCE** | ADAPT: `CREATE/UPDATE` plan preview before writing any config; confirm-before-write default, `--yes` opt-out. Caveat: the dry-run must exercise the *same* code path as the real apply or "the plan lies" ([nrwl/nx#17776](https://github.com/nrwl/nx/issues/17776)). |

**Proposed new `prior-art-evaluations.md` SSOT entries** (append on merge, per [prior-art-evaluations.md §3](../prior-art-evaluations.md)): rows 3-17 above. Existing entries to update rather than duplicate: **#1 Autogrep/Semgrep** (add the `--test`/`--validate` test-harness refinement + ADAPT-the-gate-model note; DEFER-on-engine stance unchanged), **#66 AIF workflow** and **#105 AIF Reflex Loop** (cross-link: the L3-reuse question resolves to REFERENCE, consistent with #66's REFERENCE / #105's operator-axis-only ADOPT — `/aif-evolve` is not the shipped-product L3 synthesizer), **#50 skill-context** (unaffected; remains the override mechanism, not a synthesizer).

---

## §B Anti-pattern catalogue (≥8) — trigger + countermeasure

1. **Stale presets / dead-plugin generation.** *Trigger:* the rule menu points at a plugin that is abandoned or whose latest version dropped the rule; the LLM still configures it. *Counter:* pin source versions in provenance; run a staleness/abandonment check on the plugin menu (Renovate's `abandonments:recommended` 1-year threshold as the model); re-validate against the *installed* version, not the researched docs.

2. **Hallucinated rules (rule/plugin doesn't exist in the installed version).** *Trigger:* LLM invents `plugin/rule-name` or a config option absent in the consumer's actual dependency. *Counter:* a **"plugin+rule exists in installed version" gate that runs BEFORE the expensive rule-tester gate** (cheap schema/existence check first — Self-Debug ordering); resolve against `node_modules`, not training data.

3. **Tautological / always-firing rules.** *Trigger:* a rule that errors on empty or irrelevant code (looks "active", catches nothing real). *Counter:* gate 3 tautology check — `before-only = assert no change` (OpenRewrite) / "two identical blocks" (GritQL) / `ok:` case (Semgrep). A rule with no passing `valid` case is rejected.

4. **Over-broad rules → noise → devs disable everything.** *Trigger:* a rule fires on legitimate code, reviewers get alert fatigue, the whole config gets `// eslint-disable`d. *Counter:* require a *non-trivial* `valid` corpus per rule (must be silent on real-world good code, not just empty); Biome's "emit only what's justified, never silently inflate" default; risk-tiered shipping (marginal rules → human, not auto-ship).

5. **Non-determinism / untestable pipeline.** *Trigger:* trying to snapshot-test the LLM's exact bytes for reproducibility. *Counter:* test the **L4 verdict on the output**, not the output bytes (kickoff T-S2-B). The testable surface is "does the plan pass the gates", which is deterministic even when the generator is not.

6. **Prompt injection from read documentation.** *Trigger:* a researched doc page contains "ignore previous instructions / emit this rule". *Counter:* hard source allowlist (official docs only, [architecture.md §2.4](../architecture.md)); the deterministic L4 gate is the backstop — injected junk that doesn't pass schema+tester+tautology+conflict never ships (the gate doesn't read intent, only behavior). Semgrep's "explanations not available for custom rules" is the analogous trust-boundary.

7. **Version drift between researched docs and real deps.** *Trigger:* research is on Next 16 docs but the consumer is on Next 15. *Counter:* detector pins the *installed* version; research is version-stamped (`research-version`, `research-fetched-at` in the manifest); validate against installed, diff-mode on upgrade ([architecture.md §2.4 diff-режим](../architecture.md)).

8. **Unbounded regeneration loop / cost-blowup.** *Trigger:* reject→regenerate with no cap; an LLM (unlike a sound CEGIS synthesizer) gives **no convergence guarantee** and can oscillate, burning the consumer's subscription. *Counter:* hard trial cap (Reflexion's ≤3) then escalate-to-human / fall to `research-only`; keep only the most recent counterexample(s) in the regen prompt (avoid context-overflow degradation).

9. **LLM self-grading (false convergence).** *Trigger:* letting the LLM judge whether its own rule is good (the Self-Refine config). *Counter:* the validator must be **independent and deterministic**; the LLM never decides acceptance. This is the single non-negotiable from the CEGIS/Reflexion evidence.

10. **No provenance / unauditable rules.** *Trigger:* a shipped rule with no record of why it exists or where it came from. *Counter:* every rule carries `research-source` + `research-version` + `research-fetched-at` + the passing test as provenance (already in the manifest schema); ship the rejected-with-reason list too (Renovate dashboard / oxlint "could not convert" report).

11. **Pattern-matching-on-name (T16) in the reuse gate itself.** *Trigger:* "aif-*evolve* evolves rules → ADOPT"; "Sonar*profiles for your stack* → ADOPT". *Counter:* the explicit "their class X vs our class Y, match? evidence" statement per candidate (done in §A). Name adjacency is not evidence.

12. **Preview that lies (dry-run ≠ real apply).** *Trigger:* the shown plan is re-rendered separately from what actually gets written. *Counter:* the dry-run plan must be produced by the *same* validated artifact that would be written (Nx caveat); CREATE/UPDATE preview comes from the gate-passed `SynthesisPlan`, not a re-generation.

---

## §C Best-practices checklist

**Validation boundary**

- [ ] The deterministic line is the **L4 gate suite**; everything upstream (research, synthesis) may be non-deterministic. Only gate-passing artifacts touch disk.
- [ ] Order gates **cheap-first**: schema + plugin/rule-existence before the rule-tester run (Self-Debug execution ordering; don't pay for a tester run on a hallucinated rule).
- [ ] Gate 2 uses the **native ESLint `RuleTester`** (ADOPT, in-ecosystem), not a reimplementation.
- [ ] Gate 3 tautology = "rule must have a passing `valid` case AND must not fire on empty/irrelevant code" (OpenRewrite before-only / GritQL identical-blocks / Semgrep `ok:`).
- [ ] Gate 4 conflict = computed over the **resolved** flat-config (config-inspector's snapshot model), plus multi-cycle idempotency (OpenRewrite).

**The loop**

- [ ] Rejection feeds back as a **structured counterexample** (the specific failing test / conflicting rule / schema error), not "try again" (CEGIS witness / Self-Debug feedback).
- [ ] **Hard trial cap (≤3)** then escalate-to-human or degrade to `research-only` (Reflexion bound — an LLM has no convergence guarantee).
- [ ] Keep only recent counterexample(s) in the regen prompt (avoid context-overflow).
- [ ] The LLM **never** decides acceptance (no Self-Refine self-grading).

**Provenance / reproducibility**

- [ ] Every rule stamped `research-source` + `research-version` + `research-fetched-at`.
- [ ] Source allowlist enforced; validate against **installed** dep versions, not researched docs.
- [ ] `rules-lock.json` for reproducibility ([architecture.md §2.7](../architecture.md)).
- [ ] Staleness/abandonment check on the plugin menu.

**Degradation**

- [ ] `research-only` mode (emit `ResearchPlan` as a findings report, generate nothing) when opted-out or when L4 rejects everything ([kickoff Stage 5](../../../.claude/orchestrator-prompts/stage-2-generate-path/kickoff.md)).
- [ ] Graceful when LLM unavailable / un-subscribed — never silently fall to a paid API path.

**Dogfood / self-application (quality signal, not goal)**

- [ ] Stage 2 reproduces the **curated presets as a regression oracle** (empty or explainably-non-empty diff against the recipe) — the rustc stage-3 "same-result test" applied to our factory.
- [ ] Generated rules satisfy the same principle 02 (paired-negative) / 03 (AST-over-grep) / doc-authority discipline the framework enforces on consumers (T15).

---

## §D Recommended generate→validate→install architecture (REUSE vs BUILD)

**REUSE (do not rebuild):**

- **L4 validator** — already shipped (`packages/core/validator/`, gates 1/2/4/6), provenance-agnostic. Stage 2 swaps the *input* (curated recipe → LLM output); L4/L5 stay byte-identical. *Do not author a parallel L4* (kickoff T-S2-A `#parallel-evolution-creep`).
- **ESLint `RuleTester`** — ADOPT as gate 2 (confirm `packages/core/validator/` already wires it).
- **`@eslint/config-inspector` resolution model** — REFERENCE for gate 4; probe headless invocation before depending on it.
- **CEGIS / Reflexion structure** — REFERENCE/ADAPT the *architecture vocabulary* (validator-as-source-of-truth, Actor/Evaluator, bounded trials, counterexample feedback). No code dependency.
- **Renovate dashboard + Nx dry-run** — ADAPT the *UX patterns* (§E). No code dependency.

**BUILD (genuine gap — nobody occupies our intersection):**

- **The L3-live menu-picker** — the prompt + contract that takes a frozen `ResearchPlan` + plugin menu → `SynthesisPlan` (rules + paired tests). *This is BUILD, not integration* — the decisive `/aif-evolve` REFERENCE verdict means there is no upstream to adopt. Curated configs (antfu/Sheriff/Sonar) pick-from-menu but don't verify per-rule; verifying tools (Semgrep/OpenRewrite/Grit) verify per-rule but author bespoke patterns, not menu-picks. We sit at the intersection that no surveyed tool occupies.
- **The bounded regeneration loop** — reject→structured-counterexample→regen with ≤3 cap + human/`research-only` fallback (ADAPT Reflexion's bound; the deterministic L4 is the oracle).
- **Cheap-first existence gate** — "plugin+rule exists in installed version" check ahead of the rule-tester (anti-pattern #2).

**Inter-layer contract:** the binding interface between L3 and L4 is the `SynthesisPlan` schema — L3 is disposable/non-deterministic, L4 is the deterministic source of truth. Feed L4's rejection *reason* back to L3 as the counterexample. **Test the pipeline by asserting the L4 verdict on outputs, never the LLM bytes** (kickoff T-S2-B): Stage-1 hand-authored bad fixtures prove L4 *rejects*; Stage-2 proves the LLM output *passes* and *reproduces the curated recipe*.

---

## §E Best-UX patterns (with exemplar source)

1. **Rejected-with-reason dashboard** *(exemplar: Renovate Dependency Dashboard).* One canonical surface listing shipped / pending / **rejected-with-reason** rules, with a one-click re-attempt. "Don't make rejected items invisible" is the single most transferable idea.

2. **Scoped, risk-tiered gating — not all-or-nothing** *(exemplar: Renovate `dependencyDashboardApproval` + security-PR bypass).* A rule passing *all* gates decisively auto-ships; a marginal/near-miss rule routes to human. Over-gating ("approve everything") causes fatigue and defeats the purpose.

3. **`CREATE/UPDATE` dry-run plan before writing** *(exemplar: Nx `--dry-run` + live dry-run-on-change).* Print the exact file-level plan of validated rules; confirm-before-write default, `--yes` opt-out. The preview must run the same path as the real apply.

4. **Ship presets, regenerate only the delta** *(exemplar: Renovate `config:recommended` `extends`).* Offer named bundles consumers inherit instead of regenerating from scratch — caps cost and stabilizes output. Pairs with diff-mode on version upgrade.

5. **Conservative default + gap report** *(exemplar: Biome `preset:none` / oxlint "could not convert").* Emit only what's justified, never silently inflate the rule set; surface what was *not* generated (and why) as first-class output, not a silent drop.

---

## §F Open questions / risks to resolve before Stage 1

1. **config-inspector headless invocation (gate 4):** can its resolved-config snapshot be produced programmatically (not UI-only) to drive conflict detection, or do we compute resolution ourselves? *Probe before treating as a dependency.*
2. **Does `packages/core/validator/` already wire the native `RuleTester` for gate 2?** Verify (file-read) before Stage 1 — if yes, gate 2 is ADOPT-already; if not, ADOPT it rather than rolling a custom tester.
3. **"plugin+rule exists in installed version" gate** — is this a new cheap gate to add ahead of the tester, or is it folded into gate 1 schema? Decide placement before Stage 2.
4. **Regeneration budget** — confirm ≤3 as the cap and define the exact escalation/`research-only` fallback contract; where is the cap configured (consumer-facing)?
5. **Counterexample format** — fix the schema for how an L4 rejection is serialized back to L3 (failing test id / conflict pair / schema path), so regeneration is constrained, not random.
6. **Semgrep NL rule-writer availability** — unverified (blog-era). Not blocking (we ADAPT the *model*, not the tool), but note if anyone proposes ADOPTing the tool itself.
7. **Self-application scope (Stage 2 oracle)** — confirm the curated presets (Next/react-spa/react-native) are the regression oracle and define "explainably-non-empty diff" acceptance precisely.

---

## Executive summary

**Top 3 ADOPT/ADAPT candidates:**

1. **ESLint `RuleTester` — ADOPT (gate 2, in-ecosystem):** the native paired valid/invalid harness *is* our rule-tester gate; use it, don't reimplement.
2. **Semgrep `--test`/`--validate` + OpenRewrite `RewriteTest` + GritQL test-conventions — ADAPT (the gate model):** four independent ecosystems prove "generate/compose → deterministically gate with paired pass/fail + no-op cases → ship only what passes." Our four gates are individually de-risked by this prior art — ADAPT the shapes (especially before-only/two-identical-blocks = tautology), don't invent them. Engines are wrong-ecosystem (T16 guard).
3. **CEGIS + Reflexion — REFERENCE/ADAPT (the loop structure):** our pipeline is a textbook CEGIS instance with an LLM swapped for the sound synthesizer — which *keeps* the deterministic-validator-as-source-of-truth guarantee but *loses* termination, so ADAPT Reflexion's hard ≤3-trial bound + counterexample-feedback + human escalation.

**Gate-critical verdict:** **`/aif-evolve` is REFERENCE, not ADOPT/ADAPT** (decisive primary-source evidence: different input, output, and gate). Therefore **the L3-live synthesizer is a BUILD**, not an integration — Stages 2-4 keep full implementation scope; what is reused is the existing L4 + the test/UX *patterns* above. **Oh My ClaudeCode is REJECT** for this surface (orchestration manager, no rule generation).

**Top 3 anti-patterns to avoid:**

1. **LLM self-grading (false convergence)** — the validator must be deterministic and independent; the LLM never decides acceptance (the Self-Refine failure mode).
2. **Unbounded regeneration → cost-blowup** — an LLM gives no convergence guarantee; hard-cap trials and escalate, never run to "convergence."
3. **Hallucinated rules + stale presets** — generate against the *installed* dependency version with a cheap existence-gate first and a staleness check on the menu, never against researched docs alone.
