# Phase 4 Implementation Prompt — Stack Detector v1

> **Назначение:** self-contained prompt для orchestrator сессии. Реализовать Phase 4 (Stack Detector v1) согласно [phase-4-research.md](phase-4-research.md) — 6 capabilities × 3 reuse + 3 build, с pull-forward AIF integration touchpoint 4 (read + write).
> **Версия:** 0.1.0 — 2026-05-08
> **Triggered by:** Step 0 entry research GO verdict (reviewer 2026-05-08), [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) Phase 4 forward trigger.

---

## Identity & Context

**Repo:** `/Users/art/code/rules-as-tests-aif`
**Base branch:** `main` (после merge `chore/phase-3-aif-retrofit` PR)
**New branch:** `chore/phase-4-stack-detector` (создаётся от `main` HEAD)
**You are:** Opus orchestrator. Делаешь edits + commits сам или делегируешь junior через `Agent` tool (general-purpose). **NOT reviewer**.

## Обязательное чтение перед стартом

1. [phase-4-research.md](phase-4-research.md) — особенно §3.1 5-source priority list + §4 6-decision matrix + §5 5 scope deltas + stop-rule
2. [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) — Step 0 gate (для self-check что Phase 4 prompt = output этого gate'а)
3. [EXECUTION-PLAN.md:466-487](EXECUTION-PLAN.md) — original Phase 4 description (плюс scope deltas из research §5)
4. [aif-comparison.md §5](aif-comparison.md) — 4-touchpoint matrix (touchpoint 4 = skill-context, write-only в оригинале)
5. [self-application.md §2](self-application.md) — L1 invariant: «detector прогоняется на root репо в CI; expected output фиксируется в snapshot»
6. [risks.md](risks.md) — AIF coupling risks (4 строки от 2026-05-08)
7. Memory feedback: `feedback_external_docs_via_context7.md` — context7-only constraint (всё ещё actionable если потребуется доп. research по `semver` API)

---

## Architecture summary (из research §3.1, §4)

**Detector v1** = deterministic bridge over AIF artifacts с manifest-heuristic fallback. Layers:

```
packages/core/detector/             ← NEW (Phase 4)
├── index.ts                         ← public API: detectStack(projectRoot, opts)
├── read-aif.ts                      ← priority 1-3: .ai-factory/{DESCRIPTION,ARCHITECTURE}.md, skill-context/*/SKILL.md
├── read-manifest.ts                 ← priority 4: deps + lockfile signature (imports/extends detector-v0)
├── read-config.ts                   ← priority 5: next.config.*, tsconfig.json
├── version-aware.ts                 ← semver.coerce + range matching
├── confidence.ts                    ← severity/weight schema (AIF-compat) + confidence label view
├── cli.ts                           ← npm bin entrypoint
├── write-skill-context.ts           ← 4.6 emit (TASK 6, gated by stop-rule)
├── __snapshots__/                   ← vitest snapshots
├── fixtures/                        ← test fixtures (next-15, next-16, no-aif, with-aif)
└── *.test.ts                        ← paired tests

packages/core/detector-v0/           ← KEEP (Phase 3 артефакт, fallback source)
└── (unchanged — imports'ится через read-manifest.ts)

packages/meta-factory/src/detector/  ← UPDATE
└── index.ts                         ← re-export from @rules-as-tests/core/detector (вместо throw not-implemented)
```

**Source priority (детектор перебирает по убыванию, останавливается на первом hit):**

| Priority | Source | Confidence emit |
|---|---|---|
| 1 | `.ai-factory/DESCRIPTION.md` | `severity: pass, weight: 2` → `confidence: high` |
| 2 | `.ai-factory/ARCHITECTURE.md` | `severity: pass, weight: 2` → `confidence: high` |
| 3 | `.ai-factory/skill-context/<skill>/SKILL.md` | `severity: pass, weight: 2` → `confidence: high` |
| 4 | `package.json` deps + lockfile | `severity: warn, weight: 1` → `confidence: medium` |
| 5 | `next.config.*` / `tsconfig.json` presence | `severity: info, weight: 0` → `confidence: low` |

**Output schema (single emit, dual contract):**

```json
{
  "stack": "react-next",
  "framework": { "name": "next", "version": "16.0.1", "major": 16 },
  "runtime": { "name": "node", "major": null },
  "confidence": "high",
  "severity": "pass",
  "weight": 2,
  "source": ".ai-factory/DESCRIPTION.md",
  "rules": { "applicable": [...], "skipped": [...] }
}
```

---

## Task breakdown

Phase 4 budget: **1 неделя baseline + 1-1.5 дня для AIF read/write pull-forward** (≈6 days derived from task-estimate arithmetic: 4-5 дней Tasks 1-5 + 0.25 дня Task 1.5 + 0.5-1 день Task 6 + 0.5 retro). [EXECUTION-PLAN §8](EXECUTION-PLAN.md) stop-rule = «snapshot fragility >3 update/week → детектор over-engineered» применяется параллельно с time budget. Tasks 1, 1.5, 2-5 — MUST. Task 6 — SHOULD (stop-rule day-5 defer to Phase 11). Task 7 — closing gate.

### Task 1 — Detector v1 core (priority 4-5: manifest + config heuristic) (~1-1.5 дня)

**Артефакты:**
- `packages/core/detector/index.ts` — public API `detectStack(projectRoot: string, opts?: DetectorOptions): DetectionResult`
- `packages/core/detector/read-manifest.ts` — extends/imports `detector-v0/detect-applicable-rules.ts` logic (priority 4)
- `packages/core/detector/read-config.ts` — checks `next.config.{ts,js,mjs}`, `tsconfig.json` presence (priority 5)
- `packages/core/detector/version-aware.ts` — `import semver from 'semver'`; `extractMajor(versionRange: string): number | null`
- `packages/core/detector/confidence.ts` — `toSeverity(priority: 1-5): {severity, weight, confidence}` mapping
- `packages/core/detector/index.test.ts` — base case: detect this repo's stack (react-next OR ts-server), version-aware Next 15/16 fixtures, paired negative cases

**Verify (Task 1 acceptance):**
```bash
cd packages/core && npx tsx detector/index.ts $(pwd)
# expect: JSON {stack, framework, confidence: medium, severity: warn, source: "package.json"}

npm --prefix packages/core test detector/
# expect: green; ≥6 paired tests (3 positive + 3 negative)
```

**Constraint:** **DO NOT** delete `packages/core/detector-v0/` — Phase 3 history preserved per research §5 #5. v1 imports from v0 OR re-implements the manifest read; both acceptable, no deletion.

### Task 1.5 — Add `--dry-run` flag to setup.sh (~15 min, prerequisite для Task 5 acceptance criterion (a))

**Контекст:** [self-application.md:33](self-application.md) L1 acceptance требует `setup.sh --stack=$(detect)` idempotent на собственном репо. Текущий `setup.sh` (verified 2026-05-08: `grep -nE "dry-run" setup.sh` → empty) не имеет `--dry-run` flag — реальный двойной запуск выполнит side-effects (mkdir, cp templates, husky install). Без flag idempotence verify деструктивен.

**Артефакты:**
- `setup.sh` — добавить:
  - `DRY_RUN=0` env default рядом с `STACK=""` (line ~23)
  - argv parser: `--dry-run) DRY_RUN=1 ;;` рядом с `--stack=*) ...` (line ~47)
  - guards перед side-effect commands (mkdir, cp, chmod, husky install): `[ "$DRY_RUN" = "1" ] && { echo "[dry-run] would: <op>"; continue; }`
- `setup.sh` usage header (lines 13-14) — добавить пример: `bash setup.sh --stack=ts-server --dry-run  # report planned ops, no fs changes`

**Verify (Task 1.5 acceptance):**
```bash
# Snapshot timestamps before
TIMESTAMP_BEFORE=$(stat -f %m .husky/pre-commit 2>/dev/null || stat -c %Y .husky/pre-commit)
# Run dry-run
bash setup.sh --stack=ts-server --dry-run | grep -c "^\[dry-run\] would:"
# expect: ≥1 line (planned ops reported)
# Verify no side-effect happened
TIMESTAMP_AFTER=$(stat -f %m .husky/pre-commit 2>/dev/null || stat -c %Y .husky/pre-commit)
test "$TIMESTAMP_BEFORE" = "$TIMESTAMP_AFTER"
# expect: equal (no overwrite)
```

**Hard constraint:** dry-run должен быть **complete** — все side-effect calls (`cp`, `mkdir`, `chmod`, `npm install`, husky setup) под guard'ом. Partial dry-run = leaky abstraction, не закрывает MINOR-B.

### Task 2 — AIF read-side (priority 1-3) (~0.5 дня)

**Артефакты:**
- `packages/core/detector/read-aif.ts` — readers для:
  - `.ai-factory/DESCRIPTION.md` (free-form markdown — extract framework/runtime via grep on canonical headings из [AIF docs reference](aif-comparison.md))
  - `.ai-factory/ARCHITECTURE.md` (similar shape)
  - `.ai-factory/skill-context/<skill>/SKILL.md` (project-level overrides — read first match)
- `packages/core/detector/read-aif.test.ts` — fixtures `fixtures/with-aif/`, `fixtures/no-aif/`; verify priority order (DESCRIPTION → ARCHITECTURE → skill-context); graceful degradation when absent

**Verify (Task 2 acceptance):**
```bash
# Fixture с AIF artifacts
cd packages/core && npx tsx detector/index.ts ./detector/fixtures/with-aif
# expect: confidence: high, source: ".ai-factory/DESCRIPTION.md"

# Fixture без AIF — fallback на priority 4
npx tsx detector/index.ts ./detector/fixtures/no-aif
# expect: confidence: medium, source: "package.json"
```

**Hard constraint:** AIF artifact schema validation — **mandatory**, не optional (per research §5 + §6). Tests должны fail на неожиданном формате с понятным error message.

### Task 3 — CLI bin (~0.5 дня)

**Артефакты:**
- `packages/core/detector/cli.ts` — argv parsing (≤30 LOC, `process.argv` без yargs/commander), output JSON to stdout
- `packages/core/package.json` — три edits:
  1. добавить `"bin": { "rules-as-tests-detect": "./detector/cli.ts" }`
  2. обновить `"detect"` script: `"detect": "tsx detector/cli.ts"`
  3. **добавить `"./detector": "./detector/index.ts"` в `exports` field** (рядом с manifest/eslint-rules) — required для re-export из meta-factory
- `packages/meta-factory/src/detector/index.ts` — заменить throw-not-implemented на `export { detectStack } from '@rules-as-tests/core/detector'`
- `packages/meta-factory/bin/meta-factory.mjs` — добавить `detect` subcommand (если уже есть subcommand router) ИЛИ оставить только `core` CLI на этом этапе

**Verify (Task 3 acceptance):**
```bash
cd /Users/art/code/rules-as-tests-aif && npm --prefix packages/core run detect
# expect: JSON to stdout, exit 0

cd /tmp && mkdir fake-next-16 && cd fake-next-16
npm init -y && npm install next@16 react@19
npx --package=@rules-as-tests/core rules-as-tests-detect $(pwd)
# expect: stack=react-next, framework.major=16, confidence=medium
```

### Task 4 — Snapshot testing (~0.5 дня)

**Артефакты:**
- `packages/core/detector/__snapshots__/index.test.ts.snap` — vitest auto-generated
- `packages/core/detector/fixtures/` — frozen fixture trees (`with-aif/`, `no-aif/`, `next-15/`, `next-16/`, `react-only/`, `ts-server/`)
- `packages/core/detector/snapshot.test.ts` — `expect(detectStack(fixturePath)).toMatchSnapshot()` per fixture

**Verify (Task 4 acceptance):**
```bash
npm --prefix packages/core test detector/snapshot
# expect: green; ≥6 fixture snapshots written
```

**Self-reflection prompt (out-loud в retro):** какая fixture spec поломалась чаще всего? Это сигнал к расширению `read-config.ts` ИЛИ к тому что snapshot слишком детализирован (fragility per [EXECUTION-PLAN.md:486](EXECUTION-PLAN.md) — stop-rule >3 update в неделю).

### Task 5 — Self-application snapshot in CI (~0.5 дня)

**Артефакты:**
- `packages/core/detector/expected-self-detect.json` — frozen output для root репо (committed)
- `.github/workflows/audit-self.yml` — новый job `framework-self-detect`:
  ```yaml
  framework-self-detect:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@<sha>
        with: { persist-credentials: false }
      - run: npm ci
      - run: |
          ACTUAL=$(npm --prefix packages/core run detect --silent -- $GITHUB_WORKSPACE)
          EXPECTED=$(cat packages/core/detector/expected-self-detect.json)
          diff <(echo "$ACTUAL" | jq -S .) <(echo "$EXPECTED" | jq -S .)
  ```

**Verify (Task 5 acceptance — закрывает обa criteria L1 invariant из [self-application.md:33](self-application.md), в том же порядке):**
```bash
# (a) Idempotence acceptance — setup.sh --stack=$(detect) запускается дважды на одном репо
# Prerequisite: Task 1.5 добавил --dry-run flag в setup.sh
DETECTED=$(npm --prefix packages/core run detect --silent -- $(pwd) | jq -r .stack)
bash setup.sh --stack=$DETECTED --dry-run > /tmp/run1.txt 2>&1
bash setup.sh --stack=$DETECTED --dry-run > /tmp/run2.txt 2>&1
diff /tmp/run1.txt /tmp/run2.txt
# expect: no diff (idempotent)

# (b) Self-application snapshot stability — frozen JSON diff
ACTUAL=$(npm --prefix packages/core run detect --silent -- $(pwd))
EXPECTED=$(cat packages/core/detector/expected-self-detect.json)
diff <(echo "$ACTUAL" | jq -S .) <(echo "$EXPECTED" | jq -S .)
# expect: no diff

actionlint .github/workflows/audit-self.yml
# expect: exit 0
```

**Self-application invariant L1 closed.** `setup.sh --stack=$(detect)` идемпотентен (criterion a); detector snapshot стабилен на root репо в CI (criterion b). Оба acceptance criteria из self-application.md:33 verifiable, **в том же порядке** что в source-of-truth.

### Task 6 — AIF skill-context write-side (4.6) (~0.5-1 день, **STOP-RULE day-5**)

**Stop-rule (per [phase-4-research.md §5](phase-4-research.md):138):** триггер по статусу scope deltas, не общему baseline. Если к концу дня 5:
- Task 2 (= 4.1 read-side) ещё не закрыт → **приоритет: завершить Task 2** (4.1 — Phase 4 self-application angle, higher priority); defer Task 6 to Phase 11
- ИЛИ Task 6 (= 4.6 write-side) не начат → defer Task 6 to Phase 11

**Action на defer:** запись split-point в retro phase-4.md + обновление [aif-comparison.md §7 phase deferrals](aif-comparison.md) с новой строкой «touchpoint 4 write-side → Phase 11 (deferred from Phase 4 due to budget)». Task 2 НЕ defer'ится — только Task 6.

**Артефакты (если идём):**
- `packages/core/detector/write-skill-context.ts` — emit `.ai-factory/skill-context/{aif-fix,aif-implement,aif-architecture}/SKILL.md` с stack-specific overrides из detector output
- `packages/core/detector/write-skill-context.test.ts` — fixtures + golden file tests
- `packages/core/detector/cli.ts` — добавить flag `--emit-skill-context=<dir>`

**Verify (Task 6 acceptance):**
```bash
cd /tmp/fake-next-16
npx --package=@rules-as-tests/core rules-as-tests-detect $(pwd) --emit-skill-context=./.ai-factory/skill-context
ls .ai-factory/skill-context/aif-fix/SKILL.md   # exists
ls .ai-factory/skill-context/aif-implement/SKILL.md
ls .ai-factory/skill-context/aif-architecture/SKILL.md
# Schema validation
test "$(head -1 .ai-factory/skill-context/aif-fix/SKILL.md)" = "# aif-fix — project-level overrides"
```

**Hard constraint:** schema validation тесты MUST be present (per research §6 watch-list). При AIF schema change — fail loudly, не silent drift.

### Task 7 — Phase 4 retro (composite) (~0.5 дня, **closing gate**)

**Артефакт:** `docs/meta-factory/retros/phase-4.md` по стандартному формату из [EXECUTION-PLAN.md §5](EXECUTION-PLAN.md):

- **Verification block:** копии выходов всех 5 (или 6) Task verify-команд + actionlint/zizmor green
- **Self-reflection block:**
  - Какие fixtures дали unexpected output? Edge cases для §13.5 multi-stack?
  - Version-aware logic vs simple semver match — оправдана сложность?
  - Confidence score consistent с PROPOSAL §8?
  - Был ли соблазн упростить read-aif.ts «на потом»?
- **Evaluation block:**
  - Self-application score: target 8/10
  - Time-vs-plan ratio: target ≤1.5x (1 нед baseline → ≤9 рабочих дней при включённом 4.6; ≤7 дней без 4.6)
  - Verdict: **GO** to Phase 5 если Tasks 1-5 closed AND snapshot stable AND Task 6 либо closed либо явно deferred с rationale
- **RCA section:** только если Time-vs-plan >2x ИЛИ snapshot fragility (>3 update в неделю)
- **Open questions for orchestrator:** что отложено в Phase 5+ (например version-aware extension на Tailwind v3/v4, или multi-stack monorepo detection)

---

## Commit strategy

Atomic commits per task — orchestrator делегирует junior'у через `Agent` tool каждую Task discrete-ой, accept по верификации.

```
1.   feat(detector):   Phase 4 Task 1 — v1 core (manifest + config priority 4-5)
1.5. feat(setup):      Phase 4 Task 1.5 — add --dry-run flag (prereq for L1 idempotence verify)
2.   feat(detector):   Phase 4 Task 2 — AIF read-side (priority 1-3) + fixtures
3.   feat(detector):   Phase 4 Task 3 — CLI bin + meta-factory wiring
4.   test(detector):   Phase 4 Task 4 — snapshot tests + 6 fixture trees
5.   ci(audit-self):   Phase 4 Task 5 — framework-self-detect job (closes L1 a+b)
6.   feat(detector):   Phase 4 Task 6 — AIF skill-context write-side (touchpoint 4 close)
     [or: docs(phase-4): Task 6 deferred to Phase 11 — split-point recorded]
7.   docs(phase-4):    retro + GO verdict
```

**Hard:** перед каждым commit — `make self-audit` green. После Task 5 включается self-detect job — он также должен быть green в CI после push'а ветки.

---

## Verification probes (orchestrator runs before retro GO)

```bash
# 1. Detector core works on this repo
npm --prefix packages/core run detect -- $(pwd) | jq .stack
# expect: "react-next" or "ts-server" (whichever this repo classifies as)
# NOTE: -- separator critical — npm proxies extra args только after --

# 2. Detector reads AIF artifacts when present
ls packages/core/detector/fixtures/with-aif/.ai-factory/DESCRIPTION.md
npm --prefix packages/core test detector/read-aif.test.ts
# expect: green; ≥3 priority-order tests

# 3. Detector falls back to manifest heuristic
npm --prefix packages/core test detector/read-manifest.test.ts
# expect: green

# 4. semver still transitive only — no explicit dep added
grep -c '"semver"' packages/core/package.json
# expect: 0 (no explicit dep)
npm ls semver --workspaces 2>&1 | grep -c "semver@"
# expect: ≥1 (still deduped from typescript-eslint)

# 5. CLI bin executable + JSON output non-empty
node --version  # ensure >=20
npx tsx packages/core/detector/cli.ts $(pwd) | jq .stack
# expect: non-empty stack value (e.g. "react-next" or "ts-server"), exit 0

# 6. Snapshot tests stable on second run
npm --prefix packages/core test detector/snapshot && \
  npm --prefix packages/core test detector/snapshot
# expect: both runs green, no snapshot updates required

# 7. Self-application snapshot frozen
diff <(npm --prefix packages/core run detect --silent -- $(pwd) | jq -S .) \
     <(jq -S . packages/core/detector/expected-self-detect.json)
# expect: no diff

# 8. CI YAML valid
actionlint .github/workflows/audit-self.yml && \
  zizmor --format plain .github/workflows/
# expect: exit 0 both

# 9. (Task 6) skill-context emitted if Task 6 closed
# Use the same /tmp/fake-next-16 path created in Task 6 verify (line 205-206)
ls /tmp/fake-next-16/.ai-factory/skill-context/{aif-fix,aif-implement,aif-architecture}/SKILL.md
# expect: 3 files exist OR Task 6 deferred (per retro)

# 10. No regression in earlier phases
make self-audit
npm --prefix packages/core test
npm --prefix packages/preset-next-15-canonical test
npm --prefix packages/meta-factory run typecheck
# expect: all green; principles 24/24
```

---

## Hard constraints

- **NO `git commit --no-verify`** — нарушает self-application principle (Phase 1.A invariant)
- **NO `git push`** — orchestrator decides push timing с пользователем
- **Context7-only** для external library research (memory rule). NO `git clone` AIF/semver/etc.
- **NO explicit `semver` dep в `packages/core/package.json`** — оно уже транзитивное (verified phase-4-research §3.2). Если ESLint/TS захочет explicit — flag ESCALATE, не добавляй автоматически.
- **NO yargs/commander/minimist в `cli.ts`** — argv parsing через `process.argv`, ≤30 LOC (per [phase-4-research.md §3.4](phase-4-research.md)). Если orchestrator считает что нужна liba — flag ESCALATE, не добавляй автоматически.
- **NO deletion `packages/core/detector-v0/`** — Phase 3.1 SSOT cleanup history сохраняется
- **AIF schema validation в тестах = mandatory** (research §5+§6 — bidirectional break risk)
- **Stop-rule for Task 6:** строгий — день 5, без extension. Defer to Phase 11 явно.
- **Real edits, не draft'ы** — этот документ содержит scope + acceptance, не «creative interpretation»
- **Если AIF schema mismatch обнаружен в read-aif.ts при testing** — STOP, эскалировать пользователю, обновить [risks.md](risks.md) с новой row, не продолжать automatic build

---

## Возврат результата

После Tasks 1-7 (либо 1-5 + Task 6 deferred):

1. **Created/modified files** — список с commit hashes
2. **Verification probes** — все 10 пройдены (probe 9 = exists OR documented defer)
3. **Reuse posture validated** — 3 reuse decisions (4.1 read AIF, 4.3 severity/weight, 4.6 write skill-context if closed) измеримы (LOC reused / LOC built ratio в retro)
4. **Confidence schema sample** — JSON output detector'а на root репо как evidence dual-contract emit
5. **Self-application score** (target 8/10 per [EXECUTION-PLAN §6 Phase 4](EXECUTION-PLAN.md))
6. **Open questions для orchestrator сессии Phase 5 entry** — с привязкой к §5.5 Step 0 trigger
7. **Time spent** vs estimate (1 нед baseline + 1-1.5 дня pull-forward; >2x → RCA section в retro)

---

## Версия

- **0.1.0** — 2026-05-08 — initial draft after Step 0 entry research GO verdict (reviewer 2026-05-08); embeds 6 decisions + 5 scope deltas + stop-rule Task 6 day-5
- **0.1.1** — 2026-05-08 — closed pre-execution reviewer findings (4 MAJOR + 4 MINOR): MAJOR-1 stop-rule trigger phrasing aligned with research §5:138; MAJOR-2 §8 misattribution removed (snapshot-fragility ≠ day-count); MAJOR-3 probe 1 missing `--` separator fixed; MAJOR-4 L1 idempotence acceptance criterion added to Task 5; MINOR-1 `./detector` export entry added to Task 3; MINOR-2 probe 5 simplified; MINOR-3 probe 9 path aligned with Task 6; MINOR-4 CLI dep policy promoted to Hard constraint.
- **0.1.2** — 2026-05-08 — closed re-review NEW findings: NEW MINOR-A (a)/(b) lettering inverted between verify block and closing statement → swapped to match self-application.md:33 source order (idempotence=a first, snapshot=b second); NEW MINOR-B `--dry-run` hedge → explicit Task 1.5 (add `--dry-run` flag to setup.sh, ~15 min, prerequisite для Task 5 idempotence verify); commit strategy + Task budget updated accordingly.
