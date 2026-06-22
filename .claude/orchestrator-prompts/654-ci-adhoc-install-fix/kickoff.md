# Kickoff — 654-ci-adhoc-install-fix

**Umbrella:** resolve GH issue #654 via **option 2 (FIX the findings)** + internalise the root-cause class as an owned, executable rule. Operator chose 2b (fix + rule + earliest-channel test) over 2a (patch only) and over option 1 (suppress-config).

**Base branch:** `staging`. **One PR** for the whole umbrella, `--base staging` (agent squash-merge to staging is allowed by the harness git-safety gate).

> **Phase -1 amendments (round 1, orchestrator-applied):** added the principle-09 cap-bump trap (B1), the §1.7 commit-trailer gate (B2), the corrected zizmor-pip rationale (A1), the pyyaml/dogfooding self-application requirement (A3), the local-zizmor-1.26.1 verification requirement (A4), the «pre-push.ts needs net-new content-reading logic» clarification (A5), and the «capability gate won't fire → SSOT #149 is self-imposed» framing (M1). Domain traps renamed `T-654-*` → `T-CIPIN-*` to satisfy the principle-12 domain-pattern arm.

---

## Goal (one sentence)

Make zizmor's `adhoc-packages` audit pass clean on the **latest** zizmor by fixing the ad-hoc `npm install` steps (not suppressing them), re-pin zizmor coherently so a future tool bump can't silently red CI again, and internalise **the root cause zizmor does not catch** — *unpinned bare `run:` tool installs* — as a Class-A rule enforced at the earliest reachable channel (pre-push).

---

## Background — verified facts (re-verify; lines may drift)

zizmor `1.25.2 → 1.26.1` auto-bumped (the `Install zizmor` step was **unpinned** `pip install zizmor`). zizmor **1.26.0** introduced the **`adhoc-packages`** audit (ID orchestrator-verified against live zizmor 1.26.1 output — `help[adhoc-packages]`). It flags `npm`/`gem` installs outside a lockfile; **docs.zizmor.sh confirms it does NOT flag `git init`**. This surfaced **5 pre-existing LOW findings**, red-ing every PR via the `ci-success` aggregate (`needs: zizmor`). #653 mitigated by pinning to `1.25.2`; this umbrella does the deferred real fix.

**All 5 findings are the SAME pattern** — `npm install --prefix <path> --silent` (ad-hoc npm install, no lockfile). Reproduced live with zizmor 1.26.1:

| File | Line (re-verify) | Actual step |
|---|---|---|
| `.github/workflows/audit-self.yml` | 165 | `npm install --prefix packages/core --silent` |
| `.github/workflows/audit-self.yml` | 206 | `npm install --prefix packages/core --silent` |
| `.github/workflows/audit-self.yml` | 446 | `npm install --prefix "$GITHUB_WORKSPACE/packages/core" --silent` |
| `.github/workflows/audit-self.yml` | 476 | `npm install --prefix "$GITHUB_WORKSPACE/packages/core" --silent` |
| `.github/workflows/framework-self-template-render.yml` | 35 | `npm install --prefix packages/core --silent` |

> ⚠ Issue #654's table mislabels rows 446/476 as `git init --quiet`. WRONG — zizmor flags the `npm install` on those lines; `git init` (lines ~450/480) is a *different* step and is NOT a finding. Same mislabel is echoed in the `Install zizmor` comment (~line 738: «npm install --prefix / git init steps»). See **T-CIPIN-A**.

> **Re-run zizmor 1.26.1 to get the AUTHORITATIVE finding set** — the 5 above are confirmed, but treat the live `Run zizmor` output as source of truth (e.g. the root-level `npm install --silent` at ~line 188 may or may not be flagged — fix whatever 1.26.1's `adhoc-packages` actually reports).

**Root-cause gap (load-bearing, A1-corrected):** the incident's true cause was an **unpinned bare `run: pip install zizmor`** step. zizmor's `adhoc-packages` audit targets **npm/gem only** (not pip). zizmor's separate `misfeature` audit flags unpinned pip **only via the `actions/setup-python` `pip-install:` input form — NOT the bare `run: pip install <tool>` step form** that our `Install zizmor` and `pip install pyyaml` steps use. So **bare-`run:`-step unpinned tool installs are genuinely unserved by zizmor** — that is our BUILD slice. **Before writing SSOT #149, the worker MUST re-confirm this against live `zizmor==1.26.1` + docs.zizmor.sh** (append-only register = permanent; do not bake an unverified claim).

---

## Build-vs-reuse verdict — RESOLVED, do not re-litigate (CLAUDE.md capability gate)

- **adhoc-npm-install detection → REUSE zizmor** (already in `audit-self.yml`, CI channel). FIX the findings; do NOT rebuild detection (would be `#parallel-evolution-creep`).
- **unpinned bare-`run:` tool-install detection → BUILD** (deterministic, zero new dep). Channel = **pre-push** (earliest reachable), strictly earlier than zizmor's CI-only run. **T16 problem-class note for SSOT:** upstream zizmor handles npm/gem-no-lockfile (`adhoc-packages`) + pip-via-setup-python-input (`misfeature`); our slice = bare `run: pip install`/`npm i -g` without a version pin — unserved. Match ≈ name-only.
- **New SSOT entry #149** (`docs/meta-factory/prior-art-evaluations.md`, append-only; highest existing = #148): record zizmor as the adopted `adhoc-packages` mechanism (REFERENCE — already integrated) + the bare-`run:`-tool-pin BUILD with the corrected T16 note + `Verdict`/`Rationale`/`Trigger to revisit`.
- **M1 — the pre-push capability detector will likely NOT fire on this PR** (item 4 *modifies* the existing `pre-push.ts`; item 3 adds a file *outside* `packages/`; the new test fixture is <80 LOC; no new dep). So **SSOT #149 + the `Prior-art:` trailer are a SELF-IMPOSED build-vs-reuse obligation** (a BUILD verdict must be recorded per CLAUDE.md) — NOT gate-forced. Do NOT skip them because the hook is silent.

---

## Work items (atomic commits; one PR)

1. **Fix the adhoc-packages findings** — swap `npm install --prefix <P> --silent` → `npm ci --prefix <P>` at every site zizmor 1.26.1 reports (the 5 above confirmed). `npm ci --prefix` is **verified working** (orchestrator tested: resolves the lockfile; both `package-lock.json` + `packages/core/package-lock.json` exist, lockfileVersion 3). `npm ci` is stricter (fails on package.json↔lock drift) — if a job breaks, fall back to `cd <P> && npm ci` for that site and note why.
2. **Re-pin zizmor coherently** — bump `pip install zizmor==1.25.2` → `zizmor==1.26.1` (`audit-self.yml`, ~line 741). Findings now fixed → 1.26.1 passes clean. **KEEP the pin** (determinism — consistent with the 36 SHA-pinned `uses:` in the same file). Do NOT un-pin (re-arms the root cause). Rewrite the stale comment (now «findings fixed via npm ci; pinned for determinism; bumping zizmor is a deliberate edit») and fix the `git init` mislabel in it.
3. **New rule** `.claude/rules/ci-tool-pinning.md` — **Class A**. Doc-authority header per `doc-authority-hierarchy.md §2-§3` (`> **Class:** A …` + Authoritative-for + NOT-authoritative-for → README#why-this-exists). Content: (a) bare `run:` CI tool installs in `.github/workflows/` MUST be version-pinned; (b) prefer lockfile-aware (`npm ci`) over ad-hoc (`npm install`) — the latter delegated to zizmor. **Scope explicitly vs [`companion-install-principle.md`](../../rules/companion-install-principle.md):** that rule mandates *no pin* for **consumer companion installs** (updates flow through the companion's own installer); THIS rule mandates *pin* for **our own CI audit tooling**. Different surfaces → no `#contradicting-authority-claims` conflict; say so in NOT-authoritative-for + a one-directional «See also» pointer (do NOT edit companion-install-principle — out of scope, Artifact Ownership). Include `§1.7` forward/backward note + Promotion/Retirement.
   - **B1 (BLOCKER) — register + cap-bump, same commit:** add `'.claude/rules/ci-tool-pinning.md'` to `REQUIRED_HEADER_DOCS` (`packages/core/principles/09-doc-authority-hierarchy.ts`, the list at ~line 27-48) **AND** bump the companion assertion `expect(REQUIRED_HEADER_DOCS.length).toBeLessThanOrEqual(65)` → `66` (`09-doc-authority-hierarchy.test.ts:89`). Without the register, principle 09 never checks the new header (acceptance vacuous); without the cap-bump, principle 09 fails its own bound. Both required.
4. **New check (earliest channel)** in `packages/core/hooks/pre-push.ts` — flag, in `.github/workflows/*.yml`, an unpinned bare-`run:` tool install: `pip install <pkg>` lacking `==<ver>` and `npm install -g`/`npm i -g` lacking `@<ver>`.
   - **A5 — this is NET-NEW logic, not an extension.** `workflowYmlFiles()` (pre-push.ts:196) returns **paths only**; the file reads content only from stdin. You must add `readFileSync`-per-workflow + a per-line scan + a new section function (parallel to the existing `*Section` fns ~251/325/390/456) wired into `main()`.
   - **False-positive carve-outs (A3):** must NOT flag `pip install -r <file>`, `pip install .`/`pip install -e .`, comment lines, or already-pinned (`==`/`@`) installs. Support an inline escape hatch `# ci-tool-pin: allow <reason>` on a line for documented exceptions (default = require pin). **Match the exact `# ci-tool-pin: allow` token — NOT «any line containing `#`»**, else a trailing comment (`pip install foo  # note`) becomes an unintended bypass.
   - **Paired-negative test** (principle 02) in the hooks suite (`packages/core/hooks/*.test.ts`): a fixture that SHOULD trip + one that passes. This pair is the rule's Class-A companion.
5. **SSOT #149 + Prior-art trailer** — per the verdict block (self-imposed per M1). Capability commit(s) carry the `Prior-art:` trailer citing `#149`.

### B2 (BLOCKER) — §1.7 commit-trailer gate (separate from the in-file note + Prior-art trailer)

`packages/core/hooks/checks/s17.ts` fires the **§1.7 discipline-trailer** check (blocking) on any commit whose changed files include `.claude/rules/*.md` (item 3) **or** `packages/core/principles/*.test.ts` (the B1 cap-bump + any test). Each such commit body MUST carry a `§1.7:` trailer line with a forward/backward statement **and ≥1 `file:line` citation**, e.g.:

```text
§1.7: forward — complies with no-paid-llm-in-ci.md (deterministic grep, zero API); backward — codifies the 2026-06-22 unpinned-zizmor incident (audit-self.yml:741). See .claude/rules/build-first-reuse-default.md:1.
```

This is a **commit-message trailer**, distinct from (a) the in-file `§1.7` prose note in the rule and (b) the `Prior-art:` trailer. Read `s17.ts` for the exact substance requirement before pushing.

> **Commit grouping (avoids a s17 false-trigger):** s17 fires on a commit that introduces a discipline file *with* a `## §`/`export const` section marker in the diff. Put item 3's rule-creation **+** the `REQUIRED_HEADER_DOCS` register **+** the cap-bump in **one commit** — the new `.claude/rules/ci-tool-pinning.md` (with `## §` sections) triggers s17, and a single `§1.7:` trailer on that commit covers it. A standalone cap-bump diff (just `65`→`66`) carries no section marker and may not trigger s17 on its own — grouping it with the rule commit sidesteps the ambiguity.

### Self-application prerequisite (A3 — dogfooding, NOT scope creep)

The new check, run across **all** `.github/workflows/*.yml`, will (correctly) flag every unpinned bare-`run:` tool install — including `pip install pyyaml` at `audit-self.yml:444` and `:474`. **You MUST pin all of them** (`pyyaml==<current stable>`, etc.) so the repo passes its own new rule (T15 self-application — a rule the repo itself violates cannot ship). Enumerate the full list first (run the new check / grep), pin each, and list them in the PR. If a specific install is genuinely un-pinnable, use the `# ci-tool-pin: allow <reason>` escape hatch with rationale — default is pin.

> **Out of aif scope (orchestrator handles separately):** editing the **issue #654 body** mislabel (a `gh issue edit`, not a code/branch change). Fix only the in-repo comment (item 2). Do NOT touch the GitHub issue body.

---

## Verification (A4 — local zizmor may be too old)

- **Local zizmor may be <1.26.0** (false-green: the `adhoc-packages` audit won't exist, reports 0 regardless of correctness). Install `pip install zizmor==1.26.1` in a venv for before/after, or run the repo's `Run zizmor` step args. Do NOT trust a local zizmor <1.26.0.
- `npm --prefix packages/core run test:principles` and `test:hooks` green (covers principle 09 cap-bump + the new paired-negative test).
- Every touched CI job green; `ci-success` aggregate green on the PR.

## Acceptance criteria

- [ ] zizmor un-suppressed + bumped to `1.26.1`; the `Run zizmor` step reports **0 `adhoc-packages` findings** (verified with real 1.26.1, not local <1.26.0).
- [ ] **No `.github/zizmor.yml` suppress-config added** (chosen posture = FIX, not ignore — see **T-CIPIN-B**).
- [ ] All flagged `npm install --prefix` sites use `npm ci --prefix` (or documented `cd && npm ci` fallback).
- [ ] All unpinned bare-`run:` tool installs across `.github/workflows/` pinned (incl. `pip install pyyaml`) or escape-hatched with rationale.
- [ ] `.claude/rules/ci-tool-pinning.md` exists with a valid Class-A header; registered in `REQUIRED_HEADER_DOCS`; principle-09 cap bumped to 66; principle 09 **actually checks it** (non-vacuous).
- [ ] `pre-push.ts` tool-pin check (with carve-outs) + paired-negative test shipped; hooks + principles suites green.
- [ ] SSOT #149 present (corrected T16 rationale, verified vs live zizmor); `Prior-art:` trailer on the capability commit; `§1.7:` commit trailers on the rule + principle-test commits.

---

## §1.7 self-reflexive note (this kickoff)

- **Forward-check:** complies with [`no-paid-llm-in-ci.md`](../../rules/no-paid-llm-in-ci.md) (the new check is deterministic, zero API); [`build-first-reuse-default.md`](../../rules/build-first-reuse-default.md) (REUSE zizmor for npm/pip-input detection; BUILD only the unserved bare-`run:` slice); [`doc-authority-hierarchy.md`](../../rules/doc-authority-hierarchy.md) (new rule carries Class + Authoritative-for + is registered in principle 09); [`dual-implementation-discipline.md`](../../rules/dual-implementation-discipline.md) (`pre-push.ts` is repo-internal Husky tooling — §2 non-trigger (ii), no `@cc-only-rationale` needed).
- **Backward-check:** internalises the 2026-06-22 incident root cause; supersedes nothing; scopes against companion-install-principle rather than contradicting it. Self-applies (T15): the rule pinning our CI tools is enforced on our own CI, and dogfoods on its first run (pyyaml).

## AI-laziness traps — per [`.claude/rules/ai-laziness-traps.md §2`](../../rules/ai-laziness-traps.md)

**Active traps for this work:** T3 (every finding file:line, no prose-only), T11 (no custom mechanism without prior-art — resolved in the verdict block; do not re-propose), T13 (zizmor ADOPTED — do not trust blindly; re-verify 1.26.1 behaviour, esp. the pip-coverage claim), T15 (self-application — rule applies to our own CI + dogfoods on pyyaml, mandatory), **T16** (pattern-matching-on-name — «adhoc-packages» sounds like it would catch unpinned pip; it does NOT; the bare-`run:` pip slice is the BUILD justification — verify, don't assume).

**Domain-specific traps:**
- **T-CIPIN-A** — «fix the `git init` lines». The issue table + workflow comment mislabel the npm-install findings as `git init --quiet`; an AI trusting the label edits the wrong (non-finding) `git init` steps. Counter: fix the `npm install --prefix` lines only; verify finding lines with live zizmor 1.26.1 before/after.
- **T-CIPIN-B** — «just suppress it, it's less work». Operator explicitly chose option 2 (FIX). Adding `.github/zizmor.yml` `ignore[adhoc-packages]` is option 1 and is OUT of scope; acceptance forbids a suppress-config.

## Drive-by guard (CLAUDE.md PR strategy)

Stay within these items + the self-application pins (A3). Pinning unpinned tool installs across `.github/workflows/` is IN scope (the rule's own prerequisite). Anything genuinely beyond CI-tool-pinning (refactors, unrelated workflow changes) → list in the PR «Observations», do NOT expand or open a second PR.
