# Kickoff — post-install liveness smoke: DESIGN R-phase (remaining scope of shipped-artifact-liveness-gap / #550)

> **Type:** design R-phase → verdict → spec. **NO implementation in this dispatch** — determine the design only, park genuine forks.
> **Umbrella:** `shipped-artifact-liveness-gap` (this is its **remaining scope** per [#550](https://github.com/Yhooi2/rules-as-tests-aif/issues/550) — "no new umbrella required; both follow-ups are already homed here"). Do NOT open a new umbrella.
> **Branch base:** `staging` (NOT main).
> **Related:** #550 (parent acceptance tracker, OPEN), #551 (the incident), #552 (prober shipping), R-phase #566, M1 gate #576, M2 probe #580.

## The gap (remaining scope)

R-phase #566 surveyed the problem and shipped M1 (form-gate `principles/21-shipped-agent-tools-valid.test.ts`) + M2 (dormant behavioural probe `agents/shipped-agent-liveness-prober.md`). The **#550 meta-proposal is still unbuilt**: a *post-install liveness smoke* that actually **RUNS** each shipped capability (not "is the file present") and surfaces "registers-but-silently-dead". Empirically demonstrated on the `timeliner` consumer: Stryker (#549) and the deps-hash-check hook (#548) were installed but silently broken while `validate` was green.

## Goal of THIS dispatch

Determine the **DESIGN** for the post-install liveness smoke — channels, capability inventory, fail-vs-warn, phasing — and emit it as a design doc with a reasoned verdict and **parked** strategy forks. **No premature build.**

## Operator constraints (binding steer — 2026-06-17, do NOT re-decide these)

- **CI is dispreferred as a channel.** Per [README.md#why-this-exists](../../../README.md) the project's own invariant is **"CI is the last-resort gate, not the primary one"** — earliest reachable channel wins (edit-time → pre-commit → pre-push → install-time → operator → CI last). Operator explicit: *"в ci тащить точно не стоит."* The design MUST prefer earlier / non-CI channels and justify any CI use as genuine last-resort, not default to it. This reverses the inline-brainstorm's first sketch (which had led with a CI layer) — that sketch is superseded by this steer.
- **No paid LLM in CI** ([no-paid-llm-in-ci.md](../../rules/no-paid-llm-in-ci.md)) — any dispatch/behavioural probe is session-bound, operator/consumer-run, never a GitHub Action.
- **Layered + phased** (operator chose multi-channel, built one layer at a time — smallest valuable slice first).

## Open design questions (the R-phase must resolve, parking genuine forks)

1. **Channels.** Which enforcement channel(s) for the deterministic half — consumer-side `install.sh --verify`, an operator-run `doctor` command, a pre-push/pre-commit hook? CI is dispreferred (above). State each candidate's earliest-reachable position and pick per invariant #4.
2. **Capability inventory.** Which shipped capabilities get a liveness check, and what is each one's *live signal*? Candidates: Stryker (≥1 mutant generated — #549), deps-hash-check hook (no false-warn on fresh install — #548), shipped scripts (`scripts/audit-ai-docs.sh` exit 0 + real output), skills (load/resolve), sub-agents (form = principle 21; behaviour = M2 probe), custom rules R2/R7/R8 (already exercised on timeliner).
3. **Fail vs warn** per channel — learn from #548 (a false-warn that misled). Deterministic + low-false-positive → may fail; env-variant → warn-by-default with a `--strict` opt-in.
4. **Phasing order** — which layer is the smallest valuable first slice given CI is dispreferred.
5. **`doctor`-command shape.** Prior art: `npm doctor` / `expo-doctor` / `flutter doctor` (ADOPT-VOCABULARY candidate). Own-stack: an `aif-doctor` skill already exists (scoped to the aif-handoff *runtime*, not shipped-capability liveness) — extend its vocabulary or keep separate? T16 problem-class check required.

## Build-vs-reuse anchors (consult BEFORE proposing any new infra — BFR-default + SSOT)

- `tests/install-sh/*.test.sh` harness (already installs onto a tmp consumer + has `f13-stryker-pm`, `f2-hook-activation`, `f8-agents-scripts-shipped`).
- `agents/shipped-agent-liveness-prober.md` (#580) — the behavioural half already exists (ADAPT, don't duplicate).
- `aif-doctor` skill — own-stack `doctor` vocabulary precedent.
- SSOT rows #53 (behavioural-eval), #114/#115 (guard-liveness own-stack), #121 (shipped-agent tools gate). Run DeepWiki + WebSearch ≥3 phrasings on "post-install functional acceptance / installed-tooling liveness" before any BUILD verdict ([build-first-reuse-default.md §3](../../rules/build-first-reuse-default.md)).

## Acceptance (R-phase)

- A design doc under `docs/superpowers/specs/` (or `docs/meta-factory/research-patches/`) with: channel verdict (CI-last-resort honored), capability inventory + per-capability live signal, fail-vs-warn matrix, phasing order, prior-art cited by SSOT ID, **recursive-self-application note** (how this would have caught #549/#548), and a **proposed SSOT entry** to land with the implementing commit (not here).
- Genuine strategy/scope forks **parked** (DECISION-NEEDED), not silently decided.

## §5 AI-traps active (per [.claude/rules/ai-laziness-traps.md §2](../../rules/ai-laziness-traps.md))

**Active canonical traps:** **T2** (designing the smoke ≠ running it — the R-phase must *demonstrate* each candidate live-signal against a real fixture, not assert "would detect"), **T11/T12** (BFR prior-art + literature sweep before any "I propose a new harness"), **T15** (self-application mandatory — does the proposed smoke test ITSELF / would it catch the prober's own deadness?), **T16** (pattern-matching-on-name — `doctor`/`smoke`/`aif-doctor` named similarly ≠ same problem class; verify), **T1/T14** (don't conclude "covered" from a shallow capability sample — enumerate the full shipped surface first), **T20** (no inline channel/verdict without an evidence-bearing tool call).

**Domain-specific trap:** **T-smoke-A** — proposing a check that asserts a capability is **present / configured** rather than that it **RAN and emitted a live signal**. A valid `stryker.config.json` is not "mutation testing works"; a registered hook is not "the hook fires correctly on a fresh state". Form ≠ behaviour — the exact #550/#551 failure class. Each capability's check MUST name an *observable runtime signal*, not a file/field presence.

## §4c park-don't-guess contract (aif dispatch — MANDATORY)

**Lever 1 — conservative aif config (set on the bridge/env BEFORE dispatch):**

```bash
export AGENT_MAX_REVIEW_ITERATIONS=1
export AGENT_AUTO_REVIEW_STRATEGY=closure_first
export AGENT_SKIP_REVIEW=false
```

**Lever 2 — instruction to the aif agent (verbatim, non-negotiable):**

> **aif agent — fork discipline:** On ANY genuine fork or ambiguity (two defensible channel choices, an undecided fail-vs-warn call, a capability whose live-signal is unclear) — **do NOT pick. Park it as a question** (set the task to `manualReviewRequired` / `blocked_external`, stating the fork as «Option A → consequence X / Option B → consequence Y») and **stop that task.** Proceed only on the unambiguous parts. Guessing a fork to "keep moving" is the failure this loop exists to prevent. This is a DESIGN R-phase — parking forks is the expected deliverable, not a failure.

**Egress (after `status=done`):** aif does not push or open PRs by design. Run:

```bash
npx tsx packages/runtime-bridge/src/cli/harvest.ts <taskId> --base staging
```

## §Stop conditions

- The deliverable is a design doc — if you open `Edit` on a source/test file to *implement* the smoke, STOP (this is R-phase, not I-phase).
- Any genuine channel/scope fork → park (§4c), do not guess.
- CI proposed as the *primary* channel → STOP and re-read the operator constraint above.

## See also

- [#550 parent tracker](https://github.com/Yhooi2/rules-as-tests-aif/issues/550) · R-phase patch `docs/meta-factory/research-patches/2026-06-16-shipped-artifact-liveness.md`
- [.claude/rules/ai-laziness-traps.md §2](../../rules/ai-laziness-traps.md) · [no-paid-llm-in-ci.md](../../rules/no-paid-llm-in-ci.md) · [build-first-reuse-default.md](../../rules/build-first-reuse-default.md)
- `agents/shipped-agent-liveness-prober.md` (#580, M2 — behavioural half) · `tests/install-sh/` (reuse harness)
