<!-- scope:swarm-tools-research -->
# Research-patch — Swarm + Tools research (Step 1B) outcomes

> **Date:** 2026-05-21
> **Session type:** Step 1B — Swarm + Tools Research (orchestrator + read-only Opus research subagents, fan-out by topic). RESEARCH, not implementation, not autonomous decision.
> **Predecessor (mandatory):** [goal-clarity-dialogue (1A)](2026-05-16-goal-clarity-dialogue.md) — its verdicts (BFR-default codified, Wave 10 CORE, companion-positioning) are inputs, not re-decided here.
> **Kickoff:** [.claude/orchestrator-prompts/swarm-tools-research/kickoff.md](../../../.claude/orchestrator-prompts/swarm-tools-research/kickoff.md)
> **Outputs:** this patch + [outputs/AGENT.md.template](../../../.claude/orchestrator-prompts/swarm-tools-research/outputs/AGENT.md.template)
> **Authoritative for:** swarm-tools-research findings (Prometheus/Atlas resolution, Prometheus/Atlas-vs-AIF-Handoff landscape, AI-SLOP-vs-docstring + mechanical-detection boundary, AGENT.MD prior-art + template, ecosystem/Anthropic-infra/billing verification, Phase-10/Swarm-readiness trigger conditions).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Does not create SSOT entries (research-tooling R-phase owns that — §3.10 flags the candidate). Does not codify rules. **Does not decide or analyse any execution approach / runtime for the input spec** — the spec is a documentation example only (see scope-correction note).

> ## ⚠ Scope-correction note (2026-05-21) — read first
>
> This patch was **rewritten on 2026-05-21 to the corrected 1B scope.** Its first version (mis-scoped, mirroring a corrupted research prompt — see [kickoff scope-correction banner](../../../.claude/orchestrator-prompts/swarm-tools-research/kickoff.md)) treated the input spec as an **execution target** and produced a spec-defect analysis (former §4), an approach comparison (§5), an execution recommendation + maintainer execution decision (§6/§6.1), and spec-format amendments (§7). **Those sections are deliberately removed.** The input `semantic-dedup-contracts` spec is a **documentation EXAMPLE only** — a real-shaped artifact used to ground the docstring illustration and the AGENT.MD template; it is never planned, decomposed, defect-analysed, or matched to an executor here.
>
> **Section numbering jumps §3 → §8 deliberately** — there are intentionally no §4–§7. The superseded full text is preserved (gitignored) at `outputs/_superseded-mis-scoped-patch-2026-05-21.md`; the former spec-execution working files (`spec-format-amendments.md`, `spec-amended.md`, `install-superpowers-executing-plans.md`) were quarantined to the gitignored `outputs/_out-of-1B-scope/` dir (with a README) as target-project working notes, no longer claimed as 1B deliverables.

## §1 Session purpose + maintainer-stated questions recap

Single-sitting research session answering three concrete questions for the maintainer (single operator), per the **corrected** kickoff §1:

1. **Swarm/agent tools deep-dive** — what are "Prometheus" (planner) and "Atlas" (executor) really; where do they sit relative to AIF Handoff (complement or compete — landscape understanding, *not* a runtime pick); and what ecosystem + Anthropic-native infrastructure (superpowers, Agent SDK credit, subagent model selection, skills-for-subagents, community collections) is available to ADOPT/REFERENCE rather than build.
2. **AI-SLOP + AGENT.MD discipline** — what AI SLOP in docstrings is and how to prevent it; an evidence-based, anti-laziness AGENT.MD template that resists AI laziness; and the mechanical-detection boundary (what a linter can/can't catch).
3. **Trigger conditions** — under what concrete predicates a full Phase 10 foundations audit or a full Swarm-readiness session should launch beyond what 1A+1B cover.

**Out of scope (corrected):** any execution plan / approach / runtime choice for the input spec; analysing the spec's task graph, dependencies, or readiness; editing the spec. The spec is input ONLY as a real-shaped documentation example (§3.8/§3.9 illustration). See scope-correction note.

Method: orchestrator dispatched read-only Opus research subagents (Prometheus/Atlas/AIF-fit; AI-SLOP + AGENT.MD; ecosystem/Anthropic-infra). Every external claim carries a citation URL; "not found" treated as a valid finding (anti-fabrication, T3/T-ST-A); negative aif-handoff claims confirmed across ≥5 DeepWiki phrasings (T1).

**Environment note (kickoff §9 / pre-flight):** `claude --version` = **2.1.143** at session run — past the 2.1.100 threshold, so per the kickoff this run **flags GitHub issue #46917** (token-inflation bug that triggered the 2026-05-13 downgrade). No corrective action in 1B scope; recorded for the maintainer's awareness when planning any headless/`claude -p` run on the current build.

## §2 Background

Builds on 1A ([2026-05-16-goal-clarity-dialogue.md](2026-05-16-goal-clarity-dialogue.md)): BROAD multi-channel goal framing, COMPANION positioning (README already names AI Factory + aif-handoff + Superpowers as today-companions), `build-first-reuse-default` rule codified (`.claude/rules/build-first-reuse-default.md`), Wave 10 = CORE. 1A §11.1 flagged an "alt-target comparison" blocking dependency; per project memory the companion-integration-analysis R-phase completed 2026-05-20 (agent-collision C-1 resolved), so that block is substantially discharged and treated here as resolved context, not re-opened.

Empirical aif-handoff structure (7-package monorepo, @aif/agent pipeline, @aif/runtime RuntimeAdapter) and SSOT attribution corrections (#27–#30, #43–#46) are not re-narrated — see [research-tooling-evaluation/kickoff.md §10](../../../.claude/orchestrator-prompts/research-tooling-evaluation/kickoff.md) and [prior-art-evaluations.md](../prior-art-evaluations.md).

## §3 Prior-art sweep results (§4.1 outputs)

### §3.5 Prometheus — what it is + how it works

**FOUND — resolves to a specific named tool.** Prometheus is the **planning agent** in `code-yeongyu/oh-my-openagent` (formerly `oh-my-opencode`), a multi-agent orchestration plugin for the OpenCode harness. Agent fleet: Sisyphus, Oracle, Librarian, Explore, **Atlas**, **Prometheus**, **Metis**, **Momus**.
[VERIFIED via https://deepwiki.com/code-yeongyu/oh-my-openagent/3-agents + https://github.com/code-yeongyu/oh-my-openagent/blob/dev/docs/guide/orchestration.md]

- **Role:** strategic planning consultant; refuses to write implementation code (a `prometheus-md-only` hook blocks any Write/Edit on non-`.md` targets outside `.sisyphus/`). Operates in interview mode + silent codebase exploration; mandatory pre-planning gap-analysis pass via **Metis**.
- **Output:** structured markdown plan at `.sisyphus/plans/{name}.md` with sections **TL;DR · Context (incl. Metis review) · Work Objectives (deliverables / definition-of-done / must-haves / must-NOT-haves) · Verification Strategy · Execution Strategy (parallel waves, ~5–8 tasks/wave, dependency matrix, agent-dispatch summary) · TODOs (per-task what/must-NOT/agent-profile/parallelization/QA scenarios) · Final Verification Wave (F-reviewers)**.
- **Plan polishing (Momus):** optional "high-accuracy mode" critic. Checks reference verification, executability, critical blockers, QA-scenario executability; verdict `[OKAY]`/`[REJECT]`, ≤3 issues per rejection, loops until `[OKAY]` (approval-biased: ~80%-clear is good enough).
- **"Ready-to-execute" =** interview + exploration done, Metis validates no gaps, Momus `[OKAY]`, `/start-work` invoked, `boulder.json` created tracking the active plan.

> **Format-recognition note (scope-bounded):** the input documentation-example spec is itself in oh-my-openagent's native plan format (its section layout — TL;DR → Context with a "Metis Review" subsection → Work Objectives → Verification Strategy → Execution Strategy waves → TODOs → Final Verification Wave — plus `quick/deep/unspecified-high/oracle` agent-profile vocabulary and `.sisyphus/evidence/...` paths are oh-my-openagent conventions, not a name coincidence). This is recorded only to explain **why the spec is a useful real-shaped example** for the docstring/AGENT.MD work — it is *not* used here to analyse the spec or recommend a runtime for it (that is out of corrected scope).

### §3.6 Atlas — what it is + how it works

**FOUND — the executor counterpart in the same repo.** (Disambiguated from unrelated systems: Salesforce Atlas reasoning engine, OpenAI ChatGPT Atlas browser, atlasagents.ai, China drone-swarm "Atlas" — none are this. Also: a separate Koii Network "Prometheus" exists and is NOT oh-my-openagent's.)
[VERIFIED via https://deepwiki.com/code-yeongyu/oh-my-opencode/4.3-atlas:-plan-executor + DeepWiki ask_question on code-yeongyu/oh-my-openagent]

- **Role:** master orchestrator/conductor; never writes code — delegates, coordinates, verifies. Reads `.sisyphus/plans/{name}.md`, parses **top-level** task checkboxes in `## TODOs` + `## Final Verification Wave` only (ignores nested AC/evidence checkboxes), tracks state in `boulder.json`.
- **Parallelism:** parallel-by-default — builds a dependency map, marks a task SEQUENTIAL only if it has a *named* dependency (input from another task or a shared file); everything else fans out as multiple `task(category=…)` calls in one response.
- **Verification gate per delegation:** 4 phases — (1) read every changed file, (2) automated checks (`lsp_diagnostics`/tests/build), (3) hands-on QA for user-facing changes, (4) gate decision (all-yes before marking done).
- **Error handling + autonomy:** resumes the *same* subagent session via `task_id` on failure (preserves context); failure counter <5 to prevent thrashing; cumulative learnings in `.sisyphus/notepads/{plan}/`. A 7-condition auto-continue hook re-injects "continue until all tasks complete" on `session.idle`; terminal stop = every top-level checkbox `[x]` AND every Final-Verification reviewer APPROVE. This is the documented "3+ hours autonomous" mechanism.

### §3.7 Prometheus + Atlas vs AIF Handoff — landscape (complement, not compete)

Confirmed across **7 DeepWiki phrasings** on `lee-to/aif-handoff` (sampling floor satisfied, T1). aif-handoff state machine: `backlog → planning → plan_ready → implementing → review → done → verified`. This is **landscape understanding** (do these tools complement or compete) — *not* a recommendation to run any spec on any of them.

- **A Prometheus-style external planner** plugs in *before* execution: aif-handoff exposes `POST /tasks/:id/events` with `event: "accept_existing_plan"` (and the `handoff_push_plan` MCP tool) that ingests an external plan file and transitions the task straight to `plan_ready`, **bypassing the internal `planning` stage.** [VERIFIED via DeepWiki + cross-verified against our own SSOT #44, which independently lists `handoff_push_plan`.]
- **An Atlas-style executor** maps to the `implementing` stage — but aif-handoff's own `implement-coordinator` already *is* Atlas-like: computes dependency layers and dispatches `implement-worker` subagents in parallel via `Promise.allSettled`, git-worktree-isolated (`AIF_TASK_WORKTREES_ENABLED=true`), capped by `COORDINATOR_MAX_CONCURRENT_TASKS` (default 3). [VERIFIED; corroborated by SSOT #30, #45.]
- **Landscape verdict:** complementary, not competing. aif-handoff's internal `plan-coordinator` *already does* Prometheus's job and its `implement-coordinator` *already does* Atlas's — so the two ecosystems overlap heavily in function. Where someone wanted both, two clean integration surfaces exist — **(A)** external plan → `handoff_push_plan` → internal aif-handoff execution; **(B)** full external session (`HANDOFF_TASK_ID` + MCP status sync) with aif-handoff as a thin kanban ledger.
- **Open (INCONCLUSIVE-needs-human):** plan-format compatibility — Prometheus emits `.sisyphus/plans/{name}.md`; aif-handoff `accept_existing_plan` reads its own plan format. A translation step is likely needed; the `plan-checker` rubric vs Momus's 4-criterion rubric is not documented deeply enough to confirm direct ingestion. Recorded as a §8.1(a) trigger predicate, not papered over.

### §3.8 AI SLOP vs normal docstring — definition, signals, side-by-side

**Definition** [VERIFIED via https://arxiv.org/html/2603.27249v1 — "An Endless Stream of AI Slop", 2026]: low-quality AI-generated content produced in quantity; properties = superficial competence, asymmetry of effort, mass producibility; explicitly pervades documentation.

**Cited signals** (each verifiable, not asserted-from-memory):
- "Comments answer *what?* instead of *why?*" [https://news.ycombinator.com/item?id=43929768]
- Tutorial-style redundancy / over-commenting from training-data bias [https://medium.com/according-to-context/llms-have-revived-these-5-anti-patterns-in-software-engineering-e685159fc4d8]
- ~1-in-5 LLM comments contain demonstrably inaccurate statements [https://arxiv.org/html/2408.14007v3]
- Sequential step-by-step commenting, verbose style, emoji/Unicode artifacts as AI-generation tells [arXiv:2603.27249]
- Generic summaries lacking purpose/usage/rationale/constraints; Args that restate type hints — distinct from "Completeness" on the DocAgent quality rubric (Helpfulness/Truthfulness require semantic judgement) [https://arxiv.org/html/2504.08725v1]

**Side-by-side (Python, abbreviated — full set in the §3.9 template):**

BAD (what-not-why + restate-type-hints):
```python
def merge_strategy(base: dict, ours: dict, theirs: dict, strategy: str = "ours") -> dict:
    """Merge strategy.
    Args:
        base (dict): The base dictionary.
        strategy (str): The strategy. Defaults to "ours".
    Returns:
        dict: The result dictionary.
    """
```
GOOD (contract, semantics, edge cases):
```python
def merge_strategy(base: dict, ours: dict, theirs: dict, strategy: str = "ours") -> dict:
    """Apply a three-way merge, resolving conflicts by the given strategy.

    Uses `base` as common ancestor. On key conflict: "ours"/"theirs" pick that
    side; "fail" raises MergeConflictError. Non-conflicting changes always merged.

    Args:
        strategy: One of "ours", "theirs", "fail". Defaults to "ours".
    Returns:
        Merged dict containing all non-conflicting changes from both sides.
    Raises:
        MergeConflictError: Only when strategy="fail" and conflicts exist;
            `.conflicting_keys` lists affected keys.
        ValueError: If strategy is not one of the three accepted values.
    """
```
Production GOOD references: LangChain `_parse_google_docstring` canonical form; anthropic-sdk-python `messages` docstring (behavioral semantics + JSON examples). [VERIFIED via DeepWiki on langchain-ai/langchain + anthropics/anthropic-sdk-python]

**Mechanical-detection boundary (load-bearing for enforcement-layer choice):** ruff `D`-rules (pydocstyle) + `DOC`-rules (pydoclint) enforce **structure only** — presence (D100–D107), format (D2xx/D3xx), first-line style (D400/D401 = a syntactic mood heuristic), and *name*-level argument alignment (D417 checks param names appear in `Args:`, **not** whether descriptions are meaningful). [VERIFIED via https://docs.astral.sh/ruff/rules/undocumented-param/ + Google Python Style Guide §3.8 https://google.github.io/styleguide/pyguide.html]. **Conclusion: a linter cannot catch semantic slop** (generic summary, type-restating Args, missing edge cases). Semantic quality needs instruction-level guidance or human/LLM review — which intersects the project's `no-paid-llm-in-ci` rule (no metered LLM in CI; semantic check rides as session-bound review, not a CI gate).

### §3.9 Ready-to-use AGENT.MD template

Full template shipped at [outputs/AGENT.md.template](../../../.claude/orchestrator-prompts/swarm-tools-research/outputs/AGENT.md.template) with maintainer-decision PLACEHOLDERS. Design is **evidence-based, not generic** (counters T-ST-D):

- **Size + structure:** target 100–150 lines + reference docs, not a monolith — the GitHub 2,500-repo study found this band the top performer (10–15% improvement); human-written beats generated by ~4% via "encoding info absent elsewhere." [https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/]
- **Standard:** AGENTS.md is the Linux-Foundation-stewarded cross-tool standard (no required fields, plain Markdown). **Claude Code does NOT read AGENTS.md natively** → template ships with the `ln -s AGENTS.md CLAUDE.md` (or `@AGENTS.md` import) bridge note. [https://agents.md/ + https://hivetrail.com/blog/agents-md-vs-claude-md-cross-tool-standard]
- **Reference-doc pattern:** ADAPTED from google/adk-python (AGENTS.md as dispatcher → `.agents/skills/.../SKILL.md` holds detailed rules). [https://raw.githubusercontent.com/google/adk-python/main/AGENTS.md]
- **Anti-SLOP wording — positive-framed, not negated:** naming "без AI SLOP" risks **priming** the failure mode — arXiv:2601.08070 ("Semantic Gravity Wells: Why Negative Constraints Backfire") found 87.5% of failures show a priming signature; positive reframing reduces target probability far more. So the template phrases the rule as **"each docstring states *why* / the contract / edge cases — not the type or the function name restated"** rather than "no slop." [https://arxiv.org/html/2601.08070]
- **Enforcement split:** lint (`ruff --select D,DOC`) for structure at pre-commit + CI last-resort gate (deterministic, no LLM, `no-paid-llm-in-ci`-compatible); instruction-level positive directive for semantics; optional session-bound review for deep quality. Mirrors the project's own multi-channel philosophy.
- **"Do/Don't pairing":** every "don't" carries a matching "do" (Augment Code finding: 30+ unmatched don'ts actively harm). [https://www.augmentcode.com/blog/how-to-write-good-agents-dot-md-files]

### §3.10 Community resources + Anthropic infrastructure findings (§4.1.6, each tagged)

| Item | Verification | Maturity / license | BFR-default verdict candidate |
|---|---|---|---|
| **C1 obra/superpowers** | VERIFIED (repo, MIT, active, in Anthropic CC marketplace since 2026-01-15) | High; cross-editor (CC/Codex/Gemini/Cursor/OpenCode/Copilot) | **REFERENCE** + ADOPT worktree/parallel-agent + plan-execute skill *patterns*; star-count claim (~200k) **discarded as low-confidence/likely inflated** — not load-bearing. Live caveat: issue #237 (subagents miss injected skill context). |
| **C2 Agent SDK monthly credit** | VERIFIED via official docs — **effective June 15, 2026 (not yet live)** | Policy, not a library; Max 20x = $200/mo credit for `claude -p` + Agent SDK | **REFERENCE.** Subscription-bundle (refreshes monthly), NOT metered API. **GitHub Actions uses `ANTHROPIC_API_KEY` = metered API ≠ subscription credit** → `@claude` in CI is a paid-LLM-in-CI pattern, stays DEFER under `no-paid-llm-in-ci`. Hard $200/mo budget caps any headless run. [https://support.claude.com + https://code.claude.com/docs/en/headless] |
| **C3 Opus/Sonnet "economy mode"** | "economy mode" = **NOT a named feature** (misnomer) | n/a | **ADOPT** real levers: `model:`/`effort:` subagent frontmatter, `CLAUDE_CODE_SUBAGENT_MODEL` env, `opusplan` alias; Opus→Sonnet is usage-throttle fallback. [https://code.claude.com/docs/en/sub-agents + /model-config] |
| **C4 skills for subagents** | VERIFIED; preloading ≠ auto-trigger | n/a | **ADOPT** `skills:` preload frontmatter for discipline-bearing subagents. **Design tension:** `disable-model-invocation: true` skills CANNOT be preloaded — affects our skill-context pattern. [https://code.claude.com/docs/en/skills] |
| **C5 community subagent/skill collections** | VERIFIED (VoltAgent awesome-* repos, MIT) | High volume, no Living-Documentation/enforcement entries found | **REFERENCE.** Confirms our core is genuine **BUILD** territory — no upstream covers Living-Documentation enforcement (corroborates SSOT #47/#48). |
| **C6 capability discovery** | VERIFIED — `https://code.claude.com/docs/llms.txt` is the canonical index | n/a | **ADOPT** as orchestrator startup capability-probe. |
| **C7 orchestrator autonomy in subscription** | PARTIAL (routines billing path unconfirmed) | n/a | **ADOPT** model-routing + effort control + worktrees; **DEFER** GH-Actions `@claude` (metered API, rule-incompatible). |

**SSOT gap flagged (NOT created here — kickoff §8):** `code-yeongyu/oh-my-openagent` (Prometheus/Atlas/Sisyphus swarm orchestrator) has **no SSOT entry** — only a one-line "different shape" mention under #46/#47. Given 1B establishes it as a named production swarm orchestrator in the landscape, a dedicated SSOT entry (next free id ≥ 50) is warranted. Recommend the research-tooling R-phase (SSOT owner) add it with a verdict; candidate = **REFERENCE** for our own project (rules-as-tests-aif is not adopting a swarm runtime).

## §8 Trigger conditions recorded (§4.3)

**§8.1 Full Swarm-readiness research session — ARMED, conditional. Fires when ANY:**
- (a) An integration spike confirms the §3.7 INCONCLUSIVE resolves negative — i.e. the Sisyphus `.md` → aif-handoff `accept_existing_plan` plan-format translation proves non-trivial in a concrete attempt.
- (b) A concrete spec arrives requiring autonomous swarm execution whose shape is **not** a Prometheus/Sisyphus plan (so 1B's tooling findings don't generalize to it).
- (c) The maintainer attempts swarm execution and logs **≥3 friction incidents within one quarter** tagged `#swarm-exec-friction` in research-patches/.
- Until a trigger fires, 1B tooling findings are sufficient; no separate Swarm-readiness session.

**§8.2 Phase 10 foundations audit — remains ARMED in open-questions.md §13.32, conditional. Sub-streams 1A+1B did NOT cover (any one firing warrants a targeted mini-audit, not the full 4–6-week R-phase by default):**
- A2 per-rule R1–R20 mechanism re-evaluation (1A/1B covered macro positioning only).
- A5 whole-stack external tooling re-eval (Stryker/ESLint/Vitest/dep-cruiser) — 1B covered AIF-family + oh-my-openagent + Superpowers + AGENTS.md tooling only.
- A6 full documentation-artefact audit (1B produced one AGENT.MD template for an external project).
- A1 architectural foundations beyond goal/positioning (e.g. 5-layer consistency).
- A3 deeper AI-agnostic boundary analysis (KEEP-NARROW held for `agents/*.md`).
- **Specific predicate to launch:** strategic-clarity (1A+1B) leaves a load-bearing foundations gap that lightweight dialogue cannot close — e.g. the maintainer adopts a swarm runtime as a standing dependency (oh-my-openagent / aif-handoff), which would pull A1/A3/A5 into scope.

## §9 Self-application (T15 mandatory — substantive, not syntactic)

**Did this research apply `build-first-reuse-default` to its own deliverables?**

- **AGENT.MD template (the one artifact 1B authored): YES, substantively.** Before drafting, the AGENT.MD subagent swept production AGENTS.md (apache/airflow, google/adk-python, zhanymkanov/fastapi-best-practices, langchain, minimaxir) + the agents.md standard + the GitHub 2,500-repo study + 5 arXiv papers. The template **ADOPTS** the AGENTS.md standard, **ADAPTS** adk-python's skills-reference dispatcher pattern, and **REFERENCES** Google Style Guide §3.8 + ruff `D,DOC` — it is not built from scratch. The anti-SLOP wording is grounded in arXiv:2601.08070 (negative-constraint priming), not in the maintainer's intuitive "без AI SLOP" phrasing — which the research actively flagged as a likely-counterproductive negation. Reuse-default applied, with citations (not `#adoption-shame`, not `#pattern-matching-on-name`).
- **Search-coverage (`phase-research-coverage` §1) on the negative-existence claims:** "Prometheus/Atlas don't resolve" was tested adversarially (counter-prompt assuming they exist, item 4) — and **surfaced that they DO exist** (oh-my-openagent), correcting a would-be false-negative. aif-handoff negative claims confirmed across ≥5 phrasings (item 5, floor satisfied). "No community Living-Documentation enforcement tool" (C5) corroborates existing SSOT #47/#48 BUILD verdicts via an independent sweep.
- **Honest gap:** the §3.7 plan-format-compatibility question is left INCONCLUSIVE rather than asserted — recorded as a §8.1(a) trigger, not papered over (counters T14 "clean = no theatre").
- **Scope self-application (T-ST-SCOPE, this rewrite):** the dominant self-application finding of this patch is the **scope correction itself** — the first version mistook the spec for an execution target because it pattern-matched the (corrupted) prompt instead of reasoning against it (T7). This patch removes the spec-execution sections and confines the spec to a documentation-example role, demonstrating the discipline catching its own prior failure mode. A document-vs-document review did not surface it; confirming intent did (a live "documents lie; tests don't" instance).

## §10 §1.7 forward + backward check (mandatory)

### §1.7 Forward-check — directly verifiable end-states if this patch's recommendations are applied

- File `docs/meta-factory/research-patches/2026-05-21-swarm-tools-research.md` exists with corrected-scope sections §1–§3, §8–§11 (this file); §4–§7 deliberately absent (scope-correction note).
- File `.claude/orchestrator-prompts/swarm-tools-research/outputs/AGENT.md.template` exists with maintainer-decision placeholders (docstring strictness / style-guide URL scope / anti-SLOP enforcement layer); MODERATE applied as the in-template default.
- The superseded mis-scoped patch is preserved (gitignored) at `outputs/_superseded-mis-scoped-patch-2026-05-21.md`; the former spec-execution working files were quarantined to gitignored `outputs/_out-of-1B-scope/` (with a README), no longer claimed as 1B deliverables.
- No edit to maintainer-owned artefacts (README.md, CLAUDE.md, session-bootstrap.md, `.claude/rules/*`, `packages/core/principles/*`, `prior-art-evaluations.md`) — Artifact Ownership Contract honored; the oh-my-openagent SSOT entry is *flagged* (§3.10) for the research-tooling owner, not written here.
- No PR opened; commit only on explicit maintainer approval (kickoff §5).

### §1.7 Backward-check — each finding traced to source evidence

- Prometheus/Atlas/Momus/Metis architecture → DeepWiki `code-yeongyu/oh-my-openagent` pages + `docs/guide/orchestration.md` (URLs in §3.5/§3.6).
- aif-handoff `accept_existing_plan` / `handoff_push_plan` bridge → DeepWiki (7 phrasings) **cross-verified against [prior-art-evaluations.md:112](../prior-art-evaluations.md) entry #44** which independently lists `handoff_push_plan` + `handoff_sync_status`; implement-coordinator parallel dispatch corroborated by [prior-art-evaluations.md:98](../prior-art-evaluations.md) #30 + [:113](../prior-art-evaluations.md) #45.
- aif-handoff "no cross-task blocking / no wave-gate / global model selection" negative claims → DeepWiki 6–7 phrasings (floor satisfied per `phase-research-coverage` §1 item 5).
- AGENT.MD prior-art + sizing → GitHub 2,500-repo study URL + agents.md + adk-python raw files (§3.9 URLs).
- AI-SLOP definition/signals/lint-boundary → arXiv:2603.27249, 2408.14007, 2504.08725, 2601.08070 + ruff D417 docs + Google Style Guide (§3.8 URLs).
- Agent-SDK credit June-15-2026 + GH-Actions=metered → support.claude.com + code.claude.com/docs/en/headless (§3.10).
- SSOT state (oh-my-openagent absent; highest id 49; aif-handoff #27–#46) → `grep` on [prior-art-evaluations.md](../prior-art-evaluations.md) at session time (§3.10).
- **Search-coverage on the load-bearing negative claim** ("no production swarm tool named Prometheus/Atlas") → adversarial counter-prompt run (item 4), which *overturned* the negative and found oh-my-openagent — the §1 checklist did its job.

## §11 Maintainer Q&A summary

Verdicts surfaced **for dialogue** (not auto-decided — reviewer/orchestrator discipline + T8):

1. **Tools deep-dive** — Prometheus/Atlas resolve to `code-yeongyu/oh-my-openagent` (FOUND, not fabricated); complementary to aif-handoff at the landscape level (§3.7); ecosystem reuse verdicts in §3.10 (REFERENCE superpowers + community collections; ADOPT subagent model levers + skills-preload + `llms.txt` probe; DEFER GH-Actions `@claude` as metered-API). No swarm runtime is adopted into rules-as-tests-aif.
2. **AGENT.MD template choices** — **docstring strictness = MODERATE** applied in the template. Style-guide URL scope (single Google URL) + enforcement layer (instruction + pre-commit ruff `D,DOC` + CI last-resort gate) left at the template's evidence-based defaults; the two remaining placeholders are maintainer-overridable later. Semantic slop is explicitly out of linter reach (§3.8) — caught by instruction + session-bound review, never a metered CI gate.
3. **Trigger conditions** — Swarm-readiness ARMED with predicates §8.1(a–c); Phase 10 ARMED with sub-stream predicates §8.2. Thresholds recorded as-is.
4. **Out of 1B scope (scope correction 2026-05-21):** any execution approach / runtime choice / defect analysis for the input spec is NOT decided here — the spec is a documentation example. If the spec needs executing, that is a separate, properly-scoped session. (The former spec-execution working notes survive, gitignored, in `outputs/_out-of-1B-scope/` for the target project's own use.)

(No 1A meta-decision was re-opened; companion-positioning + BFR-default + Wave-10-CORE taken as settled inputs — T-ST-E honored.)
