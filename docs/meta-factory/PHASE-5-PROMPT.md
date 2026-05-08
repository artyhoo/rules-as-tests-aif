# Phase 5 Implementation Prompt — Layer 2 Research Agent v1

> **Назначение:** self-contained prompt для orchestrator сессии. Реализовать Phase 5 (Layer 2 Research Agent v1, **deterministic-curated, no LLM**) согласно [phase-5-research.md](phase-5-research.md) — 6 capabilities, 5 build + 1 strong reuse + 2 transitive reuses.
> **Версия:** 0.1.0 — 2026-05-08
> **Triggered by:** [phase-5-research.md §5](phase-5-research.md) GO verdict; [EXECUTION-PLAN.md §5.5](EXECUTION-PLAN.md) Phase 5 forward trigger.
> **Reordering note:** EXECUTION-PLAN §6 originally numbered L2=Phase 6, L4=Phase 5. Swap rationale: L4 Validator gates synthesized output; without L2/L3 there is nothing beyond Phase 2 manifest meta-tests to validate. Phase 5 ↔ Phase 6 swap documented in retro.

---

## Identity & Context

**Repo:** `/Users/art/code/rules-as-tests-aif`
**Base branch:** `main` (после merge `chore/phase-4-stack-detector` PR #4 → `ac8bb1e`)
**Working branch:** `chore/phase-5-research-agent` (создана от `main` HEAD)
**You are:** Opus orchestrator. Делаешь edits + commits сам или делегируешь junior через `Agent` tool (general-purpose). **NOT reviewer**.

## Обязательное чтение перед стартом

1. [phase-5-research.md](phase-5-research.md) — 6-capability matrix + reuse decisions + scope (≤200 lines, full read)
2. [architecture.md §2.4](architecture.md) — Layer 2 spec; учти **deterministic v1 pivot** (no LLM, fixture-driven) per phase-5-research.md §1
3. [EXECUTION-PLAN.md §6 Phase 6](EXECUTION-PLAN.md) — original Phase 6 description (теперь Phase 5 после swap), Planner-Executor invariant
4. [self-application.md §2 row L2 + §7 row L2](self-application.md) — acceptance criterion для drift detection
5. [open-questions.md §13.7](open-questions.md) — operationalization options для drift detection (symbolic v1 ships этой фазой)
6. [aif-comparison.md §5 + §9](aif-comparison.md) — touchpoint 4 already shipped (Phase 4); skill-context output sink reuse opportunity
7. Memory feedback: `feedback_external_docs_via_context7.md` — context7-only constraint

---

## Architecture summary (из research §3, §4)

**Research Agent v1** = deterministic bridge over **curated research store** + symbolic drift detection. Layers:

```
packages/core/research/                      ← NEW (Phase 5)
├── index.ts                                  ← public API: research(detection) → ResearchPlan
├── types.ts                                  ← ResearchEntry, ResearchPlan, Provenance
├── load.ts                                   ← semver-aware pattern lookup
├── allowlist.ts                              ← static source registry + provenance validator
├── diff.ts                                   ← pattern-keyed delta between two cache versions
├── drift.ts                                  ← symbolic drift detector for 3 own sources
├── cli.ts                                    ← npm bin: --self | --diff vA vB | --pattern X
├── store/                                    ← curated research entries (committed)
│   └── <framework>/<version>/<pattern>.json
├── fixtures/                                 ← test fixtures
├── __snapshots__/
└── *.test.ts

packages/core/research/expected-self-research.json   ← frozen own-repo output for CI

.github/workflows/audit-self.yml                     ← UPDATE: add framework-self-research job
```

**Public API contract (Planner-Executor enforcement at module surface):**

```typescript
// packages/core/research/index.ts — Phase 5
export function research(detection: DetectionResult): ResearchPlan
export type { ResearchPlan, ResearchEntry, Provenance } from './types.ts'
// NO other exports. NO file write helpers exposed beyond cli.ts internal use.
```

L3 in Phase 6 imports `ResearchPlan` schema only; never imports L2 internals or store/ paths.

**Output schema sample:**

```json
{
  "framework": "next",
  "version": "16.2.1",
  "patterns": [
    {
      "id": "nextjs-app-router",
      "summary": "App Router replaces Pages Router for new projects in Next 13+",
      "bestPractices": ["Use `async function Page` for server components", ...],
      "antiPatterns": ["Importing `next/router` from app/ directory"],
      "provenance": [
        { "url": "https://nextjs.org/docs/app", "allowlistKey": "next.official", "fetchedAt": "2026-05-08" }
      ]
    }
  ],
  "missing": ["@playwright/test"],
  "drift": null
}
```

`drift` populated only when `--self` mode runs.

---

## Task breakdown

Phase 5 budget: **~6 hours orchestrator path** (single-session, mirrors Phase 4 compression). Tasks 1-7 sequential; Task 6 retro is closing gate.

### Task 1 — Types + ResearchPlan schema (~30 min)

**Артефакты:**
- `packages/core/research/types.ts`:
  ```typescript
  export interface Provenance { url: string; allowlistKey: string; fetchedAt: string }
  export interface ResearchEntry {
    id: string                        // pattern id matching DetectionResult.patterns[]
    summary: string
    bestPractices: string[]
    antiPatterns: string[]
    provenance: Provenance[]
    extras?: Record<string, unknown>  // escape hatch per research §5 risk
  }
  export interface ResearchPlan {
    framework: string | null
    version: string | null
    patterns: ResearchEntry[]
    missing: string[]                  // forwarded from DetectionResult.missing
    drift: DriftReport | null          // populated only in --self mode
  }
  export interface DriftReport { sources: string[]; mismatches: DriftMismatch[] }
  export interface DriftMismatch { kind: 'modal-verb' | 'term-presence'; detail: string; foundIn: string[]; missingIn: string[] }
  ```
- JSON Schema (`research-plan.schema.json`) for runtime validation via existing Ajv usage in render-rules

**Verify:**
```bash
npm --prefix packages/core run typecheck
# expect: clean
```

### Task 2 — Curated store + semver-aware loader (~1 hour)

**Артефакты:**
- `packages/core/research/store/next/16.x/nextjs-app-router.json` — hand-authored entry mirroring detector's pattern set
- `packages/core/research/store/next/16.x/nextjs-pages-router.json` — deprecation/migration guidance
- `packages/core/research/store/next/16.x/react-server-components.json`
- `packages/core/research/store/next/15.x/nextjs-app-router.json` — earlier-version variant for diff-mode tests
- `packages/core/research/store/shared/tailwind-v3-config.json` — version-agnostic
- `packages/core/research/store/shared/tailwind-v4-css-tokens.json`
- `packages/core/research/load.ts` — `loadEntries(framework: string|null, version: string|null, patterns: string[]): ResearchEntry[]` with semver fallback (16.2.1 → 16.x dir if exact missing); shared/ used as cross-version fallback
- `packages/core/research/load.test.ts` — 6+ tests: exact-version hit, semver-major fallback, shared/ fallback, missing pattern, framework=null, version=null

**Verify:**
```bash
npm --prefix packages/core test research/load.test.ts
# expect: green
```

**Hard constraint:** entries hand-authored, NOT LLM-generated в этой фазе. Каждый entry содержит ≥1 provenance URL pointing к официальному doc'у фреймворка.

### Task 3 — Source allowlist registry + provenance validator (~30 min)

**Артефакты:**
- `packages/core/research/allowlist.ts`:
  ```typescript
  export const ALLOWED_SOURCES = {
    'next.official': ['nextjs.org', 'vercel.com/docs'],
    'react.official': ['react.dev'],
    'tailwind.official': ['tailwindcss.com'],
    'mdn': ['developer.mozilla.org'],
  } as const
  export function validateProvenance(p: Provenance): { ok: boolean; reason?: string }
  ```
- `packages/core/research/allowlist.test.ts` — 5+ tests: valid URL accepted, mismatched key rejected, unknown key rejected, malformed URL rejected, http (non-https) rejected

**Verify:**
```bash
npm --prefix packages/core test research/allowlist.test.ts
# expect: green
```

**Hard constraint:** все provenance URLs в curated store MUST validate against allowlist; runtime check enforced in `load.ts`. Failed validation = throw with clear error, no silent skip.

### Task 4 — Diff-mode (pattern-keyed delta) (~1 hour)

**Артефакты:**
- `packages/core/research/diff.ts`:
  ```typescript
  export interface ResearchDelta { added: ResearchEntry[]; removed: string[]; modified: { id: string; before: ResearchEntry; after: ResearchEntry }[] }
  export function diffPlans(a: ResearchPlan, b: ResearchPlan): ResearchDelta
  ```
  - Set diff over `entry.id` for added/removed
  - Content hash (stable JSON.stringify with sorted keys) для modified detection
- `packages/core/research/diff.test.ts` — 5+ tests: identical plans (empty delta), added entry, removed entry, modified entry (best practices change), framework version mismatch warning

**Verify:**
```bash
npm --prefix packages/core test research/diff.test.ts
# expect: green
```

### Task 5 — Symbolic drift detection (closes [open-questions.md §13.7](open-questions.md) symbolic-v1) (~1.5 hour)

**Артефакты:**
- `packages/core/research/drift.ts`:
  ```typescript
  export const SELF_APP_SOURCES = [
    'skills/rules-as-tests/SKILL.md',
    'skills/rules-as-tests/references/overview.md',
    'skills/rules-as-tests/references/ai-traps.md',
  ]
  export function detectDrift(repoRoot: string): DriftReport
  ```
  - **Modal-verb extraction:** regex `\b(MUST|SHOULD|MUST NOT|SHOULD NOT|MAY)\b` in headings/bullets per source; report mismatches when same principle term appears with different modal in different sources
  - **Term-presence:** extract bullet-leading nouns/principles from each source; cross-check that core principles (5-layer framework, AST > grep, paired negative tests, mutation testing, two-AI review) are mentioned in ≥2 sources
  - Output `DriftReport` with structured mismatches
- `packages/core/research/fixtures/drift/` — paired fixtures:
  - `drift/no-drift/` — 3 mock sources known consistent
  - `drift/with-drift/` — 3 mock sources with intentional MUST→SHOULD demotion
- `packages/core/research/drift.test.ts` — 4+ tests: no-drift fixture (empty mismatches), with-drift fixture (≥1 mismatch detected), real repo at HEAD (snapshot), missing source (graceful error)

**Verify:**
```bash
npm --prefix packages/core test research/drift.test.ts
# expect: green; with-drift fixture detects ≥1 mismatch
npx tsx packages/core/research/cli.ts --self
# expect: JSON with drift.mismatches: [] (assuming HEAD has no drift; otherwise reveals real drift to address)
```

**Hard constraint:** symbolic v1 ships this phase. Behavioral/embedding-based v2/v3 explicitly deferred (per research §6 watch-list); drift detection MUST NOT block on absent infrastructure.

### Task 6 — Public API + CLI (~30 min)

**Артефакты:**
- `packages/core/research/index.ts` — single function export per Planner-Executor module-surface contract:
  ```typescript
  import type { DetectionResult } from '../detector/types.ts'
  export function research(detection: DetectionResult): ResearchPlan
  export type { ResearchPlan, ResearchEntry, Provenance, DriftReport, DriftMismatch } from './types.ts'
  ```
- `packages/core/research/cli.ts` — argv parser ≤40 LOC, supports:
  - `--self` (run drift detection on own repo, output ResearchPlan with drift populated)
  - `--diff <pathA> <pathB>` (load two plan JSONs from disk, emit delta)
  - `--pattern <id>` (filter ResearchPlan to single pattern entry)
  - `<projectRoot>` (default: run detector + research pipeline, emit ResearchPlan)
- `packages/core/package.json`:
  - Add `"./research"` to `exports`: `{"./research": "./research/index.ts"}`
  - Add bin entry `"rules-as-tests-research": "./research/cli.ts"` (paired with detector bin)
  - Add `"research": "tsx research/cli.ts"` script (paired with `detect`)

**Verify:**
```bash
npx tsx packages/core/research/cli.ts $(pwd) | jq '.framework'
# expect: non-empty value matching detector output
npx tsx packages/core/research/cli.ts --self | jq '.drift'
# expect: object with sources/mismatches keys
```

### Task 7 — Self-application snapshot + CI gate (~45 min)

**Артефакты:**
- `packages/core/research/expected-self-research.json` — frozen output for root repo (committed)
- `.github/workflows/audit-self.yml` — new job `framework-self-research`:
  ```yaml
  framework-self-research:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@<sha>
        with: { persist-credentials: false }
      - run: npm ci
      - run: |
          ACTUAL=$(npx tsx packages/core/research/cli.ts --silent -- $GITHUB_WORKSPACE)
          EXPECTED=$(cat packages/core/research/expected-self-research.json)
          diff <(echo "$ACTUAL" | jq -S .) <(echo "$EXPECTED" | jq -S .)
  ```
- `packages/core/research/snapshot.test.ts` — vitest snapshot test for own repo result (paired with detector's snapshot.test.ts pattern)

**Verify:**
```bash
diff <(npx tsx packages/core/research/cli.ts $(pwd) | jq -S .) \
     <(jq -S . packages/core/research/expected-self-research.json)
# expect: no diff
actionlint .github/workflows/audit-self.yml
# expect: exit 0
```

**Self-application invariant L2 partially closed:**
- (drift detection symbolic v1) — `research --self` returns `drift.mismatches.length === 0` on HEAD or surfaces real drift
- (snapshot stability) — frozen `expected-self-research.json` diffs clean in CI

Behavioral/embedding-based drift remains deferred per [open-questions.md §13.7](open-questions.md) — Phase 7+ trigger.

### Task 8 — Phase 5 retro (composite, closing gate) (~30 min)

**Артефакт:** `docs/meta-factory/retros/phase-5.md` per [EXECUTION-PLAN §5](EXECUTION-PLAN.md):

- **Verification block:** все 9 verification probes (см. ниже) + actionlint/zizmor green
- **Self-reflection block:**
  - Какой curated entry оказался хардест to author? Признак неполноты pattern catalogue?
  - Symbolic drift v1 — false positives на real HEAD? Если да — нужна tolerance config?
  - ResearchPlan extras escape hatch — использовали? Если да — что туда положили? (signal к расширению schema next phase)
  - Touchpoint 4 sink — нужна ли проекция ResearchPlan → skill-context в Phase 5 или ждём Phase 6?
  - Phase 5/6 reordering vs EXECUTION-PLAN §6 — задокументирован чётко?
- **Evaluation block:**
  - Self-application score: target 8/10 (drift detection v1 lands; snapshot stability point-in-time)
  - Time-vs-plan: target ≤6 hours (orchestrator path)
  - Verdict: **GO** to Phase 6 если Tasks 1-7 closed AND `make self-audit` green AND no curated content >1MB stop-rule
- **RCA section:** только если store >1MB OR drift v1 produces false-positive cascade
- **Open questions for orchestrator Phase 6 entry:** что отложено (LLM-driven research v2, behavioral drift v2, AIF aif-evolve reconciliation)

---

## Commit strategy

Atomic commits per Task:

```
1. feat(research):  Phase 5 Task 1 — types + ResearchPlan schema
2. feat(research):  Phase 5 Task 2 — curated store + semver-aware loader
3. feat(research):  Phase 5 Task 3 — source allowlist + provenance validator
4. feat(research):  Phase 5 Task 4 — diff-mode (pattern-keyed delta)
5. feat(research):  Phase 5 Task 5 — symbolic drift detection (closes §13.7 v1)
6. feat(research):  Phase 5 Task 6 — public API + CLI
7. ci(audit-self):  Phase 5 Task 7 — framework-self-research job + frozen snapshot
8. docs(phase-5):   retro + GO verdict
```

**Hard:** перед каждым commit — `make self-audit` green AND все Phase 4 detector тесты still green (no regression).

---

## Verification probes (orchestrator runs before retro GO)

```bash
# 1. Public API runs end-to-end on this repo
npx tsx packages/core/research/cli.ts $(pwd) | jq '.framework, .patterns | length'
# expect: framework value + non-zero patterns array

# 2. Curated store loadable for known patterns
npm --prefix packages/core test research/load.test.ts
# expect: green; ≥6 tests pass

# 3. Allowlist validation rejects bad URLs
npm --prefix packages/core test research/allowlist.test.ts
# expect: green; ≥5 tests pass

# 4. Diff mode returns expected delta on test versions
npm --prefix packages/core test research/diff.test.ts
# expect: green; ≥5 tests pass

# 5. Symbolic drift detection on own docs — green at HEAD
npx tsx packages/core/research/cli.ts --self | jq '.drift.mismatches | length'
# expect: 0 (no drift) OR surfaces real mismatches that should be addressed

# 6. CLI emits JSON to stdout for all 3 modes
npx tsx packages/core/research/cli.ts $(pwd) | jq -e .
npx tsx packages/core/research/cli.ts --self | jq -e .
# expect: both exit 0 with valid JSON

# 7. Self-research snapshot frozen
diff <(npx tsx packages/core/research/cli.ts $(pwd) | jq -S .) \
     <(jq -S . packages/core/research/expected-self-research.json)
# expect: no diff

# 8. CI YAML still valid
actionlint .github/workflows/audit-self.yml && zizmor --format plain .github/workflows/
# expect: exit 0 both

# 9. No regression
make self-audit                                  # principles 24/24
npm --prefix packages/core test                  # core 124+N (N = new research tests)
npm --prefix packages/preset-next-15-canonical test   # 38/38
npm --workspaces --if-present run typecheck      # 3 workspaces clean
```

---

## Hard constraints

- **NO LLM calls in v1.** Phase 5 is deterministic-curated. LLM-driven generation explicitly deferred to v2 (research §1, §6 watch-list).
- **NO new explicit deps в `packages/core/package.json`.** `semver` already transitive (Phase 4 verified). If TS/ESLint demands explicit — flag ESCALATE, не добавляй автоматически.
- **NO yargs/commander в `cli.ts`** — argv parsing через `process.argv`, ≤40 LOC (mirrors Phase 4 detector CLI). Если orchestrator считает что нужна liba — flag ESCALATE.
- **Planner-Executor module surface contract:** `index.ts` exports ONLY `research()` function + types. NO file-write helpers exposed. Internal `cli.ts` may write `expected-self-research.json` only via direct `fs.writeFileSync`, never через `index.ts` API.
- **Provenance allowlist enforced на load:** failed validation throws с clear error, no silent skip.
- **Curated store stop-rule:** if total size >1MB before Task 7 closes → entries too verbose, redesign before continuing.
- **Drift detection scope:** symbolic v1 only. Behavioral/embedding-based v2/v3 explicitly deferred (open-questions §13.7).
- **NO `git commit --no-verify`** — нарушает self-application invariant.
- **NO `git push`** — orchestrator decides push timing с пользователем.
- **Context7-only** для external library research (memory rule).
- **NO deletion `packages/core/detector/`** — Phase 4 SSOT preserved.
- **AIF coupling boundary:** Phase 5 reads detector output только; не пишет в `.ai-factory/skill-context/` (touchpoint 4 already shipped Phase 4). Projection L2 → skill-context = Phase 6/11 decision.

---

## Возврат результата

После Tasks 1-8:

1. **Created/modified files** — список с commit hashes
2. **Verification probes** — все 9 пройдены
3. **Reuse posture validated** — 1 strong reuse (skill-context output sink contract documented for Phase 6) + 2 transitive (`semver`, CLI pattern) measurable
4. **ResearchPlan sample** — JSON output на root репо как evidence dual-contract (framework/version + patterns + drift)
5. **Self-application score** target 8/10 per [EXECUTION-PLAN §6](EXECUTION-PLAN.md) (drift symbolic-v1 lands; snapshot point-in-time stable)
6. **Open questions для Phase 6 entry** — с привязкой к §5.5 Step 0 trigger
7. **Time spent** vs estimate (~6 hour orchestrator path baseline; >2x → RCA section)

---

## Версия

- **0.1.0** — 2026-05-08 — initial draft after Step 0 entry research GO verdict; embeds 6 capabilities + 5 build/1 reuse decisions + Planner-Executor module-surface contract + deterministic v1 pivot (no LLM) + symbolic drift v1
