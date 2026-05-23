---
name: meta-orchestrator
description: Plan-preflight + cross-umbrella priority + launch-table + stage-gate-aware dispatch for multi-wave umbrellas. Use when invoking /meta-orchestrator [<umbrella>] to verify wave-sequencing-plan currency + decide next wave + generate meta-kickoff + dispatch with real git gates.
when_to_use: User explicit invocation only via /meta-orchestrator slash command. Not auto-triggered.
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

`disable-model-invocation: true` — fires ONLY on explicit `/meta-orchestrator` invocation (prevents recursive self-invocation in subagents).

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

For the full behaviour specification (§1 Plan-currency through §11 Failures), see `.claude/skills/meta-orchestrator/SKILL.md` after install.
