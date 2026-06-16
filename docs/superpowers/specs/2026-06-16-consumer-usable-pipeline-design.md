# Consumer-usable `/pipeline` — design (supersedes GH #482)

> **Authoritative for:** design of making the shipped `/pipeline` (planner) + `/dispatcher` (executor) skills actually operate on a **consumer's own project** instead of silently no-opping. Scope-bound to the rebind + convention-ship work below.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). The skills' own behaviour spec — see [.claude/skills/pipeline/SKILL.md](../../../.claude/skills/pipeline/SKILL.md) (§0–§11). Implementation steps — see the `writing-plans` output that follows this spec.

**Date:** 2026-06-16 · **Status:** design (pre-implementation) · **Branch:** TBD (`feat/consumer-usable-pipeline`, off `staging`)

---

## 1. Problem & goal

`install.sh` ships `pipeline` + `dispatcher` (+ `aif-doctor`, `template-audit`) to consumer projects (`for _skill in pipeline dispatcher aif-doctor template-audit`, ~[install.sh:480](../../../install.sh)). In a consumer both **silently no-op**, because they were built for the framework's own conventions.

**Goal (maintainer, Option A):** a consumer plans + orchestrates **their own** backlog with `/pipeline` — it searches kickoffs/handoffs, prioritises, decomposes/composes, exactly as it does here. This **supersedes [GH #482](https://github.com/Yhooi2/rules-as-tests-aif/issues/482)** ("`/pipeline` no-ops in a consumer") — "make it work" is strictly stronger than "make it honestly skip."

### 1.1 The reframe (maintainer, 2026-06-16) — load-bearing

The work is **not** "generalise the skill to read foreign backlog formats (GitHub issues, TODO.md)." It is:

> The framework ships **rules + documentation**, including **where** kickoffs/handoffs/plan are stored and **in what format**. The consumer's project **adopts those conventions**. So `/pipeline` works **identically** — it looks in the documented place, and on first run, if no plan exists yet, it **creates** one. An empty backlog (no work set up yet) is **correct**, not a failure.

So this is a **rebind + ship-the-convention** task, build-vs-reuse-aligned ([.claude/rules/build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md)): reuse the shipped skill; fix the bindings; ship the operating convention that's currently missing.

## 2. Grounded coupling findings (verified 2026-06-16)

Classification of every framework-coupling as **path-level** (cheap rebind) vs **logic-level** (real rework). Two read-only audit agents + direct spot-checks (`priority-score.sh:61`, `:221-225`; `launch-table-generator.sh:68`; `resolver.ts`; `install.sh:48-57`).

- **The scoring is not in code.** `priority-score.sh:61-62`: *"The SKILL.md body applies the multi-criteria scoring and ranking (judgment). This helper supplies deterministic facts only."* No wave-shaped algorithm to rewrite.
- **Most machinery is generic or `MO_*`-seamed:** persistence (delta/cache writers), dedup (`dup-detect.sh`), in-flight detection (`inflight-check.sh` — generic `gh`/`git`), `lib/common.sh`, `delta-diff.sh`, `run-helper.sh`, `parse-override-flags.sh`. State/cache/delta files already default under `.claude/orchestrator-prompts/_*.{md,json}` and are `MO_*`-overridable.
- **First-run + empty-backlog already graceful:** `SKILL.md:100` ("If `wave-sequencing-plan.md` is MISSING entirely: skill writes a stub … presents to maintainer for OK"); `plan-currency-check.sh:131` (warn-and-skip when plan absent); `priority-score.sh:103` (`"(no .claude/orchestrator-prompts directory)"`).
- **The no-op cause is mechanical, not mysterious:** `launch-table-generator.sh:68` parses `## §N Sub-wave` kickoff structure → empty in a consumer → `SKILL.md:443` HARD GATE fires ("found no sub-waves → STOP"). Per the reframe, empty-when-no-backlog is **acceptable** — the fix is that this path is *reachable and correct*, not that the gate is wrong.
- **`install.sh` transform only de-dangles doc links** (`transform_internal_refs`, [install.sh:48-57](../../../install.sh)): rewrites `](../../../{docs,packages,README})` markdown links to blob URLs in `*.md` only. Helpers ship verbatim; framework path strings inside them reach the consumer raw.
- **Dispatch has no CC-native backend:** `resolver.ts` exposes only `AifHandoffBackend`/`AifFireBackend` (aif REST); `ManualBackend` writes a `/tmp` stub. `runtime-bridge` is **not shipped** to consumers (only `packages/core/hooks/`). → see §6, dispatcher stays as-is.

**Net:** Slice-1 (planner) = mostly reuse + a few small rebinds. The original "3 slices" collapse to **one coherent piece** (§5).

## 3. What already works — do NOT touch

- Kickoff path resolution (`.claude/orchestrator-prompts/<name>/kickoff.md` is repo-root-relative → consumer-resolvable).
- Empty-backlog grace, first-run plan-stub creation, plan-absent warn-skip.
- Ranking (AI-judgment prose in `SKILL.md §2`), dedup, in-flight, delta/cache persistence — generic.

## 4. The home decision — agnostic `.ai-factory/`, not `.claude/`

**Constraint (corrected after maintainer catch):** consumer **data** (their backlog) must not live under `.claude/` — that is a **Claude-Code-specific** directory; coupling the consumer's work to one harness violates the AI-agnostic invariant ([dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md): shipped core is AI-/OS-/license-agnostic; degrades when a companion is absent).

The framework already has an **agnostic consumer namespace**: **`.ai-factory/`**. `AGENTS.md` — the universal entry doc (*"read by Claude Code, Codex CLI, Cursor, Windsurf, Roo Code, and others"*) — points into it: `.ai-factory/RULES.md`, `.ai-factory/DESCRIPTION.md`, `.ai-factory/ARCHITECTURE.md`, and already **`.ai-factory/plans/`** (the `/aif-plan` home) + `.ai-factory/RESEARCH.md`.

**Decision — consumer data home = `.ai-factory/` (agnostic):**

| Artefact | Consumer path | Framework path (kept via seam) |
|---|---|---|
| Plan | `.ai-factory/plan.md` | `docs/meta-factory/wave-sequencing-plan.md` |
| Kickoffs/handoffs | `.ai-factory/orchestrator-prompts/<name>/kickoff.md` | `.claude/orchestrator-prompts/<name>/kickoff.md` |
| Skill scratch (`_plan-cache.md`, `_master-backlog-delta.json`) | `.ai-factory/orchestrator-prompts/_*` | `.claude/orchestrator-prompts/_*` |
| Convention doc | new **Workflow / orchestration** section in `AGENTS.md` (+ `.ai-factory/` structure) | — |

Clean layer split: **`.claude/`** = CC-specific *machinery* (`skills/`, `hooks/`, `settings.json`, `agents/`) — inert on other harnesses; **`.ai-factory/`** = agnostic *data + rules*. The `/pipeline` skill itself stays a `.claude/skills/` primitive (it is a CC skill; `SKILL.md §0` already says non-CC consumers run it as a manual workflow), but it **reads its data** from the agnostic `.ai-factory/` home.

**Residual maintainer tweak (settle at spec review):** default is `.ai-factory/`; if the plan should be more human-visible, move *only* the plan to `docs/` (e.g. `docs/orchestration/plan.md`). Everything else stays in `.ai-factory/`.

## 5. Changes (the actual work)

### G1 — ship the convention (the real gap)
Today neither `AGENTS.md.template` (145 lines) nor the preset `RULES.md` mentions `orchestrator-prompts`/`kickoff`/`/pipeline`/`handoff`. Author + wire a **Workflow / orchestration** section into `AGENTS.md` (the agnostic entry) — and/or a shipped reference — that tells the consumer's AI: where kickoffs/handoffs/plan live (`.ai-factory/…`), the kickoff format, and that `/pipeline` orchestrates them. Carries a doc-authority header per [doc-authority-hierarchy.md §3](../../../.claude/rules/doc-authority-hierarchy.md).

### G2 — plan home + default polarity
Make the **shipped default** the agnostic `.ai-factory/plan.md`. The framework (special case) overrides back to its `docs/meta-factory/wave-sequencing-plan.md` via the `MO_WAVE_PLAN` seam. One SSOT, parameterized.

### G3 — first-run stub inputs
`SKILL.md:100` builds the stub from `README.md` + `EXECUTION-PLAN.md` + `ls orchestrator-prompts/`. `EXECUTION-PLAN.md` is **framework-only** — a consumer lacks it. Make the stub inputs consumer-appropriate (README + the kickoff listing; drop/optionalise `EXECUTION-PLAN.md`). **⚠ verify live** (least-sure item — see §9).

### G4 — framework-only path strings in SKILL.md body
`!shell` blocks hardcode `docs/meta-factory/wave-sequencing-plan.md` (`:77`), `docs/meta-factory/research-patches/` (`:91`), and the glob hint (`:525`). Rebind to the consumer-documented home (via the same seam used by the helpers).

### Leave as-is (degrade-to-nothing — "empty is OK")
- `priority-score-synthetic.sh` framework backlog surfaces → find nothing in a consumer → contribute zero candidates. Acceptable.
- `plan-currency-check.sh` reverse-currency vs `docs/meta-factory/research-patches` → warn-skip when plan absent. Acceptable.

### Vocabulary (cosmetic)
Skill `description`/body leans on "wave / wave-sequencing-plan.md / stage-gate." Soften to portable terms ("umbrella / plan / stage") **or** document the mapping in G1. Non-blocking.

## 6. Dispatcher — unchanged

Per maintainer: the executor keeps its two existing modes — (a) **aif autopilot** (when set up), or (b) **manual paste** — `/pipeline` writes the launch-table 1-liner with the kickoff path as the argument; the human/consumer pastes it to open a fresh session. **No new CC-native dispatch backend is built** (the framework's own design found Agent-tool `isolation:worktree` silently fails for write tasks — `SKILL.md:335`, [bug #39886](https://github.com/anthropics/claude-code/issues/39886)). The paste-tab path is the consumer default when aif is absent.

## 7. Build-vs-reuse / prior-art

REUSE the shipped skill + helpers (this is a rebind, not a new capability). The global `~/.claude/skills/orchestrator/` skill is **REFERENCE-only** (operator prose, no liftable callable mechanics; it itself defers to superpowers). No new explicit dependency, no new ≥50/80-LOC capability module is anticipated → **not a capability commit**; if implementation introduces one, it carries a `Prior-art:` trailer + SSOT consult per [CLAUDE.md](../../../CLAUDE.md).

## 8. Scope / decomposition

One spec → one plan → one PR umbrella `consumer-usable-pipeline`:
1. G1 convention doc (the gap) + AGENTS.md wiring.
2. G2/G3/G4 rebinds behind the `MO_*` seam (default flips to `.ai-factory/`; framework overrides to legacy paths).
3. Acceptance test: clean install into a throwaway consumer repo → write one kickoff in `.ai-factory/orchestrator-prompts/` → `/pipeline` finds it, ranks, emits a paste-ready launch-table; empty backlog → graceful "nothing yet," not an error.

## 9. Risks / least-sure

- **G3 (first-run stub) is the least-verified claim** — it reads framework-only `EXECUTION-PLAN.md`. Must be live-checked in a consumer before claiming "first-run works."
- **T15 dogfood (recursive self-application):** the framework's OWN `/pipeline` must keep working after the default flips to `.ai-factory/`. Mitigation: framework overrides via `MO_*`; do **not** migrate the framework's 142 existing kickoffs. Acceptance includes a framework-side smoke (`/pipeline` still ranks the framework's own umbrellas).
- **T16 (pattern-matching-on-name):** "dispatcher ships" ≠ "dispatch works for a consumer" — addressed by §6 (keep paste-tab; no false promise of autonomous consumer dispatch).

## 10. Self-application (§1.7) note

- **Forward-check:** complies with [dual-implementation-discipline.md §3](../../../.claude/rules/dual-implementation-discipline.md) (agnostic data home), [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (REUSE over BUILD), [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (all skill dispatch is session-bound), [doc-authority-hierarchy.md](../../../.claude/rules/doc-authority-hierarchy.md) (G1 doc + this spec carry headers).
- **Backward-check:** supersedes the problem statement of GH #482; does not silently override any rule. The framework's own pipeline usage is preserved (T15).
