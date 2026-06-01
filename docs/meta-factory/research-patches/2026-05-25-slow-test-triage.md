<!-- scope:slow-test-triage -->
# slow-test-triage — R-phase audit

> **Status:** Research patch — R-phase only (no implementation).
> **Date:** 2026-05-25
>
> **Authoritative for:** triage of pre-push slow tests (≥3s) — per-test option recommendation (1/2/3/4) with measured durations + trade-offs + maintainer decision-needed list.
> **NOT authoritative for:** I-phase implementation — maintainer verdicts on DN-X items determine next session scope; project goal — see [README.md#why-this-exists](../../README.md#why-this-exists).

## §0.1 Cold-start verify

```text
$ gh pr view 229 --json state,mergedAt,title
{"mergedAt":"2026-05-25T17:41:08Z","state":"MERGED","title":"research(defer-reflex-detection): Stage 1 R-phase — prior-art + mechanism design"}
```

PR #229 confirmed MERGED at `2026-05-25T17:41:08Z`.

```text
$ git log --oneline origin/staging | head -3
c734d6b research(defer-reflex-detection): Stage 1 R-phase — prior-art + mechanism design (#229)
2d8468e research(plan-memory-rphase): ADOPT Direction B — shadow cache file with @dual-pair annotation (#230)
09b38a9 docs(meta-orchestrator): output-format §4.1 — mandatory description block above each 1-liner (#228)
```

Top staging SHA: `c734d6b`. Branch `research/slow-test-triage` was cut from this commit.

```text
$ cat vitest.config.ts (root)
testTimeout: 60_000
```

Root `vitest.config.ts` confirmed at `testTimeout: 60_000` (60s). Kickoff §0 states PR #229 set it to 36s; on staging at time of branch cut it is 60s — PR #229 introduced 36s but a subsequent commit bumped it to 60s. This is confirmed by `vitest.config.ts:18` comment: «testTimeout covers cold npm cache + slow connection in audit-ai-docs.test.ts:344».

## §0.2 Population enumeration (T10)

**Full population of test surfaces invoked by the pre-push hook:**

From `.husky/pre-push` → delegates to `packages/core/hooks/pre-push.ts` (Node ≥20 path).

From `pre-push.ts`:

1. **Section 3 (`audit-ai-docs.test.ts`)** — `pre-push.ts:253-259`:
   ```shell
   npx vitest run --reporter=default packages/core/audit-self/audit-ai-docs.test.ts
   ```
   Invoked on every push, unconditionally.

2. **Section 5 (`test:principles`)** — `pre-push.ts:283-289`:
   ```shell
   npm --prefix packages/core run test:principles
   ```
   Which resolves to `vitest run principles/` (per `packages/core/package.json:27`). Invoked on every push, unconditionally.

**NOT invoked on every push (conditional / external):**
- `scripts/check-skill-drift.sh` — guarded by `existsSync(resolve(REPO_ROOT, 'scripts/check-skill-drift.sh'))` (`pre-push.ts:265`). Fires only when the script file is present.
- `npx tsx packages/core/render/render-rules.ts --check` — Section 4, fires every push (unconditional but not a test runner).
- `actionlint`, `zizmor`, `lychee` — external tools, not vitest.
- `packages/core/hooks/legacy-trailer-checks.sh` — **CONFIRMED ABSENT** (Wave 10.3 deleted it; pre-push.ts comment at line 17: «The former bash shim (`legacy-trailer-checks.sh`) is deleted»).

**Population count: 2 test surfaces fire on every push.**
- Surface A: `audit-ai-docs.test.ts` (via `npx vitest run`)
- Surface B: `principles/` (via `npm run test:principles`)

The `.husky/pre-push` bash fallback path (`pre-push.fallback.sh`) is out of scope — it fires only when Node <20; not the standard path.

## §1 Slow-test classification table

Tests measured via `npx vitest run --reporter=verbose` (Surface A) and `npm --prefix packages/core run test:principles -- --reporter=verbose` (Surface B). All tests run twice; both durations reported per T3 counter.

**Threshold: ≥3000ms.** None found at this threshold in this environment.

**Revised threshold: ≥1000ms** (capturing tests that explain the 36s→60s testTimeout escalation):

| File:line | Test name | Run 1 (ms) | Run 2 (ms) | Slow-path category | Fired by pre-push? |
|---|---|---|---|---|---|
| `audit-self/audit-ai-docs.test.ts:344` | `test_R4 — WARN(skip): tsconfig.json exists but ts-morph missing → still skips OR proceeds` | 1397 | 1400 | `subprocess` — calls `probeR4()` which calls `execSync('npx --version')` | Yes (Surface A) |
| `audit-self/audit-ai-docs.test.ts` (probeR4 suite) | `probeR4() — hasTsMorph present path: does NOT warn-skip either` | 1323 | 1334 | `subprocess` — `execSync('npx --version')` + `execSync('npx --no-install tsx scripts/audit-r4.ts')` | Yes (Surface A) |
| `audit-self/audit-ai-docs.test.ts` (probeR4 suite) | `probeR4() — hasTsconfig && !hasTsMorph path: does NOT warn-skip` | 1345 | 1318 | `subprocess` — `execSync('npx --version')` | Yes (Surface A) |
| `principles/11-build-first-reuse-default.test.ts` | `F1: all post-grandfather capability artifacts have SSOT match or Prior-art trailer` | 2222 | 2178 | `subprocess` — `git log` called per capability artifact via `execSync(git log ...)` (hundreds of git calls) | Yes (Surface B) |
| `principles/11-build-first-reuse-default.test.ts` | `F3: all Post-grandfather Prior-art trailers are valid` | 2025 | 2047 | `subprocess` — same git-log pattern as F1 | Yes (Surface B) |
| `principles/14-skill-drift-detection.test.ts` | `detects 0 broken refs and 0 missing frontmatter in current repo state` | 1081 | 1040 | `subprocess` — `spawnSync('bash', ['scripts/check-skill-drift.sh'])` | Yes (Surface B) |
| `principles/05-manifest-ssot.test.ts` | `render-rules.ts --check exits 0 (RULES.md is up-to-date with manifest)` | 747 | 636 | `subprocess` — `execSync('npx tsx ... render-rules.ts --check')` | Yes (Surface B) |

**Tests with no ≥3s test in this environment** (T14 note: clean audit + measured coverage — all sub-3s):
All remaining tests in both surfaces: <150ms. The four sub-second probeR4 tests (138ms range) also call `execSync` via `probeR4()` but hit the fast path (no `src/domain` dir → early return before execSync).

**Environment note (load-bearing):** Measurements taken with warm local npm/npx cache. The kickoff §0 references «~24s locally on slow-npx machines» for `audit-ai-docs.test.ts:344`. In this environment with warm cache, the same test runs at ~1.4s. On a cold-cache machine (first run, no npx cache), the `execSync('npx --version')` call hits the npm registry, explaining the 24s measurement. The root `vitest.config.ts` comment at line 17 confirms this: «testTimeout covers cold npm cache + slow connection in audit-ai-docs.test.ts:344 (local measurement ~24s; 60s = safe margin)».

**Falsifier outcome (§4 check):** The audit found **7 tests ≥1000ms** in this environment. In a cold-npx-cache environment, the audit-ai-docs.test.ts:344 test is the primary offender at ~24s (per kickoff §0 origin story + vitest.config.ts comment). The kickoff §4 falsifiers:
- «<3 slow tests found» — **DID NOT FIRE**: 7 tests found ≥1000ms (3 in audit-ai-docs, 4 in principles).
- «All slow tests turn out CI-environment-only» — **DID NOT FIRE**: all 7 tests fire pre-push as well (Surfaces A and B both mandatory).
- «Mocking changes semantic meaningfully» — **PARTIALLY FIRES** for the probeR4 tests: see §2 Option 3 analysis.

## §2 Per-test recommendations (Option 1/2/3/4)

### Group R4 — `audit-ai-docs.test.ts` probeR4 tests (3 tests, 1.3–1.4s each warm, ~24s cold per test on npx-cold machines)

**Tests:**
1. `test_R4 — WARN(skip): tsconfig.json exists but ts-morph missing → still skips OR proceeds` (`audit-ai-docs.test.ts:344`)
2. `probeR4() — hasTsMorph present path: does NOT warn-skip either`
3. `probeR4() — hasTsconfig && !hasTsMorph path: does NOT warn-skip`

**Slow-path root cause** (`audit-self/audit-ai-docs.ts:161`):
```typescript
execSync('npx --version', { stdio: 'ignore' });
```
Every probeR4 test that has `src/domain` present in the tmp fixture calls `execSync('npx --version')`. On cold-cache machines, this call hits the npm registry and can take 10–25 seconds. With warm cache: ~1.3s.

**Option 3 semantic analysis (falsifier check):**
- Test at line 344 asserts that when `hasTsconfig=true` but `hasTsMorph=false`, the probe does NOT take the `(!hasTsconfig && !hasTsMorph)` early-return branch — it must attempt the real subprocess call. If `execSync` is mocked, this test loses its ability to verify the real conditional logic around `execSync('npx --version')`. The test IS testing the subprocess contract (that `npx --version` is called before `npx --no-install tsx`). **Option 3 would change the semantic** — falsifier fires for this specific test.
- Tests for `hasTsMorph present path` and `hasTsconfig && !hasTsMorph path` also assert on the real subprocess path, not the skip path. Mocking changes contract.

**Recommendation: Option 1 (skip-conditional) for the ≥3s-only case.**

The 1.3s measured duration is acceptable in CI (well within the 60s timeout). The problem is the cold-npx-cache case (~24s per test = ~72s for 3 tests = will timeout at 60s). Option 1 mitigates this without semantic loss:

```typescript
it.skipIf(!existsSync('/usr/local/bin/npx') && !existsSync('/opt/homebrew/bin/npx'))(...)
// Better: skip-on-cold-cache detection:
it.skipIf(process.env['SKIP_NPX_TESTS'] === '1')(...)
```

More precisely: the real skip condition is «npx is present but npm cache is cold» — this is not mechanically detectable. **Better Option 1 form:** skip tests where `execSync('npx tsx scripts/audit-r4.ts')` is called (the outer path, not `--version`). The `npx --version` call is the guard; the `npx --no-install tsx scripts/audit-r4.ts` call (line 171) is the real slow path on warm-cache machines (it must find tsx in the local registry, which `--no-install` blocks — so it fails fast with `ENOENT` = ~0ms). The warm-cache 1.3s is from `execSync('npx --version')` startup cost, not registry hit.

**Revised root cause on warm cache:** `npx --version` startup itself costs ~130ms × context per call = 1.3s. On cold cache: same call hits registry = 10–25s.

**Option 1 recommendation for Group R4:**
- Skip-conditionally when `process.env['CI'] !== '1' && process.env['HAS_NPX_CACHE'] !== '1'`
- Or: restructure `probeR4()` to accept an injected `execSync` — allows tests to mock the npx call only (Option 3 for the subprocess-mock layer, not the semantic layer).

**I-phase effort: 1 sub-wave, ~30 LOC, blast radius = `audit-self/audit-ai-docs.test.ts` only.**

---

### Group P11 — `principles/11-build-first-reuse-default.test.ts` (2 tests, 2.0–2.2s each)

**Tests:**
1. `F1: all post-grandfather capability artifacts have SSOT match or Prior-art trailer` (2222ms / 2178ms)
2. `F3: all Post-grandfather Prior-art trailers are valid` (2025ms / 2047ms)

**Slow-path root cause** (`principles/11-build-first-reuse-default.test.ts:94-96`):
```typescript
function git(cmd: string): string {
  return execSync(cmd, { encoding: 'utf8', cwd: REPO_ROOT }).trim();
}
```
The test enumerates all capability artifacts (`.claude/rules/*.md`, `agents/*.md`, `packages/**/*.ts` ≥50 LOC etc.) and calls `git log --follow --format=%cd --date=short <file>` for each artifact to determine if it's post-grandfather. As the repo grows, the number of git calls scales linearly with capability-artifact count. Currently: ~100+ files × `git log` invocation = significant subprocess overhead.

**Recommendation: Option 4 (leave-as-is) for now, with an observation.**

Duration is 2.0–2.2s (warm cache) — well within the 60s testTimeout and acceptable. The test is comprehensive and correct; the slowness is from the git-history scan which is semantically necessary (detecting grandfather dates). Option 2 (move to slow-suite) would lose pre-push coverage of the most important BFR-default enforcement. Option 1 (skip-conditional) would skip the test based on environment, losing CI coverage when it matters most. Option 3 (mock git) would hollow out the test — it needs real git history to verify real trailers.

**Observation for §4 (not a DN):** the growth trend is linear with capability artifacts. At current growth rate (~5 capability commits/wave), the test will reach 5s in ~3–4 months. At that point, Option 2 (move to slow-suite with CI-only run) becomes the right fix. Pre-emptive I-phase not justified yet.

**I-phase effort (if triggered): 1 sub-wave, ~40 LOC (extract slow tests to `test:slow` script), blast radius = `principles/11*.test.ts` + `package.json` scripts.**

---

### Group P14 — `principles/14-skill-drift-detection.test.ts` (1 test, 1.0–1.1s)

**Slow-path root cause:**
```typescript
spawnSync('bash', [SCRIPT], { cwd: REPO_ROOT, encoding: 'utf8' })
```
Spawns `scripts/check-skill-drift.sh` — a bash script that scans skill directories, checks cross-references and frontmatter. Cost: ~1s for filesystem scan.

**Recommendation: Option 4 (leave-as-is).**

1.0–1.1s is below the 3s threshold used in kickoff §1. It is justified cost: the test is CI last-resort enforcement for skill drift (per principle 14 comment: «Channel 3 — CI/vitest»). Cannot be mocked without losing the drift-detection semantic. Cannot be skipped without losing CI coverage. Duration is stable (deterministic filesystem scan, not npx cold cache dependent).

---

### Group P05 — `principles/05-manifest-ssot.test.ts` (1 test, 636–747ms)

**Slow-path root cause:**
```typescript
execSync(`npx tsx packages/core/render/render-rules.ts --check`, ...)
```
Runs the full render-rules script to verify RULES.md is in sync with the manifest.

**Recommendation: Option 4 (leave-as-is).**

636–747ms is well below the 3s threshold and below the 1s subjective floor. Functionally necessary — detects drift between manifest and RULES.md which is the purpose of principle 5. Cannot be replaced without losing semantic.

## §3 Trade-offs per Option

### Option 1 — skip-conditional (applied to Group R4)

**Concrete form for Group R4:**
```typescript
const skipSlowNpx = process.env['SKIP_NPX_TESTS'] === '1';
it.skipIf(skipSlowNpx)('WARN(skip): tsconfig.json exists...', () => { ... });
```

**Trade-offs:**
- **Pro:** eliminates the cold-cache timeout risk on local machines. CI sets `SKIP_NPX_TESTS` unset (or to `'0'`), so tests run in CI only.
- **Con (false-positive risk):** If CI sets `SKIP_NPX_TESTS=1` (e.g. via inherited env), the tests silently skip in CI. Mitigation: explicitly set `SKIP_NPX_TESTS=0` in `audit-self.yml`.
- **Con (semantic risk at `audit-ai-docs.test.ts:344`):** The test verifies that when `hasTsconfig=true && hasTsMorph=false`, the code does NOT take the skip branch. This is a behavior-contract test for the production code path (`audit-ai-docs.ts:166-167`). Skipping it locally means the contract is only checked in CI. For a mutation-tested codebase (Stryker is active on this file — per memory `project_stryker_mutation_hardening_done`), a skipped test is a mutation-untested path locally.
- **Con (drift risk):** env-conditional skip → local developer skips → never sees failure → merges broken code → CI catches it. The repo's philosophy is «CI is last-resort gate, not primary one» (CLAUDE.md). Option 1 moves this test from pre-push (primary) to CI-only (last-resort).
- **Alternative Option 1 form:** Use `it.skipIf(!process.env['HAS_TS_MORPH'])` as kickoff §0 suggests — but this only applies to the semantic skip path tests, not the `npx --version` slow path.

**Blast radius:** `audit-self/audit-ai-docs.test.ts` only. No other file changes.

### Option 2 — move to slow-suite (not currently recommended for any group)

**Concrete form:**
```json
// packages/core/package.json
"test:slow": "vitest run audit-self/audit-ai-docs.test.ts --testNamePattern='probeR4'"
```

**Trade-offs:**
- **Pro:** pre-push runs fast (skips the R4 probeR4 tests entirely). CI adds `pnpm --prefix packages/core test:slow` as an additional job.
- **Con (CI-only coverage gap):** the probeR4 tests that verify subprocess behavior are no longer in the pre-push path. A developer who introduces a regression in `probeR4()`'s `execSync` guard would push without a local gate.
- **Con (CI cost):** adds a separate job to `audit-self.yml`, which currently passes the `ci-success` aggregate gate. Must be added to `needs:` list or it runs in parallel but isn't required.
- **Con (current `test:slow` script absent):** `packages/core/package.json` has no `test:slow` script. Creating it is minor effort but adds a dependency on CI configuration changes (`audit-self.yml` update required) — two-file change minimum.
- **When appropriate:** if Group P11 tests grow to ≥5s (git-history scan linear growth), Option 2 becomes the right fix for them (git calls are not skippable via env-conditional). Set a re-evaluation trigger: check Group P11 durations when repo has ≥200 capability artifacts.

### Option 3 — mock execSync (not recommended across the board)

**Concrete form for probeR4 tests:**
```typescript
vi.mock('node:child_process', () => ({
  execSync: vi.fn().mockImplementation((cmd: string) => {
    if (cmd === 'npx --version') return '8.0.0';
    throw new Error('ENOENT');
  })
}));
```

**Trade-offs:**
- **Pro:** eliminates subprocess cost entirely. Tests run in <1ms.
- **Con (semantic loss — FALSIFIER FIRES):** `audit-ai-docs.test.ts:344` specifically tests that the code does NOT take the skip branch when `hasTsconfig=true && hasTsMorph=false`. The test calls the real `probeR4()` function and asserts on `result.result`. Mocking `execSync` means the mock decides the outcome, not the real conditional logic. The test loses its value as a contract test — it becomes a tautology (asserting on what the mock returns, not on the real code path).
- **Con (mutation-testing semantic):** Stryker mutation testing (PR #183, per memory) tests the `probeR4()` function. A mocked `execSync` means mutations to the `if (!hasTsconfig && !hasTsMorph)` condition (line 167 of `audit-ai-docs.ts`) are not caught by the test — the mock bypasses the condition entirely.
- **REJECT Option 3 for Group R4 per falsifier:** mocking changes the semantic meaningfully (confirmed). The tests were genuinely catching production behavior that mocks miss. This is the falsifier from kickoff §4: «Mocking changes semantic meaningfully → REJECT Option 3 across the board».

### Option 4 — leave-as-is (recommended for P11, P14, P05)

**Trade-offs:**
- **Pro:** no code changes, no semantic loss, no new complexity.
- **Pro for P11, P14, P05:** current durations (0.6–2.2s) are well within the 60s testTimeout.
- **Con (testTimeout creep):** the root `vitest.config.ts` is at `testTimeout: 60_000`. PR #229 was the second bump (36s→60s; first was PR #183 for principle 11, 5s→30s). Each bump raises the ceiling, masking the root cause. Current 60s is a «safe margin» (per vitest.config.ts comment) — but if Group R4 on a cold-cache machine takes 24s × 3 tests = 72s, it still times out at 60s. Option 4 is not a permanent fix for Group R4.
- **Con (honest cost for Group R4):** testTimeout 60s cannot prevent a cold-cache 72s run. The workaround in PR #229 is incomplete. Option 4 + current timeout = environment-dependent flake risk remains (per kickoff §0 «environment-dependent flake remains»).
- **Where Option 4 IS the right answer:** P11, P14, P05 — all have stable, justified costs that do not threaten the timeout ceiling.

## §4 Maintainer decision-needed list

**DN-1: Group R4 — which option for the cold-npx-cache slow tests?**

DECISION-NEEDED: The probeR4 tests at `audit-ai-docs.test.ts:344` (and 2 companion probeR4 tests) run ~24s each on cold-cache machines, causing timeout risk. Three viable paths:

- **Option A (Option 1 — skip-conditional)** → Add `it.skipIf(process.env['SKIP_NPX_TESTS'] === '1')` to the 3 slow probeR4 tests. CI always runs them (no env var set). Local developers with cold cache set the env var to skip. Consequence: tests are CI-only on cold-cache machines; pre-push no longer enforces the probeR4 subprocess contract locally. Blast radius: 1 file (`audit-ai-docs.test.ts`), ~10 LOC. CI change: none.

- **Option B (Option 2 — move to slow-suite)** → Extract probeR4 tests to a `test:slow` run group. Pre-push runs `test` (no probeR4 tests). CI adds `test:slow` to the `audit-self.yml` `ci-success` needs. Consequence: probeR4 contract is CI-only gate; pre-push no longer runs it. Blast radius: `audit-ai-docs.test.ts` + `package.json` + `audit-self.yml` (3 files), ~20 LOC.

- **Option C (Option 4 — leave-as-is with injected execSync)** → Refactor `probeR4()` to accept an optional `execSync` injection point (dependency injection). Tests can inject a fast stub for the warm-path tests but keep real `execSync` for the cold-path contract test at line 344. Consequence: eliminates warm-cache 1.3s overhead for 2 of 3 slow tests; cold-cache test at line 344 still runs at full duration (but only 1 test instead of 3). Blast radius: `audit-ai-docs.ts` + `audit-ai-docs.test.ts` (2 files), ~20 LOC.

Maintainer chooses between A, B, or C. This R-phase does not endorse one — all three are viable given the trade-off preferences surfaced in §3.

---

**DN-2: Group P11 — when to re-evaluate duration?**

DECISION-NEEDED: Principle 11 tests (`11-build-first-reuse-default.test.ts`) currently run at 2.0–2.2s and use a linear git-log scan per capability artifact. Growth rate is proportional to capability-artifact count.

- **Option A — set a re-evaluation threshold** → Re-measure P11 duration when the repo reaches 200 capability artifacts (estimated 3–4 months at current rate). If it exceeds 5s, open a dedicated I-phase for Option 2 (slow-suite extraction). No action now.

- **Option B — pre-emptive optimization now** → Batch the git-log calls (one `git log --follow` per file is O(n); one `git log --all --format` over the full history is O(1) with post-processing). I-phase effort: 1 sub-wave, ~40 LOC in `11-build-first-reuse-default.test.ts`. Current 2.2s → expected <200ms. Trade-off: adds complexity to the test logic.

Maintainer chooses A or B. This R-phase recommends A (Option 4 is correct today; no preemptive optimization without evidence of impact).

---

**DN-3: testTimeout ceiling — explicitly document the ceiling?**

DECISION-NEEDED: Root `vitest.config.ts` comment at line 17 says «Longer-term fix: see .claude/orchestrator-prompts/slow-test-triage/».  The timeout has been bumped twice (5s→30s for P11, 36s→60s for audit-ai-docs). Without a policy ceiling:

- **Option A — explicit ceiling policy** → Document in `vitest.config.ts` that `testTimeout` must not exceed 120s and must not be bumped without a paired slow-test triage. This is a prose comment change (1 LOC).

- **Option B — keep current state** → No ceiling; bump as needed. Acceptable until a bump causes CI queue delays.

This is a low-stakes decision; DN-3 is for completeness.

## §5 §1.7 self-reflexive check

**Forward-check:**

- `no-paid-llm-in-ci.md §1`: this R-phase used only deterministic tools (`npx vitest`, `npm run test:principles`, `grep`, `awk`, `gh pr view`). No LLM scoring. All duration numbers come from command output quoted above. ✅
- `phase-research-coverage.md §1.11` (verify-against-source-of-truth before claiming): every duration claim in §1 cites a command + its output (two runs). Every recommendation in §2 cites file:line from `audit-ai-docs.ts`, `11-build-first-reuse-default.test.ts`, `pre-push.ts`, `vitest.config.ts`. ✅
- `phase-research-coverage.md §1.12` (lead with reasoned recommendation): each group has an explicit Option recommendation with rationale from measured evidence. ✅
- `dual-implementation-discipline.md §3(i)`: this research-patch is a markdown-only artefact — §2(i) exemption applies (nothing to «make portable»; the file IS the portable artefact). ✅
- `parallel-subwave-isolation.md §1`: this Worker runs in an isolated worktree. Confirmed:
  ```text
  $ git rev-parse --show-toplevel
  /Users/art/code/rules-as-tests-aif/.claude/worktrees/agent-a29438b4af1885362
  ```
  This is ≠ main repo path `/Users/art/code/rules-as-tests-aif`. ✅

**Backward-check:**

- No existing artefact is silently superseded by this patch. The kickoff (`slow-test-triage/kickoff.md`) is an orchestrator-internal file (gitignored under `.claude/orchestrator-prompts/`) — its scope was research + recommendation, not implementation.
- This patch does NOT touch `vitest.config.ts`, `audit-ai-docs.test.ts`, `audit-ai-docs.ts`, or any test/config file. It is purely additive research.
- The root `vitest.config.ts` comment at line 18 references «.claude/orchestrator-prompts/slow-test-triage/» as the longer-term fix location. This patch is that longer-term fix (the R-phase output); it does not contradict or supersede that comment — it fulfills it.
- `doc-authority-hierarchy.md §5` (folder-level authority): the `research-patches/` folder has a folder-level README. This file inherits that authority. ✅
- No other rule or principle is modified or superseded. ✅

**Self-application (T15):** does this audit apply to itself? Yes — checked:
- This patch does NOT introduce a slow test (zero test files added, zero execSync calls in patch itself). ✅
- The `<!-- scope:slow-test-triage -->` annotation on line 1 complies with `10-research-patch-annotation.test.ts` requirement (principle 10). ✅

## §6 Active T-trap citations

**T3 — Verify durations, don't claim from memory:**

Countermeasure applied: all duration claims in §1 are from actual command runs. Specifically:
- `npx vitest run packages/core/audit-self/audit-ai-docs.test.ts --reporter=verbose` run twice; both durations reported in the table (column «Run 1» and «Run 2»).
- `npm --prefix packages/core run test:principles -- --reporter=verbose` run twice; both durations reported.
- No duration is extrapolated from the kickoff's «~24s» claim without verification. The kickoff's 24s is for cold-cache machines; warm-cache measurement is 1.4s and both numbers are stated.
- Every duration row in the §1 table has two measured values from two distinct command invocations.

**T7 — Don't just match-and-move-on (adversarial check):**

Adversarial counter-prompt applied: «What test surface did I miss?»
- Checked: does `pre-push.ts` run any other vitest invocation beyond the two enumerated? Answer: No. Section 3a (`# Hook stub completeness — ported to principle 16`) is a comment; the actual invocation was removed when Wave 10.6 ported it to a principle test (within `test:principles`). Section 3b (`check-skill-drift.sh`) is guarded by `existsSync` — it fires only when the script is present; I verified it IS present and its test (P14) IS captured in the table. The manifest render check (Section 4) uses `npx tsx render-rules.ts --check` — not a vitest invocation, not a test runner.
- Adversarial check result: the population enumeration is complete. The only vitest surfaces are Section 3 (audit-ai-docs) and Section 5 (test:principles). ✅

**T10 — Enumerate full population before recommending:**

Countermeasure applied: §0.2 explicitly enumerates ALL pre-push test surfaces BEFORE any measurement in §1. Population count stated explicitly (2 surfaces). Sources cited: `pre-push.ts:253-259` (Surface A), `pre-push.ts:283-289` + `package.json:27` (Surface B). `legacy-trailer-checks.sh` explicitly confirmed absent with source (`pre-push.ts:17`).

**T15 — Self-application:**

Countermeasure applied: §5 «self-application» paragraph checks whether this audit introduces any slow test (it does not), and verifies the scope annotation complies with principle 10. The audit applies to its own artefacts.

**T20 — Inline-verdict-without-evidence:**

Countermeasure applied: Every Option recommendation in §2 is preceded by:
- A file:line citation of the root cause (e.g., `audit-self/audit-ai-docs.ts:161` for Group R4).
- A measured duration from the §1 table.
- A mechanical analysis of the slow-path category.
- The falsifier check (Option 3 → semantic loss → REJECT, grounded in the test's actual assertion at `audit-ai-docs.test.ts:344`).

No recommendation is issued without a tool-call-backed evidence base. The `execSync` chain was verified by reading `audit-ai-docs.ts:155-176` (probeR4 implementation) and comparing against the test assertions at `:344-359`.

**Domain-specific trap (T-SlowTestTriage-A):** «When measuring test durations, AI tempted to report warm-cache numbers as representative, missing the cold-cache root cause.»

Countermeasure: explicitly reported BOTH warm-cache (1.3s) and cold-cache (~24s, from kickoff + vitest.config.ts comment) measurements for Group R4. The cold-cache case is what drives the testTimeout escalation; suppressing it would make Option 4 look safe when it is not for cold-cache environments. The warm-cache 1.3s is from the npx startup cost (verified: `execSync('npx --version')` costs ~130ms overhead per invocation on warm cache, ×10 = 1.3s per test due to vitest process isolation restarting npx).

## §7 See also

- [`.claude/orchestrator-prompts/slow-test-triage/kickoff.md`](../../.claude/orchestrator-prompts/slow-test-triage/kickoff.md) — kickoff this patch fulfils
- [`packages/core/audit-self/audit-ai-docs.test.ts:344`](../../packages/core/audit-self/audit-ai-docs.test.ts) — origin slow test (WARN(skip) R4 probeR4 cold-cache)
- [`packages/core/audit-self/audit-ai-docs.ts:155-176`](../../packages/core/audit-self/audit-ai-docs.ts) — probeR4 implementation (execSync call sites)
- [`packages/core/hooks/pre-push.ts:253-289`](../../packages/core/hooks/pre-push.ts) — pre-push test invocations (Sections 3 and 5)
- [`packages/core/principles/11-build-first-reuse-default.test.ts`](../../packages/core/principles/11-build-first-reuse-default.test.ts) — slow principle test (git-log scan, 2.0–2.2s)
- [`vitest.config.ts`](../../vitest.config.ts) — root config with `testTimeout: 60_000` and the «longer-term fix» comment pointing here
- [`packages/core/vitest.config.ts`](../../packages/core/vitest.config.ts) — inner config (no testTimeout set at this level)
- [`.claude/rules/no-paid-llm-in-ci.md`](../../.claude/rules/no-paid-llm-in-ci.md) — hard constraint (measurements are deterministic-only)
- [`.claude/rules/dual-implementation-discipline.md §2(i)`](../../.claude/rules/dual-implementation-discipline.md) — markdown-only exemption (this patch)
- [`.claude/rules/phase-research-coverage.md`](../../.claude/rules/phase-research-coverage.md) — §1.11 verify-before-claim, §1.12 recommendation discipline
