# Phase 7.5 Retrospective — Plan formalization

> **Date:** 2026-05-08
> **Branch:** `docs/phase-7.5-plan-formalization` (forked from `main` HEAD `a6b8208`, the merge commit of PR #6 closing Phase 7)
> **Phase:** 7.5 — documentation-only formalization of the Phase 4-7 deterministic pivot
> **Verdict:** **GO** to Phase 8 entry (`/aif-verify` integration spike + canonical regen ≤5% acceptance design)

---

## Scope

Phase 7.5 was a **documentation phase** — zero code changes. Five atomic commits across six doc files plus one new shipped reference. The motivation: four prior retros (Phase 4/5/6/7) converged on the same architectural decision (deterministic-curated v1, LLM as v2 trigger), but EXECUTION-PLAN.md still carried Phase 5/6/7 descriptions written before the AIF analysis (§5.5 caveat already flagged this drift). Without formalization, a fresh-session reader would derive the wrong scope for Phase 8.

---

## Verification block

| # | Probe | Expected | Actual |
|---|---|---|---|
| 1 | `git diff main --name-only` non-docs | empty | **OK: docs-only** |
| 2 | Commits ahead of main | 5 + retro | **5 atomic + this retro = 6** |
| 3 | Conventional-commits compliance | 5/5 (English subjects) | **5/5** |
| 4 | Task 1 verification | `v1 deterministic stance` matches | **EXECUTION-PLAN.md:227** |
| 5 | Task 2 verification | §13.10–§13.14 headings | **all 5 present** |
| 6 | Task 3 verification | `Phase 11.1\|11.2\|11.3` matches | **3 subtask headings + 4 cross-refs** |
| 7 | Task 4 verification | self-diagnostics-design.md exists, ≥9 sections | **128 lines, 9 sections** |
| 8 | Task 5 verification | `v2 trigger`/`v1 ships`/`v1.5` count ≥5 | **5** |
| 9 | Test sanity (no regression on doc edits) | 220/220 core | **220/220** |
| 10 | `make self-audit` | green | **5 pass / 0 fail; zizmor clean (6 suppressed)** |
| 11 | Each shipped reference ≤500 lines | required | architecture 197 / self-application 171 / aif-comparison 274 / open-questions 216 / self-diagnostics-design 128 — **all ≤500** |

EXECUTION-PLAN.md is at 776 lines (transient artifact, exempt per its own §header caveat).

---

## Created/modified files (commit hashes)

```
285a128 docs(execution-plan):    §6.0 lock deterministic-v1 stance (Phase 4-7 pivot)
a6e760e docs(open-questions):    formalize LLM v2 triggers + cost model + corpus/versioning/BC backlog
c8005c1 docs(aif-integration):   expand Phase 11 backlog (3 subtasks) + EXECUTION-PLAN §11 pointer + roadmap.md outdated marker
e4fc679 docs(self-diagnostics):  design doc + L5 (c) invariant + Phase 8.X impl pointer
b0c4672 docs(architecture):      v1/v2 split annotations on §2.4-§2.7 + §3.3 + L5 v1.5 self-diagnostics pointer
[this commit] docs(phase-7.5):   retro + GO verdict for Phase 8 entry
```

Net surface change:

- **EXECUTION-PLAN.md** — new §6.0 (deterministic-v1 stance, 37 lines), §11 expanded with Phase 11 backlog pointer, Phase 8 cross-ref to Phase 8.X self-diagnostics impl.
- **open-questions.md** — §13.10–§13.14 (LLM v2 triggers, cost model, real-corpus, versioning, BC + lock migration) — 5 new sections, 83 lines.
- **aif-comparison.md** — §6.2 closure pointer, §7 promoted from generic deferrals to «Phase 11 backlog» SSOT (3 subtasks: 11.1 aif-gate-result, 11.2 /aif-loop convertor, 11.3 contributing-recipes).
- **roadmap.md** — OUTDATED header (drift with EXECUTION-PLAN.md numbering).
- **self-diagnostics-design.md** — **new shipped reference**, 128 lines, 9 sections (§1 motivation … §9 phasing).
- **self-application.md** — §2 row L5 + §7 acceptance both extended with the (c) self-diagnostics emission invariant.
- **architecture.md** — v1/v2 split annotations on §2.4 (L2), §2.5 (L3), §2.6 (L4), §2.7 (L5), §3.3 (Path switching).

---

## Self-reflection block

- **Single-session burn mode held.** Wall-clock ≈30 min from branch fork to last commit (not counting this retro). Same compression as Phase 4-7. No agent delegation needed for doc-only work.
- **SSOT discipline observed.** `open-questions.md §13.10` is the SSOT for LLM v2 trigger conditions; EXECUTION-PLAN.md §6.0 + architecture.md §2.4-§2.7 + §3.3 all link to it instead of duplicating trigger conditions. Single edit to §13.10 propagates without rewrites.
- **No code edits.** Stop-rule «docs-only» held — `git diff main --name-only` returns docs/ exclusively.
- **No new deps.** `package.json` untouched.
- **`v1.5` annotation on L5.** Adding self-diagnostics as «v1.5 between v1 and v2» (rather than collapsing it into v2) keeps the deterministic-v1 invariant clean. v1.5 = «still deterministic, still no LLM», just adds telemetry. v2 trigger remains tied to LLM activation specifically.
- **roadmap.md kept, not deleted.** OUTDATED header is more durable than file deletion for cross-ref hygiene; deleting roadmap.md would break ≥2 cross-refs in retros and PROPOSAL.

---

## Evaluation block

| Metric | Target | Actual | Verdict |
|---|---|---|---|
| Self-application score | 4/10 (doc phase) | **5/10** — formalizes the «principles as tests» mapping for v2 (each v2 area has acceptance criteria + verification gate per §13.10) | ✓ |
| Time-vs-plan ratio | ≤60 min wall-clock | **≈30 min** | ✓ well under |
| Tasks 1-5 closed | required | All 5 closed with verified acceptance | ✓ |
| 5 atomic commits | required | 5 (+ retro = 6) | ✓ |
| Each shipped reference ≤500 lines | required | All 5 shipped refs ≤500 | ✓ |
| Tests still green | required | 220/220 core; `make self-audit` green | ✓ |
| Verdict | GO to Phase 8 entry | **GO** | ✓ |

### Stop-rule audit

- **NO code edits**: held — `git diff main --name-only` empty for non-`docs/` paths.
- **NO new explicit deps**: held — `package.json` untouched.
- **NO `--no-verify` / `--no-gpg-sign` / force-push**: held — all 5 commits + retro via standard `git commit`.
- **Atomic commits**: held — 5 commits, 1 logical change each, conventional-commits + English subjects.
- **No emoji**: held in commits and docs.

---

## Open questions for Phase 8 entry (§5.5 Step 0 trigger)

Carried forward from [retros/phase-7.md](phase-7.md) Open Q list with v2-trigger pointer added:

1. **Canonical regen ≤5% trigger metric** — unchanged from Phase 7; still needs concrete diff metric design for acceptance.
2. **Recipe expansion R12/R14/R20** — unchanged from Phase 7; mechanical lift vs hand re-author.
3. **Gate 5 cost-scoping** — now formalized as v2 trigger entry #4 in [open-questions.md §13.10](../open-questions.md); Phase 8 must close §13.11 LLM cost model entry too.
4. **L5 v1 → v2 trigger** — now split: v1.5 (self-diagnostics) ships in Phase 8.X; v2 (full installer scope) per §13.13/§13.14.
5. **`/aif-verify` integration spike** — Phase 8 entry research per Phase 7 retro Open Q #5; routed away from Phase 11 (aif-comparison.md §7 «Closed-elsewhere pointers»).
6. **Real-corpus validation** — new from Phase 7.5 per §13.12; trigger fires when first real consumer onboards or Phase 8 acceptance hits a real Next 16 codebase.

---

## Versioning

- **2026-05-08** — Phase 7.5 close, GO verdict for Phase 8 entry. 5 atomic doc commits on `docs/phase-7.5-plan-formalization` (forked from main HEAD `a6b8208` post-PR-#6-merge). Single-session burn mode (Opus 4.7) ≈30 min wall-clock. EXECUTION-PLAN.md §6.0 locks deterministic-v1 stance; open-questions.md §13.10 is SSOT for LLM v2 trigger conditions; aif-comparison.md §7 is SSOT for Phase 11 backlog; self-diagnostics-design.md is design-only (Phase 8.X impl).
