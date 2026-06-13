<!-- scope:consumer-install-hardening-S4 -->
# consumer-install-hardening — S4 consumer-liveness verification

> **Verify stage (S4) of the `consumer-install-hardening` umbrella.** Run inline by `/orchestrator consumer-install-hardening S4` (Mode A, two parallel verification Workers, one per consumer shape). Folder authority inherited from [research-patches/README.md](README.md); scope-bound to the S4 re-verify gap recorded in the meta-launch state (`consumer-install-completeness → S4`).
> **Verdict in one line:** **The S1/S2/S3 fixes are genuinely LIVE on real consumers — but the umbrella did NOT close clean.** S4 caught **4 regressions** (1× P1, on `main` now via #488) that were invisible from the source repo — the exact `T-CIH-A` («green in source ≠ live in consumer») failure S4 exists to catch. Surfaced as routed findings per kickoff §4 scope-fence (verify-stage does not fix mid-flight; fix-stage is the maintainer's call to time).

## §0 What ran (T3 — real toolchain, not source greps)

Framework source = staging tip `b6096914` (#494; contains all of S1 #474 · S2 #479/#480/#481/#485 · S3 #486 · F14 #490 · S3-V2 #491), fetched via `gh api .../tarball/staging` (git transport tunnel-blocked, api alive). Installed into **two real consumer shapes**, each `git init` with default branch `main`, then a real `npm`/`pnpm install` so eslint/stryker/lint-staged/git-hooks execute for real:

- **Flat Hono** — `/tmp/cih-s4/flat-hono`: `src/routes/users.ts` with `schema.parse(req.body)` (R2 target) + `Date.now()`/`Math.random()` (R7/R8). `install.sh ts-server --force`.
- **pnpm monorepo** — `/tmp/cih-s4/monorepo`: `pnpm-workspace.yaml` (`apps/*`+`packages/*`), no root `src/`, `apps/api/src/handlers/health.ts` (R2/R7/R8 fixtures), `packages/lib/src/*`. `install.sh ts-server --force` at root.

Node v24.3, npm 11.4, pnpm 10.19.

## §1 PASS matrix — the S1/S2/S3 shields ARE live (command+output evidenced)

| F# | shape | verdict | evidence |
|---|---|---|---|
| F3 | flat | PASS | `npx eslint src/routes/users.ts` → `18:16 error … (R2) rules-as-tests/no-unsafe-zod-parse` — R2 fires on flat layout. V-gate `check-rule-globs.sh` green. |
| F3 | monorepo | PASS | `npx eslint apps/api/src/handlers/health.ts` → `16:18 error … (R2) rules-as-tests/no-unsafe-zod-parse` — globs REACH `apps/api/**`. |
| F5 | monorepo | PASS | `stryker run` instrumentation → `Found 3 of 123 file(s) to be mutated … 16 mutant(s)` across `apps/*/src` + `packages/*/src`. Mutants > 0. |
| F7 | both | PASS | default `eslint` → R7/R8 silent; `AIF_STRICT_RUNTIME=1 eslint` → both `no-direct-time-randomness` fire (Date.now + Math.random). Opt-in confirmed. |
| F14 | monorepo | PASS | stage `apps/api/src/x.ts` → `git commit` → `[COMPLETED] eslint --fix`, **no ENOENT**, commit landed. Per-package `.lintstagedrc.json` stubs dropped. `check-lintstaged-resolves.sh` green. |
| F15 | both | PASS | `prettier --check .ai-factory/RULES.md` → ignored (exit 0 / `"ignored": true`); diff vs `--ignore-path /dev/null` (would reformat) proves it's the `.prettierignore`, not coincidence. |
| F1 | both | PASS | `.husky/pre-push` routes `node --import tsx/esm $TS_HOOK` on Node≥20 with `pre-push.ts` present; TS arm executed (ran zizmor workflow audit), not the fallback. |
| F2 | both | PASS | `core.hooksPath=.husky`; staged R2 violation → `git commit` → lint-staged `[FAILED] eslint --fix` → commit BLOCKED, HEAD unchanged. |
| F6 | flat | PASS | `scripts/audit-r4.ts` present; `audit-ai-docs.sh:84: npx --no-install tsx scripts/audit-r4.ts` resolves; `audit-ai-docs.sh` → `5 PASS, 0 FAIL, 1 WARN`. |
| F8 | flat | PASS | all 7 `npm run X` in AGENTS.md core list exist in shipped `package.json` (0 missing). |
| F8b | flat | PASS | no bare `factory/RULES` dead-ref in shipped eslint rules / manifest / workflow (only valid `.ai-factory/RULES.md`). |
| F8c | flat | PASS | install "Next steps" carries the DO-NOT advisory: «do NOT run `npx husky init` — it would clobber the shipped hooks». |
| F9 | flat | PASS | `/aif-verify` appears only as conditional («*if you use aif*»), never as a required pre-commit gate. |
| F10 | flat | PASS (nuance) | base-ref precedence: `PREPUSH_UPSTREAM_REF` → git pre-push stdin `remote_sha` → `origin/staging` *only if exists* with a visible warning. No silent hardcoded base. (Mechanism is push-stdin `remote_sha`, not `symbolic-ref origin/HEAD` as F10 phrasing guessed — intent satisfied.) |
| F11 | flat | PASS | CI `setup-node` steps all use `node-version-file: '.nvmrc'`; `.nvmrc` = `20.19.0` (≥20). |
| F12 | flat | PASS (nuance) | `ci.yml` `ci-success` `needs:[…,audit-ai-docs]`; `audit-ai-docs` job runs `./scripts/audit-ai-docs.sh`. `workflow-integrity.yml` ships. `audit-self.yml` is intentionally framework-internal-only (correct per consumer-honesty — it references `packages/core/principles/`). |

**The cih-s3 layout-agnostic work (the headline of the umbrella) is verified correct** — R2 reaches flat `src/routes/` AND monorepo `apps/api/**`; stryker mutate globs cover both workspaces; lint-staged resolves under pnpm. Two independent Workers, two shapes.

## §2 REGRESSIONS — why the umbrella did NOT close clean (all confirmed in the shipped source, both Workers independently)

| ID | Sev | Finding | Source evidence | Fix (verified) | Acceptance to re-run |
|---|---|---|---|---|---|
| **R-S4-1** | **P1** | `templates/ts-server/eslint.config.mjs:104` ships invalid rule key `'@typescript-eslint/no-useless-catch'` (`no-useless-catch` is a **core** ESLint rule, not a `@typescript-eslint/` extension). ESLint flat-config throws on load → `npx eslint` / `npm run lint` / `validate` / lint-staged's eslint step **crash on every ts-server consumer** → R2/R7/R8 never run via the documented entrypoint. The framework's **own** root config has no such line (cold-QA: clean) → CI green, consumer dead = textbook `T-CIH-A`. Already on `main` via #488. | shipped line 104 (cold-QA grep); both Workers reproduced `TypeError: Could not find "no-useless-catch" in plugin "@typescript-eslint". Did you mean "@/no-useless-catch"?` | swap to core `'no-useless-catch': 'error'` (line 104) → config loads AND R2 still fires on the flat handler. **1 line.** | fresh ts-server install → `npx eslint .` loads (no config crash) AND R2 fires on a `schema.parse` handler. |
| **R-S4-2** | **P2** | Documented `npm install` (install.sh:656) does not yield a working toolchain: (a) `eslint@^10` is peer-incompatible with `typescript-eslint@^8.59` (which peers `eslint ^8.57 || ^9`) → ERESOLVE, and the config crashes under eslint 10 (`Class extends value undefined`); (b) **`tsx` absent** from the dep list though `.husky/pre-push` hard-requires `node --import tsx/esm` → fresh-install pre-push TS arm crashes `ERR_MODULE_NOT_FOUND`; (c) `eslint-plugin-vitest` is the legacy package name (modern: `@vitest/eslint-plugin`); (d) `@stryker-mutator/typescript-checker` missing though shipped stryker config sets `checkers:["typescript"]` → full mutation run can't load the checker. | install.sh:656-664 (cold-QA); both Workers had to deviate from Next-steps to get a coherent tree (installed eslint@9 + tsx + @vitest/eslint-plugin). | Next-steps → `eslint@^9`; add `tsx`; rename to `@vitest/eslint-plugin` (+ config import:8); add `@stryker-mutator/typescript-checker`. | copy-paste the Next-steps `npm install` verbatim on a fresh consumer → installs without ERESOLVE → `npx eslint .` loads → `git push` runs the TS hook (tsx present). |
| **R-S4-3** | **P3** | F13 residual: `patch_stryker_package_manager()` keys on `[ -f pnpm-lock.yaml ]` **at install time** (install.sh:223, called :536/:548), but canonical flow is `install.sh` → *then* `pnpm install`, so the lockfile doesn't exist yet → pnpm consumers keep `"packageManager":"npm"`. Logic is sound (re-running install after the lockfile exists yields `pnpm`), it just never re-fires on the documented order. | cold-QA install.sh:223; monorepo Worker FAIL (`"packageManager":"npm"` with `pnpm-lock.yaml` present). | re-detect post-`install` (e.g. derive from `packageManager` field / detect at first `stryker run`), or document a post-install re-run. | fresh pnpm monorepo, canonical order → `stryker.config.json packageManager` == `pnpm`. |
| **R-S4-4** | **P3** | Shipped `packages/core/templates/shared/tsconfig.json` (→ consumer root, install.sh:430) is single-package (`include:["src/**"]`, `rootDir:"src"`). The cih-s3 layout-agnostic work covered eslint globs + stryker mutate + lint-staged cwd, **but not tsconfig project scope** → on a monorepo, type-aware ESLint (project service) can't reach `apps/*`/`packages/*` until the consumer widens `include`. Adjacent to the exact class cih-s3 fixed. | cold-QA install.sh:430 + shipped tsconfig; monorepo Worker (`Parsing error: … not found by the project service`). | make the shipped tsconfig `include` layout-aware (`src/**`, `apps/*/src/**`, `packages/*/src/**`) or document the monorepo widen-step. | monorepo install → type-aware ESLint reaches `apps/api/**` without a tsconfig edit. |

**Not framework defects (environmental, recorded for completeness):** `acorn-walk@8.3.5` ETARGET is an upstream `dependency-cruiser` transitive (not pinned by the framework — cold-QA confirmed); pnpm's symlinked-store breaks stryker's runtime *plugin auto-discovery* (separate from F5's mutant-discovery verdict, which passed).

## §3 Routing (per kickoff §4 scope-fence + meta-launch §2)

S4 is a verify-stage: it **surfaces** regressions, it does **not** fix mid-verify (kickoff §4: «unless trivial + maintainer-invited»; R-S4-1 is trivial but a fix pushes to `staging` over code already promoted to `main` = shared-state, the maintainer's call to time). Recommendation: **a fix-stage S5** addressing all four (related install-template-accuracy fixes), then re-verify both shapes and write an evidence-backed `done.md`. The existing `done.md` (#493) remains the historical close record; it should be superseded/annotated by the S5 close, not silently edited by this verify-stage.

## §4 §1.7 self-reflexive note

- **Forward-check:** complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (verification ran under the session subscription, zero API-billed calls), [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md) (T3 command+output per finding; T1 all 14+ items both shapes; T19 orchestrator cold-QA re-grepped every load-bearing claim against the shipped source before recording; T-CIH-A install into BOTH shapes), and [reviewer-discipline.md §2](../../../.claude/rules/reviewer-discipline.md) (the fix-vs-defer strategy is surfaced, not decided by this stage).
- **Backward-check:** this record is the missing S4 output the meta-launch state flagged («No `cih-s4-verify` PR exists … S4 never ran»). It does not supersede any existing rule; it routes 4 new findings to a fix-stage and confirms the S1/S2/S3 fixes live. `done.md` clean-close (#493) is documented as premature, not rewritten.
