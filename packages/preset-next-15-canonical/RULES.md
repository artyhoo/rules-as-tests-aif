# Rules — automatically enforced after every /aif-implement

> **Authoritative for:** canonical R1–R11 rule list enforced by AIF's `rules-sidecar` (reads `.ai-factory/RULES.md`) and edit-time ESLint + pre-push checks in the preset-next-15 preset (consumer-customisable).
> **NOT authoritative for:** project goal — see consumer's README.md.

These rules are enforced by AIF's `rules-sidecar` (reading `.ai-factory/RULES.md`) after every implementation, backed by edit-time custom ESLint rules and pre-push (`tsc`/`depcruise`/`audit-ai-docs.sh`). R10 naming and R4/R17 test-existence residue are additionally covered by the `aif-rules-check` skill-context override. Each rule has a corresponding automated check. Bypass via `/aif-rules` (with rationale), never via `--no-verify`.

## Summary table

> Generated from `factory/rules-manifest.json` by `scripts/render-rules.ts`. Do not edit by hand.

<!-- begin: rules-table-generated -->
| Rule | Stack | Check |
|---|---|---|
| **R1 TypeScript hygiene** | ts-server, react-next | `tsc --noEmit && eslint <files>` |
| **R2 Validation at boundaries** | ts-server, react-next | ESLint `rules-as-tests/no-unsafe-zod-parse` |
| **R3 Architectural boundaries** | ts-server, react-next | `npm run arch:check` |
| **R4 Tests for new public code** | ts-server, react-next | `scripts/audit-r4.ts` |
| **R5 Async correctness** | ts-server, react-next | ESLint `@typescript-eslint/no-floating-promises` |
| **R6 Errors** | ts-server, react-next | ESLint `no-throw-literal` |
| **R7 Time, randomness, IO** | ts-server, react-next | ESLint `rules-as-tests/no-direct-time-randomness` |
| **R8 Observability** | ts-server, react-next | ESLint `rules-as-tests/require-otel-span` |
| **R9 Imports / dependencies** | ts-server, react-next | ESLint `no-restricted-imports` |
| **R10 Naming** | ts-server, react-next | Manual review — Naming conventions are too project-specific to formalize reliably; sidecar runs ad-hoc grep on the diff. |
| **R11 CI integrity** | ts-server, react-next | `.github/workflows/workflow-integrity.yml (actionlint + zizmor + branch-protection-assertion)` |
| **R12 Server vs Client Components** | react-next | ESLint `rules-as-tests/no-server-imports-in-client` |
| **R13 Data fetching** | react-next | Manual review — AST grep on TanStack Query / SWR usage; no ESLint rule today. |
| **R14 Forms** | react-next | ESLint `rules-as-tests/require-form-safe-parse` |
| **R15 Accessibility** | react-next | ESLint `jsx-a11y/strict` |
| **R16 Performance** | react-next | ESLint `@next/next/no-img-element` |
| **R17 Component tests** | react-next | `scripts/audit-ai-docs.react-next.sh` |
| **R18 TanStack Query / SWR** | react-next | Manual review — AST grep on `useQuery` without `.parse()` in `queryFn` (project-specific). |
| **R19 Styles** | react-next | `depcruise --validate (blocks styled-components/@emotion)` |
| **R20 Server Actions** | react-next | ESLint `rules-as-tests/require-use-server-directive` |
| **IR1 API contracts** | microservices | `CI job: zod-to-openapi diff against published OpenAPI` |
| **IR2 Consumer-driven contracts (Pact)** | microservices | `CI: pact-publish + pact-verify + can-i-deploy` |
| **IR3 Event schemas (async messaging)** | microservices | `audit-ai-docs.sh probe — `publish()` calls reference @org/event-schemas` |
| **IR4 Service-to-service auth** | microservices | `depcruise blocks bare fetch() to internal service URLs` |
| **IR5 Observability propagation** | microservices | Manual review — Trace propagation is hard to lint; verify in integration tests + Jaeger/Tempo dashboards. |
| **IR6 Resilience** | microservices | Manual review — Resilience patterns (retry, circuit breaker, timeout) verified by chaos tests in staging. |
<!-- end: rules-table-generated -->

## R1 — TypeScript hygiene
- No `as any` anywhere. If type is genuinely unknown, use `unknown` and narrow.
- No non-null assertions (`!`). Use type guards or proper narrowing.
- No `// @ts-ignore`. Use `// @ts-expect-error` with description (≥10 chars).
- All function signatures fully typed.
- `import type` for type-only imports.

**Check:** `tsc --noEmit && eslint <files>`

### Examples

```ts
// BAD
const x = data as any;
```

```ts
// GOOD
const x = data as unknown as User;
```

## R2 — Validation at boundaries

**Policy:** `.parse() is forbidden` in HTTP boundary code. Use `.safeParse()` and branch on `.success`.

**Path-scoped enforcement:** the ESLint rule `rules-as-tests/no-unsafe-zod-parse` is enabled only for these globs (configured in `eslint.config.mjs`):
- `src/web/handlers/**`
- `src/app/actions/**`
- `src/app/api/**`

**Outside these paths** (e.g. `src/config/env.ts` startup code, tests, scripts) `.parse()` is allowed.

**Other boundaries also require validation** — use `.safeParse()` (no ESLint rule today — manual sidecar check):
- Message queue payloads on consume.
- DB row mappers against domain schemas.

**Escape hatch:** add `// audit:exempt` on the same line if `.parse()` is intentional in a scoped path.

**Check:** `npx eslint <changed>` — rule `rules-as-tests/no-unsafe-zod-parse`.

### Examples

```ts
// BAD
const body = OrderSchema.parse(req.body); // in handler
```

```ts
// GOOD
const r = OrderSchema.safeParse(req.body);
if (!r.success) return reply.code(400).send(r.error.flatten());
```

## R3 — Architectural boundaries
- Domain code imports only stdlib and Zod.
- No imports from `infrastructure/` in `application/` (except via `application/ports/`).
- No imports from `web/` outside `web/`.
- Features (`src/features/<name>/`) communicate only through public `index.ts`.

**Check:** `npm run arch:check` (dependency-cruiser)

### Examples

```ts
// BAD
// in src/domain/order.ts:
import { db } from '../infrastructure/db';
```

```ts
// GOOD
// in src/application/place-order.ts:
import type { OrderRepo } from './ports/order-repo';
```

## R4 — Tests for new public code
- Every new public export needs at least one test.
- Tests MUST contain at least one real assertion (not `toBeDefined()` for typed values).
- No conditional logic (`if`/`for`/`while`) in test bodies — use `it.each` for variants.
- For state machines / numeric thresholds: parameterized tests covering boundaries.
- For pure functions with general invariants: at least one fast-check property.

**Check:** `scripts/audit-r4.ts` (ts-morph) — every export in `src/domain/**/*.ts` has matching `.unit.ts` that references the export name. Plus `vitest related <changed>` for actual test execution.

### Examples

```ts
// BAD
export function isAdult(age: number) { return age >= 18; } // no test
```

```ts
// GOOD
// + isAdult.unit.ts:
it('returns true for >= 18', () => { expect(isAdult(18)).toBe(true); });
```

## R5 — Async correctness
- All Promises either `await`ed or explicitly handled with `.catch()`.
- No floating promises in production code.
- No mixing `await` and `.then()` in the same function.

**Check:** `eslint --rule '@typescript-eslint/no-floating-promises:error'`

### Examples

```ts
// BAD
function send(): void { fetch('/x'); }
```

```ts
// GOOD
async function send(): Promise<void> { await fetch('/x'); }
```

## R6 — Errors
- No `throw 'string'`. Always throw an Error subclass.
- No empty `catch (_)` blocks.
- Domain errors extend `DomainError`. Infrastructure errors extend `InfraError`.
- All HTTP error responses go through the central error mapper.

**Check:** ESLint rules `no-throw-literal` + `@typescript-eslint/no-useless-catch`.

### Examples

```ts
// BAD
throw 'bad input';
```

```ts
// GOOD
throw new ValidationError('bad input', { cause: err });
```

## R7 — Time, randomness, IO
- No `Date.now()`, `new Date()`, `performance.now()` in `src/` (except `infrastructure/clock/`).
- No `Math.random()` (except `infrastructure/random/`).
- No direct `fs`, `http`, `https` imports outside `infrastructure/`.

**Check:** ESLint rule `rules-as-tests/no-direct-time-randomness` (allows `src/infrastructure/**`).

### Examples

```ts
// BAD
const now = Date.now();
```

```ts
// GOOD
const now = clock.now(); // injected from infrastructure/clock
```

## R8 — Observability
- Public application commands/queries open an OTel span via the standard helper.
- Span attributes include: relevant business identifiers and active feature flags.
- Errors set span status with structured cause, never bare error strings.

**Check:** ESLint rule `rules-as-tests/require-otel-span` (scoped to `src/application/**`).

### Examples

```ts
// BAD
export async function placeOrder(o) { return await save(o); }
```

```ts
// GOOD
export async function placeOrder(o) {
  return tracer.startActiveSpan('placeOrder', () => save(o));
}
```

## R9 — Imports / dependencies
- No `lodash`, `moment`, `axios`, `request`, `node-fetch`. Use native fetch, date-fns, Zod.
- New top-level dependency requires explicit ADR in `docs/adr/`.
- No `* as` star imports except for namespaces (zod, ts).

**Check:** `eslint --rule 'no-restricted-imports:error'` + `git diff package.json` review.

### Examples

```ts
// BAD
import fs from 'fs'; // in src/domain/
```

```ts
// GOOD
// import only from stdlib + zod in domain
```

## R10 — Naming
- Classes: PascalCase. Functions/variables: camelCase. Constants: SCREAMING_SNAKE.
- Files match exported symbol: `OrderService.ts` exports `OrderService`.
- `*Repository` = interface in domain or application; impl in infrastructure.
- `*Service` lives in application or infrastructure, never in domain.
- `*Controller` only in web/.

**Check:** Manual review only — naming conventions are too project-specific to formalise reliably across stacks. The `aif-rules-check` skill-context override (`.ai-factory/skill-context/aif-rules-check/SKILL.md`) prompts AIF's `rules-sidecar` to run an ad-hoc grep against the diff (filename ↔ exported symbol; `*Repository`/`*Service`/`*Controller` placement); `audit-ai-docs.sh` does not include a probe for R10. If your project has a strict naming scheme, write a project-specific probe and a paired negative test.

### Examples

```ts
// BAD
// file: utils.ts containing only date helpers
```

```ts
// GOOD
// file: date-utils.ts
```

## R11 — CI integrity
- `.github/workflows/ci.yml` is generated by `/aif-ci` and customized by us.
- Any modification requires re-running tests on the change.
- The `ci-success` job must remain a required check on main.
- New jobs are added through PR with explicit rationale.

**Check:** `.github/workflows/workflow-integrity.yml` runs on every PR touching `.github/workflows/**`. Three executable layers:
1. `actionlint` — YAML/expression correctness, script-injection vectors, runner-label validity.
2. `zizmor` — supply-chain audits (`unpinned-uses`, `dangerous-triggers`, `excessive-permissions`, `template-injection`, `cache-poisoning`).
3. `gh api repos/:owner/:repo/branches/main/protection | jq -e '.required_status_checks.contexts | contains(["ci-success"])'` — asserts the `ci-success` gate remains a required status check on `main`.

### Examples

```yaml
# BAD
# in .github/workflows/ci.yml:
- uses: actions/checkout@main
```

```yaml
# GOOD
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
```

---

## How violations are handled

1. AIF's `rules-sidecar` (or edit-time ESLint, as appropriate) flags the violation in `/aif-verify` output.
2. `/aif-fix` is invoked automatically on flagged items.
3. If the rule is genuinely incompatible with the task — `/aif-rules` to discuss
   updating the rule (with rationale), not to silently bypass it.

## Rule maintenance

- Each rule has a measurable check. If the check is missing — the rule is a wish, not a rule. Either implement the check or delete the rule.
- Rules are added through PR with rationale (which class of bugs it prevents).
- Rules are deleted only with explicit ADR documenting why.
- Aim to keep ~10–12 rules **active per validation pass**. The package ships R1–R11 (server) + R12–R20 (UI) + IR1–IR6 (microservices), but in any one project a subset is enabled — adjust `audit-ai-docs.sh` and `.ai-factory/RULES.md` to skip rules that don't apply. Past ~12 rules in a single pass the AI starts losing focus.
