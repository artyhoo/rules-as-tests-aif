# AI Documentation & Context-Hygiene Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `ai-doc-audit` umbrella and execute **Cycle 0 + Cycle 1**: build the audit instrumentation (always-on measurement + channel live-probe), build the Cycle-0 doc-authoring skill + standing drift-guard, then run C1 R→Audit→I→Verify over the CC-config + root-docs surface.

**Architecture:** The umbrella is one task with progressively-widening cycles, each = R (research the target) → Audit (conformance + fix-plan via the project's own `rule-enforcement-channel-selection.md`) → I (implement) → Verify (re-measure + cold-review). This plan covers Cycle 0 (instrumentation + doc-skill + drift-guard, all TDD-buildable now) and Cycle 1 (the always-on + shipped surface). The reconciliation principle — «rule = test (code, zero context)» is independent of «prose lives on-demand» — is the spine; each migration is probe-backed, never header-trusted.

**Tech Stack:** Bash (deterministic checks, `scripts/*.sh` + paired `*.test.sh`), Vitest (`packages/core/principles/*.test.ts`), Markdown skills (`.claude/skills/*/SKILL.md`), CC hooks (`.claude/settings.json`). No new runtime deps. No paid LLM (per `no-paid-llm-in-ci.md`).

**Spec:** [`docs/superpowers/specs/2026-06-04-ai-doc-audit-design.md`](../specs/2026-06-04-ai-doc-audit-design.md).

---

## Scope

**This plan = Cycle 0 + Cycle 1 only.** C2 (+`docs/meta-factory/*`) and C3 (+`packages/*`) get their **own plans, written after C1's findings exist** — their R-targets and per-artefact verdicts depend on C1 outputs, so bite-sizing them now would fabricate detail (spec §Open-questions: «C2/C3 R likely thin deltas»). Cycle 0 + C1 is a complete, testable deliverable on its own: instrumentation that produces numbers, a doc-skill + drift-guard that stand, and a measurably-cleaner always-on surface with zero gate weakened.

## File Structure

| Path | Created/Modified | Responsibility |
|---|---|---|
| `.claude/orchestrator-prompts/ai-doc-audit/kickoff.md` | Create (**gitignored** — substrate, not committed) | Umbrella stage-map: the 4-phase × cycle gates, dispatch prompts |
| `scripts/measure-always-on.sh` | Create | Emit always-on context baseline (bytes, per-file JSON) — the exit-criterion meter |
| `scripts/measure-always-on.test.sh` | Create | Test the meter (valid JSON, positive total, ≥ rules baseline) |
| `scripts/probe-channels.sh` | Create | Per-rule deterministic channel report (has principle-test? wired hook? `globs:`/`paths:` markers?) + flag session-only probes INCONCLUSIVE |
| `scripts/probe-channels.test.sh` | Create | Test the probe (known rule with a test reports `gate=yes`) |
| `.claude/skills/ai-doc/SKILL.md` | Create | Cycle-0 doc-authoring thin wrapper (composes `writing-skills` + AIF + project lens) — must carry principle-15 paired-negative block |
| `.claude/skills/ai-doc/anthropic-and-aif-residue.md` | Create | The on-demand residue file (AIF template-vars + Class A/B/C lens) — progressive disclosure |
| `scripts/check-alwayson-budget.sh` | Create | Standing drift-guard: fail if always-on total exceeds the C1-set ceiling |
| `scripts/check-alwayson-budget.test.sh` | Create | Test the guard (under ceiling → exit 0; over → exit 1) |
| `docs/meta-factory/research-patches/2026-06-04-ai-doc-audit-c1-r.md` | Create | C1-R research-patch — must start with `<!-- scope:ai-doc-audit -->` (principle 10) |
| `.claude/orchestrator-prompts/ai-doc-audit/c1-audit-verdicts.md` | Create (gitignored) | C1-Audit per-artefact verdict table (probe-backed) |
| (various) | Modify in C1-I | The actual fixes the verdicts call for — exact files unknown until Task 7 |

---

### Task 1: Umbrella kickoff scaffold

**Files:**
- Create: `.claude/orchestrator-prompts/ai-doc-audit/kickoff.md` (gitignored — verified `git check-ignore` returns IGNORED)

- [ ] **Step 1: Create the kickoff stage-map**

Write `.claude/orchestrator-prompts/ai-doc-audit/kickoff.md` with this exact structure (fill each cycle's dispatch prompt):

```markdown
# ai-doc-audit — umbrella kickoff

Goal + spine + reconciliation: see docs/superpowers/specs/2026-06-04-ai-doc-audit-design.md (do not restate — pointer only, per the audit's own lean-context criterion).

## Stage gates (one task; cycles sequential; each phase its own session)

- [ ] Cycle 0 — instrumentation (Tasks 2,3 of the plan) + doc-skill (Task 4) + drift-guard (Task 5)
- [ ] C1-R   — research-patch: target standard for CC-config+root surface (Task 6)
- [ ] C1-Audit — verdict table via rule-enforcement-channel-selection §1–§4, probe-backed (Task 7)
- [ ] C1-I   — apply verdicts, atomic commits (Task 8)
- [ ] C1-Verify — re-measure (net ↓, 0 gate weakened) + cold-review (Task 9)
- [ ] C2 — own plan (after C1)   - [ ] C3 — own plan (after C2)

## Gate rule
R research-patch = binding target for Audit · Audit fix-list = binding scope for I · Verify must pass before next cycle's R.

## Closure
C3-I writes .claude/orchestrator-prompts/ai-doc-audit/done.md (CLAUDE.md §Umbrella closure schema).
```

- [ ] **Step 2: Verify it is gitignored (not accidentally tracked)**

Run: `git check-ignore .claude/orchestrator-prompts/ai-doc-audit/kickoff.md`
Expected: prints the path (IGNORED). No commit — this is orchestration substrate.

---

### Task 2: Always-on baseline measurement script

**Files:**
- Create: `scripts/measure-always-on.sh`
- Test: `scripts/measure-always-on.test.sh`

- [ ] **Step 1: Write the failing test**

Create `scripts/measure-always-on.test.sh`:

```bash
#!/usr/bin/env bash
# Test for measure-always-on.sh — runs the meter and asserts a valid, sane baseline.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
out="$("$DIR/measure-always-on.sh")" || { echo "FAIL: script errored"; exit 1; }
echo "$out" | jq -e . >/dev/null 2>&1 || { echo "FAIL: not valid JSON"; exit 1; }
total="$(echo "$out" | jq -r '.total_bytes')"
[[ "$total" =~ ^[0-9]+$ ]] || { echo "FAIL: total_bytes not integer"; exit 1; }
# Baseline must exceed 100k (11 rules ~151k + CLAUDE.md), guards an empty-manifest regression.
(( total > 100000 )) || { echo "FAIL: total_bytes $total <= 100000 (manifest empty?)"; exit 1; }
echo "PASS: total_bytes=$total"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash scripts/measure-always-on.test.sh`
Expected: FAIL — `measure-always-on.sh` does not exist yet (`script errored`).

- [ ] **Step 3: Write the meter**

Create `scripts/measure-always-on.sh`:

```bash
#!/usr/bin/env bash
# Measure the always-on context baseline (bytes) — the ai-doc-audit exit-criterion meter.
# Always-on sources = files CC loads at session start. The manifest below is the DECLARED
# set; the channel probe (probe-channels.sh) confirms membership. Emits per-file + total JSON.
# spec: docs/superpowers/specs/2026-06-04-ai-doc-audit-design.md §Success-criteria
set -uo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

files=( "CLAUDE.md" )
while IFS= read -r r; do files+=( "$r" ); done < <(find .claude/rules -maxdepth 1 -name '*.md' | sort)

total=0
printf '{\n  "sources": [\n'
first=1
for f in "${files[@]}"; do
  [[ -f "$f" ]] || continue
  b=$(wc -c < "$f" | tr -d ' ')
  total=$(( total + b ))
  [[ $first -eq 0 ]] && printf ',\n'
  printf '    {"path": "%s", "bytes": %s}' "$f" "$b"
  first=0
done
printf '\n  ],\n  "total_bytes": %s\n}\n' "$total"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `chmod +x scripts/measure-always-on.sh scripts/measure-always-on.test.sh && bash scripts/measure-always-on.test.sh`
Expected: `PASS: total_bytes=<~160000+>`

- [ ] **Step 5: Commit**

```bash
git add scripts/measure-always-on.sh scripts/measure-always-on.test.sh
git commit -m "feat(audit): always-on context baseline meter for ai-doc-audit exit criterion

Prior-art: skipped — tooling script under scripts/ (not a packages/ capability commit per CLAUDE.md capability-commit definition); no new dependency."
```

---

### Task 3: Channel live-probe battery

**Files:**
- Create: `scripts/probe-channels.sh`
- Test: `scripts/probe-channels.test.sh`

- [ ] **Step 1: Write the failing test**

Create `scripts/probe-channels.test.sh`:

```bash
#!/usr/bin/env bash
# Test for probe-channels.sh — a known rule with a shipped principle-test must report gate=yes.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
out="$("$DIR/probe-channels.sh")" || { echo "FAIL: script errored"; exit 1; }
# ai-laziness-traps has principle 12 (verified present) → must be reported as gate-backed.
echo "$out" | grep -q "ai-laziness-traps.*gate=yes" || { echo "FAIL: ai-laziness-traps not gate=yes"; exit 1; }
# A rule with no principle-test/hook must be reported gate=no (judgment candidate).
echo "$out" | grep -q "reviewer-discipline.*gate=no" || { echo "FAIL: reviewer-discipline not gate=no"; exit 1; }
echo "PASS"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash scripts/probe-channels.test.sh`
Expected: FAIL — `probe-channels.sh` missing.

- [ ] **Step 3: Write the probe**

Create `scripts/probe-channels.sh`:

```bash
#!/usr/bin/env bash
# Per-rule deterministic channel report for ai-doc-audit C1-Audit.
# For each .claude/rules/*.md reports the activation artefacts that ACTUALLY exist on disk
# (not what a header claims): a principle-test referencing the rule slug, a PostToolUse hook
# wired in settings.json, a `<!-- globs: -->` marker, a `paths:` frontmatter field.
# Session-only probes (does inject-matching-rule.sh FIRE; does paths: LOAD at read-time)
# CANNOT be settled in bash → emitted as INCONCLUSIVE for a live-session probe.
# spec: §Verify-don't-trust ; reconciliation tier assignment is downstream judgment.
set -uo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 1
SETTINGS=".claude/settings.json"

for rule in .claude/rules/*.md; do
  slug="$(basename "$rule" .md)"
  # gate = a principle test naming this slug (the real test, on disk)
  if grep -rql -- "$slug" packages/core/principles/*.test.ts 2>/dev/null; then gate=yes; else gate=no; fi
  # globs/paths markers present?
  grep -q '<!-- globs:' "$rule" && globs=yes || globs=no
  grep -qE '^paths:' "$rule" && paths=yes || paths=no
  echo "$slug gate=$gate globs=$globs paths=$paths inject-fire=INCONCLUSIVE-needs-live-probe"
done
# Hook wiring (deterministic): is inject-matching-rule wired at all?
if grep -q 'inject-matching-rule.sh' "$SETTINGS" 2>/dev/null; then
  echo "_hook inject-matching-rule=wired-in-settings (FIRING still needs live probe)"
else
  echo "_hook inject-matching-rule=NOT-wired"
fi
```

- [ ] **Step 4: Run test to verify it passes**

Run: `chmod +x scripts/probe-channels.sh scripts/probe-channels.test.sh && bash scripts/probe-channels.test.sh`
Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add scripts/probe-channels.sh scripts/probe-channels.test.sh
git commit -m "feat(audit): per-rule deterministic channel probe (gate/globs/paths; session-probes flagged INCONCLUSIVE)

Prior-art: skipped — tooling script under scripts/ (not a packages/ capability commit per CLAUDE.md definition); no new dependency."
```

---

### Task 4: Cycle-0 doc-authoring skill (thin wrapper)

**Files:**
- Create: `.claude/skills/ai-doc/SKILL.md` (must satisfy principle 15 — paired-negative block)
- Create: `.claude/skills/ai-doc/anthropic-and-aif-residue.md` (progressive-disclosure residue)
- Test: baseline subagent pressure test (per `superpowers:writing-skills`) + `packages/core/principles/15-skill-paired-negative.test.ts` (existing gate)

- [ ] **Step 1: Verify the principle-15 gate currently passes (baseline RED is "new skill will fail it")**

Run: `npx vitest run packages/core/principles/15-skill-paired-negative.test.ts`
Expected: PASS now (5 grandfathered skills exempt). After adding `ai-doc/SKILL.md` WITHOUT a paired-negative block it will FAIL — that is the structural test guarding this task.

- [ ] **Step 2: Write the skill with the required paired-negative block**

Create `.claude/skills/ai-doc/SKILL.md` (thin — composes upstream, does not copy; carries the paired-negative block principle 15 requires):

```markdown
---
name: ai-doc
description: Use when creating or fixing an AI-facing doc/rule/skill/agent in this repo (SKILL.md, .claude/rules/*, agents/*, CLAUDE.md, AGENTS.md) — to apply the project's context-hygiene + rule-as-test + AI-agnostic authoring standard. Triggers: write a rule, author a skill, fix a doc, doc-authority header, progressive disclosure, channel selection, документация, правило, скилл.
---

# ai-doc — AI-doc authoring standard (thin wrapper)

## Overview
Composes existing skills; does NOT reinvent. For the authoring mechanics invoke
`superpowers:writing-skills` (TDD-for-docs + bundled Anthropic best-practices + progressive
disclosure). This wrapper adds only the residue upstream lacks → see
[anthropic-and-aif-residue.md](anthropic-and-aif-residue.md) (loaded on demand).

## The standard (judgment calls; mechanics are upstream)
- **Channel by `rule-enforcement-channel-selection.md` §1–§4**: detectability → gate vs injection; relevance → narrowest reliable trigger. Reserve always-on for the 3–4 invariants.
- **Rule = test = code at the earliest channel** (zero standing context); prose lives on-demand/path-scoped. Both hold at once (spec §Reconciliation).
- **AI-agnostic**: portable `<!-- globs: -->` marker + AIF template-vars; degrade without the harness.
- **Doc-authority header** per `doc-authority-hierarchy.md` §3 on any canonical doc.

## When NOT to use (paired-negative)
- Do NOT use for one-off task instructions, ephemeral notes, or pure code edits with no doc/rule change — that is over-application (`#codify-everything`).
- Do NOT use to author a *project-specific convention* as a standalone always-on rule — put it in CLAUDE.md (Superpowers `writing-skills` boundary).
- Do NOT trigger on snapshot regen, typo fixes, or lockfile updates.
```

- [ ] **Step 3: Write the on-demand residue file**

Create `.claude/skills/ai-doc/anthropic-and-aif-residue.md` with: the AIF `AGENT_REGISTRY` + `{{config_dir}}/{{skills_dir}}` template-var pattern, the `universal` fallback note, the project `Class A/B/C` decision table, and the Anthropic description rules (third-person, pushy, ≤1024 chars, explain-the-reason). Keep it reference-shaped (loaded only when authoring portability/class decisions).

- [ ] **Step 4: Run the principle-15 gate to verify the new skill passes**

Run: `npx vitest run packages/core/principles/15-skill-paired-negative.test.ts`
Expected: PASS (the `## When NOT to use (paired-negative)` block satisfies the structural check). If it fails, the block heading/shape must match design §3 — inspect the test's matcher, fix the block, do NOT add `ai-doc` to EXEMPT_SKILLS.

- [ ] **Step 5: Baseline subagent pressure test (writing-skills discipline)**

Dispatch one subagent with a doc-authoring task WITHOUT the skill (baseline), record whether it front-loads prose / picks always-on by default. Then WITH the skill, confirm it picks the channel-selection path. Record both in `.claude/orchestrator-prompts/ai-doc-audit/cycle0-skill-baseline.md` (gitignored). This is the RED→GREEN evidence the skill teaches the right thing (per `superpowers:writing-skills` core principle).

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/ai-doc/
git commit -m "feat(skill): ai-doc authoring standard — thin wrapper over writing-skills + AIF + project lens

Prior-art: prior-art-evaluations.md — ADOPT Superpowers writing-skills (base) + ADAPT AIF registry/template-vars; thin wrapper, not a fork (build-first-reuse-default.md §1)."
```

> **Note (capability-commit):** a new file ≥80 LOC under `packages/` would be a capability commit; `.claude/skills/` is not `packages/`, so the LOC trigger does not fire. The `Prior-art:` trailer above is still included because the commit introduces an authoring capability — cite the SSOT ADOPT/ADAPT verdict for `writing-skills`. If `prior-art-evaluations.md` has no `writing-skills` row, add one in this commit (verdict ADOPT, rationale, trigger-to-revisit) per CLAUDE.md.

---

### Task 5: Cycle-0 standing drift-guard (always-on budget ceiling)

**Files:**
- Create: `scripts/check-alwayson-budget.sh`
- Test: `scripts/check-alwayson-budget.test.sh`

- [ ] **Step 1: Write the failing test**

Create `scripts/check-alwayson-budget.test.sh`:

```bash
#!/usr/bin/env bash
# Test the drift-guard: under ceiling → exit 0; over → exit 1.
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
# Huge ceiling → must pass (exit 0)
AIF_ALWAYSON_CEILING=999999999 "$DIR/check-alwayson-budget.sh" >/dev/null 2>&1 || { echo "FAIL: under-ceiling should exit 0"; exit 1; }
# Zero ceiling → must fail (exit 1)
if AIF_ALWAYSON_CEILING=0 "$DIR/check-alwayson-budget.sh" >/dev/null 2>&1; then echo "FAIL: over-ceiling should exit 1"; exit 1; fi
echo "PASS"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash scripts/check-alwayson-budget.test.sh`
Expected: FAIL — guard missing.

- [ ] **Step 3: Write the drift-guard**

Create `scripts/check-alwayson-budget.sh`:

```bash
#!/usr/bin/env bash
# Standing drift-guard: fail if the always-on context baseline exceeds the ceiling set by
# C1-Audit. Keeps the cleaned surface from re-bloating after the umbrella closes.
# Ceiling source: $AIF_ALWAYSON_CEILING (env) — wired into pre-push by a C1-I fix once the
# real ceiling is known. Deterministic; no paid LLM (no-paid-llm-in-ci.md).
set -uo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
CEILING="${AIF_ALWAYSON_CEILING:-200000}"   # placeholder default; C1-Audit sets the real value
total="$("$DIR/measure-always-on.sh" | jq -r '.total_bytes')"
if (( total > CEILING )); then
  echo "DRIFT: always-on context ${total}B exceeds ceiling ${CEILING}B" >&2
  exit 1
fi
echo "OK: always-on ${total}B within ceiling ${CEILING}B"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `chmod +x scripts/check-alwayson-budget.sh scripts/check-alwayson-budget.test.sh && bash scripts/check-alwayson-budget.test.sh`
Expected: `PASS`

- [ ] **Step 5: Commit**

```bash
git add scripts/check-alwayson-budget.sh scripts/check-alwayson-budget.test.sh
git commit -m "feat(audit): standing always-on budget drift-guard (ceiling env, pre-push wiring deferred to C1-I)

Prior-art: skipped — tooling script under scripts/ (not a packages/ capability commit per CLAUDE.md definition); no new dependency."
```

---

### Task 6: C1-R — research the target standard (research-patch)

> Orchestrated R-phase, not TDD code. Deliverable is a research-patch; acceptance is concrete.

**Files:**
- Create: `docs/meta-factory/research-patches/2026-06-04-ai-doc-audit-c1-r.md`

- [ ] **Step 1: Write the research-patch (principle-10 compliant)**

First line MUST be exactly `<!-- scope:ai-doc-audit -->` (principle 10 regex `/^<!-- scope:[a-zA-Z0-9.§-]+ -->$/`). Body restates the target standard for the CC-config + root-docs surface — **mostly pre-done this session**: the spine criterion, the reconciliation 3-tier, the channel-combo (reuse `rule-enforcement-channel-selection.md`), the doc-skill BFR verdict. Cite SSOT rows by ID; run the search-coverage 6-item checklist for any «no upstream exists» claim.

- [ ] **Step 2: Run the live-probes the spec mandates (settle the INCONCLUSIVE rows)**

In a live CC session, execute the §Verify-don't-trust probes that bash could not:
- Edit a file matching a rule's `<!-- globs: -->`; capture whether `additionalContext` was injected (inject-matching-rule FIRES, not just wired).
- Read a `paths:`-scoped rule's target file; confirm `InstructionsLoaded load_reason=path_glob_match`.
- Confirm the real always-on load mechanism (CC `.claude/rules` auto-load vs `CLAUDE.md` @-import vs hook) — record what is truly in context.
Record each as command + observed output in the research-patch. No prose-only findings (T3).

- [ ] **Step 3: Acceptance + commit**

Acceptance: research-patch carries scope annotation (run `npx vitest run packages/core/principles/10-research-patch-annotation.test.ts` → PASS), cites ≥1 SSOT ID, and every channel claim it relies on has a probe command+output or an explicit INCONCLUSIVE. Commit:

```bash
git add docs/meta-factory/research-patches/2026-06-04-ai-doc-audit-c1-r.md
git commit -m "docs(research): ai-doc-audit C1-R — target standard + live channel probes for CC-config+root surface

Prior-art: skipped — research-patch (markdown), no new capability."
```

---

### Task 7: C1-Audit — per-artefact verdict table (probe-backed)

> Orchestrated Audit phase. No source edits (T5). Deliverable = the verdict table.

**Files:**
- Create: `.claude/orchestrator-prompts/ai-doc-audit/c1-audit-verdicts.md` (gitignored)

- [ ] **Step 1: Enumerate the population first (T10)**

Run `bash scripts/probe-channels.sh` and `bash scripts/measure-always-on.sh`; list every artefact in the C1 surface (`.claude/rules/*` ×11, `.claude/hooks/*` ×13, `.claude/skills/*` ×7, `agents/*` ×5, `.claude/settings.json`, root docs) BEFORE classifying. Population count is recorded; sampling is not the method here (full enumeration — the set is small).

- [ ] **Step 2: Classify each artefact via `rule-enforcement-channel-selection.md` §1–§4**

For each, assign one candidate verdict (`GATE-ONLY / KEEP-ALWAYS-ON / COMPRESS-TO-DIGEST / PATH/EVENT-SCOPED-INJECT / ON-DEMAND-SKILL / MAKE-PORTABLE`) + the 3-tier reconciliation tier. **Each verdict cites a probe** (the gate test that exists + fires, or the 6-item negative-existence check for «no gate possible», or the `globs:`/`paths:` marker presence). Apply the §Presumption: behavioural-shaping prose defaults to compressed-always-on or path/event-scoped, NOT ON-DEMAND-SKILL. State per migration: «upstream problem-class X vs ours Y; match? evidence» (T16).

- [ ] **Step 3: Produce the ordered fix-list + the always-on ceiling**

Output: the verdict table + an ordered fix-list for C1-I + the **numeric always-on ceiling** to wire into `check-alwayson-budget.sh` (set below the measured baseline by the sum of confirmed COMPRESS/MOVE savings). This ceiling is the Task-5 guard's real value.

- [ ] **Step 4: Acceptance**

Acceptance: every C1 artefact has a verdict; every verdict has a probe citation (no header-only verdicts); the fix-list is ordered and scoped; the ceiling is a concrete integer. Gitignored deliverable — no commit (substrate).

---

### Task 8: C1-I — apply the verdicts

> Orchestrated I-phase. Exact files depend on Task 7's verdicts (cannot be pre-listed without fabricating — that is correct, not a placeholder). Atomic commits, one concern each.

- [ ] **Step 1: For each fix-list item, make the minimal atomic change**

Per verdict: `COMPRESS-TO-DIGEST` → move rule prose to a digest line + pointer (preserve the full rule at its on-demand/path-scoped home); `PATH/EVENT-SCOPED-INJECT` → add/confirm the `<!-- globs: -->` marker + `paths:` frontmatter (keep both glob sets identical per `rule-enforcement-channel-selection.md` §4); `GATE-ONLY` → confirm the gate fires, drop the redundant always-on prose; `MAKE-PORTABLE` → only if Task 7 cited a real non-CC consumer, else DEFER-with-trigger.

- [ ] **Step 2: Wire the drift-guard ceiling**

Set `check-alwayson-budget.sh` ceiling to Task-7's integer (replace the placeholder default) and wire it into `.husky/pre-push` (deterministic, no paid LLM). Add its `.test.sh` ceiling case.

- [ ] **Step 3: Run all gates after each commit**

Run: `npx vitest run packages/core/principles/` and `bash scripts/*.test.sh`
Expected: all PASS. Any principle-test that fires on a moved artefact (e.g. 09 doc-authority, 15 paired-negative) must be satisfied IN the same commit — re-run before push (the PR #264 double-fire lesson).

- [ ] **Step 4: Commit each fix atomically** with a `Prior-art:` trailer (escape-hatch for non-capability doc moves; real trailer if a fix adds a capability).

---

### Task 9: C1-Verify — re-measure + cold-review (numeric exit)

> Orchestrated Verify phase. The cycle is done only when the numbers hold.

- [ ] **Step 1: Re-measure net always-on context**

Run: `bash scripts/measure-always-on.sh`
Expected: `total_bytes` **strictly below** the Task-2 baseline (the new ai-doc skill + drift-guard + research-patch are NOT always-on, so they do not count against it — confirm they are absent from the meter's manifest). If net did not drop → cycle FAILED Verify (spec §Success-criteria).

- [ ] **Step 2: Confirm zero gate weakened**

Run: `npx vitest run packages/core/principles/` and `bash scripts/*.test.sh`
Expected: every gate that passed before still passes (re-run the spine falsifier per moved rule: the bypass each gate caught before, it still catches). Confirm every behavioural-shaping rule still reaches the agent (always-on-compressed or path/event-injected — none silently dropped).

- [ ] **Step 3: Adversarial cold-review (T19 — own QA before handoff)**

Dispatch a fresh read-only subagent over the full C1 diff: does any COMPRESS/MOVE silently weaken enforcement? Any header-trusted verdict? Any prose-only finding? Record verdict in `.claude/orchestrator-prompts/ai-doc-audit/c1-verify.md` (gitignored). CI green ≠ design review.

- [ ] **Step 4: Gate to C2**

If Step 1 (net ↓) AND Step 2 (zero weakened) AND Step 3 (cold-review clean) → C1 closed; C2 gets its own plan. Else → back to Task 8 with the cold-review findings.

---

## Self-Review (run after writing — done)

- **Spec coverage:** spine criterion → Tasks 7–9 (channel classification + exit); reconciliation 3-tier → Task 7 Step 2 + Task 9 Step 2; combo (reuse channel-selection rule) → Task 7 Step 2; doc-skill BFR → Task 4; standing drift-guard → Tasks 5, 8; live-probe obligations → Task 3 + Task 6 Step 2; numeric exit → Tasks 2, 9; recursive self-application → kickoff Task 1 (pointer, not restate). C2/C3 explicitly deferred to own plans (Scope).
- **Placeholder scan:** Task 8's «exact files unknown» is intentional (depends on Task 7 verdicts) and stated as such — not a lazy TODO. All TDD tasks (2,3,4,5) carry full code.
- **Type/name consistency:** `measure-always-on.sh` consumed by `check-alwayson-budget.sh` (Task 5) and Task 9 Step 1; `AIF_ALWAYSON_CEILING` env name consistent across Task 5 script + test; `probe-channels.sh` gate=yes/no field consumed by Task 7.

---

## Execution Handoff

Cycle 0 Tasks 2–5 are direct TDD (subagent-driven ideal). Tasks 1, 6–9 are orchestrated R/Audit/I/Verify stages — run each as its own session per the kickoff gates, dispatched through the project's loop (`/dispatcher` / aif) or subagent-driven-development.
