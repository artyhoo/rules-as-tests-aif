<!-- scope:satellite-feature-harvest -->
# Satellite-feature harvest — own-stack-first «turn-on / wire» list + reverse sweep (form B)

> **Type:** R-phase (research → actionable wire-list research-patch). Single Opus Mode-A session. NO adoption code (T5). Every candidate run through [`build-first-reuse-default.md §1.1`](../../.claude/rules/build-first-reuse-default.md) criteria verbatim.
> **Date:** 2026-06-01.
> **Kickoff:** [`.claude/orchestrator-prompts/satellite-feature-harvest/kickoff.md`](../../.claude/orchestrator-prompts/satellite-feature-harvest/kickoff.md) (form B, surface-gate, own-stack-first, §2.5 reverse sweep, two-axis caveat).
> **Authoritative for:** the own-stack-first («Claude Code native» first) capability harvest onto the maintainer's actual dev cycle; the harvest table; the adopt-now wire set; the §4b reverse-sweep set; the skip/defer lists. Recommendations only — maintainer decides adoption ([`reviewer-discipline.md §2`](../../.claude/rules/reviewer-discipline.md)).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists). The companion R1-R5 inventory — [`2026-05-30-universal-satellite-integration-matrix.md`](2026-05-30-universal-satellite-integration-matrix.md) (#295). The companion×pipeline-stage survey — [`2026-06-01-companion-capability-survey.md`](2026-06-01-companion-capability-survey.md). This patch EXTENDS both with the own-stack-first lens; it does not re-derive them (T-SFH-B).

---

## §0 TL;DR

The own-stack sweep (Stage 1, criterion-zero) is the whole story: **Claude Code natively ships a remote / scheduled / parallel-session cluster** that prior SSOT rows were crediting — or about to credit — to companions. Confirmed dual-channel (primary `code.claude.com/docs` + DeepWiki `anthropics/claude-code`):

- **Remote Control** (`/remote-control`, mobile/web `claude.ai/code`) — the origin-incident answer (we'd missed it vs Superset multi-device/Slack).
- **Routines** (`/schedule`, Anthropic-cloud, survives laptop-close; Schedule + API + GitHub triggers) — own-stack-serves the SSOT #86 «RRule scheduling surviving laptop close» trigger.
- **Channels** (`claude --channels plugin:telegram@…`, Telegram/Discord/iMessage push-into-session, two-way) — own-stack Telegram, same class as the operator's aif-handoff Telegram notify.
- **Background agents / agent-view** (`/bg`, watch parallel sessions one screen) — own-stack-serves the «watch parallel claude sessions» core of amux (#85).
- **Slack** (`/slack`, `@Claude`→PR) — own-stack-serves the Superset Slack need (#98).

**4 adopt-now** (all cheap = config/habit, no dep, materially better): Remote Control · Routines via `/schedule` · Channels(Telegram) · background agent-view. **3 defer + trigger** · **8 skip** (named: own-stack-redundant + cool-but-irrelevant). **Reverse sweep §4b:** 4 criterion-zero relationships — none force a retire of a *shipped* artefact (T-SFH-D held: the runtime-bridge `questions.ts` park/resume stays — Channels is session-open-only and cannot degrade-replace it for unattended runs). **1 new SSOT row #100** (append-only) anchoring the CC-native own-stack cluster as criterion-zero for #85/#86/#98/#99.

---

## §1 Scope + method

**Form B** (kickoff §0): proactively list «turn this on / wire this» that clearly strengthens the whole dev cycle, **even without a current pain**. Relevance is enforced by the **surface-gate** (kickoff §1): a capability enters the list only if (1) it has a **named surface** in the actual work cycle (orchestration / dispatch / review / planning / runtime-bridge / session control) AND (2) it is **materially** better (moves speed / quality / autonomy / toil / errors noticeably, not marginally). Default for a flashy-but-unanchored feature = **SKIP**.

**Funnel** (kickoff §2 = `build-first-reuse-default.md §1.1` verbatim), in order, per candidate: (0) **own-stack-first** — does Claude Code ship it natively? yes → companion redundant for that need; (1) **surface-gate**; (2) **cost-gate** (cheap = text/skill/rule/env/config/citation → adopt-now when it passes §1; expensive = dep / ≥50-80 LOC module / standing infra → step 3); (3) **no-pain bar** (form-B: expensive + no pain → DEFER unless materially transformative); (4) **reuse-gate** two-axis (operator = use-maximally / shipped = agnostic + graceful degradation).

**Bidirectional** (kickoff §2.5): for each surfaced capability also ask «do WE already maintain a parallel impl?» → Move 1 RETIRE-ours / Move 2 THIN-WRAP / none. **Two-axis caveat (T-SFH-D):** operator-axis retire freely; shipped-axis retire/thin-wrap ONLY if готовое is optional + degradable, else KEEP ours + surface DECISION-NEEDED.

**Sourcing** (anti-loop guard #2): ≥2 independent sources per load-bearing verdict. CC-native claims = primary `code.claude.com/docs` WebFetch (channel 1) + DeepWiki `anthropics/claude-code` (channel 2). MCP **REACHABLE** this session (DeepWiki + WebFetch both live).

**Inventory reconciliation (cite + extend, T-SFH-B):** #295 universal matrix ([`2026-05-30-…`](2026-05-30-universal-satellite-integration-matrix.md)) = 8-companion R1-R5 + cost axis (companion side; no CC-native own-stack list — this patch's gap). Companion survey ([`2026-06-01-companion-capability-survey.md`](2026-06-01-companion-capability-survey.md)) = 11 companion capabilities → SSOT #92-#99 (companion×pipeline-stage). SSOT rows #20/#65/#85/#86/#88/#97/#98/#99 cited below, **not** re-evaluated.

---

## §2 Stage-1 result — Claude Code native «already does» list (own-stack, criterion-zero)

Each line dual-channel-sourced (primary CC docs + DeepWiki). Invocation in parens.

**Work-from-anywhere cluster (the origin-incident class — `code.claude.com/docs/en/overview` «Work from anywhere» + dedicated pages):**

| CC-native | What it does | Invocation | Primary | DeepWiki |
|---|---|---|---|---|
| **Remote Control** | Drive your *local* session from `claude.ai` or the Claude mobile app while away | `/remote-control` | `overview` «Work from anywhere» + `/en/remote-control` | ✓ `/remote-control` slash-command |
| **Channels** | MCP plugin pushes events (Telegram/Discord/iMessage/webhook) INTO a running session; two-way chat bridge | `claude --channels plugin:telegram@claude-plugins-official` (Bun, v2.1.80+, research preview) | `/en/channels` | ✓ (push-into-session) |
| **Slack** | `@Claude` mention in a Slack channel/thread spawns a web session → PR back | `/en/slack` | `overview` + `/en/channels` compare-table | ✓ |
| **Web / iOS / Dispatch / `--teleport` / `/desktop`** | Kick a long task on web/iOS, pull into terminal (`claude --teleport`); hand terminal→Desktop for visual diff (`/desktop`); phone «Dispatch» → Desktop session | `claude.ai/code`, `--teleport`, `/desktop` | `overview` «Work from anywhere» | ✓ web/resume |

**Scheduled / autonomous cluster:**

| CC-native | What it does | Invocation | Primary | DeepWiki |
|---|---|---|---|---|
| **Routines** | Saved config (prompt + repos + connectors) runs on **Anthropic-managed cloud**, survives laptop-close; triggers = **Schedule** (cron, min 1 h) + **API** (per-routine `/fire` endpoint + bearer) + **GitHub** (`pull_request.*` / `release.*`) | `/schedule` (CLI) or `claude.ai/code/routines` | `/en/routines` | (related scheduling) |
| **`/loop`** | Repeat a prompt within an open CLI session (polling) | `/loop` | `/en/scheduled-tasks` | — |
| **Desktop scheduled tasks** | Local scheduled tasks on your machine | Desktop «Local» | `/en/desktop-scheduled-tasks` | — |

**Parallel-session / agent cluster:**

| CC-native | What it does | Invocation | Primary | DeepWiki |
|---|---|---|---|---|
| **Subagents + `isolation:"worktree"`** | Lead agent spawns/merges subtasks; per-subagent worktree isolation | `Agent(...)`, `isolation:"worktree"` | `/en/sub-agents` | ✓ |
| **Background agents / agent-view** | Run several **full** sessions in parallel, watch from one screen | `/bg`, `/en/agent-view` | `overview` «Run agent teams» | ✓ background tasks |
| **Agent teams** | Lead coordinates multiple agents on one task | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | `/en/sub-agents` | ✓ |
| **git worktrees** | Start in isolated worktree; switch mid-session | `claude -w`, `EnterWorktree` | (SSOT #20/#65) | ✓ |

**Session-control / customization (maintainer already uses these — listed for completeness):** hooks, MCP, skills, CLAUDE.md + **auto memory**, plan mode (`/plan`), checkpointing **rewind/undo** (`/rewind`), session resume (`--resume`), **ScheduleWakeup / `/loop`**. Output styles = **deprecated** (→ `--system-prompt-file`).

**Criterion-zero consequence:** the work-from-anywhere + scheduled clusters kill several Stage-2 companion candidates outright — see §3 «CC-native-redundant?» column and §4b.

---

## §3 The harvest table

Columns per kickoff §5. `surface` = named work-cycle point. `clearly-better?` = which of speed/quality/autonomy/toil/errors. `operator/shipped` = two-axis (BFR §1.1). Verdicts = recommendations.

| # | capability | source | CC-native-redundant? | surface (named) | clearly-better? | cost | supersedes-ours? | §1.1 verdict | operator / shipped | timing | channel |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Remote Control** | CC-native | — (IS the own-stack) | session-control: oversee long autonomous orchestrator runs from phone/browser | autonomy + toil (un-tether from desk) | cheap (built-in) | none | ADOPT (own-stack) | operator: ADOPT-now / shipped: n/a (harness, not our artefact) | **adopt-now** | habit + `/remote-control` |
| 2 | **Routines** (`/schedule`) | CC-native | — | dispatch/review: recurring discipline-sweeps (memory re-audit, push-sweep, dep audit) on cloud, survives laptop-close | autonomy + toil + errors (unattended recurring discipline) | cheap (config, no dep) | partial vs Superset Automations #86 (operator) | ADOPT (own-stack) | operator: ADOPT-now / shipped: n/a | **adopt-now** (caveat: research preview + daily cap) | `/schedule` CLI |
| 3 | **Channels (Telegram)** | CC-native | — | runtime-bridge / session-control: get pinged on phone + answer while a long LOCAL session runs | speed + toil (no context-switch to desk) | cheap (plugin + config; needs Bun) | partial vs aif Telegram notify (operator); does NOT supersede `questions.ts` (session-open-only) | ADOPT (own-stack) | operator: ADOPT-now / shipped: n/a | **adopt-now** | `claude --channels` |
| 4 | **Background agents / agent-view** | CC-native | — | Phase-3 parallel dispatch: watch parallel Mode-A/B worker sessions on one screen | quality + toil (visibility into parallel workers) | cheap (built-in) | partial vs amux #85 (operator) | ADOPT (own-stack) | operator: ADOPT-now / shipped: n/a | **adopt-now** | `/bg` / agent-view |
| 5 | Routines **GitHub-trigger** PR-review (run `compliance-verifier` / `living-docs-auditor` on `pull_request.opened`) | CC-native | — | review: semantic §1.7 / living-docs review on every PR, subscription-bundled (NOT API-billed → no-paid-llm clean) | quality + autonomy | expensive (standing routine + cloud env) | — | DEFER (no current pain; design decision) | operator: DEFER / shipped: n/a | **defer + trigger** | `/schedule` GitHub trigger |
| 6 | Routines **API-trigger** as dispatch substrate | CC-native | — | Phase-3 dispatch: HTTP-fire a kickoff run | autonomy | expensive (standing infra) | overlaps #99 multi-machine | DEFER | operator: DEFER / shipped: n/a | **defer + trigger** | per-routine `/fire` |
| 7 | **Agent teams** (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) | CC-native | — | Phase-3 cross-worker coordination | quality (coordination) | cheap (env) but coordination overhead | — | DEFER (current parallel-Agent suffices) | operator: DEFER / shipped: n/a | **defer + trigger** | env var |
| 8 | **Slack** (`@Claude`→PR) | CC-native | — | review/dispatch from team chat | — (maintainer prefers Telegram) | cheap | criterion-zero vs Superset Slack #98 | KEEP-NARROW (Channels/Telegram chosen) | operator: available-not-needed / shipped: n/a | **skip** (Telegram preferred) | — |
| 9 | plan mode `/plan` · rewind/undo `/rewind` · `/loop` · `--teleport` · `/desktop` · Desktop-scheduled-tasks · output-styles | CC-native | — | various session-control | marginal / already-covered / deprecated | cheap | — | SKIP | operator: skip / shipped: n/a | **skip** (named §5) | — |
| 10 | Superset **Automations** (RRule cron) | Superset (SSOT #86) | **YES → CC Routines** | scheduled dispatch surviving laptop-close | — (CC Routines own-stack-serves) | n/a | — | cite #86 (REJECT shipped) | operator: prefer CC Routines / shipped: DEFER #86 | **skip** (own-stack-redundant) | — |
| 11 | Superset **Slack-agent** | Superset (SSOT #98) | **YES → CC Slack + Channels** | remote control / notify | — (own-stack-served) | n/a | — | cite #98 (REFERENCE shipped) | operator: own-stack-served / shipped: REFERENCE | **skip** (own-stack-redundant) | — |
| 12 | Superset **multi-device** `deviceId` dispatch | Superset (SSOT #99) | **partial** (CC Routines=managed-cloud, Remote-Control=same-session; not arbitrary owned-device routing) | Phase-3 cross-machine dispatch | autonomy (genuinely-new slice CC lacks) | n/a | — | cite #99 (DEFER) | operator: DEFER / shipped: DEFER | **defer** (cite #99 trigger) | — |
| 13 | **amux** parallel-session multiplexer + REST/SSE dashboard | amux (SSOT #85) | **YES → CC background agent-view** | watch parallel claude sessions | — (own-stack-served) | n/a | — | cite #85 (DEFER-all) | operator: own-stack-served / shipped: n/a | **skip** (own-stack-redundant) | — |
| 14 | Superpowers `tracing-knowledge-lineages` / `when-stuck` / `preserving-productive-tensions` / `find-skills` | Superpowers | no (vocabulary) | Phase 4.5 / 3 / 2 | quality (vocab alignment) | cheap | — | cite #92/#93/#94/#95 | operator / shipped: per existing rows | **skip** (already verdicted — survey 2026-06-01) | — |
| 15 | aif-handoff `closure_first` / autoQueueMode / Telegram | aif-handoff | partial (Channels=Telegram) | Phase-3 / runtime-bridge | — (already adopted) | cheap | Telegram-notify ↔ CC Channels (operator, thin) | cite #88/#97 | operator: ADOPT (in use) / shipped: VOCABULARY | **skip** (already adopted) + see §4b R4 | — |

Total surfaced: 15 clusters → **4 adopt-now** (rows 1-4) · **3 defer+trigger** (5/6/7) · **partial-defer** (12) · **8 skip** (8/9/10/11/13/14/15 + the §5 sub-list). Reverse-sweep relationships: rows 10/11/12/13/15 → §4b.

---

## §4 Adopt-now set — exact wire targets (edit deferred to maintainer per Artifact Ownership Contract)

All four are **cheap** (config/habit, zero dep, zero ≥50-80 LOC module) and pass the surface-gate **materially**. No code is written in this R-phase.

### §4.1 Remote Control — orchestrator oversight from phone/browser
- **Surface:** session control during long autonomous `/meta-orchestrator` or aif-bridge runs (the exact origin incident — kickoff §0).
- **Wire:** no file edit. Link the local session at `claude.ai/code`; use `/remote-control` to attach the phone/browser. Habit, not config.
- **Materially better:** autonomy + toil — steer an in-progress run away from the desk. **Falsifier:** wrong if the maintainer never runs unattended/long sessions (he does — autonomous aif runs, parallel dispatch).

### §4.2 Routines via `/schedule` — recurring discipline-sweeps
- **Surface (named, real, currently un-served):** [`memory-codification.md §4(c)`](../../.claude/rules/memory-codification.md) «periodic re-audit … every ~N waves» has **no scheduler today**; [`phase-research-coverage.md §1.6`](../../.claude/rules/phase-research-coverage.md) push-sweep; weekly dependency audit.
- **Wire:** `/schedule weekly, run the memory-codification re-audit sweep over ~/.claude/projects/.../memory and report stage-0 conventions` (or a one-off). Routine config lives in the maintainer's claude.ai account — **not** a repo file; nothing to commit.
- **Materially transformative:** autonomy — runs on Anthropic cloud, survives laptop-close, can fire on GitHub events. **no-paid-llm clean:** Routines draw the operator's **subscription** usage, not API billing ([`no-paid-llm-in-ci.md §2`](../../.claude/rules/no-paid-llm-in-ci.md) out-of-scope: «session-bound LLM use … subscription-bundled, not paid-API»); they are NOT `.github/workflows/` jobs.
- **Honest caveat (T14/T6):** **research preview** (API/limits may change) + **daily routine-run cap** + min CLI v2.1.81. **Falsifier:** wrong if the daily cap or preview instability makes a recurring discipline-sweep unreliable — re-test before depending on it for a load-bearing gate.

### §4.3 Channels (Telegram) — notify + answer during long LOCAL sessions
- **Surface:** runtime-bridge / session-control — get pinged on the phone and reply while a long local orchestrator session runs.
- **Wire:** `/plugin install telegram@claude-plugins-official` → `/telegram:configure <BotFather-token>` → `claude --channels plugin:telegram@claude-plugins-official` → pair + `allowlist`. Needs **Bun** (the maintainer already runs Bun via Superset — memory `project_superset_migration_and_j5_resolved`).
- **Materially better:** speed + toil for interactive runs. **Load-bearing limit (T16, do NOT overclaim):** «events arrive **only while the session is open**» (`/en/channels`) — so Channels is for *attended* long sessions, NOT a replacement for the unattended park/resume path (see §4b R4). **Falsifier:** wrong as a notify channel if the maintainer's long runs are headless/unattended — then Routines (cloud) or `questions.ts` (park/resume) is the right tool, not Channels.

### §4.4 Background agents / agent-view — watch parallel workers one screen
- **Surface:** Phase-3 parallel Mode-A/B dispatch — the orchestrator already spawns parallel `Agent`s; agent-view is the watch surface for several **full** parallel sessions.
- **Wire:** `/bg` to background a session; agent-view to watch. Habit.
- **Materially better:** quality + toil — visibility into parallel autonomous workers (today the orchestrator only sees REPORTs at completion). **Falsifier:** wrong if all parallel work is in-session `Agent` subagents (agent-view is for full sessions) — still useful for the cross-session `claude -w` dispatch path.

---

## §4b Reverse-sweep set — criterion-zero relationships (two-axis)

Folded into the per-capability pass (kickoff §2.5 scope bound — only our-own parallels that overlap a surfaced capability; **not** a whole-codebase audit). **No shipped artefact is retired** — T-SFH-D held throughout.

- **R1 — Superset Automations (#86 sharpened trigger) → CC Routines (criterion-zero).** The 2026-06-01 survey sharpened #86's trigger to «maintainer needs deterministic RRule scheduling surviving laptop close» ([survey §4.1](2026-06-01-companion-capability-survey.md)). **Own-stack-first correction:** CC **Routines** serve exactly that need natively (`/en/routines` «keep working when your laptop is closed», cron schedule). **Move:** none-retire (#86 is already REJECT-shipped); operator-axis = **use CC Routines** for scheduled-survive-laptop-close; Superset Automations only adds value if device-routing (#99) is *also* wanted. Shipped-axis: n/a (Superset is not our shipped core). *This is the §4.1-trigger's own-stack answer — recorded so #86 is not re-opened toward Superset for a need CC already covers.*
- **R2 — Superset Slack (#98) → CC Slack + Channels(Telegram) (criterion-zero).** #98 already notes «we cover this with aif Telegram». Own-stack adds: CC ships **native Slack** + **native Channels(Telegram)** (`/en/channels` compare-table). Operator-axis = need fully own-stack-served (no Superset Pro needed). #98 shipped-axis (REFERENCE) unchanged.
- **R3 — amux (#85) → CC background agent-view (criterion-zero).** amux's core = «spawn/monitor parallel claude sessions, REST+SSE dashboard» (#295 §4.1). CC **background agents / agent-view** = «run several full sessions in parallel, watch from one screen» natively. #85 is already DEFER-all; operator-axis = own-stack-served. No retire.
- **R4 — aif-handoff Telegram notify ↔ CC Channels(Telegram): Move-2 THIN-WRAP candidate, operator-only.** The notify *half* of the operator's aif Telegram wiring could ride CC Channels. **But the runtime-bridge `questions.ts` park/resume** (OURS, `packages/runtime-bridge`, a **shipped** artefact) is **NOT superseded:** Channels is session-open-only and cannot degrade-replace the unattended park-question→resume-aif-task flow. **T-SFH-D verdict:** KEEP `questions.ts` (it IS the agnostic core for unattended runs); operator MAY route *interactive* notifications through CC Channels. **No DECISION-NEEDED** — we are not retiring a shipped artefact, only noting an operator-side notify alternative.

---

## §5 Defer set (triggers) + skip set (named)

**Defer + trigger:**
- **Routines GitHub-trigger PR-review** (table #5): materially transformative (subscription-bundled semantic §1.7 review on PR-open — the sanctioned no-paid-llm-in-ci alternative) BUT expensive (standing routine + cloud env) + no current pain. **Trigger:** the maintainer wants automated semantic PR review AND accepts the research-preview daily cap → scoped design (which agent prompt: `compliance-verifier` / `living-docs-auditor`). Surfaced as a **design consideration**, not decided (reviewer-discipline §2).
- **Routines API-trigger as dispatch substrate** (table #6): **Trigger:** multi-machine or external-event dispatch becomes a goal (overlaps #99).
- **Agent teams** (table #7): **Trigger:** parallel work needs cross-worker coordination beyond independent `Agent` subagents.
- **Superset multi-device `deviceId`** (table #12, cite #99): genuinely-new slice CC only partially covers; **Trigger** unchanged from #99 (multi-machine becomes a real goal).

**Skip — own-stack-redundant (named):** Superset Automations (→ CC Routines, R1) · Superset Slack-agent (→ CC Slack+Channels, R2) · amux dashboard (→ CC agent-view, R3) · CC Slack (Telegram chosen, table #8).

**Skip — cool-but-irrelevant / marginal / already-covered (named, T-SFH-C):** plan mode `/plan` (Phase-2 already structured) · rewind/undo `/rewind` (per-batch git commits already cover recovery) · `/loop` (already served by ScheduleWakeup/loop) · `--teleport` + `/desktop` (marginal for a CLI-orchestrator flow) · Desktop scheduled tasks (CC Routines cloud dominates «survives laptop-close») · output styles (**deprecated** upstream) · Superpowers vocabulary skills #92-#95 (already verdicted, survey 2026-06-01).

---

## §6 SSOT additive row (append-only per `prior-art-evaluations.md §3`)

One new row #100 (next monotonic after #99) appended to `prior-art-evaluations.md`. It anchors the CC-native own-stack cluster as criterion-zero for #85/#86/#98/#99 — **no existing row is edited** (append-only; the criterion-zero relationships live in §4b of this patch, not in-place rewrites).

- **#100 — Claude Code native «work-from-anywhere + Routines + Channels + background-agents» own-stack cluster.**
  - *Candidate:* CC-native — Remote Control (`/en/remote-control`), Channels (`/en/channels`, Telegram/Discord/iMessage push-into-session, v2.1.80+ research preview), Routines (`/en/routines`, cloud-scheduled + API + GitHub triggers, `/schedule`), Slack (`/en/slack`), background agents/agent-view (`/en/agent-view`). Dual-channel verified 2026-06-01 (primary `code.claude.com/docs/en/overview` + `/routines` + `/channels`; DeepWiki `anthropics/claude-code`).
  - *Capability matched:* the own-stack criterion-zero for the remote-control / scheduled-dispatch / parallel-session-watch class — bounds companion adoption for #85 (amux), #86 (Superset Automations), #98 (Superset Slack), #99 (Superset multi-device).
  - *First seen / Last reviewed:* 2026-06-01.
  - *Verdict:* **ADOPT** (operator own-stack; criterion-zero). Shipped-axis n/a (CC is the harness, not a shipped consumer artefact).
  - *Rationale:* Harvest [`2026-06-01-satellite-feature-harvest.md`](research-patches/2026-06-01-satellite-feature-harvest.md) §2/§4b. Own-stack-first (BFR §1.1 criterion-zero) — CC ships natively the remote/scheduled/parallel-session cluster prior rows credited to companions. **T16:** their problem = control/schedule/watch agents remotely; ours = same, served by the harness the maintainer already runs. Routines = subscription-bundled (no-paid-llm clean). Channels session-open-only (does NOT supersede runtime-bridge `questions.ts`). 4 adopt-now (Remote Control, Routines, Channels, agent-view).
  - *Trigger to revisit:* a need in this class CC native demonstrably cannot serve (e.g. true cross-owned-machine `deviceId` routing per #99), OR Routines exits research preview and the daily-cap/limits change materially, OR CC removes one of these surfaces.

---

## §7 §1.7 self-reflexive check

### §1.7 Forward-check applied
This patch's recommendations comply with the active disciplines I checked, applied here: **own-stack-first** per [`.claude/rules/build-first-reuse-default.md:35`](../../.claude/rules/build-first-reuse-default.md) (§1.1 criterion-zero — the very line whose 2026-06-01 Remote-Control incident this harvest extends) — Stage 1 swept Claude Code native FIRST and used it to kill redundant companion candidates (table #10/#11/#13, §4b R1-R3). **no-paid-llm** per [`.claude/rules/no-paid-llm-in-ci.md:17`](../../.claude/rules/no-paid-llm-in-ci.md) (§2 «session-bound … subscription-bundled, not paid-API») — Routines draw subscription usage, are not `.github/workflows/` jobs (§4.2); all research = DeepWiki + WebFetch (subscription-bundled). **doc-authority** per [`.claude/rules/doc-authority-hierarchy.md:1`](../../.claude/rules/doc-authority-hierarchy.md) — first line `<!-- scope:satellite-feature-harvest -->` (principle 10) + Authoritative-for header present. **reviewer-discipline** per [`.claude/rules/reviewer-discipline.md:1`](../../.claude/rules/reviewer-discipline.md) — every verdict is a recommendation; the Routines-PR-review (table #5) is surfaced as a design consideration, not decided. Two-axis caveat applied so no shipped artefact is retired (§4b R4).

### §1.7 Backward-check applied
Sweep of prior artefacts this patch interacts with, each cited not superseded: it EXTENDS [`2026-05-30-universal-satellite-integration-matrix.md`](2026-05-30-universal-satellite-integration-matrix.md) (#295, companion R1-R5 — this patch adds the missing CC-native own-stack list) and [`2026-06-01-companion-capability-survey.md`](2026-06-01-companion-capability-survey.md) (companion×stage — this patch adds criterion-zero + reverse sweep). SSOT rows #85/#86/#98/#99 at [`docs/meta-factory/prior-art-evaluations.md:153`](../prior-art-evaluations.md) are **cited and left intact** — the criterion-zero relationships live in §4b, not as in-place rewrites; the only SSOT change is the append of #100 (append-only per §3). No verdict of an existing row is reversed; `questions.ts` (`packages/runtime-bridge`) is explicitly NOT retired (T-SFH-D). Append-only confirmed: `git diff` touches only this patch + the #100 row.

---

## §8 T-trap audit (per `ai-laziness-traps.md §2` — enumerate + extend)

- **T1** — dug past the first CC-native hit: swept the full «Work from anywhere» + scheduled + parallel clusters, fetched `/routines` + `/channels` dedicated pages for the load-bearing reverse-sweep claims (not just the overview).
- **T3** — every CC-native claim cites a primary `code.claude.com/docs` page + a DeepWiki confirmation; every companion claim cites an SSOT row ID.
- **T5** — research only; the sole writes are this patch + the #100 SSOT append. No wire-target file edited.
- **T11/T12** — own-stack-first + ≥2 sources before any adopt-now; CC features verified in-the-moment (training cutoff predates Routines/Channels research-preview), not from memory.
- **T13** — companion ≠ zero-work: each surfaced companion capability audited against CC-native (criterion-zero), not assumed.
- **T16** — problem-class match stated for each (Channels session-open-only ≠ unattended park/resume; Routines managed-cloud ≠ owned-device routing #99; agent-view ≈ amux dashboard).
- **T19** — §9 cold-QA below.
- **T20** — no verdict without a same-turn tool call (WebFetch/DeepWiki/Read/grep).
- **T-SFH-A own-stack-blindness** — counter: Stage 1 ran FIRST; it actively flipped table #10/#11/#13 to own-stack-redundant.
- **T-SFH-B re-survey** — counter: #295 + survey cited and EXTENDED, not re-derived; #85/#86/#88/#92-#99 cited by ID.
- **T-SFH-C cool-but-irrelevant** — counter: surface-gate default-SKIP enforced on rewind/plan-mode/teleport/desktop/output-styles (named §5), not adopted for elegance.
- **T-SFH-D retire-without-degradation** — counter: §4b R4 — `questions.ts` (shipped) NOT retired; Channels is session-open-only and cannot degrade-replace it; operator-axis notify alternative only.

---

## §9 T19 cold-QA self-pass

1. **First line valid `<!-- scope:… -->`?** Yes → principle 10 PASS.
2. **Every load-bearing CC claim ≥2 sources?** Remote Control / Routines / Channels / agent-view / Slack each have primary-doc + (DeepWiki or a second primary page). Routines + Channels each have a dedicated-page fetch beyond the overview. PASS.
3. **Own-stack-first actually applied (not lip-service)?** Stage 1 flipped 3 companion rows to skip-redundant + sharpened #86's trigger toward CC Routines. PASS.
4. **Any shipped artefact silently retired?** No — §4b R4 explicitly keeps `questions.ts`; the only «retire» language is about *companion* capabilities on the operator axis. T-SFH-D PASS.
5. **SSOT append-only?** One row #100; no existing row edited. PASS.
6. **Verdicts = recommendations?** Yes — header + §4 «edit deferred to maintainer» + table #5 surfaced not decided. PASS.
7. **Honest caveats?** Routines research-preview + daily cap (§4.2), Channels session-open-only (§4.3) both disclosed, not buried. PASS.
- **No MAJOR findings.** MINOR: Routines/Channels are research-preview — re-verify before any load-bearing dependence (flagged in §4.2/§4.3).

---

## 🟢 Простыми словами

Главный вывод: я сначала прошёлся по тому, что **Claude Code уже умеет сам** (own-stack-first), и оказалось — половину «спутниковых» фич мы зря записывали на компаньонов. CC нативно даёт: **Remote Control** (рулить сессией с телефона — ровно то, что мы упустили в инциденте), **Routines** (`/schedule` — задачи по расписанию в облаке Anthropic, работают даже с закрытым ноутом; триггеры по cron / по HTTP / по GitHub-событиям), **Channels** (Telegram/Discord прямо в сессию, двусторонне), **background agent-view** (смотреть несколько параллельных сессий на одном экране), **Slack** (`@Claude`→PR).

**Включить сейчас (4 штуки, всё бесплатно-конфигом, без кода):** (1) Remote Control — присматривать за автономными прогонами с телефона; (2) Routines через `/schedule` — гонять периодические аудиты дисциплины (например memory-re-audit, у которого сейчас вообще нет планировщика) автономно в облаке; (3) Channels(Telegram) — пинг и ответы с телефона во время долгой *локальной* сессии; (4) agent-view — видеть параллельных воркеров.

**Обратная зачистка:** Superset Automations → их закрывает CC Routines; Superset Slack → CC Slack/Channels; amux-дашборд → CC agent-view. **Важно (T-SFH-D):** наш `questions.ts` (park/resume для автономных прогонов) я **не** трогаю — Channels работает только пока сессия открыта, так что заменить его не может; это остаётся нашим. Ничего «нашего shipped» не выпиливаем.

**Осторожно:** Routines и Channels — research preview (лимиты/API могут меняться, у Routines дневной лимит запусков) — перепроверить перед тем как вешать на них что-то load-bearing.

Одна новая строка SSOT #100 (только добавление, старые не переписаны). Решение по «включать/нет» — за тобой.
