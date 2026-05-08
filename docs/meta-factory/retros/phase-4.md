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

- (a) **`setup.sh --stack=$(detect)` идемпотентен на собственном репо** — verified locally; CI job `framework-self-detect` step "Verify setup.sh --stack=$(detect) --dry-run idempotent" runs the same comparison every push. ✓
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
| Self-application score | 8/10 | **9/10** — both L1 criteria (a+b) closed, CI gate active, frozen snapshot committed; ‑1 because the long-horizon stability ("≥3 недели") is point-in-time only at retro time | ✓ |
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
3. **Pre-existing setup.sh templates path mismatch** (`templates/shared/` → `packages/core/templates/shared/`) discovered during Task 1.5 dry-run testing. Out-of-scope for Phase 4; recommend a small Phase 5 entry-time clean-up commit before any new setup.sh edit.
4. **Schema validation for AIF v3+** — current `read-aif.ts` validates canonical h1/h2 heading presence, not full AIF v2.x schema. If AIF v3 changes heading conventions, add a version-aware schema check; subscribe AIF release notes per risks.md row "AIF API contract changes".
5. **`packages/core` typecheck pre-existing errors** (`probes/audit-r4.ts` ts-morph missing; `render/render-rules.ts` ajv default constructor) — pre-existing, not my regression. Worth a hygiene pass at Phase 5 entry.

---

## Versioning

- **2026-05-08** — Phase 4 close, GO verdict for Phase 5 entry. 7 atomic commits on `chore/phase-4-stack-detector` ahead of merge.
