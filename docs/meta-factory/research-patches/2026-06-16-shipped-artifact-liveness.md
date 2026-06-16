<!-- scope:shipped-artifact-liveness-gap -->
# Shipped-artifact liveness gap — does the framework liveness-test its OWN shipped agents/capabilities? (root cause of #551)

> **Date:** 2026-06-16
> **Slug:** shipped-artifact-liveness-gap
> **Type:** R-phase (research / survey / verdict) — no code, no schema change. Research only.
> **Umbrella:** `.ai-factory/plans/shipped-artifact-liveness-gap.md`. **Related:** #550 (post-install functional acceptance), #551 (the incident), #552 (prober shipping).
> **Park status:** the load-bearing verdict (gate vs probe vs both — §5) is **PARKED as DECISION-NEEDED** for the maintainer per the umbrella's autonomous-dispatch park contract + [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md). A reasoned recommendation is given (§5.1); the commitment is the maintainer's call.

---

## §0 The gap (root cause, not symptom)

#551 happened because the framework **validated its own anti-hallucination sub-agents by prose audit** — prior audits called `agents/*.md` "cross-provider-safe" and "minimal and accurate" — but **never dispatched them**. The project's own thesis — «documents lie; tests don't; every rule is an executable artifact» ([README.md#why-this-exists](../../../README.md)) — was applied bottom-up to *consumer* code (R1–R20, IR1–IR6, principles 01–N) but **not top-down to the framework's own shipped delivery artefacts** (the `agents/*.md` sub-agents, skills, hooks). This is `#recursive-self-application-gap` ([phase-research-coverage.md §4](../../../.claude/rules/phase-research-coverage.md)) at the delivery layer.

**Concrete, mechanically verified failure (not prose):** every shipped agent declares a `tools:` frontmatter using **non–Claude-Code tool names**:

```text
$ grep -rnE "^tools:" agents/*.md
agents/compliance-verifier.md:4:tools: read_file, list_files
agents/living-docs-auditor.md:4:tools: read_file, list_files, run_command
agents/manual-rule-liveness-prober.md:4:tools: read_file, list_files
agents/memory-codification-auditor.md:4:tools: read_file, list_files
agents/orchestrator-worker-discipline.md:4:tools: read_file
agents/review-sidecar.md:4:tools: read_file, list_files
```

`read_file` / `list_files` / `run_command` are **not** Claude Code canonical tool names. The CC allow-list (verified against [`code.claude.com/docs/en/tools-reference`](https://code.claude.com/docs/en/tools-reference), 2026-06-16; DeepWiki unavailable in this env — WebFetch on the authoritative doc substituted, see §6) is: `Agent, AskUserQuestion, Bash, Cron{Create,Delete,List}, Edit, Enter/ExitPlanMode, Enter/ExitWorktree, Glob, Grep, ListMcpResourcesTool, LSP, Monitor, NotebookEdit, PowerShell, PushNotification, Read, ReadMcpResourceTool, RemoteTrigger, ScheduleWakeup, SendMessage, ShareOnboardingGuide, Skill, Task{Create,Get,List,Output,Stop,Update}, Team{Create,Delete}, TodoWrite, ToolSearch, WaitForMcpServers, WebFetch, WebSearch, Workflow, Write` + the `mcp__<server>__<tool>` pattern.

Per the same doc's **Agent tool behavior** section: «**`tools` only**: the subagent gets only the listed tools.» So an agent dispatched via CC's `Agent`/Task tool with `tools: read_file, list_files` resolves to **zero usable tools** — it cannot `Read`, cannot `Glob`, cannot `Bash`. With no way to inspect the repo, a read-only "auditor / verifier / prober" agent has only one path left: **fabricate findings from training-data / context recall.** That is #551's exact mechanism, and it is structurally invisible to the current test suite (`npm test --workspaces`): no principle test, hook, or script parses `agents/*.md` `tools:` (verified — `grep -rln agents/ packages/core/principles/*.ts` returns only doc-authority/documents-lie/BFR references, none validating tool-names).

**The meta-irony (load-bearing for the verdict):** the surface most damaged by this is `agents/manual-rule-liveness-prober.md` — the agent #552 shipped *to prove liveness*. The liveness prober **itself** declares `tools: read_file, list_files` and would therefore fabricate its own RED→GREEN report on CC dispatch. The framework's liveness tooling is not itself liveness-tested.

---

## §1 Scope of "shipped capability" (population enumeration — T10 before any verdict)

What ships into a consumer via `install.sh` and could be «present / registers / silently does nothing»:

| Surface | Count / locus | Liveness today | "Looks fine, does nothing" failure |
|---|---|---|---|
| Sub-agents `agents/*.md` | 6 (enumerated §0) | **none** — prose audit only | invalid `tools:` → no tools → fabricates (#551) |
| Manifest rules `rules-manifest.json` | 26 (R1–R20, IR1–IR6) | **partial** — see §2 | rule present but never fires on a real violation |
| Skills `.claude/skills/*/SKILL.md` (+ shipped `skill-context/*`) | many | structural only | `allowed-tools` invalid / skill never triggers |
| Hooks `.claude/hooks/*.sh` | 4+ | `§1.8` smoke-test (manual, per-touch) | hook leaks past its path-filter / exits wrong |
| Mutation gate / principle tests | `packages/core/principles/*` | self-testing (green) | green while the artefact it guards is dead |

This patch's primary surface is **row 1 (sub-agents)** — the #551 locus — with the mechanism generalised to skills/hooks where it transfers.

---

## §2 Own-stack sweep — the framework already has a liveness lineage (it just doesn't cover the agents)

Per [phase-research-coverage.md §1.1](../../../.claude/rules/phase-research-coverage.md) (own-stack sweep is the dominant blind-spot), the most important prior art is **internal**:

- **guard-liveness umbrella** — SSOT [#114](../prior-art-evaluations.md) (change-scoped ESLint guard-liveness gate, negative-test roundtrip at pre-push) and [#115](../prior-art-evaluations.md) (manual-rule liveness prober). Design root: [`2026-05-23-guard-liveness-gate.md`](2026-05-23-guard-liveness-gate.md); distribution audit: [`2026-06-10-guard-liveness-v0-audit.md`](2026-06-10-guard-liveness-v0-audit.md). Sub-waves v1 (ESLint), v1.5 (command/script), v3 (manual).
- **Two-channel liveness pattern, already established in-repo** ([manual-rule-liveness-prober.md §Self-application](../../../agents/manual-rule-liveness-prober.md)):
  - **(a) Structural gate** = principle 02's mechanical CI check (rule *has* a well-formed pressure-scenario). Form. Always-reachable. RED when the field is missing.
  - **(b) Behavioural probe** = session-bound RED→GREEN dispatch (fresh agent fails without the rule, complies with it). Behaviour. Operator-run, never CI (no-paid-LLM).
- **Principle 02 + manual-rule-liveness-prober** = the project's *own answer* to "structure is the floor; behaviour is the proof" — but scoped to **manifest rules**, not to the **agents that do the probing**.

**The gap restated against own-stack:** the guard-liveness lineage proves *consumer rules* are live. It has **no analog for the framework's own shipped agents/skills/hooks.** The #551 agents fall in the blind spot between «principle 09 checks their doc-authority header» and «principle 02 checks manifest rules» — nothing checks that an agent can actually use a tool.

---

## §3 External survey (BFR-default — WebSearch ≥3 phrasings; DeepWiki substituted, §6)

Five phrasings run (§6 lists queries). Findings, mapped to the two candidate channels:

**Deterministic tool-call assertion (→ favours the GATE / cheap channel; no-paid-LLM-friendly):**
- **DeepEval "Tool Correctness"** — explicitly a **deterministic** metric, *not* an LLM-judge: verifies all required tools were correctly called. ([confident-ai.com](https://www.confident-ai.com/blog/llm-agent-evaluation-complete-guide), [deepeval.com](https://deepeval.com/guides/guides-ai-agent-evaluation))
- **promptfoo** — house guidance is **deterministic assertions first** (`contains`, `is-json`, `javascript`) before `llm-rubric`; `tool-call-f1` compares called-vs-expected tool sets; `trajectory:tool-used` / `skill-used` assert invocation. Deterministic checks are "fast, free, reproducible." ([promptfoo.dev/deterministic](https://www.promptfoo.dev/docs/configuration/expected-outputs/deterministic/), [test-agent-skills](https://www.promptfoo.dev/docs/guides/test-agent-skills/))
- **CC subagent tool-schema is a known real failure class:** issues [#52055](https://github.com/anthropics/claude-code/issues/52055) (custom plugin subagents never receive Grep/Glob in their tool schema), [#18837](https://github.com/anthropics/claude-code/issues/18837) (`allowed-tools` in skill frontmatter not enforced), [#8697](https://github.com/anthropics/claude-code/issues/8697). Invalid/missing subagent tool names are not hypothetical — upstream tracks them.

**Behavioural / trajectory liveness (→ favours the PROBE / dispatch channel):**
- **Trajectory evals with hard pass/fail assertions on tool selection** — LangSmith/LangChain, TRAJECT-Bench, DeepEval reasoning/action/execution decomposition. ([docs.langchain.com/langsmith/trajectory-evals](https://docs.langchain.com/langsmith/trajectory-evals), [arxiv 2510.04550](https://arxiv.org/pdf/2510.04550))
- **Smoke test that proves an agent "can actually do the things claimed"** — end-to-end: creates files, runs commands, produces a report. ([Block Engineering "Testing Pyramid for AI Agents"](https://engineering.block.xyz/blog/testing-pyramid-for-ai-agents))
- **Canary vs smoke** — smoke = fast "does the artifact even work" gate run post-deploy on synthetic traffic; maps directly to a **post-install** liveness probe (ties to #550). ([getunleash.io](https://www.getunleash.io/blog/canary-release-vs-smoke-test))
- Already registered in-repo: SSOT [#53](../prior-art-evaluations.md) — promptfoo + Inspect (`UKGovernmentBEIS/inspect_ai`) + METR transcript-analysis as the behavioural-eval prior art for «did an intervention change agent behaviour», session-bound deterministic.

**Net:** the literature converges on the project's *own* two-channel split — **deterministic tool-call checks first (cheap, free, CI-able), trajectory/dispatch behaviour second (heavier, session-bound).** Nothing surfaced that makes a single channel dominant; they are explicitly complementary (deterministic-first *then* trajectory).

---

## §4 Two candidate mechanisms (fully specified; NOT pre-decided — that is §5)

### M1 — GATE: `tools:`-name allow-list check on shipped agents/skills (cheap, deterministic)

- **What:** a deterministic check (pre-push section + companion principle test `packages/core/principles/<N>-shipped-agent-tools-valid.test.ts`) that parses every `agents/*.md` `tools:` and every shipped skill `allowed-tools`, and asserts each entry ∈ {CC canonical allow-list (§0)} ∪ `/^mcp__[^_]+__/`.
- **Catches #551 exactly:** run today → all 6 agents FAIL (`read_file`/`list_files`/`run_command` ∉ allow-list). Zero false-negatives for the incident.
- **Channel:** earliest-reachable per [rule-enforcement-channel-selection.md §3](../../../.claude/rules/rule-enforcement-channel-selection.md) — mechanically detectable → **gate**, at edit-time/pre-push (CI last resort). Deterministic, no LLM, no-paid-LLM-clean.
- **Cost:** ~30–60 LOC. Capability-commit (≥50 LOC under `packages/`) → needs SSOT entry + `Prior-art:` trailer when built.
- **Open tension (load-bearing — feeds §5):** the gate is **CC-specific**, but the 6 agents deliberately use generic names (`read_file`…) for **AI-agnosticism** (each agent's body says "Claude Code, Cursor, Codex, Aider…"). A naïve CC-name gate would flag all 6 agnostic agents as "broken." Resolution is itself a sub-fork:
  - **(i)** treat `tools:` frontmatter as a **CC-runtime contract** (it *is* — only CC's Agent tool reads it) that must use CC names, while the agnostic *prose body* stays harness-neutral; or
  - **(ii)** ship a **name-mapping** (`read_file→Read`, `list_files→Glob`, `run_command→Bash`) so one source serves multiple harnesses; or
  - **(iii)** conclude these agents are **not meant for CC Task-dispatch at all** (read-by-human prompts) and the real fix is a dispatch-guard, not a name gate.
- **T-liveness-A caveat (explicit):** a valid-name `tools:` proves the names *resolve*, **not** that the agent *uses* them. M1 is a **form-check**, not a behaviour-check. It would have caught #551 (the names didn't resolve) but does **not** prove an agent with valid names actually calls a tool rather than fabricating. Shipping M1 and declaring liveness "solved" is the exact `#discipline-theatre` this umbrella exists to kill.

### M2 — PROBE: dispatch-based liveness smoke (behavioural; ADAPT of the existing prober)

- **What:** a session-bound, operator-run probe that dispatches each shipped agent against a fixture input and asserts an **observable** signal — `tool_uses > 0` (the agent actually called Read/Glob/Bash) and/or a RED→GREEN delta (agent fails the task without its tools, succeeds with them). **ADAPT, not BUILD-new:** the RED→GREEN, fresh-subagent-per-pass machinery already exists in [`agents/manual-rule-liveness-prober.md`](../../../agents/manual-rule-liveness-prober.md) (SSOT #115) — generalise its target from "manifest manual rule" to "shipped sub-agent."
- **Catches the deeper class:** an agent with valid names that *still* doesn't use its tools (the T-liveness-A residue M1 cannot reach). Behaviour, not form.
- **Constraint:** dispatch = LLM call → **session-bound, operator/consumer-run on their own subscription, NEVER a GitHub Action** ([no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md)). Ships as an AI-agnostic `agents/*.md` prompt, like the existing prober. Ties to #550 (post-install functional acceptance).
- **Cost:** larger; a new prompt artefact + fixture scenarios. Overlaps #550's post-install smoke surface — sequencing matters.

---

## §5 Verdict — gate vs probe vs both **(PARKED — maintainer DECISION-NEEDED)**

Per the umbrella's park contract («which channel to recommend … is a maintainer call, not yours to guess») and [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md), the **commitment** is not the researcher's to make. Options with downstream consequences:

- **Option A — gate only (M1).** → #551's exact mechanism blocked at pre-push, cheap, CI-able, permanent. **But** leaves the T-liveness-A residue (valid names ≠ agent uses them) and the "registers-but-does-nothing" behavioural class uncovered. Risks `#discipline-theatre` if sold as "liveness solved."
- **Option B — probe only (M2).** → behavioural truth, catches the deep class, agnostic-in-spirit. **But** heavier, session-bound (never blocks a push), depends on operator running it; #551 (a *static* name bug) would only be caught when someone *runs* the probe — slower channel than a gate for a defect a gate catches deterministically.
- **Option C — both, layered + phased (RECOMMENDED, §5.1).** → mirrors the project's own principle-02-gate + behavioural-prober split and the external deterministic-first-then-trajectory consensus. Gate = floor (form, every push); probe = proof (behaviour, operator-run). Honors invariant #4 (multi-channel, earliest reachable). **Cost:** two artefacts; the build-now-vs-defer split is the resourcing sub-decision below.

### §5.1 Reasoned recommendation (lead with a pick, per [phase-research-coverage.md §1.12](../../../.claude/rules/phase-research-coverage.md))

**Recommend Option C, phased: ship M1 (gate) now; ADAPT M2 (probe) from the existing prober, deferred behind a promotion criterion.** Rationale grounded in evidence above:
1. M1 is **evidence-dominant on its own merits** — it catches #551's *static* mechanism deterministically, at the earliest reachable channel, at ~30–60 LOC, no-paid-LLM-clean. There is no merit-based argument to *not* have it; the only open question is its **scope** (the §4 M1 (i)/(ii)/(iii) agnosticism sub-fork), which is itself a maintainer call.
2. M2 is **valuable but should ADAPT, not duplicate** — the RED→GREEN dispatch machinery exists (#115). Per [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md), generalise the prober rather than build a parallel one; gate its build behind a trigger (e.g. "#550 post-install acceptance lands" or "2nd dispatch-fabrication incident").

**What stays the maintainer's call (genuinely parked):** (a) A-vs-B-vs-C commitment; (b) if C — build-both-now vs gate-now/probe-deferred; (c) M1's scope resolution (i)/(ii)/(iii). These are strategy/resourcing forks with no single merit-dominant answer; surfaced here, not decided.

### §5.2 Promotion criteria (for whichever channel(s) the maintainer commits)

- **M1 gate** — promote to a mandatory principle test (`packages/core/principles/<N>-shipped-agent-tools-valid.test.ts`) immediately on commit (the defect already exists ×6; this is not "wait for 3 incidents"). Paired-negative arm (per principle 02 discipline): inject a bogus tool name into a fixture agent → gate **must** go RED; remove it → GREEN.
- **M2 probe** — stays Class-C-equivalent prose/agent (session-bound, never CI) with promotion-to-mandatory-operator-step trigger: fires when a 2nd dispatch-fabrication incident is recorded, or when #550 post-install acceptance ships (whichever first).
- **Proposed SSOT entry #121** (to be landed *with* the implementing capability commit, not here — research only): "Shipped-agent liveness — `tools:`-name allow-list gate (deterministic, CC-scoped) + dispatch smoke probe (ADAPT of #115)." Cites #53, #114, #115; problem-class = framework's own delivery artefacts (distinct from #114/#115's consumer-rule scope).

---

## §6 Search-coverage record (BFR-default §3; DeepWiki caveat)

- **WebSearch ≥3 phrasings (5 run):** (1) "LLM agent liveness test verify agent actually calls tools smoke test tool_use count"; (2) "Claude Code subagent tools frontmatter allowed tool names validation invalid tool"; (3) "AI agent evaluation framework tool use trajectory assertion did agent invoke tool"; (4) "post-install smoke test canary verify plugin capability actually works not just present"; (5) "promptfoo assert tool called eval test agent tool invocation deterministic".
- **WebFetch (DeepWiki substitute):** `code.claude.com/docs/en/tools-reference` for the canonical CC tool-name allow-list + Agent-tool-behavior («`tools` only → subagent gets only the listed tools»). **DeepWiki MCP `ask_question` was unavailable in this execution environment** (no DeepWiki tool registered — verified via ToolSearch). Per the umbrella's capability-park rule the literature survey was **not** fabricated from memory: WebSearch ran live (5 phrasings), and repository-level inquiry was satisfied via WebFetch on the authoritative source doc + GitHub issue URLs surfaced by search. The one BFR-default tool genuinely absent (DeepWiki) is recorded here rather than papered over.
- **Own-stack sweep:** guard-liveness umbrella (#114/#115), manual-rule-liveness-prober, principles 02/07/09, `rules-manifest.json` distribution — all read, not assumed (§2).

---

## §1.7 Self-review — Forward and Backward checks

**Forward-check (this research complies with active disciplines):**
- **T2** (designing ≠ running): the failure was *mechanically demonstrated*, not asserted — `grep` over `agents/*.md` (§0), allow-list verified against live CC docs (§0/§6), absence-of-gate verified via `grep packages/core/principles/*.ts` (§0). No "would detect" prose.
- **T11/T12** (prior-art + literature before "I propose"): external survey (§3) cites DeepEval, promptfoo, LangSmith, Inspect/METR, Block, CC issues #52055/#18837/#8697; internal prior art cites SSOT #53/#114/#115 by ID before any mechanism (§4).
- **T15** (self-application — mandatory): §0 records that the *liveness prober itself* (#552) carries the broken `tools:` and would fabricate on its own dispatch; §5.2 requires M1 to carry a paired-negative arm (the gate must be RED-able), i.e. the liveness gate is itself liveness-tested.
- **T16 / T-liveness-A** (form ≠ behaviour, pattern-matching-on-name): §4 M1 explicitly labels the gate a **form-check** that does **not** prove tool *use*; "a check named validate that doesn't run the artifact" is named as the trap (§0 — `npm test` is green while agents are dead).
- **T1/T14** (no shallow-sample "covered"): full population enumerated — all 6 agents (§0), all 26 manifest rules referenced (§2), 5 search phrasings (§6). No "looked at 3, done."
- **Channel/no-paid-LLM compliance:** M1 = deterministic gate; M2 = session-bound never-CI ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)); reviewer-discipline §2 honored — the verdict is **parked**, not decided (§5).
- **Doc-authority:** folder-level authority (research-patches, [doc-authority-hierarchy.md §5](../../../.claude/rules/doc-authority-hierarchy.md)); `<!-- scope: -->` first line (principle 10); both Forward + Backward present (principle 13); no per-file header, no SSOT row landed, no Prior-art trailer (research only).

**Backward-check (scope bounded; no silent drive-by):**
- No code, schema, manifest, or agent file changed — research only, per the umbrella («Do NOT build the gate/probe»). The 6 broken `tools:` lines are **recorded as findings, not patched**.
- No SSOT row appended (proposed #121 is a *proposal* for the implementing commit, §5.2 — not landed here; append-only register stays untouched).
- Single deliverable = this patch (per park contract). Egress (push/PR) left to the orchestrator's `harvest.ts`.
- The gate-vs-probe-vs-both verdict is surfaced as DECISION-NEEDED (§5), not auto-decided — `#strategy-decided-by-reviewer` avoided.
