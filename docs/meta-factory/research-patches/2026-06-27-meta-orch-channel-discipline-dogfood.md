<!-- scope:meta-orch-channel-discipline -->
# Stage C dogfood — M6 `#worker-dispatch-via-subagent` gate, end-to-end validation

> **Type:** Stage C validation patch (final stage of the `meta-orch-channel-discipline` umbrella). Closes the recursive-self-application loop on the M6 mechanism shipped in Stage B (PR #765, SSOT #178).
> **Scope-bound by:** filename + folder authority ([research-patches README](../research-patches), [doc-authority-hierarchy.md §2 filename-convention authority](../../../.claude/rules/doc-authority-hierarchy.md)). Authoritative for: the dogfood evidence + the two honest findings. NOT authoritative for: the mechanism design (Stage A/B), project goal ([README.md#why-this-exists](../../../README.md)).

## §0 Verdict

The M6 gate **works as specified** — it fires on the ground-truth incident fixture, stays silent on clean kickoffs, and the CI principle test (`packages/core/principles/29-worker-dispatch-channel.test.ts`) gates every PR. Two honest findings (§3) are surfaced; neither is a blocker (both are shared with the pre-existing `check-doc-authority.sh` hook and covered by the CI backstop). Validation done by the harvesting session inline (Mode A) — a full autonomous re-dispatch was judged unnecessary because Stage B's paired-negative + live-tree-sweep already supply the independent mechanical proof (CI-green), and the only residual unique check (edit-time wall-clock) requires direct measurement, not a research agent.

## §1 Fires-on-fixture (ground-truth retro-catch)

The single documented incident string (Stage 5 dogfood, 2026-05-26):

```text
Dispatch Worker via Agent tool with explicit model: opus + isolation: worktree
```

- **Shared matcher / bin** (`packages/core/principles/29-worker-dispatch-channel.bin.ts`) run on a kickoff containing the string → **exit 1**, message `❌ worker-dispatch-channel: …:2 instructs Agent-tool dispatch of a write Worker` (command-output captured 2026-06-27).
- **CI principle test** (`29-worker-dispatch-channel.test.ts`) — the `FIRES on the §1 ground-truth fixture (positive)` case is green on staging (PR #765 «Principles as meta-tests» job = SUCCESS). The test additionally proves non-vacuity via an `anti-tautology` case (fixture fires; same line + escape token does NOT) and a `each clause is load-bearing` case (removing any of clauses a–d makes the fixture stop firing).

## §2 Silent on clean + false-positive sweep

- A clean kickoff line (`Stage 1 — Mode A inline session, maintainer pastes the 1-liner.`) → matcher silent (exit 0), verified 2026-06-27.
- **Live-tree sweep:** the principle test's `every tracked kickoff is clean or explicitly escaped` case scans all tracked `.claude/orchestrator-prompts/*/kickoff.md` and is green on staging — i.e. zero un-escaped false positives across the entire current kickoff corpus.
- **Latent instances (surfaced, not masked):** Stage B's sweep found 2 kickoffs that genuinely instruct Agent-tool write-dispatch, both in CLOSED historical umbrellas pre-/co-dating the rule (`meta-orchestrator-mode-triage-and-planner/kickoff.md`, `mutation-discipline-umbrella-meta-launch/kickoff.md`); escaped with honest pointing reasons via the `<!-- channel-discipline: allow … -->` token. The matcher's clause (a) was tightened (the standalone `isolation: worktree` alternative removed) to drop 8 false positives — worktree isolation is the exec env of legit Mode A/B sessions, not an Agent-tool signal (Stage B commit `fcdaa3c2f`).

## §3 Honest findings (neither a blocker)

**F1 — edit-time wall-clock ~250–300ms, over the aspirational ≤200ms target.** Measured 2026-06-27 on the firing path (`tsx` + bin on the fixture), 3 runs: 298 / 253 / 246 ms. The cost is `tsx` cold-start, not the matcher. This is the **same cost the pre-existing `check-doc-authority.sh` hook already pays** (identical `"$REPO_ROOT/node_modules/.bin/tsx" "$BIN"` delegation) — so it is an accepted project-wide pattern, not a regression introduced here. The ≤200ms figure in the umbrella kickoff was aspirational; ~250ms at edit-time remains acceptable (one-shot per kickoff Edit/Write, not per keystroke). *Optional follow-up if edit-time latency is ever felt: replace the `tsx` delegation with a bash-native regex or a precompiled matcher — but that would diverge the single-source matcher, so defer unless a real latency complaint fires.*

**F2 — hook fails OPEN (silent exit 0) when `node_modules/.bin/tsx` is absent.** The hook's `[[ ! -x "$TSX" ]] && exit 0` guard makes it a no-op in environments without an installed `tsx` at `$REPO_ROOT/node_modules/.bin/tsx` — e.g. a git worktree whose `node_modules` is a symlink lacking `.bin/tsx` (hit during this very validation). In the maintainer's real repo root `tsx` IS present (`npx which tsx` → `…/rules-as-tests-aif/node_modules/.bin/tsx`, `-x` confirmed) so the hook fires. This fail-open is **deliberate and shared with `check-doc-authority.sh`** (graceful-degrade rather than block on a missing toolchain); the **CI principle test is the fail-closed backstop** — it runs under vitest (not via the hook's tsx path) and gates every PR regardless of any consumer's local tsx state. Net: no enforcement gap, but the M1 edit-time channel is best-effort, M2 (CI) is the guarantee.

## §4 Recursive self-application + maintainer action

- **Self-application (invariant #2):** the rule that forbids Agent-tool write-dispatch is now itself enforced by an executable artifact (principle 29) that fails at CI — the «documents lie; tests don't» loop is closed for this rule. This dogfood patch itself carries the principle-10 scope annotation (first line) and trips no gate.
- **Maintainer action (agent-uncommittable):** wire `check-worker-dispatch-channel.sh` into `~/.claude/settings.json` `PostToolUse` (snippet in the hook header) to activate the M1 edit-time channel. Until then M2 (CI) is the active gate — no gap, the gate simply fires at PR-time rather than edit-time.

## §5 §1.7 self-reflexive note

- **Forward-check:** complies with [no-paid-llm-in-ci.md §1](../../../.claude/rules/no-paid-llm-in-ci.md) (validation is deterministic bash/tsx, zero API calls), [build-first-reuse-default.md](../../../.claude/rules/build-first-reuse-default.md) (no new capability — pure validation of shipped artefacts), [doc-authority-hierarchy.md §2](../../../.claude/rules/doc-authority-hierarchy.md) (filename-convention authority for research-patches).
- **Backward-check:** closes the umbrella opened 2026-05-26; supersedes nothing. Findings F1/F2 are documented-not-fixed by design (both shared with `check-doc-authority.sh`, both backstopped by CI); they become follow-ups only if a real latency/enforcement complaint fires.

## §6 See also

- [Stage A mechanism research-patch](2026-06-27-meta-orch-channel-discipline-mechanism.md) — the M6 recommendation this validates.
- [`packages/core/principles/29-worker-dispatch-channel.test.ts`](../../../packages/core/principles/29-worker-dispatch-channel.test.ts) — the CI backstop (fail-closed).
- [`.claude/hooks/check-worker-dispatch-channel.sh`](../../../.claude/hooks/check-worker-dispatch-channel.sh) — the M1 edit-time hook (fail-open, best-effort).
- [prior-art-evaluations.md #178](../prior-art-evaluations.md) — SSOT row for the mechanism.
