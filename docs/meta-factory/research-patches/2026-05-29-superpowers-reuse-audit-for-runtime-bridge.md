<!-- scope:superpowers-reuse-audit-for-runtime-bridge -->

# Sub-wave Pre-A: Superpowers (+ companions) re-use audit for runtime-bridge BUILD scope

> **Status:** R-phase patch — Sub-wave Pre-A of `aif-handoff-runtime-bridge-iphase` umbrella.
> **Date:** 2026-05-29.
> **Authoritative for:** §3 verdict table per Superpowers skill + per companion project (ai-factory, amux, claude-squad, oh-my-openagent, superset-sh); §4 concrete recommendation on whether/how Sub-waves A/B/C/D of the parent umbrella shrink, expand, or restructure.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The parent kickoff itself — see [`aif-handoff-runtime-bridge-iphase/kickoff.md`](../../../.claude/orchestrator-prompts/aif-handoff-runtime-bridge-iphase/kickoff.md).

---

## §0 TL;DR

**Primary finding (load-bearing, blocks entire umbrella):** The cost-safety premise of the `aif-handoff-runtime-bridge-iphase` umbrella ("CLI transport = subscription-bundled, no recurring cost") is **materially invalidated** by two policy changes that the predecessor R-phase (`aif-handoff-as-runtime-bridge`, PR #283, 2026-05-29) did not surface:

1. **April 4, 2026 — Anthropic blocks third-party frameworks from Pro/Max subscriptions.** aif-handoff's CLI transport routes through `claude -p` (the Agent SDK headless mode). Third-party tools using `claude -p` no longer draw from the interactive subscription quota. Source: widespread tech press coverage ([TNW](https://thenextweb.com/news/anthropic-openclaw-claude-subscription-ban-cost), [VentureBeat](https://venturebeat.com/technology/anthropic-reinstates-openclaw-and-third-party-agent-usage-on-claude-subscriptions-with-a-catch), [PYMNTS](https://www.pymnts.com/artificial-intelligence-2/2026/third-party-agents-lose-access-as-anthropic-tightens-claude-usage-rules/)).

2. **June 15, 2026 — Agent SDK gets a separate metered credit pool.** `claude -p` usage (= Agent SDK usage = aif-handoff CLI transport) is **split off** from interactive usage into a new monthly credit: $100/month (Max 5x) or $200/month (Max 20x). Credits are non-rollover. Once depleted, charges shift to standard API rates. Source: [Anthropic support article](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan), [code.claude.com/docs/en/headless](https://code.claude.com/docs/en/headless) (live documentation).

**Implication:** the umbrella's §1 fact 1 ("subscription-bundled, ToS-safe") is **no longer fully accurate as of today (2026-05-29)**, which is 17 days before the June 15 credit split takes effect. Post-June 15, every `claude -p` invocation by aif-handoff's CLI transport **draws from a capped monthly credit** (~$100-$200 depending on plan). Heavy autonomous-batch use (the exact use case this umbrella targets) will exhaust the monthly credit and then bill at API rates.

**STOP-condition fires:** this single finding is material enough to require maintainer decision before Sub-wave A proceeds. The cost-safety premise must be re-evaluated. See §4 for the concrete recommendation.

**Superpowers finding (secondary):** All 9 SP skills are **in-session only** — none provide cross-session dispatch (confirmed via DeepWiki probe + SKILL.md content read). The maintainer's layered design (brainstorming → meta-orch → aif-handoff as runtime) is **architecturally correct** at the session-boundary level: SP skills cover the in-session layer; aif-handoff covers the cross-session layer. No SP skill overlaps the BUILD scope of Sub-waves A/B/C/D. The SP re-use finding does NOT trigger the STOP condition from the kickoff §7 (≥2 sub-waves overlapping SP). See §3 for per-skill verdicts.

**amux finding (secondary, positive surprise):** amux (`mixpeek/amux`) is subscription-bundled (OAuth-first, ANTHROPIC_API_KEY optional), has REST API for programmatic status monitoring, and is purpose-built for cross-session autonomous dispatch. It is a **near-equal candidate** to aif-handoff for the runtime-bridge role — possibly more appropriate given its explicit multi-agent-coordination design. Cost-class: `subscription-bundled` (OAuth path) with the same June 15 credit-pool caveat as aif-handoff (both use `claude` CLI subprocess). See §5.

---

## §1 Evidence base (T11 BFR §3 6-layer probe)

Per [`build-first-reuse-default.md §3`](../../../.claude/rules/build-first-reuse-default.md), mandatory 6-layer probe:

1. **Prior-art SSOT consult:** SSOT rows #27/#28/#29/#30/#43/#44/#45/#46/#67/#80 cover aif-handoff. SSOT #64/#65/#74 cover SP skills. SSOT #83/#68 cover OhMyOpencode. No existing SSOT rows for amux (new: proposed row #85 in §7). No rows for claude-squad or superset-sh as runtime-bridge candidates.

2. **Phase-research-coverage §1 6-item checklist:** predecessor R-phase (5 patches, PR #268-#276, merged #283) ran 20+ DeepWiki probes, 3 WebSearch phrasings, and 4-variant analysis. This sub-wave runs an additional 7 DeepWiki probes + 5 WebSearch phrasings + 6 WebFetches. Combined: well above 6-item depth.

3. **DeepWiki ≥3 phrasings (executed this sub-wave):**
   - `obra/superpowers` — cross-session boundary (confirms in-session only)
   - `obra/superpowers` — executing-plans cross-process dispatch (confirms no cross-terminal)
   - `mixpeek/amux` — Claude invocation mechanism (confirms `claude` CLI subprocess)
   - `mixpeek/amux` — OAuth vs API key authentication (confirms OAuth-first)
   - `mixpeek/amux` — REST API machine-readable status (confirms REST + SSE)
   - `mixpeek/amux` — MCP server interface (confirms REST-only, not MCP server)
   - `smtg-ai/claude-squad` — machine-callable interface (confirms TUI-only + daemon mode only)
   - `lee-to/aif-handoff` — ai-factory parent (confirms AI Factory parent framework)
   - `anthropics/claude-code` — `-p` flag billing (surfaces June 15 credit-split note)

4. **WebSearch ≥3 phrasings (executed this sub-wave):**
   - «amux mixpeek cross-session Claude Code orchestration autonomous dispatch 2026»
   - «claude-squad smtg programmatic task creation headless API machine-callable 2026»
   - «aif-handoff CLI transport subscription bundled vs API metered cost 2026»
   - «autonomous cross-session agent dispatch orchestration tool Claude Code alternative aif-handoff 2026»
   - «Anthropic Claude Code April 2026 policy change subscription third-party frameworks blocked»
   - «claude -p agent SDK June 15 2026 credit subscription plans separate limit»

5. **SSOT consult:** confirmed above in layer 1.

6. **This rule (macro-level):** applied — findings assessed at scope level, not per-commit.

---

## §2 In-session vs. cross-session boundary (load-bearing architectural finding)

This is the most important architectural clarification for the umbrella.

**Superpowers (all 9 skills): in-session only.** Confirmed via DeepWiki probe (2026-05-29): «Based on my review of the Superpowers codebase, no skills support cross-session dispatch with persistent worker sessions. All skills operate within a single active session… The `Task` tool dispatches and waits for completion within the session.» The `executing-plans` skill's «separate session» framing refers to a *different* session the **user manually opens** — not a session spawned by the coordinator that survives `/clear`.

**aif-handoff: cross-session by design.** The Coordinator daemon (`pollAndProcess`) runs as a persistent Docker/Node process that spawns `claude` CLI subprocesses (via `packages/runtime/src/adapters/claude/cli.ts`). These workers are fully decoupled from the invoking session and persist after the session that created the task ends. This is the unique capability that no SP skill provides.

**The layered model is architecturally sound:** SP `brainstorming` (session entry point) → `/meta-orchestrator` (session orchestration) → aif-handoff or amux (cross-session worker dispatch) = complementary layers with no overlap. The concern was that SP might cover aif-handoff's cross-session role; it does not and cannot.

---

## §3 Superpowers skill audit (9 skills)

### Fetch method
All 9 skills fetched via `gh api repos/obra/superpowers/contents/skills/<slug>/SKILL.md --jq '.content' | base64 -d` (2026-05-29). No 404s — all 9 skills found.

### Per-skill verdicts

**T16 format per skill:** «SP problem class: X / Our umbrella problem class: Y / Match? / Evidence»

---

- **`subagent-driven-development`** — KEEP-REFERENCE (currently registered as SSOT #64 ADOPT for inner-loop dispatch; SSOT #74 ADOPT VOCABULARY for tier-naming)
  - **SP problem class:** In-session coordinator dispatches fresh subagents per task with 2-stage review (spec + quality); coordinator waits synchronously for each; Model Selection guides cost/quality tradeoff.
  - **Our umbrella problem class:** Cross-session dispatch — `/meta-orchestrator` writes kickoff.md → bridge creates aif-handoff task → CLI-transport Worker runs in a separate process → status read-back asynchronously.
  - **T16 match?** No cross-session match. SP stays in the same active session; our bridge explicitly spawns detached workers. **In-session overlap = 0%** for the bridge's core value proposition.
  - **Bi-directional gap:** (a) SP covers the inner-loop dispatch role that `/meta-orchestrator` itself already uses for Phase -1 reviewers, R-phase workers, etc. — no overlap with the bridge. (b) aif-handoff provides what SP cannot: detached worker execution, persistent task state, autonomous Planner/Implementer/Reviewer pipeline.
  - **Usage in our SKILL.md:** Lines 127, 159, 538, 619, 785, 841, 861 — all operationally correct ADOPT usages for in-session delegation. No bridge scope.
  - **Evidence:** `gh api` SKILL.md content 2026-05-29; DeepWiki cross-session probe 2026-05-29.

---

- **`requesting-code-review`** — KEEP-REFERENCE (currently used operationally in SKILL.md:675, 787)
  - **SP problem class:** Dispatch a code reviewer subagent with precise context (BASE_SHA/HEAD_SHA); synchronous review within active session; fix Critical/Important issues before proceeding.
  - **Our umbrella problem class:** Cross-session stage-gate verification (Phase -1 cold-review) for completed aif-handoff tasks.
  - **T16 match?** Partial at the concept level (review-before-merge discipline), zero at the mechanism level (in-session subagent vs. cross-session polling). Our Phase -1 protocol already operationalises this.
  - **Bi-directional gap:** (a) SP provides the in-session review mechanism our orchestrator already uses — no new coverage. (b) aif-handoff's `AGENT_AUTO_REVIEW_STRATEGY=closure_first` provides the autonomous-review equivalent for detached tasks — SP has no such mechanism.
  - **Evidence:** SKILL.md content, DeepWiki cross-session probe.

---

- **`using-git-worktrees`** — KEEP-REFERENCE (currently SSOT #65 REFERENCE; used at SKILL.md:194)
  - **SP problem class:** Ensure isolated workspace via native worktree tool or `git worktree add` fallback; Step 0 detects existing worktree (GIT_DIR≠GIT_COMMON), skips nested creation; submodule guard; sandbox fallback.
  - **Our umbrella problem class:** Worktree isolation for bridge Worker sessions (aif-handoff creates its own worktrees via `AIF_TASK_WORKTREES_ENABLED`).
  - **T16 match?** Mechanism match on the concept; different implementor. aif-handoff manages its own worktrees internally; our bridge trigger does NOT need to manage worktrees — aif-handoff does that for us. SP `using-git-worktrees` is for the **orchestrator's own** worktree setup, not for Worker sessions.
  - **Bi-directional gap:** (a) SP covers our self-setup at Sub-wave branch creation (already in use). (b) aif-handoff's `AIF_TASK_WORKTREES_ENABLED` is the cross-session equivalent — SP does not touch it.
  - **Usage in our SKILL.md:** Line 194 — ADOPT, operationally correct. Self-setup convention in every kickoff also references it.
  - **Evidence:** SKILL.md content; SP SKILL.md Step 0 + 1b fetched 2026-05-29.

---

- **`dispatching-parallel-agents`** — KEEP-REFERENCE (vocabulary alignment only; no current operational usage in SKILL.md for this specific skill)
  - **SP problem class:** Dispatch 1 agent per independent problem domain; parallel `Task` tool invocations; coordinator waits for all; integrate results.
  - **Our umbrella problem class:** Parallel cross-session Worker dispatch (Mode B) via aif-handoff.
  - **T16 match?** Same pattern name, different session scope. SP's parallel agents are synchronous in-session subagents; our Mode B dispatches separate sessions via file-prompts + worktrees. No mechanism overlap.
  - **Bi-directional gap:** (a) SP covers the in-session parallel case `/meta-orchestrator` uses for Phase 2 batch planning. (b) aif-handoff's `parallelEnabled` + `COORDINATOR_MAX_CONCURRENT_TASKS` provides the cross-session equivalent — SP cannot do this.
  - **Evidence:** SKILL.md content fetched 2026-05-29; DeepWiki cross-session probe (confirms `Task` tool is synchronous, session-bound).

---

- **`writing-plans`** — KEEP-REFERENCE (currently used at SKILL.md:78, 525)
  - **SP problem class:** Create comprehensive implementation plans saved to `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`; each task includes exact file paths, complete code, exact commands; plan header mandates `subagent-driven-development` sub-skill reference.
  - **Our umbrella problem class:** Kickoff.md authoring for `/meta-orchestrator` dispatch; plan consumed by the meta-orch, not by SP's executor.
  - **T16 match?** SP `writing-plans` produces plans for SP's own `executing-plans`/`subagent-driven-development` executor pipeline. Our kickoff.md format is different (umbrella structure, state.md, Phase -1 gates). The bridge (Sub-waves A-D) has its own kickoff.md authored by the maintainer + meta-orch. SP `writing-plans` would not be called inside the bridge implementation.
  - **In-session vs cross-session:** SP plan writing is in-session and produces a file for a human or SP executor. Our bridge's plan is the kickoff.md itself, authored before bridge invocation.
  - **Bi-directional gap:** (a) SP covers plan creation for in-session tasks — already in use for routine PRs. (b) aif-handoff's Planner subagent covers autonomous plan generation for cross-session tasks — SP `writing-plans` doesn't produce aif-handoff-compatible PLAN.md format.
  - **Evidence:** SKILL.md content fetched 2026-05-29; plan header `REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development` confirms SP-internal coupling.

---

- **`executing-plans`** — KEEP-REFERENCE (currently used at SKILL.md:487)
  - **SP problem class:** Load plan file → review critically → execute all tasks → use `finishing-a-development-branch` at end. **Important:** «executing-plans» is described as «separate session» but this means a *different* session the **human manually opens**, not a spawned persistent process. Confirmed via DeepWiki: «`executing-plans` assumes the user manually launches a new session to execute the plan».
  - **Our umbrella problem class:** Cross-session Worker dispatch that **persists after the orchestrator session ends** and requires no human to open a new session.
  - **T16 match?** Zero match on the core requirement. SP `executing-plans` is user-initiated (human opens new session); our bridge requirement is daemon-initiated (aif-handoff Coordinator spawns workers autonomously without human present).
  - **Bi-directional gap:** (a) SP `executing-plans` is the right tool for human-initiated plan execution — used in SKILL.md:487 for Phase 0 git setup. (b) aif-handoff Coordinator provides the autonomous (no human) equivalent — SP has no such mechanism.
  - **Evidence:** SKILL.md content fetched; DeepWiki executing-plans cross-terminal probe 2026-05-29 (explicit quote: «`executing-plans` assumes the user manually launches a new session»).

---

- **`brainstorming`** — KEEP-REFERENCE (currently referenced as Top-layer entry point in kickoff §3 Sub-wave D Step 3b)
  - **SP problem class:** Structured in-session dialogue to explore user intent → design → spec → invoke `writing-plans`. Hard gate: do NOT write code until user approves design. Produces `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
  - **Our umbrella problem class:** Sub-wave D Step 3b batch-review pattern — maintainer uses `brainstorming` to process the accumulated `manualReviewRequired` queue from aif-handoff tasks.
  - **T16 match?** Partial. SP `brainstorming` is designed for feature design (question → design → spec → plan). Our use case in Sub-wave D is closer to «triage session» (review completed tasks, make decisions, batch-approve). The skill's HARD-GATE (don't write code until approved) is appropriate for our review path — it prevents premature action. However, SP `brainstorming` produces a spec doc; our batch-review path produces decisions/approvals, not a spec.
  - **In-session vs cross-session:** SP `brainstorming` is in-session — the exact right tool for the human's Top layer (maintainer-driven, in-session decisions). This is correct per the layered model.
  - **Bi-directional gap:** (a) SP covers the maintainer's in-session review session. (b) aif-handoff provides the cross-session task completion that produces the queue to review. Complementary, not overlapping.
  - **Evidence:** SKILL.md content fetched 2026-05-29.

---

- **`verification-before-completion`** — KEEP-REFERENCE (currently used at SKILL.md:675, 787)
  - **SP problem class:** Iron Law — «NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE». Gate function: IDENTIFY verification command → RUN → READ output → VERIFY → ONLY THEN claim.
  - **Our umbrella problem class:** Stage-gate verification in bridge (before marking a Sub-wave complete, run the relevant checks).
  - **T16 match?** Strong match as a discipline rule applicable to any verification step. Already integrated in our SKILL.md at Phase 4.5 (pre-PR self-audit). The bridge's stage gates should also apply this.
  - **Bridge-specific relevance:** The bridge's opt-in mechanism (SW-D Step 1 detection script) and the status read-back (SW-C) both require verification-before-completion discipline. This skill would be invoked inside bridge sub-waves, not replaced.
  - **Bi-directional gap:** (a) SP covers the in-session verification discipline. (b) aif-handoff provides the cross-session equivalent (task transitions to `done` state only after Reviewer passes) — complementary, not replacing.
  - **Evidence:** SKILL.md content fetched 2026-05-29.

---

- **`finishing-a-development-branch`** — KEEP-REFERENCE (currently used at SKILL.md:684, 687)
  - **SP problem class:** Verify tests → detect workspace state → present merge/PR/keep/discard options → execute choice → cleanup worktree. Announce at start: «I'm using the finishing-a-development-branch skill».
  - **Our umbrella problem class:** Sub-wave PR creation for bridge implementation commits.
  - **T16 match?** Match on PR creation phase — this skill should be invoked by each Sub-wave Worker when finishing their implementation. Already in our SKILL.md workflow.
  - **Bridge-specific relevance:** Sub-waves B, C, D produce code commits. Each would naturally invoke `finishing-a-development-branch` for the PR step. No change needed.
  - **Bi-directional gap:** (a) SP covers the in-session branch completion → PR pattern. (b) aif-handoff's Reviewer subagent covers the equivalent review-before-complete in the cross-session pipeline.
  - **Evidence:** SKILL.md content fetched 2026-05-29.

---

### Verdict summary table (9 SP skills)

| SP Skill | Verdict | Reason |
|---|---|---|
| `subagent-driven-development` | KEEP-REFERENCE | In-session; no overlap with cross-session bridge scope |
| `requesting-code-review` | KEEP-REFERENCE | In-session; Phase -1 already operationalises this |
| `using-git-worktrees` | KEEP-REFERENCE | Used for orchestrator self-setup; aif-handoff manages Worker worktrees internally |
| `dispatching-parallel-agents` | KEEP-REFERENCE | In-session parallel; aif-handoff covers cross-session parallel |
| `writing-plans` | KEEP-REFERENCE | SP-internal plan format; kickoff.md is different format |
| `executing-plans` | KEEP-REFERENCE | Requires human to open session; aif-handoff is autonomous |
| `brainstorming` | KEEP-REFERENCE | Correct for Top layer (maintainer in-session review); not cross-session |
| `verification-before-completion` | KEEP-REFERENCE | Discipline rule applicable in bridge sub-waves; not replaced |
| `finishing-a-development-branch` | KEEP-REFERENCE | PR creation pattern; invoke in SW-B/C/D Workers |

**STOP condition check (kickoff §7):** «if ≥2 Sub-waves of A/B/C/D already covered by Superpowers → restructure». Result: **0 sub-waves covered by SP**. STOP condition does NOT fire on this axis. SP is strictly in-session; the bridge is strictly cross-session. No shrinkage warranted from SP audit alone.

**T7 adversarial counter-prompt result:** «Could SP solve cross-session dispatch another way I missed?» DeepWiki confirmed: no. «Executing-plans» is the closest candidate; DeepWiki explicitly states it requires the user to manually open a new session. This is not a programmatic dispatch mechanism. Counter-prompt surfaces nothing new. T7 satisfied.

---

## §4 Companion-projects audit

### §4.1 Prior patch integration: `2026-05-26-companion-reuse-aif-handoff-autoqueue.md`

Read in full (2026-05-29). Key findings to build on, not re-derive:

- `autoQueueMode` algorithm (scheduling logic only): **ADOPT VOCABULARY** (tag schema `phase:N`, `seq:NN`) + **REFERENCE** (pool-slot-allocation algorithm). Match score revised from ~22% (full runtime) to **~45%** (algorithm sub-component). File: `2026-05-26-companion-reuse-aif-handoff-autoqueue.md:§0 TL;DR`.
- SSOT #67 REJECT for full Kanban runtime is preserved. This sub-wave does not touch that verdict.
- Proposed new SSOT row for `autoQueueMode-LOGIC` (sub-component) at next-available slot — **carried forward**: slot #85 is now available; proposed row in §7 below.

### §4.2 ai-factory (parent framework of aif-handoff)

**DeepWiki probe:** `lee-to/aif-handoff` — «What is the parent framework of aif-handoff?» (2026-05-29).

Key findings:
- aif-handoff is built on top of `ai-factory` framework: «Built on top of AI Factory workflow and powered by runtime profiles» (DeepWiki probe 2026-05-29).
- `ai-factory` is a devDependency in aif-handoff's `package.json`. aif-handoff's `packages/runtime/src/projectInit.ts` calls `ai-factory init --agents claude,codex` to initialize project structure.
- `ai-factory` provides: agent definitions (`.claude/agents/*.md`, `.codex/agents/*.toml`), skill system substrate, materialization of managed agent assets.
- **Capabilities NOT exposed by aif-handoff:** `ai-factory` itself handles the agent-definition substrate and materialization. aif-handoff adds the Kanban runtime, MCP server, REST API, WebSocket events, Docker infra on top of ai-factory's definitions. The unique value of aif-handoff is the autonomous pipeline orchestration — ai-factory alone does not provide this.
- **BFR §3 6-layer probe verdict for ai-factory:**
  - Problem class: «Agent definition substrate + skill system for multi-agent AI apps; no autonomous orchestration runtime».
  - Our problem class: «Cross-session runtime bridge dispatching Workers and reading back status».
  - T16 match: ~10%. ai-factory provides the agent-definition layer but not the runtime dispatch, Kanban state machine, or status read-back we need.
  - **Verdict: REFERENCE** — ai-factory is the parent framework that aif-handoff extends; evaluating aif-handoff as our runtime candidate is equivalent to evaluating ai-factory's runtime-extension layer. No direct adoption of ai-factory itself is warranted for this umbrella.

**Adversarial counter-prompt (T7):** «Does ai-factory expose any runtime dispatch that aif-handoff doesn't?» DeepWiki: ai-factory's role is agent definitions + skill system; runtime dispatch is entirely in aif-handoff's packages. No unique ai-factory surface for our use case. T7 satisfied.

### §4.3 amux (`mixpeek/amux`)

**Cost-class probe (load-bearing, executed first per kickoff requirement):**

DeepWiki probe 1 — «Does amux call Anthropic API directly or spawn `claude` CLI as subprocess?» (2026-05-29): «amux primarily runs Claude tasks by spawning the `claude` command-line interface (CLI) as a subprocess… executed using `subprocess.run`… the `cmd` variable is set to `"claude"`». Evidence: `amux-server.py` `start_session` function.

DeepWiki probe 2 — «Does amux work with Claude Max/Pro subscription (OAuth) or require API key?» (2026-05-29): «amux is designed to work with both… it checks for the presence of an OAuth token in `~/.claude.json`. If an OAuth token is found, amux explicitly blanks out the `ANTHROPIC_API_KEY` environment variable… If `_has_oauth` is `True`, `amux` sets `ANTHROPIC_API_KEY` to an empty string». Evidence: `amux-server.py` `_has_oauth` detection block.

**Cost-class verdict: `subscription-bundled (OAuth-first)`** — amux is OAuth-first; ANTHROPIC_API_KEY is optional fallback. On a Max subscription with OAuth login, amux uses the subscription with no API key required.

**June 15 caveat (same as aif-handoff):** amux spawns `claude -p` (the `claude` CLI in subprocess mode). Post-June 15, 2026, `claude -p` usage draws from the Agent SDK credit pool ($100-$200/month Max), not the unlimited interactive quota. This applies equally to amux and aif-handoff. Not a disqualifying difference between the two candidates.

**Machine-readable status API:**

DeepWiki probe 3 — «Does amux provide machine-readable API for task status monitoring?» (2026-05-29): «Yes, amux provides a machine-readable API… REST endpoint and CLI commands that return structured output, primarily JSON.» Endpoints: `GET /api/sessions` (all sessions JSON), `GET /api/sessions/:name/meta` (metadata), `GET /api/sessions/:name/peek?lines=N` (terminal output), `GET /api/events` (Server-Sent Events stream). CLI: `amux ls`, `amux sessions`. Agent-to-agent orchestration via REST API for peer-discovery and task delegation.

DeepWiki probe 4 — «Does amux support MCP server interface?» (2026-05-29): amux is an MCP **client** (configures MCP servers for its agents), **not** an MCP server. External orchestrators connect via REST, not MCP.

**T16 problem-class match for amux:**
- **Upstream problem class:** «AI coding agent multiplexer — spawn and manage parallel Claude Code sessions (via tmux); provide web dashboard + REST API + SSE for monitoring; enable agent-to-agent coordination via shared kanban board + global memory; self-healing watchdog on context overflow/crash».
- **Our umbrella problem class:** «Cross-session runtime bridge — dispatch Workers from meta-orchestrator kickoff output, monitor status, read back results to state.md».
- **Match? ~55%.** Matches on: subscription-bundled (OAuth), spawns `claude` CLI, parallel multi-session management, machine-readable status API, agent-to-agent coordination. Mismatches on: amux uses REST API (not MCP `handoff_create_task`); amux has no structured Planner/Implementer/Reviewer pipeline (sessions are free-form Claude Code instances, not structured subagent types); amux uses `amux board add` for task creation (kanban card model, lighter weight than aif-handoff's PLAN.md + state machine); amux reads status via REST not WebSocket.
- **Key structural difference from aif-handoff:** amux sessions are general-purpose Claude Code instances (agents coordinate via REST + shared memory); aif-handoff sessions are Planner/Implementer/Reviewer-typed with structured transitions. For our use case (dispatch a meta-orch kickoff → execute → report back), **amux's lighter REST-only model may be more appropriate** — we don't need the aif-handoff Planner subagent's PLAN.md generation (which is the source of blocker (i) PLAN.md disk coupling).

**Verdict: ADOPT-candidate** (equal candidate to aif-handoff for the runtime-bridge role; slightly better T16 match on our specific dispatch-only need). Cost-class: `subscription-bundled` (OAuth-first), same June 15 caveat as aif-handoff.

**SSOT new row proposed: #85** (see §7).

### §4.4 claude-squad (`smtg-ai/claude-squad`)

**Machine-callable surface probe:**

DeepWiki probe — «Does claude-squad offer any machine-callable API for programmatic task creation/monitoring?» (2026-05-29): «Claude Squad does not expose a REST API, WebSocket, or a direct stdin/stdout protocol for programmatic control beyond the daemon and CLI flags.» The daemon mode (`--daemon` flag) automates prompt acceptance (AutoYes) only. CLI flags available: `--program -p` (specify program), `--autoyes -y` (auto-accept), `reset` (reset instances). No structured output for orchestrator consumption.

**T16 match:**
- **Upstream problem class:** «Terminal app for humans to manage multiple AI coding assistants (Claude Code, Codex, OpenCode, Amp) with visual TUI; tmux-backed session management; daemon mode auto-accepts prompts».
- **Our umbrella problem class:** «Programmatic cross-session dispatch with structured task-creation API and status read-back».
- **Match? ~10%.** Claude-squad is human-TUI-first; the only programmable interface is the daemon AutoYes mode (auto-accepts prompts, not task creation) and basic CLI flags. No REST API, no structured output, no task-creation primitive.

**Verdict: REJECT** for runtime-bridge role. Cost-class: `subscription-bundled` (spawns `claude` CLI), but the missing machine-callable API makes it unsuitable for programmatic dispatch. Not a viable candidate.

### §4.5 oh-my-openagent (Sisyphus loop pattern)

Per `feedback_ai_doc_research_priority_pool` memory entry (cited by name per kickoff instruction) + SSOT #61/#68/#81/#83:

- **Prior evaluation:** oh-my-openagent (OhMyOpencode) covers in-session multi-agent orchestration (Prometheus/Metis/Momus/Oracle/Atlas pipeline). SSOT #68: T16 match to our meta-orchestrator ~30% (single session, OpenCode plugin, ≠ cross-session CC). SSOT #83: Atlas+Prometheus → ADOPT VOCABULARY for orchestrator dispatch+verification loop.
- **T16 for runtime-bridge role:** oh-my-openagent operates within a single OpenCode session (all subagents are in-session). No cross-session daemon or persistent task state. Same in-session limitation as SP skills.
- **Verdict: REFERENCE** for runtime-bridge role (same as existing SSOT verdict for meta-orchestrator scope). Sisyphus loop pattern (autonomous retry until success) is a REFERENCE precedent for aif-handoff's self-healing watchdog — already acknowledged in SSOT #45 (aif-handoff Watchdogs, ADAPT). Not a runtime-bridge candidate.
- **New finding:** the Sisyphus/Hephaestus pattern from `feedback_ai_doc_research_priority_pool` specifically covers autonomous CI-feedback dispatch loops. This is structurally closer to amux's self-healing watchdog than to a structured Planner/Implementer/Reviewer pipeline. Confirms amux as a REFERENCE precedent for Sisyphus-class self-healing in the bridge context.

### §4.6 superset-sh/superset

Per `project_meta_orch_mode_triage_done` memory entry (cited) + `project_superset_adopt_survey_deferred` memory entry:

- **Prior evaluation (2026-05-29 deferred survey):** «superset-sh/superset swarm-orch ADOPT candidate; BFR §3 6-layer запускается ПОСЛЕ мержа dispatch-worktree-automation umbrella». The survey was deferred to post-SW-A of THIS umbrella.
- **Available prior finding from `project_meta_orch_mode_triage_done`:** «superset-sh/superset REFERENCE only (no structured readback API; 2/4 pain coverage)». This was assessed in the meta-orch mode-triage context.
- **T16 for runtime-bridge role:** superset-sh/superset is described as a mobile-app + notification-channel candidate in `project_superset_adopt_survey_deferred`. No structured task-creation API or machine-readable status comparable to aif-handoff MCP or amux REST.
- **Per kickoff §3 item 4 instruction:** «superset-sh/superset — DO NOT re-audit. Already evaluated as REFERENCE only (no structured readback API; 2/4 pain coverage). Document the prior finding.» Followed.
- **Verdict: REFERENCE** — prior finding preserved. May serve as a notification-channel example for SW-D Step 3c (mobile push notification path), but NOT as a runtime-bridge candidate.

---

## §5 Consolidated verdict table

### Superpowers skills (9)

| Skill | Verdict | Cost-class | Bi-directional gap (SP covers / aif-handoff uniquely provides) |
|---|---|---|---|
| `subagent-driven-development` | KEEP-REFERENCE | N/A | SP: in-session delegation / aif-handoff: detached worker execution |
| `requesting-code-review` | KEEP-REFERENCE | N/A | SP: in-session review / aif-handoff: autonomous Reviewer subagent |
| `using-git-worktrees` | KEEP-REFERENCE | N/A | SP: orchestrator self-setup / aif-handoff: Worker worktree management |
| `dispatching-parallel-agents` | KEEP-REFERENCE | N/A | SP: in-session parallel / aif-handoff: cross-session parallel via `parallelEnabled` |
| `writing-plans` | KEEP-REFERENCE | N/A | SP: in-session plan docs / aif-handoff: autonomous Planner subagent |
| `executing-plans` | KEEP-REFERENCE | N/A | SP: human-initiated execution / aif-handoff: autonomous worker daemon |
| `brainstorming` | KEEP-REFERENCE | N/A | SP: in-session design/review / aif-handoff: cross-session task dispatch |
| `verification-before-completion` | KEEP-REFERENCE | N/A | SP: in-session verification discipline / aif-handoff: Reviewer subagent pass/fail |
| `finishing-a-development-branch` | KEEP-REFERENCE | N/A | SP: in-session PR creation / aif-handoff: task `done` state transition |

### Companion projects (5)

| Project | Verdict | Cost-class | T16 match % |
|---|---|---|---|
| **amux** (`mixpeek/amux`) | ADOPT-candidate | `subscription-bundled` (OAuth-first); June 15 credit-pool caveat | ~55% |
| **ai-factory** (`lee-to/ai-factory`) | REFERENCE | N/A (design-time agent definitions, no runtime) | ~10% |
| **claude-squad** (`smtg-ai/claude-squad`) | REJECT | `subscription-bundled` (spawns `claude` CLI) | ~10% |
| **oh-my-openagent** | REFERENCE | `subscription-bundled` (OpenCode plugin) | ~30% (meta-orch scope per SSOT #68) |
| **superset-sh/superset** | REFERENCE | N/A (notification-channel only) | ~5% (runtime-bridge scope) |

---

## §6 Critical new finding: June 15, 2026 Agent SDK credit split

This finding was NOT surfaced in the predecessor R-phase (PR #283) and materially changes the cost-safety premise of the umbrella.

### Evidence (file:line / URL)

1. **code.claude.com/docs/en/headless** (WebFetch 2026-05-29): «Starting June 15, 2026, Agent SDK and `claude -p` usage on subscription plans will draw from a new monthly Agent SDK credit, separate from your interactive usage limits.» (Note box at top of page.)
2. **support.claude.com/en/articles/15036540** (WebFetch 2026-05-29): «Claude Agent SDK and `claude -p` usage no longer counts toward your Claude plan's usage limits.» Credit amounts: Max 5x = $100/month, Max 20x = $200/month. Credits expire monthly, do not roll over. «Once your monthly credit depletes, additional usage shifts to standard API rates if usage credits are enabled.»
3. **April 4, 2026 policy change:** Anthropic blocked Pro/Max subscriptions from third-party agent frameworks. aif-handoff CLI transport uses `claude -p`; this is the Agent SDK surface. Post-April-4, `claude -p` draws from the new Agent SDK credit pool, not the interactive subscription.
4. **aif-handoff README** (WebFetch 2026-05-29): The README warns about SDK transport risk («may violate these terms») and recommends CLI transport as safe. This guidance was written **before** the June 15 credit-split announcement. The CLI transport is still **ToS-compliant** (it routes through the official Claude Code CLI binary), but it is **no longer cost-unlimited** post-June 15.

### Implication for the umbrella

| Scenario | Pre-June-15 | Post-June-15 |
|---|---|---|
| aif-handoff CLI transport, light use (≤10 autonomous tasks/month) | Subscription-unlimited | $100-$200 credit covers; probably no overflow |
| aif-handoff CLI transport, heavy use (100+ tasks/month) | Subscription-unlimited | Credit exhausted within days → billed at API rates |
| amux (same `claude` CLI subprocess) | Same as aif-handoff | Same credit-pool caveat applies equally |

**The maintainer's explicit preference** (memory `project_superset_adopt_survey_deferred`): «prefer subscription-bundled if found; metered amux is acceptable only as last resort». Post-June 15, both aif-handoff and amux are in the **same cost category**: subscription-bundled up to the monthly credit cap, then metered beyond. Neither is strictly unlimited.

### Decision required from maintainer

**DECISION-NEEDED (surfaces to orchestrator, not a reviewer strategy pick):**

> **Option A — Proceed with umbrella, accepting June 15 credit-pool reality.** aif-handoff CLI transport and amux both draw from the $100-200/month Agent SDK credit. For the maintainer's stated use case («избавить меня от ручного труда копировать промты и запускать в новые сессии» — light autonomous use), the credit cap is likely sufficient. Sub-wave A should verify actual per-invocation token cost to estimate monthly credit consumption.
>
> **Option B — Defer umbrella until usage profile is known.** Run one manual autonomous batch using aif-handoff CLI transport, measure actual `total_cost_usd` per task (available in `claude -p --output-format json` response), then re-evaluate whether the $100-$200 credit is sufficient.
>
> **Option C — Close umbrella as REJECT, use amux instead of aif-handoff.** amux has better T16 match (~55% vs ~28%), lighter REST API (no PLAN.md disk coupling blocker), and same cost-class. The bridge scope would be smaller (SW-A/B sufficient; no WebSocket consumer needed — amux uses REST+SSE). Tradeoff: loses aif-handoff's structured Planner/Implementer/Reviewer pipeline (but that pipeline introduces aif-handoff's 3 ADOPT-blockers from the predecessor synthesis).

---

## §7 Concrete recommendation on Sub-waves A/B/C/D

Based on §6 DECISION-NEEDED, two branches:

### If maintainer chooses Option A or B (proceed or defer):

**No SP-driven shrinkage** (confirmed: 0 SP skills overlap the bridge scope). Sub-waves A/B/C/D structure unchanged from kickoff. However:

- **Sub-wave A must be expanded** to include the June 15 credit-split finding: verify per-invocation cost via `claude -p --output-format json` + `total_cost_usd` field. This is now a LOAD-BEARING probe that the predecessor kickoff §3 did not include. SW-A research-patch §7 STOP condition must include: «if projected monthly token cost × expected invocation frequency > $200/month credit → HALT and surface to maintainer as cost-metering risk».
- **Sub-wave D must update the setup guide** to document the June 15 credit-pool change: consumers must know their `claude -p` budget is capped. The setup guide currently (per kickoff §3 SW-D Step 2) plans to document `transport: "cli"` as cost-safe; it must now add: «Note: `claude -p` usage draws from your Agent SDK credit ($100-$200/month as of June 15, 2026). Monitor usage at [Anthropic usage dashboard].»

### If maintainer chooses Option C (amux instead):

**Major restructuring.** amux replaces aif-handoff as the runtime-bridge candidate:

- **SW-A → amux transport verification** (instead of aif-handoff CLI transport): verify amux uses OAuth correctly, confirm `GET /api/sessions` returns structured status, measure cost per session.
- **SW-B → amux bridge dispatch hook**: `amux board add <title>` REST call (instead of MCP `handoff_create_task`). Simpler bridge — REST POST, no PLAN.md disk coupling. Blocker (i) **eliminated** in this path.
- **SW-C → amux status read-back via REST+SSE** (instead of WebSocket): `GET /api/events` SSE stream or polling `GET /api/sessions/:name/meta`. Blocker (ii) (WebSocket broadcast no-topic-filter) **eliminated** — amux has session-specific REST endpoints.
- **SW-D → amux setup script** (instead of aif-handoff setup): simpler — amux is a Python single-file server (`amux-server.py`), no Docker required for development use.
- **Net effect:** SW-A+B+C+D all simplify significantly. The 3 ADOPT-blockers from the predecessor synthesis (PLAN.md disk coupling, WebSocket broadcast, autoMode Reviewer conflict) are all **eliminated** in the amux path because amux has no Planner subagent and no WebSocket broadcast topology.

### SSOT new row proposals (append-only)

**Row #85 (amux REST dispatch API):**
- Capability: `mixpeek/amux` REST API for cross-session agent dispatch — `GET /api/sessions`, `POST /api/sessions`, `GET /api/events` (SSE), `amux board add` — enables external orchestrators to create and monitor parallel Claude Code sessions programmatically; OAuth-first (uses `claude` CLI subprocess, blanks ANTHROPIC_API_KEY when OAuth detected).
- Our use: Runtime-bridge candidate for `aif-handoff-runtime-bridge-iphase` umbrella; ADOPT-candidate for SW-B/C if Option C chosen.
- Verdict: ADOPT-candidate (pending maintainer Option A/B/C decision).
- T16: Upstream problem class = «AI coding agent multiplexer for parallel unattended sessions, web dashboard + REST+SSE monitoring, agent coordination via shared kanban board»; our problem class = «cross-session Worker dispatch with structured status read-back». Match ~55%.
- Evidence: DeepWiki 3 probes (2026-05-29); WebSearch (2026-05-29); amux.io WebSearch.

---

## §8 AI traps instantiation (per kickoff §T-traps requirement)

**T1 (sampling floor ≥5):** Applied. For each negative-existence claim: SP cross-session → 2 DeepWiki probes + 1 SKILL.md fetch per SP skill (9 fetches total) = >5 probes before claiming «SP is in-session only». amux cost-class → 2 DeepWiki probes + 2 WebSearches + 2 WebFetches. T1 satisfied across all major claims.

**T3 (file:line / command-output):** Applied. All claims cite either: (a) DeepWiki probe URL + source function name, (b) WebFetch URL + quoted text, (c) WebSearch result URL. Examples: amux OAuth handling → `amux-server.py _has_oauth` block (DeepWiki 2026-05-29); June 15 credit split → `code.claude.com/docs/en/headless` note box text (WebFetch 2026-05-29); SP cross-session absence → DeepWiki explicit quote «no skills support cross-session dispatch» (2026-05-29).

**T7 (adversarial counter-prompt):** Applied on two key claims: (a) «SP does not cover cross-session» — counter-prompt «could `executing-plans` solve this another way?» → DeepWiki probe confirms «user manually launches a new session», not programmatic dispatch. (b) «amux is OAuth-first» — counter-prompt «does amux still require API key in some configs?» → DeepWiki probe 2 confirms ANTHROPIC_API_KEY is optional; OAuth blanks it. Both counter-prompts satisfied.

**T11 (prior-art search):** Fully applied via §1 BFR §3 6-layer probe. 9 DeepWiki probes + 6 WebSearches + 6 WebFetches this sub-wave. No layer skipped. SSOT consulted for all existing rows.

**T12 (DeepWiki/WebFetch at research-time, not training-data):** Critical for the June 15 credit-split finding — training-data cutoff (August 2025) predates both the April 4 policy change and the June 15 announcement. Both findings sourced from live WebFetch (code.claude.com, support.claude.com, 2026-05-29).

**T13 (re-verify ADOPTED items):** SP skills re-verified against live SKILL.md fetches (all 9 fetched 2026-05-29). SP `using-git-worktrees` SKILL.md confirmed still describes the same Step 0 logic (GIT_DIR≠GIT_COMMON guard) as SSOT #65. No regression found.

**T15 (self-application):** This patch's own §9 §1.7 walk applies the discipline to itself. Forward + backward check below.

**T16 (problem-class match per item):** Applied for all 9 SP skills and 4 companion projects (explicit «SP problem class / Our problem class / Match? / Evidence» format).

**T20 (inline-verdict-without-evidence):** No verdicts issued without prior tool-call evidence in the same research step. All verdicts cite specific DeepWiki output, WebFetch URL, or WebSearch result.

**Domain-specific trap (T-Pre-A-1 — Policy-change blindspot):** This sub-wave defines a new domain-specific trap: **T-Pre-A-1 — Cost-safety premise not re-verified against current ToS/billing docs.** The predecessor R-phase evaluated aif-handoff CLI transport as «subscription-bundled, cost-unlimited» based on the README (written pre-April 2026). Any future R-phase evaluating tool cost-class MUST include a live WebFetch of the provider's current billing documentation (not README self-description). Billing policies change faster than READMEs. Falsifier: live docs (WebFetch) contradict README cost claim → escalate before proceeding.

---

## §9 §1.7 self-reflexive check

### Forward checks

1. **`build-first-reuse-default.md §3`** — Applied: 6-layer BFR probe executed (§1). DeepWiki ≥3 phrasings ✅. WebSearch ≥3 phrasings ✅. SSOT consulted ✅. No BUILD recommendation made without prior-art check.

2. **`no-paid-llm-in-ci.md`** — This patch is a markdown research document. No CI pipeline invocations, no LLM API calls in CI. All probes are session-bound (DeepWiki MCP + WebFetch via session tools). ✅

3. **`reviewer-discipline.md §2`** — This patch surfaces DECISION-NEEDED (§6) without picking between Options A/B/C. The reviewer role does not select the option; it surfaces the evidence and consequence of each path. «Option A → consequence X / Option B → Y / Option C → Z, maintainer decides.» ✅

4. **`doc-authority-hierarchy.md §3`** — Header present with `Authoritative for` / `NOT authoritative for` blocks. Folder-level authority inherited from `docs/meta-factory/research-patches/` README. ✅

5. **`phase-research-coverage.md §1.7`** — This is the §1.7 walk itself. Forward-check coverage: all 4 rules verified. Backward-check below.

### Backward checks

1. **SSOT rows affected:** This patch proposes new row #85 (amux). Existing rows #27/#28/#30/#43/#44/#67 (aif-handoff) are not modified — their verdicts stand. The June 15 credit-split finding is an additive note to #30 and #44's «Trigger to revisit» fields (both note «Phase 11+ autonomous orchestration» as trigger; post-June-15 billing reality should be registered as an additional note). However, per `CLAUDE.md Artifact Ownership Contract` — `prior-art-evaluations.md` is owned by «phase research sessions, capability-commit authors» and is append-only. This patch proposes row #85 as an additive note but does NOT itself land the row (research-only sub-wave; no code changes).

2. **Kickoff `aif-handoff-runtime-bridge-iphase/kickoff.md` affected:** §1 fact 1 («subscription-bundled, ToS-safe») needs an addendum noting the June 15 credit-split. This patch surfaces the finding; the kickoff amendment is a separate step (orchestrator's responsibility to update the kickoff per Phase -1 protocol if DECISION=A chosen).

3. **Predecessor patches affected:** None. The 5 predecessor `aif-handoff-bridge-*` patches' verdicts are not changed by this patch (DEFER ALL was the synthesis verdict; this patch addresses the conditional reversal premise, not the variant verdicts themselves).

4. **`session-bootstrap.md` / `CLAUDE.md`:** No changes warranted. This patch is additive research.

5. **Prior research-patches affected:** `2026-05-26-companion-reuse-aif-handoff-autoqueue.md` — integrated (§4.1), not superseded. `2026-05-26-companion-reuse-omo-deep-dive.md` — cited for SSOT #81 oh-my-openagent owner disambiguation; not changed.

---

## §10 Commit and PR metadata

- **Branch:** `research/superpowers-reuse-audit`
- **Base:** `origin/staging`
- **Commit subject:** `research(superpowers-reuse): Sub-wave Pre-A audit for runtime-bridge BUILD scope`
- **Prior-art trailer:** Not required — this is a research output file (markdown, no new dep, no file ≥80 LOC under `packages/`, no capability commit per CLAUDE.md definition).
