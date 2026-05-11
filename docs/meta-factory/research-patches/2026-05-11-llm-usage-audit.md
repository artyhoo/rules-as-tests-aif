# LLM usage audit — full map (current + planned + speculative)

> **Authoritative for:** complete inventory of LLM touchpoints in rules-as-tests-aif project (2026-05-11 snapshot); cost classification per touchpoint per «Claude Code subscription bundle» vs «paid API» distinction; synthesis recommendations for «no-paid» constraint regime.
> **NOT authoritative for:** Wave 7/5 implementation decisions — those are owned by respective sub-wave kickoffs. Project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
> **Date:** 2026-05-11
> **Branch:** wave-7-hot-checks-joint-closure

---

## §1 Methodology

**Execution context** determines cost:

- **Claude Code session** (operator runs `claude` CLI, opens skill, agent task) — covered by Claude Code subscription bundle. No per-token billing. Operator's machine, operator's session. Includes: skill invocations, sub-agent delegations triggered via `/aif-verify`, MCP calls from within a session.
- **GitHub Actions CI** (`.github/workflows/*.yml`, triggered on push/PR/schedule) — runs outside any subscription bundle. Every LLM call in CI is a paid Anthropic API call (or requires injecting an `ANTHROPIC_API_KEY` secret — per-call cost regardless of source).
- **Consumer-side install** (`install.sh`, `setup.sh`, post-install artifacts) — depends on consumer's own Claude Code subscription. If consumer has Claude Code: free. If not: paid or unavailable. Framework cannot guarantee subscription. Must treat as «hybrid» — not free by default.
- **Background services / cron** — separate from any session, always paid.

**Who invokes**: operator (framework author), consumer (downstream project), CI system, AIF workflow runtime.

**When fires**: edit-time (harness hooks), commit-time (pre-commit/pre-push), PR-time (CI), session-start (Step 0), on-demand (skill activation / `/aif-verify`).

**Cost class labels used below:**
- **FREE** — covered by Claude Code subscription (session-bound).
- **PAID-CI** — GitHub Actions, paid per call.
- **HYBRID** — free if consumer has Claude Code subscription, paid otherwise.
- **N/A** — not an LLM call (deterministic, bash, AST, etc.).

---

## §2 Current LLM touchpoints (already shipped)

| # | Touchpoint | Where | Execution context | Who invokes | Cost class | Notes |
|---|---|---|---|---|---|---|
| T1 | **AIF `/aif-verify` — `best-practices-sidecar`** sub-agent | `agents/best-practices-sidecar.md` | Claude Code session (consumer project) | Consumer (via `/aif-verify`) | **FREE** | LLM reads diff, checks against RULES.md; runs automated checks via `run_command` tool. Fires in-session only. |
| T2 | **AIF `/aif-verify` — `review-sidecar`** sub-agent | `agents/review-sidecar.md` | Claude Code session (consumer project) | Consumer (via `/aif-verify`) | **FREE** | Two-AI review pattern — separate model reviews diff; `model: opus` override per [aif-comparison.md §4](../aif-comparison.md). Session-bound. |
| T3 | **AIF `/aif-verify` — `docs-auditor`** sub-agent | `agents/docs-auditor.md` | Claude Code session (consumer project) | Consumer (via `/aif-verify`) | **FREE** | Runs `audit-ai-docs.sh` and interprets; LLM for interpretation only; underlying script is deterministic bash. Session-bound. |
| T4 | **AIF `/aif-rules-check`** — LLM judge advisory | `agents/` surface + AIF integration | Claude Code session (consumer) | Consumer (via AIF workflow) | **FREE** | LLM reads RULES.md + diff, gives advisory PASS/WARN/FAIL. Soft advisory — source of truth is toolchain. NOT shipped by this framework directly; consumed via AIF dependency. |
| T5 | **`.claude/skills/self-reflection/`** — §1.7 gate | `.claude/skills/self-reflection/SKILL.md` | Claude Code session (framework author) | Operator / skill auto-trigger | **FREE** | LLM checks forward+backward compliance; skill is session-bound, invoked on keyword match or explicit `/self-reflection`. No CI component. |
| T6 | **context7 MCP** — doc fetch in sessions | Via `mcp__context7__query-docs` | Claude Code session (framework author) | Operator (research sessions, aif-comparison, Wave research) | **FREE** | MCP call happens within the session; context7 has a free tier (rate-limited). No CI integration — all current uses are interactive research sessions. |
| T7 | **`audit-self.yml` CI jobs** — ALL deterministic | `.github/workflows/audit-self.yml` | GitHub Actions | CI (push/PR) | **N/A (no LLM)** | All 12 CI jobs (mechanical, rule-to-probe, probe-tests, manifest-render, principles-meta-tests, husky-presence, framework-self-install-ts/rn, framework-self-detect, framework-self-research, framework-self-synth, framework-self-validate, framework-self-install-validated, phase-8-canonical-regen) are purely deterministic — bash, node scripts, vitest, jq. Zero LLM calls. |
| T8 | **`discipline-self-check.yml`** — PR body gate | `.github/workflows/discipline-self-check.yml` | GitHub Actions | CI (PR) | **N/A (no LLM)** | Pure bash grep on PR description body. No LLM. |
| T9 | **`.husky/pre-push`** — all 7 probes | `.husky/pre-push` | Developer machine, pre-push | Operator (git push) | **N/A (no LLM)** | actionlint, zizmor, audit-ai-docs.test.sh, render-rules --check, principles vitest, spec-validate (dormant), prior-art trailer — all deterministic. |
| T10 | **AIF `/aif` onboarding skill** — stack detection + tool proposal | AIF dependency (`/lee-to/ai-factory`) | Claude Code session (consumer) | Consumer (session start) | **FREE** | Per §13.25 Wave 5 research — AIF `/aif` runs stack detection + skills.sh registry lookup + MCP proposal in-session. Covers user rules 1-4 of §13.25. Not built by this framework — reused from AIF dependency. |
| T11 | **AIF `/aif-evolve`** — rule mining from patches | AIF dependency | Claude Code session (consumer) | Consumer or operator | **FREE** | LLM mines accumulated fix patches → generates project-specific rules. Relevant to §13.10 entry #2 (Path A LLM gen precedent). Session-bound. |

**assumption:** AIF's `review-sidecar` uses `model: opus` override per [aif-comparison.md §4](../aif-comparison.md) — this is AIF's declared capability, but whether the consumer's Claude Code session has Opus access within the subscription bundle is assumption: depends on subscription tier. Sonnet 4.6 is the baseline guaranteed under standard bundle.

---

## §3 Planned LLM touchpoints (in open-questions / armed)

### §13.7 — L2 semantic drift detection v2

**Status:** v1 deterministic shipped (symbolic modal-verb + term-presence over 3 canonical sources, `framework-self-research` CI gate). v2 trigger OPEN.

**v2 shape:** embedding-based semantic similarity (§13.7 OPEN v2 trigger). Would require calling an embedding API (Anthropic or third-party) in CI per commit.

**Cost class:** PAID-CI if implemented in GitHub Actions (embedding API calls per research commit). FREE if run as manual researcher check in Claude Code session. Design choice exists.

**Recommendation (no-paid):** keep v2 as session-only check — `meta-factory research --self --semantic` invoked by operator in Claude Code, NOT in CI.

---

### §13.10 entry #1 — L2 LLM-driven research extension

**Shape:** context7 MCP + Anthropic `web_search_20250305` with `allowed_domains`, called to extend research beyond curated store for non-curated frameworks.

**Trigger:** first real consumer reports a research gap on non-curated framework, OR Phase 8 acceptance shows curated store insufficient. NOT yet fired.

**Cost class if CI:** PAID-CI. Every `meta-factory research` run in CI for a consumer would call Anthropic API.

**Cost class if session:** FREE. If `meta-factory research` runs inside a Claude Code session (interactive), covered by subscription.

**Recommendation (no-paid):** ship as **operator-session tool only**. Consumer runs `meta-factory research` in their Claude Code session, not in their CI. Results cached in `research-cache.json` (deterministic replay thereafter). CI reads cache — no LLM in CI.

---

### §13.10 entry #2 — Path A LLM gen (picks ESLint plugins from menu)

**Shape:** LLM receives detected stack + research cache → selects existing ESLint plugin configurations from predefined menu. In-session, runs inside Claude Code session or AIF workflow.

**Trigger:** recipe count exceeds 15 AND ≥3 framework targets concurrently shipped AND no single hand-curated preset fits all surfaces. NOT yet fired.

**Cost class:** FREE if invoked inside Claude Code session. The «LLM picks from menu» action is a session task — part of operator's or consumer's interactive session.

**Risk:** if packaged as a CLI subcommand calling the Anthropic API directly (not inside Claude Code), becomes PAID. Design constraint for «no-paid»: LLM gen MUST run inside a Claude Code skill or AIF workflow, never as standalone API-calling CLI.

---

### §13.10 entry #3 — Path B AST gen (LLM writes ESLint rule TypeScript)

**Shape:** LLM generates `eslint-rule.ts` + `rule-tester.test.ts` from pattern description. Requires human-review checkpoint.

**Trigger:** Path B activation (Phase 9+) — new pattern with no existing ESLint plugin.

**Cost class:** FREE if operator runs in Claude Code session with explicit prompt (session-bound generation). PAID if automated in CI or called via API directly.

**Recommendation (no-paid):** keep as session-only, human-in-the-loop step. Operator generates in Claude Code session, reviews diff, commits manually. No CI automation of LLM code generation.

---

### §13.10 entry #4 — Gate 5 two-AI review via `review-sidecar` (Opus)

**Shape:** AIF `review-sidecar` with `model: opus` reviews entire rule plan — one invocation per validate run (~$0.29 cold per [§13.11 cost arithmetic](../open-questions.md)).

**Trigger:** Phase 8 cost-scope decision done (invocation shape SSOT'd); verification gate (FP rate <20% on 10+ real PRs) still pending.

**Cost class:** FREE if invoked inside Claude Code session via `/aif-verify`. AIF routing is session-bound. PAID if called via Anthropic API directly from CI.

**Note on Opus access:** assumption: Claude Code subscription bundle includes Sonnet as baseline; Opus access depends on subscription tier. If consumer only has Sonnet subscription, `model: opus` override may fall back to Sonnet or require API key injection. Per [§13.11](../open-questions.md) cost arithmetic, Opus list pricing is $5/M input / $25/M output — per-call cost if outside subscription.

**Recommendation (no-paid):** Gate 5 must remain session-bound (`/aif-verify` in Claude Code, not in CI). If CI validation ever runs Gate 5, inject as an advisory-only non-blocking job with explicit cost cap.

---

### §13.10 entry #5 — Gate 3 mutation testing via Stryker

**Shape:** Stryker mutes AST-logic of generated ESLint rule, tests must kill mutants. Pure JavaScript toolchain — **not an LLM call**.

**Cost class:** N/A (no LLM). CI-safe. Included here to close the §13.10 entry listing.

---

### §13.11 — LLM cost model + tracking

**Status:** OPEN, v2 trigger. No infrastructure built yet.

**Proposed storage:** `<consumerRoot>/.ai-factory/synthesizer-output/llm-cost-log.json`.

**Cost class:** tracking itself is N/A (file write). Aggregation queries from log = N/A. The tracked things are PAID or FREE depending on invocation context per above entries.

---

### §13.12 — Real-corpus validation strategy

**Shape:** run meta-factory against real Next.js codebase, check false-positive rate. Likely includes running validator gates on real rules — some gates (Gate 2, 4, 6) are deterministic; Gate 5 (two-AI) is LLM.

**Cost class:** Gate 5 component PAID-CI if in automated pipeline. FREE if done as researcher session.

**Recommendation (no-paid):** real-corpus validation = researcher session task, not CI automation. Operator/researcher runs session, saves results to `research-patches/` as evidence. CI does not run real-corpus gate.

---

### §13.25 — Project-Aware Tool Bootstrapping (MCP discovery)

**User's question:** where does it execute? Free or paid?

**Finding from Wave 5 research:** AIF `/aif` already implements rules 1-4 (stack detection → tool proposal → Y/n confirmation → on-demand skill loading). This is an AIF workflow running inside a **Claude Code session** — **FREE**.

Rules 5-6 (incrementality + reject-memory) are gaps in AIF and in all surveyed frameworks. If implemented:

- **Rule 5 incrementality:** detecting new deps via changed `package.json` is deterministic (file watch / CI changed-files action). Proposing tools for new deps is a session task if run in Claude Code — **FREE**.
- **Rule 6 reject-memory:** file-based persistence (`.ai-factory/declined-mcps.json` or similar) — **N/A (no LLM)**, just JSON read/write.

**Cleanest path under «no-paid»:** reuse AIF `/aif` for rules 1-4 (free, session-bound). Build rules 5-6 as a small skill or file-write mechanism invoked in-session. No CI component, no background service, no standalone API caller.

**Recursive bootstrap note (from §13.25):** context7 itself is a likely first recommendation from any MCP discovery tool. context7 has a free tier; its MCP call inside a session is subscription-covered.

---

### §13.27 — LLM-judge probe for functional template test

**Status:** Wave 7 Decision 3 closed as DEFER (ship deterministic P1+P4+P6 only; LLM-judge deferred).

**Shape if built:** LLM receives rendered `AGENTS.md` and is asked to reproduce consumer project's goal phrase (probe P1), taxonomy fidelity (P6). Essentially: «given this doc, what is the consumer AI's goal?»

**Cost class:** PAID-CI if in `audit-self.yml`. FREE if run as a researcher's session check.

**Decision 3 rationale (from Wave 7 verdicts §2 D3):** «pilot semantic probe pays full Claude API cost (≥$0.05/run × N tests × 2 stacks) + flakiness risk (rubric calibration unstable on first invocation per §13.11) without immediate evidence motivating it. Deterministic baseline must accumulate ≥30 days of pass/fail data before LLM-judge becomes load-bearing.»

**Recommendation (no-paid):** DEFER aligns perfectly with «no-paid» constraint. Deterministic probes only in CI; LLM-judge as optional manual session check if/when triggered.

---

## §4 Speculative / not-yet-armed touchpoints

| # | Potential touchpoint | Emergence context | Cost class if built | No-paid path |
|---|---|---|---|---|
| S1 | **Documentation generation via LLM** — RULES.md, AGENTS.md, CLAUDE.md for consumer | Phase 11+ Installer v2; operator mentioned expectation | HYBRID (consumer runs in their Claude Code session) | Ship as consumer-session skill, not CI job. Consumer runs `meta-factory generate-docs` inside Claude Code. Output committed to repo — subsequent CI is deterministic (reads committed files). |
| S2 | **Auto-install / self-onboard via Claude Code** | Consumer first-run session; AIF `/aif` pattern | FREE (Claude Code session) | Already effectively covered by AIF `/aif` per §13.25 research. Framework's `install.sh` is deterministic bash; LLM onboarding is AIF's surface. |
| S3 | **Consumer-side auto-fix / auto-suggest** — LLM proposes fixes for lint violations | Phase 11+ AIF integration; `aif-fix` workflow | FREE (consumer Claude Code session) | AIF `/aif-fix` is session-bound. Framework can generate fix-hint metadata in `rules-manifest.json`; actual LLM fix = consumer's session. |
| S4 | **AGENTS.md content authoring assistance** | When consumer installs; onboarding | FREE (consumer Claude Code session) | This is a skill invocation in-session. Ship as a skill template; consumer runs in their session. |
| S5 | **L2 Research Agent v2 — full LLM-driven** | §13.10 entry #1 trigger fires | FREE if session-only, PAID if in CI | Design constraint: research cache as intermediary — LLM runs once in session, writes cache, CI reads cache deterministically. «LLM-then-cache» pattern. |
| S6 | **AIF `aif-evolve` mining on own patches** | §13.6 / §13.22 — L2 Research Agent | FREE (Claude Code session) | aif-evolve is session-bound by design — it mines patches within a session, outputs to skill-context file. No CI component. |
| S7 | **Continuous staleness monitor** for SSOT entries | §13.22 own-conventions evolution; L2 Research Agent | PAID if CI cron, FREE if session | Design: weekly operator session task, not automated CI. |
| S8 | **Harness-hook validation feedback** (PostToolUse LLM interprets validation output) | Wave 7 §13.28 B | FREE (Claude Code PostToolUse, session-bound) | PostToolUse hooks run inside the Claude Code session. The hook calls `validate-batch-spec.ts` (deterministic), not LLM. LLM reads the hook's output — this is the session LLM, not a new API call. |

---

## §5 Cost classification synthesis

### FREE within Claude Code subscription (session-bound)

All touchpoints where LLM runs inside an active Claude Code session (operator or consumer):

- T1-T5: AIF sub-agents, self-reflection skill — invoked via `/aif-verify`, auto-trigger keywords, or explicit skill call
- T6: context7 MCP — invoked during research sessions
- T10-T11: AIF `/aif` onboarding, AIF `/aif-evolve` mining
- §13.10 entries #1, #2, #3, #4 (when built): all designed as session tasks
- §13.25 MCP discovery: session-bound
- S1-S8 (when built): all designed as session tasks

### N/A (no LLM — fully deterministic)

All current CI and pre-push checks:

- T7: `audit-self.yml` — all 12 jobs (bash, vitest, jq, node)
- T8: `discipline-self-check.yml` — bash grep
- T9: `.husky/pre-push` — actionlint, zizmor, bash audit-ai-docs.test.sh, render-rules, vitest
- §13.10 entry #5 (Stryker mutation testing)
- §13.11 cost log (file write)
- S8 harness-hook validator call (calls deterministic TS, not LLM)

### PAID per-call (CI gate) — current state: ZERO

**Currently none.** All CI is deterministic. All LLM calls are session-bound.

### PAID per-call (CI gate) — IF MISDESIGNED

Danger zones — would become PAID if implemented in CI without the «LLM-then-cache» design constraint:

- §13.7 v2 semantic drift (embedding API in CI)
- §13.10 entry #1 (research extension without cache intermediary)
- §13.10 entry #4 (Gate 5 two-AI review in CI validator)
- §13.12 real-corpus validation with Gate 5
- §13.27 LLM-judge probe in `audit-self.yml`

### HYBRID (consumer-side, no subscription guarantee)

- T1-T4 consumer-side: consumers with Claude Code subscription = free; consumers without = unavailable unless they supply their own API key
- S1 doc generation: same hybrid
- §13.25 MCP discovery: same hybrid

### Specific note on SSOT entries #16-#22 (proposed in Wave 7 research §8)

These are vocabulary adoptions (ADOPT VOCABULARY verdict) — no capability commit, no LLM calls. The SSOT entries themselves are doc edits; cost class N/A.

---

## §6 «No-paid» constraint analysis

### Summary: current state is compliant

**All current LLM usage is FREE (session-bound) or N/A (deterministic).** Zero PAID-CI calls exist today. The architecture is «session-LLM + deterministic-CI» by design per the deterministic-v1 stance (§6.0 lock).

### Design principle that maintains compliance

**«LLM-then-cache» pattern** — the structural guarantee:

1. LLM runs once, in an operator or consumer Claude Code session.
2. Output is committed to the repo as a deterministic artifact (JSON cache, snapshot, recipe file).
3. CI reads the artifact — no LLM in CI.

This pattern is already operational:
- `packages/core/research/store/` — hand-authored JSON (v1 curated baseline; LLM v2 would write to same store from session, then CI reads)
- `packages/core/synthesizer/expected-self-synth.json`, `packages/core/detector/expected-self-detect.json` — snapshot files CI diffs against
- `rules-lock.json` — consumer's committed lock, CI reads it

### §13.25 MCP discovery — operator's specific question

**Execution:** session-bound (Claude Code session). FREE for operator and for consumers with Claude Code subscription.

**Cleanest path:** reuse AIF `/aif` (already integrated dependency) for rules 1-4. Supplement with small in-session skill or file-write mechanism for rules 5-6 (reject-memory + incrementality). No API-calling CLI subcommand. No CI job.

**Cost surface to watch:** if `rules-as-tests-aif` ever ships its own CLI that calls Anthropic API directly (not inside Claude Code), that would be PAID for consumers without subscription. The «tool must run inside Claude Code session» constraint keeps this free.

### Documentation generation — operator's expectation

**Expected LLM usage:** consumer runs `meta-factory generate-docs` (AGENTS.md, RULES.md, CLAUDE.md templates filled with stack-specific content).

**Where could it execute?** Two options:
1. **Claude Code session skill** (cleanest): consumer invokes via skill in their Claude Code session. LLM fills templates. Consumer commits output. Subsequent CI runs are deterministic. **FREE.**
2. **Standalone CLI with API key** (PAID): `meta-factory generate-docs --api-key <key>`. Calls Anthropic API directly. Per-call cost. **Do not use under «no-paid» constraint.**

**Cleanest path:** Option 1. Ship as a Claude Code skill under `skills/rules-as-tests/` or as an AIF workflow step (`/aif-architecture`, `/aif-rules-check`). Consumer runs in their session.

### Touchpoints that should NEVER move to CI (under «no-paid»)

| Touchpoint | Why not CI |
|---|---|
| §13.10 entry #4 Gate 5 (Opus review) | ~$0.29/run cold; would cost per PR |
| §13.27 LLM-judge template probe | ~$0.05+/run × stacks × tests |
| §13.7 v2 semantic drift (embedding) | per-commit embedding API cost |
| §13.10 entry #1 research extension | per-framework LLM call; cache intermediary required |
| §13.10 entry #2 Path A gen | generation is a one-time researcher act, not per-commit |
| §13.10 entry #3 Path B AST gen | generation is one-time; human-review gate before commit |

---

## §7 Strategic recommendations

### Which slots are «always free» (operator dev tool layer)

All session-bound interactions remain free indefinitely under Claude Code subscription:
- Sub-agent workflows (`/aif-verify`, best-practices-sidecar, review-sidecar, docs-auditor)
- Skill invocations (self-reflection, rules-as-tests)
- MCP calls (context7 for research)
- AIF onboarding (`/aif`, `/aif-evolve`)
- Future: Path A/B LLM gen, Gate 5 two-AI review, doc generation, MCP discovery

**Structural guarantee:** all of these are triggered inside an active `claude` session — the subscription bundle covers them.

### Which slots stay deterministic indefinitely under «no-paid»

All CI jobs remain zero-LLM under the current deterministic-v1 stance:
- `audit-self.yml` (all 12 jobs)
- `discipline-self-check.yml`
- `.husky/pre-push`
- consumer CI workflows shipped via `templates/`

**Gate:** the «LLM-then-cache» pattern is the architectural invariant that keeps CI deterministic. Every new LLM-capable feature must produce a committable cache artifact before CI consumes it.

### Which slots might unlock if subscription model changes

If Anthropic expands Claude Code bundle to cover CI compute (e.g., GitHub Actions integration with Claude Code billing):
- Gate 5 two-AI review in CI (advisory non-blocking)
- §13.27 LLM-judge probe in `audit-self.yml`
- §13.7 v2 semantic drift CI gate

**Note (assumption):** as of 2026-05-11, Claude Code subscription does not cover GitHub Actions usage. This is author's assumption based on public pricing. If incorrect, update trigger: when Anthropic announces CI-integrated Claude Code billing, re-evaluate all «PAID-CI if misdesigned» slots.

### Cross-touchpoint coherence: Wave 7 / Wave 5 / future Waves

- **Wave 7** (current) ships purely deterministic checks: markdownlint, lychee, principle 09 changed-files, harness-hooks (PostToolUse calls deterministic TS validator — no LLM). **Zero new LLM touchpoints.** Decision 3 (LLM-judge DEFER) is correct under «no-paid».
- **Wave 5** (§13.25 MCP discovery): reuses AIF `/aif` (free, session-bound) for rules 1-4; rules 5-6 designed as in-session file-write. **No new PAID touchpoints.**
- **Wave 6** (AI-doc cold audit): all deterministic probes P1-P6. D-3 ships parity check (deterministic grep). No LLM in CI. **Aligned.**
- **Future v2 LLM features** (§13.10 entries #1-#4): must follow «LLM-then-cache» pattern when built. Each entry's trigger condition also controls the cost exposure timing.

**Coherence verdict:** all three waves are aligned with «no-paid» constraint. The risk is implementation drift — if a future sub-wave ships an LLM call directly into CI without the cache intermediary, the constraint breaks. Recommend adding an explicit «no direct LLM calls in CI» rule to `self-application.md §3` Decision matrix as a MUST row when the decision matrix expands in Wave 7 sub-wave 7.5.

---

## §8 SSOT proposals (if any new prior art surfaces)

This audit did not conduct new context7 queries (per task constraints). Two observations for future SSOT consideration when Wave 5 review session opens:

**Candidate #23: «LLM-then-cache» architectural pattern** — no single named production analog found in research-to-date. The pattern (LLM runs in session → writes deterministic artifact → CI reads artifact) is implemented by this project already (detector snapshot, research store, synthesizer expected-output). Closest named analog: GitHub Copilot Workspace «plan then generate then review» (session-scoped generation, committed output). Recommended verdict: ADOPT VOCABULARY at Phase 11 entry when naming the pattern in docs.

**Candidate #24: Claude Code hooks API** (`UserPromptSubmit`, `PostToolUse`, `.claude/settings.json`) — Wave 7 research §3 identifies this as a 5th lifecycle stage, currently unregistered in SSOT. Recommended SSOT entry: Wave 7 sub-wave 7.5.b per review verdicts §3 confirmed scope.

Note: SSOT entries #16-#22 are proposed in Wave 7 research §8 and confirmed in Wave 7 review verdicts §2. This audit does not duplicate them; they will land at sub-wave 7.5.b commit-time.

---

## §9 Open decisions for operator

1. **«LLM-then-cache» rule in Decision matrix** — should this be added as an explicit MUST row in `self-application.md §3` (e.g.: «No direct LLM API calls in CI; LLM output must be committed as deterministic cache artifact before CI reads it»)? This is the structural guarantee of «no-paid» in CI. If yes, it becomes a Wave 7 sub-wave 7.5.a deliverable.

2. **Consumer-side subscription assumption** — framework currently relies on consumers having Claude Code subscription for T1-T4 to work. Should `INSTALL-FOR-AI.md` explicitly state «requires Claude Code subscription for AI-assisted workflows»? Or should framework also document an API-key fallback path (making it PAID per-call)? Decision affects §13.25 implementation scope.

3. **Gate 5 two-AI review (Opus) subscription tier** — `review-sidecar` with `model: opus` override may not be available on all Claude Code subscription tiers. Should the framework document a Sonnet fallback for the two-AI review gate? Or treat Opus as a soft dependency? Affects §13.10 entry #4 implementation.

4. **Documentation generation as skill vs CLI** — operator mentioned expectation of LLM-driven doc generation. Choice between (a) ship as Claude Code skill (free, session-bound) and (b) ship as CLI with API key (paid per-call, no subscription required). Decision determines whether doc generation stays in «always free» category. Recommendation: Option (a).

5. **Wave 5 sequencing constraint** — Wave 5 (§13.25 MCP discovery) should NOT build an API-calling CLI layer that duplicates AIF `/aif`. The §13.25 research clearly recommends reusing AIF for rules 1-4. Operator confirm: Wave 5 orchestrator is constrained to «session-skill or in-session file-write for rules 5-6; no standalone API-calling component».

---

## §10 §1.7 forward+backward check

### Forward-check

- **Authoritative-for header present:** ✅ (lines 3-4 of this file).
- **Cites SSOT existing entries:** ✅ references #1-#22 via open-questions.md cross-refs; §8 proposes #23-#24 as candidates.
- **Non-capability commit:** ✅ this is a research-only doc (no new packages/, no new dependencies). Trailer: `Prior-art: skipped — research patch documenting LLM usage audit, no new capability shipped`.
- **Doc-authority compliance:** ✅ NOT claiming to own project goal, NOT redefining Wave 7/5 decisions, NOT modifying frozen artefacts (PROPOSAL.md, retros/).
- **Trigger sweep:** scope of this file = inventory + classification. No §13.x entry triggers solely from this audit's existence. SSOT candidates #23-#24 deferred to their respective sub-wave commit moments.

### Backward-check

- **Scope of «no-paid» recommendation:** applies to all new LLM-capable features going forward. Backward check: all currently-shipped touchpoints (T1-T11) have been classified — none violate the constraint. Decision matrix in `self-application.md §3` currently has no LLM-gate row; this audit recommends adding one (open decision #1 above), which would be a new discipline-bearing row requiring its own §1.7 at sub-wave 7.5.a time.
- **Exemption for session-LLM:** sub-agents, skills, AIF workflow all explicitly operate in-session. This is the intended design; no exemption mechanism needed (session-bound = always free under subscription).
- **Self-reflexive:** this audit is itself a research-session Claude Code task — covered by subscription. No recursive cost risk.
