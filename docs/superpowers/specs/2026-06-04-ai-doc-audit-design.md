# AI Documentation & Context-Hygiene Audit — design spec

> **Status:** design approved 2026-06-04 (brainstorming). Awaiting writing-plans.
> **Authoritative for:** the `ai-doc-audit` umbrella — **ONE mega-umbrella, one task**: 3 progressively-widening audit→fix cycles. Its goal, spine criterion, stage decomposition, per-artefact classification axes, doc-skill BFR verdict, and self-application obligation.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## Why this exists

The project enforces conventions by front-loading them: **11 `.claude/rules/*.md` (~151 KB), ~9 inlined always-on every session**, plus **13 hooks** injecting on each prompt/turn. This is the exact failure the maintainer named — rules/MCP/skills polluting context where they are not needed — and it reproduces live: most of those rules sit in this very session's context unused.

This audit checks **all project documentation + the Claude Code configuration surface** against three external standards that converge on one criterion. It is **one mega-umbrella, one task**, run as **3 progressively-widening audit→fix cycles**: each audit produces verdicts, the paired fix applies them, and the next (wider) audit runs on the cleaned base and re-checks the prior fix held. Fixes are **not** deferred to separate umbrellas — they are interleaved stages of this umbrella.

## Spine criterion (triple-validated)

**One artefact = one channel. Always-on context is NOT an enforcement mechanism.**

| If an artefact has… | → Channel | Source of criterion |
|---|---|---|
| a script gate (hook / principle-test / regex) | enforcement is the **script**; prose → **on-demand** (Skill / path-scoped inject) | AIF `security-scan.py`/`audit.sh`; Superpowers «automate it»; Anthropic |
| pure behavioural discipline, only channel = being in context (Class C, no script) | **compressed digest + pointer** always-on, not the verbatim wall | `inject-session-bootstrap` pattern |
| reference / catalogue / history (long) | **progressive disclosure** — separate file, loaded by reference | Anthropic official |
| project-specific convention | CLAUDE.md (not a standalone always-on rule) | Superpowers `writing-skills` |

**Falsifier:** the criterion is wrong if a rule exists whose bypass the script does **not** catch but the always-on prose **does** — then the prose carries enforcement and may not be compressed. Each of the 11 rules is checked against this.

### Evidence base (do not re-derive without re-checking)

- **AIF (`lee-to/ai-factory`, DeepWiki 2026-06-04):** skills load **on-demand** by invocation; «rules» live inside SKILL.md or a thin `AGENTS.md`; context files (`DESCRIPTION.md`, `patches/`) read on demand. Enforcement = scripts (`security-scan.py` regex, `audit.sh` grep, `verify` build/test/lint), **not** context injection. AI-agnosticism via `AGENT_REGISTRY` + `{{config_dir}}/{{skills_dir}}` template-vars + `universal` fallback + `agentskills.io` spec.
- **Superpowers `writing-skills/SKILL.md` (local cache):** «Mechanical constraints (if it's enforceable with regex/validation, **automate it — save documentation for judgment calls**). Project-specific conventions (put in CLAUDE.md).» Bundles `anthropic-best-practices.md` (progressive disclosure). Skills are on-demand via the Skill tool; only `using-superpowers` is injected at SessionStart.
- **Anthropic official** ([Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills); [skill-authoring patterns](https://generativeprogrammer.com/p/skill-authoring-patterns-from-anthropics); [context engineering](https://01.me/en/2025/12/context-engineering-from-claude/)): **progressive disclosure** (small SKILL.md, referenced files loaded only as needed); descriptions third-person + «pushy» + ≤1024 chars; explain the *reason* behind a rule; code is either an executable tool or reference — mark which.

## Decomposition — 3 audit→fix cycles, progressively widening (separate session each)

Whole surface, decomposed to preserve quality and avoid `#focus-tunnel` / T-series traps. Each stage is its own session. Scope widens each cycle; each fix runs before the next audit so the wider audit operates on a cleaned base **and** re-verifies the prior fix did not regress.

| Stage | Kind | Surface | Rationale |
|---|---|---|---|
| **A1** | audit | CC-config: `.claude/rules/*` (×11), `.claude/hooks/*` (×13), `.claude/skills/*` (×7), `agents/*` (×5), `.claude/settings.json` + root docs: README, CLAUDE.md, INSTALL.md, INSTALL-FOR-AI.md, `.claude/session-bootstrap.md` | Sharpest signal — exactly what is **always-on (eats context)** + **shipped to consumers**. |
| **F1** | fix | apply A1 verdicts (incl. doc-skill build) | Clean the highest-cost surface first. |
| **A2** | audit | **A1 surface (regression re-check) +** `docs/meta-factory/*` — EXECUTION-PLAN, open/closed-questions, research-patches, retros | Wider; large prose volume, drift + duplication. |
| **F2** | fix | apply A2 verdicts | — |
| **A3** | audit | **everything: A1+A2 surface (regression) +** `packages/*` — principle-tests, templates, preset | Full sweep; final roll-up consolidates all verdicts. |
| **F3** | fix | apply A3 verdicts + close-out | Umbrella `done.md`. |

Each **audit** stage output:
- Per-artefact verdict table: `KEEP-ALWAYS-ON / COMPRESS-TO-DIGEST / MOVE-ON-DEMAND / MAKE-PORTABLE`.
- Ordered fix-list for the paired fix stage.
- A1 additionally: the doc-skill BFR verdict (below).

Each **fix** stage applies its audit's verdicts (atomic commits, capability-commit gate where it applies), then a cold-review before the next audit.

## Per-artefact classification — 4 axes

1. **Context-cost** — tokens/turn × relevance-frequency. **Measured**, not eyeballed (`wc -c`, injection-frequency from hook wiring).
2. **Enforcement-channel** — does a script gate exist; does always-on prose duplicate the script.
3. **AI-agnosticism** — portable (AIF registry / template-vars) or CC-hardcoded; does it degrade gracefully without the harness.
4. **Standard-conformance** — against AIF / Superpowers / Anthropic / 2H-2026 practice; what drifted.

## Doc-skill — BFR verdict (verdict produced in A1; built in F1)

**Verdict: ADOPT Superpowers `writing-skills` as the authoring base (it already bundles Anthropic's official guidance + progressive disclosure + the exact «automate vs document» boundary) + ADAPT an AI-agnostic layer from AIF (`AGENT_REGISTRY` + template-vars + `universal` fallback) + our `rules-as-tests` Class A/B/C lens.** Result = a thin project override/wrapper referencing upstream, **not** a fork.

- Rationale: duplicating `writing-skills` = `#parallel-evolution-creep` ([build-first-reuse-default.md §4](../../../.claude/rules/build-first-reuse-default.md)).
- Gap it fills: `writing-skills` lacks registry-driven portability and our Class lens.
- Falsifier: wrong if a closer read of `writing-skills` shows it is project-specific or already covers agnosticism → then ADAPT/BUILD. (Read 2026-06-04 — covers authoring; agnosticism only partial.)

## Recursive self-application (project invariant #2)

The audit MUST audit itself: this spec and the umbrella kickoffs themselves follow the spine criterion — concise always-on surface, details loaded on demand — else `#recursive-self-application-gap` ([phase-research-coverage.md §4](../../../.claude/rules/phase-research-coverage.md)). Each stage includes a §self-application finding.

## Out of scope

- Runtime-generated consumer docs (deferred L3 per [closed-questions.md §13.21](../../meta-factory/closed-questions.md)).
- Changing the project goal or enforcement model (maintainer-owned, README). A fix may **compress/relocate** a rule's prose but may not weaken what its script gate enforces — that is the spine criterion's falsifier, checked per fix.

## Open questions for writing-plans

- Wiring the 6 stages into the project's `.claude/orchestrator-prompts/<umbrella>/kickoff.md` machinery (one kickoff with 6 stage-gates) vs. running each as a plain dispatched session.
- Whether A1's context-cost measurement needs a reusable helper script (capability-commit gate applies if ≥50–80 LOC).
- Gate policy between cycles: does a wider audit (A2/A3) block on its predecessor fix's PR merge, or run in parallel on the branch.
