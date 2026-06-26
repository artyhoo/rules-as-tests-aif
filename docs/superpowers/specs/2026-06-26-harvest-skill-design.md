# `/harvest` skill + local CI-equivalent sweep — design

> **Status:** draft — operator approved the verbal design 2026-06-26; written-spec review gate pending.
> **Authoritative for:** the post-aif-acceptance harvest procedure as a session-invoked `/harvest` skill + the shared `scripts/run-local-ci-sweep.sh` aggregator that runs the local CI-equivalent gate set before push.
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../README.md#why-this-exists); the aif egress primitives themselves (`harvest.ts`, `harvest-via-api.sh` — owned by `packages/runtime-bridge` + the dispatcher skill); the false-done guard ([2026-06-23-aif-harvest-false-done-guard-design.md](2026-06-23-aif-harvest-false-done-guard-design.md)).

## Problem

Harvesting an aif-agent branch after acceptance is a **reliably recurring запара** (operator, 2026-06-26): it repeatedly reddens CI or needs manual reconciliation. The failure class is **"ran a hand-picked subset of gates, pushed, CI caught the rest"** — not a willful bypass.

**Evidence base (single session, single PR):** modular-install-fullpack S2∥S3, PR #724 reddened CI **three times in a chain**, each a narrow-validation gap, not a flake:

1. `Shipped Prettier-clean` — S3's agent widened a markdown table; the cold-QA ran install-sh bash tests but not `npm run format:check`.
2. `Principles / byte-identical` — the prettier-fix changed a **shipped** file that `install.sh` copies into the consumer tree; byte-identical baselines are sha256 of exactly those shipped files, so the hash drifted. Fixed prettier, didn't re-run byte-identical.
3. `Principles / meta-all-wired` — S3 added a `tests/install-sh/*.test.sh` but never wired it into `audit-self.yml`.

**Root cause (single):** incremental fix → narrow re-check → push. Each fix touched the install/ship surface; the operator validated the one gate in mind, not the chain. The surface has a **3-way coupling**: `shipped-file content ↔ prettier gate ↔ byte-identical baseline` — touch a shipped file to satisfy one gate and you move another.

Secondary failure surfaces, documented across sessions but living **only in user-scope memory** (never codified into a repo artefact): the 9 aif egress gotchas (`feedback_aif_harvest_egress_gotchas` — dirty container tree, tunnel-blocked push, branch-behind reconstruct, container-≠-push-env actionlint, capability-commit `Prior-art:` trailer, …).

## Constraints (discovered, measured)

- **The full CI-equivalent is ~5 min — too slow to run blindly every harvest.** Measured live on this worktree, 2026-06-26:

  | Chunk | Wall (serial) |
  |---|---|
  | 3 vitest suites (`test:principles` 232 tests + `test:hooks` + `test:render`) + full ~60 `tests/install-sh/*.test.sh` (byte-identical ∈ them) + agnosticism harness-self | **268s measured** |
  | cheap additions: `format:check` (4s) + shellcheck + actionlint + `render-rules --check` + `typecheck` | +~30-60s (not separately timed) |
  | → real `--full` wall | **~5 min** |

  Running this on every harvest is wasteful: a doc-only harvest cannot break byte-identical, and #724's three reds were all on **cheap** gates (`format:check` 4s, `byte-identical` 17s, `meta-all-wired` 0.5s) — the expensive vitest (33s) never failed. So the design must (a) run only the gates the change can plausibly break, and (b) surface a red in seconds, not minutes. The trap to avoid: a *fast* sweep that skips a gate the change actually touched = **false-green**, the worst failure for this project ("documents lie; tests don't"). The resolution is **mechanical scoping that fails safe to full**, never a human/heuristic guess (§Design "Scope model").

- **A blanket pre-push gate is the wrong channel (for now).** ~55s on every push (not just harvest) is a tax on the parallel-worktree inner loop, and `tests/install-sh/*` shell-exec tests flake under parallel load (`project_generator_forbid_mvp_state`). Building it ahead of evidence = `#integration-overhead-overestimate` ([build-first-reuse-default.md §4](../../../.claude/rules/build-first-reuse-default.md)). The skill is the proportionate channel; the gate is a **promotion target** (§Promotion).

- **A freshly-harvested branch can carry pre-existing base reds.** Live confirmation 2026-06-26: `tests/install-sh/layer-units.test.sh` is **deterministically red on this worktree's base** (rc=1, `20-agents.sh`/`99-finalize.sh` dry-run source), unrelated to any harvest. The sweep must be interpreted **against the merge-base**, not as absolute green: a gate red on your branch AND on `origin/staging` is pre-existing (surface, don't attribute to the harvest); red on your branch but green on base is a regression you must fix.

- **No-paid-LLM:** every gate the sweep runs is deterministic (bash/vitest/tsc/actionlint), zero API calls ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)).

## Design (approved)

Three units with clear boundaries.

### Unit 1 — `scripts/run-local-ci-sweep.sh` (new BUILD; the executable artefact = SSOT of the local gate set)

A single runnable that mirrors the CI gate set, runs gates **serially** (determinism over speed — avoids the parallel-load flake), **cheapest-first with fail-fast** (exit non-zero on the first red — #724's reds were all cheap gates, so a failure surfaces in ~5s, not after the 5-min suite). Lives under `scripts/` (not `packages/`) → **not a capability-commit** ([CLAUDE.md](../../../CLAUDE.md) capability definition; `scripts/` exempt).

#### Scope model (default = diff-aware, fail-safe to full)

The default run is **diff-aware**: it reads `git diff --name-only <merge-base>...HEAD` and runs only the gate families whose inputs appear in the diff. This is **mechanical** (driven by `git diff`, never a human guess), so it cannot repeat the #724 coupling miss ("I didn't realise this edit touched a shipped file" — `git diff` sees it and runs byte-identical). It is the same **change-scoped gate** discipline already in the repo (SSOT #114 guard-liveness change-scoped pre-push gate) — ADAPT, not invent.

Two safety rules make scoping false-green-proof:

1. **Fail-safe to full, never fail-open to skip.** Any changed path not matched by a map entry → **escalate the whole run to `--full`**. An unrecognised path never silently narrows the gate set.
2. **Shipped-file detection derives from the byte-identical baseline's own file list** (the baseline already enumerates the shipped tree), **not** a hand-maintained parallel list that would drift. "Did the diff touch a baseline-tracked file?" is computed from the baseline itself.

| Diff touches | Gate families run | Unmapped path |
|---|---|---|
| a baseline-shipped file / `packages/core/templates/**` / `skills/**` / `.claude/skills/**` | byte-identical + `format:check` | |
| `tests/install-sh/**` | meta-all-wired + the touched install-sh tests | |
| `packages/core/**` (`.ts`) | test:principles / test:hooks / test:render + typecheck | |
| `.github/workflows/**` | actionlint + meta-all-wired | |
| `setup.d/companions.manifest` | manifest-consumer tests | |
| `.claude/rules/**` / `agents/**` | render-rules --check + principle 09 | |
| `*.md` (non-shipped) | dead-links + md-line-gate | |
| **anything else** | — | **→ escalate to `--full`** |

Cost profile after scoping: doc/skill harvest ~10-40s (red in ~5s if any), shipped-file harvest ~25s, `packages/core` harvest ~33s (justified — you changed the tested code), broad/unmapped harvest ~5 min (correctly full).

`--full` (override) ignores the diff scope and runs the complete set below — the explicit paranoid / final-pre-merge check.

Gate set (`--full`), each mirrored from `audit-self.yml`:

- `bash tests/install-sh/meta-all-wired.test.sh` — every install-sh test is wired in CI.
- `npm run format:check` — shipped artefacts Prettier-clean (`shipped-prettier` job).
- `SNAPSHOT_MODE=compare bash tests/install-sh/byte-identical.test.sh` — sha256 of the shipped tree (8 stack×mode combos).
- `npm --prefix packages/core run test:principles` / `test:hooks` / `test:render` — the three vitest suites the Principles job runs.
- `for t in tests/install-sh/*.test.sh; do bash "$t"; done` — the full install-sh suite (the Principles job wires each one).
- `bash tests/agnosticism/harness-self.test.sh` — anti-theatre gate.
- shellcheck over `setup.d/*.sh` + `install.sh` (pinned version, mirrors the CI step).
- `actionlint .github/workflows/*.yml` **if** `actionlint` ∈ PATH; else loud `WARN: actionlint absent — run on host before push` + continue (a runtime container is not a push env — gotcha 9).
- `npx tsx packages/core/render/render-rules.ts --check` — manifest→RULES.md drift (`manifest-render-check` job).
- `npm run typecheck` (tsc `--noEmit`) — memory `tsc masks vitest`; run before trusting green.
- `mechanical` job bundle — `md-line-gate.sh`, bash-syntax of all `*.sh`, JSON validity, `.md`→`.md` dead-link check, stale-path references (cheap; mirrors the `mechanical` job).

**Known CI-equivalence gaps (named, not silently dropped — per "documents lie; tests don't"):**

- `pr-commit-trailers` job (§1.7 + Prior-art **real-commit** backstop) is **PR-commit-scoped**, not pre-push-replicable from a bare working tree — and it is exactly the gate gotcha 9 hit (a ≥80-LOC file under `packages/` with no `Prior-art:` trailer in the commit). The sweep does **not** run it; the `/harvest` egress step (Unit 2 §1) carries the trailer requirement instead. A `--commits <range>` mode that runs `PREPUSH_ONLY=prior-art` over the harvested commits is a §Promotion candidate.
- `zizmor` job needs the external `zizmor` binary (not guaranteed locally). The sweep runs it **if present**, else `WARN-skip` (same pattern as `actionlint`).
- `mechanical` job (bash-syntax, JSON-validity, dead-links, stale-paths, md-line-gate) is cheap and **included** in `--full`.

Flags:

- *(no flag — default)* — diff-aware scope vs `<merge-base>` (auto-detected: `git merge-base origin/staging HEAD`), cheapest-first, fail-fast, fail-safe to full on unmapped paths.
- `--full` — ignore diff scope; run the complete set above (paranoid / final pre-merge).
- `--base <ref>` — override the merge-base used for diff scoping (e.g. when the live trunk differs from `origin/staging`).
- `--capture` — pass `SNAPSHOT_MODE=capture` to byte-identical when a shipped-file change is **intentional**, regenerating the baseline (diff must be exactly the changed file's hash line).

Output: one line per gate (`PASS`/`FAIL`/`WARN-skip`), a final summary, non-zero exit on any FAIL.

### Unit 2 — `.claude/skills/harvest/SKILL.md` (new thin Class-C wiring skill; `/harvest`, `disable-model-invocation: true`)

The standalone post-acceptance procedure, ordered so steps cannot be silently skipped. Covers the surface the #724 incident actually hit: a **manual harvest outside a full `/dispatcher` loop**.

1. **Egress** — reuse `harvest.ts` / `helpers/harvest-via-api.sh`; codify the **9 egress gotchas** into this skill's prose (first time they leave user-scope memory and enter a repo artefact, per [memory-codification.md §3](../../../.claude/rules/memory-codification.md)): dirty container tree → push **committed HEAD only** (never `git add -A`); tunnel-blocked `git push` → Git Data API; branch-behind EDITED files → reconstruct-not-override (blob-compare fork-base vs remote-base, gotcha 6); container-≠-push-env (`actionlint` absent) → API-land, `--no-verify` is git-safety-blocked (gotcha 9); a ≥80-LOC file under `packages/` → `Prior-art:` trailer **in the commit** (PR-body §1.7 does not satisfy the real-commit backstop).
2. **Cross-stage integration** — when parallel aif branches touch shared files: blob-compare fork-base vs remote-base, resolve deterministically, **tests as the falsifier** (run Unit 1 after the merge, not before).
3. **Sweep gate** — invoke `scripts/run-local-ci-sweep.sh` (default diff-aware) **before** push; the script auto-scopes to what the harvest changed and fail-safes to `--full` on any unmapped path. Interpret **against the merge-base** (pre-existing base reds like `layer-units` are surfaced, not attributed). Any branch-introduced red ⇒ **STOP, do not push**. Run `--full` explicitly as the final check before merge if the harvest was broad.
4. **Cold-review + PR** — delegate the diff review to `superpowers:requesting-code-review` (REUSE), assemble the §1.7-compliant PR body, then push + `gh pr create` (+ `--auto --squash` per the dispatcher convention).

### Unit 3 — `/dispatcher §2.4` wiring (one-line edit)

The dispatcher's harvest step ([dispatcher/SKILL.md §2.4](../../../.claude/skills/dispatcher/SKILL.md)) gains a call to `scripts/run-local-ci-sweep.sh` before its push — the **same script** as `/harvest`, so there is no dual-prompt drift ([dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md): one logic, two channels).

## Build-vs-reuse

- **REUSE:** `harvest.ts` + `harvest-via-api.sh` (egress, SSOT #111 dispatcher); `superpowers:requesting-code-review` + `verification-before-completion` (the *posture* "verify before claiming done" — but neither knows the project gate list, so they cannot replace Unit 1); every existing gate test (the sweep only *aggregates* them).
- **ADAPT (in-repo pattern):** the diff-aware scope model is the repo's existing **change-scoped gate** discipline (SSOT #114 guard-liveness change-scoped pre-push gate) applied to the harvest sweep — not a new invention. `git diff --name-only <base>...HEAD` → gate-family selection is ~40 LOC of bash, cheaper and more transparent than adopting a task-runner framework.
- **BUILD:** only `run-local-ci-sweep.sh` — an aggregator that runs *exactly this project's* CI gate set locally. **Negative-existence claim is provisional** — a fresh 6-item search (context7 + DeepWiki + WebSearch ≥3 phrasings on "run GitHub Actions / CI workflow locally") MUST be run at plan time before the BUILD verdict is load-bearing (H1 discipline; not yet run this session). The leading falsifier candidate is `act`-class GitHub-Actions local runners — likely REJECT (Docker-based, runs the YAML jobs not the bespoke gate selection / baseline-aware interpretation), but that must be confirmed, not asserted. New SSOT entry on BUILD confirmation: REUSE-posture (superpowers verification skills) + BUILD-aggregator, with `act` adoption as the revisit trigger.

## Decided on merits (reported, not punted)

- **Mechanism:** skill + sweep script; blanket pre-push gate **deferred** with an explicit promotion trigger (cost + parallel-flake evidence vs the willpower-invoked skill).
- **Form:** standalone `/harvest` (the #724 incident was a standalone harvest) + shared script; `/dispatcher §2.4` calls the same script.
- **Default scope:** diff-aware (run only what the change can break), fail-safe to `--full` on any unmapped path, cheapest-first + fail-fast. Rejects "always `--full`" (5 min every harvest is wasteful when most touch a narrow surface) AND "smart-skip by judgment" (false-green risk). `--full` remains as the explicit final-pre-merge override. The "FULL CI-equivalent" the task asks for is preserved: it is what the scope **fails safe to**, and what `--full` runs.
- **Rejected for v1 — content-hash skip cache:** would skip a gate whose declared input set is wrong → false-green, the project's worst failure. diff-scope + fail-fast already remove most fix-loop cost without that risk.
- **Serial execution:** trade minutes for determinism (avoids the documented shell-exec parallel-load flake).

## Promotion / deferred (YAGNI for v1)

- **Pre-push gate wrapping the same script** — promote when a harvest reddens CI **after** this skill ships (i.e. the skill was skipped or a gate was missing): that is the incident evidence the cost-caveat demands. The gate reuses Unit 1 unchanged → skill-first is not throwaway.
- **Mechanical base-red subtraction** — run each selected gate on the merge-base too and report only gates that **newly** red (instead of the prose "interpret against base" rule). Promote if base-red misattribution (the `layer-units` class) recurs.
- **Content-hash skip cache** — only if fix-loop re-run cost remains painful after diff-scope + fail-fast AND every gate's input set proves reliably declarable (else false-green); see §Decided rejection.
- **Principle test "sweep script ⟷ CI gate set do not drift"** — a meta-all-wired analog for the sweep (recursive self-application). Promote if the sweep falls out of sync with `audit-self.yml`.

## Test plan

- `scripts/run-local-ci-sweep.sh` is itself shell — paired-negative coverage in `tests/` (mirrors `ci-success-gate.test.sh` precedent). **The test MUST stub the gate commands** (inject a fake gate list via an env seam, e.g. `SWEEP_GATES_OVERRIDE`), NOT invoke the real 5-min suite — otherwise the sweep's own test becomes a slow, flaky CI step (the exact failure mode this design fights). Cases: (pos) all stubbed gates exit 0 → sweep exit 0, summary all-PASS; (neg) one stubbed gate exits 1 → sweep exit≠0, that gate reported FAIL, sweep stops at it; (fail-fast order) the cheapest stubbed gate fails → expensive gates never run; (diff-aware) a stubbed diff touching only `*.md` selects the doc gate family, not byte-identical/vitest; (fail-safe) a stubbed diff with an unmapped path → escalates to the full set; (`--full`) ignores diff scope; (`actionlint`/`zizmor` absent) → `WARN-skip`, not FAIL, sweep continues.
- `/harvest` SKILL.md — markdown; no executable test, but the **9 egress gotchas** it codifies are each backed by a documented live incident (citations in the skill body).

## §1.7 self-reflexive note

- **Forward-check:** complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (all gates deterministic, zero API); [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) (REUSE egress + review posture; ADAPT the repo's change-scoped gate pattern SSOT #114 for diff-aware scoping; BUILD only the aggregator, with a search-check + SSOT revisit trigger); [dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md) (one script, two channels — skill + dispatcher); [memory-codification.md §3](../../../.claude/rules/memory-codification.md) (moves the 9 egress gotchas out of user-scope memory into a repo artefact); [doc-authority-hierarchy.md §2-§3](../../../.claude/rules/doc-authority-hierarchy.md) (this spec carries the Authoritative-for header).
- **Backward-check:** extends the existing harvest surface (`harvest.ts`, dispatcher §2.4, the false-done guard) — supersedes nothing. The blanket-gate option is preserved as an opt-in promotion, not removed. Origin incident: #724 (this session) + the 9-gotcha memory.
