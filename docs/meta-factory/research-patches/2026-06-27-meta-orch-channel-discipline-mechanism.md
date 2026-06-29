<!-- scope:meta-orch-channel-discipline -->
# R-phase — enforcement mechanism for `#worker-dispatch-via-subagent`

> **Type:** R-phase research-patch (Stage A of the `meta-orch-channel-discipline` umbrella). Research-only: ranks + recommends; does **not** decide, does **not** implement.
> **Scope-bound by:** filename + folder authority ([research-patches README](../research-patches), [doc-authority-hierarchy.md §2 filename-convention authority](../../../.claude/rules/doc-authority-hierarchy.md)). Authoritative for: the mechanism comparison + parked DECISION-NEEDED forks. NOT authoritative for: the final mechanism choice (maintainer + Stage B), project goal ([README.md#why-this-exists](../../../README.md)).
> **Origin umbrella:** [`.claude/orchestrator-prompts/meta-orch-channel-discipline/kickoff.md`](../../../.claude/orchestrator-prompts/meta-orch-channel-discipline/kickoff.md) (its §2 M1/M2 framing is STALE — superseded by the corrected facts in §1.2 below).
> **Date:** 2026-06-27.

---

## §0 Summary + lead recommendation (a recommendation, NOT a decision)

The anti-pattern `#worker-dispatch-via-subagent` ([`.claude/skills/pipeline/SKILL.md:335`](../../../.claude/skills/pipeline/SKILL.md)) is **Class C — prose only**. It fails today only at human cold-review — the worst channel per the README "earliest reachable channel" invariant. The single documented incident (Stage 5 dogfood Phase -1, 2026-05-26) was a **kickoff drafted with the violation in its prose** — i.e. a *kickoff-text* incident, not (yet) a *runtime-act* incident.

**Lead recommendation (evidence-backed pick, maintainer decides):** ship **M6 — a hybrid of M1 (edit-time PostToolUse hook on `kickoff.md`) + M2 (CI principle test over the same tracked kickoff text)**, scoped to `.claude/orchestrator-prompts/**/kickoff.md`, with an explicit escape-hatch token for meta-kickoffs that legitimately quote the anti-pattern. Rationale, in one line each:

- **Detectable → gate** ([rule-enforcement-channel-selection.md §1](../../../.claude/rules/rule-enforcement-channel-selection.md)): the incident class (a kickoff whose prose *instructs* Agent-tool write-dispatch) is mechanically detectable by deterministic regex — so the correct tool is a gate, not an injection.
- **Earliest + portable:** M1 fires at edit-time (earliest reachable channel) but is CC-only and only for the authoring session; M2 fires at CI (last resort) but is harness-agnostic and catches anything authored outside CC or before the hook is wired. The pair covers both.
- **REUSE-heavy:** both halves clone existing, shipped infrastructure (M1 ≈ [`check-kickoff-traps.sh`](../../../.claude/hooks/check-kickoff-traps.sh); M2 ≈ principle [18](../../../packages/core/principles/18-meta-orchestrator-output-format.test.ts)/[19](../../../packages/core/principles/19-meta-orchestrator-alias-routing-consistency.test.ts)) — near-zero new capability surface.
- **`no-paid-llm-in-ci.md` clean:** deterministic bash/regex, zero API-billed calls.

**The honest ceiling (do not gloss):** any kickoff-*text* mechanism closes only the sub-surface "a kickoff documents the wrong channel." It **cannot** catch the full rule, whose own falsifier reads *«the test is «who invokes», not «what the prompt looks like»»* ([SKILL.md:335](../../../.claude/skills/pipeline/SKILL.md)). A session that simply *performs* Agent-tool write-dispatch without writing it into a kickoff is invisible to text inspection. The recommended mechanism fires on the documented incident class and is a real upgrade from Class C; it is **not** a complete enforcement of the rule. That residue is parked as DECISION-NEEDED (e) in §6.

Everything below is the evidence. Forks are parked in §6, not settled.

---

## §1 The gap + ground-truth fixture

### §1.1 The rule, verbatim

[`.claude/skills/pipeline/SKILL.md:335`](../../../.claude/skills/pipeline/SKILL.md) (line verified via `grep -n` 2026-06-27):

> `#worker-dispatch-via-subagent` — Worker dispatch via Agent tool from the meta-orchestrator session. Agent tool is ONLY for Phase -1 read-only reviewer (`reviewer-discipline.md §2`) + read-only research subagents (text return). Write-task Worker dispatch belongs in a fresh CC session opened by the maintainer pasting a §10 1-liner block. Channel matters — maintainer-paste = external loop-close; Agent-tool = subagent = wrong channel for writes. … **Falsifier:** the channel boundary holds even when prompt shapes converge — the test is «who invokes», not «what the prompt looks like».

The adjacent, structurally-similar `#commit-on-behalf-of-worker` lives at [`SKILL.md:336`](../../../.claude/skills/pipeline/SKILL.md) (the meta-orchestrator running `git commit` / `gh pr create` for work it dispatched).

The legitimate dispatch channels the rule points to ([SKILL.md §10.3](../../../.claude/skills/pipeline/SKILL.md)): (1) maintainer pastes the 1-liner `/orchestrator <umbrella> §<section> — …` into a fresh CC tab; (2) autonomous `tsx packages/runtime-bridge/src/cli/dispatch.ts <kickoff>` — both external to the meta-orchestrator session's Agent tool.

### §1.2 Ground-truth incident fixture (store inline — verbatim)

The single documented incident (Stage 5 dogfood Phase -1 cold-review, 2026-05-26): a kickoff was drafted instructing —

```text
Dispatch Worker via Agent tool with explicit model: opus + isolation: worktree
```

— which is exactly the `#worker-dispatch-via-subagent` violation (a write-task Worker routed through the Agent-tool / subagent channel rather than a maintainer-opened session). The substrate's prose rule did NOT auto-catch it; only manual cold-review did. **This string is the recursive-self-application ground-truth fixture.** Any recommended mechanism MUST fire on this exact text and MUST NOT fire on a clean kickoff (§4).

### §1.3 Corrected facts (override the stale umbrella-kickoff §2 framing)

1. **Kickoffs are now TRACKED.** `.gitignore:18` = `!.claude/orchestrator-prompts/*/kickoff.md` (verified `grep -n orchestrator-prompts .gitignore` 2026-06-27). The umbrella kickoff's M1/M2 reasoning rested on "kickoff gitignored → CI cannot see it → only an edit-time hook works." **That premise is FALSE now.** Consequence: **M2 (a CI principle test over tracked kickoff text) is a first-class candidate**, not the impossibility the original framing assumed. (Note: [`check-kickoff-traps.sh:3`](../../../.claude/hooks/check-kickoff-traps.sh) still carries a stale `@cc-only-rationale: …kickoffs are gitignored…` comment — pre-#523 drift, flagged as a Stage B fix-along, out of scope here.)
2. **The skill relocated.** `.claude/skills/meta-orchestrator/` → `.claude/skills/pipeline/`. Anti-pattern at `SKILL.md:335`; adjacent `#commit-on-behalf-of-worker` at `:336` (both verified 2026-06-27).

---

## §2 BFR 6-layer search ([build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md))

Mandatory before any BUILD verdict. Each layer below cites results, including null results (T1: depth, not 3-clean-samples; T11/T12: search at proposal time, not from memory).

### §2.1 Layer 5 — SSOT consult ([prior-art-evaluations.md](../prior-art-evaluations.md))

`grep -niE "channel.discipline|dispatch.rout|agent.vs.subagent|worker dispatch|two.key"` over the SSOT (2026-06-27): **no existing row covers dispatch-channel enforcement.** Adjacent rows found:

- **#29** — AIF `<!-- handoff:task:<id> -->` / `<!-- scope:<slug> -->` first-line annotation (ADAPT). Machine-parseable artifact↔scope linking; the precedent that makes *any* tracked-text principle test (M2) cheap. Problem-class: artifact annotation, not channel routing — adjacent, not a match.
- **#65** — Superpowers `using-git-worktrees` (REFERENCE). Worktree isolation; the dispatch *substrate*, not channel *discipline*.

Max SSOT row id today = **176** (`grep -oE '^\| [0-9]+ '`), so a Stage-B capability commit would append **#177**. No SSOT edit is made here (research-only; §7 scope).

### §2.2 Layer 3 — DeepWiki repository inquiry (≥3 phrasings)

**Tooling caveat (mark explicitly):** the native DeepWiki `ask_question` MCP tool is **NOT configured in this container** (no `.mcp.json`; `grep -rl deepwiki ~/.claude*` finds only prior transcripts). Per kickoff §7 I do not fabricate MCP results. Substitute: DeepWiki's **web UI via WebFetch** (`deepwiki.com/<owner>/<repo>`), 3 companion repos, ≥1 phrasing each. Native re-run is `INCONCLUSIVE-needs-followup` (low risk — web-UI answers are consistent with the WebSearch layer below).

| Repo | Phrasing (channel-discipline / commit-authorship) | Result |
|---|---|---|
| `obra/superpowers` | "does it route/audit subagent-vs-fresh-session write dispatch?" | **NULL.** "no explicit dispatch-channel discipline documented." SDD launches "a fresh subagent per task" but that is a *workflow pattern, not a routing mechanism*; no hook audits which channel. |
| `lee-to/aif-handoff` | "any rule/hook preventing wrong-channel dispatch or commit-on-behalf?" | **NULL on enforcement.** Has "Git Isolation: Branches, Worktrees & Commit Generation" (each subagent commits its own work — the `HANDOFF_MODE` pattern this very session runs under) but "actual enforcement mechanisms are not detailed"; no deterministic channel check. |
| `dwillis/oh-my-openagent` | "rule injector / hook routing dispatch channel?" | **INCONCLUSIVE** — DeepWiki page returned navigation chrome only, no indexed content. Not retried (tangential; `rulesInjector` already covered by SSOT via [rule-enforcement-channel-selection.md origin](2026-05-22-rule-enforcement-channel-selection.md)). |

### §2.3 Layer 4 — WebSearch (≥3 phrasings)

1. *"AI multi-agent orchestrator dispatch channel discipline subagent vs subprocess audit trail enforcement"* — enterprise orchestration literature ([Azure AI agent patterns](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns), [Camunda](https://camunda.com/orchestrate/agents/), [engini.ai governance](https://engini.ai/blog/multi-agent-ai-orchestration-claude-subagents-enterprise-governance)) describes recursive subagent delegation + "single audit trail" + "guardian agents enforce boundaries," but all at the *runtime-framework* level (LangGraph-style supervisors), none as a *deterministic, repo-side text gate*. Problem-class adjacent, no transferable artifact.
2. *"two-key dispatch protocol multi-agent human-in-the-loop write task delegation"* — no tool ships the named "two-key" protocol; the closest is A2A / MCP "pause and request human consent" ([arxiv 2506.05364](https://arxiv.org/pdf/2506.05364), [O'Reilly A2A](https://www.oreilly.com/radar/designing-collaborative-multi-agent-systems-with-the-a2a-protocol/)) and LangGraph checkpoint approvals — runtime pause-for-human, not a static channel-routing check.
3. *"enforce git commit authorship per agent / prevent orchestrator committing on behalf of worker"* (for the adjacent `#commit-on-behalf-of-worker`) — surfaced the strongest concrete precedent: [`steipete/agent-scripts` maintainer-orchestrator](https://github.com/steipete/agent-scripts/blob/main/skills/maintainer-orchestrator/SKILL.md) + the **prepare-commit-msg hook** pattern ([Crash Override KB](https://crashoverride.com/resources/knowledge-base/code-ownership/attributing-ai-commits-git)) that "rejects any agent-authored commit without an operator signoff."

### §2.4 Convergent-design precedent (the load-bearing hit)

WebFetch of [`steipete/agent-scripts` maintainer-orchestrator SKILL.md](https://raw.githubusercontent.com/steipete/agent-scripts/main/skills/maintainer-orchestrator/SKILL.md) (2026-06-27) returned a **direct convergent-design match** for our rule:

> "Workers are separate threads, not subagents." / "Repository workers … must not create subworkers, delegate work, or manage other chats." / "Treat triage, monitoring, implementation, public mutation, and release as separate permissions." / "Without the required permission, stop at the last authorized boundary."

This is *our* `#worker-dispatch-via-subagent` rule, independently arrived at. **But — T16 problem-class check** ([ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md)):

- **Upstream problem class:** "route write-tasks to separate worker threads, not subagents; gate mutations behind explicit permissions." **= our problem class.** Match confirmed (not name-matched — the prose is semantically identical).
- **Upstream *enforcement* mechanism:** *prose permission gates obeyed by AI judgment* ("no explicit commit-authorship hook described; authorization gates are the deterministic enforcement mechanism" — DeepWiki/WebFetch). **This is the same Class-C gap we have** — the *rule* is validated externally, but the *mechanical enforcement artifact* does not exist upstream to adopt.

### §2.5 BFR verdict ([build-first-reuse-default.md §1 ladder](../../../.claude/rules/build-first-reuse-default.md))

| Layer | Verdict | Evidence |
|---|---|---|
| The **rule/discipline** ("workers are separate sessions, not subagents") | **ADOPT-VOCABULARY / REFERENCE** | `steipete/agent-scripts` convergent design + aif-handoff per-worker commit isolation validate it. No need to re-derive; cite as precedent. |
| The **mechanical enforcement artifact** (deterministic kickoff-text gate) | **BUILD (narrow)** | No upstream ships a deterministic, repo-side channel-dispatch gate. Every surveyed project enforces via runtime-framework supervision or prose permissions (AI judgment) — the exact Class-C gap. BUILD is justified: confirmed absence after 5 search layers; the BUILD reuses in-repo hook/principle-test infra (M6), so the new-capability surface is minimal. |

This is the canonical BFR split: **REFERENCE the validated discipline, BUILD only the unserved enforcement slice** (precedent: [ci-tool-pinning.md §1 / SSOT #153](../../../.claude/rules/ci-tool-pinning.md) — REUSE zizmor, BUILD the bare-`run:` slice it misses).

---

## §3 Mechanism candidates compared (ranked; final winner NOT picked)

For each: channel it fires at · fires on §1.2 fixture? · false-positive risk · maintenance cost · `no-paid-llm` compliance.

| # | Mechanism | Channel (earliest→last) | Fires on fixture? | FP risk | Maint. cost | no-paid-llm | Rank |
|---|---|---|---|---|---|---|---|
| **M1** | PostToolUse hook on Edit/Write of `kickoff.md`, regex, `exit 1` | **edit-time (earliest)** | ✅ if authored in CC | medium (needs negative-context + escape token) | low (clone `check-kickoff-traps.sh`) | ✅ | 2 (alone) |
| **M2** | Principle test over tracked `kickoff.md` text | **CI (last resort)** | ✅ for everyone, any harness | medium (same regex concerns) | low (clone principle 18/19) | ✅ | 2 (alone) |
| **M3** | `pick-channel.sh` helper the session must invoke | n/a (advisory) | ❌ only if invoked | low | low | ✅ | 5 |
| **M4** | Hybrid M3 + M1 | edit-time | ✅ via M1 half | medium | medium | ✅ | 4 |
| **M5** | Accept Class C, document | human cold-review | ❌ (no mechanism) | n/a | zero | ✅ | 3 |
| **M6** ⭐ | Hybrid **M1 + M2** (edit-time hook + CI test), shared regex + escape token | **edit-time AND CI** | ✅ author *and* backstop | medium (one regex, two callers) | low–med | ✅ | **1 (recommended)** |

### Per-candidate notes

- **M1 — edit-time hook.** Earliest reachable channel ([README §earliest reachable](../../../README.md), [channel-selection §3 step 2](../../../.claude/rules/rule-enforcement-channel-selection.md)). Direct clone of [`check-kickoff-traps.sh`](../../../.claude/hooks/check-kickoff-traps.sh) (same path-narrow `case "$REL_PATH" in .claude/orchestrator-prompts/*/kickoff.md`, same `exit 1` gate convention as [`check-doc-authority.sh`](../../../.claude/hooks/check-doc-authority.sh)). **Limit:** CC-only (`@cc-only-rationale` required per [dual-implementation-discipline.md §6](../../../.claude/rules/dual-implementation-discipline.md)); fires only for the session that edits the file *in CC* — a kickoff authored in Cursor/Aider, or pasted in pre-wired, slips it. So M1 *alone* leaves a portability hole.
- **M2 — principle test on tracked text.** **Newly viable** per §1.3.1 (the correction that unlocks this whole patch). Clone of principle [18](../../../packages/core/principles/18-meta-orchestrator-output-format.test.ts)/[19](../../../packages/core/principles/19-meta-orchestrator-alias-routing-consistency.test.ts) (meta-orchestrator principle tests over tracked SKILL/output-format text). Harness-agnostic — fires for every PR via CI regardless of who authored the kickoff or in what tool. **Limit:** CI is the *last-resort* channel; it catches the violation only after pre-push/PR, not as the author types. So M2 *alone* abandons the earliest-channel win.
- **M3 — `pick-channel.sh` helper.** **T-MOCD-A applies in full:** *"a mechanism that requires the AI to remember to run it is not a mechanism that enforces."* A helper the session may skip ([ai-laziness-traps.md §2 T7](../../../.claude/rules/ai-laziness-traps.md)) is advisory, not a gate. Does **not** fire on the fixture unless invoked. Rejected as a standalone enforcement mechanism; retained only as the optional advisory half of M4.
- **M4 — M3 + M1.** The hook (M1) is the only enforcing part; the helper (M3) is decoration with a skip-hole. Strictly dominated by M6 (which replaces the skip-prone helper with a portable CI backstop that actually fires).
- **M5 — accept Class C.** Legitimate per [parallel-subwave-isolation.md §4](../../../.claude/rules/parallel-subwave-isolation.md) / [reviewer-discipline.md §4](../../../.claude/rules/reviewer-discipline.md) precedent **iff** incident rate stays low (N=1 in ~13 months so far). The honest default if the maintainer judges N=1 too thin to mechanize (T-MOCD-B). Note: M5 is the *status quo*; choosing it is choosing "not yet," not "never."
- **M6 — M1 + M2 hybrid (recommended).** One shared regex/matcher, two callers: the edit-time hook for the earliest channel + CC author, and the CI principle test as the harness-agnostic backstop. This is the **project's own established dual pattern** — [`check-doc-authority.sh` hook + principle 09](../../../.claude/hooks/check-doc-authority.sh); [`check-kickoff-traps.sh` hook + principle 12](../../../.claude/hooks/check-kickoff-traps.sh) — where a `bin.ts`/shared module holds the logic and both channels call it ([dual-implementation-discipline.md §7 single-source-of-truth](../../../.claude/rules/dual-implementation-discipline.md)). Covers both the earliest-channel and the portability goals that M1 and M2 each miss alone.

---

## §4 Recursive self-application check (T2 + T15 — verify it fires, don't assert it would)

**Claim under test:** the recommended matcher fires on the §1.2 fixture and stays silent on a clean kickoff.

A deterministic matcher of the incident class would be (sketch — final form is Stage B's, but verified by hand against the strings here):

```bash
# fires when a kickoff PROSE instructs Agent-tool write-dispatch of a Worker:
#  (a) names the Agent-tool dispatch channel:  /Agent[ -]tool|via .*Agent|isolation:\s*["']?worktree/
#  (b) targets a WRITE Worker:                 /\bWorker\b|write[- ]task|dispatch.*Worker/
#  (c) NOT excluded by read-only context:      ! /read-only|reviewer|Phase -1|research subagent|text return/
#  (d) NOT carrying the escape token:           ! /<!-- channel-discipline: allow/
```

Hand-trace:

| Input | (a) | (b) | (c) not-excluded | Verdict |
|---|---|---|---|---|
| **Fixture:** `Dispatch Worker via Agent tool with explicit model: opus + isolation: worktree` | ✅ ("Agent tool", "isolation: worktree") | ✅ ("Dispatch Worker") | ✅ (no read-only/reviewer token) | **FIRES** ✅ correct |
| Clean kickoff: `Stage A — R-phase, single Mode-A inline session; paste the §10 1-liner` | ❌ | ❌ | — | silent ✅ correct |
| Legit read-only: `Phase -1 cold-review via Agent tool (read-only reviewer, text return)` | ✅ | ❌ (no Worker) / — | ❌ excluded by "read-only"/"reviewer"/"Phase -1" | silent ✅ correct |

**Result: the recommended M1/M2/M6 matcher satisfies the recursive-self-application gate** — it fires on the documented incident and not on the clean / legitimate-read-only cases. M3 and M5 do **not** fire on the fixture (M3 only if invoked; M5 has no mechanism) → they do not *enforce* the rule, by definition.

**Two falsification caveats kept honest (T14 — clean ≠ proven-clean):**

1. **The "who invokes" ceiling.** The matcher fires on a kickoff that *documents* the wrong channel (the Stage-5 incident shape). It does **not** fire on a session that *performs* Agent-tool write-dispatch at runtime without writing it into a kickoff — the rule's own falsifier (*«who invokes, not what the prompt looks like»*). So even M6 enforces a *sub-surface*, not the whole rule. This is a genuine residual gap, parked as DECISION-NEEDED (e).
2. **Self-quoting false positives.** Three in-repo files legitimately contain the fixture-like string: this patch, [`SKILL.md:335`](../../../.claude/skills/pipeline/SKILL.md), and the [umbrella kickoff](../../../.claude/orchestrator-prompts/meta-orch-channel-discipline/kickoff.md). M2's `.claude/orchestrator-prompts/**/kickoff.md` path-scope already excludes the first two. The umbrella kickoff **is** an in-scope kickoff that quotes the anti-pattern to plan against it → it would false-positive **without** the escape token (clause (d)). The escape-token design is therefore load-bearing, not optional — parked as DECISION-NEEDED (d).

---

## §5 `no-paid-llm-in-ci.md §1` compliance

Every ranked candidate is **deterministic** (bash / regex / TypeScript AST-or-string-match) with **zero** API-billed or LLM calls in the enforcement path — compliant with [no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md). M1 = a bash PostToolUse hook (session-bound, no CI billing); M2 = a Vitest principle test (deterministic grep over tracked files, the same shape as principle [17](../../../packages/core/principles/17-no-paid-llm-in-ci.test.ts)/[22](../../../packages/core/principles/22-internal-english.test.ts)). No candidate requires a semantic/LLM judge — and a semantic judge would be *rejected* here regardless, since the violation is mechanically detectable ([channel-selection §5 `#gate-where-judgment-needed`](../../../.claude/rules/rule-enforcement-channel-selection.md) is the inverse trap, not this one). The one judgment-shaped residue (the "who invokes" runtime surface, §4 caveat 1) is precisely the part that must **not** be gated — it would be injection or accepted-Class-C, never a paid check.

---

## §6 DECISION-NEEDED — parked for the maintainer (UNRESOLVED, per kickoff §5)

Each is a genuine fork with no determinate best on the project's merits. I recommend where I have an evidence-backed lean; I do **not** settle.

**(a) Which mechanism wins.**
- Option A → **M6 (M1+M2 hybrid).** Earliest-channel + portable backstop; matches the repo's own dual pattern. Cost: two callers to keep in sync (mitigated by one shared matcher module per [dual-implementation §7](../../../.claude/rules/dual-implementation-discipline.md)).
- Option B → **M2 only.** Simpler (one artifact), fully portable, but abandons the earliest-channel win — the author learns at CI, not as they type.
- Option C → **M1 only.** Earliest channel, but CC-only + author-session-only → portability hole.
- Option D → **M5 (accept Class C).** If N=1 is judged too thin (see (b)). Status quo; revisit on next incident.
- *My recommendation:* **A (M6)**, with B as the low-effort fallback if hook-maintenance is unwanted. (A reasoned recommendation per [recommendation-laziness-discipline.md §3](../../../.claude/rules/recommendation-laziness-discipline.md), backed by §2–§4 evidence — not a decision.)

**(b) Promotion-criterion strength (T-MOCD-B — N=1 may be premature mechanization).**
- Option A → **promote now on the single Stage-5 incident.** Precedent: [ai-laziness-traps.md T17](../../../.claude/rules/ai-laziness-traps.md) designed a mechanism at 1/3 incidents.
- Option B → **wait for ≥2 more incidents in 6 months** before building. Precedent: [reviewer-discipline.md §4](../../../.claude/rules/reviewer-discipline.md) + [parallel-subwave-isolation.md §4](../../../.claude/rules/parallel-subwave-isolation.md) (3-in-6-months). Choosing B = choosing M5 (d) for now.
- *No lean — this is squarely a maintainer risk-appetite call.* The two precedent families genuinely conflict; the evidence does not adjudicate.

**(c) Widen scope to the adjacent `#commit-on-behalf-of-worker` ([SKILL.md:336](../../../.claude/skills/pipeline/SKILL.md))?**
- Option A → **yes, same PR.** Structurally identical (channel/authorship boundary); BFR surfaced a ready precedent (the [prepare-commit-msg "reject agent commit without operator signoff" pattern](https://crashoverride.com/resources/knowledge-base/code-ownership/attributing-ai-commits-git) + aif-handoff per-worker commit isolation). Risk: scope creep ([CLAUDE.md PR strategy](../../../CLAUDE.md) — atomic-umbrella discipline).
- Option B → **no, separate umbrella.** Keep this umbrella to the single target the kickoff named; surface the commit one as a follow-up observation.
- *My lean:* **B** — the kickoff §7 scopes this to the single anti-pattern; widening is a drive-by per CLAUDE.md unless the maintainer explicitly invites it. The precedent is recorded here so the follow-up is cheap.

**(d) Escape-hatch design for self-quoting kickoffs (load-bearing per §4 caveat 2).**
- Option A → **token on the line**, e.g. `<!-- channel-discipline: allow <reason> -->` (clone of the [`# ci-tool-pin: allow`](../../../.claude/rules/ci-tool-pinning.md) precedent). Per-occurrence, auditable, reason-bearing.
- Option B → **path/name allowlist** (e.g. exempt kickoffs whose umbrella name contains `channel-discipline`). Coarser, drifts as umbrellas are added.
- *My lean:* **A** (token) — matches the established `ci-tool-pin: allow` convention and is per-occurrence rather than whole-file. Needed regardless of (a) because the umbrella's own kickoff trips the matcher.

**(e) The "who invokes" residual surface (§4 caveat 1).** The recommended mechanism enforces only the kickoff-*text* sub-surface. Does the maintainer want Stage B to *also* attempt the runtime "who invokes" surface (e.g. a dispatch-time audit-trail check in `runtime-bridge`), or explicitly accept that surface as Class C / injection-only?
- Option A → **accept the text-surface mechanism as sufficient** for the documented incident class; mark the runtime surface Class C with a re-promotion trigger.
- Option B → **commission a second R-phase** on the runtime "who invokes" surface (separate problem, separate search).
- *My lean:* **A** — the only documented incident is a text incident; building for an unobserved runtime surface is build-ahead-of-need ([build-first-reuse-default.md §4 `#integration-overhead-overestimate`](../../../.claude/rules/build-first-reuse-default.md)). Record the trigger; don't pre-build.

---

## §7 §1.7 self-reflexive note ([phase-research-coverage.md §1.7](../../../.claude/rules/phase-research-coverage.md))

- **Forward-check:** This patch complies with [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) (ran the 6-layer search before the BUILD-slice verdict; ADOPT-VOCABULARY for the rule, BUILD only the unserved enforcement slice); [no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md) (§5 — every candidate deterministic); [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md) active traps **T1** (swept prior-art to depth incl. null results, not 3-clean-samples), **T2** (§4 *runs* the matcher against the fixture, does not merely assert it would), **T11/T12** (searched at proposal time — DeepWiki-web + 3 WebSearch phrasings — not from memory), **T15** (§4 self-application: the dispatch-discipline mechanism is itself testable against the fixture), **T16** (§2.4 explicit upstream-vs-our problem-class match for the steipete precedent), **T-MOCD-A** (M3 down-ranked for the skip-the-invocation hole), **T-MOCD-B** (promotion strength parked as DECISION-NEEDED (b), not foregone); [recommendation-laziness-discipline.md §3 fork-surfacing](../../../.claude/rules/recommendation-laziness-discipline.md) (§6 parks every genuine fork rather than settling). Domain trap added per [ai-laziness-traps.md §3](../../../.claude/rules/ai-laziness-traps.md): **T-MOCD-C — "text-gate name-match completeness illusion"**: a kickoff-text gate that fires on the fixture *feels* like it enforces `#worker-dispatch-via-subagent`, but the rule's falsifier is «who invokes», so the gate enforces a sub-surface only — naming the gate after the rule overstates coverage (§0 + §4 caveat 1 counter it).
- **Backward-check:** Predecessor incident = Stage 5 dogfood Phase -1 (2026-05-26, §1.2). Supersedes nothing — the substrate prose rule ([SKILL.md:335](../../../.claude/skills/pipeline/SKILL.md)) stays source-of-truth; this patch only proposes an enforcement layer beneath it. Corrects the [umbrella kickoff §2](../../../.claude/orchestrator-prompts/meta-orch-channel-discipline/kickoff.md) M1/M2 "kickoff gitignored" premise (now false per §1.3.1). No SSOT row added (research-only; the #177 row lands with the Stage-B capability commit). One pre-existing drift noted for Stage B: [`check-kickoff-traps.sh:3`](../../../.claude/hooks/check-kickoff-traps.sh) still says kickoffs are gitignored.

---

## §8 See also

- [`.claude/skills/pipeline/SKILL.md:335-336`](../../../.claude/skills/pipeline/SKILL.md) — the target anti-patterns.
- [`.claude/orchestrator-prompts/meta-orch-channel-discipline/kickoff.md`](../../../.claude/orchestrator-prompts/meta-orch-channel-discipline/kickoff.md) — origin umbrella (§2 framing corrected here).
- [rule-enforcement-channel-selection.md §1-§4](../../../.claude/rules/rule-enforcement-channel-selection.md) — detectability→gate / relevance→breadth; channel catalogue used in §3.
- [build-first-reuse-default.md §1, §3](../../../.claude/rules/build-first-reuse-default.md) — verdict ladder + 6-layer search.
- [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) · [ai-laziness-traps.md](../../../.claude/rules/ai-laziness-traps.md) · [dual-implementation-discipline.md](../../../.claude/rules/dual-implementation-discipline.md) — applied constraints.
- [`.claude/hooks/check-kickoff-traps.sh`](../../../.claude/hooks/check-kickoff-traps.sh) · [`check-doc-authority.sh`](../../../.claude/hooks/check-doc-authority.sh) — M1 reuse precedents.
- [principle 18](../../../packages/core/principles/18-meta-orchestrator-output-format.test.ts) · [principle 19](../../../packages/core/principles/19-meta-orchestrator-alias-routing-consistency.test.ts) — M2 reuse precedents.
- External: [`steipete/agent-scripts` maintainer-orchestrator](https://github.com/steipete/agent-scripts/blob/main/skills/maintainer-orchestrator/SKILL.md) (convergent design) · [Crash Override — attributing AI commits](https://crashoverride.com/resources/knowledge-base/code-ownership/attributing-ai-commits-git) (prepare-commit-msg precedent for DECISION-NEEDED (c)).
