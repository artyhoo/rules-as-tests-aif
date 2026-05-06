# rules-as-tests-aif

> AI Factory extension that converts every codebase rule into an executable test that fails the build when violated. Includes AI documentation audit (drift detection + code-vs-docs probes), 5-layer enforcement framework, and ready-to-use configs for both server-side TypeScript and React/Next.js stacks.

## What this package gives you

After install, your project has:

1. **A skill** (`.claude/skills/rules-as-tests/`) — auto-activates in Claude Code on questions about lint, tests, CI, mutation testing, contracts, AI-driven code drift.
2. **Three sub-agents** (`.claude/agents/`) that AIF runs on `/aif-verify`:
   - `best-practices-sidecar` — validates code against `RULES.md` (R1–R20).
   - `review-sidecar` — two-AI tautology review of tests.
   - `docs-auditor` — runs `audit-ai-docs.sh` and interprets results.
3. **AI Factory templates** (`.ai-factory/`) — DESCRIPTION, ARCHITECTURE, RULES (R1–R11 + R12–R20 for UI + IR1–IR6 for microservices).
4. **An audit script** (`scripts/audit-ai-docs.sh`) — drift detection + code-vs-docs probes. ~10 sec run. Each probe has a paired negative test (must fail when introduced bug).
5. **Stack configs**:
   - ESLint 10 flat config (typescript-eslint strictTypeChecked + Prettier; for React, also react-hooks + jsx-a11y/strict + @next/next).
   - Vitest 4.x with `.unit.ts` / `.integration.ts` / `.audit.ts` naming and per-module coverage thresholds (90% domain, 85% application).
   - Stryker mutation testing (incremental on PR diff, full sweep nightly).
   - dependency-cruiser layered architecture rules.
   - Husky pre-commit (lint-staged) + pre-push (typecheck + vitest related + arch + audit-ai-docs).
   - GitHub Actions CI with required `ci-success` job.
   - For React/Next: also Playwright (component testing + e2e) and Storybook test-runner.

## Why this exists

AI agents (Claude, Cursor, Copilot, Aider) write plausible-looking code that **reliably violates undocumented conventions**. Without enforced rules:
- `as any` and `!` non-null assertions multiply.
- Tests pass because they're tautological (`expect(x).toBeDefined()` for typed values).
- Layer boundaries leak.
- Conventions in `CLAUDE.md` are forgotten within 3 sessions.

This package operationalizes the principle: **every rule that governs your codebase is an executable test that fails the build when violated**. AI cannot silently bypass what fails CI.

## The 5-layer framework

| Layer | What | Tools |
|---|---|---|
| 1 | Architecture / fitness functions | ESLint, dependency-cruiser, ArchUnit |
| 2 | Meta-tests (tests about test suite) | AST scans, eslint-plugin-vitest |
| 3 | Specification by Example | Vitest `it.each`, fast-check property tests |
| 4 | Mutation testing | Stryker incremental |
| 5 | Living documentation | OpenAPI from Zod, ADRs as ArchUnit `because(...)` |

Plus extensions:
- **Pre-PR**: AIF `/aif-verify` with sub-agents.
- **Production**: SLO-as-code (OpenSLO + Pyrra), error budgets, observability 2.0.
- **Between services**: Pact contract testing with `can-i-deploy --to production`.
- **Between code and AI docs**: `audit-ai-docs.sh` with drift detection + code-vs-docs probes.

For details, see `skills/rules-as-tests/references/`:
- `checks-map.md` — map of all 8 enforcement levels (edit-time → production)
- `overview.md` — 5 layers with patterns and anti-patterns
- `ai-traps.md` — what AI violates most + Lessons learned (real grabli)
- `self-testing-docs.md` — the `audit-ai-docs.sh` pattern with negative tests
- `doc-organization.md` — hot/cold split for AGENTS.md, token economy

## Installation

### Quick start — one command (recommended)

```bash
git clone https://github.com/Yhooi2/rules-as-tests-aif /tmp/rt
cd /your/project
bash /tmp/rt/setup.sh --stack=ts-server      # or --stack=react-next
```

That's it. `setup.sh` handles everything end-to-end:

1. Installs `ai-factory` globally if missing (`npm install -g ai-factory`).
2. Runs `ai-factory init --agents claude` to create the `.ai-factory/` skeleton.
3. Overlays this package's content via `install.sh`.
4. Runs `npm install -D` for ~25 dev dependencies.
5. Initializes husky and copies pre-commit / pre-push hooks.
6. Adds 13 npm scripts (`validate`, `audit:docs`, `arch:check`, `test:mutation`, …) to `package.json` via `jq`.

Optional flags:
- `--skip-aif-init` — skip step 2 (use if AIF is already initialized or you don't want it globally installed).
- `--skip-deps` — skip step 4 (`npm install`).
- `--force` — overwrite existing config files.

### What gets installed automatically

After `setup.sh` finishes, your project has:

| Path | Source | Edit needed? |
|---|---|---|
| `.claude/skills/rules-as-tests/` | skill + 5 references, on-demand | No — auto-activates in Claude Code |
| `.claude/agents/best-practices-sidecar.md`, `review-sidecar.md`, `docs-auditor.md` | sub-agents for `/aif-verify` | No |
| `.ai-factory/RULES.md` | R1-R11 (or +R12-R20 for react-next) | **Yes — review and trim per project** |
| `.ai-factory/DESCRIPTION.template.md` | template with `<PLACEHOLDERS>` | **Yes — fill in, rename to `DESCRIPTION.md`** |
| `.ai-factory/ARCHITECTURE.template.md` | drop-in for canonical hexagonal layout | Maybe — rename to `ARCHITECTURE.md` if your layout matches |
| `AGENTS.md` (root) | from `templates/shared/AGENTS.md.template` | **Yes — review** |
| `eslint.config.mjs`, `vitest.config.ts`, `tsconfig.json`, `stryker.config.json`, `.dependency-cruiser.cjs`, `.lintstagedrc.json`, `.nvmrc` | stack-specific configs | No — work out of the box |
| `.husky/pre-commit`, `.husky/pre-push` | Husky hooks (lint-staged + typecheck + audit) | No |
| `.github/workflows/ci.yml` | full CI pipeline (lint, typecheck, arch, tests, mutation) | No — works as-is |
| `scripts/audit-ai-docs.sh` (and `.react-next.sh`) | code-vs-docs probes | No — extend with project-specific probes if useful |
| `package.json` scripts | 13 entries via `jq` | No |

**Manual work after install** is only the three project-specific items above (DESCRIPTION placeholders, RULES.md trimming, AGENTS.md review). Typically 5-10 minutes — or zero, if you delegate it to an AI (next section).

### For AI agents — let Claude/Cursor do the install

Paste this into Claude Code, Cursor, or any AI agent with file access in your project's directory:

```
Install rules-as-tests-aif into this project.

1. Detect stack: `ts-server` (default) or `react-next` (next.config.* present, or
   "next"/"react" in package.json).
2. Run: bash /path/to/rules-as-tests-aif/setup.sh --stack=<detected>
   (clone the repo to /tmp/rt first if not on disk; the package is at
   github.com/Yhooi2/rules-as-tests-aif — needs SSH/HTTPS access).
3. After setup completes, do these in sequence and report results:
   a. Read .ai-factory/DESCRIPTION.template.md, fill in <PROJECT_NAME>,
      stack details, non-goals based on package.json + README.md +
      existing src/ structure. Save as .ai-factory/DESCRIPTION.md.
   b. Read .ai-factory/RULES.md (R1-R11). For each rule, decide: keep,
      adjust, or remove based on project context. Report decisions to me.
      Do not commit removals without asking.
   c. Read AGENTS.md root file, adapt to this project (replace template
      placeholders with concrete paths and conventions).
   d. Run `npm run validate` and report any failures.
   e. Run `npm run audit:docs` and report results.
4. Stop here. Do not start implementing features.
```

Full guide for AI-driven install: see [`INSTALL-FOR-AI.md`](INSTALL-FOR-AI.md).

### Alternative paths

If you already have `ai-factory` set up or want partial install:

```bash
# Path B — only the overlay (you handle ai-factory init + npm yourself):
bash /tmp/rt/install.sh ts-server     # or react-next; --force to overwrite

# Path A — AIF extension (forward-compat, schema landing soon):
ai-factory extension add ./rules-as-tests-aif

# Path C — cherry-pick configs only (no skill, no sub-agents, no audit):
cp /tmp/rt/templates/ts-server/eslint.config.mjs .
cp /tmp/rt/templates/shared/tsconfig.json .
# ... see INSTALL.md §C
```

## What stack does it support?

- **`ts-server`** — Node.js 20.19+ server-only (Fastify, Hono, Express, plain HTTP).
- **`react-next`** — React 19 + Next.js 15 (App Router) + TypeScript.

Pick during `setup.sh` (auto-detected from `next.config.*` / `react` in `package.json`) or pass `--stack=...` explicitly. Both share base configs (tsconfig, husky, lint-staged, RULES R1-R11). React adds R12-R20 + Storybook + Playwright.

## Forward compatibility note on AIF extensions

The AIF `extension.json` schema is **in active development** as of May 2026 (PR #34 in `lee-to/ai-factory`, Draft state). This package ships:

- **`extension.json`** — best-effort manifest matching what's visible in AIF code today
- **`install.sh`** — guaranteed fallback that does not depend on AIF extension support

When the schema finalizes, `extension.json` may need updates. `install.sh` will continue to work regardless.

## Verified versions (May 6, 2026)

All versions in `INSTALL.md §4` were verified via `npm view <pkg> version` on installation date. Re-verify before deploying to your project — versions move.

## What's enforced

The complete rule list (R1–R20):

**Base (R1–R11)** — server TS:
- R1 TypeScript hygiene (no `any`, no `!`, no `enum`)
- R2 Validation at boundaries (Zod)
- R3 Architectural boundaries (layered)
- R4 Tests for new public code (real assertions only)
- R5 Async correctness (no floating promises)
- R6 Errors (Error subclasses, no string throw)
- R7 Time/randomness/IO injection
- R8 Observability (OTel spans)
- R9 Imports (banned: lodash, moment, axios)
- R10 Naming conventions
- R11 CI integrity

**React/Next addition (R12–R20)**:
- R12 Server vs Client components
- R13 Data fetching (RSC / Server Actions / TanStack Query)
- R14 Forms (Server Actions with Zod)
- R15 Accessibility (jsx-a11y/strict)
- R16 Performance (next/image, next/link)
- R17 Component tests (Storybook + Vitest + a11y)
- R18 TanStack Query / SWR (typed responses)
- R19 Styles (Tailwind, no CSS-in-JS)
- R20 Server Actions (`'use server'`, return type pattern)

**Microservices (IR1–IR6)**:
- IR1 API contracts (OpenAPI from Zod)
- IR2 Consumer-driven contracts (Pact + can-i-deploy)
- IR3 Event schemas (Zod-validated)
- IR4 Service-to-service auth (mTLS / signed JWT)
- IR5 Distributed tracing (W3C Trace Context)
- IR6 Resilience (timeouts, retries, circuit breakers)

## Lessons learned included

`references/ai-traps.md` ends with 8 real-world lessons from running AI-driven projects:

1. Dual-remote projects — `.claude/` in `.gitignore` of work-repo (drift symptom)
2. Skills declared early, never created (skill-fantoms)
3. `_comment_TODO` in JSON outlives everything
4. Stale orchestrator-prompts pile up indefinitely
5. AGENTS.md tables drift faster than the body
6. AI silently demotes "MUST" to "should"
7. Trigger overlap between two skills
8. Rules without measurable check decay

Each lesson includes the **rule that came from it** — typically a specific check in `audit-ai-docs.sh`.

## Updating

```bash
ai-factory extension update rules-as-tests-aif      # Path A
./install.sh <stack> --force                        # Path B (overwrites configs)
# Path C: cherry-pick changes manually
```

## License

MIT. Use, fork, adapt freely.

## Inspirations & sources

This package synthesizes:
- "Rules as Tests" framework — five-layer principle
- Senko Rašić's two-AI review pattern (`review-sidecar`)
- Charity Majors' observability 2.0 (production-side rules)
- Gojko Adzic's Specification by Example (Layer 3)
- Cyrille Martraire's Living Documentation (Layer 5)
- Ian Robinson's Consumer-Driven Contracts (Pact, integration rules)
- Larry Smith's shift-left testing (2001)
- AI documentation drift practices from `ai-docs` skill (real-project applied wisdom)
- Negative test pair pattern as lightweight mutation testing

Full citations in each `references/*.md` file.
