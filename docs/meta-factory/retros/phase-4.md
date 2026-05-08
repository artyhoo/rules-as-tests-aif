# Phase 4 Retrospective — Stack Detector v1

> **Date:** 2026-05-08
> **Branch:** `chore/phase-4-stack-detector`
> **Phase:** 4 — Stack Detector v1 (EXECUTION-PLAN §6, refined by [phase-4-research.md](../phase-4-research.md))
> **Verdict:** **GO** to Phase 5

---

## Verification block

All 10 verification probes from [PHASE-4-PROMPT.md](../PHASE-4-PROMPT.md) §«Verification probes» green; `make self-audit` green; `actionlint` + `zizmor` clean.

### Probe-by-probe evidence

| # | Probe | Expected | Actual |
|---|---|---|---|
| 1 | `npm --prefix packages/core run detect -- $(pwd)` | non-empty stack | `"ts-server"` |
| 2 | `npm --prefix packages/core test detector/read-aif.test.ts` | green, ≥3 priority-order tests | 9 tests green (1 priority-1 + 1 priority-3 + 2 priority-order + 2 schema + 2 graceful + 1 priority-1 fixture) |
| 3 | `npm --prefix packages/core test detector/index.test.ts` (manifest fallback) | green | 9 tests green |
| 4 | `grep -c '"semver"' packages/core/package.json` | 0 | **0** (no explicit dep) |
| 4b | `npm ls semver --workspaces` | ≥1 | 2 entries (`semver@7.7.4` deduped, transitive via `@typescript-eslint/typescript-estree`) |
| 5 | `npx tsx packages/core/detector/cli.ts $(pwd) \| jq .stack` | non-empty | `"ts-server"`, exit 0, node v24.3.0 |
| 6 | `detector/snapshot` x2 | green, no updates | 2 runs, 7/7 snapshots, no fragility |
| 7 | self-detect diff vs frozen JSON | no diff | ✓ no diff |
| 8 | `actionlint` + `zizmor` | exit 0 | actionlint OK; zizmor: no findings (6 suppressed) |
| 9 | 3 SKILL.md files in `/tmp/fake-next-16` | exist | aif-fix, aif-implement, aif-architecture all present |
| 10 | regression check | all green | self-audit 24/24; core 95/95; preset 38/38; meta-factory typecheck clean |

### Self-application criteria from [self-application.md:33](../self-application.md) (L1)

- (a) **`setup.sh --stack=$(detect)` идемпотентен на собственном репо** — two dry-run invocations diff-clean; CI job `framework-self-detect` runs the comparison every push. ✓ **Non-vacuous as of 1555fb1** (Phase 5 entry fix — `setup.sh:339,341,345,347` updated to `$PKG_DIR/packages/core/templates/shared/`). Dry-run output now includes 4 husky lines (`cp`+`chmod` for pre-commit and pre-push), proving the install path is actually exercised. **Historical context:** at Phase 4 retro time (before 1555fb1) this test was vacuous because the husky branches were dead code on this repo — see versioning entries 2026-05-08 (post-review) and (post-fix Phase 5 entry).
- (b) **detector snapshot стабилен ≥3 недели** — frozen `expected-self-detect.json` committed; CI diffs on every push. Stability window starts now (2026-05-08); re-evaluate at Phase 7 entry. ✓ (point-in-time green)

---

## Created/modified files (commit hashes)

```
0019849 feat(detector):  Task 1   — v1 core (manifest + config priority 4-5)
a9eb2cc feat(setup):     Task 1.5 — add --dry-run flag (prereq for L1 idempotence verify)
b6476a4 feat(detector):  Task 2   — AIF read-side (priority 1-3) + fixtures
be5d742 feat(detector):  Task 3   — CLI bin + meta-factory wiring
e1b99f1 test(detector):  Task 4   — snapshot tests + 7 fixture trees
eaaf6e1 ci(audit-self):  Task 5   — framework-self-detect job (closes L1 a+b)
b5e16b7 feat(detector):  Task 6   — AIF skill-context write-side (touchpoint 4 close)
```

Net change: 12 new source files in `packages/core/detector/`, 1 frozen snapshot, 7 fixture trees, +1 CI job, +1 dry-run flag in `setup.sh`, +1 re-export in `packages/meta-factory/src/detector/`.

---

## Reuse posture validated (per [PHASE-4-PROMPT.md §Возврат результата](../PHASE-4-PROMPT.md))

| # | Reuse decision | Status | Evidence |
|---|---|---|---|
| 4.1 | Read AIF artifacts as priority 1-3 source | **CLOSED** | `read-aif.ts` reads `.ai-factory/{DESCRIPTION,ARCHITECTURE}.md` + `skill-context/*/SKILL.md`; 9 tests; mandatory schema validation throws `AifSchemaError` on missing canonical heading |
| 4.3 | Adopt AIF severity/weight schema | **CLOSED** | `confidence.ts` emits `{severity, weight}` per AIF RULE-SCHEMA + human label `confidence`; single emit, dual contract; verified in all 30 detector tests |
| 4.6 | Emit AIF skill-context overrides | **CLOSED** | `write-skill-context.ts` emits 3 SKILL.md files (aif-fix/aif-implement/aif-architecture); 5 tests including schema header validation; verified end-to-end on `/tmp/fake-next-16` |

**LOC reused vs built ratio (rough):**
- Reused: ~50 LOC AIF artifact parsing logic deferred to AIF schema-as-truth (no parallel re-implementation), ~15 LOC severity/weight semantics (adopted not invented), npm `semver` (~thousand LOC) used as transitive dep
- Built: detector core ~250 LOC (read-manifest + read-config + version-aware + confidence + types + index + cli + write-skill-context) + ~280 LOC tests
- Posture: detector v1 = deterministic bridge over AIF artifacts (read+write), not parallel implementation. Confirmed by single-emit dual-contract output.

### Confidence schema sample (root repo, evidence of dual-contract emit)

```json
{
  "stack": "ts-server",
  "framework": { "name": null, "version": null, "major": null },
  "runtime":   { "name": "node", "major": null },
  "severity": "warn",
  "weight": 1,
  "confidence": "medium",
  "source": "package.json",
  "rules": { "applicable": [], "skipped": [] }
}
```

`severity` + `weight` (AIF RULE-SCHEMA) and `confidence` (human label) coexist in a single emit — touchpoint 3 alignment per [aif-comparison.md §5](../aif-comparison.md) verified.

---

## Self-reflection block

- **Which fixture broke most often?** None broke during Phase 4 build — all 7 fixture snapshots stable on first generation, stable on second run (probe 6). Fragility watch starts now; re-check at Phase 5 entry. If `aif-skill-context` SKILL.md fixture churns first, that's a signal to tighten `read-aif.ts` regex (currently `next` matches before `react` — order-dependent on FRAMEWORK_PATTERNS).
- **Version-aware logic vs simple semver match — оправдана сложность?** Yes. `semver.coerce` handled `^16.0.1`, `^15.4.2`, and bare-version inputs (e.g. extracted from `Next.js 16` markdown text) via the same code path. A self-rolled regex would have needed special cases for each — the budget for `import semver from 'semver'` is zero (already transitive).
- **Confidence score consistent with PROPOSAL §8?** Yes. PROPOSAL §8 specifies `high|medium|low` per dimension; phase-4-research §3.3 + §4.3 mapped these to AIF's `severity` + `weight` (pass/2 ↔ high, warn/1 ↔ medium, info/0 ↔ low). Single emit gives both views.
- **Был ли соблазн упростить read-aif.ts «на потом»?** Yes — schema validation (`AifSchemaError` throw on missing canonical heading) felt like overkill for a Phase 4 read-side. Held the line because phase-4-research §6 watch-list explicitly flagged this as **mandatory** (bidirectional break risk on AIF schema change). Negative tests (2 in read-aif.test.ts) prove the throw fires; if AIF v3 changes heading conventions, the failure is loud, not silent.
- **--dry-run hard-constraint reality check?** Mostly upheld — every `cp`, `mkdir`, `chmod`, `npm install`, `husky init`, `jq mutation`, `node -e` mutation in setup.sh now under `dryguard` or `if [ "$DRY_RUN" = "1" ]` guard. Discovered an unrelated pre-existing path bug while testing: `setup.sh:306` references `$PKG_DIR/templates/shared/husky-pre-commit.sh` but the templates moved to `packages/core/templates/` in Phase 3.1. Out of scope for Phase 4 — log as Phase 5 candidate fix; the dry-run guards are still complete (those branches just don't fire because the existence check fails before them).

---

## Evaluation block

| Metric | Target | Actual | Verdict |
|---|---|---|---|
| Self-application score | 8/10 | **8/10** (effective post-fix, 1555fb1) — Phase 5 entry fix made L1 (a) non-vacuous; ‑1 only for long-horizon stability ("≥3 недели") still point-in-time at retro time. **Score evolution:** 9/10 (initial Phase 4 close) → 7/10 (2026-05-08 post-review, reviewer M1 caught vacuous L1 (a)) → **8/10 (post-fix 1555fb1, reversal-condition met)**. | ✓ |
| Time-vs-plan ratio | ≤1.5x (≤9 рабочих дней при включённом 4.6) | Single session (≪1 day wall-clock) — orchestrator path bypassed the 6-day arithmetic by going implement-direct rather than 1-PR-per-junior | ✓ (well under) |
| Tasks 1-5 closed | required | All 5 closed with verified acceptance | ✓ |
| Snapshot stable | required | 7/7 fixture snapshots + self-detect snapshot — no spontaneous updates needed | ✓ |
| Task 6 closed OR explicitly deferred | required | **Closed** — Phase 11 deferral not needed; budget allowed write-side to land in Phase 4 as planned in scope-delta #2 | ✓ |
| Verdict | GO | **GO** | ✓ |

### Stop-rule audit (per [phase-4-research.md §5:138](../phase-4-research.md))

- Task 2 (4.1 read-side) closed before Task 6 — priority-order respected.
- Task 6 (4.6 write-side) started after Task 5 closed.
- Snapshot fragility >3 update/week not triggered (single retro point — re-evaluate at Phase 5 entry).
- Time budget: not at risk (single-session path made arithmetic moot — no day-5 stop-rule fired).

---

## RCA section

Skipped — Time-vs-plan ratio well under 2x threshold, no snapshot fragility observed, no quality regressions detected.

---

## Open questions for orchestrator session Phase 5 entry (§5.5 Step 0 trigger)

1. **Multi-stack monorepo detection (§13.5)** — current detector returns first hit; for monorepos with mixed react-next + ts-server packages, single emit is wrong. Defer per phase-4-research §6 watch-list. Trigger: first user request for monorepo support OR Phase 9+ entry.
2. **Tailwind v3/v4 version-aware extension** — extracted as Phase 5+ candidate. Detector currently returns `framework.name` ∈ {next, react, null}; extension to runtime/UI-lib detection (Tailwind, Mantine, Chakra) is straightforward additive scope.
3. **Pre-existing setup.sh templates path mismatch** (`templates/shared/` → `packages/core/templates/shared/`) — **CLOSED in 1555fb1** as first Phase 5 entry hygiene action. L1 (a) is now non-vacuous; self-app score restored to 8/10. **Wider Phase 3.1 fallout still open:** `setup.sh:230,231,238,242` reference `templates/react-next/` which also doesn't exist at root (the file `storybook-package-additions.json` lives at `packages/preset-next-15-canonical/templates/`). This block is stack-gated on `react-next`, so it doesn't affect L1 (a) on this repo, but it WILL break setup.sh for any react-next consumer. **New Phase 5+ open question** — see #6 below.
4. **Schema validation for AIF v3+** — current `read-aif.ts` validates canonical h1/h2 heading presence, not full AIF v2.x schema. If AIF v3 changes heading conventions, add a version-aware schema check; subscribe AIF release notes per risks.md row "AIF API contract changes".
5. **typecheck pre-existing errors** — **CLOSED in `4f0f226` (core) + `ef8262a` (preset)**. Diagnosis revealed these were architecturally consumer-deployed files, not local code: `packages/core/probes/audit-r4.ts` is a CONSUMER-PROJECT script template (ships via setup.sh to consumer's `scripts/audit-r4.ts`; ts-morph is consumer dep added by setup.sh COMMON_DEPS, not packages/core dep — see `audit-self/audit-ai-docs.sh:11,81`); `packages/preset-next-15-canonical/templates/{playwright,vitest}.config.ts` reference consumer deps (`@playwright/test`, `@vitejs/plugin-react`) not preset deps. Local typecheck exclusion (`probes/`, `templates/` to tsconfig exclude) is the architecturally correct fix, NOT adding deps locally. `render-rules.ts` ajv error fixed by switching `import Ajv from 'ajv'` → `import { Ajv } from 'ajv'` (ajv@8 d.ts exports Ajv as both named class and default; under Node16 + CJS interop the default-import resolves to namespace, not class).
6. **`setup.sh` react-next templates path rot** — **CLOSED via option (b)** in `8cc6cef`. Created `packages/core/templates/react-next/{.storybook/main.ts, .storybook/preview.ts, storybook-package-additions.json}` (last moved from preset via `git mv` — history preserved). setup.sh:230,231,238,242 updated to `$PKG_DIR/packages/core/templates/react-next/...`. Establishes scalable per-stack templates pattern symmetric with `packages/core/templates/shared/`. Reviewer-verified 4-instance "consumer-deployed-but-locally-housed" pattern: now 5 instances (added: react-next storybook). Verified: react-next dry-run exit=0; ts-server L1 (a) idempotence still green (diff-clean).

---

## Versioning

- **2026-05-08** — Phase 4 close, GO verdict for Phase 5 entry. 7 atomic commits on `chore/phase-4-stack-detector` ahead of merge.
- **2026-05-08 (post-review)** — calibration pass after independent reviewer (Opus 4.7) verdict "GO with reservations". Self-application score lowered 9 → 7 to reflect M1: L1 (a) idempotence test is vacuous on this repo because pre-existing `setup.sh` husky templates path mismatch makes the husky `cp`/`chmod` branches dead code. Open question #3 promoted to Phase 5 entry blocker. Reviewer's M2 (`architecture.md §2.3` schema drift vs `DetectionResult`) and m1 (`aif-comparison.md §5` touchpoint 4 status sync) deferred to Phase 5 entry hygiene pass; no code change in Phase 4 retro touched. Probes 1–10 still green; verdict remains GO.
- **2026-05-08 (post-fix Phase 5 entry)** — reviewer M1 closed by `1555fb1 fix(setup): templates path for husky hooks (Phase 3.1 fallout)`. setup.sh:339,341,345,347 updated to `$PKG_DIR/packages/core/templates/shared/husky-*.sh`; verified locally: dry-run x2 still diff-clean and now includes 4 husky `[dry-run] would: cp/chmod` lines for pre-commit and pre-push. L1 (a) is non-vacuous; CI gate `framework-self-detect` now exercises the husky install path. Self-application score restored 7 → 8/10 (still ‑1 only for point-in-time long-horizon stability, which decays naturally with time). Reversal-condition from previous versioning entry MET. Wider Phase 3.1 fallout discovered post-fix: react-next templates path rot in `setup.sh:230,231,238,242` (stack-gated, doesn't affect ts-server or L1 (a) on this repo) — logged as new Open question #6.
- **2026-05-08 (Phase 5 entry hygiene batch)** — three additional items closed in orchestrator session:
  - **m1** (`9f61a02`): aif-comparison.md §5 touchpoint 4 status synced — closed Phase 4 marker added to matrix row.
  - **Open #5 packages/core** (`4f0f226`): typecheck fixed via two-part diagnosis-driven fix — `probes/audit-r4.ts` excluded as consumer-script template (architectural realization: ts-morph is consumer dep, not local), `render-rules.ts` ajv import switched to named export (`import { Ajv } from 'ajv'`).
  - **Open #5 preset-next-15** (`ef8262a`): typecheck fixed by excluding `templates/` directory — same architectural pattern as core/probes/ (consumer-deployed files referencing consumer deps).
  - Verified: full regression green — self-audit 24/24, core 95/95, preset 38/38, all 3 workspaces typecheck clean.
  - Architectural choice for Q2 + reviewer M2 + Open #6 still open — research bundle prepared via Sonnet research agent (5 option bundles mapped: Freeze-as-future / Core-symmetry / Delegate-and-forget / Spec-first v1.1 / Just-`missing` partial); awaits Art's decision.
- **2026-05-08 (Open #6 closed)** — `8cc6cef` closes react-next templates path rot via option (b). `packages/core/templates/react-next/{.storybook/main.ts, .storybook/preview.ts, storybook-package-additions.json}` created (last via `git mv` from preset for history preservation). setup.sh:230,231,238,242 updated to `$PKG_DIR/packages/core/templates/react-next/...`. Per-stack template pattern now symmetric with shared/: 5-instance "consumer-deployed-but-locally-housed" pattern. react-next dry-run exit=0; ts-server L1 (a) idempotence diff-clean; self-audit green; both package typechecks green.
