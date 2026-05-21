<!-- scope:companion-integration-analysis -->
# Research-patch — Companion-integration analysis (4-way: US × AIF × aif-handoff × Superpowers)

> **Date:** 2026-05-20
> **Authoritative for:** 4-way companion capability matrix, per-row overlap + T16 problem-class analysis, hybrid conflict/compatibility probe results (real install for AIF + our project; read-only for Superpowers + aif-handoff), per-capability ADOPT/ADAPT/BUILD verdicts, install-order + coexistence checklist + coexistence test-plan, armed-§13.x cross-check. Grounds Commit 7 (companion-elevation README widening).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Commit 7 wording (draft only — see `drafts/commit-7-readme-revision-v2.md` (gitignored, operator-side)). SSOT registration (separate maintainer-approved commit). Build-vs-reuse macro-discipline — see [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md).
> **Kickoff:** `.claude/orchestrator-prompts/companion-integration-analysis/kickoff.md` (gitignored, operator-side) (§3.5 CLEAR per Iteration 2, 2026-05-17).
> **T7 template:** Problem → Background → Evidence → Verdict → Prevention.
> **NO PR. NO commits beyond this research-patch. NO actual install of companions in production. NO Superpowers global install (B2-A 2026-05-17).**

---

## §1 Problem

Track 4b ([2026-05-16-companion-target-comparison.md](2026-05-16-companion-target-comparison.md)) recommended Superpowers as a companion candidate, but the coverage of the three named companions (AIF + aif-handoff + Superpowers) was **fragmented across four separate analyses** with **no unified side-by-side matrix, no conflict analysis, no install-order recommendation, and no per-capability ADOPT/ADAPT/BUILD verdict grounded in an actual install probe.** Commit 7 (README companion-elevation) was being discussed without substantive integration grounding. This R-phase corrects all of the above via a comprehensive 4-way comparison + hybrid §4.3 probe.

**Why it matters:** ADAPT recommendations risk being premature (when ADOPT-verbatim would work) or naive (when companion-conflict makes ADOPT impossible). «Установить рядом» (install side-by-side) requires verified compatibility — which the project did not have until this probe.

---

## §2 Background

| Predecessor artefact | Coverage | Gap this patch fills |
|---|---|---|
| [aif-comparison.md](../aif-comparison.md) (2026-05-08, context7) | Deep AIF v2.11.0 single-project | No Superpowers/aif-handoff; no install probe; agent-collision unseen |
| [2026-05-11-aif-handoff-overlap-analysis.md](2026-05-11-aif-handoff-overlap-analysis.md) (context7) | aif-handoff coordinator primitives P1–P7 | Treated aif-handoff as in-`ai-factory` feature; missed it is a **separate repo** |
| [2026-05-16-companion-target-comparison.md](2026-05-16-companion-target-comparison.md) (Track 4b, DeepWiki) | Superpowers + 6 others, light AIF/aif-handoff | Skill-testing mischaracterised as automated harness (T16); no conflict probe |
| [prior-art-evaluations.md](../prior-art-evaluations.md) SSOT | Separate disciplined entries | No unified 4-way matrix |

Per [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md), the macro-level mechanism (DeepWiki + WebSearch + SSOT + real probe) had only ever been applied at the **single-candidate** level, never at the **cross-companion integration** level. This patch is the per-capability follow-through.

---

## §3 Per-project capability inventory

Each project swept across **≥3 source locations** (T-CIA-B counter: not README-only). Our project enumerated from the live `origin/main` worktree (commit `2f89e71`); companions from DeepWiki + WebSearch + (AIF) real install probe.

### §3.1 Our project (rules-as-tests-aif) — source: `.claude/`, `packages/`, `agents/`, `.husky/`, `install.sh`/`setup.sh`

| # | Capability | Source location |
|---|---|---|
| US-1 | 14 principle meta-tests (executable, run pre-push + CI) | `packages/core/principles/01..14-*.test.ts` |
| US-2 | 8 discipline rules (prose + Class A/B/C) | `.claude/rules/*.md` |
| US-3 | 6 custom ESLint rules (3 core + 3 react-next) w/ AST + paired-negative tests | `packages/core/eslint-rules/`, `packages/preset-next-15-canonical/eslint-rules/` |
| US-4 | Living Documentation drift audit (deterministic bash) | `packages/core/audit-self/audit-ai-docs.sh` (+ react-next variant) |
| US-5 | Mutation testing (Stryker config shipped to consumers) | `templates/ts-server/stryker.config.json`, `packages/core` deps `@stryker-mutator/*@^9.6.1` |
| US-6 | Manifest-as-SSOT + render-drift check (`--check`) | `packages/core/render/render-rules.ts` |
| US-7 | Pre-push hook: 476-LOC multi-check (actionlint, zizmor, self-test, hook-stub audit, skill-drift, render-drift, principles, Prior-art trailer, lychee) | `.husky/pre-push` |
| US-8 | Prior-art SSOT + capability-commit `Prior-art:` trailer gate | `docs/meta-factory/prior-art-evaluations.md`, `.husky/pre-push` §7 |
| US-9 | 4 AI-agnostic sub-agent prompts (reporting-only) | `agents/{best-practices-sidecar,compliance-verifier,docs-auditor,review-sidecar}.md` |
| US-10 | 3 skills (self-reflection, template-audit, tool-bootstrapping) + shipped `rules-as-tests` skill | `.claude/skills/`, `skills/rules-as-tests/` |
| US-11 | §1.7 self-reflexive forward/backward verification (principle 13 + self-reflection skill) | `packages/core/principles/13-*.test.ts`, `.claude/skills/self-reflection/` |
| US-12 | AI-laziness-traps catalogue (T1–T16) + principle 12 | `.claude/rules/ai-laziness-traps.md`, `packages/core/principles/12-*.test.ts` |
| US-13 | Skill-drift detection (principle 14 + `scripts/check-skill-drift.sh`) | `packages/core/principles/14-*.test.ts` |
| US-14 | Stack-aware install (ts-server / react-next) w/ dry-run + `--force` | `install.sh`, `setup.sh` |
| US-15 | CI workflow generation (shipped `ci.yml` template) | `templates/ts-server/github-actions-ci.yml` |
| US-16 | Dependency-cruiser arch rules (shipped) | `templates/`, `packages/core` deps `dependency-cruiser` |
| US-17 | AGENTS.md / CLAUDE.md interop templates | `packages/core/templates/shared/AGENTS.md.template`, `CLAUDE.md.template` |
| US-18 | Doc-authority-hierarchy enforcement (principle 09 + header check in install.sh) | `packages/core/principles/09-*.test.ts`, `install.sh:45` |
| US-19 | `aif-gate-result` JSON emission (AIF interop wire format) | `packages/core/validator/to-aif-gate-result.ts` |
| US-20 | Detector / synthesizer / validator / installer CLIs (L1–L5 pipeline) | `packages/core/{detector,synthesizer,validator,installer}/cli.ts` |
| US-21 | UserPromptSubmit hook (deps-hash-check, session-bootstrap inject) | `.claude/hooks/`, `install.sh:208` registers in `.claude/settings.json` |

### §3.2 AI Factory (`lee-to/ai-factory` v2.11.0) — source: real `ai-factory init` probe + DeepWiki + aif-comparison.md

Real init probe (`ai-factory init --agents claude`) created: `.ai-factory.json`, `.claude/skills/` (**25** `aif-*` skills), `.claude/agents/` (**19** agent files). DeepWiki + aif-comparison cross-checked.

| # | Capability | Evidence |
|---|---|---|
| AIF-1 | 25 workflow skills (init, plan, implement, fix, verify, review, commit, dockerize, evolve, loop, …) | probe: `.claude/skills/aif-*` |
| AIF-2 | 19 agent files incl. `best-practices-sidecar`, `docs-auditor`, `review-sidecar`, `rules-sidecar`, `implement-coordinator`, `plan-coordinator`, loop-* family | probe: `.claude/agents/*.md` |
| AIF-3 | `/aif-loop` multi-phase Reflex Loop (PLAN/PRODUCE/PREPARE/EVALUATE/CRITIQUE/REFINE) + weighted scoring | aif-comparison §1.3, §2 |
| AIF-4 | `/aif-verify` real toolchain runner (tsc/build/test/lint by detection) | aif-comparison §1.2 |
| AIF-5 | `/aif-rules-check` LLM-judge advisory on `.ai-factory/RULES.md` | aif-comparison §1.1 |
| AIF-6 | `aif-evolve` incident→rule mining from fix patches | aif-comparison §4 |
| AIF-7 | RULE-SCHEMA `{id,severity,weight,phase,check}` (convergent w/ our manifest) | aif-comparison §2 |
| AIF-8 | `aif-gate-result` cross-skill verdict JSON contract | aif-comparison §9 |
| AIF-9 | skill-context override (`.ai-factory/skill-context/<skill>/SKILL.md`) | aif-comparison §4 |
| AIF-10 | Multi-agent support (claude/cursor/opencode/universal config dirs) | DeepWiki probe |
| AIF-11 | `.ai-factory.json` config + MCP settings (`settings.local.json` w/ `--mcp`) | probe: no settings file without `--mcp` |
| AIF-12 | `review-sidecar` w/ `model:` field + `context: fork` (anti-bias config) | aif-comparison §4 |

### §3.3 aif-handoff (`lee-to/aif-handoff`) — source: WebSearch + 2026-05-11 overlap analysis + DeepWiki

**Identity (corrected this R-phase):** a **separate repo**, not an in-`ai-factory` feature. "Autonomous Kanban board where AI agents plan, implement, and review your tasks — fully hands-off." Built **on top of** AI Factory via `@aif/runtime` (Claude + Codex adapters).

| # | Capability | Evidence |
|---|---|---|
| HO-1 | Autonomous Kanban pipeline (Backlog→Planning→Plan Ready→Implementing→Review→Done) | WebSearch (repo README) |
| HO-2 | Event-driven coordinator (WebSocket near-real-time + 30s polling fallback) | WebSearch |
| HO-3 | `HANDOFF_MODE` env-var fork (autonomous vs interactive) | overlap-analysis C1 |
| HO-4 | `handoff_sync_status` / `handoff_push_plan` MCP tools | overlap-analysis S1/S2 |
| HO-5 | External DB ownership of task state (coordinator owns writes) | overlap-analysis C3 |
| HO-6 | Loads agents via `settingSources:["project"]` from `.claude/agents/*.md` — **same files as AIF** | WebSearch |
| HO-7 | `<!-- handoff:task:<id> -->` first-line plan annotation | overlap-analysis A1 |
| HO-8 | Per-stage specialized coordinators (plan-polisher, parallel workers, review sidecars) | WebSearch |

### §3.4 Superpowers (`obra/superpowers`) — source: DeepWiki (read-only per B2-A; **NO install**)

DeepWiki probes 2026-05-20. **14 skills** (current count; Track 4b said "~21" — superseded):

| # | Capability | Evidence (DeepWiki) |
|---|---|---|
| SP-1 | 14 skills: test-driven-development, systematic-debugging, verification-before-completion, brainstorming, writing-plans, executing-plans, dispatching-parallel-agents, requesting-code-review, receiving-code-review, using-git-worktrees, finishing-a-development-branch, subagent-driven-development, writing-skills, using-superpowers | DeepWiki skills list |
| SP-2 | SessionStart hook (`hooks/session-start`) injects `using-superpowers` into **every** session (additionalContext JSON) | DeepWiki |
| SP-3 | «1% Rule» — "if even a 1% chance a skill applies, you ABSOLUTELY MUST invoke it" (overrides default reasoning) | DeepWiki (using-superpowers) |
| SP-4 | TDD-for-Skills "Iron Law": NO SKILL WITHOUT A FAILING TEST FIRST — **prose discipline w/ subagent pressure scenarios, NOT an automated harness** | DeepWiki (writing-skills) |
| SP-5 | Pressure scenarios (3+ combined pressures, no easy outs) for skill RED/GREEN testing | DeepWiki |
| SP-6 | `subagent-driven-development` (coordinator delegates to fresh subagents, two-stage review) | DeepWiki / Track 4b |
| SP-7 | `using-git-worktrees` (isolated workspaces for parallel agents) | DeepWiki / Track 4b |
| SP-8 | brainstorming → writing-plans → implementation sequenced workflow (brainstorming gates **planning**, not implementation directly) | DeepWiki (**corrects** kickoff §4.3 "HARD-GATE blocking implementation") |
| SP-9 | Plugin distribution via Claude Code marketplace (`/plugin install superpowers@claude-plugins-official`), user-scope; no documented uninstall | DeepWiki |

> **T16/T-CIA-F evidence correction:** Track 4b §3.1 characterised Superpowers skill-testing as automated "bash+claude+transcript". DeepWiki (SP-4) confirms it is a **prose discipline** with subagent pressure scenarios — RED = agent fails without skill, GREEN = complies with skill. The "test" is a behavioural baseline run by a subagent, not a CI-runnable harness. This is the `#pattern-matching-on-name` trap caught in operational form.

---

## §4 Unified capability matrix

Legend — **Y** = present/strong, **~** = partial, **N** = absent, **n/a** = not applicable to layer. "Best at it" = strongest implementation. Overlap class per §4.2.

| # | Capability area | US | AIF | aif-handoff | Superpowers | Best at it | Overlap class |
|---|---|---|---|---|---|---|---|
| 1 | Skill format (markdown + frontmatter + auto-trigger) | Y | Y | inherits AIF | Y | commodity (all 4) | commodity |
| 2 | Skill-testing discipline | N | N | N | Y (prose+pressure) | Superpowers | unique-to-SP |
| 3 | Code-level lint rules (custom AST) | Y (6 rules) | N | N | N | US | unique-to-US |
| 4 | Living Documentation drift audit | Y | ~ (`/aif-docs`) | N | N | US | partial |
| 5 | Mutation testing (anti-tautology) | Y (Stryker) | N | N | N | US | unique-to-US |
| 6 | Pre-commit / pre-push hooks | Y (476-LOC) | N (no git hooks) | N | N | US | unique-to-US |
| 7 | CI workflow generation | Y (template) | ~ (`/aif-ci` runtime) | N | N | US | partial |
| 8 | Architecture / dependency rules | Y (dep-cruiser) | ~ (`/aif-architecture`) | N | N | US | partial |
| 9 | Multi-channel enforcement (edit→commit→push→CI→audit) | Y | ~ (runtime gates) | ~ (pipeline gates) | N | US | partial |
| 10 | Sub-agent prompt files | Y (4, portable) | Y (19, wired) | uses AIF's | Y (prompt files) | tie (US portable / AIF wired) | **partial+name-collision** |
| 11 | Orchestrator / subagent-driven dev | ~ (skill) | Y (coordinators) | Y (autonomous) | Y (SDD skill) | aif-handoff (autonomous) | partial |
| 12 | Git worktrees discipline | Y (rule, Class C) | N | ~ (isolation) | Y (skill) | tie (US rule / SP skill) | partial |
| 13 | Brainstorming / planning workflow | N | Y (`/aif-plan`) | Y (Planning stage) | Y (brainstorming) | Superpowers/AIF | unique-to-companions |
| 14 | TDD enforcement (code) | Y (principles) | ~ (`/aif-verify`) | N | Y (TDD skill) | tie | partial |
| 15 | Iterative refinement loop | N | Y (`aif-loop`) | Y (pipeline) | ~ (executing-plans) | AIF | unique-to-AIF |
| 16 | Weighted rule scoring | N | Y (severity×weight) | inherits AIF | N | AIF | unique-to-AIF |
| 17 | Incident→rule mining | N | Y (`aif-evolve`) | N | N | AIF | unique-to-AIF |
| 18 | Structured rule schema (`{id,severity,check}`) | Y (manifest) | Y (RULE-SCHEMA) | inherits AIF | N | tie (convergent) | commodity |
| 19 | Manifest-as-SSOT + render-drift check | Y | N | N | N | US | unique-to-US |
| 20 | Paired bad/good examples (1st-class) | Y | N | N | N | US | unique-to-US |
| 21 | Prior-art / build-vs-reuse discipline | Y (SSOT+trailer) | N | N | ~ (skill reuse) | US | unique-to-US |
| 22 | §1.7 self-reflexive verification | Y | N | N | ~ (verification-before-completion) | US | partial |
| 23 | AI-laziness-traps catalogue | Y (T1–T16) | N | N | ~ (pressure scenarios) | US | partial |
| 24 | AGENTS.md interop | Y (template) | Y (`/aif` gen) | inherits AIF | ~ (multi-platform) | tie | commodity |
| 25 | Cross-skill verdict JSON (`aif-gate-result`) | Y (emit) | Y (own) | Y (consumes) | N | AIF (originator) | commodity |
| 26 | Autonomous task pipeline (Kanban) | N | N | Y | N | aif-handoff | unique-to-HO |
| 27 | MCP server / tooling | ~ (tool-bootstrap skill) | Y (`--mcp`) | Y (MCP server) | N | AIF/HO | partial |
| 28 | Plugin / marketplace distribution | N (install.sh) | N (npm CLI) | N | Y (CC marketplace) | Superpowers | unique-to-SP |
| 29 | Doc-authority hierarchy enforcement | Y (principle 09) | N | N | N | US | unique-to-US |
| 30 | «1% Rule» skill-invocation mandate | N | N | N | Y | Superpowers | unique-to-SP |
| 31 | skill-context project override | ~ (override.md) | Y (skill-context) | inherits AIF | N | AIF | partial |
| 32 | Stack-aware scoping (ts-server/react-next) | Y | ~ (area rules) | N | N | US | partial |

**32 rows** (exceeds the §4.1 minimum of 25). Sampling swept ≥3 source locations per project (probe + DeepWiki + existing analyses).

---

## §5 Per-row overlap analysis with verdicts (T16 problem-class match)

Condensed to the **load-bearing rows** (commodity/unique rows carry self-evident verdicts; the table below covers every row whose verdict is non-trivial). Full BFR-typology per [build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md).

| Row | T16 problem-class match | Verdict |
|---|---|---|
| 1 Skill format | AIF/SP/US all = markdown+frontmatter+trigger keyword. **Match: YES.** | **ADOPT-VOCABULARY** — already de-facto adopted; commodity |
| 2 Skill-testing | SP problem class: "evidence a skill changes agent behaviour before shipping it" via subagent pressure test. US problem class: none (no skill-testing). **Match: N/A — we have the gap.** | **ADAPT-MINIMAL** (→ §13.36) — adopt the *pressure-scenario evidence* pattern, NOT an automated harness (none exists upstream) |
| 3 Code lint rules | US AST rules vs none. **No match — unique to US.** | **KEEP-NARROW / BUILD-OURS** |
| 4 Living Docs drift | AIF `/aif-docs` = LLM-judge doc review at runtime; US `audit-ai-docs.sh` = deterministic drift check at pre-push. Same goal, **different lifecycle + determinism**. Match: partial. | **KEEP-NARROW** — ours is deterministic + no-paid-LLM; AIF's is runtime LLM |
| 10 Sub-agent prompts | **Headline collision.** AIF/aif-handoff `review-sidecar` = runtime sidecar wired into implement-coordinator (`background:true`, `skills:[aif-review]`, `maxTurns:6`). US `review-sidecar` = AI-agnostic reporting-only prompt, no runtime frontmatter. Same NAME, overlapping PURPOSE (sub-agent code review), **different lifecycle (pipeline-dispatched vs portable reference)**. Match: PARTIAL, name-identical. | **ADAPT-MINIMAL + REJECT-CONFLICT on filename** — keep our richer prompts but **rename to avoid `.claude/agents/` collision** (see §6 C-1) |
| 11 Orchestration | aif-handoff = persisted autonomous Kanban; AIF = coordinator subagents; SP `subagent-driven-development` = ephemeral delegation; US orchestrator skill = manual file-prompt. Match: partial (all "delegate to fresh context"). | **ADOPT-VOCABULARY** (SP `subagent-driven-development` term) + **KEEP-NARROW** (our manual scale) |
| 12 Git worktrees | SP `using-git-worktrees` skill = runtime instruction to AI; US `parallel-subwave-isolation` rule = framework principle (Class C). **Match: same mechanism, different layer** (T-CIA-D). | **REFERENCE** — cite SP + aif-handoff as multi-source precedent |
| 15 Reflex loop | AIF `aif-loop` PLAN/.../REFINE persistent state. US: none. **Unique to AIF.** | **REFERENCE** (mature precedent) — no US equivalent needed at scale |
| 17 Incident→rule | AIF `aif-evolve` auto-mines rules from patches (high-volume, post-fix). US Prior-art SSOT = curated, low-volume, pre-build. **Different lifecycle** (already documented aif-comparison §9). Match: partial. | **REFERENCE** — complementary, not replacement |
| 19 Manifest-SSOT render-drift | US only. AIF RULES.md = manually appended. **Unique to US.** | **KEEP-NARROW / BUILD-OURS** (confirmed differentiator) |
| 20 Paired examples | US 1st-class schema field; AIF RULE-SCHEMA has `description` only. **Unique to US.** | **KEEP-NARROW** (confirmed differentiator) |
| 22 §1.7 self-reflexive | SP `verification-before-completion` = "verify before claiming done"; US §1.7 = "forward/backward discipline-impact check on rule introductions". Match: partial (both = self-check), different scope. | **REFERENCE + KEEP-NARROW** |
| 25 `aif-gate-result` | AIF originated the contract; US emits it; aif-handoff consumes it. **Match: YES, commodity standard.** | **ADOPT** (already adopted — US emits AIF's format) |
| 26 Autonomous Kanban | aif-handoff only. US: none, deliberately. **Unique to HO.** | **REFERENCE / KEEP-NARROW** (different problem class — runtime, not discipline) |
| 28 Plugin marketplace | SP ships via CC marketplace; US ships via `install.sh`. **Different distribution model.** | **REFERENCE** — possible future ADAPT if CC plugin distribution matures |
| 30 «1% Rule» | SP global skill-invocation mandate. US: keyword-discriminating triggers. **Match: partial.** | **ADAPT-candidate** (→ §13.35, ARMED — no incident threshold met) |

---

## §6 Conflict + compatibility analysis (HYBRID PROBE)

**Setup:** real installs in `/tmp/cit-<ts>/` (git-init'd, minimal `package.json`). AIF + our project installed for real; Superpowers + aif-handoff analysed read-only (B2-A). All commands + outputs below are actual probe results (T-CIA-A: no assume-compatibility).

**Probe sequence (actual):**
```text
$ ai-factory init --agents claude       # → 25 skills, 19 agents, .ai-factory.json
$ bash <pkg>/install.sh ts-server       # default (NO --force), onto AIF-populated .claude/
```

```text
CONFLICT C-1 (HARD, install-time):
- What:        .claude/agents/{best-practices-sidecar,docs-auditor,review-sidecar}.md
- Who collides: AIF init (ships 31–32-line wired sidecars) vs our install.sh (ships 120–182-line reporting-only prompts)
- Observed:    install.sh default SKIPS (no --force): "⊝ ...review-sidecar.md (exists — skipping; use --force to overwrite)"
               → AIF thin stubs SILENTLY WIN; our substantive agents NOT installed.
               compliance-verifier.md (no AIF equiv) installs cleanly (208 lines).
- setup.sh:    default path passes NO --force (FORCE="" unless user opts in) → standard `setup.sh --stack=ts-server` keeps AIF stubs.
- Deeper (T16): names CONVERGED; AIF's are pipeline-wired (background:true, skills:[aif-review]); aif-handoff loads
               these very files via settingSources:["project"]. --force overwrite would strip AIF frontmatter
               → could break aif-handoff's autonomous pipeline that expects skills:[aif-review] on those agents.
- Resolution:  RENAME our 3 colliding agents (e.g. ratx-review-sidecar.md) OR namespace under .claude/agents/rules-as-tests/.
               --force is NOT a safe blanket fix (breaks aif-handoff pipeline contract).
- Recommendation: ship rename in a follow-up commit; document in install.sh + INSTALL.md. (See §7 verdict.)
```

```text
CONFLICT C-2 (NONE at install; runtime watch): .ai-factory/ dir vs .ai-factory.json file
- AIF init creates .ai-factory.json (FILE). Our install creates .ai-factory/ (DIR: DESCRIPTION, ARCHITECTURE, RULES.md, rules/).
- Observed: coexist (different names). `ls -ld .ai-factory .ai-factory.json` → both present, no collision.
- Runtime watch: AIF /aif-rules writes .ai-factory/RULES.md AND our install ships .ai-factory/RULES.md → ownership ambiguity post-install.
- Recommendation: document RULES.md ownership (ours is template seed; /aif-rules may append). Low severity.
```

```text
CONFLICT C-3 (NONE observed): .claude/settings.json (ours) vs .claude/settings.local.json (AIF)
- Our install creates settings.json (UserPromptSubmit deps-hash hook). AIF creates settings.local.json ONLY with --mcp (absent in probe).
- Observed: different files; Claude Code merges both. No collision. settings.json verified created with our hook.
```

```text
CONFLICT C-4 (NONE at install): .claude/skills/ namespace
- AIF: 25 .claude/skills/aif-* subdirs. Ours: .claude/skills/{rules-as-tests,tool-bootstrapping}/. Different subdir names → no file collision.
- Runtime watch: trigger-keyword overlap (our tool-bootstrapping vs AIF skill triggers) — resolved by CC skill-name disambiguation; low risk.
```

```text
CONFLICT C-5 (NONE at install): CI workflow
- Our install creates .github/workflows/ci.yml. AIF init creates NO .github/. Observed: no collision.
- Runtime watch: AIF /aif-ci skill could generate a workflow later → would need merge; not an install-time conflict.
```

```text
CONFLICT C-6 (NONE): git hooks. Our install: .husky/{pre-commit,pre-push} + .claude/hooks/deps-hash-check.sh. AIF init: no hooks. No collision.
```

```text
CONFLICT C-7 (NONE at install): AGENTS.md
- Our install creates AGENTS.md (template). AIF init does NOT (created later by /aif skill). Observed: ours installs cleanly.
- Runtime watch: running /aif post-install would regenerate AGENTS.md → overwrite ours. Sequencing matters (see §8).
```

**Superpowers (read-only, B2-A — NO install):** plugin is **user-scope** (`/plugin install superpowers@claude-plugins-official`), registers a global SessionStart hook injecting `using-superpowers` + «1% Rule» into **every** Claude Code session (DeepWiki SP-2/SP-3). It does **not** write project files (DeepWiki: no `.claude/settings.json` modification). Therefore **zero project-file conflict** with AIF/US — but a **cross-scope behavioural side-effect**: the «1% Rule» mandate would apply to sessions working in any project, including ours, potentially over-triggering skill loads. **No documented uninstall** (DeepWiki SP-9) → install is non-reversible within R-phase scope → **B2-A install-forbidden verdict holds.** (Note: kickoff §4.3's "brainstorming HARD-GATE blocking implementation" rationale is imprecise — brainstorming gates *planning* not implementation, SP-8 — but the SessionStart-global + no-uninstall rationales independently sustain B2-A.)

**Trigger-collision matrix (computed read-only):** Superpowers user-scope skills (`subagent-driven-development`, `using-git-worktrees`, `brainstorming`, `test-driven-development`) vs our project-scope skills (`self-reflection`, `template-audit`, `tool-bootstrapping`, `rules-as-tests`). **No trigger-keyword overlap** (different domains: SP=workflow/process, US=rule-enforcement). The one behavioural override is SP-3 «1% Rule» which raises invocation aggressiveness globally — would affect our skills' trigger sensitivity if SP were installed.

---

## §7 ADOPT/ADAPT/BUILD verdict consolidation per capability

| Capability | Verdict | Evidence basis |
|---|---|---|
| Skill format + frontmatter (row 1) | **ADOPT-VERBATIM** (already) | commodity; convergent |
| `aif-gate-result` JSON (row 25) | **ADOPT-INTEGRATED** (already shipped — US emits it) | aif-comparison §9; US-19 |
| AIF as install substrate (setup.sh wraps `ai-factory init`) | **ADOPT-INTEGRATED** (already — our framework installs on top of AIF) | setup.sh probe |
| `subagent-driven-development` vocabulary (row 11) | **ADOPT-VOCABULARY** | Track 4b §4.2 #1; DeepWiki SP-6 |
| Skill-testing pressure-scenario evidence (row 2) | **ADAPT-MINIMAL** (prose pattern, not harness) → §13.36 | DeepWiki SP-4/SP-5 |
| «1% Rule» skill-trigger sensitivity (row 30) | **ADAPT-candidate, ARMED** (no incident threshold) → §13.35 | DeepWiki SP-3 |
| Pressure scenarios for principle tests (row 23) | **ADAPT-candidate, ARMED** → §13.37 | DeepWiki SP-5 |
| Our 3 colliding agents (row 10) | **ADAPT-MINIMAL: rename to de-collide** | probe C-1 |
| `aif-loop` reflex loop (row 15) | **REFERENCE** | aif-comparison §1.3 |
| `aif-evolve` incident-mining (row 17) | **REFERENCE** (complementary) | aif-comparison §9 |
| `using-git-worktrees` (row 12) | **REFERENCE** (multi-source precedent) | DeepWiki SP-7 |
| Autonomous Kanban (row 26) | **REFERENCE / KEEP-NARROW** (different layer) | WebSearch HO-1 |
| Plugin marketplace distribution (row 28) | **REFERENCE** (future ADAPT watch) | DeepWiki SP-9 |
| Code lint rules, mutation, manifest-SSOT, paired examples, doc-authority, pre-push, Living Docs (rows 3/5/6/19/20/29/4) | **KEEP-NARROW / BUILD-OURS** (confirmed differentiators) | aif-comparison §10; probe |
| Superpowers global install | **REJECT-CONFLICT** (within R-phase scope; B2-A) — user-scope, no uninstall | DeepWiki SP-2/SP-9 |
| External mutable DB ownership (HO-5) | **REJECT** (incompatible w/ git-as-SSOT) | overlap-analysis §4 |

> **T-CIA-E (ADOPT-on-paper-only) caveat on Superpowers rows:** every Superpowers ADAPT/REFERENCE verdict above is **read-only-evidenced** (DeepWiki + repo cites), **not probe-evidenced** — Superpowers was NOT installed (B2-A). Each Superpowers ADAPT recommendation requires a follow-up probe in a **separate maintainer-authorised session** before being treated as integration-verified. AIF + aif-handoff verdicts are probe/WebSearch-grounded.

---

## §8 Install order + coexistence checklist

```text
INSTALL ORDER (recommended, derived from actual probe — T-CIA-C):
1. ai-factory init --agents claude     FIRST — creates .claude/{skills,agents}/, .ai-factory.json
2. <pkg>/install.sh <stack> --force    SECOND — but ONLY after resolving C-1 agent rename (else --force
                                        breaks aif-handoff pipeline; default no-force silently keeps AIF stubs)
   OR (preferred): bash setup.sh --stack=<stack>  (wraps 1+2+npm+husky); add --force ONLY post-rename
3. Edit .ai-factory/{DESCRIPTION,ARCHITECTURE}.md placeholders; AGENTS.md placeholders
4. (aif-handoff, optional) install separately — it consumes .claude/agents/*.md; verify our renamed agents
   do NOT shadow AIF's pipeline-wired sidecars
5. Superpowers: NOT installed by this framework (user-scope, maintainer's individual choice, no uninstall)

PROBE-OBSERVED ORDERING CONSTRAINT:
- install.sh REQUIRES an existing package.json (fails fast: "❌ No package.json found"). Real consumer projects have one; setup.sh handles npm init path.
- Do NOT run /aif (AGENTS.md generation) AFTER our install without backup — it would overwrite our AGENTS.md (C-7).

POST-INSTALL VERIFICATION CHECKLIST:
[ ] .claude/agents/ contains our (renamed) agents AND AIF's wired sidecars — no silent shadowing
[ ] .claude/skills/ has both aif-* (25) and rules-as-tests/ + tool-bootstrapping/
[ ] .claude/settings.json present with UserPromptSubmit deps-hash hook
[ ] .ai-factory/ (dir) and .ai-factory.json (file) both present, no collision
[ ] .github/workflows/ci.yml present (ours); no AIF CI override
[ ] .husky/{pre-commit,pre-push} installed; `git push` triggers our 476-LOC checks
[ ] ./scripts/audit-ai-docs.sh runs PASS
[ ] no duplicate enforcement (AIF /aif-rules-check advisory vs our pre-push authoritative — document precedence)
```

---

## §9 Coexistence test plan (deterministic, no LLM — per [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md))

- **One-time post-install probe:** the §8 checklist as a bash script (`scripts/verify-coexistence.sh`); each `[ ]` → a `test -f` / `grep` assertion. Zero LLM. Sketch in `drafts/coexistence-ci-gate-design.md` (gitignored, operator-side).
- **Agent-collision regression check:** deterministic — `comm` of `ls .claude/agents/` (AIF init output) against `ls <pkg>/agents/` to surface name collisions before install; fail if intersection non-empty and `--force` not set. ≤20 LOC.
- **Periodic re-check trigger:** on AIF major version bump (currently 2.11.0) — re-run the init probe to detect new agent/skill names that might collide. Manual, not CI (no scheduled paid jobs per policy).
- **CI gate candidate:** «installed-companion agent-name set is disjoint from ours OR --force documented» — deterministic grep, no LLM. DEFER to install-hardening work, not this R-phase.

---

## §10 §1.7 Forward+Backward check on consolidated verdicts

**Forward-check (do the verdicts comply with existing disciplines?):**
- BFR-default §1 typology applied per row (§7). ✅
- T16 problem-class match table for every overlap row (§5). ✅
- no-paid-LLM: probe used real bash installs + DeepWiki/WebSearch (subscription/local); test plan §9 is deterministic. ✅
- doc-authority: this patch carries `<!-- scope: -->` + Authoritative-for header (principle 10 + 09). ✅
- Trigger sweep (§4.7 / §11 below) executed against armed §13.x. ✅
- Artifact Ownership: research-patch owned by this session; NO writes to README/CLAUDE/EXECUTION-PLAN/prior-art-evaluations.md (Commit 7 + SSOT registration are separate maintainer-approved commits). ✅

**Backward-check (does anything downstream need updating if verdicts ship?):**
- Commit 7 README widening: «companion to AI Factory + aif-handoff + Superpowers (today)» — but **clarify layer**: AIF = install substrate, aif-handoff = autonomous runtime atop AIF, Superpowers = user-scope methodology plugin (NOT project-installed). Draft in `drafts/commit-7-readme-revision-v2.md` (gitignored, operator-side).
- The C-1 agent rename is a **prerequisite** for honestly claiming "installs alongside AIF" — surfaced as DECISION-NEEDED #1.
- §13.36 candidate-mechanism wording should be refined (Superpowers skill-testing is prose+subagent, not automated harness) — surfaced as §11 trigger touch.

---

## §11 Self-review patch (recursive §1.7 on THIS R-phase output) + §4.7 armed-trigger cross-check

**§4.7 armed §13.x cross-check** (`grep -nE "^### 13\." open-questions.md` → 24 entries enumerated):

| §13.x | Trigger | Touch |
|---|---|---|
| §13.6 Relationship with AIF core | how AIF integrates | **NO-TOUCH** (informed: setup.sh wraps AIF init — already operational) |
| §13.18 AIF deep alignment (Option I) | adopt AIF rules hierarchy | **VERDICT-INFORMS** — C-1 collision is evidence the alignment is deeper than assumed (shared agent namespace); stays DEFER |
| §13.35 «1%-Rule» skill triggers | ≥3 skill-should-have-fired incidents | **NO-TOUCH** (verdict confirms source; no incident threshold met — stays ARMED) |
| §13.36 TDD-for-Skills | ≥2 no-real-failure SKILL.md | **VERDICT-REFINES** — evidence corrects mechanism understanding (prose+subagent, not automated harness); stays ARMED, candidate B more apt than A |
| §13.37 Pressure scenarios | ≥3 false-negative principle tests | **NO-TOUCH** (verdict confirms; no threshold met — stays ARMED) |

No verdict FIRES a trigger (no incident thresholds met). Empty-fire result is itself verified via the grep enumeration above (T15 counter — not "no triggers touched" without enumeration).

**Did this R-phase apply substance-not-form?**
- T2 (methodology≠running): §6 ran **real** `ai-factory init` + `install.sh` with pasted actual output (skip messages, exit codes, file sizes), not described.
- T3 (plausibility): every conflict cites a command + observed output; every Superpowers claim cites a DeepWiki query.
- T-CIA-A (assume-compatibility): probe **caught C-1** which DeepWiki had **denied** (DeepWiki said AIF creates no `.claude/agents/`; real probe found 19). This is the single strongest justification for the mandatory-probe discipline.
- T-CIA-F (AIF-incumbency): re-probed AIF v2.11.0 fresh; did not defer to "already handled".
- T13/T16 (ADOPTED≠zero-work / name-match): the agent-collision (row 10) and skill-testing correction (SP-4) are both T16 catches.
- T15 (self-application): this §11 + the §4.7 enumeration.

**Counter-prompt — "what would falsify these verdicts?"**
- If a real consumer never installs AIF (uses install.sh standalone), C-1 never fires — but setup.sh defaults to running `ai-factory init`, so the default path DOES hit it. Verdict holds for the documented install path.
- If AIF renames its sidecars in a future version, C-1 changes shape — hence §9 periodic re-probe on version bump.
- Superpowers verdicts are read-only-evidenced (T-CIA-E caveat in §7); a follow-up probe could shift ADAPT→REJECT if install side-effects prove worse than DeepWiki suggests.

**Self-application self-check passes** with the explicit T-CIA-E (Superpowers not-probed) caveat carried into every Superpowers verdict.

---

## §12 DECISION-NEEDED surfaces (maintainer / `/orchestrator`, not reviewer — per [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md))

1. **C-1 agent-name de-collision** — our `{best-practices-sidecar,docs-auditor,review-sidecar}.md` collide with AIF's. Options: (A) rename ours (e.g. `ratx-` prefix or `.claude/agents/rules-as-tests/` subdir); (B) keep `--force` overwrite + document the aif-handoff-pipeline-break risk; (C) keep default-skip + document that AIF stubs win. **Recommendation: A** (only option that lets both coexist honestly). **Blocks honest "installs alongside AIF" claim in Commit 7.**
2. **Commit 7 framing** — name 3 companions but **disambiguate layer** (substrate / runtime / user-plugin)? Options A1 (name + layer note), A2 (name only, compact), A3 (defer Superpowers until probed). **Recommendation: A1.** Draft ready.
3. **Superpowers follow-up probe** — authorise a separate session to actually install + uninstall-test Superpowers (resolving T-CIA-E caveat)? Or keep read-only indefinitely? **Recommendation: keep read-only until a concrete ADAPT (§13.35/36/37) fires.**
4. **§13.36 candidate-mechanism update** — refine the ARMED entry to reflect prose+subagent (not automated harness)? Low-effort doc edit. **Recommendation: update opportunistically when §13.36 next touched (B2-lazy).**
5. **`.ai-factory/RULES.md` ownership** (C-2 runtime watch) — document that our install seeds it and AIF `/aif-rules` may append? **Recommendation: one-line note in INSTALL.md.**

---

## §13 What this R-phase does NOT do

- Does NOT install AIF or our project in any production project (only `/tmp/cit-<ts>/`).
- Does NOT install Superpowers in ANY session (B2-A; `/plugin install` FORBIDDEN within R-phase scope) — read-only DeepWiki + WebSearch only.
- Does NOT ship Commit 7 (draft only).
- Does NOT edit `.claude/rules/`, `.claude/skills/`, `agents/`, `packages/core/principles/`, README, CLAUDE.md.
- Does NOT register SSOT entries (Superpowers / aif-handoff repo / collision finding) — separate maintainer-approved commit.
- Does NOT rename the colliding agents (DECISION-NEEDED #1 — surfaced, not actioned).
- Does NOT relaunch 1A/1B, Wave 10, or close Track 4b kickoff.

---

## §14 See also

- `.claude/orchestrator-prompts/companion-integration-analysis/kickoff.md` (gitignored, operator-side) — this R-phase's kickoff (§3.5 CLEAR)
- [build-first-reuse-default.md §1](../../../.claude/rules/build-first-reuse-default.md) — verdict typology
- [ai-laziness-traps.md §2 T16](../../../.claude/rules/ai-laziness-traps.md) — pattern-matching-on-name protocol
- [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) — DECISION-NEEDED surface pattern
- [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) — §9 test-plan determinism constraint
- [aif-comparison.md](../aif-comparison.md) — AIF v2.11.0 deep single-project (still current at 2.11.0)
- [2026-05-11-aif-handoff-overlap-analysis.md](2026-05-11-aif-handoff-overlap-analysis.md) — aif-handoff coordinator primitives
- [2026-05-16-companion-target-comparison.md](2026-05-16-companion-target-comparison.md) — Track 4b (Superpowers + 6); skill-testing claim corrected here (SP-4)
- [open-questions.md §13.35/§13.36/§13.37](../open-questions.md) — armed Superpowers ADAPT candidates
- [prior-art-evaluations.md](../prior-art-evaluations.md) — SSOT (no Superpowers / aif-handoff-repo / collision entries yet)
- DeepWiki probes (2026-05-20): `lee-to/ai-factory` init footprint; `obra/superpowers` install + skills + 1%-Rule + TDD-for-Skills + brainstorming-gate. WebSearch: `lee-to/aif-handoff` identity.
- Real install probe artefacts: `/tmp/cit-<ts>/` (ephemeral; commands + outputs embedded in §6).
