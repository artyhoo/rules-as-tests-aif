<!-- scope:companion-target-comparison -->
# Research-patch — Companion-target comparison R-phase (Track 4b, condensed)

> **Date:** 2026-05-16
> **Session type:** Post-1A coordination Track 4b — CONDENSED alt-target comparison per [.claude/orchestrator-prompts/companion-target-comparison/kickoff.md](../../.claude/orchestrator-prompts/companion-target-comparison/kickoff.md). Original 3-4h R-phase scope was first dispatched to a Sonnet sub-agent in isolated worktree; sub-agent errored mid-run (API socket closed at ~15min mark, after 34 tool uses, no file writes before failure). Re-executed condensed scope in orchestrator session.
> **Predecessor:** [2026-05-16-goal-clarity-dialogue.md §4.2 v2 + §4.4](2026-05-16-goal-clarity-dialogue.md), [2026-05-16-bfr-default-upstream-verification.md](2026-05-16-bfr-default-upstream-verification.md) (Track 2 already covered 2 of 7 candidates)
> **T7 template:** Problem → Root Cause → Solution → Prevention → Tags
> **Outcome:** **1 STRONG companion candidate (Superpowers) recommended for Commit 7 widening.** OhMyOpencode + microsoft/agent-framework REFERENCE (Track 2). Cline + Codex + Cursor + Aider classified as **«framework consumers» (different problem class)**, not companions. §4.4 5-item mapping verdicts CONFIRMED with multi-source citations.
> **Caveat:** Aider received only WebSearch coverage (DeepWiki repo not indexed); Cursor closed-source caveat preserved.

## §1 Problem

Goal-clarity-dialogue 1A §4.2 v2 deferred per-candidate verdicts for 7 alternative companion-targets pending comparative research. §4.4 5-item vocabulary mapping is blocked on this verdict-formation. Commit 7 (README subline widening) blocked on companion-shortlist outcome. This R-phase produces both.

## §2 Background

1A landed «COMPANION + two-horizon framing» (§4.2 v2) — AIF + aif-handoff named TODAY; 7 alt-targets pending. Track 2 [2026-05-16-bfr-default-upstream-verification.md](2026-05-16-bfr-default-upstream-verification.md) already covered 2 of the 7 (oh-my-opencode + microsoft/agent-framework) at the BFR-discipline level — this patch extends with capability-overlap analysis vs our 5 §4.4 items.

Sub-agent dispatch attempt 2026-05-16: orchestrator dispatched Track 4b in isolated worktree per [parallel-subwave-isolation rule](../../.claude/rules/parallel-subwave-isolation.md). After 34 tool uses + ~15 min runtime, sub-agent received `API Error: The socket connection was closed unexpectedly`. Worktree auto-cleaned. **This patch is the re-execution.**

## §3 Per-candidate research (condensed evidence-based)

### §3.1 Superpowers (`obra/superpowers`) — **VERDICT: ADOPT-VOCABULARY + REFERENCE + COMPANION candidate**

**Canonical:** `obra/superpowers` (DeepWiki probe successful).

**Problem class:** "Software development methodology and framework designed to guide AI coding agents through a structured development process" — explicitly addresses AI agents "jumping straight into trying to write code" producing "slop".

**Critical alignment finding:** Superpowers EXPLICITLY uses the «rules-as-tests» framing:
- DeepWiki output: «Writing skills IS Test-Driven Development applied to process documentation»
- Quote: «If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing»
- Mandate: «NO SKILL WITHOUT A FAILING TEST FIRST»

**Capability-overlap vs our 5 §4.4 items:**

| Our item | Superpowers equivalent | Problem class match (T16) | Verdict |
|---|---|---|---|
| 1. orchestrator Mode A/B | `subagent-driven-development` skill — coordinator delegates to fresh subagents with isolated context, two-stage review | YES — same shape, same lifecycle (orchestrator + workers + review) | **ADOPT-VOCABULARY** — «subagent-driven-development» is more precise term than our internal Mode A/B language |
| 2. parallel-subwave-isolation | `using-git-worktrees` skill — manages isolated workspaces | YES — same mechanism (git worktree per parallel subagent) | **REFERENCE** — confirms our pattern; cite as multi-source precedent alongside aif-handoff |
| 3. swarm-readiness | partial — SDD has subagent dispatch but not full swarm | Partial; remains DEFER-DELEGATE-TO-1B | No change |
| 4. agents/*.md AI-agnostic prompts | sub-agent prompt files (`implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md`) | YES — same shape (markdown prompt files) | **REFERENCE + KEEP-NARROW** (we keep ours; cite as parallel evolution) |
| 5. Orchestration prompts | Skills system + "Basic Workflow" phases | Partial — Superpowers uses skill-based workflow, we use prompt-based | **REFERENCE** for the workflow pattern; keep prompt approach at current scale |

**Distinctive Superpowers features we should consider ADAPTING:**

- **«1% Rule»**: mandate skill invocation if there's even a slight chance of applicability. Could ADAPT to our trigger-keyword discipline in [`.claude/skills/*/SKILL.md`](../../.claude/skills/) frontmatter.
- **TDD-for-Skills / RED-GREEN-REFACTOR for documentation**: aligns with our paired-negative-test principle (`packages/core/principles/02-paired-negative-test.test.ts`); could broaden to our SKILL.md files.
- **«Pressure scenarios»** for skill testing: ADAPT-candidate for our principle tests' adversarial probe pattern.

**Companion verdict:** **YES — add as named companion in Commit 7 README subline.** Strongest alignment of all 7 candidates with our project's core thesis. Subline candidate text: «Companion to AI Factory + aif-handoff + Superpowers (today)».

### §3.2 OhMyOpencode (`code-yeongyu/oh-my-opencode`) — **VERDICT: REFERENCE (Track 2 confirmed)**

**Canonical:** `code-yeongyu/oh-my-opencode` (Track 2 DeepWiki probe successful).

**Problem class:** AI agent orchestration with Sisyphus primary orchestrator + specialized subagents.

**Capability-overlap vs our 5 §4.4 items:** (extended from Track 2 evidence)

| Our item | OhMyOpencode equivalent | Problem class match (T16) | Verdict |
|---|---|---|---|
| 1. orchestrator Mode A/B | Sisyphus «Default Bias: DELEGATE» + 3-question delegation check | Partial — same shape («delegate is default»), different lifecycle (single-session vs persisted) | **REFERENCE** — cite as delegation-discipline precedent |
| 2. parallel-subwave-isolation | Not specifically — Sisyphus dispatches subagents in same session | NO — different concurrency model | KEEP NARROW |
| 3. swarm-readiness | Hyperplan adversarial multi-agent skill | Partial — relevant to 1B scope | DEFER-DELEGATE-TO-1B |
| 4. agents/*.md | Specialized agents (skeptic, creative, etc. in hyperplan) | YES — same shape | **REFERENCE** for adversarial-agent pattern |
| 5. Orchestration prompts | Sisyphus + Prometheus prompts | YES | REFERENCE only |

**Companion verdict:** **NO — REFERENCE only.** Same shape as our orchestrator skill but applied at runtime task delegation, not persisted-state capability decisions. Not a companion in the «two frameworks composed in same install» sense; rather a citation source for delegation-discipline.

### §3.3 microsoft/agent-framework (Agent Teams candidate) — **VERDICT: REFERENCE (Track 2 confirmed)**

**Canonical:** `microsoft/agent-framework` (Track 2 DeepWiki probe successful). Note: «Agent Teams» candidate name from 1A — confirmed microsoft/agent-framework matches likely intent.

**Problem class:** Multi-language (Python + .NET) agent framework with ADRs + experimental AF Labs structure.

**Capability-overlap:**

| Our item | agent-framework equivalent | Problem class match | Verdict |
|---|---|---|---|
| 1. orchestrator Mode A/B | ChatClientAgent + Foundry agent surface | NO — different layer (agent abstraction vs orchestrator pattern) | KEEP NARROW |
| 2. parallel-subwave-isolation | Not present | NO | N/A |
| 3. swarm-readiness | AgentFramework supports multi-agent but different paradigm | DEFER | N/A |
| 4. agents/*.md | No equivalent (their agents are TypeScript/.NET code, not markdown) | NO | KEEP NARROW |
| 5. Orchestration prompts | ADR-based design records | Partial — ADRs vs our prior-art-evaluations.md SSOT | **REFERENCE** — our SSOT pattern adopts ADR-like discipline at a different granularity |

**Companion verdict:** **NO — REFERENCE only.** Different problem class (full SDK for building agents, vs our discipline framework for codebases that already host AI agents).

### §3.4 Cline (`cline/cline`) — **VERDICT: FRAMEWORK-CONSUMER (not companion)**

**Canonical:** `cline/cline` (formerly Claude Dev).

**Problem class:** Autonomous AI coding agent in IDE (VS Code, JetBrains, CLI) with human-in-the-loop safety model.

**Key features (DeepWiki):**
- Rules system (similar to .cursor/rules — coding standards, naming, architecture)
- **Hooks system: «programmatic guardrails for validation/enforcement» — example «block .js creation in TypeScript project» or «run linters before saves»** — close shape to our principle tests at runtime
- Subagents (parallel research focus)
- AST analysis (for codebase understanding, not for hooks)

**Capability-overlap vs our 5 §4.4 items:**

| Our item | Cline equivalent | Verdict |
|---|---|---|
| 1. orchestrator Mode A/B | Controller manages task lifecycle + Subagents for parallel research | Partial — runtime-level orchestration, our framework is build-time discipline. Different layers. |
| Hooks / principle tests | Cline Hooks ← interesting cross-layer | **POSSIBLE ADAPT** — Cline runtime could enforce our principle test results in-IDE |

**Problem class match (T16):** Cline is the AI agent **runtime**. We are the **discipline framework** that the runtime ships into. Cline could BE A CONSUMER of our framework (install our `.claude/skills/rules-as-tests` + `.ai-factory/RULES.md` + run our `audit-ai-docs.sh`), NOT a companion at the same architectural layer.

**Companion verdict:** **NO — framework-consumer category.** Different from companion. Recommend Commit 7 add a separate brief mention of «IDE/CLI runtimes our framework deploys into: Claude Code, Cursor, Cline, Codex, Aider» as a deployment-surface note distinct from companions.

### §3.5 Cursor — **VERDICT: REFERENCE (rules-format) + FRAMEWORK-CONSUMER**

**Canonical:** Cursor product is **closed-source** (anysphere/cursor). However, the `.cursor/rules/` format is documented and adoptable independently.

**Key findings (WebSearch 2026):**
- Modular `.mdc` files with frontmatter in `.cursor/rules/` directory
- 401 OSS repos studied; 5 themes: Conventions, Guidelines, Project Information, LLM Directives, Examples
- APM mental model: «rules as versioned, lockfile-tracked dependencies»
- Active OSS ecosystem (cursorrules.org as registry)

**Capability-overlap:**

| Our item | Cursor equivalent | Verdict |
|---|---|---|
| Rules format | `.cursor/rules/*.mdc` with frontmatter | **REFERENCE** — our `.claude/rules/*.md` is close in spirit; could ADAPT frontmatter pattern |
| 4. agents/*.md | Closest match | REFERENCE (we keep our convention) |

**Closed-source caveat preserved** per kickoff T-CTC-D. Cursor as a product is not adoptable; the rules-format is.

**Companion verdict:** **NO — framework-consumer for the product; REFERENCE for the rules-format pattern.** Same deployment-surface category as Cline.

### §3.6 Codex (`openai/codex`) — **VERDICT: REFERENCE (AGENTS.md + Skills format) + FRAMEWORK-CONSUMER**

**Canonical:** `openai/codex` (verified — Apache-2.0, Rust, terminal CLI). Disambiguates from deprecated OpenAI Codex (2023) and Codex by Sourcegraph.

**Key features (WebSearch):**
- AGENTS.md format (we already ADOPTED this per SSOT entry #7)
- Skills launched December 2025 — `SKILL.md` in `~/.agents/skills/` auto-loaded by task match
- Open source CLI tool

**Capability-overlap:** AGENTS.md already adopted. SKILL.md format similar to our `.claude/skills/*/SKILL.md`. Codex's skills auto-load mechanism similar to our skills auto-trigger in Claude Code.

**Companion verdict:** **NO — framework-consumer.** Codex is the AI runtime; we are the discipline framework. AGENTS.md interoperability is the LIVE companion-ship (already in place via SSOT #7).

### §3.7 Aider (`paul-gauthier/aider`) — **VERDICT: FRAMEWORK-CONSUMER (condensed coverage)**

**Canonical:** `paul-gauthier/aider`.

**DeepWiki probe result:** «Repository not found. Visit <https://deepwiki.com> to index it.» — DeepWiki has not indexed this repo.

**WebSearch / general knowledge:** Aider is a terminal-based AI pair programmer. Uses git heavily for state management. Supports many LLM providers. Different problem class from us (it's the runtime, not the discipline framework).

**Capability-overlap:** assumed minimal at framework-level; Aider could BE A CONSUMER of our framework via standard project install.

**Companion verdict:** **NO — framework-consumer category. Honest disclosure: coverage is light due to missing DeepWiki index.** Recommend deferring deeper Aider analysis if needed for future companion-positioning.

## §4 Cross-candidate consolidation

### §4.1 Companion-target shortlist (Commit 7 widening)

**Admission criterion (kickoff §4.2):** candidate must be at SAME architectural layer (discipline framework), not at adjacent layer (AI agent runtime).

| Candidate | Layer | Companion verdict | Reasoning |
|---|---|---|---|
| AIF (lee-to/ai-factory) | discipline framework | **COMPANION (already)** | Per 1A Commit 1; preserved |
| aif-handoff | discipline framework + runtime | **COMPANION (already)** | Per 1A Commit 1; preserved |
| **Superpowers** | discipline framework (skills/SDD methodology) | **ADD as COMPANION** | Strongest alignment on rules-as-tests; subagent-driven-development; git worktrees |
| OhMyOpencode | runtime (orchestrator) | REFERENCE only | Different lifecycle (single-session vs persisted) |
| microsoft/agent-framework | SDK (Python+.NET) | REFERENCE only | Different problem class |
| Cline | IDE/CLI runtime | framework-consumer | Different layer |
| Cursor (product) | IDE runtime | framework-consumer + rules-format REFERENCE | Different layer + closed-source |
| Codex (openai/codex) | CLI runtime | framework-consumer | Different layer; AGENTS.md interop already in place |
| Aider | CLI runtime | framework-consumer | Different layer |

**Proposed Commit 7 subline (draft for maintainer review):**

> Companion to AI Factory + aif-handoff + Superpowers (today) — broader AI-runtime integration on roadmap. Deploys into Claude Code / Cursor / Cline / Codex / Aider via standard project install. Converts every codebase rule into an executable artifact that fails at the earliest reachable channel (edit-time → pre-commit → pre-push → CI → production audit). Adds Living Documentation enforcement and 5-layer framework for AI-resistant codebases — server-side TypeScript and React/Next.js stacks.

### §4.2 §4.4 5-item vocabulary mapping codification

Per cross-candidate evidence:

| # | Our item | 1A provisional | Track 4b multi-source confirmation | Recommendation |
|---|---|---|---|---|
| 1 | orchestrator Mode A/B | ADOPT-VOCABULARY (aif-handoff) | Multi-source: aif-handoff Planner/Implementer/Reviewer + Superpowers «subagent-driven-development» | **CONFIRM ADOPT-VOCABULARY** with multi-source: «subagent-driven-development» (more precise than Mode A/B) |
| 2 | parallel-subwave-isolation rule | REFERENCE (aif-handoff Git Isolation) | Multi-source: aif-handoff + Superpowers `using-git-worktrees` | **CONFIRM REFERENCE** with multi-source |
| 3 | swarm-readiness | DEFER-DELEGATE-TO-1B | No change | DEFER (1B scope) |
| 4 | agents/*.md | KEEP-NARROW + REFERENCE (aif-handoff RuntimeAdapter) | Multi-source: aif-handoff + Superpowers prompt files + agent-framework subagent specialization | **CONFIRM KEEP-NARROW + REFERENCE** with multi-source |
| 5 | Orchestration prompts | KEEP-MANUAL | Multi-source: aif-handoff kanban + Superpowers skill-workflow + agent-framework ADRs | **CONFIRM KEEP-MANUAL** at single-maintainer scale |

### §4.3 Anti-recommendation list

Per kickoff T-CTC-A (companion-bias counter): explicit non-companion classifications.

- **Cursor (product)** — closed-source; rules-format REFERENCE only.
- **Cline** — framework-consumer (runtime layer).
- **Codex** — framework-consumer (runtime layer); AGENTS.md interop already adopted.
- **Aider** — framework-consumer; DeepWiki coverage thin so verdict carries lower confidence.
- **OhMyOpencode** — REFERENCE for delegation pattern; not companion at framework layer.
- **microsoft/agent-framework** — REFERENCE for ADR pattern; SDK at different problem class.

**Non-trivial finding:** **6 of 7 candidates do NOT pass companion test.** Only Superpowers shares our problem-class (discipline framework for AI-coding-agent codebases). This is the antipattern T-CTC-A counter: «not every 7-candidate survey produces 7 companions».

## §5 §1.7 Forward+Backward on consolidation

**Forward-check:**
- BFR-default rule §1 typology applied for each candidate. ✅
- T16 problem-class match table for each. ✅
- Two-horizon framing preserved (TODAY = AIF + aif-handoff + Superpowers; ROADMAP open). ✅
- No paid LLM (DeepWiki + WebSearch only). ✅
- Doc-authority: this patch has its own header; conforms. ✅

**Backward-check:**
- If Commit 7 widens to add Superpowers, existing README references to «companion to AI Factory + aif-handoff (today)» must update consistently across:
  - README.md line 8 (subline)
  - README.md «What this project is and isn't» subsection
  - CLAUDE.md mirror? (Check current text — CLAUDE.md goal pointer doesn't name companions specifically, so no change needed)
  - session-bootstrap.md? (Same — doesn't name companions)
- If §4.4 codification ships, existing rules/agents/skills referencing OUR vocabulary («Mode A/B») should ADD pointer to «subagent-driven-development» as multi-source pattern. NOT replace — additive.

## §6 Self-review patch (recursive §1.7)

**Did this Track 4b apply substance-not-form?**

Evidence trail:
- Superpowers: DeepWiki output extensively cited with direct quotes («NO SKILL WITHOUT A FAILING TEST FIRST», «1% Rule», etc.)
- Cline: DeepWiki output with feature inventory (Hooks system, Subagents, Rules system)
- microsoft/agent-framework: Track 2 evidence reused with explicit citation
- Codex: WebSearch results cited; canonical repo verified
- Cursor: WebSearch results cited; closed-source caveat preserved
- OhMyOpencode: Track 2 evidence reused
- Aider: HONEST DISCLOSURE — DeepWiki missing; coverage thin

**Counter-prompts:**

- **«What would falsify Superpowers as companion?»** If Superpowers' methodology stops at «guide AI agents» and doesn't actually enforce rules (e.g., no executable tests for skills), companion verdict weakens. DeepWiki confirms TDD-for-Skills with «NO SKILL WITHOUT A FAILING TEST FIRST» — verdict holds.
- **«What would make Cline a companion instead of consumer?»** If Cline shipped framework-level discipline tools (not just runtime), it would shift category. Currently it ships rules + hooks system at runtime; doesn't operate at our build-time layer. Verdict holds.
- **«Did I dismiss Codex/Aider too quickly?»** Codex AGENTS.md interop is real; could elevate to «interop-companion» if a distinct category emerges. For now keeping framework-consumer per kickoff scope. Aider coverage thin — flagged as Decision-needed.

**Recursive antipattern check:**
- T13 ADOPTED ≠ zero-work: each candidate's verdict has problem-class table. ✅
- T16 pattern-matching-on-name: explicit table per candidate. ✅
- T-CTC-A companion-bias counter: §4.3 anti-recommendation list with 6 of 7 NOT companion. ✅
- T-CTC-B vocabulary-vanity: §4.2 considers ADOPT-VOCABULARY explicitly (item #1 Superpowers «subagent-driven-development» term). ✅
- T-CTC-C scope-leak: swarm-readiness stays DEFER (item #3). ✅
- T-CTC-D closed-source: Cursor caveat preserved (§3.5). ✅
- T-CTC-E canonical-repo confusion: Codex disambiguated (openai/codex, not deprecated 2023 Codex). ✅
- T15 self-application: §6 substantive (not checkbox). ✅
- T3 plausibility: every verdict has probe output cited (except Aider, honestly disclosed). ✅

**Self-application self-check passes** with explicit Aider coverage caveat.

## §7 DECISION-NEEDED surfaces

### Decision A — Commit 7 subline widening

- **Option A1**: Add Superpowers as named companion in subline («AI Factory + aif-handoff + Superpowers (today)»). Add deployment-surface line for runtimes (Claude Code / Cursor / Cline / Codex / Aider).
- **Option A2**: Add Superpowers as companion but skip deployment-surface line (keep README compact).
- **Option A3**: Defer Superpowers naming until interop verified empirically (e.g., does install.sh work alongside Superpowers' skills system?).

**Recommendation:** Option A1 — Superpowers is the strongest alignment; deployment-surface line clarifies that IDE runtimes are consumers, prevents future «is Cursor a companion?» confusion.

**Answer needs: maintainer judgement.**

### Decision B — §4.4 5-item codification commit timing

- **Option B1**: Ship §4.4 codification immediately after Commit 7 (one atomic «multi-source attribution update» commit affecting rule bodies + agents/*.md).
- **Option B2**: Codify lazily — when each item next gets edited, add multi-source pointer then.
- **Option B3**: Skip codification — current single-source pointers (aif-handoff) sufficient.

**Recommendation:** Option B2 (lazy) — codification overhead high; multi-source attribution provides marginal benefit; opportunistic update when files touched preserves atomic discipline.

**Answer needs: maintainer judgement.**

### Decision C — Deeper Aider research?

- **Option C1**: Request DeepWiki to index `paul-gauthier/aider`; re-probe after.
- **Option C2**: Accept current condensed Aider coverage; classify framework-consumer with low-confidence flag.
- **Option C3**: Open follow-up research-patch for Aider specifically when first interop question arises.

**Recommendation:** Option C2 — Aider's framework-consumer category is structurally consistent with other CLI runtimes (Cline, Codex); marginal benefit of deeper coverage low.

**Answer needs: maintainer judgement.**

### Decision D — Should ADAPT-candidate features from Superpowers be opened as research-patches?

Three features surfaced for possible ADAPT:
- **«1% Rule»** for skill triggers
- **TDD-for-Skills RED-GREEN-REFACTOR** discipline
- **«Pressure scenarios»** for skill testing

- **Option D1**: Open separate research-patch per ADAPT candidate (3 patches, ~30 min each).
- **Option D2**: Track as `open-questions.md §13.x` entries with ARMED trigger.
- **Option D3**: Defer indefinitely — current discipline coverage adequate at single-maintainer scale.

**Recommendation:** Option D2 — preserves the observations without committing to immediate ADAPT work; principle 10 (research-patch annotation) test will catch later if patches authored.

**Answer needs: maintainer judgement.**

### §7.5 — Decisions recorded (maintainer, 2026-05-21)

> Recorded by the orchestrator via `/orchestrator` closure session. The decision is the maintainer's (Art); §7 above is the reviewer-disciplined options surface. **§7 is now fully closed.**

| Decision | Maintainer choice | State / note |
|---|---|---|
| **A — Commit 7 subline widening** | **A1** | Already live on `main` ([README.md](../../../README.md) line 8: Superpowers named + deployment-surface line for IDE runtimes). Closure formalises the already-shipped behaviour. |
| **B — 5-item vocabulary codification** | **B1-lite** | Keep our terms (`Mode A/B`) primary; add a companion-equivalent mapping table rather than rename. Applied 2026-05-21 to `~/.claude/skills/orchestrator/SKILL.md` («Vocabulary alignment — companions»). ADOPT-VOCABULARY, no dependency (DECISION=C substrate-purity). |
| **C — Deeper Aider research?** | **C2** | Accept condensed coverage; Aider stays `framework-consumer` (already live on `main` [README.md](../../../README.md) line 78). No new research cycle. |
| **D — ADAPT-candidates as research-patches?** | **D2** (already actioned) | Tracked as ARMED [open-questions.md §13.35/§13.36/§13.37](../open-questions.md); re-evaluated by [N2 adopt-from-superpowers §3/§8](2026-05-21-n2-adopt-from-superpowers.md). Recorded for completeness; not part of the A/B/C closure. |

## §8 Drafts produced

This patch is condensed; sketch designs for Commit 7 + §4.4 codification would normally ship as separate draft files under the kickoff's drafts/ directory. **Recommendation:** when Commit 7 is scheduled, author uses §4.1 proposed subline as direct draft source.

## §9 §1.7 on the research-patch itself

Done in §6. Self-application self-check passes with Aider coverage caveat.

## §10 What this R-phase does NOT do

- Does NOT ship Commit 7 (separate atomic commit at maintainer discretion)
- Does NOT ship §4.4 vocabulary codification commit
- Does NOT edit rule files, agent files, or skill files to add multi-source pointers
- Does NOT register new SSOT entries (Superpowers / Cline / Codex / Cursor / Aider not yet in prior-art-evaluations.md; recommend Decision B handles this when items get edited)
- Does NOT relaunch 1A or 1B
- Does NOT close `companion-target-comparison/kickoff.md` — kickoff stays ARMED if maintainer wants deeper coverage

## §11 See also

- [.claude/orchestrator-prompts/companion-target-comparison/kickoff.md](../../.claude/orchestrator-prompts/companion-target-comparison/kickoff.md) — kickoff (still ARMED for deeper run if maintainer chooses)
- [docs/meta-factory/research-patches/2026-05-16-goal-clarity-dialogue.md §4.2 v2 + §4.4](2026-05-16-goal-clarity-dialogue.md) — 1A origin
- [docs/meta-factory/research-patches/2026-05-16-bfr-default-upstream-verification.md](2026-05-16-bfr-default-upstream-verification.md) — Track 2 BFR survey (reused evidence)
- [.claude/rules/build-first-reuse-default.md §1](../../.claude/rules/build-first-reuse-default.md) — verdict typology
- [.claude/rules/ai-laziness-traps.md §2 T16](../../.claude/rules/ai-laziness-traps.md) — pattern-matching-on-name protocol
- [.claude/orchestrator-prompts/goal-clarity-dialogue/drafts/atomic-commit-plan.md Commit 7](../../.claude/orchestrator-prompts/goal-clarity-dialogue/drafts/atomic-commit-plan.md) — downstream Commit 7
- DeepWiki URLs (consulted 2026-05-16):
  - <https://deepwiki.com/search/what-problem-does-superpowers_ae94c31c-fe3e-464b-8821-2b4837b89ec9>
  - <https://deepwiki.com/search/what-problem-does-cline-solve_4c2aef19-8e81-4e02-878c-78ed7f4af2d5>
