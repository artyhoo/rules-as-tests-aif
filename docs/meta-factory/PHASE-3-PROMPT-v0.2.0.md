# Phase 3 Delegation Prompt — Monorepo Split (v0.2.0)

> **Назначение:** updated version of Phase 3 delegation prompt with Step 0 «Existing solutions research» integrated per [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md).
> **Версия:** 0.2.0 — 2026-05-08
> **Status:** **counterfactual archive.** Phase 3 + 3.1 уже merged 2026-05-08 (commits `a46a8bf`/`962d557`/`3ad531f` via PR #2). Этот документ показывает, как Step 0 gate сформировал бы prompt, если бы был доступен на этапе планирования. **No execution required** — retroactive Step 0 ([phase-3-research.md §5](phase-3-research.md)) подтвердил все decisions ex-post.
> **Delta from [PHASE-3-PROMPT.md](PHASE-3-PROMPT.md) v0.1.0:** §0 Step 0 prelude (NEW), §SCOPE additions (Nx/Turbo/Lerna/pnpm-catalog/Changesets explicit OUT), §FORWARD section (NEW). Body Blocks 2-6 от v0.1 — без изменений; reference original document for execution mechanics.

---

## §0. Step 0 — Existing solutions research (NEW in v0.2.0)

Перед draft execution prompt — **обязательная research matrix** per [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md).

### Capability list (5 areas Phase 3 covers)

1. Workspace declaration patterns (npm workspaces vs pnpm vs yarn)
2. Cross-package linking (peerDeps `*` vs `workspace:*`)
3. Build orchestration (Nx, Turborepo, Lerna v6+, pnpm `-r`)
4. Cross-package test execution (`npm test --workspaces` vs `nx affected` vs `turbo run`)
5. Version management (Lerna `publish` vs Changesets `.changeset/*.md`)

### Research output (full matrix → [phase-3-research.md](phase-3-research.md))

Reuse posture summary (Step 0 §4):

| # | Capability | Decision (v0.2.0) | Status vs v0.1 |
|---|---|---|---|
| 1 | npm workspaces vs pnpm catalog | **KEEP npm**, watch pnpm at scale | Same — validated ex-post |
| 2 | `*` peerDeps vs `workspace:*` | **KEEP `*`**, switch if pnpm migration | Same — validated ex-post |
| 3 | Nx / Turbo task runner | **DEFER** — pay-off threshold not met | **NEW**: explicit no-add guard |
| 4 | `npm test --workspaces` vs `nx affected` | **KEEP** — runtime <3s | Same — validated ex-post |
| 5 | None vs Changesets vs Lerna | **DEFER to Phase 8/11** — pre-publish trigger | **NEW**: forward Changesets reservation |

**Acceptance per §5.5 hard constraint:** ≥1 reuse decision yielded (4 keep + 1 forward-add). Phase 3 entry **passes** Step 0 gate retroactively.

---

## §SCOPE — Hard Guardrails (delta vs v0.1)

> Reference base: [PHASE-3-PROMPT.md §SCOPE](PHASE-3-PROMPT.md) Block 1-6. Apply ONLY the additions below; everything else **identical** to v0.1.

### Block 1 — Scope: ADD to OUT-of-scope table

| Item | Reason out | Defer to |
|---|---|---|
| Nx integration / `nx.json` / `targets` config | No cross-package compile chain; tests <3s; pay-off threshold (≥5 packages OR ≥30s CI runtime) not crossed | Phase 9+ if observable thresholds emerge |
| Turborepo / `turbo.json` | Same threshold as Nx | Phase 9+ |
| Lerna / `lerna.json` / `lerna publish` | Pulls Nx transitively (v6+); auto-detect collides with declarative changelog philosophy | Not planned (Changesets preferred) |
| pnpm migration / `pnpm-workspace.yaml` / `catalog:` protocol | Catalog benefit triggers at ≥5 packages × ≥8 shared dev-deps; currently 3 × 5 (borderline) | Phase 9+ re-evaluation |
| Changesets `.changeset/` + `changesets/action` | No publish workflow yet; required only pre-publish | Phase 8 (acceptance gate) или Phase 11 (AIF release coupling) |

**Rationale anchor:** every OUT entry above traces to [phase-3-research.md §3](phase-3-research.md) per-capability matrix + §4 decision table. No item added without explicit context7 evidence.

### Block 1 — Scope: clarification on IN-scope (no behaviour change vs v0.1)

Phase 3 actual implementation MUST validate against Step 0 matrix **at acceptance time**:
- Cross-package linking semantics ✅ (`peerDependencies: "*"` matches §3.2 baseline)
- Dev-dep duplication count: 5 deps × 2 packages = 10 surface (matches §3.1 borderline assessment)
- Build orchestration absence ✅ (§3.3 «no compile chain» confirmed)
- Test runtime <3s ✅ (§3.4 baseline)
- No version-management tooling ✅ (§3.5 deferred)

Retrofit verification (2026-05-08): all 5 ✅ — Phase 3 actual implementation MATCHES Step 0 baseline assumptions. No drift.

### Blocks 2-6 — Verification, Confidence, Recovery, Acceptance, Reporting

**No changes vs v0.1.** Use [PHASE-3-PROMPT.md §SCOPE Blocks 2-6](PHASE-3-PROMPT.md) as-is. Verification commands (`npm test --workspaces`, `make self-audit`, npm pack simulation, principles 24/24, no circular deps) unchanged because reuse decisions did not alter execution mechanics.

---

## §FORWARD — what v0.2.0 hands off to Phase 4-11

After Phase 3 GO verdict (already issued, [retros/phase-3.md §Evaluation](retros/phase-3.md)):

1. **Phase 4 entry** — Step 0 must be applied BEFORE drafting `PHASE-4-PROMPT.md`. Capability list для Stack Detector v1: package.json signal extraction, version-aware logic (Next 15 vs 16), confidence scoring, multi-stack handling, CLI/programmatic API. Candidate research targets: AIF `aif-explore`, AIF skill-context, package version detection libraries.
2. **Phase 8 entry** — Step 0 capability list must include version-management; expected decision = **adopt Changesets** with `changesets/action@<pinned-SHA>` GitHub workflow. Trigger: any commit that prepares npm publish.
3. **Phase 9-11 entry** — Step 0 watch-list re-check:
   - pnpm catalog migration if N packages × shared dev-dep count crosses threshold
   - Nx/Turbo if CI test runtime ≥30s or cross-package compile chain emerges
   - `peerDeps: "*"` → `workspace:*` only if pnpm adopted

Each forward Step 0 → produce `phase-N-research.md` matrix + go/no-go decisions before phase prompt drafted. **No exception.**

---

## §META — what changed in v0.2.0 vs v0.1

| Section | v0.1 | v0.2.0 | Why |
|---|---|---|---|
| §0 Step 0 prelude | absent | added | §5.5 gate added 2026-05-08 |
| Block 1 OUT-of-scope | 7 items | +5 items (Nx, Turbo, Lerna, pnpm catalog, Changesets) | Step 0 reuse decisions explicit |
| Block 1 IN-scope clarification | absent | added (Step 0 baseline match check) | retroactive validation discipline |
| §FORWARD | absent | added | forward Step 0 trigger points |
| Body Blocks 2-6 | as-is | as-is (no change) | execution mechanics validated |

**Net delta size:** ~110 lines new content; total prompt = v0.1 (363 lines) + v0.2.0 delta (this file). Execution still goes through v0.1 body for unchanged sections.

---

## §VERIFICATION — retrofit closure

Phase 3 was completed 2026-05-08 без Step 0 gate (gate был добавлен 2026-05-08 same day, see [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md)). Retroactive Step 0 verdict: see [phase-3-research.md §5](phase-3-research.md) — all 5 capability decisions validate ex-post.

**Counterfactual question:** had v0.2.0 been the prompt, would Phase 3 execution path have differed?

**Answer:** No — execution path identical. Reuse decisions all = KEEP/DEFER for current scale. The retrofit's value is **forward-looking**: documenting Phase 3's reuse posture so Phase 4-11 extend it consistently and Step 0 gate becomes operational discipline.

**Verdict:** Phase 3 + 3.1 stand as-is. No revert. Step 0 retrofit closed [2026-05-08].
