---
name: meta-orchestrator
description: Use when you have ≥2 in-flight wave umbrellas with cross-stage dependencies, suspect drift between wave-sequencing-plan.md and live git reality, or need to dispatch the next wave with verified Stage N→N+1 gates. Russian triggers: «мета-оркестратор», «оркестратор волн», «план волн», «stage-gate», «приоритет umbrella», «волны параллельно/последовательно», «дрифт wave-sequencing-plan». Invoked explicitly via /meta-orchestrator slash command only — never auto-triggered on Claude Code (disable-model-invocation:true). On non-CC harnesses (Cursor/Aider/Codex) consumers should treat this as a manually-invoked workflow skill — the body §0 specifies invocation form.
arguments: [umbrella]
argument-hint: "[umbrella-name]"
disable-model-invocation: true
model: opus
allowed-tools:
  - Bash(git *)
  - Bash(gh *)
  - Bash(ls *)
  - Bash(cat *)
  - Read
  - Write
  - Edit
  - Agent
---

# /meta-orchestrator — plan-preflight + launch-table + stage-gate dispatch

> **Authoritative for:** /meta-orchestrator slash-command behaviour — §0 invocation through §11 failures; plan-currency check; cross-umbrella priority; Mode A/B/SDD/Queue launch-table; meta-kickoff authoring; stage-gate enforcement; reviewer dispatch. Consumer-facing shipped version; project-internal cross-links omitted.
> **NOT authoritative for:** authoring-repo goal. Project-internal version with repo-specific cross-links — see `.claude/skills/meta-orchestrator/SKILL.md` after install (installed by `install.sh`).

**Origin:** BUILD verdict 2026-05-23. Closes 4 named gaps in the global `orchestrator` skill (plan-actuality / cross-umbrella priority / auto-launch-table / stage-gate-vs-flat-queue).

**Substrate:** CC slash-command primitive + `!shell` injection + Write tool + Agent tool. Zero npm deps. Zero paid-LLM-in-CI calls.

---

## §0 Invocation

**Slash command:** `/meta-orchestrator [<umbrella-name>]`

- **With `<umbrella>` argument:** skill operates on the named umbrella — runs plan-currency check, launch-table, meta-kickoff write, offers dispatch.
- **Without argument:** skill runs global plan-currency check, cross-umbrella priority scoring, recommends winner, proceeds on confirmation.

`disable-model-invocation: true` — fires ONLY on explicit `/meta-orchestrator` invocation. The flag suppresses CC's default auto-load into subagent contexts; it is **not** a recursive-invocation guard (no such risk exists: subagent depth is hard-capped at 2 by CC's harness per [sub-agents.md](https://code.claude.com/docs/en/sub-agents.md)).

---

## Helpers

Three bash helpers are included in `helpers/`:

- `helpers/plan-currency-check.sh [<umbrella>]` — deterministic data feed for plan-currency verification (git status, open PRs, kickoff existence).
- `helpers/priority-score.sh` — enumerates umbrella candidates with type/volume/open-prs facts for §2 scoring.
- `helpers/launch-table-generator.sh <umbrella>` — auto-detects sub-waves from kickoff and emits a table skeleton.

## Templates

- `templates/meta-kickoff.template.md` — instantiated by §4 Meta-kickoff write into `.claude/orchestrator-prompts/<umbrella>-meta-launch/kickoff.md`.
- `templates/state.md.template` — instantiated by §4 Meta-kickoff write into `.claude/orchestrator-prompts/<umbrella>-meta-launch/state.md`.

---

## With this skill

`/meta-orchestrator` provides a single slash-command that verifies plan currency against live `gh pr list` output, scores cross-umbrella priority on four weighted axes, generates a structured launch-table with Mode A/B/SDD/Queue decisions, and enforces real git stage gates before each stage transition.

## Without this skill

Without `/meta-orchestrator`, multi-wave umbrella orchestration relies on manual plan-currency checks, flat queue dispatch without real stage-gate verification, ad-hoc launch-table decisions, and hand-authored kickoffs with variable AI-trap enumeration quality. The skill closes the four named gaps: plan-actuality, cross-umbrella priority, auto-generated launch-table, and stage-gate vs flat-queue.

---

## §10 Output artifacts

The `/meta-orchestrator <umbrella>` invocation writes a meta-kickoff + state.md and emits an **inline session report** in a 3-layer structure: `## Dependency graph` (Argo-style `├── / └──` ASCII tree, prospective; inter-stage edge `↓`), `## Action queue` (5-column markdown table: `Paste в новый CC tab` / `Когда` / `Ждёшь` / `Можно параллельно с`), and one `### Stage N` heading per stage carrying the 1-liner `/orchestrator <umbrella> §<section> — <NL>, остальное в kickoff`. Full grammar + 4 worked examples (Mode A / SDD / Mode B × N / Queue mode) + ASCII templates live in `references/output-format.md`; principle 18 (`packages/core/principles/18-meta-orchestrator-output-format.test.ts`) enforces those substrings.

---

## Plain-language checkpoint tail (dual-pair with end-of-turn hook)

<!-- @dual-pair: plain-language-tail -->
<!-- spec: end-of-turn-reminder.sh + this section -->

Generic per-turn end-of-turn substance (recap, on-target check, plain-language reasoning) is enforced by the project's `end-of-turn-reminder.sh` Stop hook. Don't duplicate it here.

**What this skill adds — orchestrator-checkpoint substance.** At 3 checkpoint moments, the inline `## 🟢 Простыми словами` block content names orchestration artefacts rather than per-turn personal reasoning:

| Checkpoint | Block content (in order) |
|---|---|
| Sub-wave boundary | (a) what produced; (b) AC item satisfied; (c) next-sub-wave need; (d) DECISION-NEEDED if any |
| Mid-session quota | (a) cumulative Opus + zone; (b) sub-waves done vs remaining; (c) defer/continue + rationale |
| Final umbrella | (a) AC `[x]`/`[ ]`; (b) REPORT-trace per item; (c) residuals; (d) follow-up PRs queued |

If the block content is verbatim-copyable from `end-of-turn-reminder.sh` reminder text → `#two-prompts-drift` per dual-implementation-discipline §4. Fix: replace with orchestrator-specific substance (sub-wave names, AC items, file:line, REPORT-traces, dispatch-state).

For full table + examples see `.claude/skills/meta-orchestrator/SKILL.md §10.3a` after install.

---

## Red flags / Common mistakes

When operating under this skill, these rationalizations mean STOP:

| Rationalization | Reality |
|---|---|
| «Plan looked current last session, skip §1» | Plan-currency is per-invocation — PRs merge between invocations |
| «Launch-table from memory, kickoff hasn't changed» | Kickoff edits between invocations are invisible without re-read |
| «Stage 1 was 'about to land' so dispatch Stage 2 now» | Stage gate is real `gh pr list --search "is:merged"` — never «about to» |
| «Both candidates feel similar — I'll pick A» | True ties go to maintainer as DECISION-NEEDED, not the meta-orchestrator |
| «Maintainer said 'выбирай сам' so DECISION-NEEDED is satisfied, I'll pick» | NO — «pick for me» / «оба норм» / «я устал» = *deferred* DECISION-NEEDED, not answered. Genuine answer is a content tiebreaker. Re-surface or coin-flip; don't silently pick (§2 step 4.1 in full SKILL.md). |
| «Phase -1 reviewer between stages is optional» | Mandatory regardless of stage size (CI ≠ design review) |
| «I'll quickly implement this trivial sub-wave inline» | Anti-scope: meta-orchestrator dispatches kickoffs; never implements |
| «`see ai-laziness-traps.md` is enough in meta-kickoff §5» | Blanket reference is itself T7 — explicit T-enumeration mandatory |

For the full behaviour specification (§1 Plan-currency through §11 Failures, including all anti-patterns and red-flag counters), see `.claude/skills/meta-orchestrator/SKILL.md` after install.

<!-- Channel-recommendation markers per round-2 audit Sub-wave B Invariant 4 (commit d212dae). Today the upstream `inject-matching-rule.sh` hook scans `.claude/rules/*.md` only; these markers are forward-going annotation that activates when the hook is extended to also scan `.claude/skills/*/SKILL.md`. Once active, narrows discoverability delivery from manual recall to per-edit JIT reminder on orchestrator-prompts and wave-sequencing-plan touches. -->
<!-- globs: .claude/orchestrator-prompts/**, docs/meta-factory/wave-sequencing-plan.md -->
<!-- inject: Meta-orchestrator — ≥2 in-flight wave umbrellas or wave-sequencing-plan.md drift: /meta-orchestrator (plan-currency + priority + launch-table + stage-gate dispatch). -->

