<!-- scope:session-work-verification -->
# Session-work verification — hostile cold re-verification of PR #598 + #599

> **Date:** 2026-06-17
> **Slug:** session-work-verification
> **Type:** verification (independent, hostile cold re-run — **no source mutation**; this patch RECORDS verdicts, it fixes nothing).
> **Umbrella:** `session-work-verification` (single-stage cold audit; dispatched by `/pipeline` for autonomous aif-handoff, base `e57fdbb`).

---

## §0 Method + environment caveat (read first — T14 / T-Verify-A)

CI green on #598/#599 is **not** the proof relied on here: CI runs only `vitest run principles/` + a few bash steps; it does **not** execute the `packages/core/hooks/` vitest suite where #548/#568's own tests live. Every behavioural verdict below comes from **re-running the named tests in this runtime** and quoting their output.

**Environmental caveat (load-bearing).** This container's *working tree* shipped with an **uncommitted revert** of the #548 fix in the dogfood copy `.claude/hooks/deps-hash-check.sh` (present in the session-start `git status` snapshot — `M .claude/hooks/deps-hash-check.sh`). That revert is **not part of any commit / PR**; it is container/working-tree contamination. Running the hook suite against the dirty tree produces 2 *false* failures (see §2). To verify the **committed** work honestly I ran every test against a **clean detached worktree of `HEAD` (e57fdbb)** via `git worktree add --detach /tmp/clean-head-wt HEAD`. All command output below is from that clean worktree unless stated. This is exactly the T-Verify-A trap (mistaking environment for code) avoided in the opposite direction: I did **not** let a dirty-tree failure masquerade as a real BLOCKER.

Toolchain note: container is `NODE_ENV=production` so devDeps (vitest) were absent; re-installed with `NODE_ENV=development npm install --include=dev` before running suites.

---

## §1 — #549 stryker plugins (`templates/ts-server/stryker.config.json`)

**Verdict: VERIFIED (config + diagnosis) / INCONCLUSIVE-needs-consumer (mutation-run behaviour).**

- File is valid JSON: `node -e "JSON.parse(readFileSync('templates/ts-server/stryker.config.json'))" → VALID JSON`.
- The `plugins` array is present and exactly as specified:
  ```json
  "plugins": ["@stryker-mutator/vitest-runner","@stryker-mutator/typescript-checker"]
  ```
- The PR #598 hunk (`git diff 4f8ed0f^ 4f8ed0f -- templates/ts-server/stryker.config.json`) **adds** precisely those 4 lines (`+  "plugins": [ … ]`) and nothing else in that file.
- Diagnosis confirmed against the config + commit message: the config already sets `"checkers": ["typescript"]` but had no `plugins` array; under pnpm's isolated `node_modules` layout Stryker's plugin auto-discovery cannot see `@stryker-mutator/{vitest-runner,typescript-checker}` → "no Checker plugins were loaded" → declaring `plugins` explicitly fixes initialization. This matches the issue's diagnosis (auto-discovery off → checkers not loaded).
- **Path note (non-blocking):** the kickoff named `packages/core/templates/ts-server/stryker.config.json`; the only stryker.config.json in the repo is at `templates/ts-server/stryker.config.json` (root templates) — which is the file PR #598 actually edited. Kickoff path is slightly off; the fix is in the correct (and only) location.
- **INCONCLUSIVE-needs-consumer:** proving the checkers actually *load at runtime* requires a consumer project with the stryker plugins installed and a real mutation run. Per kickoff §2 item 1 this is an acceptable verdict; **no mutation run was faked.**

## §2 — #548 deps-hash wording (`packages/core/hooks/deps-hash-check.sh` + `.claude/` dogfood copy)

**Verdict: VERIFIED.**

- **Committed copies byte-identical:** `cmp <(git show HEAD:.claude/hooks/deps-hash-check.sh) <(git show HEAD:packages/core/hooks/deps-hash-check.sh)` → exit 0 (IDENTICAL). Re-confirmed in the clean worktree: `cmp` → IDENTICAL.
- **Test suite (clean worktree):** `npx vitest run packages/core/hooks/deps-hash-check.test.ts` → **9 passed (9)**.
- **Behaviour split confirmed** by the passing tests:
  - real-mismatch path (`STORED_HASH=sha256-…`) STILL emits `package.json deps changed since last tool-bootstrap` (test "stale baseline" green);
  - ONLY the `<pending …>` unbaselined path changed to `tool decisions not yet baselined` (test "UNBASELINED … NOT 'deps changed'" green);
  - the byte-identity test (`source == dogfood`) green.
- **Dirty-tree caveat:** against this container's contaminated working tree the same command reports `2 failed | 7 passed` — both failures (`UNBASELINED…` line 148, `byte-identical` line 266) are caused **solely** by the uncommitted revert of `.claude/hooks/deps-hash-check.sh` (the tests read that file on disk via `HOOK = resolve(REPO_ROOT,'.claude/hooks/deps-hash-check.sh')`, git.ts:34). These are **NOT** code failures — the committed fix passes 9/9. Recorded per T14 (clean-but-environment-broken ≠ code-broken).

## §3 — #568 pre-push base-ref (`pre-push.ts`, `pre-push.fallback.sh`, `utils/git.ts`)

**Verdict: VERIFIED.**

- `npx vitest run packages/core/hooks/utils/git.test.ts` → **73 passed (73)** (clean worktree).
- `bash tests/hooks/prepush-upstream-ref.test.sh` → **9 pass / 0 fail**, exit 0 (incl. case 9 "fallback resolves origin/main → flags C2 → exit 1 (GH #568)").
- `bash tests/hooks/prepush-fallback-base-ref.test.sh` → **6 pass / 0 fail**, exit 0 (incl. FB5 "fallback resolves origin/main → exit 1 (GH #568)").
- **Dual-pair, NOT cosmetic-on-one-side:**
  - TS channel — `resolveDefaultBase()` defined at `packages/core/hooks/utils/git.ts:99`, resolving `origin/HEAD` symbolic-ref (line 103) then first-existing of `['origin/staging','origin/main','origin/master']` (line 106); wired into `pre-push.ts:126` (`const def = resolveDefaultBase()`, imported line 41).
  - bash channel — `pre-push.fallback.sh:53-54` runs `git symbolic-ref --short refs/remotes/origin/HEAD` then loops `for ref in "${default_ref}" origin/staging origin/main origin/master`, with an inline comment "dual-pair with pre-push.ts resolveDefaultBase (GH #568)".
  Both channels carry the real resolution logic; PR #598 touched both (`pre-push.ts +17`, `pre-push.fallback.sh +23`, `utils/git.ts +29`).

## §4 — CI gate intact

**Verdict: VERIFIED.**

- `npm --prefix packages/core run test:principles` (clean worktree) → **24 test files passed; 205 passed | 1 skipped (206)**, duration ~33s. Meets the "206+ green" bar (206 tests, 0 failing). The single skip is a pre-existing `.skip` in the suite, not a regression introduced by #598/#599.

## §5 — #599 two kickoffs sound

**Verdict: VERIFIED.**

- Both files exist: `.claude/orchestrator-prompts/consumer-upgrade-path/kickoff.md`, `.claude/orchestrator-prompts/aif-init-passport-gen/kickoff.md`.
- **Principle 12 (ai-laziness kickoff citation) green:** `npx vitest run packages/core/principles/12-ai-laziness-traps.test.ts` → **7 passed**. Principle 12 globs every real (non-symlink, non-exempt) `kickoff.md` under `.claude/orchestrator-prompts/` (test source lines 82-86); neither new dir is on the EXEMPT allowlist, so the green pass covers both.
- **§3 obligations present (verified directly, not just via the green test — T7):**
  - rule citation — both cite `[.claude/rules/ai-laziness-traps.md §2]` in their §6.
  - T-enumeration — `consumer-upgrade-path`: **T2, T3, T11, T12, T15, T16**; `aif-init-passport-gen`: **T2, T11, T12, T13, T15, T16**.
  - ≥1 domain-specific trap — `T-Upgrade-A` (framework-owned allowlist guessing → irreversible clobber) and `T-Passport-A` (hardcoding the reference stack into the generator).
- **Links resolve:** all relative `../../../…` links in both kickoffs resolve on disk (5/5 and 6/6 OK — ai-laziness-traps.md, kickoff-staging-placement.md, prior-art-evaluations.md, install.sh, INSTALL-FOR-AI.md, dual-implementation-discipline.md, no-paid-llm-in-ci.md).

## §6 — No drive-by damage

**Verdict: VERIFIED.**

- PR #598 (`4f8ed0f`) touched **exactly** its 10 declared files (3 fixes): `templates/ts-server/stryker.config.json`; `{.claude,packages/core}/hooks/deps-hash-check.sh` + `deps-hash-check.test.ts`; `packages/core/hooks/{pre-push.ts,pre-push.fallback.sh,utils/git.ts,utils/git.test.ts}`; `tests/hooks/prepush-{upstream,fallback-base}-ref.test.sh`. No out-of-scope file.
- PR #599 (`f9537af`) touched **exactly** 2 kickoff files (the two §5 kickoffs).
- PR #600 (`e57fdbb`) touched **exactly** 2 kickoff files (`session-work-verification/kickoff.md`, `hook-test-suite-rot/kickoff.md`) — the `/pipeline` pass that generated this very task; in scope for what it is.
- No source/test/doc file outside the declared sets was modified by the session.

---

## §7 — Out-of-scope confirmations (per kickoff §Out-of-scope)

- The ~15 failing `packages/core/hooks/` tests (separate `hook-test-suite-rot` umbrella) were **not** investigated or fixed here. Note: against the *clean* HEAD worktree, the three named hook suites under verification (`deps-hash-check`, `utils/git`, both prepush bash) are **fully green** — so the "rot" lives in other hook tests, not in the suites #548/#568 touched. No edit was made to any source or test file.

---

## §8 — Post-write principle check (kickoff §3 obligation)

After writing this file, per kickoff §3 I ran the scope-annotation check and the full gate **in the working directory**:

- `npx vitest run packages/core/principles/10-research-patch-annotation.test.ts` → **5 passed (5)** — this file's `<!-- scope:session-work-verification -->` first-line annotation is valid; **principle 10 is not broken.** No annotation fix needed.
- The full `npm --prefix packages/core run test:principles` in the working tree reports `1 failed | 204 passed | 1 skipped` — the one failure is **principle 14 (skill-drift), and it is environmental, not introduced by this file**: it flags 27 template-placeholder "broken refs" in `.claude/skills/aif-docs/SKILL.md`, which is **gitignored** (`.gitignore:41 → /.claude/skills/aif-*/`) and untracked. It is present in this local container but absent from a clean `git` checkout — which is exactly why the same gate ran **206 all-green on the clean HEAD worktree** (§4) and why CI (fresh checkout, no gitignored skills) is unaffected. My new file is implicated in **zero** broken refs (grep for `session-work-verification`/`research-patches` in the principle-14 output → no match). Recorded per T14 / T-Verify-A: environment ≠ code.

---

## Overall verdict

**PASS — all 6 acceptance items clear, no BLOCKER.** Five VERIFIED with command output / file:line; #549's mutation-run behaviour is **INCONCLUSIVE-needs-consumer** (config + diagnosis verified; runtime checker-loading needs a consumer — not faked). The committed work of PR #598 + #599 is correct and behaves as claimed when tested in a clean runtime.

**One environmental flag for the orchestrator (not a code defect):** this container's working tree carries an uncommitted revert of `.claude/hooks/deps-hash-check.sh` that makes the deps-hash suite report 2 false failures if run against the dirty tree. The committed copies are byte-identical with the fix and pass 9/9 on clean HEAD. The verdict commit on this branch contains **only** this report; the contamination is not committed and will not be harvested.
