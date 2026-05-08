# Phase 6 Implementation Prompt — Layer 3 Synthesizer Path A v1

> **Назначение:** self-contained prompt для orchestrator сессии. Реализовать Phase 6 (Layer 3 Synthesizer Path A v1, **deterministic-curated, no LLM**) согласно [phase-6-research.md](phase-6-research.md) — 8 capabilities, 5 build + 2 strong reuse + 1 transitive + 1 deferral.
> **Версия:** 0.1.0 — 2026-05-08
> **Triggered by:** [phase-6-research.md §5](phase-6-research.md) GO verdict; [retros/phase-5.md](retros/phase-5.md) GO to Phase 6.
> **Reordering note:** EXECUTION-PLAN §6 originally had Phase 7 = L3 + L5 combined. Phase 6 here = **L3 only**; L5 Installer pushed to Phase 7+ along with L4 Validator. Update of EXECUTION-PLAN §6 numbering consolidated in this Phase 6 retro (single coherent edit covering Phase 5/6/7 swap).

---

## Identity & Context

**Repo:** `/Users/art/code/rules-as-tests-aif`
**Base branch:** `chore/phase-5-research-agent` (Phase 5 commits in-flight; no separate Phase 6 branch — this PR will bundle Phase 5 + Phase 6 per session continuity)
**You are:** Opus orchestrator. Делаешь edits + commits сам. Phase 5 already closed in this session; continuing forward.

## Обязательное чтение перед стартом

1. [phase-6-research.md](phase-6-research.md) — 8-capability matrix + reuse decisions + scope
2. [retros/phase-5.md](retros/phase-5.md) — Phase 5 close, GO verdict, 7 open questions for Phase 6 entry
3. [architecture.md §2.5 + §3.1](architecture.md) — Layer 3 spec + Path A constraint (configuration only, no AST gen)
4. [self-application.md §2 row L3 + §7 row L3](self-application.md) — acceptance criteria for synthesizer
5. [packages/core/research/index.ts](../../packages/core/research/index.ts) — Phase 5 contract; ResearchPlan shape consumed by L3
6. [packages/core/manifest/rules-manifest.schema.json](../../packages/core/manifest/rules-manifest.schema.json) — RuleEntry sub-shape reused for SynthesizedRule
7. Memory feedback: `feedback_external_docs_via_context7.md` — context7-only constraint

---

## Architecture summary (из research §3, §4)

**Synthesizer Path A v1** = deterministic bridge over **curated recipes** + manifest schema reuse. Layers:

```
packages/core/synthesizer/                   ← NEW (Phase 6)
├── index.ts                                  ← public API: synthesize(plan: ResearchPlan) → SynthesisPlan
├── types.ts                                  ← SynthesizedRule, SynthesisPlan
├── synthesize.ts                              ← pure recipe lookup + composition
├── emit.ts                                    ← side-effect file writer (NOT in public API surface)
├── cli.ts                                     ← bin: <root> | --from-research <path> | --output <dir> | --pattern <id>
├── recipes/                                   ← curated mapping pattern → outputs
│   └── <patternId>.json                       ← 3 v1 recipes (Next 16 patterns)
├── fixtures/                                  ← test fixtures
│   └── next-16-fixture/                       ← detect → research → synth round-trip target
├── synthesis-plan.schema.json                 ← runtime validation
├── __snapshots__/
└── *.test.ts

packages/core/synthesizer/expected-self-synth.json   ← frozen own-repo output for CI
packages/core/synthesizer/expected-fixture-synth.json ← frozen fixture next-16 output for CI

.github/workflows/audit-self.yml             ← UPDATE: add framework-self-synth job
```

**Public API contract (Planner-Executor enforcement):**

```typescript
// packages/core/synthesizer/index.ts — Phase 6
export function synthesize(plan: ResearchPlan): SynthesisPlan
export type { SynthesisPlan, SynthesizedRule } from './types.ts'
// emit.ts is NOT exported via index — CLI imports it directly. L4 Validator (Phase 7+) consumes
// SynthesisPlan via the pure function only.
```

**SynthesizedRule shape** (reuses rules-manifest semantics):

```typescript
export interface SynthesizedRule {
  id: string                 // e.g. "G1" (generated rule prefix)
  title: string              // matches manifest entry title field
  stack: string[]            // matches manifest entry stack field
  'applies-to'?: string[]
  check: { type: 'eslint' | 'command' | 'script' | 'manual'; ... }
  examples: { bad: string; good: string }
  research: { entryId: string; provenance: Provenance[] }   // back-reference to L2
}
```

**Output schema sample:**

```json
{
  "framework": "next",
  "version": "16.0.0",
  "rules": [
    {
      "id": "G1",
      "title": "Server Actions return type discipline",
      "stack": ["react-next"],
      "applies-to": ["src/app/**/*.tsx", "src/app/**/*.ts"],
      "check": { "type": "eslint", "rule": "@next/no-server-imports-in-client" },
      "examples": { "bad": "...", "good": "..." },
      "research": { "entryId": "react-server-components", "provenance": [...] }
    }
  ],
  "rulesMd": "## G1 — Server Actions return type discipline\n...",
  "eslintConfigSnippet": "{\"rules\": {\"@next/no-server-imports-in-client\": \"error\"}}"
}
```

---

## Task breakdown

Phase 6 budget: **~6 hours orchestrator path** (single-session, mirrors Phase 4/5 compression). Tasks 1-7 sequential.

### Task 1 — Types + SynthesisPlan schema (~30 min)

**Артефакты:**
- `packages/core/synthesizer/types.ts`:
  ```typescript
  import type { Provenance } from '../research/types.ts'
  export interface SynthesizedRule {
    id: string
    title: string
    stack: string[]
    'applies-to'?: string[]
    check: ManifestCheck
    examples: { bad: string; good: string }
    research: { entryId: string; provenance: Provenance[] }
  }
  export interface SynthesisPlan {
    framework: string | null
    version: string | null
    rules: SynthesizedRule[]
    rulesMd: string                    // concatenated RULES.md fragment
    eslintConfigSnippet: string         // JSON-serialized ESLint flat config rule object
  }
  export type ManifestCheck =
    | { type: 'eslint'; rule: string }
    | { type: 'command'; command: string }
    | { type: 'script'; script: string }
    | { type: 'manual'; rationale?: string }
  ```
- `packages/core/synthesizer/synthesis-plan.schema.json` — JSON Schema mirroring TS types

**Verify:**
```bash
npm --prefix packages/core run typecheck
# expect: clean
```

### Task 2 — Curated recipes (3 for Next 16) (~1 hour)

**Артефакты:**
- `packages/core/synthesizer/recipes/nextjs-app-router.json`
- `packages/core/synthesizer/recipes/nextjs-pages-router.json`
- `packages/core/synthesizer/recipes/react-server-components.json`

Each recipe has shape:
```json
{
  "patternId": "nextjs-app-router",
  "appliesTo": ["next"],
  "rule": {
    "id": "G1",
    "title": "...",
    "stack": ["react-next"],
    "check": { "type": "eslint", "rule": "..." },
    "examples": { "bad": "...", "good": "..." }
  },
  "rulesMdTemplate": "## G1 — ...\n\n**Stack:** ...\n",
  "eslintRuleConfig": { "@next/no-server-imports-in-client": "error" }
}
```

**Hard constraint:** recipes hand-authored, NOT LLM-generated. Каждое правило references either (a) existing rule в `packages/preset-next-15-canonical/eslint-rules/` или (b) a real plugin rule from `@next/eslint-plugin-next` / `eslint-plugin-react-hooks` etc. Path A constraint: **only configuration of existing plugins**, no new AST.

**Verify:**
```bash
ls packages/core/synthesizer/recipes/*.json | wc -l
# expect: 3
# Each recipe references a real plugin rule (validated in Task 3 tests).
```

### Task 3 — Pure synthesize function + tests (~1.5 hour)

**Артефакты:**
- `packages/core/synthesizer/synthesize.ts`:
  ```typescript
  export function synthesize(plan: ResearchPlan): SynthesisPlan
  ```
  - For each ResearchEntry in plan.patterns, look up matching recipe by patternId
  - Compose SynthesisPlan: rules array + concatenated rulesMd + merged eslintConfigSnippet
  - Generate id sequentially (G1, G2, ...) for stable output
  - Validate result against synthesis-plan.schema.json (Ajv)
- `packages/core/synthesizer/synthesize.test.ts` — 6+ tests:
  - Empty ResearchPlan → empty SynthesisPlan (own-repo case)
  - 1 pattern → 1 rule
  - 3 patterns → 3 rules with sequential IDs
  - Pattern with no recipe → skip silently (matches Phase 5 load.ts behavior)
  - Stable order (sorted by entry.id input → same id sequence)
  - Cross-version: Next 15 ResearchPlan vs Next 16 ResearchPlan use same recipes (recipes are version-agnostic for v1)

**Verify:**
```bash
npm --prefix packages/core test synthesizer/synthesize.test.ts
# expect: green; ≥6 tests
```

### Task 4 — Emitter function + tests (~1 hour)

**Артефакты:**
- `packages/core/synthesizer/emit.ts`:
  ```typescript
  export function emit(plan: SynthesisPlan, outputDir: string): void
  ```
  - Writes 3 files to outputDir: `rules-manifest-additions.json`, `RULES-additions.md`, `eslint-rules-snippet.json`
  - Idempotent: same plan → same output bytes
  - Throws clearly if outputDir doesn't exist (no auto-mkdir; caller's responsibility)
- `packages/core/synthesizer/emit.test.ts` — 4+ tests:
  - Empty plan → 3 files written, empty bodies
  - Plan with rules → 3 files with content
  - Idempotence: emit twice → no diff
  - Missing outputDir → throws

**Hard constraint:** emit is **NOT** exported via `index.ts` — only via direct path import. CLI imports it; L4 Validator (Phase 7+) does not.

**Verify:**
```bash
npm --prefix packages/core test synthesizer/emit.test.ts
# expect: green; ≥4 tests
```

### Task 5 — Public API + CLI (~30 min)

**Артефакты:**
- `packages/core/synthesizer/index.ts`:
  ```typescript
  export { synthesize } from './synthesize.ts'
  export type { SynthesisPlan, SynthesizedRule, ManifestCheck } from './types.ts'
  // NO emit export. CLI imports emit.ts directly.
  ```
- `packages/core/synthesizer/cli.ts` (≤60 LOC) — modes:
  - `<projectRoot>` (default): detect → research → synth → JSON to stdout
  - `--from-research <path>`: load ResearchPlan from disk → synth → JSON
  - `--output <dir>`: also call emit to write files (combines with above modes)
  - `--pattern <id>`: filter SynthesisPlan.rules to entries with research.entryId === id
- `packages/core/package.json`:
  - Add `"./synthesizer"` to `exports`
  - Add bin `"rules-as-tests-synth": "./synthesizer/cli.ts"`
  - Add `"synth": "tsx synthesizer/cli.ts"` script

**Verify:**
```bash
npx tsx packages/core/synthesizer/cli.ts $(pwd) | jq '.rules | length'
# expect: 0 (own repo has no patterns)
```

### Task 6 — Self-application snapshot (round-trip) + fixture (~1 hour)

**Артефакты:**
- `packages/core/synthesizer/fixtures/next-16-fixture/package.json` — minimal Next 16 stack with patterns that trigger detector (e.g. has `next@16` in deps + `app/` directory marker)
- `packages/core/synthesizer/fixtures/next-16-fixture/app/page.tsx` — empty file just to trigger pattern detector
- `packages/core/synthesizer/expected-self-synth.json` — frozen own-repo SynthesisPlan output (will be empty rules)
- `packages/core/synthesizer/expected-fixture-synth.json` — frozen next-16 fixture output (will have ≥1 rule)
- `packages/core/synthesizer/snapshot.test.ts` — 2 tests:
  - Own repo: synth(research(detect(REPO_ROOT))) matches expected-self-synth.json
  - Next-16 fixture: synth(research(detect(FIXTURE))) matches expected-fixture-synth.json

**Verify:**
```bash
npm --prefix packages/core test synthesizer/snapshot.test.ts
# expect: green; 2 tests
diff <(npx tsx packages/core/synthesizer/cli.ts $(pwd) | jq -S .) \
     <(jq -S . packages/core/synthesizer/expected-self-synth.json)
# expect: no diff
```

**Self-application invariant L3 (a)** closed via round-trip snapshot stability. Invariant (b) canonical-regen ≤5% diff vs `packages/preset-next-15-canonical/` deferred to Phase 6 v2 / Phase 7 with documented split-point in retro.

### Task 7 — CI gate + Phase 6 retro (~45 min)

**Артефакты:**
- `.github/workflows/audit-self.yml` — new job `framework-self-synth` mirroring `framework-self-detect` + `framework-self-research` patterns:
  ```yaml
  framework-self-synth:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@<sha>
        with: { persist-credentials: false }
      - uses: actions/setup-node@<sha>
        with: { node-version: '20' }
      - run: npm install --silent
      - run: |
          ACTUAL=$(npm --prefix packages/core run synth --silent -- "$GITHUB_WORKSPACE")
          EXPECTED=$(cat packages/core/synthesizer/expected-self-synth.json)
          diff <(echo "$ACTUAL" | jq -S .) <(echo "$EXPECTED" | jq -S .)
  ```
- `docs/meta-factory/retros/phase-6.md` — composite retro:
  - Verification: 9 verification probes
  - Self-reflection: recipe authoring, fixture choices, canonical regen deferral rationale
  - Evaluation: target score 8/10
  - **Closing item: EXECUTION-PLAN §6 numbering swap** — single coherent edit covering Phase 5/6/7 reordering across all retros

---

## Commit strategy

```
1. feat(synthesizer):  Phase 6 Task 1 — types + SynthesisPlan JSON schema
2. feat(synthesizer):  Phase 6 Task 2 — curated recipes (3 Next 16 patterns)
3. feat(synthesizer):  Phase 6 Task 3 — pure synthesize function + tests
4. feat(synthesizer):  Phase 6 Task 4 — emitter function + tests
5. feat(synthesizer):  Phase 6 Task 5 — public API + CLI
6. feat(synthesizer):  Phase 6 Task 6 — self-app snapshot + fixture
7. ci(audit-self):     Phase 6 Task 7a — framework-self-synth job
8. docs(phase-6):      Phase 6 Task 7b — retro + GO verdict + EXECUTION-PLAN §6 swap
```

---

## Verification probes (orchestrator runs before retro GO)

```bash
# 1. Public API runs end-to-end
npx tsx packages/core/synthesizer/cli.ts $(pwd) | jq '.rules | length'
# expect: 0 (own repo)

# 2. Synthesize tests
npm --prefix packages/core test synthesizer/synthesize.test.ts
# expect: green; ≥6 tests

# 3. Emit tests
npm --prefix packages/core test synthesizer/emit.test.ts
# expect: green; ≥4 tests

# 4. Snapshot tests (own repo + next-16 fixture)
npm --prefix packages/core test synthesizer/snapshot.test.ts
# expect: green; 2 tests

# 5. CLI emitter mode produces 3 files
TMPDIR=$(mktemp -d)
npx tsx packages/core/synthesizer/cli.ts packages/core/synthesizer/fixtures/next-16-fixture --output "$TMPDIR"
ls "$TMPDIR" | sort
# expect: RULES-additions.md, eslint-rules-snippet.json, rules-manifest-additions.json

# 6. Self-synth snapshot frozen
diff <(npx tsx packages/core/synthesizer/cli.ts $(pwd) | jq -S .) \
     <(jq -S . packages/core/synthesizer/expected-self-synth.json)
# expect: no diff

# 7. Fixture-synth snapshot frozen
diff <(npx tsx packages/core/synthesizer/cli.ts packages/core/synthesizer/fixtures/next-16-fixture | jq -S .) \
     <(jq -S . packages/core/synthesizer/expected-fixture-synth.json)
# expect: no diff

# 8. CI YAML still valid
actionlint .github/workflows/audit-self.yml && zizmor --format plain .github/workflows/
# expect: exit 0 both

# 9. No regression
make self-audit                                        # principles 24/24
npm --prefix packages/core test                        # core 153 + N research-synth tests
npm --prefix packages/preset-next-15-canonical test    # 38/38
npm --workspaces --if-present run typecheck            # 3 workspaces clean
```

---

## Hard constraints

- **NO LLM calls in v1.** Same pivot as Phase 5. Curated recipes hand-authored.
- **NO new explicit deps** в `packages/core/package.json`. typescript-eslint, semver, Ajv all transitive.
- **NO yargs/commander в `cli.ts`** — argv parsing через `process.argv`, ≤60 LOC.
- **Path A constraint:** recipes only configure existing plugins. No `@typescript-eslint/utils` AST authoring in this phase. If a pattern would require new AST logic — flag ESCALATE, defer to Phase 9+ Path B.
- **Planner-Executor module surface:** `index.ts` exports ONLY `synthesize` + types. `emit.ts` is direct-path-imported by CLI; not exposed via public API.
- **SynthesizedRule schema reuse:** generated rule entries MUST validate against `rules-manifest.schema.json#/definitions/RuleEntry` semantics. Drift between SynthesizedRule and ManifestRule = bug, not feature.
- **Recipe count cap:** ≤3 recipes for v1 (one per Next 16 pattern with Phase 5 ResearchEntry). >10 recipes before Phase 6 closes = stop-rule, redesign.
- **Canonical regen ≤5% diff target deferred** with documented split-point in retro.
- **NO `git commit --no-verify`** — нарушает self-application invariant.
- **NO `git push`** — orchestrator decides push timing с пользователем.
- **Context7-only** для external library research.
- **NO deletion** `packages/core/{detector,research}/` — Phase 4/5 SSOT preserved.

---

## Возврат результата

После Tasks 1-7:

1. **Created/modified files** — список с commit hashes
2. **Verification probes** — все 9 пройдены
3. **Reuse posture validated** — manifest schema reuse measurable (SynthesizedRule entries pass rules-manifest.schema validation)
4. **SynthesisPlan sample** — JSON output for fixture next-16 stack, evidence of pipeline end-to-end
5. **Self-application score** target 8/10 (round-trip stable; canonical regen deferred)
6. **EXECUTION-PLAN §6 numbering swap** — closing edit covering Phase 5/6/7 reordering
7. **Open questions for Phase 7 entry** — L4 Validator + L5 Installer scope decisions

---

## Версия

- **0.1.0** — 2026-05-08 — initial draft after Step 0 entry research GO verdict; embeds 8 capabilities + 5 build/2 strong reuse decisions + Planner-Executor module-surface contract + deterministic v1 pivot (no LLM, mirroring Phase 5) + canonical-regen deferral
