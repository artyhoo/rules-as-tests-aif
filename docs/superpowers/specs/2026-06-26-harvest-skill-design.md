# `/harvest` skill + local CI-equivalent sweep — design

> **Status:** approved (operator, 2026-06-26).
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

- **Cost is real but bounded — measured live on this worktree, 2026-06-26:**

  | Tier | Gate set | Wall (serial) |
  |---|---|---|
  | `--core` (dev inner-loop) | meta-all-wired (0.5s) + actionlint (<1s) + `format:check` (4s) + byte-identical compare 8-combo (17s) + `test:principles` 28 files/232 tests (33s) | **~55s** |
  | `--full` (harvest gate) | the three vitest suites (`test:principles` + `test:hooks` + `test:render`) + the full ~60 `tests/install-sh/*.test.sh` (byte-identical is one of them) + agnosticism harness-self | **268s measured** |
  | `--full` cheap additions | `format:check` (~4s) + shellcheck + actionlint + `render-rules --check` + `typecheck` (tsc) | **+~30-60s (not separately timed)** |

  The **268s** figure was measured directly (3 vitest suites + the full install-sh loop + agnosticism). The cheap additions above were not folded into that timed run, so the real `--full` wall is **~5 min**. `--full` is the true CI-equivalent: the CI job `principles-meta-tests` (`audit-self.yml`) wires the **entire** install-sh suite + hooks + render + shellcheck + agnosticism into one job, and `shipped-prettier` / `manifest-render-check` / `typecheck` are separate jobs. The named "core 5" (operator memory) is a **subset** — a red can hide in `test:hooks`/`test:render`/the install-sh suite that `--core` never runs.

- **A blanket pre-push gate is the wrong channel (for now).** ~55s on every push (not just harvest) is a tax on the parallel-worktree inner loop, and `tests/install-sh/*` shell-exec tests flake under parallel load (`project_generator_forbid_mvp_state`). Building it ahead of evidence = `#integration-overhead-overestimate` ([build-first-reuse-default.md §4](../../../.claude/rules/build-first-reuse-default.md)). The skill is the proportionate channel; the gate is a **promotion target** (§Promotion).

- **A freshly-harvested branch can carry pre-existing base reds.** Live confirmation 2026-06-26: `tests/install-sh/layer-units.test.sh` is **deterministically red on this worktree's base** (rc=1, `20-agents.sh`/`99-finalize.sh` dry-run source), unrelated to any harvest. The sweep must be interpreted **against the merge-base**, not as absolute green: a gate red on your branch AND on `origin/staging` is pre-existing (surface, don't attribute to the harvest); red on your branch but green on base is a regression you must fix.

- **No-paid-LLM:** every gate the sweep runs is deterministic (bash/vitest/tsc/actionlint), zero API calls ([no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md)).

## Design (approved)

Three units with clear boundaries.

### Unit 1 — `scripts/run-local-ci-sweep.sh` (new BUILD; the executable artefact = SSOT of the local gate set)

A single runnable that mirrors the CI gate set, runs gates **serially** (determinism over speed — avoids the parallel-load flake), and exits non-zero on the first red. Lives under `scripts/` (not `packages/`) → **not a capability-commit** ([CLAUDE.md](../../../CLAUDE.md) capability definition; `scripts/` exempt).

**Default tier = `--full`** (true CI-equivalent). `--core` is the opt-in fast subset for dev iterations.

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

Flags:

- `--full` (default) — the set above. `--core` — the ~55s subset (meta-all-wired + actionlint + format:check + byte-identical + test:principles).
- `--capture` — pass `SNAPSHOT_MODE=capture` to byte-identical when a shipped-file change is **intentional**, regenerating the baseline (diff must be exactly the changed file's hash line).
- `--changed <glob…>` — when `setup.d/companions.manifest` is in the set, additionally run the manifest-consumer tests (manifest-parse, no-companion-blocks, bridge-guided, setup-orchestrator, s3-wire-ci). (These already run inside the install-sh `for` loop under `--full`; `--changed` is for `--core` runs that would otherwise skip them.)
- `--baseline <ref>` (§Promotion, not v1) — run the set on `<ref>` first and report only gates that **newly** red.

Output: one line per gate (`PASS`/`FAIL`/`WARN-skip`), a final summary, non-zero exit on any FAIL.

### Unit 2 — `.claude/skills/harvest/SKILL.md` (new thin Class-C wiring skill; `/harvest`, `disable-model-invocation: true`)

The standalone post-acceptance procedure, ordered so steps cannot be silently skipped. Covers the surface the #724 incident actually hit: a **manual harvest outside a full `/dispatcher` loop**.

1. **Egress** — reuse `harvest.ts` / `helpers/harvest-via-api.sh`; codify the **9 egress gotchas** into this skill's prose (first time they leave user-scope memory and enter a repo artefact, per [memory-codification.md §3](../../../.claude/rules/memory-codification.md)): dirty container tree → push **committed HEAD only** (never `git add -A`); tunnel-blocked `git push` → Git Data API; branch-behind EDITED files → reconstruct-not-override (blob-compare fork-base vs remote-base, gotcha 6); container-≠-push-env (`actionlint` absent) → API-land, `--no-verify` is git-safety-blocked (gotcha 9); a ≥80-LOC file under `packages/` → `Prior-art:` trailer **in the commit** (PR-body §1.7 does not satisfy the real-commit backstop).
2. **Cross-stage integration** — when parallel aif branches touch shared files: blob-compare fork-base vs remote-base, resolve deterministically, **tests as the falsifier** (run Unit 1 after the merge, not before).
3. **Sweep gate** — invoke `scripts/run-local-ci-sweep.sh` (default `--full`) **before** push. Interpret **against the merge-base** (pre-existing base reds like `layer-units` are surfaced, not attributed). Any branch-introduced red ⇒ **STOP, do not push**.
4. **Cold-review + PR** — delegate the diff review to `superpowers:requesting-code-review` (REUSE), assemble the §1.7-compliant PR body, then push + `gh pr create` (+ `--auto --squash` per the dispatcher convention).

### Unit 3 — `/dispatcher §2.4` wiring (one-line edit)

The dispatcher's harvest step ([dispatcher/SKILL.md §2.4](../../../.claude/skills/dispatcher/SKILL.md)) gains a call to `scripts/run-local-ci-sweep.sh` before its push — the **same script** as `/harvest`, so there is no dual-prompt drift ([dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md): one logic, two channels).

## Build-vs-reuse

- **REUSE:** `harvest.ts` + `harvest-via-api.sh` (egress, SSOT #111 dispatcher); `superpowers:requesting-code-review` + `verification-before-completion` (the *posture* "verify before claiming done" — but neither knows the project gate list, so they cannot replace Unit 1); every existing gate test (the sweep only *aggregates* them).
- **BUILD:** only `run-local-ci-sweep.sh` — an aggregator that runs *exactly this project's* CI gate set locally. Search check (6-item, negative-existence): no upstream tool runs "this repo's bespoke CI-job gate set" locally — that is by definition project-specific. New SSOT entry: REUSE-posture (superpowers verification skills) + BUILD-aggregator. Falsified if a generic "run my CI locally" tool (e.g. `act`-class GitHub-Actions local runner) is judged to cover the gate set acceptably — noted as the SSOT revisit trigger.

## Decided on merits (reported, not punted)

- **Mechanism:** skill + sweep script; blanket pre-push gate **deferred** with an explicit promotion trigger (cost + parallel-flake evidence vs the willpower-invoked skill).
- **Form:** standalone `/harvest` (the #724 incident was a standalone harvest) + shared script; `/dispatcher §2.4` calls the same script.
- **Default tier:** `--full` for the harvest gate (the task asks for *the FULL* CI-equivalent; `--core` is not CI-complete). `--core` is the dev inner-loop subset.
- **Serial execution:** trade minutes for determinism (avoids the documented shell-exec parallel-load flake).

## Promotion / deferred (YAGNI for v1)

- **Pre-push gate wrapping the same script** — promote when a harvest reddens CI **after** this skill ships (i.e. the skill was skipped or a gate was missing): that is the incident evidence the cost-caveat demands. The gate reuses Unit 1 unchanged → skill-first is not throwaway.
- **`--baseline <ref>` mode** — mechanical merge-base diff instead of prose interpretation; promote if base-red misattribution recurs.
- **Principle test "sweep script ⟷ CI gate set do not drift"** — a meta-all-wired analog for the sweep (recursive self-application). Promote if the sweep falls out of sync with `audit-self.yml`.

## Test plan

- `scripts/run-local-ci-sweep.sh` is itself shell — paired-negative coverage in `tests/` (mirrors `ci-success-gate.test.sh` precedent): (pos) all gates green → exit 0, summary all-PASS; (neg) a seeded failing gate → exit≠0, that gate reported FAIL, sweep stops; (`--core`) runs the 5-gate subset only; (`actionlint` absent) → WARN-skip, not FAIL.
- `/harvest` SKILL.md — markdown; no executable test, but the **9 egress gotchas** it codifies are each backed by a documented live incident (citations in the skill body).

## §1.7 self-reflexive note

- **Forward-check:** complies with [no-paid-llm-in-ci.md](../../../.claude/rules/no-paid-llm-in-ci.md) (all gates deterministic, zero API); [build-first-reuse-default.md §3](../../../.claude/rules/build-first-reuse-default.md) (REUSE egress + review posture; BUILD only the aggregator, with a search-check + SSOT revisit trigger); [dual-implementation-discipline.md §7](../../../.claude/rules/dual-implementation-discipline.md) (one script, two channels — skill + dispatcher); [memory-codification.md §3](../../../.claude/rules/memory-codification.md) (moves the 9 egress gotchas out of user-scope memory into a repo artefact); [doc-authority-hierarchy.md §2-§3](../../../.claude/rules/doc-authority-hierarchy.md) (this spec carries the Authoritative-for header).
- **Backward-check:** extends the existing harvest surface (`harvest.ts`, dispatcher §2.4, the false-done guard) — supersedes nothing. The blanket-gate option is preserved as an opt-in promotion, not removed. Origin incident: #724 (this session) + the 9-gotcha memory.
