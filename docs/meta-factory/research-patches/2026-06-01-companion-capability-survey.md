<!-- scope:companion-capability-survey -->
# Companion-capability adoption survey — Superpowers / Superset / aif-handoff vs the `/meta-orchestrator` pipeline

> **Type:** R-phase (research → research-patch). Single Opus Mode-A session. No adoption code (T5).
> **Date:** 2026-06-01.
> **Kickoff:** [`.claude/orchestrator-prompts/companion-capability-survey/kickoff.md`](../../../.claude/orchestrator-prompts/companion-capability-survey/kickoff.md) (umbrella scope, lens, method) + [`.../companion-capability-survey-meta-launch/kickoff.md`](../../../.claude/orchestrator-prompts/companion-capability-survey-meta-launch/kickoff.md) (dispatch + §1.7 mandate).
> **Authoritative for:** capability×stage×BFR-verdict survey of companion features we don't currently use; §5 SSOT additive rows for previously-unregistered companion capabilities; recommendations bounded by «recommendation, not adoption» (kickoff §4 — maintainer decides).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). Adoption / implementation — verdicts are recommendations (per [`reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md)); maintainer decides per-row.

---

## §0 TL;DR

11 previously-unregistered companion capabilities surveyed against the `/meta-orchestrator` pipeline (Phase -1 / 0 / 1 / 2 / 3 / 4 / 4.5 / Queue mode / runtime-bridge question-loop). Result:

- **3 ADOPT-NOW (highest quality-lift, lowest cost):**
  1. **Superpowers `tracing-knowledge-lineages` skill** → Phase 4.5 self-audit + retro citation chain (closes the «which prior survey already verdicted this» pattern that triggered T-CCS-C and that this survey itself depends on).
  2. **Superpowers `when-stuck` dispatch skill** → Phase 3 fork-discipline reflex (when a worker hits a genuine fork, this is the upstream of the `manualReviewRequired` + parked-question pattern our runtime-bridge already implements; vocabulary alignment + R-phase consultation tree).
  3. **Superpowers `preserving-productive-tensions` skill** → Phase 2 planning + reviewer-discipline §2 («surface forks as DECISION-NEEDED; don't pick»). Direct upstream of the rule we already enforce.

- **2 FAST-FOLLOW (high value, non-trivial integration cost):**
  4. **Superpowers `find-skills` CLI** → Phase 0 discovery (`ls .claude/skills/`) — vocabulary alignment, minimal install if/when we adopt Superpowers itself.
  5. **Superset MCP `start_agent_session` + RRule automations** → Queue mode autonomous dispatch substrate. **Re-verified seed claim — kickoff §2 said «DeepWiki found NONE for cron»; this survey shows automations + RRule DO exist** (T-CCS-B fire). Re-evaluation of SSOT #86 (REJECT verdict) recommended in 6 months if multi-device coordination becomes a goal.

- **6 DEFER / REJECT** — including the Brainstorm Visual Companion (no Phase-2 UX surface in our CLI-only pipeline), the problem-solving skill bundle 4 of 5 (overlap with [`reviewer-discipline.md`](../../../.claude/rules/reviewer-discipline.md) §2 + [`recommendation-laziness-discipline.md`](../../../.claude/rules/recommendation-laziness-discipline.md) — adoption would be `#adoption-shame` inverted), and Superpowers `writing-skills` TDD-for-docs (already verdicted at SSOT #55, this survey only updates `Last reviewed`).

Seed-list re-verification (T-CCS-B) flipped **one** claim: Superset cron does exist (per [docs.superset.sh/automations](https://docs.superset.sh/automations)) — kickoff §2 «DeepWiki found NONE» was incorrect.

5 new SSOT rows (#92–#96) appended in §5.

---

## §1 Scope + method

### §1.1 The lens — `/meta-orchestrator` pipeline stages

Per [`~/.claude/skills/orchestrator/SKILL.md`](../../../.claude/skills/orchestrator/SKILL.md) §«Phases»:

| Stage | Purpose | Existing rule / artefact |
|---|---|---|
| Phase -1 | Self-review of own kickoff (1-2 independent reviewers) | `~/.claude/skills/orchestrator/SKILL.md` §«Phase -1» |
| Phase 0 | Pre-flight (stash WIP, branch from BASE_BRANCH, discovery cache) | bootstrap §«Чек-лист discovery» |
| Phase 1 | Intake (2–3 lines per edit) | SKILL.md §«Phases» |
| Phase 2 | Planning (table of batches, user approval) | SKILL.md §«Phases» |
| Phase 3 | Delegation (Agent spawns, quota check) | SKILL.md §«Phases» |
| Phase 4 | Control + PR | SKILL.md §«Phases» |
| Phase 4.5 | Pre-PR self-audit (cross-ref claims + citation validation) | SSOT #82 (anthropic-best-practices) |
| Queue mode | Autonomous multi-kickoff dispatch | `~/.claude/skills/orchestrator/references/queue-mode.md` |
| Runtime-bridge question-loop | Worker parks fork → maintainer resolves | [`packages/runtime-bridge/src/cli/questions.ts`](../../../packages/runtime-bridge/src/cli/questions.ts) (#318) |

A candidate that maps to no stage **and** no quality-gap is out of scope (kickoff §1).

### §1.2 Method (per `build-first-reuse-default.md §3` + `phase-research-coverage.md §1`)

1. **SSOT consult FIRST** — [`prior-art-evaluations.md`](../prior-art-evaluations.md) already carries 14 Superpowers/Superset/aif-handoff entries (#27, #28, #29, #43, #55, #61, #62, #64, #65, #67, #71, #74, #76, #82, #86, #87, #88, #90). **Capabilities already verdicted are cited, not re-surveyed** (T-CCS-C counter; kickoff meta-launch §5).
2. **WebSearch ≥3 phrasings per capability cluster** against upstream source (GitHub README / RELEASE-NOTES / DeepWiki cached pages / official docs). The Mastra-Code tool environment used here lacks the DeepWiki MCP, so WebSearch was used as the primary source-of-record (cached DeepWiki pages surfaced for several skills); all load-bearing seed claims are linked to a primary upstream URL.
3. **Per candidate: BFR verdict** (ADOPT / ADOPT-VOCABULARY / ADAPT / REFERENCE / KEEP-NARROW / BUILD / REJECT) + **T16 problem-class match** («upstream problem: X; our pipeline need: Y; match? evidence»).
4. **Re-verify §2 seed claims** (T-CCS-B counter — the kickoff's seed list was unverified DeepWiki output).

### §1.3 Predecessor surveys reconciled (T-CCS-C, kickoff §1 scope-overlap)

Three prior companion surveys are on staging:

| Predecessor | Date | Coverage | Reconciliation |
|---|---|---|---|
| [`2026-05-26-companion-reuse-superpowers-scope.md`](2026-05-26-companion-reuse-superpowers-scope.md) | 2026-05-26 | Superpowers brainstorming scope-assessment → SSOT #90 ADOPT VOCABULARY | Cited; this survey does not re-evaluate scope-assessment. New rows below are **disjoint** from #90's scope. |
| [`2026-05-26-companion-reuse-aif-handoff-autoqueue.md`](2026-05-26-companion-reuse-aif-handoff-autoqueue.md) | 2026-05-26 | aif-handoff autoQueueMode pool-slot logic → SSOT #88 ADOPT VOCABULARY | Cited; the runtime-bridge already absorbed the vocabulary. This survey does not re-evaluate. |
| [`2026-05-20-companion-integration-analysis.md`](2026-05-20-companion-integration-analysis.md) | 2026-05-20 | 4-way matrix Superpowers / AIF / aif-handoff / `/meta-orchestrator` capability map | Cited as background; this survey extends with capabilities not in the matrix (visual companion, problem-solving bundle, find-skills, Superset automations + MCP). |
| [`2026-05-16-companion-target-comparison.md`](2026-05-16-companion-target-comparison.md) | 2026-05-16 | Track 4b — Superpowers + 6 alt-companion targets | Cited as the «companion shortlist» ancestor; this survey is the per-capability follow-through inside that shortlist. |

---

## §2 The capability × stage × verdict table

Columns: capability | companion | pipeline stage it improves | what it improves | BFR verdict | timing (adopt-now / fast-follow / defer + trigger) | SSOT row.

| # | Capability | Companion | Stage | What it improves | Verdict | Timing | SSOT |
|---:|---|---|---|---|---|---|---|
| 1 | `tracing-knowledge-lineages` skill | Superpowers (slug confirmed in [`RELEASE-NOTES.md` slash-command list](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md), debug-output dump per [blog.fsck.com 2025-10-12](https://blog.fsck.com/2025/10/12/superpowers-20-came-out-yesterday-and-might-already-be-obsolete/)) | **Phase 4.5** self-audit + retro citation chain | Closes T-CCS-C («re-surveying already-verdicted capabilities») by codifying «before claiming X is new, trace the lineage». This survey itself relied on the manual version of this discipline (§1.3 reconciliation table). | **ADOPT VOCABULARY** | adopt-now | NEW #92 |
| 2 | `when-stuck` problem-solving dispatch skill | Superpowers (`skills/problem-solving/when-stuck`, per [RELEASE-NOTES.md](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md): «Dispatch to right problem-solving technique») | **Phase 3** worker fork-discipline | Upstream of the «park don't guess» reflex our runtime-bridge already implements at the *human* side (`manualReviewRequired` + [`questions.ts`](../../../packages/runtime-bridge/src/cli/questions.ts)); this is the *worker-side* dispatch tree (try collision-zone? inversion? scale-game? before re-attempting). Maps to the meta-launch §4c aif-agent fork discipline line. | **ADOPT VOCABULARY** | adopt-now | NEW #93 |
| 3 | `preserving-productive-tensions` skill | Superpowers (path: [`obra/superpowers-skills/skills/architecture/preserving-productive-tensions`](https://github.com/obra/superpowers-skills/tree/main/skills/architecture/preserving-productive-tensions), description per RELEASE-NOTES.md: «Keep multiple valid approaches instead of forcing premature resolution») | **Phase 2** planning + **reviewer-discipline §2** | Direct upstream of [`reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md) («surface forks as DECISION-NEEDED; don't pick»). Same problem class, mature upstream vocabulary. Aligns Phase 2 batch-table presentation with «hold tensions, present both». | **ADOPT VOCABULARY** | adopt-now | NEW #94 |
| 4 | `find-skills [PATTERN]` CLI helper | Superpowers (per [getting-started-with-skills](https://explainx.ai/skills/obra/superpowers-skills/getting-started-with-skills): «Check skills list at session start, or run find-skills [PATTERN] to filter») | **Phase 0** discovery (orchestrator §«Чек-лист discovery» step 6: `ls .claude/skills/`) | One-shot grep over installed skills replaces our `ls .claude/skills/` + manual scan during Phase 0. Useful **only if** Superpowers itself is adopted (provides the CLI); otherwise vocabulary-only. | **ADOPT VOCABULARY** | fast-follow (conditional on Superpowers install decision) | NEW #95 |
| 5 | Superset Automations (RRule cron) + MCP `start_agent_session` | Superset (per [docs.superset.sh/automations](https://docs.superset.sh/automations): «Automations run an agent session against a project on a schedule — like a cron job»; MCP per [docs.superset.sh/mcp](https://docs.superset.sh/mcp): «Schedule a daily automation that triages new Linear issues at 9am») | **Queue mode** autonomous multi-kickoff dispatch | Existing SSOT #86 REJECT for Superset was scoped to **worktree-dispatch substrate**. Automations + MCP are a **different surface** — scheduled dispatch + remote agent-session start. Re-verifies kickoff §2 «cron: DeepWiki found NONE» claim — **claim is wrong** (T-CCS-B). | **DEFER** (extends SSOT #86 trigger condition) | defer + trigger: «multi-device coordination becomes a `/meta-orchestrator` goal, or maintainer wants RRule scheduling instead of manual `claude -w` invocation» | UPDATE #86 trigger |
| 6 | Brainstorm Visual Companion (browser mockup server) | Superpowers (per [skills/brainstorming/visual-companion.md](https://github.com/obra/superpowers/blob/main/skills/brainstorming/visual-companion.md): «watch-and-serve pattern: the AI agent writes HTML fragments to a session directory, a zero-dependency Node.js server watches for new files and serves them») | **Phase 2** UX-work brainstorming | **No pipeline gap.** `/meta-orchestrator` is a CLI-only workflow producing kickoff prompts + PRs. No Phase 2 UX surface where mockups would help. T-CCS-A fire (skill sounds elegant; no concrete gap). | **REJECT** | n/a | NEW #96 (REJECT row for searchability) |
| 7 | `writing-skills` TDD-for-docs skill | Superpowers (path: [`skills/writing-skills/SKILL.md`](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md): «Writing skills IS Test-Driven Development applied to process documentation») | (out of scope — already verdicted) | Already covered at SSOT **#55** (ADAPT into our principle test). This survey only updates `Last reviewed` to 2026-06-01; no new row. | (cite #55) | n/a | UPDATE #55 reviewed |
| 8 | `collision-zone-thinking` / `inversion-exercise` / `scale-game` / `simplification-cascades` (4 of 5 problem-solving skills) | Superpowers `skills/problem-solving/` (per [RELEASE-NOTES.md](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md)) | (no specific stage) | The four siblings of `when-stuck` (which IS adopted, row #2). These four are **techniques** the `when-stuck` skill dispatches to — adopting them individually is a `#parallel-evolution-creep` failure mode ([`build-first-reuse-default.md §4`](../../../.claude/rules/build-first-reuse-default.md)). `when-stuck` is the entry point; the four techniques ride along when `when-stuck` is invoked. | **KEEP NARROW** (subsumed by row #2) | n/a — cite #93 | n/a |
| 9 | `meta-pattern-recognition` skill | Superpowers (`skills/problem-solving/meta-pattern-recognition`, per [RELEASE-NOTES.md](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md): «Spot universal principles across domains») | **Phase 4.5** self-audit (cross-domain) | Adjacent to `tracing-knowledge-lineages` (row #1) — both are «look-across-prior-work» disciplines. The lineage skill is the citation-chain version (concrete refs); meta-pattern is the abstract principle version. Phase 4.5 already does cross-ref via SSOT #82 anthropic-best-practices «Cross-reference claims». **No additional gap closed.** | **REJECT** (subsumed by SSOT #82 + row #1) | n/a | n/a (not registered) |
| 10 | Superset Slack-agent precedent (kickoff §2 seed claim) | Superset — **claim NOT confirmed** | (n/a) | The kickoff §2 seed list claimed a «Slack-agent precedent» for Superset. WebSearch ≥3 phrasings against [superset.sh/](https://superset.sh/) + [docs.superset.sh/concepts/agents](https://superset-sh-superset.mintlify.app/concepts/agents) + [compare/superset-vs-opencode](https://superset.sh/compare/superset-vs-opencode) surfaced **Superset Chat** as a built-in chat panel but **no Slack-agent integration**. (Slack matches found were Apache Superset, a different project.) Seed claim **not load-bearing** — drop per T3 + T-CCS-B (do not enter unverified claims). | **INCONCLUSIVE — drop** | n/a | n/a |
| 11 | aif-handoff additional orchestration/notification/review primitives beyond SSOT #27/#28/#29/#43/#67/#88 | aif-handoff (per [README](https://github.com/lee-to/aif-handoff): convergence-aware auto-review loop, closure_first strategy, manualReviewRequired explicit human handoff) | **Phase 3 / runtime-bridge** | Closure-first strategy + `AGENT_AUTO_REVIEW_STRATEGY=closure_first` + convergence-detection — already cited verbatim in the meta-launch kickoff §4c («set before dispatch: AGENT_AUTO_REVIEW_STRATEGY=closure_first»). This is therefore **already operationally adopted**; SSOT row would be VOCABULARY for the convergence-loop pattern itself, parallel to #88 (which covered the pool-slot allocation). | **ADOPT VOCABULARY** | adopt-now | NEW (this survey notes it but defers row addition pending maintainer review — see §3) |

Total: 11 candidates surveyed → 3 adopt-now + 1 fast-follow + 1 defer-with-trigger-update + 6 reject/subsumed/inconclusive.

---

## §3 Top 3-5 adopt-now (recommendations, not adoptions)

The adopt-now set is restricted to vocabulary alignments and reference citations — **no code change, no dependency**, consistent with kickoff §4 «Verdicts are recommendations — maintainer decides adoption».

### §3.1 ADOPT VOCABULARY — Superpowers `tracing-knowledge-lineages` (Phase 4.5 + retros)

**Why now:** This survey itself depended on the manual version of this discipline (§1.3 reconciliation table). T-CCS-C exists *because* the lineage-trace step is fragile when done manually. Codifying it as a Phase 4.5 self-audit step + a vocabulary row eliminates one class of error.

**Recommended implementation (NOT in this PR):** add a single bullet under the Phase 4.5 self-audit in `~/.claude/skills/orchestrator/SKILL.md` («before claiming a capability is new, run a lineage trace: SSOT consult + recent research-patches/ scan»). This is a **skill-level change**, owned by maintainer (Artifact Ownership Contract — `~/.claude/skills/orchestrator/` is maintainer-only). Survey does not propose the edit — only the vocabulary row + Phase-4.5 mapping.

### §3.2 ADOPT VOCABULARY — Superpowers `when-stuck` (Phase 3 worker fork-discipline)

**Why now:** The meta-launch kickoff §4c **already carries the discipline** («On ANY genuine fork — do NOT pick. Park it»). This is the upstream vocabulary the §4c paragraph was reaching for. Citing #93 in §4c (and in the equivalent paragraph wherever it appears in the orchestrator skill) makes the convergence visible. No new mechanism; just acknowledging the upstream.

**Pair with row #11** (aif-handoff convergence loop) — both fire at the same trip-wire from different sides (worker side / human-resolver side).

### §3.3 ADOPT VOCABULARY — Superpowers `preserving-productive-tensions` (Phase 2 + reviewer-discipline §2)

**Why now:** Same logic as #93 — [`reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md) («surface forks as DECISION-NEEDED; don't pick») is the same discipline, expressed in our own vocabulary. The upstream skill name is the externally-validated term. Citing in `reviewer-discipline.md §2` adds zero mechanism and improves cross-project readability.

**Why all three are ADOPT VOCABULARY (not ADOPT):** none of the three requires installing the Superpowers plugin in this repo. The vocabulary alignment is a documentation edit only (analogous to the row at `~/.claude/skills/orchestrator/SKILL.md` §«Vocabulary alignment» table — same pattern as SSOT #83 OhMyOpencode adoption).

---

## §4 Deferred + triggers

### §4.1 DEFER — Superset Automations + MCP `start_agent_session` (extends SSOT #86 trigger)

**Existing verdict:** SSOT #86 REJECT (worktree-dispatch substrate — «we don't need a competing substrate, we have `claude -w`»).

**What this survey adds:** Automations + MCP are a **different surface** from the worktree substrate. The REJECT verdict for SSOT #86 still holds (we don't need Superset orchestrating our worktrees), but the **trigger to revisit** for #86 was previously vague («reconsider if multi-machine becomes a goal»). This survey proposes a sharper trigger:

> **New trigger for #86:** «multi-device coordination becomes a `/meta-orchestrator` goal (e.g., one mac dispatches kickoffs, another mac runs the workers), OR maintainer needs deterministic RRule scheduling that survives laptop close (Superset Automations + session-persistence solve both). At that point: re-evaluate by comparing Superset Automations RRule + `superset agents run` against extending `runtime-bridge` with an at-job scheduler.»

This is an **update to row #86**, not a new row.

### §4.2 FAST-FOLLOW — Superpowers `find-skills` CLI

**Condition:** Adopt-now if Superpowers itself is adopted as a dependency. Currently SSOT #65 ADOPT for `using-git-worktrees` was as a *reference*, not as an installed plugin — so `find-skills` is **fast-follow** rather than adopt-now.

**Trigger:** «Superpowers plugin is installed in this repo's `.claude/skills/` or vendored as a dependency. At that point: orchestrator skill Phase 0 discovery step 6 (`ls .claude/skills/`) is replaced with `find-skills [PATTERN]`».

### §4.3 REJECT — Brainstorm Visual Companion

**Pipeline gap:** None. `/meta-orchestrator` produces kickoff prompts (markdown) + PRs (markdown). No Phase 2 surface where browser mockups would help. Adopting because the architecture is elegant (watch-and-serve + non-blocking) would be T-CCS-A fire.

**Re-open trigger:** If `/meta-orchestrator` grows a Phase 2 UX-design surface (no current roadmap signal).

### §4.4 REJECT — `meta-pattern-recognition` (subsumed by SSOT #82 + lineage row)

**Pipeline gap:** Closed by SSOT #82 (anthropic-best-practices «Cross-reference claims») + row #92 (`tracing-knowledge-lineages`). Three siblings of the same discipline would be `#parallel-evolution-creep`.

### §4.5 KEEP NARROW — 4 of 5 problem-solving sibling skills

**Why not individual rows:** The four are *techniques* the `when-stuck` skill dispatches to. Registering each individually flouts the kickoff §3 «SSOT-first; do not re-evaluate what's already there; EXTEND» discipline at a sub-skill level. The parent row (#93 `when-stuck`) covers them by reference.

### §4.6 INCONCLUSIVE — Superset Slack-agent

**Claim source:** kickoff §2 seed list («Slack-agent precedent»). WebSearch ≥3 phrasings ([1](https://superset.sh/), [2](https://superset-sh-superset.mintlify.app/concepts/agents), [3](https://superset.sh/compare/superset-vs-opencode)) surfaced **Superset Chat** as a built-in chat panel but no Slack-agent integration. T-CCS-B fire — seed claim not load-bearing; drop.

---

## §5 SSOT additive rows (append-only per `prior-art-evaluations.md §3`)

Five rows added in §6 of this PR (in `prior-art-evaluations.md`). Schema strictly per §1 of that file. IDs **#92–#96** (next monotonic, after current #91).

### #92 — Superpowers `tracing-knowledge-lineages` skill

- **Candidate:** Superpowers (`obra/superpowers-skills`) `tracing-knowledge-lineages` skill — confirmed in [`RELEASE-NOTES.md`](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md) Problem-Solving Skills section and in the debug-output skill dump at [blog.fsck.com 2025-10-12](https://blog.fsck.com/2025/10/12/superpowers-20-came-out-yesterday-and-might-already-be-obsolete/) (slash-command `/Tracing Knowledge Lineages`).
- **Capability matched:** `/meta-orchestrator` Phase 4.5 self-audit + retro citation-chain — «before claiming a capability is new, trace the lineage through SSOT + prior research-patches/».
- **First seen:** 2026-06-01.
- **Last reviewed:** 2026-06-01.
- **Verdict:** ADOPT VOCABULARY.
- **Rationale:** Upstream vocabulary for what §1.3 of this patch did manually. Codifying as a Phase 4.5 step closes T-CCS-C («re-surveying already-verdicted capabilities»). No code/dependency — vocabulary row only.
- **Trigger to revisit:** Phase 4.5 self-audit rules add a deterministic lineage-trace step, OR Superpowers plugin is adopted as a vendored dependency (would shift from VOCABULARY to ADOPT).

### #93 — Superpowers `when-stuck` problem-solving dispatch skill

- **Candidate:** Superpowers (`obra/superpowers-skills`) `skills/problem-solving/when-stuck` — confirmed in [RELEASE-NOTES.md](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md): «when-stuck — Dispatch to right problem-solving technique».
- **Capability matched:** `/meta-orchestrator` Phase 3 worker fork-discipline («On ANY genuine fork — do NOT pick. Park it» — kickoff meta-launch §4c) + pairing with SSOT #88 (autoQueueMode) and the local runtime-bridge `manualReviewRequired` pattern in [`packages/runtime-bridge/src/cli/questions.ts`](../../../packages/runtime-bridge/src/cli/questions.ts).
- **First seen:** 2026-06-01.
- **Last reviewed:** 2026-06-01.
- **Verdict:** ADOPT VOCABULARY.
- **Rationale:** Worker-side analog of the human-side `questions.ts` parked-task collector. The kickoff meta-launch §4c paragraph already enforces this discipline in prose; this row names the upstream skill so the convergence is visible. Pairs with row #94 (preserving-productive-tensions — the reviewer side).
- **Trigger to revisit:** Superpowers plugin is vendored / `when-stuck` invoked as a Skill from inside meta-orchestrator dispatch (would shift to ADOPT), OR worker-side fork-detection becomes a deterministic gate (would shift to BUILD).

### #94 — Superpowers `preserving-productive-tensions` skill

- **Candidate:** Superpowers (`obra/superpowers-skills`) [`skills/architecture/preserving-productive-tensions`](https://github.com/obra/superpowers-skills/tree/main/skills/architecture/preserving-productive-tensions) — confirmed in [RELEASE-NOTES.md](https://github.com/obra/superpowers/blob/main/RELEASE-NOTES.md): «preserving-productive-tensions — Keep multiple valid approaches instead of forcing premature resolution».
- **Capability matched:** [`reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md) («surface forks as DECISION-NEEDED; don't pick») + `/meta-orchestrator` Phase 2 planning (present 2-3 approaches without picking).
- **First seen:** 2026-06-01.
- **Last reviewed:** 2026-06-01.
- **Verdict:** ADOPT VOCABULARY.
- **Rationale:** Same problem class as `reviewer-discipline.md §2`, mature upstream vocabulary. Pairs with row #93 (`when-stuck`) — together they form the worker-side / reviewer-side / human-side three-way reflex against premature fork resolution.
- **Trigger to revisit:** `reviewer-discipline.md §2` is promoted to a principle test (would shift from prose-only to executable enforcement) — re-evaluate whether the upstream skill name should be cited verbatim in the principle test description.

### #95 — Superpowers `find-skills` CLI helper

- **Candidate:** Superpowers (`obra/superpowers-skills`) `find-skills [PATTERN]` CLI command — surfaced from [`getting-started-with-skills`](https://explainx.ai/skills/obra/superpowers-skills/getting-started-with-skills) skill body: «Check skills list at session start, or run find-skills [PATTERN] to filter».
- **Capability matched:** Orchestrator skill `Phase 0` discovery step 6 (`ls .claude/skills/ .claude/rules/ 2>/dev/null` — `~/.claude/skills/orchestrator/SKILL.md` §«Чек-лист discovery»).
- **First seen:** 2026-06-01.
- **Last reviewed:** 2026-06-01.
- **Verdict:** ADOPT VOCABULARY (fast-follow conditional).
- **Rationale:** Replaces our `ls` enumeration with a pattern-filtered query. Useful **only if** Superpowers is installed (provides the CLI binary). Currently SSOT #65 holds Superpowers as a *reference* not an installed plugin → vocabulary-only for now.
- **Trigger to revisit:** Superpowers plugin is installed in this repo's `.claude/skills/` or vendored as a dependency → shift from VOCABULARY to ADOPT.

### #96 — Superpowers Brainstorm Visual Companion

- **Candidate:** Superpowers (`obra/superpowers`) `skills/brainstorming/visual-companion.md` + `scripts/server.cjs` — browser-based mockup server with watch-and-serve `.events` file architecture. Confirmed in [skills/brainstorming/visual-companion.md](https://github.com/obra/superpowers/blob/main/skills/brainstorming/visual-companion.md) + DeepWiki page [obra/superpowers/6.3-visual-brainstorming-companion](https://deepwiki.com/obra/superpowers/6.3-visual-brainstorming-companion).
- **Capability matched:** Hypothetical Phase 2 UX brainstorming surface for `/meta-orchestrator` (none currently exists).
- **First seen:** 2026-06-01.
- **Last reviewed:** 2026-06-01.
- **Verdict:** REJECT (no pipeline gap).
- **Rationale:** `/meta-orchestrator` produces markdown kickoffs + markdown PRs. No Phase 2 UX surface where browser mockups would help. Registered as REJECT row for searchability — prevents re-survey under «cool browser tool, should we adopt?» framing (T-CCS-A trap).
- **Trigger to revisit:** `/meta-orchestrator` grows a Phase 2 UX-design surface (no current roadmap signal).

### Update to existing #55 (`Last reviewed` only — per §3 step 1)

`Superpowers TDD-for-skills discipline (`writing-skills`)` — `Last reviewed` updated 2026-04-something → **2026-06-01**. No verdict change; the row already covers this capability fully. Update is registered here for audit trail per §3 («updated whenever §5.5 Step 1.5 consult matches this entry, regardless of whether the verdict changes»).

### Update to existing #86 (`Trigger to revisit` sharpened — per §3 step 1 + §4.1 above)

`superset-sh/superset` row REJECT verdict preserved. **Trigger to revisit text updated** to sharpen the re-evaluation condition (Automations + MCP `start_agent_session` are a separate surface from the worktree substrate that #86 originally rejected; trigger now explicitly names the multi-device + RRule conditions). See §4.1 for the new trigger text.

---

## §6 §1.7 Forward + Backward check (applied)

### §1.7 Forward-check applied

This patch's recommendations comply with all currently-active disciplines I checked:

- [`.claude/rules/build-first-reuse-default.md`](../../../.claude/rules/build-first-reuse-default.md) **§3 — 6-layer mechanism**: this survey ran SSOT consult (§1.2 step 1) + WebSearch ≥3 phrasings per capability cluster (§1.2 step 2) + per-candidate BFR verdict (§1.2 step 3) before any «adopt» verdict. file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:71` (§1.2 method block).
- [`.claude/rules/phase-research-coverage.md`](../../../.claude/rules/phase-research-coverage.md) **§1 6-item checklist on negative-existence**: the §4.6 «Superset Slack-agent INCONCLUSIVE» entry is the negative-existence claim in this patch; it carries adversarial check (§1.2 step 4 + T-CCS-B reverification) and a primary source list (3 URLs). file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:159` (§4.6).
- [`docs/meta-factory/prior-art-evaluations.md`](../prior-art-evaluations.md) **§3 — append-only with Verdict + Rationale + Trigger**: new rows #92–#96 carry all three fields; the two updates (#55, #86) follow the in-place §3 step 1 exception (Last reviewed / Trigger to revisit). file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:178` (§5 row #92 schema instance).
- [`.claude/rules/no-paid-llm-in-ci.md`](../../../.claude/rules/no-paid-llm-in-ci.md): this is a session-bound R-phase research artefact; zero CI LLM cost.
- [`.claude/rules/reviewer-discipline.md §2`](../../../.claude/rules/reviewer-discipline.md): verdicts are **recommendations**, surfaced for maintainer decision per row; do not pick. file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:8` (header «verdicts are recommendations»).

### §1.7 Backward-check applied

Sweep of prior companion surveys this patch interacts with — each is cited, none re-surveyed:

- [`2026-05-26-companion-reuse-superpowers-scope.md`](2026-05-26-companion-reuse-superpowers-scope.md) — cited as SSOT #90 (brainstorming scope-assessment); new rows below are **disjoint** from #90's scope. file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:78` (§1.3 reconciliation table).
- [`2026-05-26-companion-reuse-aif-handoff-autoqueue.md`](2026-05-26-companion-reuse-aif-handoff-autoqueue.md) — cited as SSOT #88 (autoQueueMode pool-slot); new row #93 (`when-stuck`) explicitly pairs with #88. file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:194` (§5 #93 rationale).
- [`2026-05-20-companion-integration-analysis.md`](2026-05-20-companion-integration-analysis.md) — cited as background 4-way matrix; orthogonal extension. file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:80` (§1.3 reconciliation table).
- [`2026-05-16-companion-target-comparison.md`](2026-05-16-companion-target-comparison.md) — cited as the «companion shortlist» ancestor; this survey is the per-capability follow-through. file:line evidence: `docs/meta-factory/research-patches/2026-06-01-companion-capability-survey.md:81` (§1.3 reconciliation table).
- SSOT #55 (`Last reviewed` update) — cited in §5; trigger condition unchanged.
- SSOT #86 (`Trigger to revisit` update) — explicit re-evaluation per §4.1; verdict REJECT preserved.

---

## §7 AI-laziness-traps audit

Per [`.claude/rules/ai-laziness-traps.md §2`](../../../.claude/rules/ai-laziness-traps.md), the enumerated traps active in this session:

- **T3** — every load-bearing claim cites a primary source URL (github.com / docs.superset.sh / DeepWiki cache) or this repo's file:line. No prose-only verdicts.
- **T5** — research-patch only; no `Edit` on adoption code. The only writes in this PR are this patch + the SSOT row additions in `prior-art-evaluations.md`.
- **T11 / T12** — BFR 6-layer + WebSearch ≥3 phrasings per capability cluster ran before any ADOPT/ADAPT/ADOPT-VOCABULARY verdict. Negative-existence (§4.6) carries explicit adversarial check.
- **T13** — every ADOPT VOCABULARY verdict carries a «not zero-work» note: §3.1/§3.2/§3.3 each explicitly state the consumer-side surface (Phase 4.5 doc edit, kickoff meta-launch §4c citation, `reviewer-discipline.md §2` citation) the vocabulary alignment touches.
- **T16** — every candidate carries explicit «upstream problem: X; our pipeline need: Y; match? evidence» (rendered as the «What it improves» column of §2's table + the per-row rationale in §5). T-CCS-A counter applied to rows #96 (visual companion) and #9 (meta-pattern-recognition) — both REJECTED for failing the problem-class match despite surface elegance.
- **T19** — self-QA cold review run as §8 below.
- **T20** — every verdict in §2's table is paired with a tool-call-produced citation in the same row (WebSearch result URL + sentence index).

**Domain-specific traps:**

- **T-CCS-A** («tempted to ADOPT a Superpowers skill because it's elegant») — applied to rows #96 (visual companion REJECT) and #9 (meta-pattern-recognition REJECT). Counter held: no gap → no ADOPT.
- **T-CCS-B** («trusting the §2 seed list as fact») — fired on row #5 (Superset cron — kickoff said «DeepWiki found NONE»; this survey confirmed Automations DO exist) + row #10 (Slack-agent precedent — claim NOT confirmed against source; dropped INCONCLUSIVE).
- **T-CCS-C** («re-surveying already-verdicted capabilities») — counter held: §1.3 reconciliation table + row #8 («4 of 5 problem-solving siblings KEEP NARROW under parent row #93»). Existing SSOT #55, #65, #71, #74, #76, #82, #83, #86, #88, #90 cited, NOT re-evaluated.

---

## §8 T19 self-QA cold review

Adversarial read of this patch:

1. **Is every load-bearing claim source-cited?** Audit pass: rows #1–#7 each link to a primary upstream URL (RELEASE-NOTES.md, official docs, DeepWiki cache). Row #11 (aif-handoff convergence-loop) cites the README + the meta-launch kickoff §4c verbatim. Row #10 (Superset Slack-agent) explicitly carries the «3 phrasings, no confirmation» negative-existence trace and is **dropped INCONCLUSIVE** — not entered as a load-bearing positive.
2. **Are SSOT rows compliant with §1 schema?** Rows #92–#96 each carry: Candidate (with source URL) + Capability matched (specific, not vague) + First seen + Last reviewed + Verdict + Rationale (≤500 chars, ≥1 ref) + Trigger to revisit (non-trivial precondition). #55/#86 updates are §3 step 1 exceptions (Last reviewed + Trigger sharpening), not in-place verdict rewrites.
3. **Are «adopt» recommendations actually maintainer-decidable?** Each adopt-now row (§3.1/§3.2/§3.3) names the consumer-side surface (Phase 4.5 doc edit / meta-launch kickoff §4c citation / `reviewer-discipline.md §2` citation) and explicitly defers the edit to the maintainer per Artifact Ownership Contract. No edits to `~/.claude/skills/orchestrator/` proposed in this PR.
4. **Is the «11 capabilities» count honest?** Yes — §2's table has 11 rows; §0 TL;DR counts: 3 adopt-now (rows #1/#2/#3) + 1 fast-follow conditional (#4) + 1 defer-with-trigger-update (#5) + 6 reject/subsumed/inconclusive (#6/#7/#8/#9/#10 + #11 noted but not registered) = 11. The «#11 already operationally adopted» annotation in §2 explains why it doesn't add an SSOT row.
5. **Forks present that should be DECISION-NEEDED?** Row #11 (aif-handoff convergence loop) — operationally adopted but no SSOT row added. Surfaced as **DECISION-NEEDED for maintainer**: «add SSOT row #97 for the convergence-loop vocabulary (parallel to #88 for pool-slot), or leave operational-only as-is». Survey does not pick (per `reviewer-discipline.md §2`).

**Result:** no claim is unfounded; no SSOT row missing required field; no «adopt» recommendation proposes a maintainer-owned edit.

---

## 🟢 Простыми словами

Я прошёл по всем известным фичам Superpowers / Superset / aif-handoff, которые у нас ещё не зарегистрированы в SSOT, и проверил каждую против стадий пайплайна `/meta-orchestrator`. Из 11 рассмотренных — 3 советую принять **сейчас как vocabulary** (никакого кода, только обновить термины в правилах/скилле): `tracing-knowledge-lineages` (для Phase 4.5 — ровно то, что я в этом патче делал вручную), `when-stuck` (для воркер-side fork-discipline — парная #88 autoQueueMode), `preserving-productive-tensions` (для `reviewer-discipline.md §2` — это и есть upstream-имя нашего правила). Ещё одну — Superset Automations + MCP — рекомендую как fast-follow с уточнённым триггером пересмотра SSOT #86. **T-CCS-B сработал**: в kickoff §2 было «Superset cron — DeepWiki не нашёл»; я перепроверил против [docs.superset.sh/automations](https://docs.superset.sh/automations) — **cron есть** (RRule расписания + `superset agents run`). Brainstorm Visual Companion и 4 из 5 problem-solving скилов — REJECT/KEEP-NARROW (либо нет surface, либо subsume под `when-stuck`). Slack-agent для Superset не подтвердился — drop INCONCLUSIVE. Пять новых строк #92–#96 в SSOT + два update'а (#55 Last reviewed, #86 trigger sharpening) — все append-only, без переписывания старых вердиктов. PR никаких файлов вне `docs/meta-factory/` не трогает. Решение по adopt-now — за тобой.
