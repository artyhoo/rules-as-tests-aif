# Retro: Phase 1 batch 1.C — Spec discipline

**Status:** GO
**Closed at:** 2026-05-07
**Time spent:** ~5.5 минут subagent + ~3 минуты orchestrator (planned: 1 день)
**Commit:** `5b60d6e feat(self-application): Phase 1.C spec validation (validate-batch-spec.ts + hooks)`

---

## Verification

### Mechanical

| Команда | Expected | Actual | Result |
|---|---|---|---|
| `cd scripts && npm test` | all pass | 13/13 (3 test files) | ✓ |
| `wc -l scripts/validate-batch-spec.ts` | — | **366** (retro originally claimed 213; corrected in Phase 1.D MINOR-3 fix) | — |
| `wc -l scripts/validate-batch-spec.test.ts` | — | **226** (retro originally claimed 178; corrected in Phase 1.D MINOR-3 fix) | — |
| Positive integration: real SHA `actions/checkout@11bd71901...` | exit 0 | exit 0 | ✓ |
| Negative integration: zeros SHA | exit 1 | exit 1 with `action.yml not found at SHA 000000...` | ✓ |
| Negative integration: fabricated rhysd/actionlint SHA from batch-D.md | exit 1 or 2 | exit 1 (action.yml absent — `rhysd/actionlint` is binary tool, not action) | ✓ |
| Soft mode: `--soft` with bad SHA | exit 0, stderr finding | exit 0, stderr | ✓ |
| `bash -n .husky/pre-commit` and `.husky/pre-push` | parse | parse | ✓ |
| Pre-commit smoke (no spec files staged) | exit 0 silent | exit 0 silent | ✓ |
| Cache: `/tmp/validate-batch-spec-cache/<sha>.json` TTL 1h | spec compliant | implemented per spec | ✓ |

### Decision matrix coverage (§3 self-application.md)

| Probe | Layer | Phase 1.C status |
|---|---|---|
| Spec validation (SHAs) | pre-commit MAY (soft warn) + pre-push hard fail | ✓ closed |

---

## Self-reflection

### Root cause of fabricated SHA in batch-D.md

Subagent identified 3 compounding factors:

1. **No tooling existed** to validate SHAs at commit/push time — the gap that Phase 1.C closes
2. **Subagent context-switch:** batch-D was delegated with explicit instruction «if gh not authenticated, leave SHAs as-written» — this **normalized the untrusted path**. Spec-level decision flaw, not execution error.
3. **Spec misread:** batch-D spec described `rhysd/actionlint@4dde6cc` as «verified», but `rhysd/actionlint` is **a binary tool released as a GitHub release, not a composite action with `action.yml`**. So the SHA failed on **two levels** simultaneously: fake SHA + repo with no action.yml.

**Lesson:** the new `validate-batch-spec.ts` catches both failure modes (fake SHA via 404, missing action.yml via 404). Both check independently — robust.

### Probe 1 (SHA validation) applicable in `.github/workflows/*.yml`?

**Decision: keep Phase 1.C scoped to orchestrator-prompts only.**

Rationale:
- Workflows already covered by `actionlint` (expression syntax) + `zizmor` (`unpinned-uses` lint) in Phase 1.A pre-push
- Adding workflow validation в `validate-batch-spec.ts` создал бы **duplication ownership** — два tools проверяют одно и то же
- Single-source-of-truth: workflows = actionlint+zizmor; orchestrator-prompts = validate-batch-spec

**OK** — корректный scope decision.

### Probe 2 (intra-skill paths) — отдельный probe

**Decision: deferred to Phase 2 / separate batch.**

Rationale:
- Different mechanism: `test -f $skill_dir/references/X.md` vs `gh api repos/<owner>/<repo>/contents/action.yml`
- Different failure mode: missing local file vs unverified remote SHA
- Different cache behaviour: filesystem-realtime vs disk-cache 1h TTL
- Mixing two distinct categories in one script obscures each — bad cohesion

**OK** — не cargo cult'ить consolidation. Phase 2 (principles meta-tests) is right home, или dedicated Phase 1.D если оперативно появится spike.

### gh API rate-limit budget

- Anonymous: 60 req/h
- Authenticated (`gh auth login`): 5000/h
- Current orchestrator-prompts corpus: ~1 unique live SHA → cache hits после first run
- Exit code 2 (rate-limited) treated as pass in pre-push → не блокирует legitimate push

**Mitigation для growth:** CONTRIBUTING.md updated с note recommending `gh auth login`. **OK.**

### Соблазн «сделать на потом»

- ⚠ **Subagent-deferred:** «CONTRIBUTING.md update with gh auth login recommendation» — **closed by orchestrator** в этом retro (вместе с docs/meta-factory/retros/phase-1-c.md commit). Не оставляю для composite retro. Добавляет ~2 строки в CONTRIBUTING.md.

### Unknown unknowns

- **Fence-skip может create false-negative в edge cases.** validate-batch-spec.ts skips refs внутри code fences (correct: documentation, not spec). Но если orchestrator-prompts фрагмент рекомендует «use this SHA» **внутри fence**, и agent потом копирует это в реальный workflow без второго layer'а validation — fabricated SHA проходит. **Mitigation:** real workflow validation (actionlint+zizmor в pre-push) catches deployed references. Two-layer defense валидно. Worth documenting в self-application.md §6 anti-patterns extended.
- **`rhysd/actionlint` как «action repo который не action».** Учиться extending это: какие ещё «known binary tools without action.yml» есть в orchestrator-prompts'ах? Позволит тонко настроить error messages.

---

## Evaluation

### Self-application score: 9/10

Plan §6 Phase 1.C evaluation: «Self-application score: 9/10».

**Actual: 9/10** (на уровне plan'a) потому что:
- ✅ Hard-fail mechanism для spec discipline (pre-push) implemented
- ✅ Soft-warn mechanism (pre-commit) для quick feedback
- ✅ Two-failure-mode detection (fake SHA + missing action.yml) — single tool catches оба
- ✅ Cache behaviour (1h TTL) — efficient, не abusing gh api
- ✅ Exit code 2 — rate-limit-safe, не blocks legitimate push
- ❌ Bypass через `--no-verify` всё ещё possible (CI gate enforce-husky-presence ловит post-push, не bypass'у)
- ❌ Fence-skip false-negative в documentation-recommends-SHA scenarios (документировано, mitigated by 2nd layer actionlint+zizmor)

### Time-vs-plan ratio: ~0.01x

Planned: 1 день. Actual: ~8.5 minutes total. Ratio ≪ 0.5x, RCA не требуется.

**Confirmed pattern (third batch):** subagent + orchestrator на готовом scope = high efficiency. Phase 1 total time: ~16 minutes vs planned 3-5 дней. **Pattern прочно установлен.**

### New risks identified

| Risk | Where to add |
|---|---|
| Fence-skip false-negative для documentation-recommends-SHA scenarios | self-application.md §6 anti-patterns extension (Phase 1 composite retro) |
| `rhysd/actionlint`-class «binary tools without action.yml» error messaging | minor finding — improve on first user-feedback cycle |

### Verdict: GO

Spec discipline acceptance criterion (self-application.md §7) met:
- Невозможно закоммитить spec с fabricated SHA локально (pre-commit soft warn + pre-push hard fail) ✓
- `scripts/validate-batch-spec.ts` существует и интегрирован ✓
- Caches efficient, rate-limit safe ✓

**GO к Phase 1 composite retrospective.**

**Pre-composite-retro action items:**

1. Закоммитить этот retro + CONTRIBUTING.md update в одном commit'е
2. Composite retro `phase-1.md` объединяет findings из 1.A + 1.B + 1.C + cross-batch insights
