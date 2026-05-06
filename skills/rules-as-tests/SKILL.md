---
name: rules-as-tests
description: Convert any codebase rule (architectural, naming, dependency, test-quality, contract, SLO) into an executable test that fails the build when violated. Use this skill whenever the user asks about enforcing code quality, fighting AI-generated code drift, setting up linters/tests/CI/pre-commit hooks, designing review processes, mutation testing, contract testing, fitness functions, observability-driven development, SLO-as-code, or any version of "how do I make my codebase resistant to AI agents breaking my conventions". Also trigger on any mention of ArchUnit, Stryker, Pact, dependency-cruiser, AI Factory (aif), Husky, lint-staged, ESLint flat config, Zod validation strategy, or shift-left/shift-right testing. Strongly trigger when the user mentions Claude Code, Cursor, or Copilot writing code that "looks fine but is wrong" — that is the core problem this skill addresses.
---

# Rules as Tests

A unified framework for treating **every codebase rule as an executable test**. Documents lie; tests don't. This becomes critical when AI agents write the code, because LLMs reliably violate undocumented conventions and generate plausible-but-vacuous tests.

## When this skill is relevant

Use this skill when the user is working on (or asking about):

- Setting up linting / testing / CI / pre-commit / pre-push hooks for a JS/TS project
- Architecture enforcement (layer rules, dependency direction, no-cycles, banned imports)
- Mutation testing (Stryker, PIT, mutmut)
- Contract testing between microservices (Pact, can-i-deploy)
- Fighting AI agents introducing drift / `as any` / tautological tests
- AI Factory (aif) integration with Claude Code
- Production fitness functions: SLO-as-code, error budgets, observability
- Feature flags, canary releases, chaos engineering
- React/Next.js code-quality stack (Server vs Client boundary, accessibility, Storybook)
- Designing the rules a Claude Code / Cursor / Copilot project should follow

## The five layers

Every rule fits into one of five layers, each with its own enforcement mechanism:

1. **Architecture Tests / Fitness Functions** — structural rules as tests (no cycles, layered architecture, banned imports, naming, complexity ceilings). Tools: ESLint flat config + `typescript-eslint/strictTypeChecked`, dependency-cruiser, ArchUnit.
2. **Meta-tests** — tests *about* the test suite (every public method has a test, every test has a real assertion, no conditional logic in tests, no real I/O in unit tests). Implemented as AST scans + `eslint-plugin-vitest` rules.
3. **Specification by Example** — table-driven tests where concrete input/output pairs ARE the spec. Vitest `it.each`, fast-check property-based tests, Zod schemas as contractual specs.
4. **Mutation Testing** — sanity layer on the tests themselves. Catches tautological tests and always-green assertions. Stryker incremental on PR diff, full sweep nightly. Threshold ≥70% kill on changed lines.
5. **Living Documentation** — tests *are* the documentation. Test names are sentences; ArchUnit `because(...)` clauses are ADRs; OpenAPI specs generated from Zod schemas.

These five extend in two directions:
- **Down (shift-left → pre-PR)**: AI Factory `/aif-verify` with sub-agents (`best-practices-sidecar`, `review-sidecar` for two-AI tautology detection).
- **Up (shift-right → production)**: SLO-as-code (OpenSLO + Pyrra), error budgets, feature flags + observability 2.0, synthetic monitoring, chaos engineering.

Plus a sideways layer:
- **Contract testing (Pact)**: lives in CI by form (fast, deterministic) but solves shift-right problem (production compatibility) via `can-i-deploy` with Pact Broker holding production state.

## Where to dig in

Read these references **as needed**, not all at once:

| File | When to read |
|---|---|
| `references/checks-map.md` | **Always read first if user is unclear where their question fits.** Map of all 8 enforcement levels (edit-time → production) and what runs where. |
| `references/overview.md` | Quick refresher of the 5-layer framework with patterns and anti-patterns per layer. |
| `references/ai-traps.md` | Specifically what AI agents (Claude/Cursor/Copilot) violate most and which rule catches each. Use when user mentions AI-generated code drift. |

## Templates ready to copy

Production-ready configs in `templates/`. Copy to a new project and they work:

| File | Purpose |
|---|---|
| `templates/eslint.config.mjs` | Server-side TS: typescript-eslint strict + Prettier + custom rules |
| `templates/eslint.config.react.mjs` | React/Next.js: above + react-hooks + jsx-a11y/strict + @next/next |
| `templates/tsconfig.json` | Strict TypeScript with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| `templates/dependency-cruiser.cjs` | Architectural rules: layering, no-cycles, no-cross-feature-imports |
| `templates/stryker.config.json` | Mutation testing with incremental mode, thresholds 60/70/85 |
| `templates/vitest.config.ts` | Test runner with per-module coverage thresholds |
| `templates/.lintstagedrc.json` | Pre-commit: prettier + eslint --fix on staged only |
| `templates/husky-pre-commit.sh` | Pre-commit hook entry |
| `templates/husky-pre-push.sh` | Pre-push hook with upstream-fallback (works on new branches) |
| `templates/.nvmrc` | Pinned Node version (CI depends on it) |
| `factory/RULES.md` | Drop-in for `.ai-factory/RULES.md` — rules R1–R11 |
| `factory/RULES.react-next.md` | Extension R12–R20 for React/Next.js stack |
| `templates/github-actions-ci.yml` | Full CI workflow: lint, typecheck, arch, test, mutation incremental |

## Workflow when applying this skill

1. **Identify which layer(s) the user's question touches.** Use the map in `checks-map.md` if unclear.
2. **Read the relevant reference file** (overview / ai-traps / checks-map) before writing detailed advice.
3. **Reach for templates** when giving config recommendations — they are already correct (versions verified, paths consistent, edge cases handled).
4. **Don't dump all 5 layers at once.** Match recommendation depth to the user's question. If they ask about pre-commit, don't lecture about chaos engineering.
5. **For React/Next questions**, also load `templates/eslint.config.react.mjs` and apply Server/Client boundary rules from R12–R20.
6. **For AI-generated code worries**, prioritize: meta-tests (Layer 2) + mutation testing (Layer 4) + AIF `review-sidecar` two-AI review pattern. These three together catch ~80% of AI-specific failures.

## Verification protocol — apply before publishing any config

A bug pattern this skill explicitly fights: dependency lists with stale versions, missing peer-deps, paths that don't match project structure, scripts that fail on edge cases (new branches, missing files). Before producing a `package.json`, hooks, or CI config in your response:

1. **Each `dependencies`/`devDependencies` entry must be verified** via `npm view <package> version` or web search — not from memory.
2. **Each import in code examples must exist in `package.json`** (literal cross-check).
3. **Each path in configs (`include`, `exclude`, `mutate`, `disableTypeChecks`) must match** the project structure described.
4. **Each file referenced from CI/hooks must be created** in the artifact (`.nvmrc` is the canonical case — easy to forget).
5. **Each shell command must work on edge cases** — empty branch, missing upstream, fresh checkout.

If you skip this and produce buggy artifacts, you have failed the user — the entire skill is *about* getting these details right.

## Universal AI angle

The strongest case for this entire framework: **AI agents write plausible-looking code that violates undocumented conventions**. Without this skill's framework, every AI-generated PR risks introducing:

- `as any` / non-null assertions to bypass type errors
- Tautological tests (`expect(x).toBeDefined()` for typed values, `expect(mock).toHaveBeenCalled()` without behavioral assertion)
- Layer violations (controllers reaching into domain, domain importing infrastructure)
- New top-level dependencies (`lodash`, `moment`, `axios`) when the project standardized on alternatives
- `enum` declarations (deprecated in modern TS with `verbatimModuleSyntax`)
- Direct `Date.now()` / `Math.random()` / network in production code
- Missing `await` / floating promises
- Always-passing tests with `try/catch: pass`

Every one of these is caught by a specific automated rule from this skill's templates. There is no "be careful" instruction in `CLAUDE.md` that survives AI-driven development at scale — only enforced rules survive.

## Glossary of key terms

- **Fitness function** — an executable check that the system meets a non-functional requirement (Ford/Parsons/Kua, *Building Evolutionary Architectures*, 2017).
- **Specification by Example** — concrete input/output pairs as the spec (Gojko Adzic, 2011).
- **Living Documentation** — tests as the single source of truth (Cyrille Martraire, 2019).
- **Mutation testing** — introducing artificial bugs to verify tests detect them.
- **Two-AI review** — one model writes code/tests, a different model reviews them without context (Senko Rašić workflow).
- **Consumer-driven contracts (CDC)** — consumer of a service writes the contract; provider verifies it (Pact, Ian Robinson, 2006).
- **Error budget** — the allowed amount of unreliability over a window. SLO = 99.95% → budget = 0.05% over 28 days.
- **Observability 2.0** — wide events with high cardinality replacing static dashboards (Charity Majors, Honeycomb).
- **`can-i-deploy`** — Pact Broker query: "can this version be deployed without breaking deployed consumers?"
- **`/aif-verify`** — AI Factory pre-PR gate that runs sub-agents over RULES.md.

## Connecting to broader practice

The framework integrates with:

- **AI Factory (aif)** — Claude Code workflow tool. Slash-commands (`/aif-plan`, `/aif-implement`, `/aif-verify`, `/aif-commit`). Sub-agents (`best-practices-sidecar`, `review-sidecar`) auto-validate against `RULES.md`.
- **GitHub Actions / GitLab CI** — required `ci-success` job as the merge gate.
- **OpenTelemetry** — instrumentation for shift-right SLOs and observability.
- **OpenSLO + Pyrra/Sloth** — declarative SLOs as code, compiled to Prometheus rules.
- **Pact Broker / Pactflow** — runtime knowledge of which versions are in production, used at build-time via `can-i-deploy`.

Each integration is a separate decision; the framework doesn't require all of them, but it pays off most when 3+ are in place.
