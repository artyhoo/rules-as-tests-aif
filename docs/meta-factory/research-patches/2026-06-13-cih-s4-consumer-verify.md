<!-- scope:consumer-install-hardening-S4 -->
# consumer-install-hardening — S4 consumer-liveness verification + S5 fix

> **Verify+fix record for the `consumer-install-hardening` umbrella.** S4 (verify) run by `/orchestrator consumer-install-hardening S4` (Mode A, two parallel verification Workers, one per consumer shape); S5 (fix) folded in after the maintainer authorised a fix-stage. Folder authority inherited from [research-patches/README.md](README.md); scope-bound to the S4 re-verify gap + the regressions it surfaced.
> **Verdict in one line:** **S1/S2/S3 shields verified LIVE on real flat-Hono + pnpm-monorepo consumers; S4 then caught a config-load regression (R-S4-1, P1) + 3 install-completeness defects invisible from the source repo (the `T-CIH-A` failure S4 exists to catch); S5 fixed all of them across every shipped install surface and re-verified live.**

## §0 What ran (T3 — real toolchain, both shapes)

Framework source = staging tip `b6096914` (#494), fetched via `gh api tarball/staging` (git transport tunnel-blocked, api alive). Installed into **two real consumer shapes** (`git init`, default branch `main`), then real `npm`/`pnpm install` so eslint/stryker/lint-staged/hooks execute:
- **Flat Hono** (`src/routes/`, no DDD) — `install.sh ts-server --force`.
- **pnpm monorepo** (`pnpm-workspace.yaml`, `apps/*`+`packages/*`, no root `src/`) — `install.sh ts-server --force` at root.
Node v24.3, npm 11.4, pnpm 10.19.

## §1 PASS matrix — S1/S2/S3 shields ARE live (command+output evidenced)

| F# | shape | verdict | evidence |
|---|---|---|---|
| F3 | flat | PASS | `npx eslint src/routes/users.ts` → `error … (R2) rules-as-tests/no-unsafe-zod-parse`. V-gate `check-rule-globs.sh` green. |
| F3 | monorepo | PASS | `npx eslint apps/api/src/handlers/health.ts` → R2 error — globs REACH `apps/api/**`. |
| F5 | monorepo | PASS | stryker instrumentation → `Found 3 of 123 file(s) … 16 mutant(s)` across `apps/*/src`+`packages/*/src`. |
| F7 | both | PASS | default eslint → R7/R8 silent; `AIF_STRICT_RUNTIME=1` → both `no-direct-time-randomness` fire. |
| F14 | monorepo | PASS | stage `apps/api/src/x.ts` → `git commit` → `[COMPLETED] eslint --fix`, no ENOENT; per-package `.lintstagedrc.json` stubs. |
| F15 | both | PASS | `prettier --check .ai-factory/RULES.md` → ignored (diff vs `--ignore-path /dev/null` proves `.prettierignore`). |
| F1/F2 | both | PASS | `core.hooksPath=.husky`; pre-push routes to TS-core; staged R2 violation → commit BLOCKED. |
| F6/F8/F8b/F8c/F9/F10/F11/F12 | flat | PASS | audit-r4 caller resolves; AGENTS scripts honest; no `factory/RULES` dead-ref; no husky-init clobber advice; `/aif-verify` conditional-only; base-ref derived not hardcoded; CI `node-version-file:.nvmrc`; `ci-success`→`audit-ai-docs.sh`. |

The cih-s3 layout-agnostic work is verified correct on both shapes.

## §2 REGRESSIONS S4 caught — and S5 fixes (all confirmed in shipped source + re-verified live)

| ID | Sev | Finding | S5 fix | Re-verify (fresh consumer, patched source) |
|---|---|---|---|---|
| **R-S4-1** | **P1** | `templates/ts-server/eslint.config.mjs:104` (+ react `eslint.config.react.mjs:93`) shipped invalid rule key `'@typescript-eslint/no-useless-catch'` (it is a **core** ESLint rule). ESLint flat-config threw on load → `npx eslint`/`npm run lint`/lint-staged crashed on **every** consumer → R2/R7/R8 never ran via the documented entrypoint. Framework's own config was clean (CI green, consumer dead = `T-CIH-A`). Also `eslint-plugin-vitest` (renamed → `@vitest/eslint-plugin`) imports in both configs. | swap to core `'no-useless-catch'` in both configs; import → `@vitest/eslint-plugin`; header `^10.0.0`→`^9.0.0`; correct the 2 doc refs (`audit-ai-docs.sh:92`, `RULES.md:168`) that named the phantom rule. | `npx eslint src/routes/users.ts` → loads (no `Could not find "no-useless-catch"`) AND `error … (R2) rules-as-tests/no-unsafe-zod-parse`. |
| **R-S4-2** | **P2** | Documented installs did not yield a working toolchain: `eslint@^10` peer-incompatible with `typescript-eslint@^8.59`; `tsx` absent though `.husky/pre-push` requires it; legacy `eslint-plugin-vitest`; `@stryker-mutator/typescript-checker` missing though stryker config sets `checkers:["typescript"]`. | install.sh Next-steps + `setup.sh` COMMON_DEPS + `INSTALL.md`: `eslint@^9`, `@vitest/eslint-plugin`, **+`tsx`**, **+`@stryker-mutator/typescript-checker`**, pin **`@eslint/js@^9`** (unpinned grabbed v10 → ERESOLVE on next install), **+`@typescript-eslint/utils`** (shipped custom rules import it; pnpm-strict doesn't hoist it → eslint crashed on pnpm). | patched Next-steps eslint subset installs (eslint 9.39 + ts-eslint 8.59 + @vitest/eslint-plugin 1.6 + tsx 4.22) without ERESOLVE; `node --import tsx/esm` ok; eslint runs on pnpm after `@typescript-eslint/utils` added. (Upstream `acorn-walk@8.3.5` ETARGET via dependency-cruiser is NOT a framework defect.) |
| **R-S4-3** | **P3** | `patch_stryker_package_manager` keyed only on lockfile presence **at install time**, but canonical flow is install→*then* `pnpm install` → pnpm monorepos kept `"packageManager":"npm"`. | also key on `pnpm-workspace.yaml`/`.yarnrc.yml` (present pre-install) + `package.json` `packageManager` field (corepack source of truth, overrides markers). | fresh pnpm monorepo → install prints `✓ stryker packageManager → pnpm`; `stryker.config.json` → `"pnpm"`. |
| **R-S4-4** | **P3** | shipped `packages/core/templates/shared/tsconfig.json` was single-package (`include:["src/**"]`, `rootDir:"src"`) → monorepo type-aware ESLint couldn't reach `apps/*`/`packages/*`. | broaden `include` to `["src/**/*","apps/*/src/**/*","packages/*/src/**/*"]`; remove `rootDir` (tsc infers — single-package emit unchanged, monorepo no longer errors "not under rootDir"). | `npx eslint apps/api/src/handlers/health.ts` on the monorepo → no "not found by the project service"; R2 + a type-aware `no-floating-promises` both fire (projectService reached `apps/api/src`). |

**Cold-review verdict (independent Opus reviewer, vs npm registry + DeepWiki + live tsc): GO, no BLOCKER.** All 8 edits present + correct; `no-useless-catch` is core; `@vitest/eslint-plugin` exposes `.configs.recommended.rules`; `eslint@^9 ↔ ts-eslint@^8.59` peers compatible; `@stryker-mutator/typescript-checker` required by the shipped checker config; tsconfig single-package emit unchanged (live tsc).

## §3 Scope notes

- **Install-surface parity:** R-S4-1/R-S4-2 lived identically on all three dep-bearing install surfaces (`install.sh` Next-steps, `setup.sh` COMMON_DEPS, `INSTALL.md`) and both stacks (ts-server + react-next configs). Fixing only `install.sh` would leave the same config-load crash on the headline `setup.sh` one-command path → S5 fixes all surfaces. setup.sh/INSTALL.md dep-set parity is verified by equivalence to the runtime-verified install.sh set (same names/pins), not a second end-to-end install.
- **react-next** config fix is mechanically identical to ts-server (verified at runtime); not separately runtime-installed (needs Next deps). Confirmed clean by grep.
- **Deferred MINOR (non-functional, separate trivial follow-up):** 3 *descriptive prose* mentions of the renamed `eslint-plugin-vitest` (`README.md:85`, `skills/rules-as-tests/SKILL.md:33`, `skills/rules-as-tests/references/ai-traps.md:69`) — no functional impact; left to avoid touching principle-test-watched skill files for a cosmetic swap in a tunnel-blocked env. Monorepo tsc emit now nests under `dist/apps/*/src` (correct, unavoidable without per-package configs).

## §4 §1.7 self-reflexive note

- **Forward-check:** complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (all verification under session subscription, zero API-billed calls), [ai-laziness-traps.md §2](../../../.claude/rules/ai-laziness-traps.md) (T3 command+output per finding; T1 all items both shapes; T19 orchestrator re-grepped every load-bearing claim against shipped source + ran an independent cold-review on the fix diff before push; T-CIH-A both shapes), and [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (fixes reuse existing deps/tooling; no new capability).
- **Backward-check:** this record is the S4 output the meta-launch state flagged missing. The clean-close (#493, S1–S3 basis) was premature; S5 makes the shields actually live across all install surfaces, after which `done.md` is updated to evidence-backed. No existing rule superseded.
