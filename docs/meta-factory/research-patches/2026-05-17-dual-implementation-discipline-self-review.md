<!-- scope:d2-dual-implementation-design -->

# 2026-05-17 — Self-review: dual-implementation discipline (D2)

> **Patch type:** self-review for new rule introduction (per [phase-research-coverage.md §1.7](../../.claude/rules/phase-research-coverage.md))
> **Companion artefact:** [.claude/rules/dual-implementation-discipline.md](../../.claude/rules/dual-implementation-discipline.md)
> **Origin:** D2 verdict B+ (2026-05-16 strategic dialogue) → design session 2026-05-17

## Problem

Decision 4 (2026-05-11) chose CC-native as the primary delivery channel for `.claude/hooks/` artefacts — a sound call given the cross-editor parity WATCHLIST state of SSOT #21 — but it was made ad-hoc, leaving no audit trail for future similar calls. This created a silent `#scope-not-formal-trigger` gap: the per-commit BFR-default gate (SSOT consult + Prior-art trailer) fires on *capability shape* (does a new capability exist?) but not on *delivery-channel shape* (should the capability ship CC-native, dual, or portable-only?). Without a formal trigger, each successive hook or agent received its channel choice implicitly. SSOT #20 (CC hooks API, ADOPT) and #21 (cross-editor parity, WATCHLIST) together documented the adjacent landscape but neither registered the delivery-channel decision protocol itself.

## Root cause

The per-commit BFR-default gate ([CLAUDE.md:32-40](../../CLAUDE.md)) is scoped to capability-commit detection: new `package.json` dependency, new file ≥50 LOC under a new `packages/core/` subdirectory, or new file ≥80 LOC under `packages/`. The rule fires correctly for those shapes. A new `.claude/hooks/*.sh` or `agents/*.md` file does not trigger the gate — these are not under `packages/`, and so carry no formal obligation to document the channel-choice rationale. Anti-pattern: `#scope-not-formal-trigger` from [phase-research-coverage.md §4](../../.claude/rules/phase-research-coverage.md) — the process gate covers the in-frame primary surface (capability creation) without firing on the adjacent channel-choice surface (delivery scope). Sibling pattern: `#recursive-self-application-gap` — delivery-channel discipline was applied to individual hook decisions (Decision 4) but never composed at a formal rule level.

## Solution

The new rule ([.claude/rules/dual-implementation-discipline.md:1-196](../../.claude/rules/dual-implementation-discipline.md)) adds three layers: (1) prose triage (§3 Internal / Consumer-facing / Performance-critical) that fires at rule-introduction time, not capability-commit time; (2) deterministic grep sketches (§5 `@dual-pair` cross-check, §6 `@cc-only-rationale` presence check) runnable as a reviewer-session step today, promotable to principle test on the §9 threshold; (3) §9 promotion criterion — whichever fires first: 3 `#two-prompts-drift` or `#cc-only-without-rationale` incidents within 6 months, or the project's 5th dual-channel artefact shipped. In the multi-channel enforcement hierarchy this rule currently sits at the prose layer (warmest channel: reviewer-session) with mechanical sketch inline and CI gate deferred.

## Prevention rule (load-bearing)

Before shipping any new framework capability — hook, agent, skill, or similar — classify it under §3 triage ([dual-implementation-discipline.md:44-74](../../.claude/rules/dual-implementation-discipline.md)) and write the `@dual-pair` or `@cc-only-rationale` marker at ship time, not retroactively. Apply T15 self-walk: would the §6 grep (`grep -E '^# @(dual-pair|cc-only-rationale):'`) flag this artefact as `MISSING marker`? If yes, add the marker before merge.

---

## §1.7 Forward-check — new rule complies with existing disciplines

### 1. Code-level discipline (R1-R20)

N/A — the new rule is a markdown discipline file. R1-R20 are ESLint rules applied to TypeScript/JavaScript code. No TypeScript code is introduced. Explicitly exempt per `.claude/rules/doc-authority-hierarchy.md §2`: «Code files (TypeScript/JS) — JSDoc comments serve different purpose». Confirmed: no `.ts` or `.js` file is added by this rule.

### 2. Principle-level discipline (principle 09 — doc-authority-hierarchy)

The new rule file has a compliant `Authoritative for` header at [dual-implementation-discipline.md:3-4](../../.claude/rules/dual-implementation-discipline.md):

```markdown
> **Authoritative for:** dual-implementation discipline rule — §1 problem, §2 triggers + non-triggers, §3 audience triage, §4 detection mechanism, §5 drift check, §6 CC-bias mitigation, §7 single source of truth, §8 anti-patterns, §9 promotion / retirement, §10 see also.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).
```

This matches the format prescribed by [doc-authority-hierarchy.md §3](../../.claude/rules/doc-authority-hierarchy.md). The canonical `REQUIRED_HEADER_DOCS` list at [packages/core/principles/09-doc-authority-hierarchy.ts:37-42](../../packages/core/principles/09-doc-authority-hierarchy.ts) is updated **in this same PR** to register the new rule — the entry `'.claude/rules/dual-implementation-discipline.md'` is added alphabetically between `doc-authority-hierarchy.md` and `no-paid-llm-in-ci.md`. Principle 09 test will now enforce header presence on the new rule, closing the registration loop within the same atomic change as the rule's introduction.

**Adjacent observation (not amended in this PR):** two pre-existing rules — `ai-laziness-traps.md` and `build-first-reuse-default.md` — are also absent from `REQUIRED_HEADER_DOCS` (verified via [09-doc-authority-hierarchy.ts:37-42](../../packages/core/principles/09-doc-authority-hierarchy.ts)). This is a pre-existing coverage gap, orthogonal to D2; surfaced here per `phase-research-coverage.md §1.6` trigger sweep discipline but **not fixed by this PR** (would be a drive-by; CLAUDE.md «no drive-by edits» constraint applies). Recommended: separate atomic commit registers both missing rules.

### 3. Capability-commit gate (CLAUDE.md §What is a capability commit?)

Per [CLAUDE.md:32-40](../../CLAUDE.md), a capability commit is one that:

- Adds a new explicit dependency in `package.json` — **NO**; no `package.json` change.
- Adds a new file ≥50 LOC under a new subdirectory of `packages/core/<new-dir>/` — **NO**; file is under `.claude/rules/`.
- Adds a new file ≥80 LOC anywhere under `packages/` — **NO**; file is not under `packages/`.

The new rule file (196 lines) is under `.claude/rules/`, not under `packages/`. [CLAUDE.md:40](../../CLAUDE.md) explicitly excludes «doc edits» from capability commits. This commit is **not** a capability commit — no `Prior-art:` trailer required beyond the escape hatch form. `Prior-art: skipped — new prose discipline rule (.claude/rules/*.md), not a capability commit per CLAUDE.md definition (no new dep, no packages/ file)` is the appropriate trailer for this commit.

### 4. Build-vs-reuse SSOT

The delivery-channel discipline concept itself was not pre-evaluated in the SSOT — the closest entries are SSOT #20 (CC hooks API, ADOPT, [prior-art-evaluations.md:88](../../docs/meta-factory/prior-art-evaluations.md)) and SSOT #21 (cross-editor parity, WATCHLIST, [prior-art-evaluations.md:89](../../docs/meta-factory/prior-art-evaluations.md)). SSOT #43 (RuntimeAdapter, ADOPT VOCABULARY, [prior-art-evaluations.md:111](../../docs/meta-factory/prior-art-evaluations.md)) provides vocabulary precedent for channel-abstraction terminology. The rule itself is a prose discipline (not a BUILD capability in the SSOT sense) — it produces no runtime artifact that an upstream tool could provide. No SSOT entry is required for a prose rule; the build-vs-reuse obligation applies to *capability commits* (code/tests under `packages/`), not to `.claude/rules/*.md` discipline files per the gate definition above.

### 5. Trigger sweep §1.6

The §13.32 entry in [open-questions.md:385](../../docs/meta-factory/open-questions.md) (Phase 10 foundations audit, ARMED) is adjacent — it will sweep `.claude/rules/*` as part of the A6 documentation artefacts stream. Its trigger condition («Wave 9 closes AND maintainer commits to Phase 10 scope») has not fired. No §13.x entry is specifically armed for the delivery-channel problem class. The new rule does not fire any existing trigger; it becomes the starting state for the §9 promotion counter.

### 6. Doc-authority header §3

Header verified at [dual-implementation-discipline.md:3-4](../../.claude/rules/dual-implementation-discipline.md) — format matches [doc-authority-hierarchy.md §3](../../.claude/rules/doc-authority-hierarchy.md) (`> **Authoritative for:**` + `> **NOT authoritative for:**` pattern). PASS.

---

## §1.7 Backward-check — complete sweep of existing artefacts under new rule's scope

**Population:** all existing framework artefacts that could be subject to §2 triggers — CC-native hooks, portable agents, internal/consumer skills, husky hooks, existing rules. Complete enumeration follows; no sampling.

### Hooks under `.claude/hooks/`

**Population: 4 files.** §9 current-state note at [dual-implementation-discipline.md:181-183](../../.claude/rules/dual-implementation-discipline.md) acknowledges all 4 predate the rule and lack markers. This is the expected starting state.

| Artefact | File:line | §3 Classification | Marker state | Action |
|---|---|---|---|---|
| `check-doc-authority.sh` | [.claude/hooks/check-doc-authority.sh:1](../../.claude/hooks/check-doc-authority.sh) | Performance-critical (PostToolUse, fires per edit) | No `@dual-pair` or `@cc-only-rationale` | Add `@cc-only-rationale: edit-time PostToolUse enforcement — no portable hook fires at the same moment` at next touch |
| `deps-hash-check.sh` | [.claude/hooks/deps-hash-check.sh:1](../../.claude/hooks/deps-hash-check.sh) | Consumer-facing (UserPromptSubmit, ships via install.sh) | No marker | Add `@dual-pair: deps-hash-check` pointing to a portable agent equivalent, OR `@cc-only-rationale: consumer-facing but no semantic portable equivalent for UserPromptSubmit event` at next touch |
| `inject-session-bootstrap.sh` | [.claude/hooks/inject-session-bootstrap.sh:1](../../.claude/hooks/inject-session-bootstrap.sh) | Internal (maintainer-environment, UserPromptSubmit) | No marker | Add `@cc-only-rationale: internal orchestrator tooling, not consumer-shipping path` at next touch |
| `validate-prompt.sh` | [.claude/hooks/validate-prompt.sh:1](../../.claude/hooks/validate-prompt.sh) | Internal (PostToolUse, maintainer-environment, not consumer-shipped) | No marker | Add `@cc-only-rationale: internal batch-spec validator, not consumer-shipping path` at next touch |

**§9 note:** these 4 missing markers are the rule's initial state per [dual-implementation-discipline.md:181-183](../../.claude/rules/dual-implementation-discipline.md). They do NOT increment the promotion counter. Counter starts at 0 from this rule's landing date.

### Agents under `agents/`

**Population: 4 files.** All agents are portable markdown — AI-agnostic sub-agents readable by any AI session. These are the *portable side* of potential dual-channel pairs; no CC-native hook exists as a counterpart today for any of them.

| Artefact | File:line | §3 Classification | CC counterpart | Action |
|---|---|---|---|---|
| `best-practices-sidecar.md` | `agents/best-practices-sidecar.md` (removed per C-1 KEEP-AIF 2026-05-20) | Consumer-facing (shipped via `install.sh`) | N/A | Removed per C-1 resolution 2026-05-20. |
| `compliance-verifier.md` | [agents/compliance-verifier.md:1](../../agents/compliance-verifier.md) | Consumer-facing (shipped via `install.sh`) | None today | Same — portable side only; no CC hook equivalent. |
| `living-docs-auditor.md` | [agents/living-docs-auditor.md:1](../../agents/living-docs-auditor.md) | Consumer-facing (shipped via `install.sh`) | None today | Same (renamed from `docs-auditor.md` per C-1 resolution 2026-05-20). |
| `review-sidecar.md` | [agents/review-sidecar.md:1](../../agents/review-sidecar.md) | Consumer-facing (shipped via `install.sh`) | None today | Same. |

**Rule scope note:** the `@dual-pair` / `@cc-only-rationale` marker requirement (§6) applies to **CC hooks**, not to portable agents. Portable agents do not need markers — they are inherently portable. The rule's drift-check (§5) fires when a *CC hook* declares `@dual-pair` but the portable counterpart cannot be found. None of the above agents have a CC hook counterpart today, so no `@dual-pair` is declared and §5 grep produces zero DRIFT findings.

### Skills under `.claude/skills/`

**Population: 3 directories (internal skills — not consumer-shipped from this source path).**

| Artefact | File:line | §3 Classification | Action |
|---|---|---|---|
| `self-reflection/SKILL.md` | [.claude/skills/self-reflection/SKILL.md:1](../../.claude/skills/self-reflection/SKILL.md) | Internal (CC-only skill; not part of `install.sh` payload at source level) | No action — internal only per §2(ii) non-trigger. |
| `template-audit/SKILL.md` | [.claude/skills/template-audit/SKILL.md:1](../../.claude/skills/template-audit/SKILL.md) | Internal (CC-only skill; not consumer-shipped from source) | No action — internal only. |
| `tool-bootstrapping/SKILL.md` | [.claude/skills/tool-bootstrapping/SKILL.md:1](../../.claude/skills/tool-bootstrapping/SKILL.md) | Internal (CC-only skill at source; consumer-shipped variant lives under `skills/tool-bootstrapping/SKILL.md`) | No action — internal only. The consumer-shipped counterpart (`skills/tool-bootstrapping/`) is already portable markdown; the CC-native internal skill is the delivery mechanism for maintainer, not the consumer artefact. |

**Consumer-shipped skill note:** the consumer-facing `rules-as-tests` skill lives under `skills/rules-as-tests/SKILL.md`, not under `.claude/skills/`. It is a markdown-only artefact — §2(i) non-trigger (markdown-only artefacts have nothing to «make portable»; the file IS the portable artefact). No action.

### Husky hooks under `.husky/`

| Artefact | File:line | Applicability |
|---|---|---|
| `.husky/pre-commit` | [.husky/pre-commit:1](../../.husky/pre-commit) | §2(ii) non-trigger: universal Husky hook, not CC-specific, not consumer-shipping path. Rule does not apply. |
| `.husky/pre-push` | [.husky/pre-push:1](../../.husky/pre-push) | Same — repo-internal, universal Husky, not CC-native hook. Rule does not apply. |

### Existing rules under `.claude/rules/`

Each rule file is a markdown-only artefact → §2(i) non-trigger. «Nothing to make portable; the file IS the portable artefact.» Verified for all 7 existing rules (each has first line confirming markdown nature):

| Rule | File:line | Exemption |
|---|---|---|
| `ai-laziness-traps.md` | [.claude/rules/ai-laziness-traps.md:1](../../.claude/rules/ai-laziness-traps.md) | §2(i) markdown-only |
| `build-first-reuse-default.md` | [.claude/rules/build-first-reuse-default.md:1](../../.claude/rules/build-first-reuse-default.md) | §2(i) markdown-only |
| `doc-authority-hierarchy.md` | [.claude/rules/doc-authority-hierarchy.md:1](../../.claude/rules/doc-authority-hierarchy.md) | §2(i) markdown-only |
| `no-paid-llm-in-ci.md` | [.claude/rules/no-paid-llm-in-ci.md:1](../../.claude/rules/no-paid-llm-in-ci.md) | §2(i) markdown-only |
| `parallel-subwave-isolation.md` | [.claude/rules/parallel-subwave-isolation.md:1](../../.claude/rules/parallel-subwave-isolation.md) | §2(i) markdown-only |
| `phase-research-coverage.md` | [.claude/rules/phase-research-coverage.md:1](../../.claude/rules/phase-research-coverage.md) | §2(i) markdown-only |
| `reviewer-discipline.md` | [.claude/rules/reviewer-discipline.md:1](../../.claude/rules/reviewer-discipline.md) | §2(i) markdown-only |

**Rule + principle test pairing:** where a `.claude/rules/*.md` file has a companion `packages/core/principles/*.test.ts` (e.g. `doc-authority-hierarchy.md` + `09-doc-authority-hierarchy.test.ts`), the pairing IS a dual-channel pattern (prose rule + executable test). This is exactly the §7 «one logic, two channels» SSOT model. However, the `.md` rule file itself remains §2(i) exempt — the relevant artefact for §6 marker requirement is the CC hook or executable, not the rule prose. The companion test is the mechanical channel; the rule is the spec that both derive from. This is the intended shape per [dual-implementation-discipline.md:144-149](../../.claude/rules/dual-implementation-discipline.md) (§7).

### Exemption mechanism summary

Three exemption classes apply to the current population:

1. **§2(i) markdown-only:** all `.claude/rules/*.md` files, all `agents/*.md` files, all `skills/*/SKILL.md` files, consumer-shipped `skills/rules-as-tests/SKILL.md`. Nothing to «make portable» — the file is the artefact.
2. **§2(ii) internal-only tooling:** `.husky/pre-commit`, `.husky/pre-push` (universal Husky, not CC-specific); `.claude/skills/self-reflection/SKILL.md`, `.claude/skills/template-audit/SKILL.md`, `.claude/skills/tool-bootstrapping/SKILL.md` (internal CC skills, not consumer-shipping path at source level).
3. **§2(iii) one-off fixes / no new capability:** N/A in this sweep; all items are reusable artefacts.

No artefact fails to cleanly fall into either «applies + needs action» or «exempt per §2». The 4 `.claude/hooks/*.sh` files are the only applies-group — all 4 lack markers (expected starting state per §9).

---

## Self-application (T15) — would the rule have caught its own design moment?

**The D2 question (Decision 4, 2026-05-11):** «For hook-class capabilities — specifically the Stop hook context from 2026-05-16 research — should we ship CC-native or dual?»

Apply §3 triage:

1. Does the capability have a CC-native primitive available? **Yes** — CC `Stop`/`PostToolUse` hook event types are available.
2. Is the feature intended for consumer projects? **Depends** — internal orchestrator Stop hook → §3 Internal → default CC-native only. Consumer-facing PostToolUse hook → §3 Consumer-facing → default dual (CC-native primary + portable fallback).
3. Is it performance-critical? PostToolUse (fires per edit) → §3 Performance-critical → CC-native primary; portable optional.

**Verdict:** applying §3 triage to the Decision 4 scenario (`.claude/hooks/` artefacts, internal development tooling) yields: §3 Internal → CC-native only as default. The actual Decision 4 choice was CC-native primary with cross-editor parity deferred to SSOT #21 WATCHLIST. **The rule produces the same answer.** PASS.

**Does the rule self-apply to its OWN `.md` file?** The new rule's file is `.claude/rules/dual-implementation-discipline.md` — a markdown-only artefact. Per §2(i) non-trigger: «Markdown-only artefacts — rules, docs, research-patches, prose discipline. Nothing to «make portable»; the file IS the portable artefact.» The rule explicitly exempts itself at [dual-implementation-discipline.md:36-37](../../.claude/rules/dual-implementation-discipline.md). No contradiction — the exemption is principled (the markdown file ships as-is to any consumer, no CC-native wrapper needed).

---

## Tags

`#new-discipline-rule` `#dual-implementation` `#framework-portability` `#scope-not-formal-trigger` `#recursive-self-application-gap`

---

## See also

- [.claude/rules/dual-implementation-discipline.md](../../.claude/rules/dual-implementation-discipline.md) — the rule under self-review
- [.claude/rules/phase-research-coverage.md §1.7](../../.claude/rules/phase-research-coverage.md) — self-reflexive trigger for this patch
- [docs/meta-factory/prior-art-evaluations.md](../../docs/meta-factory/prior-art-evaluations.md) — SSOT #20 (CC hooks API, ADOPT), #21 (cross-editor parity, WATCHLIST), #43 (RuntimeAdapter, ADOPT VOCABULARY)
- [packages/core/principles/09-doc-authority-hierarchy.ts:37-41](../../packages/core/principles/09-doc-authority-hierarchy.ts) — `REQUIRED_HEADER_DOCS` list (follow-on: add `dual-implementation-discipline.md`)
- [docs/meta-factory/open-questions.md:385](../../docs/meta-factory/open-questions.md) — §13.32 (Phase 10 foundations audit, ARMED) — adjacent sweep that will cover this rule at Phase 10
- [docs/meta-factory/research-patches/2026-05-09-self-review-audit.md](2026-05-09-self-review-audit.md) — T7 template precedent
