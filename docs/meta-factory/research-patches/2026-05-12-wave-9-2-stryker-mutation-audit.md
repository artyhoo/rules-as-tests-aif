<!-- scope:wave-9.2 -->
# Wave 9.2 Stryker mutation audit — TypeScript ESLint rule tests

> **Authoritative for:** Wave 9.2 mutation testing findings (2026-05-12 snapshot).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).

## Run metadata

- Stryker version: 9.6.1 (`@stryker-mutator/core` + `@stryker-mutator/vitest-runner`)
- Target: `packages/core/eslint-rules/**/*.ts` (excluding `*.test.ts`, `index.ts`)
- Test suite: vitest v4.x, `packages/core/vitest.config.ts`, includes `eslint-rules/**/*.test.ts`
- Date: 2026-05-12
- Mutation score: **70.94%** (total) — 70.69% / 56.52% / 73.77% per file
- SSOT: [prior-art-evaluations.md#39](../prior-art-evaluations.md)

## Surviving mutants by category

### Category A — Metadata / documentation strings (≈25 mutants)

Pattern: rule `name`, `meta.type`, `meta.docs.description`, error `messages.*`, `createRule()` URL callback, `defaultOptions: []` → `["Stryker was here"]`.

**Why survived:** `@typescript-eslint/rule-tester` `RuleTester` validates that an error is *reported* and checks the `messageId` key — but does NOT assert on the actual message string, rule name string, docs description, or documentation URL. Mutating any of these strings to `""` / `undefined` leaves all `RuleTester` assertions green.

**Files affected:** all three (`no-direct-time-randomness.ts`, `no-unsafe-zod-parse.ts`, `require-otel-span.ts`).

**I-phase follow-up:** These survivors are structural — they reveal that metadata is untested by design in `RuleTester`-based tests. No action required unless the project ships the rule names/messages to consumers who verify them. If consumer tests do assert on message text, the follow-up is to add one `assertMessage` test per rule. **Low priority** — metadata gaps do not affect rule correctness.

### Category B — Logic guard conditions in `require-otel-span.ts` (≈14 mutants)

| # | File | Line | Mutant | Why survived |
|---|------|------|--------|--------------|
| 1 | `require-otel-span.ts` | 14 | `if (!body) return false` → `if (false) return false` | No test exercises a code path where function body is `null`/`undefined` (non-BlockStatement body). All test cases use block-body functions. |
| 2 | `require-otel-span.ts` | 26 | `node.callee.property.type === AST_NODE_TYPES.Identifier` → `true` | Tests only pass callee shapes that already satisfy this — mutant still reports correctly because `startActiveSpan` case still triggers. |
| 3 | `require-otel-span.ts` | 27 | `node.callee.property.name === 'startActiveSpan'` → `true` | Same as #2 — no test has a `tracer.someOtherMethod(...)` that should NOT trigger span detection. |
| 4 | `require-otel-span.ts` | 34 | `node.callee.type === AST_NODE_TYPES.Identifier` → `true` | No test case has a callee expression that is NOT a plain Identifier (e.g. `obj.withSpan(...)`) in the `withSpan` branch. |
| 5 | `require-otel-span.ts` | 47 (×5) | `child && typeof child === 'object' && 'type' in child` → various relaxations | AST node traversal guard in `functionHasSpan`; tests don't probe edge cases where AST children are null/non-object. |
| 6 | `require-otel-span.ts` | 51 | `'type' in value` → `true` | Same traversal path; no test case exercises the `else-if` branch with a value that lacks `type`. |
| 7 | `require-otel-span.ts` | 87 | `node.body.type === AST_NODE_TYPES.BlockStatement ? node.body : undefined` → always return `node.body` | No test uses arrow function with expression body (non-block). `export const f = async () => expr` without braces. |
| 8 | `require-otel-span.ts` | 101 | `if (!node.id) return` → `if (false) return` | No test has an anonymous `export function()` (which would have `node.id === null`). |
| 9 | `require-otel-span.ts` | 109–114 (×4) | `VariableDeclarator` guard conditions → relaxations | Tests only exercise cases that pass all conditions; no case where `node.id.type` is not `Identifier`, or where `node.init` is null. |

**I-phase follow-up (Medium priority):** Add test cases for:

- Arrow function with expression body: `export const f = async () => ({ ok: true })` (no braces) — should be flagged as missing span.
- `tracer.someOtherMethod(...)` — should NOT be detected as a valid span call.
- `obj.withSpan(...)` (MemberExpression callee for `withSpan`) — depends on rule intent; clarify and add test.

### Category C — `FORBIDDEN_MODULES` set string entries (3 mutants)

`no-direct-time-randomness.ts` lines 11, 13, 15: individual set members `'http'`, `'node:fs'`, `'node:https'` mutated to `""`.

**Why survived:** Tests verify that `import { readFileSync } from 'fs'` is caught and `import http from 'node:http'` is caught — but not all module strings independently. If `'node:fs'` is removed from the set, the `'node:http'` test still passes.

**I-phase follow-up (Low priority):** Add one test per FORBIDDEN_MODULE entry: `import x from 'http'`, `import x from 'node:fs'`, `import x from 'node:https'` should each independently trigger the rule.

### Category D — `no-direct-time-randomness.ts` line 64 guard (1 mutant)

`typeof node.source.value !== 'string'` → `false` (always proceeds without guard).

**Why survived:** All test ImportDeclarations have string-literal source values. No test exercises the case where `node.source.value` is a template literal or non-string (which the TypeScript AST does allow for dynamic imports).

**I-phase follow-up:** Low priority — the guard is defensive programming; a non-string source value is uncommon in practice.

### Category E — `no-unsafe-zod-parse.ts` metadata + structural (9 mutants)

Overlap of Category A (metadata strings) and one structural survivor: `createRule({})` replacing the full rule — same root cause as Category A.

## Killed mutants summary

| File | Killed | Total | Score |
|------|--------|-------|-------|
| `no-direct-time-randomness.ts` | 41 | 58 | 70.69% |
| `no-unsafe-zod-parse.ts` | 13 | 23 | 56.52% |
| `require-otel-span.ts` | 86 | 122 | 73.77% |
| **All files** | **140** | **203** | **70.94%** |

NoCoverage (5) and Timeout (4) not included in survived count.

## Actionable findings → I-phase follow-up (prioritised)

1. **Medium** — `require-otel-span.ts`: add test for expression-body arrow function (`async () => expr`); add test for `tracer.nonSpanMethod()`; add test for `obj.withSpan()` (MemberExpression variant). These are real logic gaps that could miss invalid code.
2. **Low** — `no-direct-time-randomness.ts`: add one test per FORBIDDEN_MODULE string (`'http'`, `'node:fs'`, `'node:https'`) to kill set-member mutations independently.
3. **Skip** — metadata string survivors (Category A, ≈25 mutants): `RuleTester` cannot assert on message text without custom assertions; fixing requires adding `output`/message assertions outside the standard tester API. Project does not ship consumer-facing message contracts. Accept as known gap.

## SSOT entry

SSOT #39 added in same commit: [prior-art-evaluations.md#39](../prior-art-evaluations.md) — StrykerJS, Verdict: ADOPT.

## Decisions log

- **Where Stryker was installed:** `packages/core/` — vitest config lives there; eslint-rule tests run from that workspace. Installing in root would require cross-workspace runner config without benefit.
- **Mutate target:** `eslint-rules/**/*.ts` (excluding `*.test.ts` and `index.ts`) — these are the only TypeScript source modules with real conditional logic. Principle tests (principles/) are meta-tests on project structure with no mutable business logic (they scan files and assert on metadata), so mutating them would produce trivially surviving mutants with no action value. `eslint-rules/` has 235 lines of non-trivial rule logic across 3 files.
- **Why score is 70.94% and not 100%:** Expected. ESLint `RuleTester` tests are structurally complete (valid/invalid pairs) but narrow in AST-path coverage. Metadata strings (Category A) are structurally untestable via the standard RuleTester API. Logic gaps (Category B) represent genuine missing test cases for edge AST shapes.
- **Two commits vs one:** Single commit — install + config + SSOT + research-patch is ≤50 lines across new files; research-patch is 95 lines (below the threshold for mandatory split). Commit body carries `Prior-art:` trailer covering all artifacts.
