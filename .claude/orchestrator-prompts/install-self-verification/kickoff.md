# install-self-verification — single-PR implementation kickoff

> **Type:** single buildable implementation kickoff (NOT a meta-launch / umbrella index — no Stage gates, no Sub-wave table, no Launch table). Dispatch this file directly to aif; it produces code + one PR to `staging`.
> **Authoritative for:** the install-time self-verification capability (fences fire / shields block) — scope, deliverables, acceptance. NOT authoritative for project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists).
> **Base:** `staging`. **Stack of record:** `react-next` (richest custom-rule set: R2/R7/R8 + R12/R14/R20). **$0-in-CI, deterministic, no network needed in the container.**

## 0. One-line goal

Make `./setup -y --full` **prove** — not just assert presence — that the fences it built **FIRE on bad input** and the shields it raised are **wired & active**, expose this as a repeatable consumer gate `npm run check:fences-fire` (+ `check:shields-up`) wired into `npm run validate`, and have the installer **self-run** the proof at the end of a `--full` install and print a firing summary.

## 1. Why (the verified gap — evidence)

The one-button pipeline is already built and shipping on `staging` (`fef73c20b`): 4-stack detect, live-research adapter (#805), fences (`40-configs.sh`: eslint custom-rule plugin → `eslint-rules-local/`, depcruise, stryker, CI), shields (`50-hooks.sh`: husky pre-commit/pre-push + `core.hooksPath=.husky`), and a consumer `validate` of 9 gates (`setup.d/70-deps.sh:68`).

**The single unbuilt thing:** the installer checks **presence/binding**, never **behaviour** — as a *shipped, multi-rule, consumer-runnable* capability.
- No installer layer and no consumer gate feeds a deliberately-bad sample to a rule and asserts non-zero exit. The RuleTester firing tests (`*.test.ts`) are deliberately **stripped** from the consumer payload (`setup.d/40-configs.sh:115`, repeated `:125`/`:136`) and live next to the rules in `eslint-rules-local/`, not under the consumer's `src/**` — so no firing test reaches or runs in the consumer.
- **Relationship to `tests/install-sh/f17-lint-rules-planted-violation.test.sh`:** f17 already proves R2 (`no-unsafe-zod-parse`) fires at install for ONE rule, via the ESLint `Linter` API — but it is a **repo-side CI test**, not a shipped consumer `npm run` gate, and it covers one rule. This umbrella **generalizes** f17 into a shipped, multi-fence, consumer-runnable gate. Reuse f17's proven mechanism (see §D1).
- `check:globs` proves a rule's globs match ≥1 file (not inert); `check:enforced` proves R2 is bound on boundary files. **Neither proves the rule REJECTS bad code.** `lint` runs ESLint on the consumer's *clean* code → passes whether or not the rule actually fires.
- `50-hooks.sh:69` sets `core.hooksPath` but nothing proves a bad commit/push is blocked; `99-finalize.sh:196` delegates that to a manual human Next-step.

This is exactly the operator's stated requirement: «в конце — что все работает и все падает когда надо и все ловит» / «установщик обязательно сам проверяет и тестирует что он все правильно настроил и что все щиты подняты и все заборы построены».

## 2. Scope boundary (do NOT expand)

- **IN:** install-time paired-negative firing probe + shields-wired gate + `validate` wiring + installer self-run summary, for the **known shipped custom rules** of the **react-next** stack (and any universal-core rule enabled there).
- **OUT (do NOT touch):** multi-stack rule parity (react-native/spa/ts-server recipe coverage), the live-research/MCP adapter redesign (#805 is shipped and correct), Pipeline B internals, the dead `installer/cli.ts` `rules-as-tests-install` bin. Any of these → leave a one-line `## Out-of-scope observations` note in the PR body, do NOT implement (CLAUDE.md «PR strategy»).
- **Reconciliation with `getff-to-prod` U3 `modular-install-fullpack` S5:** U3/S5 is a **one-time dogfood acceptance** («`./setup -y` on timeliner installs fullpack AND a rule fires there»). THIS umbrella ships the **reusable, shipped self-verification capability** that S5 would then consume. Distinct surfaces, no overlap in files. State this distinction in the PR body.

## 3. Deliverables

### D1 — `check:fences-fire` (the heart: rules fail-when-they-should)

A new dependency-free bash gate `packages/core/audit-self/check-fences-fire.sh`, shipped to the consumer exactly like its siblings:
- Add a `copy_safe` + `chmod_safe +x` for it in `setup.d/40-configs.sh` next to the `check-rule-globs.sh` / `check-rule-enforced.sh` copies (the precedent block at `40-configs.sh:~20-40`). Consumer path: `scripts/check-fences-fire.sh`.
- **Firing mechanism — REUSE the proven f17 technique, NOT the eslint CLI.** `tests/install-sh/f17-lint-rules-planted-violation.test.sh:32-36,80-149` documents that `eslint <file>` with the real flat config crashes (`ERR_REQUIRE_CYCLE_MODULE` / `ERR_UNKNOWN_FILE_EXTENSION ".ts"`). It instead drives the ESLint **`Linter` API via tsx**, locates the framework's own binary (`$REPO_ROOT/node_modules/.bin/eslint`, `/app/node_modules/.bin/eslint`) and symlinks that `node_modules` into the scratch consumer, and **SKIPs cleanly** when no eslint is resolvable. The probe MUST follow this: resolve eslint via local-bin → `npx --no-install` (never a fresh `npm install` — the container has no npm-registry network), run via the `Linter` API (or `npx --no-install eslint` only if a local bin is present), and SKIP-with-guidance (rc=0) when eslint is absent — mirroring `check-rule-enforced.sh:86-97` for the resolution half.
- **Two fence classes (react-next has both):** each fixture declares the `expect-rule-id` it must trigger.
  - **Class 1 — standalone module rules** (id = the rule itself): `no-unsafe-zod-parse` (R2, core), `no-direct-time-randomness` (R7, core, opt-in), `require-otel-span` (R8, core, opt-in), `no-server-imports-in-client` (R12, next preset). On the bad fixture eslint reports *that* id.
  - **Class 2 — declarative recipes** enforced via the wrapper rule `rules-as-tests/restricted-syntax-audit-exempt` (this is how R14/R20 + the 10 `appliesTo:["next"]` recipes are enforced after they were migrated out of standalone rules — see `packages/preset-next-15-canonical/eslint-rules/index.ts:3-14`). On the bad fixture eslint reports `restricted-syntax-audit-exempt` (assert that id + that the message names the recipe). Ship at least one Class-2 fixture so the declarative tier is proven to fire too.
  - Do **NOT** assert R14/R20 report `require-form-safe-parse`/`require-use-server-directive` — those standalone rules no longer exist; the wrapper id fires instead.
- **Fixtures:** ship a curated bad/good pair per covered fence under `packages/core/audit-self/fixtures/fences-fire/<short-id>.bad.<ext>` + `.good.<ext>` (the `audit-self/fixtures/` dir exists). Copy the whole `fences-fire/` subtree to the consumer (`scripts/fences-fire-fixtures/`) in `40-configs.sh`. Each `.bad` MUST be the minimal snippet the fence is designed to reject (cross-checked per T-ISV-A); each `.good` MUST be the closest-passing counterpart (true paired-negative, not an unrelated clean file).
- **Algorithm:** iterate the shipped fixtures; for each, resolve whether its `expect-rule-id` is **enabled** in the consumer's applied config (`eslint --print-config` per `check-rule-enforced.sh`). If enabled: bad fixture MUST exit non-zero AND surface `expect-rule-id` (fires; exit 0 ⇒ FAIL «fence did NOT fire — silently inert»); good fixture MUST exit 0 (non-zero ⇒ FAIL «false-positive»). Enabled-but-no-fixture ⇒ WARN (coverage gap, list it); fixture-but-rule-disabled ⇒ skip silently.
- **R7/R8 nuance:** opt-in behind `AIF_STRICT_RUNTIME=1`. Treat «not enabled in applied config» as *skip*, never *fail* — only enabled fences are required to fire.

### D2 — `check:shields-up` (shields wired & active)

A new `packages/core/audit-self/check-shields-up.sh`, shipped the same way (consumer `scripts/check-shields-up.sh`). Asserts:
- `git config core.hooksPath` resolves to `.husky` (FAIL otherwise — today this is only echoed in Next-steps).
- `.husky/pre-commit` and `.husky/pre-push` exist, are executable, and reference the expected gate commands (grep for the real invocation, not an empty stub).
- **Behavioural smoke (include if tractable within this PR; else ship the wiring gate above and note the behavioural smoke as the single fast-follow in the PR body):** invoke the *shipped* hook against a known-bad fixture in a throwaway temp sandbox and assert non-zero — **without** mutating real git state (no real commit/push; operate in a `mktemp -d` scratch or via direct gate-script invocation). NOTE: a consumer install ships `.husky/` + `scripts/` + `eslint-rules-local/`, **not** `packages/core/` — so the consumer `.husky/pre-push` targets a *shipped* gate, not the framework's `packages/core/hooks/pre-push.ts`. The smoke must invoke the shipped hook/gate path (or, repo-side only, the `PREPUSH_ONLY=…` seam in `pre-push.ts:567-583`). Do not assume `pre-push.ts` exists in the consumer.

### D3 — wire into `validate` + installer self-run

- Add `check:fences-fire` and `check:shields-up` to the consumer `scripts` block AND to the `validate` aggregate in `setup.d/70-deps.sh` (the `npm-run-all2 --parallel …` line at `:68`). Place them as members so `npm run validate` now contains a genuine fails-when-it-should assertion.
- **Installer self-run (the capstone):** at the end of a `--full` install, run both gates and print a summary, e.g. `✓ self-verify: N/N fences fired on bad input, shields wired & active`. Put this in `setup.d/99-finalize.sh` (or a new `setup.d/90-verify.sh` sourced before finalize — your call; keep lexicographic order). MUST be FULL-gated, MUST degrade gracefully when eslint/deps absent, and MUST NOT run on the CI self-install path (CI self-install never sets `FULL`; verify the `$0-in-CI` self-install byte-identical/principle-28 path is preserved — see `80-rule-bootstrap.sh:14-16,25-27` for the exact guard pattern to mirror).

## 4. Recursive self-application (mandatory — T15)

The probe must itself be falsifiable. Add a paired-negative meta-test proving `check-fences-fire.sh` **FAILS when a fence is silently broken**:
- A test (bash `*.test.sh` under `packages/core/audit-self/` mirroring `run-bash-mutation.test.ts`/`md-line-gate.test.ts`, OR a vitest `*.test.ts`) that builds a tiny fixture project where rule X is present-but-disabled (or neutered) and asserts `check-fences-fire.sh` exits non-zero with the right message; and a positive case where all fences fire and it exits 0. A probe that can't fail is `#discipline-theatre`.
- Wire any new `tests/install-sh/*.test.sh` you add into `.github/workflows/audit-self.yml` (the install-sh meta-gate is «armed-but-not-fired» if a new test isn't added as a step — this bit PR #796; do NOT repeat it).

## 5. Build-vs-reuse + capability-commit (mandatory)

- This adds new gate scripts ≥80 LOC → **capability commit**. Before writing, consult `docs/meta-factory/prior-art-evaluations.md` (SSOT) for an «install-time rule-firing self-test» analog and run the §3 BFR mechanism (DeepWiki/WebSearch ≥3 phrasings — is there a production tool that proves an installed lint rule fires on bad input?). Expected verdict **BUILD** (the shipped, consumer-runnable, multi-fence paired-negative-at-install slice is project-specific), but you MUST cite evidence. Add a new SSOT entry — **verify the max id first** with `grep -oE '^\| *[0-9]+ ' docs/meta-factory/prior-art-evaluations.md | grep -oE '[0-9]+' | sort -n | tail -1` (current max = **183**, so the new entry is **#184**; the entries are pipe-table rows, NOT `### #N` headings) — with Verdict/Rationale/Trigger, and carry a `Prior-art:` trailer on the capability commit (CLAUDE.md «`Prior-art:` trailer syntax»).
- **Cite existing SSOT, do not re-introduce:** ESLint `RuleTester` is already **SSOT #154 (ADOPT)** — the framework's *author-time* firing harness. The consumer can't run RuleTester (test files stripped from payload), which is *why* a shipped bash firing-gate is needed; the new #184 BUILD slice is the *shipped, consumer-runnable, multi-fence* gate, distinct from #154's author-time unit harness. Also reference **#153 (ci-tool-pinning)** as the precedent for «deterministic bash gate guarding a CI/install surface». Make these the BUILD justification.

## 6. Acceptance criteria (verify-before-harvest — the orchestrator checks these at harvest)

1. `bash packages/core/audit-self/check-fences-fire.sh` self-test (D4) is **non-vacuous**: proven to FAIL when a fence is neutered, PASS when all fire.
2. A `tests/install-sh/install-self-verification.test.sh` (mirroring `f17-lint-rules-planted-violation.test.sh`'s harness — scratch consumer via `E=$(mktemp -d)` + `bash "$REPO_ROOT/install.sh" <stack> --force` per f17:47-49, framework `node_modules` symlinked in, eslint resolved from the framework bin, **no fresh `npm install`**, SKIP-clean when eslint absent) proves: after install, `check:fences-fire` exits 0 AND names each fired fence; flipping one covered fence to `off` in the scratch config → the gate exits non-zero. Wire this new test as an explicit `run:` step in `.github/workflows/audit-self.yml` (no glob runner — PR #796 lesson).
3. `npm run validate` in that consumer includes and runs `check:fences-fire` + `check:shields-up`.
4. The installer self-run prints the firing summary on `--full` and is silent/no-op on the CI self-install path (principle-28 byte-identical preserved → run `SNAPSHOT_MODE=capture bash tests/install-sh/snapshot.sh` if baselines shift, since shipping new scripts changes install fingerprints — the `byte-identical.test.sh` wrapper hardcodes compare and ignores env).
5. Repo-side `npm test --workspaces` + principle meta-tests green; new shipped scripts carry whatever principle-09/doc-authority registration they need (if a new shipped `.md` is added, register in `REQUIRED_HEADER_DOCS` + `install.sh SHIPPED_DOCS` — bash scripts themselves don't need a header, but double-check the principle suite doesn't watch the new path).
6. PR body has `### §1.7 Forward-check applied` + `### §1.7 Backward-check applied` (each ≥40 chars, ≥1 file:line) — the `discipline-self-check.yml` CI gate requires them.

## 7. AI-laziness traps (per [.claude/rules/ai-laziness-traps.md §2-§3](../../../.claude/rules/ai-laziness-traps.md))

**Active traps for this task:** T2, T3, T5, T11, T15, T16.
- **T2** («my probe *would* catch it») — do not write `# would assert non-zero`; actually run eslint on the bad fixture and check the exit code in the script.
- **T3** (no prose-only findings) — every acceptance claim in the REPORT/PR body carries a command + its observed exit code/output.
- **T5** (no drive-by) — stay in §2 scope; surface multi-stack/anything-else as an observation, do not implement.
- **T11/T16** — run the BFR mechanism (§5); do not assume «obviously BUILD» without the SSOT consult + cite; verify our problem-class (prove an *installed* rule fires on bad input) ≠ RuleTester's (author-time rule unit test).
- **T15** (self-application) — §4 is mandatory; the probe that proves fences fire must itself be proven able to fail.
- **Domain-specific — `T-ISV-A` «fixture that doesn't actually trigger the rule»:** a `.bad` fixture that the fence ignores (wrong construct) makes the probe pass for the wrong reason — a green that proves nothing. Counter, per class: for **Class-1 standalone rules**, confirm the snippet against the rule's own `*.test.ts` `invalid` case before shipping it. For **Class-2 declarative recipes** (no standalone rule unit test exists), confirm the construct is genuinely forbidden by the recipe's `restricted-syntax` config / its parity test — assert the planted construct matches the recipe's selector, not merely that *some* lint error appears.

## 8. Output contract

- One branch off `staging`, one PR `--base staging`. Conventional-commit subjects; capability commit carries the `Prior-art:` trailer.
- Do NOT push to `main`. Do NOT open multiple PRs.
- REPORT (returned to the harvesting orchestrator): files changed (path:line), the fences-fire self-test output (both the FAIL-when-neutered and PASS-when-firing runs), the fresh-install `check:fences-fire` output, `npm test --workspaces` result, and the SSOT entry id added. Confidence + ATTN.
