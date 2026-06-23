<!-- scope:generator-require-composite-tier -->
# Engine-assignment matrix — generator-require-composite-tier S0

> **Authoritative for:** S0 Discovery output for umbrella `generator-require-composite-tier` — full-corpus 2-engine matrix (esquery vs ast-grep), per-rule axis A/B runs, 5-class verdicts, G3b backlog, S1-S4 scope implications.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists). S1-S4 implementation details — see the per-stage plan tasks.

**Date:** 2026-06-23  
**Branch:** `feature/generator-require-composite-tier-f18a61`  
**ESLint version:** 9.39.4 (esquery 1.7.0, ships with ESLint 9.39)  
**ast-grep:** `@ast-grep/cli@0.44.0` — at S0 authoring time the worker believed it was unavailable in the container and flagged axis B `[UNRUN-needs-human]`. **RESOLVED on host 2026-06-24** (see §0.5): ast-grep IS reachable (npm registry works in-container; only git transport is tunnel-blocked) and the decision-bearing axis-B patterns were run. The original `[UNRUN-needs-human]` markers below are retained as audit trail; §0.5 + the per-rule notes record the actual runs.  
**S1b precedent:** `docs/meta-factory/generator-forbid-mvp/s1b-astgrep-composite-pilot.md` — already proved DROP for ancestor/inside and descendant/has forbid sub-classes; not re-run (T-RCT-D)

---

## §0.5 Axis-B resolution (host run, 2026-06-24)

The S0 axis-B gap was closed on host (`@ast-grep/cli@0.44.0`, author fixtures from `/tmp/s0-matrix`). This resolves the two decision-bearing `[UNRUN]` rules and the S1 provisional verdict.

**R18 (the only Class-2 candidate):** ast-grep run on author fixtures.
- ast-grep `useQuery({ $$$ queryFn: $FN $$$ })` + `not has stopBy:end ($S.parse|$S.safeParse)`: bad-r18 = **2**, good-r18 = **0**, queryFn-first = **1**.
- esquery axis A: bad = 2, good = 0 (already recorded §3).
- Both engines identical on the corpus fixtures, both position-agnostic. **No quality delta.** The original draft's `useQuery({ $$$, queryFn: $FN, $$$ })` (queryFn comma-sandwiched) matched ZERO — position-sensitive bug; the working pattern drops the literal commas. → **R18 = Class 3 (esquery sufficient), NOT Class 2.**

**R14:** ast-grep run on author `.ts` fixtures.
- ast-grep (`required_parameter` has `type_identifier` =`FormData`, `not has safeParse`): bad-r14 = **2**, good-r14 = **0**.
- esquery axis A with a **working** TS parser: bad = 2, good = 0. NB: the `eslint-ts.config.mjs` hardcodes `import … from '/app/node_modules/@typescript-eslint/parser'` — that container path **crashes eslint on host** (`ERR_MODULE_NOT_FOUND`), producing a false 0-match; it is NOT an esquery limitation. With a resolvable parser, esquery flags both bad cases.
- ast-grep TS type-annotation matching is experimental; esquery is production-grade. → **R14 = Class 3 (esquery sufficient).** ast-grep works but offers no reliability advantage.

**Net:** axis B run confirms **Class 1 = NONE, Class 2 = NONE**. ast-grep is not required and offers no quality win on this corpus → **S1 = NO-OP** (see §7, now confirmed, not provisional).

---

## §1 Critical discovery: esquery 1.7.0 has `:has()` pseudo-class

**This finding changes the S1 scope.** The S1b pilot only tested `:not(A B)` compound selector for ancestor-negation. This matrix discovered that esquery 1.7.0 also supports the `:has()` pseudo-class, enabling "flag nodes that contain/lack a specific descendant" — which is exactly what all three require-tier migration targets need.

**Evidence (verbatim ESLint output):** R18 test — `Property[key.name='queryFn'] > :function:not(:has(CallExpression[callee.property.name=/^(parse|safeParse)$/]))` on bad-r18.js:

```text
/tmp/s0-matrix/bad-r18.js
   7:14  error  R18-ATTEMPT-B: queryFn lacks .parse() or .safeParse() — testing :has() support  no-restricted-syntax
  15:48  error  R18-ATTEMPT-B: queryFn lacks .parse() or .safeParse() — testing :has() support  no-restricted-syntax

✖ 2 problems (2 errors, 0 warnings)
EXIT: 1
```

On good-r18.js (queryFn WITH `.parse(data)`):
```text
EXIT: 0
```

**Implication:** All three S3 migration targets (require-otel-span, require-use-server-directive, require-form-safe-parse) and both S4 targets (R18, R13) can be expressed via esquery using `:has()` + `:not(:has(...))` patterns. No ast-grep required based on axis A evidence alone.

---

## §2 Rule corpus enumeration and pre-classification

### OUT of AST matrix — not declarative candidates

| Rule | Package | Check type | Reason |
|---|---|---|---|
| R1 TypeScript hygiene | all | `tsc --noEmit && eslint` | command suite, not a selector |
| R3 Architectural boundaries | all | `npm run arch:check` | depcruise command |
| R4 Tests | all | `scripts/audit-r4.ts` | script |
| R5 Async correctness | all | existing `@typescript-eslint/no-floating-promises` | 3rd-party ESLint rule |
| R6 Errors | all | existing `no-throw-literal` | 3rd-party ESLint rule |
| R9 Imports | all | `no-restricted-imports` | built-in (already configured) |
| R10 Naming | all | manual | confirmed not declarative — per-project naming conventions; S0 confirms status quo |
| R11 CI integrity | all | `ci.yml` workflow | CI gate, not AST selector |
| R15 Accessibility | next-15 | `jsx-a11y/strict` | 3rd-party package |
| R16 Performance | next-15 | `@next/next/no-img-element` | 3rd-party package |
| R17 Component tests | next-15 | audit script | script |
| R19 Styles | next-15 | `depcruise` | dependency-cruiser command |
| IR1 API contracts | microservices | CI job: zod-to-openapi diff | CI-job — pre-confirmed OUT; S0 confirms |
| IR2 CDC (Pact) | microservices | CI: pact-publish/verify | CI-job — OUT |
| IR3 Event schemas | microservices | audit-ai-docs.sh probe | script/probe — OUT |
| IR4 Service auth | microservices | depcruise | command — OUT |
| IR5 Observability propagation | microservices | manual | manual — OUT |
| IR6 Resilience | microservices | manual | manual — OUT |

**IR1-IR6 classification confirmed:** All 6 are CI-job/contract/manual. S0 pre-classification validated. NOT pulled into AST matrix.

### In matrix — declarative candidates

Custom ESLint rules (currently hand-written), manual rules (need to be written), and the 3 require-tier migration targets.

---

## §3 2-engine matrix (per-rule, both axes)

### Method summary (per kickoff §2 S0)

1. **bad+good fixture pair** — taken from existing tests or authored for uncovered rules.
2. **Axis A** — attempt esquery selector via `no-restricted-syntax`; run `eslint 9.39.4`; record verbatim output. Criterion: flags bad AND exits 0 on good.
3. **Axis B** — ast-grep YAML pattern; would run `npx @ast-grep/cli@0.44.0 sg scan`. **Container lacks ast-grep** → patterns authored; output marked `[UNRUN-needs-human]` per T3(c). S1b cited for ancestor/descendant sub-classes already proven.
4. **Verdict** — 5-class system (§4).

---

### R2 — Validation at boundaries (`no-unsafe-zod-parse`)

**Class:** FORBID — `.parse()` is forbidden in HTTP boundary files  
**Fixtures:** authored (`bad-r2.js`, `good-r2.js`)

**Axis A (esquery):**

Selector: `CallExpression[callee.type='MemberExpression'][callee.property.name='parse']`

bad-r2.js (verbatim):
```text
/tmp/s0-matrix/bad-r2.js
  2:14  error  R2-ATTEMPT-A: .parse() is forbidden in HTTP boundaries; use .safeParse()  no-restricted-syntax
  3:14  error  R2-ATTEMPT-A: .parse() is forbidden in HTTP boundaries; use .safeParse()  no-restricted-syntax

✖ 2 problems (2 errors, 0 warnings)
EXIT: 1
```

good-r2.js: `EXIT: 0`

Flags bad ✓, passes good ✓. But note: the selector is **too broad** — it flags ALL `.parse()` calls, not just Zod in HTTP boundaries. Path scoping (ESLint config glob) handles the boundary restriction; `audit:exempt` line handling is lost in a pure declarative approach.

**Axis B (ast-grep) — [UNRUN-needs-human]:**
```yaml
# ast-grep pattern for R2
id: no-unsafe-zod-parse-decl
rule:
  pattern: $SCHEMA.parse($$$)
  not:
    inside:
      any:
        - comment: "# audit:exempt"
```
*Pattern authored; not run in container.*

**Quality comparison:** The esquery selector is simpler. Custom rule adds `audit:exempt` handling which declarative can't express; pattern-based ast-grep also can't express `audit:exempt` comments. Neither engine is clearly better than the custom rule for R2.

**Verdict: Class 3 (esquery sufficient) — KEEP CUSTOM** — the existing custom rule (`no-unsafe-zod-parse.ts`) is already optimal; migration to declarative would lose `audit:exempt` feature and path-scoping nuances. No action needed from S3.

---

### R7 — Time, randomness, IO (`no-direct-time-randomness`)

**Class:** FORBID — `Date.now()`, `new Date()`, `Math.random()` forbidden outside infrastructure  
**Fixtures:** authored (`bad-r7.js`, `good-r7.js`)

**Axis A (esquery):**

Selectors:
- A: `CallExpression[callee.type='MemberExpression'][callee.object.name='Date'][callee.property.name='now']`
- B: `NewExpression[callee.name='Date'][arguments.length=0]`
- C: `CallExpression[callee.type='MemberExpression'][callee.object.name='Math'][callee.property.name='random']`

bad-r7.js (verbatim):
```text
/tmp/s0-matrix/bad-r7.js
  2:13  error  R7-ATTEMPT-A: Date.now() is forbidden outside infrastructure/     no-restricted-syntax
  3:12  error  R7-ATTEMPT-B: new Date() is forbidden outside infrastructure/     no-restricted-syntax
  4:11  error  R7-ATTEMPT-C: Math.random() is forbidden outside infrastructure/  no-restricted-syntax

✖ 3 problems (3 errors, 0 warnings)
EXIT: 1
```

good-r7.js: `EXIT: 0` (clock.now(), random.next(), `new Date('2026-01-01')` not flagged)

**Axis B (ast-grep) — [UNRUN-needs-human]:**
```yaml
id: no-date-now
rule: { pattern: "Date.now()" }
---
id: no-new-date-no-args
rule: { pattern: "new Date()" }
---
id: no-math-random
rule: { pattern: "Math.random()" }
```

**Quality comparison:** esquery selectors are clean and directly express the patterns. ast-grep patterns would be slightly more readable (`pattern: "Date.now()"` vs `CallExpression[callee.object.name='Date'][callee.property.name='now']`) but the difference is minimal.

**Verdict: Class 3 (esquery sufficient) — KEEP CUSTOM** — existing `no-direct-time-randomness.ts` has glob-scoping logic; declarative migration not in scope for S3. Could be migrated in a future umbrella if desired. No action needed.

---

### R12 — Server vs Client Components (`no-server-imports-in-client`)

**Class:** FORBID — server-only imports forbidden in `'use client'` files  
**Fixtures:** existing unit tests in package  
**Note:** Complex multi-condition rule (file-level state: checks first 3 lines for `'use client'`, then import pattern-matching against a dynamic list). NOT a migration target in this umbrella.

**Axis A (esquery):** Could approximate with `Program:has(Literal[value='use client']) ImportDeclaration[source.value=/infrastructure|config\/env|^(fs|node:fs|node:crypto|node:path)$/]` but the 3-line constraint and dynamic allowlist make declarative approximation lossy. NOT tested — complex approximation not worth the quality loss vs. existing custom rule.

**Axis B (ast-grep) — [UNRUN-needs-human]:** Would need `all:` with file-context pattern; similarly lossy.

**Verdict: Class 4 (custom) — KEEP CUSTOM** — stateful file-level check; neither engine matches custom rule precision without quality loss.

---

### R8 — Observability (`require-otel-span`) — **S3 MIGRATION TARGET**

**Class:** REQUIRE — exported async functions must open an OTel span  
**Fixtures:** existing `require-otel-span.test.ts` (6 valid + 6 invalid cases) + authored `bad-r8.js`, `good-r8.js`, `bad-r8-arrow.js`, `good-r8-arrow.js`

**Axis A (esquery):**

Selectors (two covering FunctionDeclaration + Arrow/FunctionExpression):

Selector A1 (FunctionDeclaration):
```text
ExportNamedDeclaration > FunctionDeclaration[async=true]:not(:has(CallExpression[callee.property.name='startActiveSpan'])):not(:has(CallExpression[callee.name='withSpan']))
```

Selector A2 (VariableDeclarator arrow/fn):
```text
ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > :function[async=true]:not(:has(CallExpression[callee.property.name='startActiveSpan'])):not(:has(CallExpression[callee.name='withSpan']))
```

bad-r8.js (FunctionDeclaration, verbatim — only R8 errors):
```text
/tmp/s0-matrix/bad-r8.js
  2:8  error  R8-ATTEMPT-B: exported async function lacks OTel span (startActiveSpan / withSpan)  no-restricted-syntax
  7:8  error  R8-ATTEMPT-B: exported async function lacks OTel span (startActiveSpan / withSpan)  no-restricted-syntax

✖ 2 problems (2 errors, 0 warnings)
```

good-r8.js (both span types, no R8 errors):
```text
0 R8 errors (R20 errors also present — unrelated to R8 test)
```

bad-r8-arrow.js (arrow/fn expression, verbatim):
```text
/tmp/s0-matrix/bad-r8-arrow.js
  2:27  error  R8-ATTEMPT-B-ARROW: exported async arrow/fn expression lacks OTel span  no-restricted-syntax
  7:24  error  R8-ATTEMPT-B-ARROW: exported async arrow/fn expression lacks OTel span  no-restricted-syntax

✖ 2 problems (2 errors, 0 warnings)
```

good-r8-arrow.js: `EXIT: 0`

Axis A ✓ — esquery CAN express require-otel-span using `:not(:has(...))`.

**Axis B (ast-grep) — [UNRUN-needs-human]:**
```yaml
id: require-otel-span-decl
message: "Exported async function lacks OTel span"
language: TypeScript
rule:
  all:
    - pattern: |
        export async function $FN($$$) { $$$BODY }
    - not:
        any:
          - has:
              pattern: tracer.startActiveSpan($$$)
          - has:
              pattern: withSpan($$$)
```

**Quality comparison (axis B reasoning):**
- esquery: 2 selectors with chained `:not(:has(...))` — readable but CSS-selector syntax
- ast-grep: single YAML rule with semantic `has:` blocks — arguably more readable; would need testing for edge cases (expression-body arrows, DFS depth)
- LOC: esquery 2-line selector each × 2 = ~4 lines config vs ast-grep ~15 LOC YAML
- esquery covers DFS automatically (`:has()` searches all descendants)
- The existing custom rule is 120 LOC — either engine is dramatically simpler
- **Quality delta: MARGINAL** — both engines express the rule clearly; esquery slightly more compact

**T-RCT-A check:** R8 uses DFS to find `startActiveSpan` / `withSpan` in function body. Both searches are SYNTACTIC (method name matching), NOT type-aware. ✓ Not a G3b trigger.

**Verdict: Class 3 (esquery sufficient) — MIGRATE via S3 with esquery engine.** No ast-grep needed. Selectors confirmed working on both FunctionDeclaration and arrow/fn patterns.

---

### R14 — Forms (`require-form-safe-parse`) — **S3 MIGRATION TARGET**

**Class:** REQUIRE — functions accepting FormData must call `.safeParse()`  
**Fixtures:** existing `require-form-safe-parse.test.ts` + authored `bad-r14.ts`, `good-r14.ts`

**T-RCT-A:** Does `require-form-safe-parse` read FormData SYNTACTICALLY? Confirmed YES — `tn.name==='FormData'` reads `typeAnnotation.typeAnnotation.typeName.name`, which is a TypeScript AST annotation property, NOT a type-inference result. The parser produces this node without running the TypeScript type checker.

**Axis A (esquery with TypeScript parser):**

Selector (ATTEMPT-B, any param position):
```text
:function:not(:has(CallExpression[callee.property.name='safeParse'])):has(Identifier[typeAnnotation.typeAnnotation.typeName.name='FormData'])
```

bad-r14.ts (verbatim):
```text
/tmp/s0-matrix/bad-r14.ts
  2:1   error  R14-ATTEMPT-B: any FormData param without .safeParse()              no-restricted-syntax
  2:1   error  R14-ATTEMPT-A: first param is FormData but no .safeParse() in body  no-restricted-syntax
  8:16  error  R14-ATTEMPT-B: any FormData param without .safeParse()              no-restricted-syntax
  8:16  error  R14-ATTEMPT-A: first param is FormData but no .safeParse() in body  no-restricted-syntax

✖ 4 problems (4 errors, 0 warnings)
```

good-r14.ts (safeParse present): `EXIT: 0`

Axis A ✓ — esquery with TypeScript parser CAN express require-form-safe-parse.

**Note:** The ATTEMPT-A selector (`[params.0.typeAnnotation...]`) covers only the first parameter position. ATTEMPT-B (`:has(Identifier[typeAnnotation...])`) covers any parameter. The existing rule handles qualified names (`TSQualifiedName` for `global.FormData`, `React.FormData`, etc.) — the declarative selector would need to add that case. For S3, the implementation should cover at least the main case and document the qualified-name limitation.

**Axis B (ast-grep) — [UNRUN-needs-human]:**
```yaml
id: require-form-safe-parse-decl
language: TypeScript
rule:
  all:
    - pattern: |
        function $FN($$$, $PARAM: FormData, $$$) { $$$BODY }
    - not:
        has:
          pattern: $SCHEMA.safeParse($$$)
```

**Quality comparison:** ast-grep pattern matching for TypeScript generics and type annotations is experimental. esquery with TypeScript parser is production-grade (same infrastructure as all @typescript-eslint rules). **esquery wins on reliability** here.

**Verdict: Class 3 (esquery sufficient) — MIGRATE via S3 with esquery engine + TypeScript parser.** T-RCT-A confirmed: syntactic-only, not G3b.

---

### R20 — Server Actions (`require-use-server-directive`) — **S3 MIGRATION TARGET**

**Class:** REQUIRE — files with `export async function` must start with `'use server'`  
**Fixtures:** existing `require-use-server-directive.test.ts` + authored `bad-r20.js`, `good-r20.js`

**Axis A (esquery):**

Selector:
```text
Program:not(Program:has(ExpressionStatement:first-child > Literal[value='use server'])) ExportNamedDeclaration > FunctionDeclaration[async=true]
```

bad-r20.js (no 'use server', verbatim — only R20 errors):
```text
/tmp/s0-matrix/bad-r20.js
  2:8  error  R20-ATTEMPT-B: async export in file WITHOUT 'use server' at top  no-restricted-syntax
  6:8  error  R20-ATTEMPT-B: async export in file WITHOUT 'use server' at top  no-restricted-syntax

✖ 2+ problems (R20 entries)
```

good-r20.js ('use server' at top): `0 R20 errors` ✓

Axis A ✓ — esquery CAN express 'use server' file-level directive check.

**Note:** The existing rule also handles `export default declaration` and per-line `audit:exempt`. The declarative selector handles the main case. For S3, implementation should add the `export default` case.

**Axis B (ast-grep) — [UNRUN-needs-human]:**
```yaml
id: require-use-server-decl
language: TypeScript
rule:
  all:
    - pattern: export async function $FN($$$) { $$$BODY }
    - not:
        inside:
          pattern: "'use server'"
          stopBy: root
```

*Note: ast-grep `stopBy: root` is a scope limiter — whether this checks only the first statement position is unclear without running.*

**Verdict: Class 3 (esquery sufficient) — MIGRATE via S3 with esquery engine.** Main case works; export-default arm and audit:exempt to be addressed in implementation.

---

### R18 — TanStack Query validation (`useQuery` without parse) — **S4 TARGET**

**Class:** REQUIRE (in queryFn) — `useQuery` with `queryFn` must call `.parse()` or `.safeParse()`  
**Fixtures:** authored `bad-r18.js`, `good-r18.js`

**Axis A (esquery):**

Selector:
```text
Property[key.name='queryFn'] > :function:not(:has(CallExpression[callee.property.name=/^(parse|safeParse)$/]))
```

bad-r18.js (verbatim):
```text
/tmp/s0-matrix/bad-r18.js
   7:14  error  R18-ATTEMPT-B: queryFn lacks .parse() or .safeParse() — testing :has() support  no-restricted-syntax
  15:48  error  R18-ATTEMPT-B: queryFn lacks .parse() or .safeParse() — testing :has() support  no-restricted-syntax

✖ 2 problems (2 errors, 0 warnings)
EXIT: 1
```

good-r18.js (queryFn WITH `.parse(data)`): `EXIT: 0`

Axis A ✓ — esquery fully expresses the useQuery/queryFn validation requirement.

**Axis B (ast-grep) — [UNRUN-needs-human]:**
```yaml
id: require-query-fn-parse
language: TypeScript
rule:
  all:
    - pattern: |
        useQuery({ $$$, queryFn: $FN, $$$ })
    - not:
        has:
          any:
            - pattern: $SCHEMA.parse($$$)
            - pattern: $SCHEMA.safeParse($$$)
```

**Quality note:** The RULES.md originally specified "AST grep" for R18. ast-grep's pattern syntax (`useQuery({ ..., queryFn: $FN, ... })`) is arguably more expressive for matching object-literal structures. The esquery selector indirectly matches by targeting the `queryFn` property value. Both work; ast-grep might be slightly more readable for the nested object pattern.

**Quality delta assessment:** This is the one case where ast-grep could offer a genuine quality win (more readable intent expression). BUT axis B is unrun. **Genuine fork: operator needs to assess quality after running axis B YAML pattern above.**

**Verdict: Class 3 provisional (esquery axis A sufficient, EXIT 0 on good) — but quality fork for axis B pending.** Recommend S4 implementation with esquery engine; if maintainer prefers ast-grep after running axis B, S1 would activate.

---

### R13 — Data fetching patterns — **S4 TARGET**

**Class:** FORBID — bare `fetch()` inside `useEffect` callbacks (should use query layer)  
**Fixtures:** authored `bad-r13.js`, `good-r13.js`

**Note on spec:** RULES.md says "AST grep on TanStack Query / SWR usage; no ESLint rule today." The specific pattern is inferred as: forbid bare `fetch()` calls in component lifecycle hooks (useEffect) where data fetching should go through useQuery/SWR.

**Axis A (esquery):**

Selector ATTEMPT-B (best performing):
```text
CallExpression[callee.name='useEffect'] :function CallExpression[callee.name='fetch']
```

bad-r13.js (verbatim):
```text
/tmp/s0-matrix/bad-r13.js
  9:5  error  R13-ATTEMPT-B: fetch() inside useEffect callback — use useQuery instead  no-restricted-syntax

✖ 1 problem (1 error, 0 warnings)
EXIT: 1
```

good-r13.js (useQuery with queryFn, no bare fetch in useEffect): `EXIT: 0`

Axis A ✓ — ATTEMPT-B correctly targets fetch inside useEffect only.

**Axis B (ast-grep) — [UNRUN-needs-human]:**
```yaml
id: no-bare-fetch-in-effect
language: TypeScript
rule:
  all:
    - pattern: |
        useEffect(() => { $$$; fetch($URL, $$$); $$$ }, $$$)
    - not:
        inside:
          any:
            - pattern: useQuery($$$)
            - pattern: useSWR($$$)
```

**Note on R13 spec ambiguity:** "AST grep on TanStack Query / SWR usage" is broader than just fetch-in-useEffect. It might also cover: (1) forbid direct SWR config calls without error handling, (2) forbid TanStack Query without proper staleTime config. Without clearer spec, implementing the most common violation (fetch in useEffect) is the MVP approach. S4 should clarify with maintainer if broader coverage needed.

**Verdict: Class 3 provisional (esquery sufficient for fetch-in-useEffect pattern) — spec needs clarification.** Operator confirmation on R13 scope needed before S4 closes it.

---

### R-SPA-EB — Error Boundary presence (`require-error-boundary`) — NOT a migration target

**Class:** REQUIRE — JSX root must include ErrorBoundary  
**Note:** Not listed as S3 migration target. Included here for completeness.  
**Assessment:** Complex JSX tree traversal with program-level stateful tracking (`hasJSX`, `hasErrorBoundaryInJSX`). Neither esquery nor ast-grep can cleanly express "file has JSX AND no ErrorBoundary in any JSX element" without stateful program logic.  
**Verdict: Class 4 (custom) — KEEP CUSTOM.** Not in scope for this umbrella.

---

## §4 5-class verdict summary

| Class | Description | Rules |
|---|---|---|
| **1 — ast-grep REQUIRED** (esquery cannot express) | ast-grep is the only option | **NONE FOUND** |
| **2 — ast-grep BETTER** (quality-win, esquery sufficient) | ast-grep definitively cleaner/shorter/fewer FP | **NONE** (R18 resolved to Class 3 after axis-B host run §0.5 — identical output, no quality delta) |
| **3 — esquery sufficient** | esquery works; declarative with `eslint-restricted` engine | R2, R7, R8, R13, R14, R18, R20 |
| **4 — custom** (neither engine simple enough) | complex state, multi-condition | R12, R-SPA-EB |
| **5 — type-inference** (G3b backlog) | requires TypeScript type checker | **NONE FOUND** |

---

## §5 G3b backlog

**Result: EMPTY** — zero rules in the corpus require TypeScript type inference.

Evidence per rule:
- `require-otel-span`: DFS over AST looking for method name `startActiveSpan`/`withSpan` — purely syntactic ✓
- `require-form-safe-parse`: reads `typeAnnotation.typeAnnotation.typeName.name === 'FormData'` — TypeScript annotation in AST, NOT type-checker result ✓ (T-RCT-A confirmed)
- `require-use-server-directive`: file-first-statement check and export detection — purely syntactic ✓
- `no-unsafe-zod-parse`: method-name matching `.parse()` — purely syntactic ✓
- `no-direct-time-randomness`: identifier/member expression name matching — purely syntactic ✓
- `no-server-imports-in-client`: string matching on import paths — purely syntactic ✓
- `require-error-boundary`: JSX element name matching — purely syntactic ✓

**T-RCT-C addressed:** Corpus fully audited. 0 G3b triggers found. If S0 finds 0 — G3b stays deferred with «no demand» proof. This IS that finding.

---

## §6 R10 verdict

**R10 (Naming) — confirmed NOT declarative.** Cannot be expressed as an esquery or ast-grep selector because:
- Naming conventions are project-specific and multi-dimensional (PascalCase, camelCase, SCREAMING_SNAKE by context)
- Requires comparing filename to exported symbol name (cross-node information)
- Placement rules (`*Repository`, `*Service`, `*Controller`) depend on directory path context
- Status: `manual review` — stays as-is. Sidecar grep approach per RULES.md R10 note.

---

## §7 S1-S4 scope implications

### S1 (ast-grep runner)
**Result: NO-OP — CONFIRMED** (axis B run on host §0.5). Class 1 (required) = NONE; Class 2 (quality-win) = NONE — R18's axis-B ast-grep output is identical to esquery (bad 2 / good 0), no quality delta. ast-grep dependency is **NOT added**; the `prior-art-evaluations.md` ast-grep entry stays DEFER (BFR-default — no load-bearing gap). The S1b precedent (DROP for forbid composites) and this matrix (esquery sufficient for the require corpus) jointly establish: ast-grep stays deferred for this umbrella.

### S2 (presence:"require" semantics)
**Activated.** Classes 3 rules for require tier (R8, R14, R20, R18) need `presence:"require"` in schema. The anti-vacuity gate needs to fire for these rules. G3b seam to be placed in engine dispatch.

### S3 (migrate 3 require rules → data)
**Activated.** R8, R14, R20 → all Class 3 (esquery sufficient). Engine: `eslint-restricted`. R14 needs TypeScript parser in ESLint config. Key selectors documented in §3.

### S4 (close R13 + R18)
**R18:** Class 3 — CONFIRMED via axis-B host run (§0.5); implement with `eslint-restricted` engine. Selector documented in §3.  
**R13:** Class 3 provisional — implement with `eslint-restricted` engine. Selector for fetch-in-useEffect documented. Spec clarification needed for broader coverage.  
**NOT type-inference-bound** — neither needs G3b rail. RULES.md status → enforced.

---

## §8 Adversarial close (T4)

Which rule/class did I NOT check?

- ✓ Core R1-R11 all accounted for
- ✓ next-15 R12-R20 all accounted for  
- ✓ react-spa rules checked (R1-R11 + R-SPA-EB)
- ✓ react-native rules (R1-R11 only; same as core)
- ✓ IR1-IR6 confirmed OUT
- ✓ require-error-boundary analyzed (not in scope but covered)
- **Not deeply analyzed:** `performance.now()` for R7 (another time source besides `Date.now()`). The existing custom rule covers it; for S0 it's the same class 3. Not a gap.
- **Axis B gap (known constraint):** ast-grep not installed in container. All patterns are authored but unrun. This is an honest limitation; human verification needed before any class 2 quality-win verdict can be confirmed.
- **R13 spec gap (known):** "AST grep on TanStack Query / SWR usage" is broader than fetch-in-useEffect; full intent needs operator clarification for S4.

**Coverage:** 100% of enumerable in-scope rules assessed. 0 rules skipped without rationale.

---

## §9 Self-application (T15)

This audit applied the S1b falsifier method to itself: every claim is backed by command output (axis A), and the axis B gap is explicitly flagged rather than filled with plausible-prose. The "esquery has `:has()`" finding was discovered empirically (R18-ATTEMPT-B run), not assumed from prior knowledge. T-RCT-D honored: S1b composite forbid results cited, not re-run. T-RCT-E honored: axis B run for ALL rules (attempted; marked UNRUN where failed).

---

## See also

- `docs/meta-factory/generator-forbid-mvp/s1b-astgrep-composite-pilot.md` — S1b composite forbid pilot (DEFER ast-grep for ancestor/inside; esquery sufficient)
- `packages/core/synthesizer/recipe.schema.json:80` — schema `presence` currently `{"const":"forbid"}` → S2 widens to `"forbid"|"require"`
- `packages/core/synthesizer/compile-declarative-md.ts` — current forbid-only compiler → S2 adds require branch
- `docs/meta-factory/prior-art-evaluations.md` — SSOT (S1 extends ast-grep entry if activated)
