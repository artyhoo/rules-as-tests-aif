# AI Documentation & Context-Hygiene Audit — design spec

> **Status:** design approved 2026-06-04 (brainstorming). Awaiting writing-plans.
> **Authoritative for:** the `ai-doc-audit` umbrella — **ONE mega-umbrella, one task**: 3 progressively-widening cycles, each = **R (research the target) → Audit (conformance + fix-plan) → I (implement) → Verify (check the work)**. Its goal, spine criterion, stage decomposition, per-artefact classification axes, doc-skill BFR verdict, and self-application obligation.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## Why this exists

The project enforces conventions by front-loading them: **11 `.claude/rules/*.md` (~151 KB), ~9 inlined always-on every session**, plus **13 hooks** injecting on each prompt/turn. This is the exact failure the maintainer named — rules/MCP/skills polluting context where they are not needed — and it reproduces live: most of those rules sit in this very session's context unused.

This audit checks **all project documentation + the Claude Code configuration surface** against three external standards that converge on one criterion. It is **one mega-umbrella, one task**, run as **3 progressively-widening cycles**. Each cycle re-runs the full phase sequence — **R → Audit → I → Verify** — on a wider surface, then re-checks the prior cycle's fixes held. Fixes are **not** deferred to separate umbrellas; every phase is a stage of this one umbrella.

## Spine criterion (triple-validated)

**One artefact = one channel. Always-on context is NOT an enforcement mechanism.**

| If an artefact has… | → Channel | Source of criterion |
|---|---|---|
| a script gate (hook / principle-test / regex) | enforcement is the **script**; prose → **on-demand** (Skill / path-scoped inject) | AIF `security-scan.py`/`audit.sh`; Superpowers «automate it»; Anthropic |
| pure behavioural discipline, only channel = being in context (Class C, no script) | **compressed digest + pointer** always-on, not the verbatim wall | `inject-session-bootstrap` pattern |
| reference / catalogue / history (long) | **progressive disclosure** — separate file, loaded by reference | Anthropic official |
| project-specific convention | CLAUDE.md (not a standalone always-on rule) | Superpowers `writing-skills` |

**Falsifier:** the criterion is wrong if a rule exists whose bypass the script does **not** catch but the always-on prose **does** — then the prose carries enforcement and may not be compressed. Each of the 11 rules is checked against this.

### Presumption (load-bearing — guards against over-migration / T16)

This project's goal is the **inverse** of Superpowers/AIF's (which are general dev-assistants): here «AI cannot *silently* bypass a rule» ([README.md#why-this-exists](../../../README.md#why-this-exists)). So some prose carries a **second function beyond enforcement — it shapes the agent's reasoning *in the moment*** (e.g. `ai-laziness-traps`, H1 recommendation-discipline). On-demand prose does NOT fire unless the agent *thinks* to load it — and laziness means it won't. Therefore:

- **Default presumption: behavioural-shaping prose STAYS always-on (compressed), not on-demand.** Burden of proof is on *moving it off*, not on keeping it.
- `MOVE-ON-DEMAND` is justified **only** when the prose merely duplicates a script gate (reference/enforcement-dup), not when its channel is in-context presence at decision time.
- Blindly copying Superpowers' on-demand model here is `#pattern-matching-on-name` (T16, [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md)) — upstream's problem-class ≠ ours. Each migration verdict states «upstream problem-class X vs ours Y; match? evidence».

### Evidence base (do not re-derive without re-checking)

- **AIF (`lee-to/ai-factory`, DeepWiki 2026-06-04):** skills load **on-demand** by invocation; «rules» live inside SKILL.md or a thin `AGENTS.md`; context files (`DESCRIPTION.md`, `patches/`) read on demand. Enforcement = scripts (`security-scan.py` regex, `audit.sh` grep, `verify` build/test/lint), **not** context injection. AI-agnosticism via `AGENT_REGISTRY` + `{{config_dir}}/{{skills_dir}}` template-vars + `universal` fallback + `agentskills.io` spec.
- **Superpowers `writing-skills/SKILL.md` (local cache):** «Mechanical constraints (if it's enforceable with regex/validation, **automate it — save documentation for judgment calls**). Project-specific conventions (put in CLAUDE.md).» Bundles `anthropic-best-practices.md` (progressive disclosure). Skills are on-demand via the Skill tool; only `using-superpowers` is injected at SessionStart.
- **Anthropic official** ([Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills); [skill-authoring patterns](https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics); [context engineering](https://01.me/en/2025/12/context-engineering-from-claude/)): **progressive disclosure** (small SKILL.md, referenced files loaded only as needed); descriptions third-person + «pushy» + ≤1024 chars; explain the *reason* behind a rule; code is either an executable tool or reference — mark which.

## Decomposition — 3 cycles × (R → Audit → I → Verify), progressively widening

Whole surface, decomposed to preserve quality and avoid `#focus-tunnel` / T-series traps. **Each phase is its own session.** Scope widens each cycle; the I-phase runs before the next cycle's R/Audit so the wider cycle operates on a cleaned base, and each cycle's Verify re-checks the prior cycle did not regress.

### The four phases (re-run every cycle)

| Phase | Project term | Does | Deliverable | Discipline |
|---|---|---|---|---|
| **R** | R-phase (research) | Establish **«how it should be»** — the target standard for this cycle's surface (AIF / Superpowers / Anthropic / 2H-2026). No source edits (T5). | research-patch under `docs/meta-factory/research-patches/` | search-coverage 6-item checklist; cite SSOT by ID |
| **Audit** | conformance check | Measure this cycle's surface **against R's target**; classify each artefact; decide **«how to fix»**. No source edits. | verdict table + ordered fix-list | T1/T9/T10 sampling-floor + population-enumeration |
| **I** | I-phase (implement) | Apply the fix-list. Atomic commits; capability-commit gate where it applies. | PR(s) of edits | atomic-umbrella; no scope creep |
| **Verify** | own QA + regression | Cold-review the diff (T19, own-QA-before-handoff); confirm spine-criterion falsifier did not fire; **re-check prior cycles' fixes held**. | verify note / cold-review verdict | CI ≠ design review |

### Cycle 0 — prerequisite: the doc-authoring skill (thin wrapper)

Built **first**, right after R1 establishes the target, **before** C1-Audit — so every later Audit + I phase *consumes it* as the binding «how to write/fix an AI doc» standard rather than re-deriving it. It is a **thin project wrapper that composes existing skills, not a fork**:

- **base:** Superpowers `writing-skills` (TDD-for-docs + bundled `anthropic-best-practices.md` + progressive disclosure) — invoked, not copied.
- **+ AIF layer:** `AGENT_REGISTRY` + `{{config_dir}}/{{skills_dir}}` template-vars + `universal` fallback (the portability `writing-skills` lacks).
- **+ project lens:** `rules-as-tests` Class A/B/C + doc-authority header spec + the spine criterion.

Reuse-maximal (CLAUDE.md build-vs-reuse + [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md)): the wrapper *references* upstream skills and adds only the residue they don't cover. Verdict + scope are produced by R1/C1-Audit; this prerequisite is where it is built.

**Keep Cycle 0 minimal-first.** `writing-skills` mandates TDD-with-subagents for a *new* skill; a full build before the audit even starts can balloon and delay it. Ship the thinnest viable wrapper (invoke upstream + the override residue), grow it on evidence from the cycles — do not gold-plate it up front.

**Standing asset, not one-shot.** The audit cleans the baseline once; this skill is the on-demand standard every *future* doc edit consumes, so documentation stays in order rather than drifting back to always-on bloat. To make «in order» enforced rather than aspirational, it is paired with a lightweight **standing drift-guard** (a deterministic check — e.g. always-on context-budget ceiling, or «rule prose duplicates a script gate» grep — per [dual-implementation-discipline.md §5](../../../.claude/rules/dual-implementation-discipline.md), no paid LLM per [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)). Designing that guard is itself a verdict the audit produces; building it lands in a fix phase. This is what keeps the cleaned surface from re-bloating after the umbrella closes.

### The three cycles (R-target + Audit-surface widen each round)

| Cycle | Surface (Audit + I + Verify operate on) | R-phase target focus |
|---|---|---|
| **C1** | CC-config: `.claude/rules/*` (×11), `.claude/hooks/*` (×13), `.claude/skills/*` (×7), `agents/*` (×5), `.claude/settings.json` + root docs (README, CLAUDE.md, INSTALL.md, INSTALL-FOR-AI.md, `.claude/session-bootstrap.md`) | Context-hygiene + AI-agnosticism for **always-on + shipped** surface. **R1 substantially pre-done this session** → the spine criterion above + doc-skill BFR verdict. |
| **C2** | **C1 surface (regression) +** `docs/meta-factory/*` (EXECUTION-PLAN, open/closed-questions, research-patches, retros) | Doc-authority + drift/duplication standard for large prose corpus. |
| **C3** | **C1+C2 surface (regression) +** `packages/*` (principle-tests, templates, preset) + final roll-up | Standard for executable artefacts + shipped templates; consolidate. C3-I closes the umbrella (`done.md`). |

**Audit-phase output** = per-artefact verdict table `KEEP-ALWAYS-ON / COMPRESS-TO-DIGEST / MOVE-ON-DEMAND / MAKE-PORTABLE` + ordered fix-list. C1-Audit additionally carries the doc-skill BFR verdict (below); C1-I builds it.

**Gate between phases:** R's research-patch is the binding target for that cycle's Audit; the Audit's fix-list is the binding scope for that cycle's I; Verify must pass before the next cycle's R begins.

## Per-artefact classification — 4 axes

1. **Context-cost** — token weight (`wc -c`, measured — baseline 151 558 B across the 11 rules) × a **discrete** relevance bucket (`every-turn` / `by-trigger` / `rare`), classified from hook wiring + a grep over the last N session transcripts for actual citation/fire count. No fabricated continuous «frequency %» (T6).
2. **Enforcement-channel** — does a script gate exist; does always-on prose duplicate the script.
3. **AI-agnosticism** — portable (AIF registry / template-vars) or CC-hardcoded; does it degrade gracefully without the harness. **`MAKE-PORTABLE` requires a cited real consumer need** — if no non-CC consumer exists today, portability work is `#integration-overhead-overestimate` (build-ahead-of-need); record as DEFER-with-trigger, not an active fix.
4. **Standard-conformance** — against AIF / Superpowers / Anthropic / 2H-2026 practice; what drifted.

## Doc-skill — BFR verdict (verdict in C1-Audit; built in C1-I)

**Verdict: ADOPT Superpowers `writing-skills` as the authoring base (it already bundles Anthropic's official guidance + progressive disclosure + the exact «automate vs document» boundary) + ADAPT an AI-agnostic layer from AIF (`AGENT_REGISTRY` + template-vars + `universal` fallback) + our `rules-as-tests` Class A/B/C lens.** Result = a thin project override/wrapper referencing upstream, **not** a fork.

- Rationale: duplicating `writing-skills` = `#parallel-evolution-creep` ([build-first-reuse-default.md §4](../../../.claude/rules/build-first-reuse-default.md)).
- Gap it fills: `writing-skills` lacks registry-driven portability and our Class lens.
- Falsifier: wrong if a closer read of `writing-skills` shows it is project-specific or already covers agnosticism → then ADAPT/BUILD. (Read 2026-06-04 — covers authoring; agnosticism only partial.)

## Success criteria (numeric exit — prevents «declare victory anywhere», T4/T14)

The umbrella is done only when, measured before/after:

- **Net always-on context ↓** — total bytes of always-on-injected rule/doc prose strictly lower than the 151 558 B baseline (target set per-cycle in C1-Audit; the cure must not out-bloat the disease — new doc-skill + drift-guard + spec count *against* the budget).
- **Zero script-gate weakened** — every existing hook / principle-test gate still fires on the same bypass it caught before (the spine falsifier, re-run each Verify).
- **Every behavioural-shaping rule still reaches the agent** at its decision point (always-on-compressed or path-scoped-injected — never silently dropped).

If net context did not drop OR any gate weakened → the cycle failed Verify, regardless of how clean the verdict table looks.

## Recursive self-application (project invariant #2)

The audit MUST audit itself: this spec and the umbrella kickoffs themselves follow the spine criterion — concise always-on surface, details loaded on demand — else `#recursive-self-application-gap` ([phase-research-coverage.md §4](../../../.claude/rules/phase-research-coverage.md)). Each stage includes a §self-application finding.

## Out of scope

- Runtime-generated consumer docs (deferred L3 per [closed-questions.md §13.21](../../meta-factory/closed-questions.md)).
- Changing the project goal or enforcement model (maintainer-owned, README). A fix may **compress/relocate** a rule's prose but may not weaken what its script gate enforces — that is the spine criterion's falsifier, checked per fix.

## Open questions for writing-plans

- Wiring the cycles into the project's `.claude/orchestrator-prompts/<umbrella>/kickoff.md` machinery — one kickoff with R/Audit/I/Verify stage-gates per cycle vs. a plain dispatched session per phase.
- Whether C1-Audit's context-cost measurement needs a reusable helper script (capability-commit gate applies if ≥50–80 LOC).
- Gate policy between cycles: does the next cycle's R/Audit block on the predecessor cycle's I-phase PR merge, or run on the branch ahead of merge.
- Whether C2/C3 R-phases are full re-research or thin deltas over R1's target (likely deltas — the spine criterion is surface-agnostic).
