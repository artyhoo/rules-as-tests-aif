<!-- scope:methodology -->
# Recommendation skips own discipline — meta-cognitive blindspot

> Scope: 2026-05-09 incident — L3 generated-docs research recommendation. New anti-pattern `#recommendation-skips-own-discipline` + new checklist item §1.7 in [`phase-research-coverage.md`](../../../.claude/rules/phase-research-coverage.md).

## Problem

Independent research session on closing [open-questions.md §13.21](../open-questions.md) (L3 doc-authority discipline applied to generated user-facing docs) produced a recommendation report at `/tmp/generated-docs-discipline-research.md` (454 LOC). The recommendation passed the prompt's mandated anti-pattern self-audit (5 hypotheses about «defer until consumer pain» framing) but **failed silently against six existing project disciplines**:

1. **principle 08 — `Prior-art:` trailer:** capability-commit classification incorrect for `.claude/skills/<new>/` (recommendation marked as «possibly capability» — by CLAUDE.md hook definition «adds new file ≥80 LOC anywhere under `packages/`», `.claude/` is outside scope).
2. **build-vs-reuse SSOT:** load-bearing patterns (ESLint shareable config `extends:`, Tailwind presets composition, AGENTS.override.md cascade) referenced without checking whether SSOT entries exist.
3. **phase-research-coverage §1.6 trigger sweep:** §13.21 closed without sweeping cascade dependencies on §13.16 / §13.20 / §13.22.
4. **doc-authority-hierarchy on artefacts produced:** new `.claude/agents/*.md` referenced as scope, but files do not exist in repo (only documented in `README.md` shipped table); recommendation conflated «documented» with «materialised».
5. **Recommendation referenced «Research A — separate research session, in flight»** that does not exist as artefact in `docs/meta-factory/research-patches/` or `.claude/`.
6. **Recommendation duplicated existing canonical-list entries** in `principle 09 REQUIRED_HEADER_DOCS` (`skills/rules-as-tests/*` already enumerated at lines 82-87 — recommendation proposed adding them again).

All six gaps surfaced only via reviewer pushback in the same session, not via the recommendation's own self-audit pass. Reviewer's verdict was REVISE.

## Root Cause

**Meta-cognitive blindspot — the agent of analysis is not also the object of analysis.** When forming a recommendation about discipline X, the assistant's attention frame loads:
- subject domain (how to apply X);
- prior art (what exists);
- trade-offs (which option wins).

The frame does **not** load «the act of forming this recommendation must itself pass X». §1.1-§1.6 of [phase-research-coverage.md](../../../.claude/rules/phase-research-coverage.md) handle search-coverage gaps and trigger-sweep gaps but **none catch the failure mode where the recommendation, on its own terms, fails to comply with the very discipline it operates inside**. §2.5 self-reflection prompt is post-hoc retro-time, not pre-close.

This is the third documented occurrence of the same shape:

| Incident | Recommendation about | Self-discipline gap |
|---|---|---|
| 2026-05-09 PR #16 | preventing goal drift across docs | EXECUTION-PLAN §1 silently re-defined goal — drift introduced *in the doc that should prevent drift* |
| 2026-05-09 prior session (4 turns) | applying discipline-from-start | repeatedly applied «defer until consumer pain» framing — argument *against the project's own thesis*, in a session whose subject is the project's thesis |
| 2026-05-09 this session | applying doc-authority to consumer-shipped artefacts | recommendation itself failed forward+backward checks — anti-pattern occurred *in research about preventing the same anti-pattern* |

Same root cause: discipline applied bottom-up to outputs, not top-down to the act of producing outputs.

## Solution

1. Added §1.7 «Recommendation self-discipline check» to [phase-research-coverage.md §1](../../../.claude/rules/phase-research-coverage.md) — explicit forward+backward gate before closing any rule/principle/pattern/discipline-introducing recommendation.
2. Added anti-pattern `#recommendation-skips-own-discipline` to [§4](../../../.claude/rules/phase-research-coverage.md).
3. Added `#recommendation-skips-own-discipline` to the §3 patch-tag enumeration.
4. **This patch** records the incident under the new tag — bootstrap-precedent so the tag is non-empty on day one.

## Prevention

PRIORITY CHECK rule, applied before closing a recommendation that introduces / extends a rule, principle, pattern, or discipline:

> Has the recommendation been walked through §1.7 forward (compliance with all currently-active layers: code-level, principle-level, commit-level, build-vs-reuse SSOT, trigger sweep, doc-authority) AND §1.7 backward (complete sweep of existing artefacts under the new rule's scope, with explicit exemption mechanism + meta-test)? If either direction fails any item — recommendation is **provisional**, not load-bearing.

Concretely, for each new discipline-bearing artefact: ship a self-review patch under [research-patches/](.) following the T7 template ([2026-05-09-self-review-audit.md](2026-05-09-self-review-audit.md)) — walks the rule through §1.1-§1.7 and §2.1-§2.5, verifies it would have caught the gap that motivated its creation. **This patch is the bootstrap exemplar.**

## §1.7 self-review (recursive — does §1.7 catch the gap that motivated §1.7?)

Forward — would §1.7 have caught the original L3 research recommendation gap had it been active before close?

| Layer | Applied to original recommendation | Catches? |
|---|---|---|
| Code-level (R1-R20) | Recommendation was prose, no code yet — N/A | N/A |
| Principle-level (01-09) | principle 08 capability-commit classification: would force re-check «is `.claude/skills/<new>/` under `packages/`?» — answer no → trailer not required → flag mismatch with «possibly capability» framing | **✓** |
| Commit-level (capability-commit gate) | Same as above — explicit gate forces hook-definition consultation | **✓** |
| Build-vs-reuse SSOT | Forward-check item «load-bearing patterns registered in SSOT?» — forces enumeration of ESLint extends / Tailwind presets / AGENTS.override.md against `prior-art-evaluations.md`; entries missing → flag | **✓** |
| Trigger sweep (§1.6) | §1.7 forward-check explicitly cross-references §1.6 — forces `grep §13\.` before closing §13.21 | **✓** |
| Doc-authority on artefacts | Forward-check «artefacts produced themselves carry compliant headers» — forces verifying `.claude/agents/*.md` exist before promising headers in them | **✓** |

Backward — would §1.7 backward have caught the «duplicates in REQUIRED_HEADER_DOCS» and «.claude/agents/ files missing» gaps?

| Item | Catches? |
|---|---|
| Complete sweep of artefacts under new rule's scope | **✓** — full grep over `templates/**`, `packages/preset-next-15-canonical/*`, `skills/**`, `.claude/agents/**` would surface (a) skills already in list (duplicate detection), (b) `.claude/agents/` empty (scope mismatch with README claim) |
| Exemption mechanism explicit | Forces clarification: fixtures glob vs sentinel — open in original recommendation, closed by §1.7 application |
| Exemption itself has meta-test | Original recommendation had no exemption test — §1.7 surfaces |

**Result:** 6/6 forward items + 3/3 backward items independently catch the gap that motivated §1.7. Methodology validated; §1.7 ships GO.

## §2 self-reflection prompt audit

| Prompt | Applied to L3 recommendation incident |
|---|---|
| 2.1 Когда ошибся — почему? | Closing /tmp/generated-docs-discipline-research.md §1 «Recommended approach Option D» — frame loaded subject + prior art + trade-offs; did not load «must itself pass project disciplines». **✓** |
| 2.2 Мог ли пропускать раньше? | Yes — same shape in PR #16 (EXECUTION-PLAN §1 drift) and prior 4-turn «defer until consumer pain» session. Three occurrences = systemic, not one-off. **✓** |
| 2.3 Как не пропускать? | Maps to new §1.7 (forward+backward + self-reflexive). Did not map to existing §1.1-§1.6 — that's why §1.7 is needed. **✓** |
| 2.4 Какой урок? | «Before closing any rule/principle/pattern-introducing recommendation, run §1.7 forward+backward against current project state — not against memory of project state.» Operationalisable. **✓** |
| 2.5 Did the principle apply to its own design? | This patch's §1.7 self-review section above is the §2.5 application. **✓** (recursive — closes the loop). |

## Tags

`#recommendation-skips-own-discipline` `#recursive-self-application-gap` `#methodology-validated`
